"""Pure, deterministic formula comparison and normalization functions."""

from collections import Counter, defaultdict
from collections.abc import Iterable
from decimal import Decimal
from itertools import combinations

from current_alchemy.constants import DATA_VERSION, FORMULA_ANALYSIS_VERSION
from current_alchemy.domain.analysis.models import (
    DistributionEntry,
    FormulaAnalysisResult,
    FormulaComparisonResult,
    FormulaCompositionInput,
    HerbAnalysisProfile,
    IngredientPairSignal,
    NormalizedIngredient,
    PairwiseComparison,
)

_GRAM_FACTORS: dict[str, Decimal] = {
    "g": Decimal("1"),
    "gram": Decimal("1"),
    "grams": Decimal("1"),
    "mg": Decimal("0.001"),
    "kg": Decimal("1000"),
}


def normalize_unit(amount: Decimal | None, unit: str | None) -> tuple[Decimal | None, str | None]:
    if amount is None:
        return None, None
    if unit is None:
        return None, "missing unit"
    normalized = unit.casefold()
    factor = _GRAM_FACTORS.get(normalized)
    if factor is None:
        return None, unit
    return amount * factor, None


def jaccard_similarity(left: set[str], right: set[str]) -> float:
    union = left | right
    return 1.0 if not union else len(left & right) / len(union)


def exact_duplicate_ids(composition: FormulaCompositionInput) -> list[str]:
    keys = [
        f"{line.herb_material_id}|{line.preparation_id or ''}" for line in composition.ingredients
    ]
    return sorted(key for key, count in Counter(keys).items() if count > 1)


def _distribution(
    normalized: list[NormalizedIngredient],
    profiles: dict[str, HerbAnalysisProfile],
    field: str,
) -> list[DistributionEntry]:
    counts: Counter[str] = Counter()
    weights: defaultdict[str, Decimal] = defaultdict(Decimal)
    complete_weights = all(item.grams is not None for item in normalized)
    for item in normalized:
        values = getattr(profiles[item.herb_material_id], field)
        for value in values:
            counts[value] += 1
            if item.grams is not None:
                weights[value] += item.grams
    count_total = sum(counts.values())
    weight_total = sum(weights.values(), Decimal(0))
    return [
        DistributionEntry(
            value=value,
            count=count,
            proportion=count / count_total if count_total else 0,
            weight_grams=weights[value] if complete_weights else None,
            weighted_proportion=(
                float(weights[value] / weight_total)
                if complete_weights and weight_total > 0
                else None
            ),
        )
        for value, count in sorted(counts.items())
    ]


def _preparation_distinctions(
    normalized: Iterable[NormalizedIngredient],
) -> dict[str, list[str]]:
    by_base: defaultdict[str, set[str]] = defaultdict(set)
    for item in normalized:
        by_base[item.base_material_id].add(item.preparation_id or "unprepared")
    return {
        base_id: sorted(preparations)
        for base_id, preparations in sorted(by_base.items())
        if len(preparations) > 1
    }


def analyze_formula(
    composition: FormulaCompositionInput,
    profiles: dict[str, HerbAnalysisProfile],
    pair_signals: list[IngredientPairSignal],
    conflicts: list[str],
) -> FormulaAnalysisResult:
    """Analyze only fields supported by supplied profiles and sourced signals."""

    missing_ids = sorted(
        {
            line.herb_material_id
            for line in composition.ingredients
            if line.herb_material_id not in profiles
        }
    )
    if missing_ids:
        raise ValueError(f"Unknown herb material IDs: {', '.join(missing_ids)}")

    normalized: list[NormalizedIngredient] = []
    unresolved: list[str] = []
    for index, line in enumerate(composition.ingredients):
        grams, unresolved_unit = normalize_unit(line.amount, line.unit)
        if unresolved_unit is not None:
            unresolved.append(f"ingredient {index}: {unresolved_unit}")
        profile = profiles[line.herb_material_id]
        normalized.append(
            NormalizedIngredient(
                input_index=index,
                herb_material_id=line.herb_material_id,
                display_name=profile.display_name,
                base_material_id=profile.base_material_id,
                preparation_id=line.preparation_id,
                original_amount=line.amount,
                original_unit=line.unit,
                grams=grams,
                role=line.role,
                source_text=line.source_text,
                note=line.note,
            )
        )

    source_covered = sum(1 for item in normalized if profiles[item.herb_material_id].source_ids)
    review_counts: Counter[str] = Counter(
        status.value
        for item in normalized
        for status in profiles[item.herb_material_id].review_statuses
    )
    missing_data = {
        item.herb_material_id: profiles[item.herb_material_id].missing_fields
        for item in normalized
        if profiles[item.herb_material_id].missing_fields
    }
    exact_duplicates = exact_duplicate_ids(composition)
    warnings = ["Absence of a documented interaction does not establish compatibility or safety."]
    if exact_duplicates:
        warnings.append("Exact duplicate ingredient lines were preserved and reported.")
    if unresolved:
        warnings.append("Weighted distributions exclude unresolved or missing units.")

    all_have_grams = bool(normalized) and all(item.grams is not None for item in normalized)
    total_grams = (
        sum((item.grams for item in normalized if item.grams is not None), Decimal(0))
        if all_have_grams
        else None
    )
    explicit_roles: defaultdict[str, list[str]] = defaultdict(list)
    for item in normalized:
        if item.role:
            explicit_roles[item.role].append(item.herb_material_id)

    return FormulaAnalysisResult(
        algorithm_version=FORMULA_ANALYSIS_VERSION,
        data_version=DATA_VERSION,
        original_input=composition,
        normalized_ingredients=normalized,
        exact_duplicate_ingredient_ids=exact_duplicates,
        preparation_distinctions=_preparation_distinctions(normalized),
        supported_unit_totals_grams=total_grams,
        unsupported_or_unresolved_units=unresolved,
        distributions={
            "thermalNatures": _distribution(normalized, profiles, "thermal_natures"),
            "flavors": _distribution(normalized, profiles, "flavors"),
            "channels": _distribution(normalized, profiles, "channels"),
            "categories": _distribution(normalized, profiles, "categories"),
        },
        documented_actions=sorted(
            {value for item in normalized for value in profiles[item.herb_material_id].actions}
        ),
        documented_patterns=sorted(
            {value for item in normalized for value in profiles[item.herb_material_id].patterns}
        ),
        explicit_roles={key: sorted(values) for key, values in sorted(explicit_roles.items())},
        pair_signals=pair_signals,
        conflicts=sorted(conflicts),
        missing_data=missing_data,
        source_coverage_percentage=(source_covered / len(normalized)) * 100,
        review_status_breakdown=dict(sorted(review_counts.items())),
        warnings=warnings,
    )


