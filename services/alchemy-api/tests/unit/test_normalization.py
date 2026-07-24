from current_alchemy.domain.common.normalization import (
    normalize_ascii_pinyin,
    normalize_name,
    normalize_source_text,
)


def test_unicode_and_name_normalization_preserves_source_but_normalizes_lookup() -> None:
    assert normalize_source_text("  Hua\u0301ng   Qi\u0301  ") == "Huáng Qí"
    assert normalize_name("  Astragalus—ROOT! ") == "astragalus root"
    assert normalize_ascii_pinyin("Huáng Qí") == "huang qi"


def test_english_matching_is_case_insensitive_without_declaring_identity() -> None:
    assert normalize_name("Demo Root") == normalize_name("demo root")
    assert normalize_name("Demo Root") != normalize_name("Demo Seed")
