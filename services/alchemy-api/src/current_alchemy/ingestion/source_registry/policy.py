"""Enforce source and row-level rights for graph projections."""

from dataclasses import dataclass

from current_alchemy.ingestion.source_registry.models import (
    CommercialUse,
    DerivativeDatabase,
    ProductionStatus,
    Redistribution,
    RightsProjection,
    SourceRegistryEntry,
    SourceReleaseManifest,
    SourceRights,
)


@dataclass(frozen=True, slots=True)
class PolicyDecision:
    eligible: bool
    projection: RightsProjection
    reasons: tuple[str, ...]


class RightsPolicy:
    """A deny-by-default policy for every externally visible projection."""

    def evaluate(
        self,
        source: SourceRegistryEntry,
        release: SourceReleaseManifest,
        projection: RightsProjection,
        *,
        row_rights: SourceRights | None = None,
    ) -> PolicyDecision:
        rights = row_rights or release.license_snapshot
        reasons: list[str] = []

        if source.source_id != release.source_id:
            reasons.append("source registry and release manifest IDs do not match")

        if projection is RightsProjection.INTERNAL_RESEARCH:
            if source.production_status is ProductionStatus.BLOCKED:
                reasons.append("blocked sources cannot enter the internal graph")
            return PolicyDecision(not reasons, projection, tuple(reasons))

        if projection is RightsProjection.BLOCKED:
            eligible = source.production_status is ProductionStatus.BLOCKED
            return PolicyDecision(
                eligible,
                projection,
                () if eligible else ("source is not blocked",),
            )

        if projection is RightsProjection.PERMISSION_PENDING:
            eligible = source.production_status in {
                ProductionStatus.PERMISSION_PENDING,
                ProductionStatus.INTERNAL_RESEARCH_ONLY,
            }
            return PolicyDecision(
                eligible,
                projection,
                () if eligible else ("source is not permission-pending",),
            )

        if source.production_status not in {
            ProductionStatus.APPROVED,
            ProductionStatus.APPROVED_WITH_CONDITIONS,
        }:
            reasons.append("source production status is not approved")
        if rights.commercial_use is not CommercialUse.ALLOWED:
            reasons.append("commercial use is not allowed")
        if rights.redistribution is not Redistribution.ALLOWED:
            reasons.append("redistribution is not allowed")
        if not rights.attribution_requirements:
            reasons.append("attribution requirements are missing")
        if release.license_snapshot.license_url is None:
            reasons.append("release license URL is missing")
        if not release.checksum_verified:
            reasons.append("release checksum has not been verified")
        if not release.import_audit_passed:
            reasons.append("release import audit has not passed")

        if projection is RightsProjection.PRODUCTION_APPROVED:
            if rights.derivative_database is not DerivativeDatabase.ALLOWED:
                reasons.append("derivative-database rights are not unrestricted")
        elif projection is RightsProjection.SHARE_ALIKE:
            if rights.derivative_database not in {
                DerivativeDatabase.ALLOWED,
                DerivativeDatabase.SHARE_ALIKE,
            }:
                reasons.append("derivative-database rights do not permit this partition")

        return PolicyDecision(not reasons, projection, tuple(reasons))

    def require(
        self,
        source: SourceRegistryEntry,
        release: SourceReleaseManifest,
        projection: RightsProjection,
        *,
        row_rights: SourceRights | None = None,
    ) -> None:
        decision = self.evaluate(source, release, projection, row_rights=row_rights)
        if not decision.eligible:
            detail = "; ".join(decision.reasons)
            raise ValueError(
                f"Source '{source.source_id}' is not eligible for '{projection.value}': {detail}"
            )
