import json
from pathlib import Path

import httpx
import pytest

from current_alchemy.infrastructure.external.pubchem import PubChemClient


@pytest.mark.asyncio
async def test_pubchem_client_is_rate_controlled_cached_and_typed(tmp_path: Path) -> None:
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        assert request.headers["User-Agent"] == "CurrentAlchemy-tests/0.1"
        return httpx.Response(
            200,
            json={
                "PropertyTable": {
                    "Properties": [
                        {
                            "CID": 2244,
                            "Title": "Aspirin",
                            "MolecularFormula": "C9H8O4",
                            "InChIKey": "BSYNRYMUTXBXSQ-UHFFFAOYSA-N",
                            "ConnectivitySMILES": "CC(=O)OC1=CC=CC=C1C(=O)O",
                        }
                    ]
                }
            },
        )

    client = PubChemClient(
        user_agent="CurrentAlchemy-tests/0.1",
        timeout_seconds=2,
        minimum_interval_ms=200,
        cache_directory=tmp_path,
        transport=httpx.MockTransport(handler),
    )
    first = await client.fetch_by_name("aspirin")
    second = await client.fetch_by_name("aspirin")
    assert first == second
    assert first.cid == 2244
    assert first.source_url.endswith("/2244")
    assert calls == 1
    cached = list(tmp_path.glob("*.json"))
    assert len(cached) == 1
    assert json.loads(cached[0].read_text(encoding="utf-8"))["PropertyTable"]
