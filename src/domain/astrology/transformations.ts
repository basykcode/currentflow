import { getHexagramByLines } from './hexagrams'
import type {
  DataStatus,
  Hexagram,
  HexagramLines,
  HexagramReference,
  LinePolarity,
} from './types'

export type ChangingLineNumber = 1 | 2 | 3 | 4 | 5 | 6

export type HexagramTransformation = {
  key: 'nuclear' | 'reverse' | 'complement' | 'trigram-exchange' | 'changing-line'
  label: string
  traditionalLabel: string
  description: string
  hexagram: HexagramReference
  status: Extract<DataStatus, 'computed'>
  sourceLabel: string
}

const opposite = (line: LinePolarity): LinePolarity => (line === 'yang' ? 'yin' : 'yang')

const calculateNuclear = (lines: HexagramLines): HexagramLines => [
  lines[1],
  lines[2],
  lines[3],
  lines[2],
  lines[3],
  lines[4],
]

const calculateReverse = (lines: HexagramLines): HexagramLines => [
  lines[5],
  lines[4],
  lines[3],
  lines[2],
  lines[1],
  lines[0],
]

const calculateComplement = (lines: HexagramLines): HexagramLines => [
  opposite(lines[0]),
  opposite(lines[1]),
  opposite(lines[2]),
  opposite(lines[3]),
  opposite(lines[4]),
  opposite(lines[5]),
]

const calculateTrigramExchange = (lines: HexagramLines): HexagramLines => [
  lines[3],
  lines[4],
  lines[5],
  lines[0],
  lines[1],
  lines[2],
]

export const getInitialTransformations = (
  source: Hexagram,
): readonly HexagramTransformation[] => {
  const lines = source.linesBottomToTop

  return [
    {
      key: 'nuclear',
      label: 'Nuclear',
      traditionalLabel: '互卦 · Hù Guà',
      description: 'Inner lines 2–4 form the lower trigram; 3–5 form the upper.',
      hexagram: getHexagramByLines(calculateNuclear(lines)),
      status: 'computed',
      sourceLabel: 'Lines 2–4 below and 3–5 above',
    },
    {
      key: 'reverse',
      label: 'Reverse',
      traditionalLabel: '綜卦 · Zōng Guà',
      description: 'The complete six-line figure is turned upside down.',
      hexagram: getHexagramByLines(calculateReverse(lines)),
      status: 'computed',
      sourceLabel: 'Source lines reversed top-to-bottom',
    },
    {
      key: 'complement',
      label: 'Complement',
      traditionalLabel: '錯卦 · Cuò Guà',
      description: 'Every yin line becomes yang and every yang line becomes yin.',
      hexagram: getHexagramByLines(calculateComplement(lines)),
      status: 'computed',
      sourceLabel: 'Every yin/yang line inverted',
    },
    {
      key: 'trigram-exchange',
      label: 'Trigram exchange',
      traditionalLabel: '互易卦 · Hù Yì Guà',
      description: 'The upper and lower trigrams exchange positions.',
      hexagram: getHexagramByLines(calculateTrigramExchange(lines)),
      status: 'computed',
      sourceLabel: 'Upper and lower three-line groups exchanged',
    },
  ]
}

export const changeHexagramLine = (
  source: Hexagram,
  lineNumber: ChangingLineNumber,
): HexagramTransformation => {
  const changedLines = [...source.linesBottomToTop] as [
    LinePolarity,
    LinePolarity,
    LinePolarity,
    LinePolarity,
    LinePolarity,
    LinePolarity,
  ]
  const lineIndex = lineNumber - 1
  const currentLine = changedLines[lineIndex]
  if (!currentLine) {
    throw new Error(`Invalid changing line: ${lineNumber}`)
  }
  changedLines[lineIndex] = opposite(currentLine)

  return {
    key: 'changing-line',
    label: `Line ${lineNumber} changes`,
    traditionalLabel: '變卦 · Biàn Guà',
    description: `Line ${lineNumber}, counted from the bottom, changes polarity.`,
    hexagram: getHexagramByLines(changedLines),
    status: 'computed',
    sourceLabel: `Only source line ${lineNumber} inverted`,
  }
}
