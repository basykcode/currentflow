"""Build the pinned multilingual name projection for the Taiwan MOHW foundation."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path
from typing import cast

from pypdf import PdfReader
from pypinyin import Style, load_phrases_dict, pinyin

_INDEX_PAGE_START = 634
_INDEX_PAGE_END = 650
_EDITORIAL_FORM = re.compile(r"《[^》]+》")
_PARENTHETICAL = re.compile(r"[\uff08(][^\uff09)]*[\uff09)]")
_PAGE_NUMBER = re.compile(r"\s+\d+$")
_FORMULA_NAME = re.compile(r"\u65b9\u540d\s+([^\sA-Za-z]+)\s+(?:[A-Za-z-]+\s+)?\(([A-Za-z-]+)\)")


def _normalized(value: str) -> str:
    return unicodedata.normalize("NFKC", value)


def _plain_pinyin(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value)
    return "".join(character for character in decomposed if not unicodedata.combining(character))


def _load_json(path: Path) -> dict[str, object]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return cast(dict[str, object], value)


def _object_list(value: object, label: str) -> list[dict[str, object]]:
    if not isinstance(value, list) or not all(isinstance(item, dict) for item in value):
        raise ValueError(f"{label} must be a list of objects")
    return cast(list[dict[str, object]], value)


def _string_map(value: object, label: str) -> dict[str, str]:
    if not isinstance(value, dict) or not all(
        isinstance(key, str) and isinstance(item, str) for key, item in value.items()
    ):
        raise ValueError(f"{label} must be a string-to-string object")
    return cast(dict[str, str], value)


def _string_list(value: object, label: str) -> list[str]:
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise ValueError(f"{label} must be a list of strings")
    return cast(list[str], value)


def _extract_official_material_english(
    pharmacopeia: Path,
    material_names: list[str],
) -> dict[str, str]:
    normalized_to_source = {_normalized(name): name for name in material_names}
    ordered_names = sorted(normalized_to_source, key=len, reverse=True)
    found: dict[str, str] = {}
    reader = PdfReader(pharmacopeia)
    for page in reader.pages[_INDEX_PAGE_START:_INDEX_PAGE_END]:
        text = _normalized(page.extract_text() or "")
        for raw_line in text.splitlines():
            line = " ".join(raw_line.split())
            for normalized_name in ordered_names:
                prefix = f"{normalized_name} "
                if not line.startswith(prefix):
                    continue
                english = _PAGE_NUMBER.sub("", line[len(prefix) :].strip())
                if english and not english.isupper():
                    found[normalized_to_source[normalized_name]] = english
                break
    missing = sorted(set(material_names) - set(found))
    if missing:
        raise ValueError(f"THP4 English index is missing {len(missing)} names: {missing}")
    return found


def _extract_official_formula_ascii(formula_compendium: Path) -> dict[str, str]:
    reader = PdfReader(formula_compendium)
    text = "\n".join(_normalized(page.extract_text() or "") for page in reader.pages)
    return {
        chinese: romanization.replace("-", " ")
        for chinese, romanization in _FORMULA_NAME.findall(text)
    }


def _pinyin_override_dictionary(overrides: dict[str, str]) -> dict[str, list[list[str]]]:
    values: dict[str, list[list[str]]] = {}
    for phrase, romanization in overrides.items():
        syllables = romanization.split()
        if len(syllables) != len(phrase):
            continue
        values[phrase] = [[syllable.lower()] for syllable in syllables]
    return values


def _toned_pinyin(value: str) -> str:
    parts: list[str] = []
    for result in pinyin(value, style=Style.TONE, errors=lambda text: list(text)):
        token = result[0]
        parts.append(token[:1].upper() + token[1:] if token and token[0].isalpha() else token)
    rendered = " ".join(parts)
    return (
        rendered.replace(" \uff08 ", " (")
        .replace(" \uff09", ")")
        .replace("\uff08 ", "(")
        .replace(" / ", " / ")
        .replace(" 《 ", " 《")
        .replace(" 》", "》")
    )


def _formula_lexical_name(source_name: str) -> str:
    without_editorial_form = _EDITORIAL_FORM.sub("", source_name)
    return _PARENTHETICAL.sub("", without_editorial_form).strip()


def _formula_official_ascii(
    source_name: str,
    official: dict[str, str],
) -> str | None:
    lexical_name = _formula_lexical_name(source_name)
    return official.get(lexical_name)


def build(
    *,
    snapshot_path: Path,
    seed_path: Path,
    pharmacopeia_path: Path,
    formula_compendium_path: Path,
) -> dict[str, object]:
    snapshot = _load_json(snapshot_path)
    seed = _load_json(seed_path)
    monographs = _object_list(snapshot.get("materiaMedica"), "materiaMedica")
    formulas = _object_list(snapshot.get("formulas"), "formulas")
    formula_english = _string_list(
        seed.get("formulaEnglishBySequence"),
        "formulaEnglishBySequence",
    )
    formula_only_english = _string_map(
        seed.get("formulaOnlyMaterialEnglish"),
        "formulaOnlyMaterialEnglish",
    )
    overrides = _string_map(seed.get("pinyinPhraseOverrides"), "pinyinPhraseOverrides")
    load_phrases_dict(_pinyin_override_dictionary(overrides))

    if len(monographs) != 355 or len(formulas) != 200 or len(formula_english) != 200:
        raise ValueError("the multilingual seed must cover the complete pinned foundation")

    monograph_names = [str(item["name"]) for item in monographs]
    official_material_english = _extract_official_material_english(
        pharmacopeia_path,
        monograph_names,
    )
    ingredient_names = {
        str(ingredient["name"])
        for formula in formulas
        for ingredient in _object_list(formula.get("ingredients"), "formulas[].ingredients")
    }
    formula_only_names = ingredient_names - set(monograph_names)
    if formula_only_names != set(formula_only_english):
        missing = sorted(formula_only_names - set(formula_only_english))
        extra = sorted(set(formula_only_english) - formula_only_names)
        raise ValueError(
            f"formula-only material coverage mismatch: missing={missing}, extra={extra}"
        )

    official_formula_ascii = _extract_official_formula_ascii(formula_compendium_path)
    material_rows = []
    for name in monograph_names:
        toned = _toned_pinyin(name)
        material_rows.append(
            {
                "chineseTraditional": name,
                "english": official_material_english[name],
                "englishProvenance": "taiwan_mohw_thp4_official_common_name",
                "pinyin": toned,
                "pinyinAscii": _plain_pinyin(toned),
                "pinyinProvenance": "pypinyin-0.55.0-hanyu-pinyin-with-curated-polyphones",
                "scope": "official_monograph",
            }
        )
    for name in sorted(formula_only_names):
        toned = _toned_pinyin(name)
        material_rows.append(
            {
                "chineseTraditional": name,
                "english": formula_only_english[name],
                "englishProvenance": "current_flow_conservative_exact_term_translation_v1",
                "pinyin": toned,
                "pinyinAscii": _plain_pinyin(toned),
                "pinyinProvenance": "pypinyin-0.55.0-hanyu-pinyin-with-curated-polyphones",
                "scope": (
                    "prepared_material"
                    if name == "\u6cb9\u8cea\u57fa\u5291"
                    else "official_formula_ingredient_term"
                ),
            }
        )

    formula_rows = []
    official_formula_references = 0
    official_formula_matches = 0
    for formula, english in zip(formulas, formula_english, strict=True):
        source_name = str(formula["name"])
        lexical_name = _formula_lexical_name(source_name)
        toned = _toned_pinyin(lexical_name)
        pinyin_ascii = _plain_pinyin(toned)
        official_ascii = _formula_official_ascii(source_name, official_formula_ascii)
        if official_ascii is not None:
            official_formula_references += 1
            if pinyin_ascii == official_ascii:
                official_formula_matches += 1
        formula_rows.append(
            {
                "sequence": int(cast(int, formula["sequence"])),
                "chineseTraditional": source_name,
                "english": english,
                "englishProvenance": "current_flow_conventional_formula_translation_v1",
                "pinyin": toned,
                "pinyinAscii": pinyin_ascii,
                "pinyinProvenance": (
                    "pypinyin-0.55.0-hanyu-pinyin-cross-checked-taiwan-mohw"
                    if official_ascii == pinyin_ascii
                    else "pypinyin-0.55.0-hanyu-pinyin-with-curated-polyphones"
                ),
                "officialMohwPinyinAscii": official_ascii,
            }
        )

    return {
        "schemaVersion": "taiwan-mohw-multilingual-names-v1",
        "sources": {
            "materialEnglish": "Taiwan Herbal Pharmacopeia 4th edition English index",
            "formulaPinyin": (
                "Taiwan MOHW Common Formula Efficacy and Indications Semantic Analysis "
                "and English Translation Compendium (2021)"
            ),
            "derivedNames": seed_path.name,
            "pinyinEngine": "pypinyin 0.55.0 (MIT)",
        },
        "counts": {
            "materials": len(material_rows),
            "officialMaterialEnglishNames": len(official_material_english),
            "formulas": len(formula_rows),
            "officialFormulaPinyinMatches": official_formula_matches,
            "officialFormulaRomanizationReferences": official_formula_references,
        },
        "materials": sorted(material_rows, key=lambda item: str(item["chineseTraditional"])),
        "formulas": formula_rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot", type=Path, required=True)
    parser.add_argument("--seed", type=Path, required=True)
    parser.add_argument("--pharmacopeia", type=Path, required=True)
    parser.add_argument("--formula-compendium", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = build(
        snapshot_path=args.snapshot,
        seed_path=args.seed,
        pharmacopeia_path=args.pharmacopeia,
        formula_compendium_path=args.formula_compendium,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="\n") as output:
        output.write(f"{json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True)}\n")


if __name__ == "__main__":
    main()
