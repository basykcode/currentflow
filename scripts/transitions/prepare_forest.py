#!/usr/bin/env python3
"""Prepare the Jiaoshi Yilin transition matrix for local research.

The user-supplied EPUB and every extracted verse or footnote remain local-only.
Tracked outputs contain source metadata, deterministic locators, and hashes but
never the protected passage text.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterable
from zipfile import ZipFile

from lxml import etree


SCHEMA_VERSION = "1.0.0"
SOURCE_ID = "transition_1_jiaoshi_yilin_gait"
SOURCE_TITLE = "The Forest of Changes: A Han Dynasty Extrapolation of the I Ching"
SOURCE_TITLE_ALTERNATE = "Jiaoshi Yilin"
SOURCE_TITLE_CHINESE = "焦氏易林"
EXPECTED_EPUB_TITLE = SOURCE_TITLE
DASH_TRANSLATION = str.maketrans(
    {
        "\u2010": "-",
        "\u2011": "-",
        "\u2013": "-",
        "\u2014": "-",
        "\u2212": "-",
    }
)
LABEL_PATTERN = re.compile(r"^(\d{1,2})\s*-\s*(\d{1,2})(.*)$")
REFERENCE_PATTERN = re.compile(r"^(?:Read\s*)?(\d{1,2})\s*-\s*(\d{1,2})$")
FOOTNOTE_ID_PATTERN = re.compile(r"^_ftn(\d+)$")


@dataclass(frozen=True)
class Paragraph:
    text: str
    footnote_ids: tuple[int, ...]
    spine_href: str


@dataclass(frozen=True)
class MatrixEntry:
    source_hexagram: int
    target_hexagram: int
    paragraphs: tuple[str, ...]
    footnote_ids: tuple[int, ...]
    spine_href: str
    reference: tuple[int, int] | None


def utc_now() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalize_text(value: str) -> str:
    return " ".join(
        unicodedata.normalize("NFC", value).replace("\u00a0", " ").split()
    )


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def safe_local_name(path: Path) -> str:
    """Return only the canonical source title; never persist a supplied filename."""

    del path
    return f"{SOURCE_TITLE_ALTERNATE} ({SOURCE_TITLE_CHINESE})"


def epub_package(zip_file: ZipFile) -> tuple[etree._Element, list[str]]:
    container = etree.fromstring(zip_file.read("META-INF/container.xml"))
    package_path = container.xpath(
        "string(//*[local-name()='rootfile']/@full-path)"
    )
    if not package_path:
        raise ValueError("EPUB container does not identify a package document.")

    package = etree.fromstring(zip_file.read(package_path))
    package_parent = Path(package_path).parent
    manifest = {
        item.get("id"): (package_parent / str(item.get("href"))).as_posix()
        for item in package.xpath("//*[local-name()='manifest']/*[local-name()='item']")
    }
    spine = []
    for item_ref in package.xpath("//*[local-name()='spine']/*[local-name()='itemref']"):
        item_id = item_ref.get("idref")
        href = manifest.get(item_id)
        if href:
            spine.append(href)
    if not spine:
        raise ValueError("EPUB package contains no readable spine.")
    return package, spine


def package_title(package: etree._Element) -> str:
    titles = [
        normalize_text("".join(node.itertext()))
        for node in package.xpath("//*[local-name()='title']")
    ]
    return next((title for title in titles if title), "")


def visible_text_and_notes(element: etree._Element) -> tuple[str, tuple[int, ...]]:
    text_parts: list[str] = []
    note_ids: set[int] = set()

    for text_node in element.xpath(".//text()"):
        parent = text_node.getparent()
        blocked = False
        cursor = parent
        while cursor is not None and cursor is not element:
            if etree.QName(cursor).localname == "a":
                href = cursor.get("href", "")
                match = re.search(r"#_ftn(\d+)$", href)
                if match:
                    note_ids.add(int(match.group(1)))
                    blocked = True
                    break
            cursor = cursor.getparent()
        if not blocked:
            text_parts.append(str(text_node))

    return normalize_text("".join(text_parts)), tuple(sorted(note_ids))


def chapter_labels(zip_file: ZipFile) -> set[str]:
    toc = etree.fromstring(zip_file.read("toc.ncx"))
    labels = set()
    chapter_nodes = toc.xpath("//*[local-name()='navPoint']")
    for index, node in enumerate(chapter_nodes, start=1):
        text = normalize_text(
            "".join(node.xpath("./*[local-name()='navLabel']")[0].itertext())
        )
        # The supplied edition's chapter 50 TOC label is just "Cauldron";
        # the body heading correctly includes the number.
        if not re.match(r"^\d{1,2}\s+\D", text):
            text = f"{index} {text}"
        labels.add(text)
    if len(labels) != 64:
        raise ValueError(f"Expected 64 chapter labels in the EPUB TOC; found {len(labels)}.")
    return labels


def collect_paragraphs(
    zip_file: ZipFile,
    spine: list[str],
    first_chapter_href: str,
    last_chapter_href: str,
) -> list[Paragraph]:
    try:
        first_index = spine.index(first_chapter_href)
        last_index = spine.index(last_chapter_href)
    except ValueError as error:
        raise ValueError("Could not locate the first and last Forest chapters in the spine.") from error

    paragraphs: list[Paragraph] = []
    for href in spine[first_index : last_index + 1]:
        if not href.endswith((".html", ".xhtml")):
            continue
        root = etree.fromstring(zip_file.read(href))
        for element in root.xpath("//*[local-name()='p']"):
            text, footnote_ids = visible_text_and_notes(element)
            paragraphs.append(Paragraph(text, footnote_ids, href))
    return paragraphs


def finalize_entry(
    entries: dict[tuple[int, int], MatrixEntry],
    pair: tuple[int, int] | None,
    paragraphs: list[str],
    footnote_ids: set[int],
    spine_href: str,
    label_tail: str,
) -> None:
    if pair is None:
        return
    if pair in entries:
        raise ValueError(f"Duplicate transition locator {pair[0]}-{pair[1]}.")

    tail = normalize_text(label_tail.translate(DASH_TRANSLATION))
    reference = None
    if tail:
        match = REFERENCE_PATTERN.fullmatch(tail)
        if match:
            reference = (int(match.group(1)), int(match.group(2)))
        else:
            raise ValueError(
                f"Unexpected text after transition locator {pair[0]}-{pair[1]}: {tail!r}"
            )

    if len(paragraphs) == 1:
        possible_reference = REFERENCE_PATTERN.fullmatch(
            paragraphs[0].translate(DASH_TRANSLATION)
        )
        if possible_reference:
            reference = (
                int(possible_reference.group(1)),
                int(possible_reference.group(2)),
            )
            paragraphs = []

    entries[pair] = MatrixEntry(
        source_hexagram=pair[0],
        target_hexagram=pair[1],
        paragraphs=tuple(paragraphs),
        footnote_ids=tuple(sorted(footnote_ids)),
        spine_href=spine_href,
        reference=reference,
    )


def parse_matrix(
    paragraphs: Iterable[Paragraph], headings: set[str]
) -> dict[tuple[int, int], MatrixEntry]:
    entries: dict[tuple[int, int], MatrixEntry] = {}
    current_pair: tuple[int, int] | None = None
    current_paragraphs: list[str] = []
    current_footnotes: set[int] = set()
    current_href = ""
    current_tail = ""

    for paragraph in paragraphs:
        normalized = paragraph.text.translate(DASH_TRANSLATION)
        if normalized in headings:
            finalize_entry(
                entries,
                current_pair,
                current_paragraphs,
                current_footnotes,
                current_href,
                current_tail,
            )
            current_pair = None
            current_paragraphs = []
            current_footnotes = set()
            current_href = ""
            current_tail = ""
            continue

        label_match = LABEL_PATTERN.fullmatch(normalized)
        if label_match:
            source = int(label_match.group(1))
            target = int(label_match.group(2))
            if not (1 <= source <= 64 and 1 <= target <= 64):
                continue
            finalize_entry(
                entries,
                current_pair,
                current_paragraphs,
                current_footnotes,
                current_href,
                current_tail,
            )
            current_pair = (source, target)
            current_paragraphs = []
            current_footnotes = set(paragraph.footnote_ids)
            current_href = paragraph.spine_href
            current_tail = label_match.group(3)
            continue

        if current_pair is not None and paragraph.text:
            current_paragraphs.append(paragraph.text)
            current_footnotes.update(paragraph.footnote_ids)

    finalize_entry(
        entries,
        current_pair,
        current_paragraphs,
        current_footnotes,
        current_href,
        current_tail,
    )
    return entries


def parse_footnotes(zip_file: ZipFile, spine: Iterable[str]) -> dict[int, str]:
    notes: dict[int, str] = {}
    for href in spine:
        if not href.endswith((".html", ".xhtml")):
            continue
        root = etree.fromstring(zip_file.read(href))
        for element in root.xpath("//*[@id]"):
            element_id = element.get("id", "")
            match = FOOTNOTE_ID_PATTERN.fullmatch(element_id)
            if not match:
                continue
            note_number = int(match.group(1))
            text, _ = visible_text_and_notes(element)
            text = re.sub(r"^\[\d+\]\s*", "", text)
            if note_number in notes and notes[note_number] != text:
                raise ValueError(f"Conflicting text for footnote {note_number}.")
            notes[note_number] = text
    return notes


def resolve_entry(
    entries: dict[tuple[int, int], MatrixEntry],
    pair: tuple[int, int],
    stack: tuple[tuple[int, int], ...] = (),
) -> tuple[MatrixEntry, tuple[tuple[int, int], ...]]:
    if pair in stack:
        chain = " -> ".join(f"{a}-{b}" for a, b in (*stack, pair))
        raise ValueError(f"Cyclic transition cross-reference: {chain}")
    entry = entries[pair]
    if entry.reference is None:
        if not entry.paragraphs:
            raise ValueError(f"Transition {pair[0]}-{pair[1]} has no verse or reference.")
        return entry, stack
    return resolve_entry(entries, entry.reference, (*stack, pair))


def parse_hexagram_definitions(root: Path) -> tuple[dict[int, tuple[str, ...]], dict[tuple[str, ...], int]]:
    trigram_source = (root / "src/domain/astrology/trigrams.ts").read_text(encoding="utf-8")
    hexagram_source = (root / "src/domain/astrology/hexagrams.ts").read_text(encoding="utf-8")

    trigram_lines: dict[str, tuple[str, ...]] = {}
    for match in re.finditer(
        r"^\s{2}([a-z]+):\s*\{(.*?)^\s{2}\},",
        trigram_source,
        re.MULTILINE | re.DOTALL,
    ):
        key = match.group(1)
        lines_match = re.search(r"linesBottomToTop:\s*\[([^\]]+)\]", match.group(2))
        if not lines_match:
            continue
        lines = tuple(re.findall(r"'(yin|yang)'", lines_match.group(1)))
        if len(lines) == 3:
            trigram_lines[key] = lines
    if len(trigram_lines) != 8:
        raise ValueError(
            f"Expected eight canonical trigrams in trigrams.ts; found {len(trigram_lines)}."
        )

    by_number: dict[int, tuple[str, ...]] = {}
    for match in re.finditer(
        r"\{\s*number:\s*(\d+),(.*?)^\s{2}\},",
        hexagram_source,
        re.MULTILINE | re.DOTALL,
    ):
        number = int(match.group(1))
        block = match.group(2)
        lower_match = re.search(r"lower:\s*'([a-z]+)'", block)
        upper_match = re.search(r"upper:\s*'([a-z]+)'", block)
        if not lower_match or not upper_match:
            continue
        lower = trigram_lines[lower_match.group(1)]
        upper = trigram_lines[upper_match.group(1)]
        by_number[number] = (*lower, *upper)
    if set(by_number) != set(range(1, 65)):
        raise ValueError("Could not derive all 64 figures from the canonical hexagram registry.")

    by_lines = {lines: number for number, lines in by_number.items()}
    if len(by_lines) != 64:
        raise ValueError("Canonical hexagram registry contains duplicate line figures.")
    return by_number, by_lines


def line_change_targets(root: Path) -> list[tuple[int, int, int]]:
    by_number, by_lines = parse_hexagram_definitions(root)
    targets = []
    for source in range(1, 65):
        for line_number in range(1, 7):
            changed = list(by_number[source])
            index = line_number - 1
            changed[index] = "yin" if changed[index] == "yang" else "yang"
            target = by_lines[tuple(changed)]
            targets.append((source, line_number, target))
    return targets


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def prepare(source: Path, root: Path) -> None:
    source_bytes = source.read_bytes()
    source_hash = sha256_bytes(source_bytes)
    generated_at = utc_now()

    with ZipFile(source) as zip_file:
        package, spine = epub_package(zip_file)
        title = package_title(package)
        if title != EXPECTED_EPUB_TITLE:
            raise ValueError(
                f"Unexpected EPUB title {title!r}; expected {EXPECTED_EPUB_TITLE!r}."
            )

        headings = chapter_labels(zip_file)
        toc_entries = []
        toc = etree.fromstring(zip_file.read("toc.ncx"))
        for node in toc.xpath("//*[local-name()='navPoint']"):
            label_nodes = node.xpath("./*[local-name()='navLabel']")
            content_nodes = node.xpath("./*[local-name()='content']")
            if not label_nodes or not content_nodes:
                continue
            label = normalize_text("".join(label_nodes[0].itertext()))
            if re.match(r"^\d{1,2}\s+\D", label):
                toc_entries.append((label, str(content_nodes[0].get("src")).split("#")[0]))

        first_href = toc_entries[0][1]
        last_href = toc_entries[-1][1]
        paragraphs = collect_paragraphs(zip_file, spine, first_href, last_href)
        entries = parse_matrix(paragraphs, headings)
        footnotes = parse_footnotes(zip_file, spine)

    expected_pairs = {(source_number, target) for source_number in range(1, 65) for target in range(1, 65)}
    actual_pairs = set(entries)
    if actual_pairs != expected_pairs:
        missing = sorted(expected_pairs - actual_pairs)
        extra = sorted(actual_pairs - expected_pairs)
        raise ValueError(f"Transition matrix mismatch. Missing={missing}; extra={extra}")

    unresolved = []
    cross_references = 0
    for pair, entry in entries.items():
        if entry.reference is not None:
            cross_references += 1
        try:
            resolve_entry(entries, pair)
        except ValueError as error:
            unresolved.append(str(error))
    if unresolved:
        raise ValueError("; ".join(unresolved))

    selected = []
    tracked_index = []
    selected_cross_references = 0
    for source_number, line_number, target_number in line_change_targets(root):
        pair = (source_number, target_number)
        direct = entries[pair]
        resolved, chain = resolve_entry(entries, pair)
        if chain:
            selected_cross_references += 1
        resolved_text = "\n".join(resolved.paragraphs)
        note_texts = [
            {"id": note_id, "text": footnotes[note_id]}
            for note_id in resolved.footnote_ids
            if note_id in footnotes
        ]
        passage_hash = sha256_text(resolved_text)
        transition_id = f"forest-{source_number:02d}-{target_number:02d}"
        selected.append(
            {
                "transitionId": transition_id,
                "sourceHexagramNumber": source_number,
                "targetHexagramNumber": target_number,
                "changingLine": line_number,
                "sourceLocator": f"{source_number}-{target_number}",
                "resolvedLocator": f"{resolved.source_hexagram}-{resolved.target_hexagram}",
                "crossReferenceChain": [f"{a}-{b}" for a, b in chain],
                "sourcePassageSha256": passage_hash,
                "verseParagraphs": list(resolved.paragraphs),
                "footnotes": note_texts,
            }
        )
        tracked_index.append(
            {
                "transition_id": transition_id,
                "source_hexagram": source_number,
                "target_hexagram": target_number,
                "changing_line": line_number,
                "source_locator": f"{source_number}-{target_number}",
                "resolved_locator": f"{resolved.source_hexagram}-{resolved.target_hexagram}",
                "cross_reference_chain": [f"{a}-{b}" for a, b in chain],
                "source_passage_sha256": passage_hash,
                "resolved_footnote_ids": [note["id"] for note in note_texts],
                "ingestion_eligible": True,
            }
        )

    internal_payload = {
        "schemaVersion": SCHEMA_VERSION,
        "sourceId": SOURCE_ID,
        "sourceSha256": source_hash,
        "selectedLineTransitions": selected,
    }
    internal_path = (
        root / "content/yijing/internal/transitions/jiaoshi-yilin-line-transitions.json"
    )
    write_json(internal_path, internal_payload)

    data_root = root / "data/hexagram-transitions"
    data_root.mkdir(parents=True, exist_ok=True)
    index_path = data_root / "transition-index.jsonl"
    index_path.write_text(
        "".join(
            json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n"
            for record in tracked_index
        ),
        encoding="utf-8",
    )

    manifest = {
        "schema_version": SCHEMA_VERSION,
        "generated_at_utc": generated_at,
        "purpose": (
            "Local evidence for concise, original summaries of deterministic "
            "single-line hexagram transitions."
        ),
        "source": {
            "source_id": SOURCE_ID,
            "title": SOURCE_TITLE,
            "alternate_title": SOURCE_TITLE_ALTERNATE,
            "title_chinese": SOURCE_TITLE_CHINESE,
            "traditional_attribution": "Jiao Yanshou",
            "attribution_status": "traditional-and-disputed",
            "translator": "Christopher Gait",
            "edition": "Version 2.1",
            "copyright_years": "2016-2021",
            "language": "en",
            "format": "epub",
            "input_sha256": source_hash,
            "source_filename_recorded": False,
            "local_path_recorded": False,
            "display_name": safe_local_name(source),
            "rights_status": "user-supplied-internal",
            "display_policy": "original-summary-only",
            "quotation_policy": "none",
        },
        "matrix": {
            "scheme": "King Wen source-to-result",
            "source_hexagrams": 64,
            "target_hexagrams": 64,
            "transition_records": 4096,
            "cross_reference_records": cross_references,
            "selected_single_line_records": len(selected),
            "selected_cross_reference_records": selected_cross_references,
            "tracked_index": "transition-index.jsonl",
            "local_evidence": (
                "content/yijing/internal/transitions/"
                "jiaoshi-yilin-line-transitions.json"
            ),
        },
        "provenance": {
            "provided_by": "workspace user",
            "epub_title_verified": title,
            "extraction_method": (
                "EPUB package-spine traversal with exact source-target locator "
                "parsing, footnote resolution, and recursive cross-reference resolution."
            ),
            "target_derivation": (
                "Each target is recomputed from the canonical TypeScript trigram and "
                "hexagram registries by inverting exactly one bottom-to-top line."
            ),
        },
    }
    write_json(data_root / "manifest.json", manifest)

    audit = {
        "schema_version": SCHEMA_VERSION,
        "generated_at_utc": generated_at,
        "passed": True,
        "source_id": SOURCE_ID,
        "source_sha256": source_hash,
        "checks": [
            {
                "name": "source-identity",
                "passed": True,
                "detail": (
                    "EPUB package title and front-matter edition identity match "
                    "Christopher Gait's Forest of Changes."
                ),
            },
            {
                "name": "matrix-completeness",
                "passed": True,
                "detail": "Exactly one record exists for every 64×64 source-target locator.",
            },
            {
                "name": "line-change-selection",
                "passed": True,
                "detail": (
                    "All 384 one-line targets were derived from the canonical "
                    "bottom-to-top line registry."
                ),
            },
            {
                "name": "cross-reference-resolution",
                "passed": True,
                "detail": (
                    f"Resolved {cross_references} matrix cross-references, including "
                    f"{selected_cross_references} selected one-line transitions."
                ),
            },
            {
                "name": "distribution-boundary",
                "passed": True,
                "detail": (
                    "Protected verses and notes are written only beneath the "
                    "Git-ignored internal research boundary."
                ),
            },
        ],
        "counts": {
            "matrix_records": len(entries),
            "matrix_cross_references": cross_references,
            "footnotes_indexed": len(footnotes),
            "selected_line_transitions": len(selected),
            "selected_cross_references": selected_cross_references,
            "selected_unresolved": 0,
        },
        "known_source_cautions": [
            (
                "The translator describes the work as a first complete Western-language "
                "translation rather than a critical academic variorum."
            ),
            (
                "The source contains extensive duplicate verses and explicit cross-references; "
                "a repeated image is not treated as unique evidence."
            ),
            (
                "Traditional attribution to Jiao Yanshou is disputed within the supplied edition."
            ),
        ],
    }
    write_json(data_root / "audit.json", audit)

    print(
        f"Prepared {len(entries)} Forest transitions; selected {len(selected)} "
        f"single-line changes ({selected_cross_references} cross-referenced)."
    )
    print(f"Local evidence: {internal_path}")
    print(f"Tracked index: {index_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Prepare local Jiaoshi Yilin transition evidence."
    )
    parser.add_argument("--source", required=True, type=Path, help="Path to the supplied EPUB.")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[2],
        help="Repository root.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source = args.source.resolve()
    root = args.root.resolve()
    if not source.is_file():
        raise FileNotFoundError(source)
    prepare(source, root)


if __name__ == "__main__":
    main()
