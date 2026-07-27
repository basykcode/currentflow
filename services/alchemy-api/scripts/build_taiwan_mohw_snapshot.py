"""Build the pinned Taiwan MOHW materia-medica and standardized-formula snapshot.

This script performs a lossless, deterministic extraction from the official Taiwan
Herbal Pharmacopeia PDF and the Ministry's 200 standardized-formula pages. It does
not infer botanical identity, preparation equivalence, or clinical meaning.
"""

from __future__ import annotations

import argparse
import json
import re
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
from typing import Final
from urllib.error import URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from pypdf import PdfReader

USER_AGENT: Final = "CurrentAlchemy-DataEngineering/0.2 (https://current-flow.net)"
PHARMACOPEIA_URL: Final = (
    "https://www.mohw.gov.tw/dl-71936-0a89f40d-7558-4ab2-8f4b-55e58de6552b.html"
)
PHARMACOPEIA_SHA256: Final = "ca88926998263873522da0098e9046ba30af6c4699e98bf60658668c92a0f964"
FORMULA_ROOT: Final = "https://dep.mohw.gov.tw/DOCMAP/"
FORMULA_LINK: Final = re.compile(r"cp-866-\d+-108\.html")
TOC_ENTRY: Final = re.compile(r"([^\.]+?)\s+\.{3,}\s*(\d+)")
QUANTITY_CONTEXT: Final = re.compile(r"\s*[\(（](?P<context>(?:一日飲片量|適量調敷|外用).*?)[\)）]")
INGREDIENT: Final = re.compile(r"(?P<name>.+?)(?P<amount>\d+(?:\.\d+)?|適量)$")


class PageTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.ignored_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        del attrs
        if tag in {"script", "style"}:
            self.ignored_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"} and self.ignored_depth:
            self.ignored_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self.ignored_depth:
            self.parts.append(data)

    def text(self) -> str:
        return " ".join(" ".join(self.parts).split())


@dataclass(frozen=True, slots=True)
class FormulaIndexEntry:
    sequence: int
    url: str


def _sha256(path: Path) -> str:
    digest = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _download(url: str, *, attempts: int = 5) -> bytes:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            request = Request(url, headers={"User-Agent": USER_AGENT})
            with urlopen(request, timeout=60) as response:
                return response.read()
        except (OSError, URLError) as error:
            last_error = error
            time.sleep(0.5 * (attempt + 1))
    raise RuntimeError(f"failed to download {url}") from last_error


def _page_text(payload: bytes) -> str:
    parser = PageTextParser()
    parser.feed(payload.decode("utf-8"))
    return parser.text()


def _between(value: str, start: str, end: str) -> str:
    try:
        return value.split(start, maxsplit=1)[1].split(end, maxsplit=1)[0].strip()
    except IndexError as error:
        raise ValueError(f"official formula page is missing {start!r} or {end!r}") from error


def _formula_index_urls() -> list[FormulaIndexEntry]:
    index_urls: list[str] = []
    for category in (1, 2):
        for page in range(1, 6):
            suffix = (
                f"lp-866-108-xCat-{category}.html"
                if page == 1
                else f"lp-866-108-xCat-{category}-{page}-20.html"
            )
            index_urls.append(urljoin(FORMULA_ROOT, suffix))

    with ThreadPoolExecutor(max_workers=3) as executor:
        pages = list(executor.map(_download, index_urls))

    ordered: list[str] = []
    for payload in pages:
        html = payload.decode("utf-8")
        for match in FORMULA_LINK.finditer(html):
            url = urljoin(FORMULA_ROOT, match.group(0))
            if url not in ordered:
                ordered.append(url)
    if len(ordered) != 200:
        raise ValueError(f"expected 200 official formula pages, found {len(ordered)}")
    return [
        FormulaIndexEntry(sequence=index, url=url) for index, url in enumerate(ordered, start=1)
    ]


def _parse_ingredients(prescription: str) -> tuple[list[dict[str, object]], str]:
    context_match = QUANTITY_CONTEXT.search(prescription)
    if context_match is None:
        raise ValueError(f"prescription has no recognized quantity context: {prescription}")
    composition = prescription[: context_match.start()].strip(" 。")
    context = context_match.group("context").strip()
    unit = "g" if "一日飲片量" in context and "克" in context else ""
    ingredients: list[dict[str, object]] = []
    for position, part in enumerate(re.split(r"[、，,]", composition), start=1):
        source_term = part.strip()
        if not source_term:
            continue
        match = INGREDIENT.fullmatch(source_term)
        if match is None:
            raise ValueError(f"unrecognized ingredient entry: {source_term}")
        ingredients.append(
            {
                "position": position,
                "name": match.group("name").strip(),
                "amountText": match.group("amount"),
                "unit": unit,
                "quantityContext": context,
                "role": "base_composition",
            }
        )
    if not ingredients:
        raise ValueError("formula has no parsed ingredients")
    return ingredients, context


