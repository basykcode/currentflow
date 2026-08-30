import json
from pathlib import Path

from current_alchemy.cli.main import _contract_json


def test_checked_in_openapi_contract_is_current() -> None:
    contract = Path(__file__).resolve().parents[4] / "contracts" / "alchemy-openapi.json"
    assert contract.exists(), "Run `uv run alchemy openapi export`."
    assert contract.read_text(encoding="utf-8") == _contract_json()


def test_private_bounded_posts_keep_stable_operation_ids() -> None:
    contract = Path(__file__).resolve().parents[4] / "contracts" / "alchemy-openapi.json"
    document = json.loads(contract.read_text(encoding="utf-8"))

    assert document["paths"]["/api/v1/explore/query"]["post"]["operationId"] == ("explore_query")
    assert document["paths"]["/api/v1/retrieval/context"]["post"]["operationId"] == (
        "build_retrieval_context"
    )