def _same_base_different_preparations(
    left: FormulaAnalysisResult, right: FormulaAnalysisResult
) -> dict[str, list[str]]:
    combined = left.normalized_ingredients + right.normalized_ingredients
    return _preparation_distinctions(combined)


def compare_formulas(
    analyses: list[FormulaAnalysisResult],
    cross_formula_pair_signals: list[IngredientPairSignal],
) -> FormulaComparisonResult:
    """Compare two to four completed deterministic formula analyses."""

    pairwise: list[PairwiseComparison] = []
    ingredient_sets: dict[str, set[str]] = {}
    for analysis in analyses:
        key = analysis.original_input.id or analysis.original_input.name
        ingredient_sets[key] = {item.herb_material_id for item in analysis.normalized_ingredients}

    for left, right in combinations(analyses, 2):
        left_key = left.original_input.id or left.original_input.name
        right_key = right.original_input.id or right.original_input.name
        left_ids = ingredient_sets[left_key]
        right_ids = ingredient_sets[right_key]
        pairwise.append(
            PairwiseComparison(
                left_key=left_key,
                right_key=right_key,
                jaccard_similarity=jaccard_similarity(left_ids, right_ids),
                shared_ingredient_ids=sorted(left_ids & right_ids),
                left_unique_ingredient_ids=sorted(left_ids - right_ids),
                right_unique_ingredient_ids=sorted(right_ids - left_ids),
                same_material_different_preparations=_same_base_different_preparations(left, right),
            )
        )

    occurrence = Counter(
        item.herb_material_id for analysis in analyses for item in analysis.normalized_ingredients
    )
    action_sets = {
        analysis.original_input.id or analysis.original_input.name: set(analysis.documented_actions)
        for analysis in analyses
    }
    pattern_sets = {
        analysis.original_input.id or analysis.original_input.name: set(
            analysis.documented_patterns
        )
        for analysis in analyses
    }
    shared_actions = set.intersection(*action_sets.values()) if action_sets else set()
    shared_patterns = set.intersection(*pattern_sets.values()) if pattern_sets else set()

    combined_distribution: dict[str, list[DistributionEntry]] = {}
    for field in ("thermalNatures", "flavors", "channels", "categories"):
        counts: Counter[str] = Counter()
        for analysis in analyses:
            for entry in analysis.distributions[field]:
                counts[entry.value] += entry.count
        total = sum(counts.values())
        combined_distribution[field] = [
            DistributionEntry(value=value, count=count, proportion=count / total)
            for value, count in sorted(counts.items())
        ]

    return FormulaComparisonResult(
        algorithm_version=FORMULA_ANALYSIS_VERSION,
        data_version=DATA_VERSION,
        analyses=analyses,
        pairwise=pairwise,
        repeated_ingredient_ids=sorted(key for key, count in occurrence.items() if count > 1),
        combined_distributions=combined_distribution,
        shared_actions=sorted(shared_actions),
        distinct_actions={
            key: sorted(values - shared_actions) for key, values in action_sets.items()
        },
        shared_patterns=sorted(shared_patterns),
        distinct_patterns={
            key: sorted(values - shared_patterns) for key, values in pattern_sets.items()
        },
        cross_formula_pair_signals=cross_formula_pair_signals,
        source_conflicts=sorted(
            {conflict for analysis in analyses for conflict in analysis.conflicts}
        ),
        warnings=sorted({warning for analysis in analyses for warning in analysis.warnings}),
        completeness_summary={
            analysis.original_input.id
            or analysis.original_input.name: analysis.source_coverage_percentage
            for analysis in analyses
        },
    )
