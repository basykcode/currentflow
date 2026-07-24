"""Closed source-adapter registry."""

from current_alchemy.ingestion.adapters.base import SourceAdapter
from current_alchemy.ingestion.adapters.pubchem import PubChemAdapter
from current_alchemy.ingestion.adapters.symmap import SymMapPlaceholderAdapter
from current_alchemy.ingestion.adapters.synthetic import SyntheticFixtureAdapter
from current_alchemy.ingestion.adapters.usda_duke import UsdaDukeAdapter
from current_alchemy.ingestion.adapters.user_supplied import UserSuppliedSourceAdapter


def adapters() -> dict[str, SourceAdapter]:
    values: list[SourceAdapter] = [
        SyntheticFixtureAdapter(),
        UsdaDukeAdapter(),
        PubChemAdapter(),
        UserSuppliedSourceAdapter(),
        SymMapPlaceholderAdapter(),
    ]
    return {adapter.name: adapter for adapter in values}


def get_adapter(name: str, version: str) -> SourceAdapter:
    adapter = adapters().get(name)
    if adapter is None:
        raise ValueError(f"Unknown source adapter: {name}")
    if adapter.version != version:
        raise ValueError(
            f"Adapter version mismatch for {name}: expected {adapter.version}, got {version}"
        )
    return adapter
