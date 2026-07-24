from decimal import Decimal

import pytest

from current_alchemy.domain.analysis.engine import (
    analyze_formula,
    compare_formulas,
    exact_duplicate_ids,
    jaccard_similarity,
    normalize_unit,
)
from current_alchemy.domain.analysis.models import (
    FormulaCompositionInput,
    FormulaIngredientInput,
)
from current_alchemy.infrastructure.memory_repository import MemoryAlchemyRepository


def composition(
    name: str,
    *ingredients: FormulaIngredientInput,
) -> FormulaCompositionInput:
    return FormulaCompositionInput(name=name, ingredients=list(ingredients))


def test_unit_normalization_is_exact_only_for_metric_gram_units() -> None:
    assert normalize_unit(Decimal("500"), "mg") == (Decimal("0.500"), None)
    assert normalize_unit(Decimal("1.25"), "kg") == (Decimal("1250.00"), None)
    assert normalize_unit(Decimal("2"), "liang") == (None, "liang")
    assert normalize_unit(Decimal("2"), None) == (None, "missing unit")


def test_formula_input_rejects_non_positive_amount_and_unit_without_amount() -> None:
    with pytest.raises(ValueError):
        FormulaIngredientInput(herbMaterialId="demo:herb:azure-root", amount=0, unit="g")
    with pytest.raises(ValueError):
        FormulaIngredientInput(herbMaterialId="demo:herb:azure-root", unit="g")


def test_duplicate_detection_and_preparation_distinction_are_preserved() -> None:
    source = composition(
        "Duplicates",
        FormulaIngredientInput(herbMaterialId="demo:herb:azure-root", amount=1, unit="g"),
        FormulaIngredientInput(herbMaterialId="demo:herb:azure-root", amount=1, unit="g"),
        FormulaIngredientInput(
            herbMaterialId="demo:herb:azure-root-roasted",
            preparationId="demo:preparation:roasted",
            amount=1,
            unit="g",
        ),
    )
    assert exact_duplicate_ids(source) == ["demo:herb:azure-root|"]


@pytest.mark.asyncio
async def test_incomplete_data_conflicts_and_unknown_interactions_are_explicit() -> None:
    repository = MemoryAlchemyRepository()
    source = composition(
        "Research composition",
        FormulaIngredientInput(herbMaterialId="demo:herb:azure-root", amount=500, unit="mg"),
        FormulaIngredientInput(
            herbMaterialId="demo:herb:azure-root-roasted",
            preparationId="demo:preparation:roasted",
            amount=1,
            unit="liang",
        ),
    )
    ids = {line.herb_material_id for line in source.ingredients}
    result = analyze_formula(
        source,
        await repository.herb_profiles(ids),
        await repository.pair_signals(ids),
        await repository.conflicts(ids),
    )
    assert result.preparation_distinctions == {
        "demo:herb:azure-root": ["demo:preparation:roasted", "unprepared"]
    }
    assert result.supported_unit_totals_grams is None
    assert result.unsupported_or_unresolved_units == ["ingredient 1: liang"]
    assert result.conflicts
    assert result.missing_data["demo:herb:azure-root-roasted"] == [
        "patterns",
        "actions",
    ]
    assert result.pair_signals[0].relationship_status == "unknown"
    assert "does not establish safety" in (result.pair_signals[0].uncertainty or "")


@pytest.mark.asyncio
async def test_overlap_jaccard_and_documented_pair_signal() -> None:
    repository = MemoryAlchemyRepository()
    left = composition(
        "Left",
        FormulaIngredientInput(herbMaterialId="demo:herb:azure-root"),
        FormulaIngredientInput(herbMaterialId="demo:herb:amber-seed"),
    )
    right = composition(
        "Right",
        FormulaIngredientInput(herbMaterialId="demo:herb:amber-seed"),
        FormulaIngredientInput(herbMaterialId="demo:herb:azure-root-roasted"),
    )
    analyses = []
    for source in (left, right):
        ids = {line.herb_material_id for line in source.ingredients}
        analyses.append(
            analyze_formula(
                source,
                await repository.herb_profiles(ids),
                await repository.pair_signals(ids),
                await repository.conflicts(ids),
            )
        )
    all_ids = {line.herb_material_id for source in (left, right) for line in source.ingredients}
    result = compare_formulas(analyses, await repository.pair_signals(all_ids))
    assert jaccard_similarity(
        {"demo:herb:azure-root", "demo:herb:amber-seed"},
        {"demo:herb:amber-seed", "demo:herb:azure-root-roasted"},
    ) == pytest.approx(1 / 3)
    assert result.pairwise[0].shared_ingredient_ids == ["demo:herb:amber-seed"]
    documented = [
        signal
        for signal in result.cross_formula_pair_signals
        if signal.relationship_status == "documented"
    ]
    assert documented
    assert documented[0].claims[0].source.review_status.value == "synthetic_fixture"


def test_comparison_rejects_duplicate_composition_keys() -> None:
    item = composition(
        "Same",
        FormulaIngredientInput(herbMaterialId="demo:herb:azure-root"),
    )
    with pytest.raises(ValueError):
        from current_alchemy.domain.analysis.models import FormulaComparisonRequest

        FormulaComparisonRequest(compositions=[item, item])
