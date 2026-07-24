"""Typed inputs and deterministic outputs for formula research analysis."""

from decimal import Decimal
from typing import Annotated, Literal

from pydantic import Field, StringConstraints, field_validator, model_validator

from current_alchemy.domain.common.models import (
    ApiModel,
    ClaimRecord,
    ReviewStatus,
)

SafeUnit = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=32, pattern=r"^[\w%./-]+$"),
]


class FormulaIngredientInput(ApiModel):
    herb_material_id: str = Field(min_length=1, max_length=160)
    amount: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=6)
    unit: SafeUnit | None = None
    preparation_id: str | None = Field(default=None, min_length=1, max_length=160)
    role: str | None = Field(default=None, min_length=1, max_length=120)
    source_text: str | None = Field(default=None, max_length=1_000)
    note: str | None = Field(default=None, max_length=1_000)

    @model_validator(mode="after")
    def amount_and_unit_are_coherent(self) -> "FormulaIngredientInput":
        if self.unit is not None and self.amount is None:
            raise ValueError("unit requires amount")
        if self.preparation_id == self.herb_material_id:
            raise ValueError("preparationId cannot equal herbMaterialId")
        return self


class FormulaCompositionInput(ApiModel):
    id: str | None = Field(default=None, min_length=1, max_length=160)
    name: str = Field(min_length=1, max_length=200)
    ingredients: list[FormulaIngredientInput] = Field(min_length=1, max_length=64)
    source_formula_id: str | None = Field(default=None, min_length=1, max_length=160)
    notes: str | None = Field(default=None, max_length=4_000)


class FormulaAnalysisRequest(ApiModel):
    composition: FormulaCompositionInput


class FormulaComparisonRequest(ApiModel):
    compositions: list[FormulaCompositionInput] = Field(min_length=2, max_length=4)

    @field_validator("compositions")
    @classmethod
    def require_distinct_composition_keys(
        cls, compositions: list[FormulaCompositionInput]
    ) -> list[FormulaCompositionInput]:
        keys = [(item.id or item.name).casefold() for item in compositions]
        if len(keys) != len(set(keys)):
            raise ValueError("comparison compositions must have distinct IDs or names")
        return compositions


class HerbAnalysisProfile(ApiModel):
    id: str
    base_material_id: str
    display_name: str
    thermal_natures: list[str] = Field(default_factory=list)
    flavors: list[str] = Field(default_factory=list)
    channels: list[str] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)
    actions: list[str] = Field(default_factory=list)
    patterns: list[str] = Field(default_factory=list)
    review_statuses: list[ReviewStatus] = Field(default_factory=list)
    source_ids: list[str] = Field(default_factory=list)
    missing_fields: list[str] = Field(default_factory=list)


class NormalizedIngredient(ApiModel):
    input_index: int
    herb_material_id: str
    display_name: str
    base_material_id: str
    preparation_id: str | None
    original_amount: Decimal | None
    original_unit: str | None
    grams: Decimal | None
    role: str | None
    source_text: str | None
    note: str | None


class DistributionEntry(ApiModel):
    value: str
    count: int = Field(ge=0)
    proportion: float = Field(ge=0, le=1)
    weight_grams: Decimal | None = None
    weighted_proportion: float | None = Field(default=None, ge=0, le=1)


class IngredientPairSignal(ApiModel):
    left_herb_material_id: str
    right_herb_material_id: str
    relationship_status: Literal["documented", "unknown"]
    relationship_type: str | None = None
    directionality: str | None = None
    context: str | None = None
    uncertainty: str | None = None
    claims: list[ClaimRecord] = Field(default_factory=list)


class FormulaAnalysisResult(ApiModel):
    algorithm_version: str
    data_version: str
    original_input: FormulaCompositionInput
    normalized_ingredients: list[NormalizedIngredient]
    exact_duplicate_ingredient_ids: list[str]
    preparation_distinctions: dict[str, list[str]]
    supported_unit_totals_grams: Decimal | None
    unsupported_or_unresolved_units: list[str]
    distributions: dict[str, list[DistributionEntry]]
    documented_actions: list[str]
    documented_patterns: list[str]
    explicit_roles: dict[str, list[str]]
    pair_signals: list[IngredientPairSignal]
    conflicts: list[str]
    missing_data: dict[str, list[str]]
    source_coverage_percentage: float = Field(ge=0, le=100)
    review_status_breakdown: dict[str, int]
    warnings: list[str]


class PairwiseComparison(ApiModel):
    left_key: str
    right_key: str
    jaccard_similarity: float = Field(ge=0, le=1)
    shared_ingredient_ids: list[str]
    left_unique_ingredient_ids: list[str]
    right_unique_ingredient_ids: list[str]
    same_material_different_preparations: dict[str, list[str]]


class FormulaComparisonResult(ApiModel):
    algorithm_version: str
    data_version: str
    analyses: list[FormulaAnalysisResult]
    pairwise: list[PairwiseComparison]
    repeated_ingredient_ids: list[str]
    combined_distributions: dict[str, list[DistributionEntry]]
    shared_actions: list[str]
    distinct_actions: dict[str, list[str]]
    shared_patterns: list[str]
    distinct_patterns: dict[str, list[str]]
    cross_formula_pair_signals: list[IngredientPairSignal]
    source_conflicts: list[str]
    warnings: list[str]
    completeness_summary: dict[str, float]
