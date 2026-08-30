import asyncio
from collections.abc import AsyncIterator
from typing import cast

import httpx
import pytest

from current_alchemy.app import create_app
from current_alchemy.config import Settings
from current_alchemy.infrastructure.memory_repository import MemoryAlchemyRepository


@pytest.mark.asyncio
async def test_liveness_readiness_meta_and_request_id(client: httpx.AsyncClient) -> None:
    live = await client.get("/api/v1/health/live", headers={"X-Request-ID": "test-request-1"})
    assert live.status_code == 200
    assert live.headers["X-Request-ID"] == "test-request-1"
    assert live.json()["status"] == "live"

    ready = await client.get("/api/v1/health/ready")
    assert ready.status_code == 200
    assert ready.json()["dependencies"] == [{"name": "neo4j", "status": "ready"}]

    meta = await client.get("/api/v1/meta")
    assert meta.status_code == 200
    assert meta.json()["formulaAnalysisAlgorithmVersion"] == "alchemy-formula-analysis-v0"
    assert meta.json()["pythonVersion"] == "3.13.13"
    assert meta.json()["neo4jDriverVersion"] == "5.28.2"
    assert meta.json()["projectionVersions"] == ["production-approved-v1", "accepted-claims-v1"]
    assert meta.json()["processWorkerCount"] == 1
    assert meta.json()["neo4jConfiguration"]["maximumConnectionPoolSize"] == 20
    assert "external-ai" in meta.json()["featureFlags"]["disabled"]


@pytest.mark.asyncio
async def test_public_cache_etag_and_private_health_bypass(client: httpx.AsyncClient) -> None:
    live = await client.get("/api/v1/health/live")
    assert live.headers["Cache-Control"] == "no-store"

    meta = await client.get("/api/v1/meta")
    assert meta.headers["Cache-Control"].startswith("public, max-age=60, s-maxage=3600")
    assert meta.headers["ETag"]
    assert meta.headers["X-Content-Type-Options"] == "nosniff"

    unchanged = await client.get(
        "/api/v1/meta",
        headers={"If-None-Match": meta.headers["ETag"]},
    )
    assert unchanged.status_code == 304
    assert unchanged.content == b""

    first_search = await client.get(
        "/api/v1/herbs",
        headers={"X-Request-ID": "cache-request-one"},
    )
    second_search = await client.get(
        "/api/v1/herbs",
        headers={
            "X-Request-ID": "cache-request-two",
            "If-None-Match": first_search.headers["ETag"],
        },
    )
    assert first_search.json()["meta"]["requestId"] is None
    assert first_search.json()["meta"]["generatedAt"] is None
    assert second_search.status_code == 304

    private = await client.get(
        "/api/v1/meta",
        headers={"Authorization": "Bearer private"},
    )
    assert private.headers["Cache-Control"] == "private, no-store"
    assert "ETag" not in private.headers


@pytest.mark.asyncio
async def test_request_size_limit_rejects_declared_oversize_body(
    client: httpx.AsyncClient,
) -> None:
    response = await client.post(
        "/api/v1/formulas/analyze",
        content=b"x" * (1_048_576 + 1),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 413
    assert response.json()["code"] == "request_too_large"
    assert response.headers["Cache-Control"] == "no-store"


@pytest.mark.asyncio
async def test_request_size_limit_rejects_chunked_oversize_body(
    client: httpx.AsyncClient,
) -> None:
    async def chunks() -> AsyncIterator[bytes]:
        yield b"x" * 700_000
        yield b"y" * 700_000

    response = await client.post(
        "/api/v1/formulas/analyze",
        content=chunks(),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 413
    assert response.json()["code"] == "request_too_large"


@pytest.mark.asyncio
async def test_production_origin_token_protects_application_routes() -> None:
    settings = Settings(
        NEO4J_URI="bolt://test.invalid:7687",
        NEO4J_USERNAME="test",
        NEO4J_PASSWORD="test-only",
        PUBCHEM_USER_AGENT="CurrentAlchemy-tests/0.1",
        ALCHEMY_ENV="production",
        ALCHEMY_ORIGIN_TOKEN="origin-token-test-only",
        ALCHEMY_REQUIRE_EDGE_ORIGIN_TOKEN=True,
    )
    api = create_app(settings=settings, repository=MemoryAlchemyRepository())
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=api),
        base_url="http://test",
    ) as protected_client:
        assert (await protected_client.get("/api/v1/health/live")).status_code == 200
        denied = await protected_client.get("/api/v1/meta")
        allowed = await protected_client.get(
            "/api/v1/meta",
            headers={"X-Current-Flow-Origin-Token": "origin-token-test-only"},
        )

    assert denied.status_code == 403
    assert denied.json()["code"] == "origin_access_denied"
    assert allowed.status_code == 200


