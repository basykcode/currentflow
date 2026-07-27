"""Neo4j implementation of the application repository port."""

import json
from datetime import datetime
from itertools import combinations
from typing import Any, Final, cast

from neo4j import AsyncDriver
from neo4j.time import DateTime as Neo4jDateTime

from current_alchemy.application.ports.repository import (
    DocumentPageResult,
    PageResult,
    SourcePageResult,
    TextPageResult,
)
from current_alchemy.domain.analysis.models import HerbAnalysisProfile, IngredientPairSignal
from current_alchemy.domain.common.exploration import (
    Direction,
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
    EntitySummary,
    EntityType,
    NameRecord,
    ReviewStatus,
    RightsStatus,
    SourceSummary,
    entity_summary,
)
from current_alchemy.domain.texts.models import (
    DocumentRecord,
    PassageRecord,
    RetrievalFact,
    TextSearchResult,
)
from current_alchemy.infrastructure.neo4j.demo_data import DEMO_PAYLOAD, SEED_DEMO_CYPHER
from current_alchemy.ingestion.models import IngestionBatch, NodeUpsert, RelationshipUpsert

_LABELS: Final[dict[EntityType, str]] = {
    entity_type: entity_type.value
    for entity_type in EntityType
    if entity_type
    not in {
        EntityType.CLAIM,
        EntityType.IMPORT_RUN,
        EntityType.SOURCE,
        EntityType.DOCUMENT,
        EntityType.PASSAGE,
    }
}
_FULLTEXT_INDEX: Final[dict[EntityType, str]] = {
    EntityType.HERB_MATERIAL: "herb_names",
    EntityType.FORMULA: "formula_names",
}
_FILTER_PROPERTIES: Final[dict[str, str]] = {
    "id": "id",
    "language": "language",
    "nameLanguage": "name_languages",
    "thermalNatures": "thermal_natures",
    "flavors": "flavors",
    "channels": "channels",
    "categories": "categories",
    "actions": "actions",
    "botanicalTaxon": "botanical_taxon",
    "reviewStatus": "review_statuses",
    "source": "source_ids",
    "sourceId": "source_id",
    "rightsStatus": "rights_status",
    "ingredientIds": "ingredient_ids",
    "category": "category",
    "action": "action",
    "pattern": "pattern",
}

_AUDIT_QUERIES: Final[tuple[tuple[str, bool, str], ...]] = (
    (
        "canonical_nodes_without_stable_ids",
        True,
        """
        MATCH (node)
        WHERE NOT node:AlchemyMigration AND (node.id IS NULL OR node.id = '')
        RETURN count(node) AS count
        """,
    ),
    (
        "canonical_entities_without_provenance",
        True,
        """
        MATCH (node:CanonicalEntity)
        WHERE NOT (node)-[:SUPPORTED_BY]->(:SourceRecord)
        RETURN count(node) AS count
        """,
    ),
    (
        "claims_without_source_records",
        True,
        """
        MATCH (node:Claim)
        WHERE NOT (node)-[:SUPPORTED_BY]->(:SourceRecord)
          AND NOT node.demo = true
        RETURN count(node) AS count
        """,
    ),
    (
        "observations_without_source_records",
        True,
        """
        MATCH (node)
        WHERE (node:CompoundOccurrence OR node:BioactivityObservation
               OR node:ToxicityObservation OR node:ExposureObservation
               OR node:ClinicalEvidenceRecord)
          AND NOT (node)-[:SUPPORTED_BY]->(:SourceRecord)
        RETURN count(node) AS count
        """,
    ),
    (
        "source_records_without_release",
        True,
        """
        MATCH (node:SourceRecord)
        WHERE NOT (:SourceRelease)-[:CONTAINS_RECORD]->(node)
        RETURN count(node) AS count
        """,
    ),
    (
        "releases_without_license_decision",
        True,
        """
        MATCH (node:SourceRelease)
        WHERE NOT (node)-[:USES_LICENSE]->(:License)
        RETURN count(node) AS count
        """,
    ),
    (
        "production_records_with_incompatible_rights",
        True,
        """
        MATCH (release:SourceRelease)-[:CONTAINS_RECORD]->(record:SourceRecord)
        MATCH (release)-[:USES_LICENSE]->(license:License)
        WHERE record.production_eligible = true
          AND (license.commercial_use <> 'allowed'
               OR license.redistribution <> 'allowed'
               OR license.derivative_database <> 'allowed')
        RETURN count(record) AS count
        """,
    ),
    (
        "duplicate_external_identifiers",
        True,
        """
        MATCH (identifier:ExternalIdentifier)
        WITH identifier.scheme AS scheme, identifier.value AS value, count(*) AS occurrences
        WHERE occurrences > 1
        RETURN count(*) AS count
        """,
    ),
    (
        "conflicting_accepted_mappings",
        True,
        """
        MATCH (mapping:MappingAssertion {status: 'accepted'})
              -[:MAPPING_SUBJECT]->(record:SourceRecord)
        MATCH (mapping)-[:MAPPING_TARGET]->(target:CanonicalEntity)
        WITH record, count(DISTINCT target) AS target_count
        WHERE target_count > 1
        RETURN count(*) AS count
        """,
    ),
    (
        "mapping_self_cycles",
        True,
        """
        MATCH (mapping:MappingAssertion)-[:MAPPING_SUBJECT]->(subject)
        MATCH (mapping)-[:MAPPING_TARGET]->(target)
        WHERE subject.id = target.id
        RETURN count(mapping) AS count
        """,
    ),
    (
        "orphan_ingredient_uses",
        True,
        """
        MATCH (ingredient:IngredientUse)
        WHERE NOT (:FormulaWitness)-[:HAS_INGREDIENT_USE]->(ingredient)
           OR NOT (ingredient)-[:USES_MATERIAL|USES_PREPARED_MATERIAL]->()
        RETURN count(ingredient) AS count
        """,
    ),
    (
        "formula_witnesses_without_source",
        True,
        """
        MATCH (witness:FormulaWitness)
        WHERE NOT (witness)-[:EXTRACTED_FROM]->(:Passage)
          AND NOT (witness)-[:SUPPORTED_BY]->(:SourceRecord)
        RETURN count(witness) AS count
        """,
    ),
    (
        "measurements_without_unit_context",
        True,
        """
        MATCH (node)
        WHERE (node:CompoundOccurrence OR node:BioactivityObservation
               OR node:ToxicityObservation OR node:ExposureObservation)
          AND node.value IS NOT NULL AND node.unit IS NULL
        RETURN count(node) AS count
        """,
    ),
    (
        "predictions_represented_as_observations",
        True,
        """
        MATCH (node:Prediction)
        WHERE node:CompoundOccurrence OR node:BioactivityObservation
           OR node:ToxicityObservation OR node:ExposureObservation
        RETURN count(node) AS count
        """,
    ),
    (
        "unsourced_convenience_properties",
        True,
        """
        MATCH (node:CanonicalEntity)
        WHERE node.projection_version IS NOT NULL
          AND NOT (node)-[:SUPPORTED_BY]->(:SourceRecord)
        RETURN count(node) AS count
        """,
    ),
    (
        "failed_checksums",
        True,
        """
        MATCH (release:SourceRelease)
        WHERE release.checksum_verified <> true
        RETURN count(release) AS count
        """,
    ),
    (
        "unexpected_source_schema_drift",
        True,
        """
        MATCH (release:SourceRelease)
        WHERE release.schema_drift = true
        RETURN count(release) AS count
        """,
    ),
    (
        "unresolved_import_rejects",
        True,
        """
        MATCH (release:SourceRelease)
        WHERE coalesce(release.unresolved_rejects, 0) > 0
        RETURN count(release) AS count
        """,
    ),
    (
        "source_count_drift_between_stages",
        True,
        """
        MATCH (release:SourceRelease)
        WHERE release.stage_count IS NOT NULL
          AND release.stage_count <> coalesce(release.normalized_count, 0)
                                   + coalesce(release.rejected_count, 0)
        RETURN count(release) AS count
        """,
    ),
    (
        "non_idempotent_release_imports",
        True,
        """
        MATCH (run:ImportRun)
        WITH run.source_id AS source_id, run.release_id AS release_id,
             run.adapter_version AS adapter_version, count(*) AS occurrences
        WHERE source_id IS NOT NULL AND release_id IS NOT NULL
          AND adapter_version IS NOT NULL AND occurrences > 1
        RETURN count(*) AS count
        """,
    ),
)


