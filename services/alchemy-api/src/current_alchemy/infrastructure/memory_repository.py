"""Deterministic in-memory repository for contracts, tests, and OpenAPI generation."""

from collections import Counter
from datetime import UTC, datetime

from current_alchemy.application.ports.repository import (
    DocumentPageResult,
    PageResult,
    SourcePageResult,
    TextPageResult,
)
from current_alchemy.domain.analysis.models import HerbAnalysisProfile, IngredientPairSignal
from current_alchemy.domain.common.exploration import (
    ExploreQueryRequest,
    ExploreQueryResult,
    GraphEdge,
    GraphNode,
    RelationshipType,
)
from current_alchemy.domain.common.models import (
    Citation,
    ClaimRecord,
    DataStatus,
    EntityDetail,
    EntityType,
    NameRecord,
    ReviewStatus,
    RightsStatus,
    SourceSummary,
    entity_summary,
)
from current_alchemy.domain.common.normalization import normalize_name
from current_alchemy.domain.texts.models import (
    DocumentRecord,
    PassageRecord,
    RetrievalFact,
    TextSearchResult,
)
from current_alchemy.ingestion.models import IngestionBatch


def _demo_source() -> SourceSummary:
    return SourceSummary(
        id="demo:source:fixture-v1",
        title="Current Alchemy synthetic interface fixture",
        rights_status=RightsStatus.APPROVED,
        review_status=ReviewStatus.SYNTHETIC_FIXTURE,
        citation="Synthetic test fixture; not clinically or historically authoritative.",
    )


def _name(text: str, language: str, script: str, kind: str = "preferred") -> NameRecord:
    return NameRecord(
        text=text,
        normalized=normalize_name(text),
        language=language,
        script=script,
        kind=kind,
        source_id="demo:source:fixture-v1",
        review_status=ReviewStatus.SYNTHETIC_FIXTURE,
    )


def _claim(
    claim_id: str,
    predicate: str,
    subject_id: str,
    value: str,
    *,
    status: ReviewStatus = ReviewStatus.SYNTHETIC_FIXTURE,
) -> ClaimRecord:
    source = _demo_source()
    return ClaimRecord(
        id=claim_id,
        predicate=predicate,
        subject_id=subject_id,
        textual_value=value,
        language="en",
        source_locator=f"fixture:{claim_id}",
        evidence_type="synthetic_fixture",
        review_status=status,
        source=source,
        import_run_id="demo:import-run:fixture-v1",
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
    )


def _string_list(value: object) -> list[str]:
    return [str(item) for item in value] if isinstance(value, list) else []


def _matches_property(entity: EntityDetail, key: str, expected: str) -> bool:
    value = entity.properties.get(key)
    if isinstance(value, list):
        return expected in {str(item) for item in value}
    return expected == str(value)


