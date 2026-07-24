import { getHexagramByLines } from './hexagrams'
import type { Hexagram, HexagramLines, LinePolarity, RelatedHexagram } from './types'

const opposite = (line: LinePolarity): LinePolarity => (line === 'yang' ? 'yin' : 'yang')

export const getStructuralRelationships = (source: Hexagram): readonly RelatedHexagram[] => {
  const lines = source.linesBottomToTop
  const nuclear: HexagramLines = [lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]]
  const reversed: HexagramLines = [lines[5], lines[4], lines[3], lines[2], lines[1], lines[0]]
  const complementary: HexagramLines = [
    opposite(lines[0]),
    opposite(lines[1]),
    opposite(lines[2]),
    opposite(lines[3]),
    opposite(lines[4]),
    opposite(lines[5]),
  ]

  return [
    {
      hexagram: getHexagramByLines(nuclear),
      relationshipLabel: 'Nuclear · inner lines',
      status: 'computed',
      sourceLabel: 'Lines 2–4 below and 3–5 above',
    },
    {
      hexagram: getHexagramByLines(reversed),
      relationshipLabel: 'Reverse · inverted order',
      status: 'computed',
      sourceLabel: 'Source lines reversed top-to-bottom',
    },
    {
      hexagram: getHexagramByLines(complementary),
      relationshipLabel: 'Complement · changed polarity',
      status: 'computed',
      sourceLabel: 'Every yin/yang line inverted',
    },
  ]
}