@pytest.mark.asyncio
async def test_production_origin_token_supports_zero_downtime_secondary_rotation() -> None:
    settings = Settings(
        NEO4J_URI="bolt://test.invalid:7687",
        NEO4J_USERNAME="test",
        NEO4J_PASSWORD="test-only",
        PUBCHEM_USER_AGENT="CurrentAlchemy-tests/0.1",
        ALCHEMY_ENV="production",
        ALCHEMY_ORIGIN_TOKEN="current-origin-token-test-only",
        ALCHEMY_ORIGIN_TOKEN_SECONDARY="next-origin-token-test-only",
        ALCHEMY_REQUIRE_EDGE_ORIGIN_TOKEN=True,
    )
    api = create_app(settings=settings, repository=MemoryAlchemyRepository())
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=api),
        base_url="http://test",
    ) as protected_client:
        current = await protected_client.get(
            "/api/v1/meta",
            headers={"X-Current-Flow-Origin-Token": "current-origin-token-test-only"},
        )
        next_token = await protected_client.get(
            "/api/v1/meta",
            headers={"X-Current-Flow-Origin-Token": "next-origin-token-test-only"},
        )

    assert current.status_code == 200
    assert next_token.status_code == 200


def test_production_edge_enforcement_requires_a_secret() -> None:
    with pytest.raises(ValueError, match="edge origin enforcement"):
        Settings(
            NEO4J_URI="bolt://test.invalid:7687",
            NEO4J_USERNAME="test",
            NEO4J_PASSWORD="test-only",
            PUBCHEM_USER_AGENT="CurrentAlchemy-tests/0.1",
            ALCHEMY_ENV="production",
            ALCHEMY_REQUIRE_EDGE_ORIGIN_TOKEN=True,
        )

    with pytest.raises(ValueError, match="edge origin enforcement"):
        Settings(
            NEO4J_URI="bolt://test.invalid:7687",
            NEO4J_USERNAME="test",
            NEO4J_PASSWORD="test-only",
            PUBCHEM_USER_AGENT="CurrentAlchemy-tests/0.1",
            ALCHEMY_ENV="production",
            ALCHEMY_ORIGIN_TOKEN="",
            ALCHEMY_REQUIRE_EDGE_ORIGIN_TOKEN=True,
        )


@pytest.mark.asyncio
async def test_request_deadline_returns_bounded_problem() -> None:
    class SlowRepository(MemoryAlchemyRepository):
        async def active_source_count(self) -> int:
            await asyncio.sleep(0.05)
            return 0

    settings = Settings(
        NEO4J_URI="bolt://test.invalid:7687",
        NEO4J_USERNAME="test",
        NEO4J_PASSWORD="test-only",
        PUBCHEM_USER_AGENT="CurrentAlchemy-tests/0.1",
        ALCHEMY_ENV="test",
        ALCHEMY_REQUEST_TIMEOUT_SECONDS=0.01,
    )
    api = create_app(settings=settings, repository=SlowRepository())
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=api),
        base_url="http://test",
    ) as timeout_client:
        response = await timeout_client.get("/api/v1/meta")
    assert response.status_code == 504
    assert response.json()["code"] == "request_timeout"
    assert response.headers["Cache-Control"] == "no-store"


