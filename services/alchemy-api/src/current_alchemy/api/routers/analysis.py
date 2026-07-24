"""Deterministic formula analysis and comparison endpoints."""

from fastapi import APIRouter, Depends, Request

from current_alchemy.api.dependencies import get_repository
from current_alchemy.api.errors import ApiProblem
from current_alchemy.api.responses import knowledge_meta
from current_alchemy.application.ports.repository import AlchemyRepository
from current_alchemy.constants import FORMULA_ANALYSIS_VERSION
from current_alchemy.domain.analysis.engine import analyze_formula, compare_formulas
from current_alchemy.domain.analysis.models import (
    FormulaAnalysisRequest,
    FormulaAnalysisResult,
    FormulaComparisonRequest,
    FormulaComparisonResult,
)
from current_alchemy.domain.common.models import DataStatus, Envelope

router = APIRouter(tags=["formula analysis"])


async def _analyze(
    repository: AlchemyRepository,
    composition: FormulaAnalysisRequest,
) -> FormulaAnalysisResult:
    herb_ids = {item.herb_material_id for item in composition.composition.ingredients}
    profiles = await repository.herb_profiles(herb_ids)
    signals = await repository.pair_signals(herb_ids)
    conflicts = await repository.conflicts(herb_ids)
    try:
        return analyze_formula(composition.composition, profiles, signals, conflicts)
    except ValueError as exc:
        raise ApiProblem(
            status=422,
            code="unresolved_herb_material",
            title="Formula contains unresolved ingredients",
            detail=str(exc),
        ) from exc


@router.post("/formulas/analyze", response_model=Envelope[FormulaAnalysisResult])
async def analyze(
    payload: FormulaAnalysisRequest,
    request: Request,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[FormulaAnalysisResult]:
    result = await _analyze(repository, payload)
    status = DataStatus.CONFLICTED if result.conflicts else DataStatus.INCOMPLETE
    return Envelope(
        data=result,
        meta=knowledge_meta(
            request,
            data_status=status,
            warnings=result.warnings,
            algorithm_version=FORMULA_ANALYSIS_VERSION,
        ),
    )


@router.post("/formulas/compare", response_model=Envelope[FormulaComparisonResult])
async def compare(
    payload: FormulaComparisonRequest,
    request: Request,
    repository: AlchemyRepository = Depends(get_repository),
) -> Envelope[FormulaComparisonResult]:
    analyses = [
        await _analyze(repository, FormulaAnalysisRequest(composition=composition))
        for composition in payload.compositions
    ]
    all_ids = {
        ingredient.herb_material_id
        for composition in payload.compositions
        for ingredient in composition.ingredients
    }
    result = compare_formulas(analyses, await repository.pair_signals(all_ids))
    return Envelope(
        data=result,
        meta=knowledge_meta(
            request,
            data_status=(
                DataStatus.CONFLICTED if result.source_conflicts else DataStatus.INCOMPLETE
            ),
            warnings=result.warnings,
            algorithm_version=FORMULA_ANALYSIS_VERSION,
        ),
    )
