"""Offline, rate-limited PubChem PUG-REST enrichment client."""

import asyncio
import json
from hashlib import sha256
from pathlib import Path
from time import monotonic
from urllib.parse import quote

import httpx
from pydantic import Field

from current_alchemy.domain.common.models import ApiModel


class PubChemCompound(ApiModel):
    cid: int
    title: str
    molecular_formula: str | None = None
    inchi: str | None = None
    inchikey: str | None = None
    canonical_smiles: str | None = None
    source_url: str
    response_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")


class PubChemClient:
    """Administration-only client; it is not registered in any end-user API route."""

    def __init__(
        self,
        *,
        user_agent: str,
        timeout_seconds: float,
        minimum_interval_ms: int,
        cache_directory: Path,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._user_agent = user_agent
        self._timeout = timeout_seconds
        self._minimum_interval = minimum_interval_ms / 1000
        self._cache_directory = cache_directory
        self._transport = transport
        self._last_request_at = 0.0

    async def _wait_for_rate_limit(self) -> None:
        remaining = self._minimum_interval - (monotonic() - self._last_request_at)
        if remaining > 0:
            await asyncio.sleep(remaining)

    async def fetch_by_name(self, compound_name: str) -> PubChemCompound:
        key = sha256(compound_name.casefold().encode("utf-8")).hexdigest()
        cache_path = self._cache_directory / f"{key}.json"
        if cache_path.exists():
            payload_text = cache_path.read_text(encoding="utf-8")
            return self._parse(payload_text)

        encoded = quote(compound_name, safe="")
        properties = "Title,MolecularFormula,InChI,InChIKey,CanonicalSMILES"
        url = (
            "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/"
            f"{encoded}/property/{properties}/JSON"
        )
        async with httpx.AsyncClient(
            headers={"User-Agent": self._user_agent, "Accept": "application/json"},
            timeout=self._timeout,
            transport=self._transport,
        ) as client:
            response: httpx.Response | None = None
            for attempt in range(4):
                await self._wait_for_rate_limit()
                response = await client.get(url)
                self._last_request_at = monotonic()
                if response.status_code not in {429, 500, 502, 503, 504}:
                    break
                if attempt < 3:
                    await asyncio.sleep(0.25 * (2**attempt))
            if response is None:
                raise RuntimeError("PubChem request did not produce a response")
            response.raise_for_status()
            payload_text = response.text
        self._cache_directory.mkdir(parents=True, exist_ok=True)
        cache_path.write_text(payload_text, encoding="utf-8")
        return self._parse(payload_text)

    def _parse(self, payload_text: str) -> PubChemCompound:
        payload = json.loads(payload_text)
        properties = payload["PropertyTable"]["Properties"]
        if not isinstance(properties, list) or not properties:
            raise ValueError("PubChem response contains no compound properties")
        first = properties[0]
        cid = int(first["CID"])
        return PubChemCompound(
            cid=cid,
            title=str(first.get("Title", f"PubChem CID {cid}")),
            molecular_formula=first.get("MolecularFormula"),
            inchi=first.get("InChI"),
            inchikey=first.get("InChIKey"),
            canonical_smiles=first.get("ConnectivitySMILES") or first.get("CanonicalSMILES"),
            source_url=f"https://pubchem.ncbi.nlm.nih.gov/compound/{cid}",
            response_sha256=sha256(payload_text.encode("utf-8")).hexdigest(),
        )