@pytest.mark.asyncio
async def test_readiness_failure_reports_dependency_without_internal_address() -> None:
    class UnreadyRepository(MemoryAlchemyRepository):
        async def readiness(self) -> bool:
            return False

    settings = Settings(
        NEO4J_URI="bolt://private.internal:7687",
        NEO4J_USERNAME="test",
        NEO4J_PASSWORD="test-only",
        PUBCHEM_USER_AGENT="CurrentAlchemy-tests/0.1",
        ALCHEMY_ENV="test",
    )
    api = create_app(settings=settings, repository=UnreadyRepository())
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=api),
        base_url="http://test",
    ) as unready_client:
        response = await unready_client.get("/api/v1/health/ready")
    assert response.status_code == 503
    assert response.json()["code"] == "dependency_unavailable"
    assert "private.internal" not in response.text


@pytest.mark.asyncio
async def test_search_detail_documents_and_graph_are_typed(client: httpx.AsyncClient) -> None:
    herbs = await client.get("/api/v1/herbs", params={"query": "azure"})
    assert herbs.status_code == 200
    body = herbs.json()
    assert body["data"]["pagination"]["total"] == 2
    assert body["meta"]["dataStatus"] == "conflicted"
    assert body["meta"]["sources"][0]["reviewStatus"] == "synthetic_fixture"
    assert body["data"]["items"][0]["properties"]["thermalNatures"]

    formulas = await client.get("/api/v1/formulas", params={"ingredient": "demo:herb:azure-root"})
    assert formulas.status_code == 200
    assert formulas.json()["data"]["items"][0]["id"] == "demo:formula:two-lanterns"

    detail = await client.get("/api/v1/herbs/demo:herb:azure-root")
    assert detail.status_code == 200
    assert len(detail.json()["data"]["claims"]) == 2
    assert detail.json()["data"]["unresolvedConflicts"]

    formula = await client.get("/api/v1/formulas/demo:formula:two-lanterns")
    assert formula.status_code == 200
    assert formula.json()["data"]["properties"]["ingredientIds"]

    documents = await client.get("/api/v1/documents")
    assert documents.status_code == 200
    document_id = documents.json()["data"]["items"][0]["id"]
    assert (await client.get(f"/api/v1/documents/{document_id}")).status_code == 200

    passages = await client.get("/api/v1/text/search", params={"q": "fictional materials"})
    assert passages.status_code == 200
    passage_id = passages.json()["data"]["items"][0]["passage"]["id"]
    assert (
        passages.json()["data"]["items"][0]["passage"]["documentTitle"]
        == "Synthetic Alchemy Fixture Manual"
    )
    assert passages.json()["data"]["items"][0]["passage"]["mentionedEntities"][0]["displayName"]
    assert (await client.get(f"/api/v1/passages/{passage_id}")).status_code == 200
    assert (await client.get("/api/v1/text/search")).json()["data"]["pagination"]["total"] == 1

    graph = await client.get(
        "/api/v1/graph/entities/demo:herb:azure-root/neighborhood",
        params={"depth": 2},
    )
    assert graph.status_code == 200
    assert graph.json()["data"]["nodes"]


