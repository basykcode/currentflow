"""Conservative name and identifier normalization."""

import re
import unicodedata

_PUNCTUATION = re.compile(r"[^\w\s-]", flags=re.UNICODE)
_WHITESPACE = re.compile(r"\s+")
_DIACRITICS = re.compile(r"[\u0300-\u036f]")


def normalize_source_text(value: str) -> str:
    """Normalize Unicode and whitespace while retaining case and source characters."""

    return _WHITESPACE.sub(" ", unicodedata.normalize("NFC", value).strip())


def normalize_name(value: str, *, casefold: bool = True) -> str:
    """Create a conservative lookup key without asserting entity identity."""

    normalized = normalize_source_text(value)
    normalized = _PUNCTUATION.sub(" ", normalized)
    normalized = _WHITESPACE.sub(" ", normalized).strip()
    return normalized.casefold() if casefold else normalized


def normalize_ascii_pinyin(value: str) -> str:
    """Remove tone marks for lookup while preserving supplied tone-marked pinyin elsewhere."""

    decomposed = unicodedata.normalize("NFKD", normalize_source_text(value))
    without_marks = _DIACRITICS.sub("", decomposed)
    ascii_value = without_marks.encode("ascii", "ignore").decode("ascii")
    return normalize_name(ascii_value)
