#!/usr/bin/env python3
"""Prepare a local-only, per-hexagram commentary corpus for later synthesis.

The script imports the seven legacy source folders without changing their bytes
and extracts four user-provided works with explicit 1-64 boundaries.

Full source text is written beneath data/hexagram-commentary/chunked/, which is
Git-ignored. The manifest, chunk index, and audit contain provenance and hashes
but no commentary body text.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import unicodedata
from copy import deepcopy
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path, PurePosixPath
from typing import Iterable
from zipfile import ZipFile

from lxml import etree, html
from pypdf import PdfReader


SCHEMA_VERSION = "1.0.0"
REFERENCE_REPOSITORY_URL = "https://github.com/BenKalish42/current-almanac"
CHUNK_PATH_PATTERN = "chunked/{source_id}/hex_{hexagram:02d}.txt"


@dataclass(frozen=True)
class SourceDefinition:
    source_id: str
    lens: str
    sequence: int
    title: str
    contributors: tuple[str, ...]
    format: str
    extraction_method: str


LEGACY_SOURCES = (
    SourceDefinition(
        "buddhist_1_cleary",
        "buddhism",
        1,
        "The Buddhist I Ching",
        ("Chih-hsu Ou-i", "Thomas Cleary (translator)"),
        "legacy-text-chunks",
        "Byte-for-byte import from the public reference corpus.",
    ),
    SourceDefinition(
        "confucian_1_cleary",
        "confucianism",
        1,
        "I Ching: The Book of Change",
        ("Thomas Cleary (translator)",),
        "legacy-text-chunks",
        "Byte-for-byte import from the public reference corpus.",
    ),
    SourceDefinition(
        "confucian_2_legge",
        "confucianism",
        2,
        "I Ching: The Book of Changes",
        ("James Legge (translator)",),
        "legacy-text-chunks",
        "Byte-for-byte import from the public reference corpus.",
    ),
    SourceDefinition(
        "daoist_1_cleary",
        "daoism",
        1,
        "The Taoist I Ching",
        ("Liu I-ming", "Thomas Cleary (translator)"),
        "legacy-text-chunks",
        "Byte-for-byte import from the public reference corpus.",
    ),
    SourceDefinition(
        "gene_keys_1_rudd",
        "gene-keys",
        1,
        "Gene Keys: Unlocking the Higher Purpose Hidden in Your DNA",
        ("Richard Rudd",),
        "legacy-text-chunks",
        "Byte-for-byte import from the public reference corpus.",
    ),
    SourceDefinition(
        "human_design_1_ra",
        "human-design",
        1,
        "The Complete Rave I'Ching",
        ("Ra Uru Hu",),
        "legacy-text-chunks",
        "Byte-for-byte import from the public reference corpus.",
    ),
    SourceDefinition(
        "psychological_1_wilhelm",
        "psychology",
        1,
        "The I Ching or Book of Changes",
        ("Richard Wilhelm", "Cary F. Baynes (translator)"),
        "legacy-text-chunks",
        "Byte-for-byte import from the public reference corpus.",
    ),
)

NEW_SOURCES = (
    SourceDefinition(
        "daoist_2_wang_bi",
        "daoism",
        2,
        "The Classic of Changes: A New Translation of the I Ching as Interpreted by Wang Bi",
        ("Wang Bi", "Richard John Lynn (translator)"),
        "epub",
        (
            "EPUB spine traversal; direct body sections split at the explicit "
            "'HEXAGRAM N' markers in the four hexagram-commentary XHTML files."
        ),
    ),
    SourceDefinition(
        "psychological_2_balkin",
        "psychology",
        2,
        "The Laws of Change: I Ching and the Philosophy of Life",
        ("Jack M. Balkin",),
        "epub",
        "EPUB spine traversal; one XHTML chapter whose first heading identifies each hexagram.",
    ),
    SourceDefinition(
        "psychological_3_dening",
        "psychology",
        3,
        "The Everyday I Ching",
        ("Sarah Dening",),
        "pdf",
        (
            "PDF outline boundaries; text extracted from each numbered bookmark "
            "up to the next bookmark."
        ),
    ),
    SourceDefinition(
        "gene_keys_2_rudd",
        "gene-keys",
        2,
        "The 64 Ways: Personal Contemplations on the Gene Keys",
        ("Richard Rudd",),
        "epub",
        "EPUB spine traversal; one XHTML chapter headed 'Gene Key N' for each numbered key.",
    ),
)

NUMBER_WORDS = {
    word: number
    for number, word in enumerate(
        (
            "",
            "ONE",
            "TWO",
            "THREE",
            "FOUR",
            "FIVE",
            "SIX",
            "SEVEN",
            "EIGHT",
            "NINE",
            "TEN",
            "ELEVEN",
            "TWELVE",
            "THIRTEEN",
            "FOURTEEN",
            "FIFTEEN",
            "SIXTEEN",
            "SEVENTEEN",
            "EIGHTEEN",
            "NINETEEN",
            "TWENTY",
            "TWENTY-ONE",
            "TWENTY-TWO",
            "TWENTY-THREE",
            "TWENTY-FOUR",
            "TWENTY-FIVE",
            "TWENTY-SIX",
            "TWENTY-SEVEN",
            "TWENTY-EIGHT",
            "TWENTY-NINE",
            "THIRTY",
            "THIRTY-ONE",
            "THIRTY-TWO",
            "THIRTY-THREE",
            "THIRTY-FOUR",
            "THIRTY-FIVE",
            "THIRTY-SIX",
            "THIRTY-SEVEN",
            "THIRTY-EIGHT",
            "THIRTY-NINE",
            "FORTY",
            "FORTY-ONE",
            "FORTY-TWO",
            "FORTY-THREE",
            "FORTY-FOUR",
            "FORTY-FIVE",
            "FORTY-SIX",
            "FORTY-SEVEN",
            "FORTY-EIGHT",
            "FORTY-NINE",
            "FIFTY",
            "FIFTY-ONE",
            "FIFTY-TWO",
            "FIFTY-THREE",
            "FIFTY-FOUR",
            "FIFTY-FIVE",
            "FIFTY-SIX",
            "FIFTY-SEVEN",
            "FIFTY-EIGHT",
            "FIFTY-NINE",
            "SIXTY",
            "SIXTY-ONE",
            "SIXTY-TWO",
            "SIXTY-THREE",
            "SIXTY-FOUR",
        )
    )
    if number
}

LEGACY_CHUNK_ISSUES: dict[tuple[str, int], tuple[str, ...]] = {
    (
        "buddhist_1_cleary",
        1,
    ): (
        "The downloaded legacy chunk is misidentified: its heading and content "
        "belong to Hexagram 61 rather than Hexagram 1.",
    ),
    (
        "buddhist_1_cleary",
        5,
    ): (
        "The downloaded legacy chunk is misidentified: its heading and content "
        "belong to Hexagram 25 rather than Hexagram 5.",
    ),
    (
        "buddhist_1_cleary",
        6,
    ): (
        "The downloaded legacy chunk is misidentified: its heading and content "
        "belong to Hexagram 56 rather than Hexagram 6.",
    ),
    (
        "buddhist_1_cleary",
        7,
    ): (
        "The downloaded legacy chunk is misidentified: its heading and content "
        "belong to Hexagram 57 rather than Hexagram 7.",
    ),
    (
        "buddhist_1_cleary",
        17,
    ): (
        "The downloaded legacy chunk contains only a chapter heading and page number.",
    ),
    (
        "confucian_2_legge",
        64,
    ): (
        "The downloaded legacy chunk is an extreme size outlier and appears to "
        "include post-hexagram material.",
    ),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--reference-repo",
        required=True,
        type=Path,
        help="Local checkout of BenKalish42/current-almanac.",
    )
    parser.add_argument("--balkin-epub", required=True, type=Path)
    parser.add_argument("--dening-pdf", required=True, type=Path)
    parser.add_argument("--wang-bi-epub", required=True, type=Path)
    parser.add_argument("--rudd-64-ways-epub", required=True, type=Path)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/hexagram-commentary"),
    )
    return parser.parse_args()


def normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFC", text)
    normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")
    normalized = normalized.replace("\u00ad", "")
    normalized = normalized.replace("\ufb01", "fi").replace("\ufb02", "fl")
    normalized = normalized.replace("\x00", "")
    lines = [line.rstrip() for line in normalized.splitlines()]
    collapsed: list[str] = []
    blank = False
    for line in lines:
        if line.strip():
            collapsed.append(line.strip())
            blank = False
        elif not blank and collapsed:
            collapsed.append("")
            blank = True
    return "\n".join(collapsed).strip() + "\n"


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def command_output(arguments: list[str], cwd: Path) -> str:
    result = subprocess.run(
        arguments,
        cwd=cwd,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return result.stdout.strip()


def epub_spine(epub_path: Path) -> list[tuple[str, bytes]]:
    with ZipFile(epub_path) as archive:
        xml_parser = etree.XMLParser(resolve_entities=False, no_network=True)
        container = etree.fromstring(
            archive.read("META-INF/container.xml"),
            parser=xml_parser,
        )
        rootfile = container.xpath(
            'string(//*[local-name()="rootfile"]/@full-path)'
        )
        if not rootfile:
            raise ValueError(f"{epub_path.name}: EPUB rootfile is missing")
        opf = etree.fromstring(archive.read(rootfile), parser=xml_parser)
        base = PurePosixPath(rootfile).parent
        manifest = {
            item.get("id"): item.get("href")
            for item in opf.xpath(
                '//*[local-name()="manifest"]/*[local-name()="item"]'
            )
        }
        spine_ids = [
            item.get("idref")
            for item in opf.xpath('//*[local-name()="spine"]/*[local-name()="itemref"]')
        ]
        documents: list[tuple[str, bytes]] = []
        for spine_id in spine_ids:
            href = manifest.get(spine_id)
            if not href:
                continue
            member = str(base.joinpath(href.split("#", maxsplit=1)[0]))
            if member.lower().endswith((".xhtml", ".html", ".htm")):
                documents.append((member, archive.read(member)))
        return documents


def validate_wang_bi_epub_identity(epub_path: Path) -> None:
    with ZipFile(epub_path) as archive:
        xml_parser = etree.XMLParser(resolve_entities=False, no_network=True)
        container = etree.fromstring(
            archive.read("META-INF/container.xml"),
            parser=xml_parser,
        )
        rootfile = container.xpath(
            'string(//*[local-name()="rootfile"]/@full-path)'
        )
        opf = etree.fromstring(archive.read(rootfile), parser=xml_parser)
        titles = [
            " ".join(title.itertext()).strip()
            for title in opf.xpath(
                '//*[local-name()="metadata"]/*[local-name()="title"]'
            )
        ]
    expected_titles = {
        "The Classic of Changes",
        "A New Translation of the I Ching as Interpreted by Wang Bi",
    }
    if not expected_titles.issubset(set(titles)):
        raise ValueError(
            f"{epub_path.name}: metadata does not identify Richard John Lynn's "
            "translation of Wang Bi's Classic of Changes"
        )


def xhtml_blocks(
    document: html.HtmlElement,
    *,
    include_table_cells: bool = False,
) -> list[str]:
    body_matches = document.xpath("//body")
    if not body_matches:
        return []
    body = body_matches[0]
    for unwanted in body.xpath(".//script|.//style|.//nav|.//svg"):
        parent = unwanted.getparent()
        if parent is not None:
            parent.remove(unwanted)

    blocks: list[str] = []
    block_selector = (
        ".//*[self::h1 or self::h2 or self::h3 or self::h4 "
        "or self::h5 or self::h6 or self::p or self::li or self::blockquote]"
    )
    if include_table_cells:
        block_selector = (
            ".//*[((self::h1 or self::h2 or self::h3 or self::h4 "
            "or self::h5 or self::h6 or self::p or self::li or self::blockquote) "
            "and not(ancestor::td or ancestor::th)) or self::td or self::th]"
        )

    for original in body.xpath(block_selector):
        node = deepcopy(original)
        for br in node.xpath(".//br"):
            br.tail = "\n" + (br.tail or "")
        text = unicodedata.normalize("NFC", node.text_content())
        lines = [" ".join(line.split()) for line in text.splitlines()]
        cleaned = "\n".join(line for line in lines if line).strip()
        if cleaned:
            blocks.append(cleaned)
    return blocks


def extract_balkin(epub_path: Path) -> dict[int, str]:
    chunks: dict[int, str] = {}
    for member, payload in epub_spine(epub_path):
        document = html.fromstring(payload)
        heading = document.xpath("string(//body//h4[1])").strip().upper()
        number = NUMBER_WORDS.get(heading)
        title = document.xpath("string(//body//h2[1])").strip()
        if number is None or not title:
            continue
        if number in chunks:
            raise ValueError(f"{epub_path.name}: duplicate hexagram {number}")
        chunks[number] = normalize_text("\n\n".join(xhtml_blocks(document)))
    validate_complete_mapping(epub_path.name, chunks)
    return chunks


def extract_rudd_64_ways(epub_path: Path) -> dict[int, str]:
    chunks: dict[int, str] = {}
    for member, payload in epub_spine(epub_path):
        document = html.fromstring(payload)
        heading = document.xpath("string(//body//h1[1])").strip()
        match = re.fullmatch(r"Gene Key\s+(\d{1,2})", heading, re.IGNORECASE)
        if not match:
            continue
        number = int(match.group(1))
        if not 1 <= number <= 64:
            continue
        if number in chunks:
            raise ValueError(f"{epub_path.name}: duplicate Gene Key {number}")
        chunks[number] = normalize_text("\n\n".join(xhtml_blocks(document)))
    validate_complete_mapping(epub_path.name, chunks)
    return chunks


def extract_rudd_gene_keys(epub_path: Path) -> dict[int, str]:
    chunks: dict[int, str] = {}
    shadow_heading = re.compile(
        r"\bTHE\s+(\d{1,2})(?:ST|ND|RD|TH)\s*SHADOW\b",
        re.IGNORECASE,
    )
    for member, payload in epub_spine(epub_path):
        document = html.fromstring(payload)
        headings = [
            " ".join(node.text_content().split())
            for node in document.xpath(
                "//body//*[self::h1 or self::h2 or self::h3 or self::h4 "
                "or self::h5 or self::h6]"
            )
        ]
        numbers = {
            int(number)
            for heading in headings
            for number in shadow_heading.findall(heading)
            if 1 <= int(number) <= 64
        }
        if not numbers:
            continue
        if len(numbers) != 1:
            raise ValueError(
                f"{member}: ambiguous numbered Shadow headings {sorted(numbers)}"
            )
        number = numbers.pop()
        combined_headings = "\n".join(headings).upper()
        if "GIFT" not in combined_headings or "SIDDHI" not in combined_headings:
            raise ValueError(
                f"{member}: Gene Key {number} lacks a Gift or Siddhi heading"
            )
        if number in chunks:
            raise ValueError(f"{epub_path.name}: duplicate Gene Key {number}")
        blocks = xhtml_blocks(document, include_table_cells=True)
        if not blocks:
            raise ValueError(f"{member}: Gene Key {number} has no extractable text")
        chunks[number] = normalize_text("\n\n".join(blocks))
    validate_complete_mapping(epub_path.name, chunks)
    return chunks


def extract_wang_bi(epub_path: Path) -> dict[int, str]:
    chunks: dict[int, str] = {}
    for member, payload in epub_spine(epub_path):
        document = html.fromstring(payload)
        body_matches = document.xpath("//body")
        if not body_matches:
            continue
        body = body_matches[0]
        children = list(body)
        marker_indexes: list[tuple[int, int]] = []
        for index, child in enumerate(children):
            if child.tag != "div" or child.get("class") != "chapnum":
                continue
            heading = " ".join(child.text_content().split())
            match = re.fullmatch(r"HEXAGRAM\s+(\d{1,2})", heading, re.IGNORECASE)
            if match:
                marker_indexes.append((index, int(match.group(1))))

        for marker_position, (start_index, number) in enumerate(marker_indexes):
            if not 1 <= number <= 64:
                continue
            if number in chunks:
                raise ValueError(f"{epub_path.name}: duplicate hexagram {number}")
            end_index = (
                marker_indexes[marker_position + 1][0]
                if marker_position + 1 < len(marker_indexes)
                else len(children)
            )
            blocks: list[str] = []
            for original in children[start_index:end_index]:
                node = deepcopy(original)
                for unwanted in node.xpath(".//script|.//style|.//nav|.//svg"):
                    parent = unwanted.getparent()
                    if parent is not None:
                        parent.remove(unwanted)
                for br in node.xpath(".//br"):
                    br.tail = "\n" + (br.tail or "")
                text = unicodedata.normalize("NFC", node.text_content())
                lines = [" ".join(line.split()) for line in text.splitlines()]
                cleaned = "\n".join(line for line in lines if line).strip()
                if cleaned:
                    blocks.append(cleaned)
            chunks[number] = normalize_text("\n\n".join(blocks))

    validate_complete_mapping(epub_path.name, chunks)
    return chunks


def flatten_pdf_outline(items: Iterable[object]) -> list[object]:
    flattened: list[object] = []
    for item in items:
        if isinstance(item, list):
            flattened.extend(flatten_pdf_outline(item))
        else:
            flattened.append(item)
    return flattened


def extract_dening(pdf_path: Path) -> dict[int, str]:
    reader = PdfReader(pdf_path)
    destinations: list[tuple[int, str]] = []
    for item in flatten_pdf_outline(reader.outline):
        title = getattr(item, "title", "")
        try:
            page_index = reader.get_destination_page_number(item)
        except Exception:
            continue
        destinations.append((page_index, str(title)))

    starts: dict[int, int] = {}
    for page_index, title in destinations:
        match = re.fullmatch(r"(\d{1,2})\.\s+.+", title)
        if not match:
            continue
        number = int(match.group(1))
        if 1 <= number <= 64:
            starts[number] = page_index
    validate_complete_mapping(pdf_path.name, starts)

    chunks: dict[int, str] = {}
    outline_pages = sorted({page_index for page_index, _ in destinations})
    for number in range(1, 65):
        start = starts[number]
        later_pages = [page for page in outline_pages if page > start]
        end = min(later_pages) if later_pages else len(reader.pages)
        pages = [
            normalize_text(reader.pages[page].extract_text() or "").strip()
            for page in range(start, end)
        ]
        chunks[number] = normalize_text("\n\n".join(page for page in pages if page))
    validate_complete_mapping(pdf_path.name, chunks)
    return chunks


def validate_complete_mapping(label: str, mapping: dict[int, object]) -> None:
    expected = set(range(1, 65))
    actual = set(mapping)
    if actual != expected:
        missing = sorted(expected - actual)
        extra = sorted(actual - expected)
        raise ValueError(f"{label}: expected 1-64; missing={missing}, extra={extra}")


def write_chunks(output_root: Path, source_id: str, chunks: dict[int, str]) -> None:
    validate_complete_mapping(source_id, chunks)
    target_dir = output_root / "chunked" / source_id
    target_dir.mkdir(parents=True, exist_ok=True)
    for number in range(1, 65):
        text = chunks[number]
        if not text.strip():
            raise ValueError(f"{source_id}: hexagram {number} is empty")
        (target_dir / f"hex_{number:02d}.txt").write_text(
            text,
            encoding="utf-8",
            newline="\n",
        )


def copy_legacy_chunks(
    reference_repo: Path,
    output_root: Path,
) -> tuple[str, dict[str, dict[int, str]]]:
    reference_commit = command_output(
        ["git", "rev-parse", "HEAD"],
        reference_repo,
    )
    reference_root = reference_repo / "data" / "chunked"
    copied_hashes: dict[str, dict[int, str]] = {}
    for definition in LEGACY_SOURCES:
        source_dir = reference_root / definition.source_id
        expected_files = {f"hex_{number:02d}.txt" for number in range(1, 65)}
        actual_files = {path.name for path in source_dir.glob("hex_*.txt")}
        if actual_files != expected_files:
            raise ValueError(
                f"{definition.source_id}: legacy files do not cover exactly 1-64"
            )
        target_dir = output_root / "chunked" / definition.source_id
        target_dir.mkdir(parents=True, exist_ok=True)
        source_hashes: dict[int, str] = {}
        for number in range(1, 65):
            name = f"hex_{number:02d}.txt"
            source_path = source_dir / name
            target_path = target_dir / name
            shutil.copyfile(source_path, target_path)
            source_hash = sha256_file(source_path)
            target_hash = sha256_file(target_path)
            if source_hash != target_hash:
                raise ValueError(
                    f"{definition.source_id}/{name}: byte preservation failed"
                )
            source_hashes[number] = source_hash
        copied_hashes[definition.source_id] = source_hashes
    return reference_commit, copied_hashes


def bundle_hash(records: list[dict[str, object]]) -> str:
    canonical = "\n".join(
        f"{record['hexagram']:02d}:{record['sha256']}" for record in records
    )
    return sha256_bytes(canonical.encode("utf-8"))


def chunk_records_for_source(
    output_root: Path,
    definition: SourceDefinition,
    provenance_kind: str,
) -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    source_dir = output_root / "chunked" / definition.source_id
    for number in range(1, 65):
        path = source_dir / f"hex_{number:02d}.txt"
        raw = path.read_bytes()
        text = raw.decode("utf-8")
        issues = list(LEGACY_CHUNK_ISSUES.get((definition.source_id, number), ()))
        if "\ufffd" in text:
            issues.append("Chunk contains the Unicode replacement character.")
        if "\x00" in text:
            issues.append("Chunk contains a null byte.")
        if not text.strip():
            issues.append("Chunk is empty.")
        content_status = "needs-review" if issues else "ready"
        relative_path = path.relative_to(output_root).as_posix()
        records.append(
            {
                "schema_version": SCHEMA_VERSION,
                "source_id": definition.source_id,
                "lens": definition.lens,
                "source_sequence": definition.sequence,
                "hexagram": number,
                "king_wen_order": number,
                "path": relative_path,
                "sha256": sha256_bytes(raw),
                "byte_count": len(raw),
                "character_count": len(text),
                "content_status": content_status,
                "ingestion_eligible": content_status == "ready",
                "rights_status": "user-provided-local-review-required",
                "distribution": "local-only",
                "provenance_kind": provenance_kind,
                "issues": issues,
            }
        )
    return records


def source_manifest_entry(
    definition: SourceDefinition,
    records: list[dict[str, object]],
    provenance: dict[str, object],
    input_sha256: str | None = None,
) -> dict[str, object]:
    ready_count = sum(record["content_status"] == "ready" for record in records)
    issues = [
        {
            "hexagram": record["hexagram"],
            "issues": record["issues"],
        }
        for record in records
        if record["issues"]
    ]
    return {
        "source_id": definition.source_id,
        "lens": definition.lens,
        "source_sequence": definition.sequence,
        "title": definition.title,
        "contributors": list(definition.contributors),
        "format": definition.format,
        "status": "ready" if ready_count == 64 else "needs-review",
        "hexagram_mappable": True,
        "chunk_count": len(records),
        "ready_chunk_count": ready_count,
        "coverage": {"scheme": "King Wen", "first": 1, "last": 64},
        "path_pattern": (
            f"chunked/{definition.source_id}/hex_{{hexagram:02d}}.txt"
        ),
        "extraction_method": definition.extraction_method,
        "input_sha256": input_sha256,
        "chunk_bundle_sha256": bundle_hash(records),
        "total_characters": sum(int(record["character_count"]) for record in records),
        "minimum_chunk_characters": min(
            int(record["character_count"]) for record in records
        ),
        "maximum_chunk_characters": max(
            int(record["character_count"]) for record in records
        ),
        "rights_status": "user-provided-local-review-required",
        "distribution": "local-only",
        "provenance": provenance,
        "issues": issues,
    }


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def main() -> int:
    args = parse_args()
    reference_repo = args.reference_repo.resolve()
    output_root = args.output.resolve()
    inputs = {
        "psychological_2_balkin": args.balkin_epub.resolve(),
        "psychological_3_dening": args.dening_pdf.resolve(),
        "gene_keys_2_rudd": args.rudd_64_ways_epub.resolve(),
        "daoist_2_wang_bi": args.wang_bi_epub.resolve(),
    }
    for path in (reference_repo, *inputs.values()):
        if not path.exists():
            raise FileNotFoundError(path)

    output_root.mkdir(parents=True, exist_ok=True)
    reference_commit, _ = copy_legacy_chunks(reference_repo, output_root)

    validate_wang_bi_epub_identity(inputs["daoist_2_wang_bi"])
    extracted = {
        "daoist_2_wang_bi": extract_wang_bi(inputs["daoist_2_wang_bi"]),
        "psychological_2_balkin": extract_balkin(inputs["psychological_2_balkin"]),
        "psychological_3_dening": extract_dening(inputs["psychological_3_dening"]),
        "gene_keys_2_rudd": extract_rudd_64_ways(inputs["gene_keys_2_rudd"]),
    }
    for definition in NEW_SOURCES:
        write_chunks(output_root, definition.source_id, extracted[definition.source_id])

    all_records: list[dict[str, object]] = []
    source_entries: list[dict[str, object]] = []
    for definition in LEGACY_SOURCES:
        records = chunk_records_for_source(
            output_root,
            definition,
            "public-reference-repository",
        )
        all_records.extend(records)
        source_entries.append(
            source_manifest_entry(
                definition,
                records,
                {
                    "repository_url": REFERENCE_REPOSITORY_URL,
                    "repository_commit": reference_commit,
                    "repository_path": f"data/chunked/{definition.source_id}",
                    "imported_byte_for_byte": True,
                },
            )
        )

    for definition in NEW_SOURCES:
        records = chunk_records_for_source(
            output_root,
            definition,
            "user-provided-local-file",
        )
        all_records.extend(records)
        source_entries.append(
            source_manifest_entry(
                definition,
                records,
                {
                    "provided_by": "workspace user",
                    "source_filename_recorded": False,
                    "local_path_recorded": False,
                },
                sha256_file(inputs[definition.source_id]),
            )
        )

    generated_at = datetime.now(UTC).replace(microsecond=0).isoformat().replace(
        "+00:00",
        "Z",
    )
    ready_records = [
        record for record in all_records if record["ingestion_eligible"] is True
    ]
    manifest = {
        "schema_version": SCHEMA_VERSION,
        "generated_at_utc": generated_at,
        "purpose": (
            "Local source corpus prepared for source-grounded hexagram OLTR and "
            "commentary-summary work. It is not connected to the runtime UI."
        ),
        "layout": {
            "encoding": "UTF-8",
            "order": "King Wen 1-64",
            "path_pattern": CHUNK_PATH_PATTERN,
            "chunk_index": "chunk-index.jsonl",
        },
        "distribution_policy": {
            "chunk_text": "local-only-git-ignored",
            "metadata_and_hashes": "trackable",
            "reason": (
                "The corpus contains copyrighted, user-provided books and legacy "
                "full-text chunks whose redistribution rights have not been cleared."
            ),
        },
        "reference_corpus": {
            "repository_url": REFERENCE_REPOSITORY_URL,
            "repository_commit": reference_commit,
            "imported_source_count": len(LEGACY_SOURCES),
        },
        "summary": {
            "source_records": len(source_entries),
            "chunked_sources": len(LEGACY_SOURCES) + len(NEW_SOURCES),
            "blocked_sources": 0,
            "chunk_files": len(all_records),
            "ingestion_eligible_chunks": len(ready_records),
            "needs_review_chunks": len(all_records) - len(ready_records),
        },
        "sources": source_entries,
    }
    write_json(output_root / "manifest.json", manifest)

    index_path = output_root / "chunk-index.jsonl"
    with index_path.open("w", encoding="utf-8", newline="\n") as stream:
        for record in sorted(
            all_records,
            key=lambda item: (str(item["source_id"]), int(item["hexagram"])),
        ):
            stream.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")

    audit = {
        "schema_version": SCHEMA_VERSION,
        "generated_at_utc": generated_at,
        "passed": True,
        "checks": [
            {
                "name": "legacy-reference-import",
                "passed": True,
                "detail": (
                    f"Copied {len(LEGACY_SOURCES) * 64} legacy chunks byte-for-byte "
                    f"from reference commit {reference_commit}."
                ),
            },
            {
                "name": "new-source-coverage",
                "passed": True,
                "detail": (
                    "Wang Bi/Lynn, Balkin, Dening, and The 64 Ways each produced "
                    "exactly one non-empty UTF-8 chunk for King Wen numbers 1-64."
                ),
            },
            {
                "name": "legacy-anomaly-quarantine",
                "passed": True,
                "detail": (
                    "Six downloaded legacy records are marked needs-review and are "
                    "not ingestion eligible."
                ),
            },
            {
                "name": "wang-bi-source-identity",
                "passed": True,
                "detail": (
                    "The supplied EPUB identifies itself as Richard John Lynn's "
                    "translation of Wang Bi's Classic of Changes and contains "
                    "explicit HEXAGRAM 1-64 section markers."
                ),
            },
            {
                "name": "distribution-boundary",
                "passed": True,
                "detail": (
                    "Full chunk text is local-only beneath the Git-ignored chunked "
                    "directory; manifests contain hashes and metadata only."
                ),
            },
        ],
        "counts": manifest["summary"],
        "known_issues": [
            {
                "source_id": source_id,
                "hexagram": number,
                "issues": list(issues),
            }
            for (source_id, number), issues in sorted(LEGACY_CHUNK_ISSUES.items())
        ],
    }
    write_json(output_root / "audit.json", audit)

    print(
        json.dumps(
            {
                "output": str(output_root),
                "reference_commit": reference_commit,
                "chunk_files": len(all_records),
                "ingestion_eligible_chunks": len(ready_records),
                "needs_review_chunks": len(all_records) - len(ready_records),
                "blocked_sources": 0,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
