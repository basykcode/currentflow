# Yijing commentary source inventory

This report is generated before synthesis. It describes the existing local corpus without moving,
renaming, or publishing its protected source text.

## Corpus

- Source directories: 11
- Raw chunks: 704
- Ingestion-eligible chunks: 698
- Rejected or ambiguous chunks: 6
- Format: UTF-8 plain text
- Naming: `hex_01.txt through hex_64.txt`
- Raw distribution: local-only-git-ignored
- Jiaoshi Yilin / 焦氏易林 sources found: none

## Sources by school

| Canonical school | Count | Registered sources |
| --- | ---: | --- |
| daoist | 2 | `daoist_1_cleary`, `daoist_2_wang_bi` |
| buddhist | 1 | `buddhist_1_cleary` |
| confucian | 2 | `confucian_1_cleary`, `confucian_2_legge` |
| psychological | 3 | `psychological_1_wilhelm`, `psychological_2_balkin`, `psychological_3_dening` |
| human-design | 1 | `human_design_1_ra` |
| gene-keys | 2 | `gene_keys_1_rudd`, `gene_keys_2_rudd` |

## Label normalization

| Source label | Canonical school |
| --- | --- |
| `buddhism` | `buddhist` |
| `confucianism` | `confucian` |
| `daoism` | `daoist` |
| `gene-keys` | `gene-keys` |
| `human-design` | `human-design` |
| `psychology` | `psychological` |

Unknown labels rejected: none.

## Quarantined records

| Source | Hexagram file | Reason |
| --- | ---: | --- |
| `buddhist_1_cleary` | 1 | The downloaded legacy chunk is misidentified: its heading and content belong to Hexagram 61 rather than Hexagram 1. |
| `buddhist_1_cleary` | 5 | The downloaded legacy chunk is misidentified: its heading and content belong to Hexagram 25 rather than Hexagram 5. |
| `buddhist_1_cleary` | 6 | The downloaded legacy chunk is misidentified: its heading and content belong to Hexagram 56 rather than Hexagram 6. |
| `buddhist_1_cleary` | 7 | The downloaded legacy chunk is misidentified: its heading and content belong to Hexagram 57 rather than Hexagram 7. |
| `buddhist_1_cleary` | 17 | The downloaded legacy chunk contains only a chapter heading and page number. |
| `confucian_2_legge` | 64 | The downloaded legacy chunk is an extreme size outlier and appears to include post-hexagram material. |

## Duplicate check

Exact duplicate SHA-256 groups: 0. Similar or misidentified legacy records
remain quarantined through explicit quality findings rather than silently remapped.
