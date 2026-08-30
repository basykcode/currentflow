"""Authoritative endpoint cache and edge-rate policy registry."""

from dataclasses import dataclass
from enum import StrEnum
from re import Pattern, compile


class EndpointClass(StrEnum):
    PUBLIC_CACHEABLE = "public-cacheable"
    PUBLIC_UNCACHEABLE = "public-uncacheable"
    PRIVATE_NO_STORE = "private-no-store"
    HEALTH = "health"
    ADMINISTRATIVE = "administrative"


class RatePolicyClass(StrEnum):
    ANONYMOUS_PUBLIC_READ = "anonymous-public-read"
    AUTHENTICATED_READ = "authenticated-read"
    SEARCH = "search"
    FORMULA_ANALYSIS = "formula-analysis"
    FUTURE_INTELLIGENCE = "future-intelligence"
    ADMINISTRATIVE_IMPORT = "administrative-import"


@dataclass(frozen=True, slots=True)
class EndpointPolicy:
    endpoint_class: EndpointClass
    rate_class: RatePolicyClass
    cache_control: str = "no-store"


@dataclass(frozen=True, slots=True)
class RegisteredPolicy:
    methods: frozenset[str]
    path: Pattern[str]
    policy: EndpointPolicy


NO_STORE = EndpointPolicy(
    EndpointClass.PUBLIC_UNCACHEABLE,
    RatePolicyClass.ANONYMOUS_PUBLIC_READ,
)
PRIVATE_NO_STORE = EndpointPolicy(
    EndpointClass.PRIVATE_NO_STORE,
    RatePolicyClass.AUTHENTICATED_READ,
    "private, no-store",
)
HEALTH = EndpointPolicy(EndpointClass.HEALTH, RatePolicyClass.ANONYMOUS_PUBLIC_READ)
ADMINISTRATIVE = EndpointPolicy(
    EndpointClass.ADMINISTRATIVE,
    RatePolicyClass.ADMINISTRATIVE_IMPORT,
    "private, no-store",
)
SEARCH = EndpointPolicy(
    EndpointClass.PUBLIC_CACHEABLE,
    RatePolicyClass.SEARCH,
    "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
)
STABLE_RECORD = EndpointPolicy(
    EndpointClass.PUBLIC_CACHEABLE,
    RatePolicyClass.ANONYMOUS_PUBLIC_READ,
    "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
)
FORMULA_ANALYSIS = EndpointPolicy(
    EndpointClass.PUBLIC_UNCACHEABLE,
    RatePolicyClass.FORMULA_ANALYSIS,
)
FUTURE_INTELLIGENCE = EndpointPolicy(
    EndpointClass.PRIVATE_NO_STORE,
    RatePolicyClass.FUTURE_INTELLIGENCE,
    "private, no-store",
)


_REGISTRY: tuple[RegisteredPolicy, ...] = (
    RegisteredPolicy(frozenset({"GET"}), compile(r"^/api/v1/health/(live|ready)$"), HEALTH),
    RegisteredPolicy(
        frozenset({"GET", "POST", "PUT", "PATCH", "DELETE"}),
        compile(r"^/api/v1/(admin|internal|imports)(?:/.*)?$"),
        ADMINISTRATIVE,
    ),
    RegisteredPolicy(
        frozenset({"GET", "POST", "PUT", "PATCH", "DELETE"}),
        compile(r"^/api/v1/(auth|private|users|profiles|subscriptions|memories)(?:/.*)?$"),
        PRIVATE_NO_STORE,
    ),
    RegisteredPolicy(
        frozenset({"GET", "POST"}),
        compile(r"^/api/v1/(intelligence|inquiry)(?:/.*)?$"),
        FUTURE_INTELLIGENCE,
    ),
    RegisteredPolicy(
        frozenset({"POST"}),
        compile(r"^/api/v1/formulas/(analyze|compare)$"),
        FORMULA_ANALYSIS,
    ),
    RegisteredPolicy(
        frozenset({"POST"}),
        compile(r"^/api/v1/(explore/query|retrieval/context)$"),
        PRIVATE_NO_STORE,
    ),
    RegisteredPolicy(
        frozenset({"GET"}),
        compile(r"^/api/v1/(meta|sources|documents|passages|graph/entities/[^/]+/neighborhood)$"),
        STABLE_RECORD,
    ),
    RegisteredPolicy(
        frozenset({"GET"}),
        compile(r"^/api/v1/(search/suggest|text/search|herbs|formulas)$"),
        SEARCH,
    ),
    RegisteredPolicy(
        frozenset({"GET"}),
        compile(r"^/api/v1/(herbs|formulas|sources|documents|passages)/[^/]+$"),
        STABLE_RECORD,
    ),
)


def endpoint_policy(method: str, path: str) -> EndpointPolicy:
    """Return a deny-by-default policy for one HTTP method and path."""

    normalized_method = method.upper()
    for registration in _REGISTRY:
        if normalized_method in registration.methods and registration.path.fullmatch(path):
            return registration.policy
    return NO_STORE


def registered_policies() -> tuple[RegisteredPolicy, ...]:
    """Expose the immutable registry to documentation and contract tests."""

    return _REGISTRY