def _escaped_fulltext(value: str) -> str:
    """Escape Lucene operators so user input remains plain text."""

    special = r'+-&|!(){}[]^"~*?:\/'
    escaped = "".join(f"\\{char}" if char in special else char for char in value)
    return " ".join(part for part in escaped.split() if part)


def _source_from_mapping(value: dict[str, object]) -> SourceSummary:
    return SourceSummary(
        id=str(value["id"]),
        title=str(value["title"]),
        rights_status=RightsStatus(str(value["rights_status"])),
        review_status=ReviewStatus(str(value["review_status"])),
        citation=str(value["citation"]),
    )


def _names_from_json(value: object) -> list[NameRecord]:
    if not isinstance(value, str) or not value:
        return []
    decoded = json.loads(value)
    if not isinstance(decoded, list):
        return []
    return [NameRecord.model_validate(item) for item in decoded]


def _str_list(value: object) -> list[str]:
    return [str(item) for item in value] if isinstance(value, list) else []


def _native_datetime(value: object) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, Neo4jDateTime):
        return value.to_native()
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    raise ValueError("Neo4j claim created_at is not a supported datetime")


def _public_properties(
    value: dict[str, object],
) -> dict[str, str | int | float | bool | None | list[str]]:
    reserved = {
        "id",
        "display_name",
        "names_json",
        "review_statuses",
        "source_ids",
        "data_status",
        "ambiguity",
        "unresolved_conflicts",
        "completeness",
        "demo",
    }
    return {
        key: item
        for key, item in value.items()
        if key not in reserved
        and (
            item is None
            or isinstance(item, str | int | float | bool)
            or (isinstance(item, list) and all(isinstance(part, str) for part in item))
        )
    }


def _summary(value: dict[str, object], entity_type: EntityType) -> EntitySummary:
    return EntitySummary(
        id=str(value["id"]),
        entity_type=entity_type,
        display_name=str(value.get("display_name", value["id"])),
        names=_names_from_json(value.get("names_json")),
        review_statuses=[ReviewStatus(item) for item in _str_list(value.get("review_statuses"))],
        source_ids=_str_list(value.get("source_ids")),
        data_status=DataStatus(str(value.get("data_status", "incomplete"))),
        ambiguity=_str_list(value.get("ambiguity")),
        properties=_public_properties(value),
    )


def _source_citation(
    source: SourceSummary, locator: str | None, review_status: ReviewStatus
) -> Citation:
    return Citation(
        source_id=source.id,
        source_title=source.title,
        locator=locator,
        citation_text=source.citation,
        review_status=review_status,
    )


