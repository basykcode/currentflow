"""Offline adapter for previously cached and checksum-verified PubChem responses."""

import json
from pathlib import Path

from current_alchemy.domain.common.models import EntityType
from current_alchemy.ingestion.manifests.models import SourceManifest
from current_alchemy.ingestion.models import IngestionBatch, NodeUpsert


class PubChemAdapter:
    name = "pubchem"
    version = "1"

    def parse(
        self, manifest: SourceManifest, input_directory: Path, *, batch_size: int
    ) -> IngestionBatch:
        del batch_size
        nodes: list[NodeUpsert] = [
            NodeUpsert(
                entity_type=EntityType.SOURCE,
                id=manifest.source_id,
                properties={
                    "display_name": manifest.title,
                    "title": manifest.title,
                    "rights_status": manifest.rights_status.value,
                    "review_status": "machine_imported",
                    "citation": manifest.citation_template,
                    "active": True,
                },
            )
        ]
        for expected in manifest.expected_files:
            payload = json.loads((input_directory / expected.path).read_text(encoding="utf-8"))
            properties = payload.get("PropertyTable", {}).get("Properties", [])
            if not isinstance(properties, list):
                raise ValueError(f"Malformed PubChem response: {expected.path}")
            for item in properties:
                if not isinstance(item, dict) or "CID" not in item:
                    raise ValueError(f"Malformed PubChem compound row: {expected.path}")
                cid = int(item["CID"])
                nodes.append(
                    NodeUpsert(
                        entity_type=EntityType.COMPOUND,
                        id=f"compound:pubchem:{cid}",
                        properties={
                            "display_name": str(item.get("Title", f"PubChem CID {cid}")),
                            "pubchem_cid": cid,
                            "molecular_formula": str(item.get("MolecularFormula", "")),
                            "inchi": str(item.get("InChI", "")),
                            "inchikey": str(item.get("InChIKey", "")),
                            "canonical_smiles": str(
                                item.get("ConnectivitySMILES") or item.get("CanonicalSMILES", "")
                            ),
                            "source_url": f"https://pubchem.ncbi.nlm.nih.gov/compound/{cid}",
                            "source_ids": [manifest.source_id],
                            "review_status": "machine_imported",
                            "review_statuses": ["machine_imported"],
                            "data_status": "source_reported",
                            "raw_json": json.dumps(item, ensure_ascii=False, sort_keys=True),
                        },
                    )
                )
        return IngestionBatch(
            nodes=nodes,
            raw_records_preserved=max(0, len(nodes) - 1),
        )
