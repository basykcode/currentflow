import json
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


def test_predeploy_owns_mutation_and_start_is_process_only() -> None:
    predeploy = (_SERVICE_ROOT / "deploy" / "predeploy.sh").read_text(encoding="utf-8")
    start = (_SERVICE_ROOT / "deploy" / "start.sh").read_text(encoding="utf-8")
    assert "alchemy db migrate" in predeploy
    assert "alchemy foundation ensure --retire-demo" in predeploy
    assert "refuses to seed demo data" in predeploy
    assert "alchemy db migrate" not in start
    assert "alchemy foundation" not in start
    assert "alchemy data seed-demo" not in start
    assert "exec uvicorn" in start


def test_gateway_source_configuration_cannot_claim_the_production_hostname() -> None:
    configuration = cast(
        dict[str, Any],
        json.loads(
            (_REPOSITORY_ROOT / "workers" / "api-gateway" / "wrangler.jsonc").read_text(
                encoding="utf-8"
            )
        ),
    )
    assert configuration["name"] == "current-flow-api-gateway"
    assert configuration["workers_dev"] is True
    assert "routes" not in configuration
