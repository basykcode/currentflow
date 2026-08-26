#!/usr/bin/env python3
"""Extract two user-supplied Richard Rudd EPUBs into local-only Gene Key chunks.

This focused helper writes only the ignored full-text folders. It does not update
tracked evidence metadata or derived commentary, because changing an indexed
source requires a complete provenance and commentary rebuild.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from prepare_hexagram_commentary import (
    extract_rudd_64_ways,
    extract_rudd_gene_keys,
    sha256_bytes,
    sha256_file,
    write_chunks,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gene-keys-epub", required=True, type=Path)
    parser.add_argument("--rudd-64-ways-epub", required=True, type=Path)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/hexagram-commentary"),
    )
    return parser.parse_args()


def chunk_bundle_sha256(chunks: dict[int, str]) -> str:
    canonical = "\n".join(
        f"{number:02d}:{sha256_bytes(chunks[number].encode('utf-8'))}"
        for number in range(1, 65)
    )
    return sha256_bytes(canonical.encode("utf-8"))


def source_result(
    source_id: str,
    input_path: Path,
    chunks: dict[int, str],
) -> dict[str, object]:
    character_counts = [len(chunks[number]) for number in range(1, 65)]
    return {
        "source_id": source_id,
        "files": len(chunks),
        "nonempty_files": sum(bool(text.strip()) for text in chunks.values()),
        "input_sha256": sha256_file(input_path),
        "chunk_bundle_sha256": chunk_bundle_sha256(chunks),
        "total_characters": sum(character_counts),
        "minimum_chunk_characters": min(character_counts),
        "maximum_chunk_characters": max(character_counts),
    }


def main() -> int:
    args = parse_args()
    gene_keys_epub = args.gene_keys_epub.resolve()
    ways_epub = args.rudd_64_ways_epub.resolve()
    output_root = args.output.resolve()
    for path in (gene_keys_epub, ways_epub):
        if not path.is_file():
            raise FileNotFoundError(path)

    gene_keys_chunks = extract_rudd_gene_keys(gene_keys_epub)
    ways_chunks = extract_rudd_64_ways(ways_epub)
    write_chunks(output_root, "gene_keys_1_rudd", gene_keys_chunks)
    write_chunks(output_root, "gene_keys_2_rudd", ways_chunks)

    print(
        json.dumps(
            {
                "output": str(output_root / "chunked"),
                "sources": [
                    source_result(
                        "gene_keys_1_rudd",
                        gene_keys_epub,
                        gene_keys_chunks,
                    ),
                    source_result(
                        "gene_keys_2_rudd",
                        ways_epub,
                        ways_chunks,
                    ),
                ],
                "tracked_metadata_updated": False,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
