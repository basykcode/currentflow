# Yijing transformation source input required

The deterministic Transformation Lab is complete without these inputs. The following modules remain
visibly `source-needed`; this is intentional and must not be bypassed with remembered or generated
data.

| Module                                 | Required reviewed input                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Zagua contrasts                        | Complete target/summary records with source IDs and edition notes.                          |
| Jing Fang Eight Palaces                | 64 palace roots and stages, including wandering/returning soul.                             |
| Host and Response                      | Method-specific host/responding line assignments tied to Eight-Palace records.              |
| Na Jia                                 | Line-level stem and branch assignments with a named lineage and edition.                    |
| Gua Bian                               | Separate complete tables for each accepted Zhu Xi, Yu Fan, Li Zhicai, or Xun Shuang method. |
| Flying/hidden and enveloping bodies    | Separate exact method definitions and mappings with lineage attribution.                    |
| Twelve Message Hexagrams               | Membership, order, phase/correspondence fields, and convention notes.                       |
| Gua-Qi and lunar-phase correspondences | Complete phase/position tables with convention and edition notes.                           |
| Shao Yong maps                         | Verified circle/square positions and attribution/variant notes.                             |
| Cantong Qi overlay                     | Rights-cleared, reviewed claims from the project's licensed alchemical corpus.              |
| Jiaoshi Yilin                          | Directed transition records with edition, locator, rights, summary, and review state.       |
| Zhu Xi/Song reading convention         | Source-backed 0–6 moving-line text-priority rules.                                          |

## Resume procedure

1. Register the source and rights posture before importing any text or table.
2. Normalize foreign identifiers to the existing canonical hexagram numbers.
3. Preserve edition and lineage variants; do not choose a default silently.
4. Implement a closed adapter under `src/domain/yijing/transformations`.
5. Validate completeness, uniqueness, ranges, references, provenance, and method-specific invariants.
6. Add positive fixtures and explicit missing/duplicate/out-of-range failure tests.
7. Change only the affected module's availability state.
8. Run `npm run check`; run `npm run commentary:validate` as well if commentary data, loaders, or
   rendering changed.
9. Update the data/provenance documents and create the required continuity decision or handoff.

Raw scans, licensed text, normalized evidence chunks, or source working files must remain local-only.
Only approved public artifacts may enter the SPA.
