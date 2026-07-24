import pytest

from current_alchemy.domain.common.exploration import ExploreQueryRequest
from current_alchemy.domain.texts.models import apply_character_budget
from current_alchemy.infrastructure.memory_repository import MemoryAlchemyRepository


def test_retrieval_budget_keeps_whole_passages_in_deterministic_order() -> None:
    repository = MemoryAlchemyRepository()
    passages = list(repository.passages.values())
    selected, used = apply_character_budget(passages, len(passages[0].original_text))
    assert selected == passages
    assert used == len(passages[0].original_text)
    selected, used = apply_character_budget(passages, len(passages[0].original_text) - 1)
    assert selected == []
    assert used == 0


def test_exploration_query_allows_only_typed_operations() -> None:
    request = ExploreQueryRequest(
        startEntityType="HerbMaterial",
        relationshipTypes=["HAS_ACTION"],
        maximumDepth=2,
        resultLimit=100,
        projectionFields=["id", "displayName"],
    )
    assert request.maximum_depth == 2
    with pytest.raises(ValueError):
        ExploreQueryRequest(
            startEntityType="HerbMaterial",
            relationshipTypes=["HAS_ACTION"],
            maximumDepth=3,
        )
    with pytest.raises(ValueError, match="unknown filter"):
        ExploreQueryRequest(
            startEntityType="HerbMaterial",
            relationshipTypes=["HAS_ACTION"],
            exactPropertyFilters={"password": "x"},
        )
    with pytest.raises(ValueError, match="raw database"):
        ExploreQueryRequest.model_validate(
            {
                "startEntityType": "HerbMaterial",
                "relationshipTypes": ["HAS_ACTION"],
                "cypher": "MATCH (n) DETACH DELETE n",
            }
        )