class Neo4jAlchemyRepository:
    """All runtime Cypher is centralized here and uses allowlisted schema identifiers."""

    def __init__(self, driver: AsyncDriver, database: str) -> None:
        self._driver = driver
        self._database = database

    async def readiness(self) -> bool:
        try:
            await self._driver.verify_connectivity()
            return True
        except Exception:
            return False

    async def active_source_count(self) -> int:
        async with self._driver.session(database=self._database) as session:
            record = await (
                await session.run("MATCH (s:Source) WHERE s.active = true RETURN count(s) AS count")
            ).single()
        return int(record["count"]) if record else 0

    async def list_entities(
        self,
        entity_type: EntityType,
        query: str | None,
        filters: dict[str, str],
        offset: int,
        limit: int,
    ) -> PageResult:
        label = _LABELS[entity_type]
        # The Neo4j driver types parameter dictionaries with Any. This boundary contains only
        # validated API filters and is converted back into typed domain models immediately.
        params: dict[str, Any] = {"offset": offset, "limit": limit}
        where: list[str] = []
        for index, (key, value) in enumerate(sorted(filters.items())):
            property_name = _FILTER_PROPERTIES[key]
            param_name = f"filter_{index}"
            params[param_name] = value
            where.append(
                f"(${param_name} = n.{property_name} OR ${param_name} IN "
                f"coalesce(n.{property_name}, []))"
            )
        where_clause = f"WHERE {' AND '.join(where)}" if where else ""
        if query and entity_type in _FULLTEXT_INDEX:
            params["query"] = _escaped_fulltext(query)
            match_clause = (
                f"CALL db.index.fulltext.queryNodes('{_FULLTEXT_INDEX[entity_type]}', $query) "
                "YIELD node AS n, score"
            )
            where.insert(0, f"n:{label}")
            where_clause = f"WHERE {' AND '.join(where)}"
            order_clause = "WITH n, score ORDER BY score DESC, toLower(n.display_name), n.id"
        else:
            match_clause = f"MATCH (n:{label})"
            order_clause = "WITH n ORDER BY toLower(n.display_name), n.id"
            if query:
                params["query_lower"] = query.casefold()
                where.insert(
                    0,
                    "(toLower(n.display_name) CONTAINS $query_lower "
                    "OR toLower(n.aliases_search) CONTAINS $query_lower)",
                )
                where_clause = f"WHERE {' AND '.join(where)}"
        cypher = f"""
        {match_clause}
        {where_clause}
        {order_clause}
        WITH collect(n) AS nodes
        RETURN size(nodes) AS total,
               [n IN nodes[$offset..$offset + $limit] | properties(n)] AS items
        """
        async with self._driver.session(database=self._database) as session:
            record = await (await session.run(cypher, parameters=params)).single()
        if record is None:
            return PageResult(items=[], total=0)
        raw_items = record["items"]
        items = [_summary(dict(item), entity_type) for item in raw_items if isinstance(item, dict)]
        return PageResult(items=items, total=int(record["total"]))

    async def _claims(self, entity_id: str) -> list[ClaimRecord]:
        async with self._driver.session(database=self._database) as session:
            result = await session.run(
                """
                MATCH (claim:Claim)-[:SUBJECT]->(subject {id: $entity_id})
                OPTIONAL MATCH (claim)-[:OBJECT]->(object)
                OPTIONAL MATCH (claim)-[:SUPPORTED_BY]->(direct_source:Source)
                OPTIONAL MATCH (claim)-[:SUPPORTED_BY]->(record:SourceRecord)
                OPTIONAL MATCH (release:SourceRelease)-[:CONTAINS_RECORD]->(record)
                OPTIONAL MATCH (release_source:Source)-[:HAS_RELEASE]->(release)
                WITH claim, object, coalesce(direct_source, release_source) AS source
                WHERE source IS NOT NULL
                RETURN properties(claim) AS claim, object.id AS object_id,
                       properties(source) AS source
                ORDER BY claim.id
                """,
                entity_id=entity_id,
            )
            records = await result.data()
        claims: list[ClaimRecord] = []
        for row in records:
            claim = dict(row["claim"])
            source = _source_from_mapping(dict(row["source"]))
            claims.append(
                ClaimRecord(
                    id=str(claim["id"]),
                    predicate=str(claim["predicate"]),
                    subject_id=entity_id,
                    object_id=str(row["object_id"]) if row["object_id"] else None,
                    textual_value=(
                        str(claim["textual_value"]) if claim.get("textual_value") else None
                    ),
                    original_quotation=(
                        str(claim["original_quotation"])
                        if claim.get("original_quotation")
                        else None
                    ),
                    normalized_interpretation=(
                        str(claim["normalized_interpretation"])
                        if claim.get("normalized_interpretation")
                        else None
                    ),
                    language=str(claim.get("language", "und")),
                    source_locator=(
                        str(claim["source_locator"]) if claim.get("source_locator") else None
                    ),
                    evidence_type=str(claim.get("evidence_type", "source_reported")),
                    review_status=ReviewStatus(str(claim["review_status"])),
                    confidence=(float(claim["confidence"]) if claim.get("confidence") else None),
                    source=source,
                    import_run_id=str(claim["import_run_id"]),
                    created_at=_native_datetime(claim["created_at"]),
                )
            )
        return claims

    async def get_entity(self, entity_type: EntityType, entity_id: str) -> EntityDetail | None:
        label = _LABELS[entity_type]
        async with self._driver.session(database=self._database) as session:
            record = await (
                await session.run(
                    f"MATCH (n:{label} {{id: $id}}) RETURN properties(n) AS entity",
                    id=entity_id,
                )
            ).single()
        if record is None:
            return None
        value = dict(record["entity"])
        summary = _summary(value, entity_type)
        return EntityDetail(
            **summary.model_dump(),
            claims=await self._claims(entity_id),
            unresolved_conflicts=_str_list(value.get("unresolved_conflicts")),
            completeness=float(value.get("completeness", 0)),
        )

    async def list_sources(self, offset: int, limit: int) -> SourcePageResult:
        async with self._driver.session(database=self._database) as session:
            result = await session.run(
                """
                MATCH (source:Source)
                WITH source ORDER BY toLower(source.title), source.id
                WITH collect(source) AS sources
                RETURN size(sources) AS total,
                       [source IN sources[$offset..$offset + $limit] |
                         properties(source)] AS items
                """,
                offset=offset,
                limit=limit,
            )
            record = await result.single()
        if record is None:
            return SourcePageResult(items=[], total=0)
        items = [_source_from_mapping(dict(item)) for item in record["items"]]
        return SourcePageResult(items=items, total=int(record["total"]))

    async def get_source(self, source_id: str) -> EntityDetail | None:
        async with self._driver.session(database=self._database) as session:
            record = await (
                await session.run(
                    "MATCH (source:Source {id: $id}) RETURN properties(source) AS source",
                    id=source_id,
                )
            ).single()
        if record is None:
            return None
        value = dict(record["source"])
        review = ReviewStatus(str(value["review_status"]))
        return EntityDetail(
            id=source_id,
            entity_type=EntityType.SOURCE,
            display_name=str(value["title"]),
            review_statuses=[review],
            source_ids=[source_id],
            data_status=(
                DataStatus.DEMO if bool(value.get("demo")) else DataStatus.SOURCE_REPORTED
            ),
            properties={
                "rightsStatus": str(value["rights_status"]),
                "citation": str(value["citation"]),
            },
            completeness=1,
        )

    async def _source(self, source_id: str) -> SourceSummary:
        page = await self.list_sources(0, 100)
        for source in page.items:
            if source.id == source_id:
                return source
        raise RuntimeError(f"Source '{source_id}' referenced by graph data does not exist")

    async def list_documents(self, offset: int, limit: int) -> DocumentPageResult:
        async with self._driver.session(database=self._database) as session:
            result = await session.run(
                """
                MATCH (document:Document)
                WITH document ORDER BY toLower(document.title), document.id
                WITH collect(document) AS documents
                RETURN size(documents) AS total,
                       [document IN documents[$offset..$offset + $limit] |
                         properties(document)] AS items
                """,
                offset=offset,
                limit=limit,
            )
            record = await result.single()
        if record is None:
            return DocumentPageResult(items=[], total=0)
        items: list[DocumentRecord] = []
        for raw in record["items"]:
            value = dict(raw)
            source = await self._source(str(value["source_id"]))
            review = ReviewStatus(str(value["review_status"]))
            items.append(
                DocumentRecord(
                    id=str(value["id"]),
                    source_id=source.id,
                    title=str(value["title"]),
                    language=str(value["language"]),
                    version=str(value["version"]),
                    checksum=str(value["checksum"]),
                    review_status=review,
                    citation=_source_citation(source, None, review),
                )
            )
        return DocumentPageResult(items=items, total=int(record["total"]))

    async def get_document(self, document_id: str) -> DocumentRecord | None:
        page = await self.list_documents(0, 100)
        return next((item for item in page.items if item.id == document_id), None)

    async def get_passage(self, passage_id: str) -> PassageRecord | None:
        async with self._driver.session(database=self._database) as session:
            record = await (
                await session.run(
                    "MATCH (passage:Passage {id: $id}) RETURN properties(passage) AS passage",
                    id=passage_id,
                )
            ).single()
        if record is None:
            return None
        value = dict(record["passage"])
        source = await self._source(str(value["source_id"]))
        review = ReviewStatus(str(value["review_status"]))
        document = await self.get_document(str(value["document_id"]))
        mentioned_entities: list[EntitySummary] = []
        for mentioned_id in _str_list(value.get("mentioned_entity_ids")):
            for entity_type in (EntityType.HERB_MATERIAL, EntityType.FORMULA):
                entity = await self.get_entity(entity_type, mentioned_id)
                if entity is not None:
                    mentioned_entities.append(entity_summary(entity))
                    break
        return PassageRecord(
            id=passage_id,
            document_id=str(value["document_id"]),
            document_title=document.title if document else str(value["document_id"]),
            original_text=str(value["original_text"]),
            normalized_text=str(value["normalized_text"]),
            language=str(value["language"]),
            source_locator=str(value["source_locator"]),
            checksum=str(value["checksum"]),
            review_status=review,
            citation=_source_citation(source, str(value["source_locator"]), review),
            mentioned_entity_ids=_str_list(value.get("mentioned_entity_ids")),
            mentioned_entities=mentioned_entities,
        )

    async def search_text(
        self,
        query: str,
        source_ids: list[str],
        offset: int,
        limit: int,
    ) -> TextPageResult:
        if not query.strip():
            cypher = """
                MATCH (node:Passage)
                WHERE size($source_ids) = 0 OR node.source_id IN $source_ids
                WITH node ORDER BY node.id
                WITH collect({id: node.id, score: 1.0}) AS matches
                RETURN size(matches) AS total, matches[$offset..$offset + $limit] AS items
            """
        else:
            cypher = """
                CALL db.index.fulltext.queryNodes('document_passage_text', $query)
                YIELD node, score
                WHERE node:Passage AND (size($source_ids) = 0 OR node.source_id IN $source_ids)
                WITH node, score ORDER BY score DESC, node.id
                WITH collect({id: node.id, score: score}) AS matches
                RETURN size(matches) AS total, matches[$offset..$offset + $limit] AS items
            """
        async with self._driver.session(database=self._database) as session:
            result = await session.run(
                cypher,
                parameters={
                    "query": _escaped_fulltext(query),
                    "source_ids": source_ids,
                    "offset": offset,
                    "limit": limit,
                },
            )
            record = await result.single()
        if record is None:
            return TextPageResult(items=[], total=0)
        items: list[TextSearchResult] = []
        terms = query.casefold().split()
        for raw in record["items"]:
            value = dict(raw)
            passage = await self.get_passage(str(value["id"]))
            if passage:
                items.append(
                    TextSearchResult(
                        passage=passage,
                        score=float(value["score"]),
                        matched_terms=sorted(
                            {term for term in terms if term in passage.normalized_text}
                        ),
                    )
                )
        return TextPageResult(items=items, total=int(record["total"]))

    async def neighborhood(
        self, entity_id: str, depth: int, limit: int
    ) -> ExploreQueryResult | None:
        depth_pattern = "*1..1" if depth == 1 else "*1..2"
        async with self._driver.session(database=self._database) as session:
            result = await session.run(
                f"""
                MATCH (start {{id: $id}})
                OPTIONAL MATCH path=(start)-[{depth_pattern}]-(neighbor)
                WITH start, collect(path)[..$limit] AS paths
                RETURN start {{.*, entity_type: head(labels(start))}} AS start,
                       [path IN paths | [node IN nodes(path) |
                         node {{.*, entity_type: head(labels(node))}}]] AS path_nodes,
                       [path IN paths | [rel IN relationships(path) |
                         {{id: rel.id, type: type(rel), properties: properties(rel),
                           source_id: startNode(rel).id,
                           target_id: endNode(rel).id}}]] AS path_edges
                """,
                id=entity_id,
                limit=limit,
            )
            record = await result.single()
        if record is None:
            return None
        return self._graph_from_paths(
            dict(record["start"]), record["path_nodes"], record["path_edges"]
        )

    def _graph_from_paths(
        self,
        start: dict[str, object],
        path_nodes: object,
        path_edges: object,
    ) -> ExploreQueryResult:
        node_values: dict[str, dict[str, object]] = {str(start["id"]): start}
        if isinstance(path_nodes, list):
            for path in path_nodes:
                if isinstance(path, list):
                    for raw in path:
                        if isinstance(raw, dict) and raw.get("id"):
                            node_values[str(raw["id"])] = raw
        nodes: list[GraphNode] = []
        for value in node_values.values():
            labels = _str_list(value.get("labels"))
            type_value = str(value.get("entity_type", labels[0] if labels else "HerbMaterial"))
            try:
                entity_type = EntityType(type_value)
            except ValueError:
                entity_type = EntityType.HERB_MATERIAL
            nodes.append(
                GraphNode(
                    id=str(value["id"]),
                    entity_type=entity_type,
                    display_name=str(value.get("display_name", value["id"])),
                    properties={
                        key: item
                        for key, item in value.items()
                        if key != "id"
                        and (
                            item is None
                            or isinstance(item, str | int | float | bool)
                            or (
                                isinstance(item, list)
                                and all(isinstance(part, str) for part in item)
                            )
                        )
                    },
                )
            )
        edge_values: dict[str, GraphEdge] = {}
        if isinstance(path_edges, list):
            for path in path_edges:
                if isinstance(path, list):
                    for raw in path:
                        if not isinstance(raw, dict):
                            continue
                        rel_type = str(raw["type"])
                        try:
                            relationship_type = RelationshipType(rel_type)
                        except ValueError:
                            continue
                        properties = dict(raw["properties"])
                        edge_id = str(
                            raw.get("id")
                            or f"edge:{raw['source_id']}:{rel_type}:{raw['target_id']}"
                        )
                        edge_values[edge_id] = GraphEdge(
                            id=edge_id,
                            source_id=str(raw["source_id"]),
                            target_id=str(raw["target_id"]),
                            relationship_type=relationship_type,
                            properties={
                                key: item
                                for key, item in properties.items()
                                if item is None or isinstance(item, str | int | float | bool)
                            },
                        )
        nodes.sort(key=lambda node: node.id)
        edges = sorted(edge_values.values(), key=lambda edge: edge.id)
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
        direction = {
            Direction.OUTGOING: "->",
            Direction.INCOMING: "<-",
            Direction.BOTH: "-",
        }[request.direction]
        left = "-" if request.direction is not Direction.INCOMING else "<-"
        right = "->" if request.direction is Direction.OUTGOING else "-"
        depth = "1" if request.maximum_depth == 1 else "1..2"
        label = request.start_entity_type.value
        query_filter = (
            "AND (toLower(start.display_name) CONTAINS toLower($text_query) "
            "OR toLower(start.aliases_search) CONTAINS toLower($text_query))"
            if request.text_query
            else ""
        )
        property_filters = [
            f"AND (start.{_FILTER_PROPERTIES.get(key, key)} = $filter_{index} OR "
            f"$filter_{index} IN coalesce(start.{_FILTER_PROPERTIES.get(key, key)}, []))"
            for index, key in enumerate(sorted(request.exact_property_filters))
        ]
        params: dict[str, Any] = {
            "text_query": request.text_query,
            "relationship_types": [item.value for item in request.relationship_types],
            "limit": request.result_limit,
        }
        for index, key in enumerate(sorted(request.exact_property_filters)):
            params[f"filter_{index}"] = request.exact_property_filters[key]
        del direction
        cypher = f"""
        MATCH (start:{label})
        WHERE true {query_filter} {" ".join(property_filters)}
        OPTIONAL MATCH path=(start){left}[rels*{depth}]{right}(neighbor)
        WHERE path IS NULL OR all(rel IN rels WHERE type(rel) IN $relationship_types)
        WITH start, path ORDER BY toLower(start.display_name), start.id
        LIMIT $limit
        RETURN start {{.*, entity_type: head(labels(start))}} AS start,
               CASE WHEN path IS NULL THEN [] ELSE
                 [node IN nodes(path) |
                   node {{.*, entity_type: head(labels(node))}}] END AS path_nodes,
               CASE WHEN path IS NULL THEN [] ELSE
                 [rel IN relationships(path) |
                   {{id: rel.id, type: type(rel), properties: properties(rel),
                     source_id: startNode(rel).id, target_id: endNode(rel).id}}] END AS path_edges
        """
        async with self._driver.session(database=self._database) as session:
            records = await (await session.run(cypher, parameters=params)).data()
        all_nodes: dict[str, GraphNode] = {}
        all_edges: dict[str, GraphEdge] = {}
        for record in records:
            result = self._graph_from_paths(
                dict(record["start"]), [record["path_nodes"]], [record["path_edges"]]
            )
            all_nodes.update({node.id: node for node in result.nodes})
            all_edges.update({edge.id: edge for edge in result.edges})
        nodes = sorted(all_nodes.values(), key=lambda node: node.id)
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
            for node in nodes[: request.result_limit]
        ]
        return ExploreQueryResult(
            rows=rows,
            nodes=nodes[: request.result_limit],
            edges=sorted(all_edges.values(), key=lambda edge: edge.id),
        )

    async def herb_profiles(self, herb_ids: set[str]) -> dict[str, HerbAnalysisProfile]:
        async with self._driver.session(database=self._database) as session:
            result = await session.run(
                "MATCH (herb:HerbMaterial) WHERE herb.id IN $ids RETURN properties(herb) AS herb",
                ids=sorted(herb_ids),
            )
            records = await result.data()
        profiles: dict[str, HerbAnalysisProfile] = {}
        for row in records:
            value = dict(row["herb"])
            herb_id = str(value["id"])
            profiles[herb_id] = HerbAnalysisProfile(
                id=herb_id,
                base_material_id=str(value.get("base_material_id", herb_id)),
                display_name=str(value.get("display_name", herb_id)),
                thermal_natures=_str_list(value.get("thermal_natures")),
                flavors=_str_list(value.get("flavors")),
                channels=_str_list(value.get("channels")),
                categories=_str_list(value.get("categories")),
                actions=_str_list(value.get("actions")),
                patterns=_str_list(value.get("patterns")),
                review_statuses=[
                    ReviewStatus(item) for item in _str_list(value.get("review_statuses"))
                ],
                source_ids=_str_list(value.get("source_ids")),
                missing_fields=_str_list(value.get("missing_fields")),
            )
        return profiles

    async def pair_signals(self, herb_ids: set[str]) -> list[IngredientPairSignal]:
        ids = sorted(herb_ids)
        async with self._driver.session(database=self._database) as session:
            records = await (
                await session.run(
                    """
                    MATCH (left:HerbMaterial)-[rel:INTERACTS_WITH]-(right:HerbMaterial)
                    WHERE left.id IN $ids AND right.id IN $ids AND left.id < right.id
                    RETURN left.id AS left_id, right.id AS right_id, properties(rel) AS rel
                    ORDER BY left_id, right_id
                    """,
                    ids=ids,
                )
            ).data()
        documented = {
            (str(row["left_id"]), str(row["right_id"])): dict(row["rel"]) for row in records
        }
        signals: list[IngredientPairSignal] = []
        for left, right in combinations(ids, 2):
            value = documented.get((left, right))
            if value is None:
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
                continue
            relationship_claims = [
                claim
                for entity_id in (left, right)
                for claim in await self._claims(entity_id)
                if claim.predicate == "INTERACTS_WITH"
                and {claim.subject_id, claim.object_id} == {left, right}
            ]
            signals.append(
                IngredientPairSignal(
                    left_herb_material_id=left,
                    right_herb_material_id=right,
                    relationship_status="documented",
                    relationship_type=str(value.get("relationship_type", "INTERACTS_WITH")),
                    directionality=(
                        str(value["directionality"]) if value.get("directionality") else None
                    ),
                    context=str(value["context"]) if value.get("context") else None,
                    uncertainty=(str(value["uncertainty"]) if value.get("uncertainty") else None),
                    claims=relationship_claims,
                )
            )
        return signals

    async def conflicts(self, herb_ids: set[str]) -> list[str]:
        async with self._driver.session(database=self._database) as session:
            result = await session.run(
                """
                MATCH (herb:HerbMaterial)
                WHERE herb.id IN $ids
                UNWIND coalesce(herb.unresolved_conflicts, []) AS conflict
                RETURN DISTINCT conflict ORDER BY conflict
                """,
                ids=sorted(herb_ids),
            )
            records = await result.data()
        return [str(row["conflict"]) for row in records]

    async def retrieval_facts(
        self, entity_ids: list[str], source_ids: list[str], limit: int
    ) -> list[RetrievalFact]:
        facts: list[RetrievalFact] = []
        for entity_id in entity_ids:
            for claim in await self._claims(entity_id):
                if source_ids and claim.source.id not in source_ids:
                    continue
                facts.append(
                    RetrievalFact(
                        subject_id=claim.subject_id,
                        predicate=claim.predicate,
                        object_id=claim.object_id,
                        textual_value=claim.textual_value,
                        citation=_source_citation(
                            claim.source, claim.source_locator, claim.review_status
                        ),
                    )
                )
                if len(facts) >= limit:
                    return facts
        return facts

    async def seed_demo(self) -> dict[str, int]:
        async with self._driver.session(database=self._database) as session:
            await (
                await session.run(
                    SEED_DEMO_CYPHER,
                    parameters=cast(dict[str, Any], DEMO_PAYLOAD),
                )
            ).consume()
        return {"sources": 1, "entities": 4, "passages": 1}

    async def reset_demo(self) -> dict[str, int]:
        async with self._driver.session(database=self._database) as session:
            count_record = await (
                await session.run(
                    """
                    MATCH (node)
                    WHERE node.demo = true OR node.id STARTS WITH $prefix
                    RETURN count(node) AS deleted
                    """,
                    prefix="demo:",
                )
            ).single()
            await (
                await session.run(
                    """
                    MATCH (node)
                    WHERE node.demo = true OR node.id STARTS WITH $prefix
                    DETACH DELETE node
                    """,
                    prefix="demo:",
                )
            ).consume()
        return {"deleted": int(count_record["deleted"]) if count_record else 0}

    async def audit(self) -> dict[str, object]:
        async with self._driver.session(database=self._database) as session:
            summary = await (
                await session.run(
                    """
                    MATCH (node)
                    RETURN count(node) AS nodes,
                           count(CASE WHEN node:Claim THEN 1 END) AS claims,
                           count(CASE WHEN node:Source THEN 1 END) AS sources,
                           count(CASE WHEN node.review_status IS NULL
                                      AND NOT node:AlchemyMigration THEN 1 END) AS missing_review
                    """
                )
            ).single()
            issues: list[dict[str, object]] = []
            for code, critical, cypher in _AUDIT_QUERIES:
                record = await (await session.run(cypher)).single()
                count = int(record["count"]) if record else 0
                if count:
                    issues.append({"code": code, "count": count, "critical": critical})
        if summary is None:
            return {
                "nodes": 0,
                "claims": 0,
                "sources": 0,
                "criticalFailures": 0,
                "issues": [],
                "warnings": [],
            }
        missing = int(summary["missing_review"])
        critical_failures = sum(
            int(cast(int | str, issue["count"])) for issue in issues if bool(issue["critical"])
        )
        return {
            "nodes": int(summary["nodes"]),
            "claims": int(summary["claims"]),
            "sources": int(summary["sources"]),
            "criticalFailures": critical_failures,
            "issues": issues,
            "warnings": ([f"{missing} nodes lack review status."] if missing else []),
        }

    async def graph_counts(self) -> dict[str, object]:
        async with self._driver.session(database=self._database) as session:
            summary = await (
                await session.run(
                    """
                    MATCH (node)
                    WITH count(node) AS total_nodes
                    OPTIONAL MATCH ()-[relationship]->()
                    RETURN total_nodes, count(relationship) AS total_relationships
                    """
                )
            ).single()
            label_rows = await (
                await session.run(
                    """
                    MATCH (node)
                    UNWIND labels(node) AS label
                    RETURN label, count(*) AS count
                    ORDER BY label
                    """
                )
            ).data()
            relationship_rows = await (
                await session.run(
                    """
                    MATCH ()-[relationship]->()
                    RETURN type(relationship) AS type, count(*) AS count
                    ORDER BY type
                    """
                )
            ).data()
        return {
            "totalNodes": int(summary["total_nodes"]) if summary else 0,
            "totalRelationships": (int(summary["total_relationships"]) if summary else 0),
            "labels": {str(row["label"]): int(row["count"]) for row in label_rows},
            "relationshipTypes": {str(row["type"]): int(row["count"]) for row in relationship_rows},
        }

    async def foundation_status(self, source_id: str, release_id: str) -> dict[str, int]:
        queries = {
            "releases": """
                MATCH (release:SourceRelease {
                  source_id: $source_id,
                  release_id: $release_id
                })
                RETURN count(release) AS count
            """,
            "sourceRecords": """
                MATCH (:SourceRelease {
                  source_id: $source_id,
                  release_id: $release_id
                })-[:CONTAINS_RECORD]->(record:SourceRecord)
                RETURN count(DISTINCT record) AS count
            """,
            "officialMonographs": """
                MATCH (material:HerbMaterial:MedicinalMaterial)
                WHERE $source_id IN coalesce(material.source_ids, [])
                  AND material.material_scope = 'official_monograph'
                RETURN count(DISTINCT material) AS count
            """,
            "formulas": """
                MATCH (formula:Formula:FormulaConcept)
                WHERE $source_id IN coalesce(formula.source_ids, [])
                RETURN count(DISTINCT formula) AS count
            """,
            "formulaWitnesses": """
                MATCH (witness:FormulaWitness)-[:SUPPORTED_BY]->(record:SourceRecord {
                  source_id: $source_id,
                  release_id: $release_id
                })
                RETURN count(DISTINCT witness) AS count
            """,
            "ingredientUses": """
                MATCH (witness:FormulaWitness)-[:SUPPORTED_BY]->(:SourceRecord {
                  source_id: $source_id,
                  release_id: $release_id
                })
                MATCH (witness)-[:HAS_INGREDIENT_USE]->(ingredient:IngredientUse)
                RETURN count(DISTINCT ingredient) AS count
            """,
        }
        counts: dict[str, int] = {}
        async with self._driver.session(database=self._database) as session:
            for name, cypher in queries.items():
                record = await (
                    await session.run(
                        cypher,
                        source_id=source_id,
                        release_id=release_id,
                    )
                ).single()
                counts[name] = int(record["count"]) if record else 0
        return counts

    async def reset_source_release_evidence(
        self, source_id: str, release_id: str
    ) -> dict[str, int]:
        parameters = {"source_id": source_id, "release_id": release_id}
        statements = {
            "convenienceRelationships": """
                MATCH (release:SourceRelease {
                  source_id: $source_id,
                  release_id: $release_id
                })-[:CONTAINS_RECORD]->(record:SourceRecord)
                MATCH (:Formula)-[relationship:CONTAINS]->()
                WHERE relationship.source_record_id = record.id
                WITH DISTINCT relationship
                DELETE relationship
                RETURN count(*) AS count
            """,
            "ingredientUses": """
                MATCH (release:SourceRelease {
                  source_id: $source_id,
                  release_id: $release_id
                })-[:CONTAINS_RECORD]->(record:SourceRecord)
                MATCH (witness:FormulaWitness)-[:SUPPORTED_BY]->(record)
                MATCH (witness)-[:HAS_INGREDIENT_USE]->(ingredient:IngredientUse)
                WITH DISTINCT ingredient
                DETACH DELETE ingredient
                RETURN count(*) AS count
            """,
            "evidenceNodes": """
                MATCH (release:SourceRelease {
                  source_id: $source_id,
                  release_id: $release_id
                })-[:CONTAINS_RECORD]->(record:SourceRecord)
                MATCH (node)-[:SUPPORTED_BY]->(record)
                WHERE (node:CanonicalName OR node:Claim OR node:FormulaWitness)
                  AND NOT EXISTS {
                    MATCH (node)-[:SUPPORTED_BY]->(other_record:SourceRecord)
                    MATCH (other_release:SourceRelease)-[:CONTAINS_RECORD]->(other_record)
                    WHERE other_release <> release
                  }
                WITH DISTINCT node
                DETACH DELETE node
                RETURN count(*) AS count
            """,
            "mappingAssertions": """
                MATCH (release:SourceRelease {
                  source_id: $source_id,
                  release_id: $release_id
                })-[:CONTAINS_RECORD]->(record:SourceRecord)
                MATCH (mapping:MappingAssertion)-[:MAPPING_SUBJECT]->(record)
                WITH DISTINCT mapping
                DETACH DELETE mapping
                RETURN count(*) AS count
            """,
            "externalIdentifiers": """
                MATCH (release:SourceRelease {
                  source_id: $source_id,
                  release_id: $release_id
                })-[:CONTAINS_RECORD]->(record:SourceRecord)
                MATCH (record)-[:HAS_EXTERNAL_IDENTIFIER]->(identifier:ExternalIdentifier)
                WHERE NOT EXISTS {
                    MATCH (other_record:SourceRecord)-[:HAS_EXTERNAL_IDENTIFIER]->(identifier)
                    MATCH (other_release:SourceRelease)-[:CONTAINS_RECORD]->(other_record)
                    WHERE other_release <> release
                }
                WITH DISTINCT identifier
                DETACH DELETE identifier
                RETURN count(*) AS count
            """,
            "sourceRecords": """
                MATCH (release:SourceRelease {
                  source_id: $source_id,
                  release_id: $release_id
                })-[:CONTAINS_RECORD]->(record:SourceRecord)
                WITH DISTINCT record
                DETACH DELETE record
                RETURN count(*) AS count
            """,
        }
        counts: dict[str, int] = {}
        async with self._driver.session(database=self._database) as session:
            for field, cypher in statements.items():
                record = await (
                    await session.run(cypher, parameters=cast(dict[str, Any], parameters))
                ).single()
                counts[field] = int(record["count"]) if record else 0
        return counts

    async def provenance(self, entity_id: str) -> dict[str, object]:
        async with self._driver.session(database=self._database) as session:
            result = await session.run(
                """
                MATCH (entity {id: $entity_id})
                OPTIONAL MATCH (entity)-[:SUPPORTED_BY]->(direct:SourceRecord)
                OPTIONAL MATCH (mapping:MappingAssertion)
                              -[:MAPPING_TARGET]->(entity)
                OPTIONAL MATCH (mapping)-[:MAPPING_SUBJECT]->(mapped:SourceRecord)
                WITH entity, [record IN collect(DISTINCT direct) + collect(DISTINCT mapped)
                              WHERE record IS NOT NULL] AS records
                UNWIND CASE WHEN size(records) = 0 THEN [null] ELSE records END AS record
                WITH DISTINCT entity, record
                OPTIONAL MATCH (release:SourceRelease)-[:CONTAINS_RECORD]->(record)
                OPTIONAL MATCH (source:Source)-[:HAS_RELEASE]->(release)
                OPTIONAL MATCH (release)-[:USES_LICENSE]->(license:License)
                OPTIONAL MATCH (run:ImportRun)-[:IMPORTED_RELEASE]->(release)
                RETURN entity.id AS entity_id,
                       record.id AS source_record_id,
                       release.release_id AS release_id,
                       source.id AS source_id,
                       source.title AS source_title,
                       license.name AS license,
                       license.url AS license_url,
                       run.id AS import_run_id
                ORDER BY source_id, release_id, source_record_id
                """,
                entity_id=entity_id,
            )
            rows = await result.data()
        found = bool(rows)
        paths = [
            {
                "sourceRecordId": row["source_record_id"],
                "releaseId": row["release_id"],
                "sourceId": row["source_id"],
                "sourceTitle": row["source_title"],
                "license": row["license"],
                "licenseUrl": row["license_url"],
                "importRunId": row["import_run_id"],
            }
            for row in rows
            if row["source_record_id"] is not None
        ]
        return {"entityId": entity_id, "found": found, "paths": paths}

    async def rebuild_projections(self) -> dict[str, object]:
        audit = await self.audit()
        if int(cast(int | str, audit.get("criticalFailures", 0))):
            raise RuntimeError("critical graph audit blocks projection rebuild")
        async with self._driver.session(database=self._database) as session:
            record_result = await (
                await session.run(
                    """
                    MATCH (release:SourceRelease)-[:CONTAINS_RECORD]->(record:SourceRecord)
                    MATCH (release)-[:USES_LICENSE]->(license:License)
                    SET record.production_eligible =
                        release.checksum_verified = true
                        AND release.import_audit_passed = true
                        AND license.commercial_use = 'allowed'
                        AND license.redistribution = 'allowed'
                        AND license.derivative_database = 'allowed'
                        AND coalesce(record.row_production_eligible, true)
                    RETURN count(record) AS count
                    """
                )
            ).single()
            entity_result = await (
                await session.run(
                    """
                    MATCH (entity:CanonicalEntity)
                    OPTIONAL MATCH (entity)-[:SUPPORTED_BY]->(record:SourceRecord)
                    WITH entity, collect(coalesce(record.production_eligible, false)) AS eligibility
                    SET entity.production_eligible = any(value IN eligibility WHERE value = true),
                        entity.projection_version = 'accepted-claims-v1'
                    RETURN count(entity) AS count
                    """
                )
            ).single()
            await (
                await session.run(
                    """
                    MERGE (projection:GraphProjection {id: 'production-approved-v1'})
                    SET projection.version = 'production-approved-v1',
                        projection.built_at = datetime(),
                        projection.review_status = 'machine_imported'
                    """
                )
            ).consume()
        return {
            "projectionVersion": "production-approved-v1",
            "sourceRecords": int(record_result["count"]) if record_result else 0,
            "canonicalEntities": int(entity_result["count"]) if entity_result else 0,
            "audit": audit,
        }

    async def ingest_batch(self, batch: IngestionBatch, batch_size: int) -> dict[str, int]:
        node_groups: dict[tuple[str, tuple[str, ...]], list[NodeUpsert]] = {}
        for node in batch.nodes:
            key = (
                node.entity_type.value,
                tuple(sorted({label.value for label in node.additional_labels})),
            )
            node_groups.setdefault(key, []).append(node)
        relationship_groups: dict[str, list[RelationshipUpsert]] = {}
        for relationship in batch.relationships:
            relationship_groups.setdefault(relationship.relationship_type.value, []).append(
                relationship
            )

        async with self._driver.session(database=self._database) as session:
            for (entity_type, additional_labels), nodes in node_groups.items():
                labels = ":" + ":".join([entity_type, *additional_labels])
                for start in range(0, len(nodes), batch_size):
                    values = [
                        {"id": node.id, "properties": node.properties}
                        for node in nodes[start : start + batch_size]
                    ]
                    await (
                        await session.run(
                            f"""
                            UNWIND $values AS value
                            MERGE (node{labels} {{id: value.id}})
                            SET node += value.properties, node.id = value.id
                            """,
                            values=values,
                        )
                    ).consume()
            for relationship_type, relationships in relationship_groups.items():
                rel_type = relationship_type
                for start in range(0, len(relationships), batch_size):
                    values = [
                        {
                            "id": relationship.id,
                            "source_id": relationship.source_id,
                            "target_id": relationship.target_id,
                            "properties": relationship.properties,
                        }
                        for relationship in relationships[start : start + batch_size]
                    ]
                    await (
                        await session.run(
                            f"""
                            UNWIND $values AS value
                            MATCH (source {{id: value.source_id}})
                            MATCH (target {{id: value.target_id}})
                            MERGE (source)-[relationship:{rel_type} {{id: value.id}}]->(target)
                            SET relationship += value.properties
                            """,
                            values=values,
                        )
                    ).consume()
        return {
            "nodes": len({node.id for node in batch.nodes}),
            "relationships": len({relationship.id for relationship in batch.relationships}),
        }