class MemoryAlchemyRepository:
    """Small but representative synthetic graph; every record is visibly demo-only."""

    def __init__(self) -> None:
        self.source = _demo_source()
        self.entities = self._build_entities()
        self.documents, self.passages = self._build_texts()
        self.profiles = self._build_profiles()
        self._seeded = True

    def _build_entities(self) -> dict[str, EntityDetail]:
        claim_warm = _claim(
            "demo:claim:azure-nature-warm",
            "HAS_NATURE",
            "demo:herb:azure-root",
            "warm",
        )
        claim_cool = _claim(
            "demo:claim:azure-nature-cool",
            "HAS_NATURE",
            "demo:herb:azure-root",
            "cool",
            status=ReviewStatus.DISPUTED,
        )
        azure = EntityDetail(
            id="demo:herb:azure-root",
            entity_type=EntityType.HERB_MATERIAL,
            display_name="Azure Root (synthetic)",
            names=[
                _name("Azure Root", "en", "Latn"),
                _name("Yǎnshì Gēn Jiǎ", "zh-Latn-pinyin", "Latn"),
                _name("演示根甲", "zh-Hans", "Hans"),
            ],
            review_statuses=[
                ReviewStatus.SYNTHETIC_FIXTURE,
                ReviewStatus.DISPUTED,
            ],
            source_ids=[self.source.id],
            data_status=DataStatus.CONFLICTED,
            properties={
                "baseMaterialId": "demo:herb:azure-root",
                "thermalNatures": ["warm", "cool"],
                "flavors": ["sweet"],
                "channels": ["demo:channel:river"],
                "categories": ["demo:category:foundation"],
                "actions": ["demo:action:supports-research-example"],
                "patterns": ["demo:pattern:fixture-alpha"],
            },
            claims=[claim_warm, claim_cool],
            unresolved_conflicts=["Synthetic fixture contains conflicting thermal-nature claims."],
            completeness=0.85,
        )
        amber = EntityDetail(
            id="demo:herb:amber-seed",
            entity_type=EntityType.HERB_MATERIAL,
            display_name="Amber Seed (synthetic)",
            names=[
                _name("Amber Seed", "en", "Latn"),
                _name("演示籽乙", "zh-Hans", "Hans"),
            ],
            review_statuses=[ReviewStatus.SYNTHETIC_FIXTURE],
            source_ids=[self.source.id],
            data_status=DataStatus.DEMO,
            properties={
                "baseMaterialId": "demo:herb:amber-seed",
                "thermalNatures": ["neutral"],
                "flavors": ["bitter"],
                "channels": ["demo:channel:field"],
                "categories": ["demo:category:foundation"],
                "actions": ["demo:action:illustrates-coverage"],
                "patterns": [],
            },
            claims=[
                _claim(
                    "demo:claim:amber-nature",
                    "HAS_NATURE",
                    "demo:herb:amber-seed",
                    "neutral",
                )
            ],
            completeness=0.7,
        )
        prepared = EntityDetail(
            id="demo:herb:azure-root-roasted",
            entity_type=EntityType.HERB_MATERIAL,
            display_name="Roasted Azure Root (synthetic)",
            names=[_name("Roasted Azure Root", "en", "Latn")],
            review_statuses=[ReviewStatus.SYNTHETIC_FIXTURE],
            source_ids=[self.source.id],
            data_status=DataStatus.DEMO,
            properties={
                "baseMaterialId": "demo:herb:azure-root",
                "preparationId": "demo:preparation:roasted",
                "thermalNatures": ["warm"],
                "flavors": ["sweet"],
                "channels": ["demo:channel:river"],
                "categories": ["demo:category:processed"],
                "actions": [],
                "patterns": [],
            },
            claims=[],
            completeness=0.5,
        )
        formula = EntityDetail(
            id="demo:formula:two-lanterns",
            entity_type=EntityType.FORMULA,
            display_name="Two Lanterns Formula (synthetic)",
            names=[_name("Two Lanterns Formula", "en", "Latn")],
            review_statuses=[ReviewStatus.SYNTHETIC_FIXTURE],
            source_ids=[self.source.id],
            data_status=DataStatus.DEMO,
            properties={
                "ingredientIds": [
                    "demo:herb:azure-root",
                    "demo:herb:amber-seed",
                ],
                "category": "demo:category:foundation",
                "action": "demo:action:fixture-composition",
            },
            claims=[
                _claim(
                    "demo:claim:formula-composition",
                    "CONTAINS",
                    "demo:formula:two-lanterns",
                    "Synthetic composition for interface and analysis testing.",
                )
            ],
            completeness=0.8,
        )
        return {item.id: item for item in (azure, amber, prepared, formula)}

    def _build_texts(self) -> tuple[dict[str, DocumentRecord], dict[str, PassageRecord]]:
        citation = Citation(
            source_id=self.source.id,
            source_title=self.source.title,
            locator="fixture:passage:1",
            citation_text=self.source.citation,
            review_status=ReviewStatus.SYNTHETIC_FIXTURE,
        )
        document = DocumentRecord(
            id="demo:document:fixture-manual",
            source_id=self.source.id,
            title="Synthetic Alchemy Fixture Manual",
            language="en",
            version="1",
            checksum="demo:sha256:not-a-distribution-checksum",
            review_status=ReviewStatus.SYNTHETIC_FIXTURE,
            citation=citation,
        )
        passage = PassageRecord(
            id="demo:passage:fixture-manual:1",
            document_id=document.id,
            document_title=document.title,
            original_text=(
                "Azure Root and Amber Seed are fictional materials used only to verify retrieval, "
                "citation, ambiguity, and missing-data behavior."
            ),
            normalized_text=(
                "azure root and amber seed are fictional materials used only to verify retrieval "
                "citation ambiguity and missing data behavior"
            ),
            language="en",
            source_locator="fixture:passage:1",
            checksum="demo:sha256:passage-1",
            review_status=ReviewStatus.SYNTHETIC_FIXTURE,
            citation=citation,
            mentioned_entity_ids=[
                "demo:herb:azure-root",
                "demo:herb:amber-seed",
            ],
            mentioned_entities=[
                entity_summary(self.entities["demo:herb:azure-root"]),
                entity_summary(self.entities["demo:herb:amber-seed"]),
            ],
        )
        return {document.id: document}, {passage.id: passage}

    def _build_profiles(self) -> dict[str, HerbAnalysisProfile]:
        profiles: dict[str, HerbAnalysisProfile] = {}
        for entity in self.entities.values():
            if entity.entity_type is not EntityType.HERB_MATERIAL:
                continue
            props = entity.properties
            profiles[entity.id] = HerbAnalysisProfile(
                id=entity.id,
                base_material_id=str(props["baseMaterialId"]),
                display_name=entity.display_name,
                thermal_natures=_string_list(props.get("thermalNatures")),
                flavors=_string_list(props.get("flavors")),
                channels=_string_list(props.get("channels")),
                categories=_string_list(props.get("categories")),
                actions=_string_list(props.get("actions")),
                patterns=_string_list(props.get("patterns")),
                review_statuses=entity.review_statuses,
                source_ids=entity.source_ids,
                missing_fields=(
                    ["patterns", "actions"]
                    if entity.id == "demo:herb:azure-root-roasted"
                    else (["patterns"] if entity.id == "demo:herb:amber-seed" else [])
                ),
            )
        return profiles

    async def readiness(self) -> bool:
        return True

    async def active_source_count(self) -> int:
        return 1 if self._seeded else 0

    async def list_entities(
        self,
        entity_type: EntityType,
        query: str | None,
        filters: dict[str, str],
        offset: int,
        limit: int,
    ) -> PageResult:
        values = [item for item in self.entities.values() if item.entity_type is entity_type]
        if query:
            key = normalize_name(query)
            values = [
                item
                for item in values
                if key in normalize_name(item.display_name)
                or any(key in name.normalized for name in item.names)
            ]
        for filter_key, filter_value in filters.items():
            if filter_key == "reviewStatus":
                values = [
                    item
                    for item in values
                    if filter_value in {status.value for status in item.review_statuses}
                ]
            elif filter_key == "source":
                values = [item for item in values if filter_value in item.source_ids]
            else:
                values = [
                    item for item in values if _matches_property(item, filter_key, filter_value)
                ]
        values.sort(key=lambda item: (normalize_name(item.display_name), item.id))
        return PageResult(
            items=[entity_summary(item) for item in values[offset : offset + limit]],
            total=len(values),
        )

    async def get_entity(self, entity_type: EntityType, entity_id: str) -> EntityDetail | None:
        entity = self.entities.get(entity_id)
        return entity if entity and entity.entity_type is entity_type else None

    async def list_sources(self, offset: int, limit: int) -> SourcePageResult:
        items = [self.source] if self._seeded else []
        return SourcePageResult(items=items[offset : offset + limit], total=len(items))

    async def get_source(self, source_id: str) -> EntityDetail | None:
        if not self._seeded or source_id != self.source.id:
            return None
        return EntityDetail(
            id=self.source.id,
            entity_type=EntityType.SOURCE,
            display_name=self.source.title,
            names=[],
            review_statuses=[self.source.review_status],
            source_ids=[self.source.id],
            data_status=DataStatus.DEMO,
            properties={
                "rightsStatus": self.source.rights_status.value,
                "citation": self.source.citation,
            },
            claims=[],
            completeness=1,
        )

    async def list_documents(self, offset: int, limit: int) -> DocumentPageResult:
        values = sorted(self.documents.values(), key=lambda item: (item.title, item.id))
        return DocumentPageResult(items=values[offset : offset + limit], total=len(values))

    async def get_document(self, document_id: str) -> DocumentRecord | None:
        return self.documents.get(document_id)

    async def get_passage(self, passage_id: str) -> PassageRecord | None:
        return self.passages.get(passage_id)

    async def search_text(
        self,
        query: str,
        source_ids: list[str],
        offset: int,
        limit: int,
    ) -> TextPageResult:
        terms = [term for term in normalize_name(query).split(" ") if term]
        values: list[TextSearchResult] = []
        for passage in self.passages.values():
            if source_ids and passage.citation.source_id not in source_ids:
                continue
            matches = sorted({term for term in terms if term in passage.normalized_text})
            if not terms or matches:
                values.append(
                    TextSearchResult(
                        passage=passage,
                        score=len(matches) / len(terms) if terms else 1,
                        matched_terms=matches,
                    )
                )
        values.sort(key=lambda item: (-item.score, item.passage.id))
        return TextPageResult(items=values[offset : offset + limit], total=len(values))

    def _node(self, entity: EntityDetail) -> GraphNode:
        return GraphNode(
            id=entity.id,
            entity_type=entity.entity_type,
            display_name=entity.display_name,
            properties=entity.properties,
        )

    async def neighborhood(
        self, entity_id: str, depth: int, limit: int
    ) -> ExploreQueryResult | None:
        del depth
        entity = self.entities.get(entity_id)
        if entity is None:
            return None
        connected = [
            item
            for item in self.entities.values()
            if item.id != entity_id
            and (
                entity_id in _string_list(item.properties.get("ingredientIds"))
                or item.id in _string_list(entity.properties.get("ingredientIds"))
                or (
                    item.entity_type is EntityType.HERB_MATERIAL
                    and entity.entity_type is EntityType.HERB_MATERIAL
                )
            )
        ][: max(0, limit - 1)]
        nodes = [self._node(entity), *(self._node(item) for item in connected)]
        edges = [
            GraphEdge(
                id=f"demo:edge:{entity.id}:{item.id}",
                source_id=entity.id,
                target_id=item.id,
                relationship_type=RelationshipType.INTERACTS_WITH,
                properties={"evidenceStatus": "unknown"},
            )
            for item in connected
        ]
        return ExploreQueryResult(
            rows=[
                {
                    "id": node.id,
                    "displayName": node.display_name,
                    "entityType": node.entity_type.value,
                }
                for node in nodes
            ],
            nodes=nodes,
            edges=edges,
        )

    async def explore(self, request: ExploreQueryRequest) -> ExploreQueryResult:
        result = await self.list_entities(
            request.start_entity_type,
            request.text_query,
            request.exact_property_filters,
            0,
            request.result_limit,
        )
        nodes = [
            self._node(self.entities[item.id]) for item in result.items if item.id in self.entities
        ]
        rows = [
            {
                field: (
                    node.id
                    if field == "id"
                    else node.display_name
                    if field == "displayName"
                    else node.entity_type.value
                    if field == "entityType"
                    else node.properties.get(field)
                )
                for field in request.projection_fields
            }
            for node in nodes
        ]
        return ExploreQueryResult(rows=rows, nodes=nodes, edges=[])

    async def herb_profiles(self, herb_ids: set[str]) -> dict[str, HerbAnalysisProfile]:
        return {key: value for key, value in self.profiles.items() if key in herb_ids}

    async def pair_signals(self, herb_ids: set[str]) -> list[IngredientPairSignal]:
        signals: list[IngredientPairSignal] = []
        for left, right in __import__("itertools").combinations(sorted(herb_ids), 2):
            if {left, right} == {
                "demo:herb:azure-root",
                "demo:herb:amber-seed",
            }:
                signals.append(
                    IngredientPairSignal(
                        left_herb_material_id=left,
                        right_herb_material_id=right,
                        relationship_status="documented",
                        relationship_type="demo_relationship",
                        directionality="bidirectional",
                        context="Synthetic fixture only.",
                        uncertainty="Not a real compatibility claim.",
                        claims=[
                            _claim(
                                "demo:claim:pair-azure-amber",
                                "INTERACTS_WITH",
                                left,
                                "Synthetic documented pair signal.",
                            )
                        ],
                    )
                )
            else:
                signals.append(
                    IngredientPairSignal(
                        left_herb_material_id=left,
                        right_herb_material_id=right,
                        relationship_status="unknown",
                        uncertainty=(
                            "No documented relationship is present; this does not establish safety."
                        ),
                    )
                )
        return signals

    async def conflicts(self, herb_ids: set[str]) -> list[str]:
        return (
            ["demo:herb:azure-root has conflicting synthetic thermal-nature claims."]
            if "demo:herb:azure-root" in herb_ids
            else []
        )

    async def retrieval_facts(
        self, entity_ids: list[str], source_ids: list[str], limit: int
    ) -> list[RetrievalFact]:
        facts: list[RetrievalFact] = []
        for entity_id in entity_ids:
            entity = self.entities.get(entity_id)
            if entity is None:
                continue
            for claim in entity.claims:
                if source_ids and claim.source.id not in source_ids:
                    continue
                facts.append(
                    RetrievalFact(
                        subject_id=claim.subject_id,
                        predicate=claim.predicate,
                        object_id=claim.object_id,
                        textual_value=claim.textual_value,
                        citation=Citation(
                            source_id=claim.source.id,
                            source_title=claim.source.title,
                            locator=claim.source_locator,
                            citation_text=claim.source.citation,
                            review_status=claim.review_status,
                        ),
                    )
                )
        return facts[:limit]

    async def seed_demo(self) -> dict[str, int]:
        self._seeded = True
        return {"sources": 1, "entities": len(self.entities), "passages": len(self.passages)}

    async def reset_demo(self) -> dict[str, int]:
        was_seeded = self._seeded
        self._seeded = False
        return {"deleted": len(self.entities) + len(self.passages) + (1 if was_seeded else 0)}

    async def audit(self) -> dict[str, object]:
        counts = Counter(item.entity_type.value for item in self.entities.values())
        return {
            "sources": 1 if self._seeded else 0,
            "claims": sum(len(item.claims) for item in self.entities.values()),
            "entities": len(self.entities),
            "warnings": (
                ["Memory repository is synthetic and must not be used as authoritative data."]
            ),
            **dict(counts),
        }

    async def graph_counts(self) -> dict[str, object]:
        counts = Counter(item.entity_type.value for item in self.entities.values())
        return {
            "totalNodes": len(self.entities) + (1 if self._seeded else 0),
            "totalRelationships": 0,
            "labels": dict(sorted(counts.items())),
        }

    async def provenance(self, entity_id: str) -> dict[str, object]:
        entity = self.entities.get(entity_id)
        return {
            "entityId": entity_id,
            "found": entity is not None,
            "paths": (
                [
                    {
                        "sourceId": self.source.id,
                        "sourceTitle": self.source.title,
                        "license": "Project test fixture",
                        "importRunId": "demo:import-run:fixture-v1",
                    }
                ]
                if entity is not None
                else []
            ),
        }

    async def rebuild_projections(self) -> dict[str, object]:
        audit = await self.audit()
        return {
            "projectionVersion": "accepted-claims-v1",
            "canonicalEntities": len(self.entities),
            "audit": audit,
            "synthetic": True,
        }

    async def ingest_batch(self, batch: IngestionBatch, batch_size: int) -> dict[str, int]:
        del batch_size
        return {
            "nodes": len({node.id for node in batch.nodes}),
            "relationships": len({relationship.id for relationship in batch.relationships}),
        }
