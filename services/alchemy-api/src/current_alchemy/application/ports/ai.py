"""Future local-model ports; disabled in this release."""

from typing import Protocol

from current_alchemy.domain.texts.models import RetrievalPackage


class EmbeddingProvider(Protocol):
    async def embed(self, texts: list[str]) -> list[list[float]]: ...


class RetrievalProvider(Protocol):
    async def retrieve(self, query: str) -> RetrievalPackage: ...


class SynthesisProvider(Protocol):
    async def synthesize(self, context: RetrievalPackage) -> str: ...


class InquiryProvider(Protocol):
    async def inquire(self, question: str) -> str: ...


class ModelNotConnectedError(RuntimeError):
    """Raised by deliberately disabled future AI implementations."""


class DisabledSynthesisProvider:
    async def synthesize(self, context: RetrievalPackage) -> str:
        del context
        raise ModelNotConnectedError("No synthesis model is configured.")
