from pathlib import Path
from typing import Any, cast

import yaml

_REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
_SERVICE_ROOT = _REPOSITORY_ROOT / "services" / "alchemy-api"


def test_render_blueprint_has_paid_release_and_health_contract() -> None:
    document = cast(
        dict[str, Any],
        yaml.safe_load((_REPOSITORY_ROOT / "render.yaml").read_text(encoding="utf-8")),
    )
    service = cast(dict[str, Any], document["services"][0])
    assert service["name"] == "current-flow-alchemy-api"
    assert service["plan"] == "standard"
    assert service["region"] == "virginia"
    assert service["branch"] == "master"
    assert service["preDeployCommand"] == "sh deploy/predeploy.sh"
    assert service["dockerCommand"] == "sh deploy/start.sh"
    assert service["healthCheckPath"] == "/api/v1/health/ready"
    environment = {item["key"]: item.get("value") for item in service["envVars"]}
    assert environment["WEB_CONCURRENCY"] == "1"
    assert environment["ALCHEMY_REQUIRE_EDGE_ORIGIN_TOKEN"] == "1"
    assert environment["NEO4J_MAX_CONNECTION_POOL_SIZE"] == "20"
    assert environment["NEO4J_CONNECTION_ACQUISITION_TIMEOUT_SECONDS"] == "5"
    assert environment["NEO4J_CONNECTION_TIMEOUT_SECONDS"] == "10"
    assert environment["NEO4J_MAX_CONNECTION_LIFETIME_SECONDS"] == "1800"
    assert environment["NEO4J_LIVENESS_CHECK_TIMEOUT_SECONDS"] == "30"
    assert environment["NEO4J_QUERY_TIMEOUT_SECONDS"] == "15"


def test_predeploy_owns_mutation_and_start_is_process_only() -> None:
    predeploy = (_SERVICE_ROOT / "deploy" / "predeploy.sh").read_text(encoding="utf-8")
    start = (_SERVICE_ROOT / "deploy" / "start.sh").read_text(encoding="utf-8")
    dockerfile = (_SERVICE_ROOT / "Dockerfile").read_text(encoding="utf-8")
    assert "alchemy db migrate" in predeploy
    assert "alchemy foundation ensure --retire-demo" in predeploy
    assert "refuses to seed demo data" in predeploy
    assert "alchemy db migrate" not in start
    assert "alchemy foundation" not in start
    assert "alchemy data seed-demo" not in start
    assert "exec uvicorn" in start
    assert 'CMD ["sh", "deploy/start.sh"]' in dockerfile


def test_gateway_source_configuration_cannot_claim_the_production_hostname() -> None:
    configuration = cast(
        dict[str, Any],
        yaml.safe_load((_REPOSITORY_ROOT / "workers/api-gateway/wrangler.jsonc").read_text()),
    )
    assert configuration["name"] == "current-flow-api-gateway"
    assert configuration["workers_dev"] is True
    assert configuration["main"] == "src/index.ts"
    assert "routes" not in configuration


def test_production_browser_timeout_retains_transport_margin() -> None:
    production_environment = (_REPOSITORY_ROOT / ".env.production").read_text(encoding="utf-8")

    assert "VITE_ALCHEMY_REQUEST_TIMEOUT_MS=35000" in production_environment.splitlines()
