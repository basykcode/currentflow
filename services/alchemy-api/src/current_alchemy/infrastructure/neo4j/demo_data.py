"""Synthetic demo graph payload and its single repository-layer Cypher statement."""

from typing import Final

DEMO_PAYLOAD: Final[dict[str, object]] = {
    "source": {
        "id": "demo:source:fixture-v1",
        "display_name": "Current Alchemy synthetic interface fixture",
        "title": "Current Alchemy synthetic interface fixture",
        "rights_status": "approved",
        "review_status": "synthetic_fixture",
        "citation": "Synthetic test fixture; not clinically or historically authoritative.",
        "active": True,
        "demo": True,
    },
    "import_run": {
        "id": "demo:import-run:fixture-v1",
        "status": "complete",
        "adapter": "synthetic-fixture-v1",
        "review_status": "synthetic_fixture",
        "demo": True,
    },
    "herbs": [
        {
            "id": "demo:herb:azure-root",
            "display_name": "Azure Root (synthetic)",
            "aliases_search": "azure root yanshi gen jia 演示根甲",
            "names_json": (
                '[{"text":"Azure Root","normalized":"azure root","language":"en",'
                '"script":"Latn","kind":"preferred","sourceId":"demo:source:fixture-v1",'
                '"reviewStatus":"synthetic_fixture"}]'
            ),
            "base_material_id": "demo:herb:azure-root",
            "thermal_natures": ["warm", "cool"],
            "flavors": ["sweet"],
            "channels": ["demo:channel:river"],
            "categories": ["demo:category:foundation"],
            "actions": ["demo:action:supports-research-example"],
            "patterns": ["demo:pattern:fixture-alpha"],
            "review_status": "disputed",
            "review_statuses": ["synthetic_fixture", "disputed"],
            "source_ids": ["demo:source:fixture-v1"],
            "data_status": "conflicted",
            "completeness": 0.85,
            "unresolved_conflicts": [
                "Synthetic fixture contains conflicting thermal-nature claims."
            ],
            "missing_fields": [],
            "demo": True,
        },
        {
            "id": "demo:herb:amber-seed",
            "display_name": "Amber Seed (synthetic)",
            "aliases_search": "amber seed 演示籽乙",
            "names_json": (
                '[{"text":"Amber Seed","normalized":"amber seed","language":"en",'
                '"script":"Latn","kind":"preferred","sourceId":"demo:source:fixture-v1",'
                '"reviewStatus":"synthetic_fixture"}]'
            ),
            "base_material_id": "demo:herb:amber-seed",
            "thermal_natures": ["neutral"],
            "flavors": ["bitter"],
            "channels": ["demo:channel:field"],
            "categories": ["demo:category:foundation"],
            "actions": ["demo:action:illustrates-coverage"],
            "patterns": [],
            "review_status": "synthetic_fixture",
            "review_statuses": ["synthetic_fixture"],
            "source_ids": ["demo:source:fixture-v1"],
            "data_status": "demo",
            "completeness": 0.7,
            "unresolved_conflicts": [],
            "missing_fields": ["patterns"],
            "demo": True,
        },
        {
            "id": "demo:herb:azure-root-roasted",
            "display_name": "Roasted Azure Root (synthetic)",
            "aliases_search": "roasted azure root",
            "names_json": (
                '[{"text":"Roasted Azure Root","normalized":"roasted azure root",'
                '"language":"en","script":"Latn","kind":"preferred",'
                '"sourceId":"demo:source:fixture-v1","reviewStatus":"synthetic_fixture"}]'
            ),
            "base_material_id": "demo:herb:azure-root",
            "preparation_id": "demo:preparation:roasted",
            "thermal_natures": ["warm"],
            "flavors": ["sweet"],
            "channels": ["demo:channel:river"],
            "categories": ["demo:category:processed"],
            "actions": [],
            "patterns": [],
            "review_status": "synthetic_fixture",
            "review_statuses": ["synthetic_fixture"],
            "source_ids": ["demo:source:fixture-v1"],
            "data_status": "demo",
            "completeness": 0.5,
            "unresolved_conflicts": [],
            "missing_fields": ["patterns", "actions"],
            "demo": True,
        },
    ],
    "formula": {
        "id": "demo:formula:two-lanterns",
        "display_name": "Two Lanterns Formula (synthetic)",
        "aliases_search": "two lanterns formula",
        "names_json": (
            '[{"text":"Two Lanterns Formula","normalized":"two lanterns formula",'
            '"language":"en","script":"Latn","kind":"preferred",'
            '"sourceId":"demo:source:fixture-v1","reviewStatus":"synthetic_fixture"}]'
        ),
        "ingredient_ids": ["demo:herb:azure-root", "demo:herb:amber-seed"],
        "category": "demo:category:foundation",
        "action": "demo:action:fixture-composition",
        "review_status": "synthetic_fixture",
        "review_statuses": ["synthetic_fixture"],
        "source_ids": ["demo:source:fixture-v1"],
        "data_status": "demo",
        "completeness": 0.8,
        "demo": True,
    },
    "claims": [
        {
            "id": "demo:claim:azure-nature-warm",
            "display_name": "Synthetic warm claim",
            "predicate": "HAS_NATURE",
            "subject_id": "demo:herb:azure-root",
            "object_id": None,
            "textual_value": "warm",
            "language": "en",
            "source_locator": "fixture:claim:warm",
            "evidence_type": "synthetic_fixture",
            "review_status": "synthetic_fixture",
            "import_run_id": "demo:import-run:fixture-v1",
            "created_at": "2026-01-01T00:00:00Z",
            "demo": True,
        },
        {
            "id": "demo:claim:azure-nature-cool",
            "display_name": "Synthetic conflicting cool claim",
            "predicate": "HAS_NATURE",
            "subject_id": "demo:herb:azure-root",
            "object_id": None,
            "textual_value": "cool",
            "language": "en",
            "source_locator": "fixture:claim:cool",
            "evidence_type": "synthetic_fixture",
            "review_status": "disputed",
            "import_run_id": "demo:import-run:fixture-v1",
            "created_at": "2026-01-01T00:00:00Z",
            "demo": True,
        },
        {
            "id": "demo:claim:pair-azure-amber",
            "display_name": "Synthetic documented pair signal",
            "predicate": "INTERACTS_WITH",
            "subject_id": "demo:herb:azure-root",
            "object_id": "demo:herb:amber-seed",
            "textual_value": "Synthetic documented pair signal.",
            "language": "en",
            "source_locator": "fixture:claim:pair",
            "evidence_type": "synthetic_fixture",
            "review_status": "synthetic_fixture",
            "import_run_id": "demo:import-run:fixture-v1",
            "created_at": "2026-01-01T00:00:00Z",
            "demo": True,
        },
        {
            "id": "demo:claim:formula-composition",
            "display_name": "Synthetic formula composition claim",
            "predicate": "CONTAINS",
            "subject_id": "demo:formula:two-lanterns",
            "object_id": None,
            "textual_value": "Synthetic composition for interface and analysis testing.",
            "language": "en",
            "source_locator": "fixture:formula:composition",
            "evidence_type": "synthetic_fixture",
            "review_status": "synthetic_fixture",
            "import_run_id": "demo:import-run:fixture-v1",
            "created_at": "2026-01-01T00:00:00Z",
            "demo": True,
        },
    ],
    "document": {
        "id": "demo:document:fixture-manual",
        "source_id": "demo:source:fixture-v1",
        "display_name": "Synthetic Alchemy Fixture Manual",
        "title": "Synthetic Alchemy Fixture Manual",
        "language": "en",
        "version": "1",
        "checksum": "demo:sha256:not-a-distribution-checksum",
        "review_status": "synthetic_fixture",
        "demo": True,
    },
    "passage": {
        "id": "demo:passage:fixture-manual:1",
        "document_id": "demo:document:fixture-manual",
        "source_id": "demo:source:fixture-v1",
        "display_name": "Synthetic fixture passage 1",
        "original_text": (
            "Azure Root and Amber Seed are fictional materials used only to verify retrieval, "
            "citation, ambiguity, and missing-data behavior."
        ),
        "normalized_text": (
            "azure root and amber seed are fictional materials used only to verify retrieval "
            "citation ambiguity and missing data behavior"
        ),
        "language": "en",
        "source_locator": "fixture:passage:1",
        "checksum": "demo:sha256:passage-1",
        "review_status": "synthetic_fixture",
        "mentioned_entity_ids": [
            "demo:herb:azure-root",
            "demo:herb:amber-seed",
        ],
        "demo": True,
    },
}