def _parse_formula(entry: FormulaIndexEntry, payload: bytes) -> dict[str, object]:
    text = _page_text(payload)
    reported_item = _between(text, "項次：", "方名：")
    name = _between(text, "方名：", "出典：")
    source_text = _between(text, "出典：", "效能：")
    efficacy = _between(text, "效能：", "適應症：")
    indications = _between(text, "適應症：", "處方：")
    prescription = _between(text, "處方：", "注意事項：")
    cautions = _between(text, "注意事項：", "回上一頁")
    ingredients, quantity_context = _parse_ingredients(prescription)
    dosage_match = re.search(r"《([^》]+)》", name)
    return {
        "sequence": entry.sequence,
        "reportedItem": reported_item,
        "name": name,
        "dosageForm": dosage_match.group(1) if dosage_match else None,
        "sourceText": source_text,
        "efficacy": efficacy,
        "indications": indications,
        "prescription": prescription,
        "cautions": cautions,
        "quantityContext": quantity_context,
        "sourceUrl": entry.url,
        "ingredients": ingredients,
    }


def _extract_materials(pdf_path: Path) -> list[dict[str, object]]:
    if _sha256(pdf_path) != PHARMACOPEIA_SHA256:
        raise ValueError(
            "Taiwan Herbal Pharmacopeia PDF checksum does not match the pinned release"
        )
    reader = PdfReader(pdf_path)
    entries: list[dict[str, object]] = []
    toc_order = 0
    reached_concentrates = False
    for pdf_page_index in range(154, 160):
        text = reader.pages[pdf_page_index].extract_text(extraction_mode="layout")
        for line in text.splitlines():
            for match in TOC_ENTRY.finditer(line):
                name = " ".join(match.group(1).split())
                if "濃縮製劑" in name:
                    reached_concentrates = True
                    break
                if name == "薑":
                    continue
                toc_order += 1
                entries.append(
                    {
                        "tocOrder": toc_order,
                        "name": name,
                        "monographPage": int(match.group(2)),
                        "tocPdfPage": pdf_page_index + 1,
                    }
                )
            if reached_concentrates:
                break
        if reached_concentrates:
            break
    if len(entries) != 355:
        raise ValueError(f"expected 355 medicinal-material monographs, found {len(entries)}")
    if len({str(entry["name"]) for entry in entries}) != len(entries):
        raise ValueError("medicinal-material names are not unique")
    return entries


def build_snapshot(pdf_path: Path, retrieved_date: str, workers: int) -> dict[str, object]:
    materials = _extract_materials(pdf_path)
    index_entries = _formula_index_urls()
    with ThreadPoolExecutor(max_workers=workers) as executor:
        pages = list(executor.map(lambda item: _download(item.url), index_entries))
    formulas = [
        _parse_formula(entry, payload) for entry, payload in zip(index_entries, pages, strict=True)
    ]
    if [int(formula["sequence"]) for formula in formulas] != list(range(1, 201)):
        raise ValueError("formula index sequence is incomplete")
    reported_items = [int(str(formula["reportedItem"])) for formula in formulas]
    source_anomalies: list[dict[str, object]] = []
    if reported_items != list(range(1, 201)):
        source_anomalies.append(
            {
                "code": "reported-item-sequence",
                "description": (
                    "The official detail pages report item 122 twice and omit item 123; "
                    "the ordered official index supplies sequence 123 for 橘核丸《丸》."
                ),
                "reportedItems": reported_items,
            }
        )
    ingredient_uses = sum(len(formula["ingredients"]) for formula in formulas)
    return {
        "schemaVersion": "taiwan-mohw-foundation-snapshot-v1",
        "retrievedDate": retrieved_date,
        "source": {
            "organization": (
                "Taiwan Ministry of Health and Welfare, Department of Chinese Medicine and Pharmacy"
            ),
            "pharmacopeiaUrl": PHARMACOPEIA_URL,
            "pharmacopeiaSha256": PHARMACOPEIA_SHA256,
            "formulaIndexUrl": urljoin(FORMULA_ROOT, "lp-866-108-10-20.html"),
            "licenseUrl": "https://www.mohw.gov.tw/cp-81-155-1.html",
        },
        "counts": {
            "medicinalMaterialMonographs": len(materials),
            "standardizedFormulas": len(formulas),
            "baseIngredientUses": ingredient_uses,
        },
        "sourceAnomalies": source_anomalies,
        "materiaMedica": materials,
        "formulas": formulas,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pharmacopeia-pdf", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--retrieved-date", required=True)
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()
    if args.workers < 1 or args.workers > 8:
        raise ValueError("--workers must be between 1 and 8")

    temporary_path: Path | None = None
    pdf_path = args.pharmacopeia_pdf
    if pdf_path is None:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as stream:
            stream.write(_download(PHARMACOPEIA_URL))
            temporary_path = Path(stream.name)
        pdf_path = temporary_path
    try:
        snapshot = build_snapshot(pdf_path, args.retrieved_date, args.workers)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("w", encoding="utf-8", newline="\n") as stream:
            stream.write(f"{json.dumps(snapshot, ensure_ascii=False, indent=2, sort_keys=True)}\n")
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