@pytest.mark.asyncio
async def test_safe_exploration_and_raw_cypher_rejection(client: httpx.AsyncClient) -> None:
    valid = await client.post(
        "/api/v1/explore/query",
        json={
            "startEntityType": "HerbMaterial",
            "textQuery": "azure",
            "relationshipTypes": ["HAS_ACTION"],
            "maximumDepth": 2,
            "projectionFields": ["id", "displayName"],
        },
    )
    assert valid.status_code == 200
    assert valid.json()["data"]["rows"]

    invalid = await client.post(
        "/api/v1/explore/query",
        json={
            "startEntityType": "HerbMaterial",
            "relationshipTypes": ["HAS_ACTION"],
            "cypher": "MATCH (n) RETURN n",
        },
    )
    assert invalid.status_code == 422
    assert invalid.json()["code"] == "validation_error"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("path", "payload"),
    [
        (
            "/api/v1/explore/query",
            {
                "startEntityType": "HerbMaterial",
                "relationshipTypes": ["HAS_ACTION"],
            },
        ),
        (
            "/api/v1/retrieval/context",
            {"passageIds": ["demo:passage:fixture-manual:1"]},
        ),
    ],
)
async def test_graph_retrieval_posts_are_actually_no_store(
    client: httpx.AsyncClient, path: str, payload: dict[str, object]
) -> None:
    response = await client.post(path, json=payload)

    assert response.status_code == 200
    assert response.headers["Cache-Control"] == "no-store"


@pytest.mark.asyncio
async def test_one_formula_analysis_and_four_formula_comparison(
    client: httpx.AsyncClient,
) -> None:
    composition = {
        "name": "Test formula",
        "ingredients": [
            {
                "herbMaterialId": "demo:herb:azure-root",
                "amount": "500",
                "unit": "mg",
                "role": "source supplied role",
            },
            {
                "herbMaterialId": "demo:herb:amber-seed",
                "amount": "1",
                "unit": "g",
            },
        ],
    }
    analysis = await client.post("/api/v1/formulas/analyze", json={"composition": composition})
    assert analysis.status_code == 200
    data = analysis.json()["data"]
    assert data["supportedUnitTotalsGrams"] == "1.500"
    assert data["pairSignals"][0]["relationshipStatus"] == "documented"
    assert data["algorithmVersion"] == "alchemy-formula-analysis-v0"

    compositions = []
    for index in range(4):
        item = cast(dict[str, object], {**composition, "name": f"Formula {index}"})
        compositions.append(item)
    comparison = await client.post("/api/v1/formulas/compare", json={"compositions": compositions})
    assert comparison.status_code == 200
    assert len(comparison.json()["data"]["pairwise"]) == 6
    assert "compatibilityScore" not in comparison.json()["data"]


@pytest.mark.asyncio
async def test_retrieval_disabled_ai_and_standard_errors(client: httpx.AsyncClient) -> None:
    context = await client.post(
        "/api/v1/retrieval/context",
        json={
            "query": "fictional materials",
            "entityIds": ["demo:herb:azure-root", "missing:id"],
            "maximumPassages": 5,
            "maximumCharacterBudget": 1000,
        },
    )
    assert context.status_code == 200
    assert context.json()["data"]["passages"]
    assert context.json()["data"]["unresolvedAmbiguities"] == ["Unknown entity ID: missing:id"]

    passage_context = await client.post(
        "/api/v1/retrieval/context",
        json={
            "passageIds": ["demo:passage:fixture-manual:1"],
            "maximumPassages": 5,
            "maximumCharacterBudget": 1000,
        },
    )
    assert passage_context.status_code == 200
    assert [item["id"] for item in passage_context.json()["data"]["passages"]] == [
        "demo:passage:fixture-manual:1"
    ]

    disabled = await client.post("/api/v1/inquiry/synthesize", json={"query": "summarize"})
    assert disabled.status_code == 501
    assert disabled.json()["code"] == "model_not_connected"

    missing = await client.get("/api/v1/herbs/missing:id")
    assert missing.status_code == 404
    problem = missing.json()
    assert set(problem) == {
        "type",
        "title",
        "status",
        "code",
        "detail",
        "requestId",
        "errors",
    }
    assert missing.headers["X-Request-ID"] == problem["requestId"]


@pytest.mark.asyncio
async def test_generated_openapi_lists_stable_contract_routes(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/herbs" in paths
    assert "/api/v1/formulas/analyze" in paths
    assert "/api/v1/explore/query" in paths
    assert "/api/v1/retrieval/context" in paths