SEED_DEMO_CYPHER: Final[str] = """
MERGE (source:Source {id: $source.id})
SET source += $source
MERGE (run:ImportRun {id: $import_run.id})
SET run += $import_run, run.started_at = coalesce(run.started_at, datetime())
MERGE (run)-[:IMPORTED {id: 'demo:edge:run-source', demo: true}]->(source)
WITH source, run
UNWIND $herbs AS herb
MERGE (h:HerbMaterial {id: herb.id})
SET h += herb
MERGE (run)-[:CREATED_OR_UPDATED {id: 'demo:edge:run-' + herb.id, demo: true}]->(h)
WITH source, run, collect(h) AS herbs
MERGE (formula:Formula {id: $formula.id})
SET formula += $formula
MERGE (run)-[:CREATED_OR_UPDATED {id: 'demo:edge:run-formula', demo: true}]->(formula)
WITH source, run, herbs, formula
UNWIND range(0, size($formula.ingredient_ids) - 1) AS index
MATCH (ingredient:HerbMaterial {id: $formula.ingredient_ids[index]})
MERGE (formula)-[contains:CONTAINS {id: 'demo:edge:formula-' + ingredient.id}]->(ingredient)
SET contains.sequence = index + 1, contains.source_record_id = 'demo:formula:line:' + index,
    contains.demo = true
WITH DISTINCT source, run, herbs, formula
MERGE (document:Document {id: $document.id})
SET document += $document
MERGE (passage:Passage {id: $passage.id})
SET passage += $passage
MERGE (document)-[:HAS_PASSAGE {id: 'demo:edge:document-passage', demo: true}]->(passage)
WITH source, run, herbs, formula, document, passage
UNWIND herbs AS mentioned
WITH source, run, herbs, formula, document, passage, mentioned
WHERE mentioned.id IN $passage.mentioned_entity_ids
MERGE (passage)-[:MENTIONS {id: 'demo:edge:passage-' + mentioned.id, demo: true}]->(mentioned)
WITH DISTINCT source, run, herbs, formula, document, passage
UNWIND $claims AS claim
MATCH (subject {id: claim.subject_id})
MERGE (claim_node:Claim {id: claim.id})
SET claim_node += claim, claim_node.created_at = datetime(claim.created_at)
MERGE (claim_node)-[:SUBJECT {id: 'demo:edge:' + claim.id + ':subject', demo: true}]->(subject)
MERGE (claim_node)-[:SUPPORTED_BY {id: 'demo:edge:' + claim.id + ':source', demo: true}]->(source)
MERGE (run)-[:CREATED_OR_UPDATED {id: 'demo:edge:run-' + claim.id, demo: true}]->(claim_node)
WITH source, run, herbs, formula, document, passage, claim, claim_node
OPTIONAL MATCH (object {id: claim.object_id})
FOREACH (_ IN CASE WHEN object IS NULL THEN [] ELSE [1] END |
  MERGE (claim_node)-[:OBJECT {id: 'demo:edge:' + claim.id + ':object', demo: true}]->(object))
WITH DISTINCT source, run, herbs, formula, document, passage
MATCH (azure:HerbMaterial {id: 'demo:herb:azure-root'})
MATCH (amber:HerbMaterial {id: 'demo:herb:amber-seed'})
MERGE (azure)-[pair:INTERACTS_WITH {id: 'demo:edge:azure-amber'}]->(amber)
SET pair.relationship_type = 'demo_relationship',
    pair.directionality = 'bidirectional',
    pair.context = 'Synthetic fixture only.',
    pair.uncertainty = 'Not a real compatibility claim.',
    pair.review_status = 'synthetic_fixture',
    pair.source_ids = ['demo:source:fixture-v1'],
    pair.claim_ids = ['demo:claim:pair-azure-amber'],
    pair.demo = true
RETURN 1 AS seeded
"""
