import type { CurrentFlowProvider } from '@/domain/astrology/provider'
import type {
  CurrentFlowSnapshot,
  Hexagram,
  TemporalHexagram,
  TemporalScope,
} from '@/domain/astrology/types'

const makeHexagram = (
  number: number,
  nameEnglish: string,
  nameChinese: string,
  linesBottomToTop: Hexagram['linesBottomToTop'],
): Hexagram => ({ number, nameEnglish, nameChinese, linesBottomToTop })

const makeTemporal = (
  scope: TemporalScope,
  label: string,
  hexagram: Hexagram,
  ganZhi: string,
): TemporalHexagram => ({
  scope,
  label,
  timeBoundsLabel: 'Exact bounds unavailable in interface fixture',
  hexagram,
  ganZhi,
  status: 'demo',
  sourceLabel: 'Interface fixture · not calculated',
})

const YEAR = makeHexagram(32, 'Duration', '恆', ['yang', 'yang', 'yin', 'yang', 'yin', 'yin'])
const MONTH = makeHexagram(53, 'Development', '漸', ['yin', 'yin', 'yang', 'yang', 'yin', 'yang'])
const DAY = makeHexagram(57, 'The Gentle', '巽', ['yin', 'yang', 'yang', 'yin', 'yang', 'yang'])
const HOUR = makeHexagram(48, 'The Well', '井', ['yin', 'yang', 'yang', 'yin', 'yang', 'yin'])
const INNER = makeHexagram(61, 'Inner Truth', '中孚', [
  'yang',
  'yang',
  'yin',
  'yin',
  'yang',
  'yang',
])
const LIMITATION = makeHexagram(60, 'Limitation', '節', [
  'yang',
  'yang',
  'yin',
  'yin',
  'yang',
  'yin',
])
const INFLUENCE = makeHexagram(31, 'Influence', '咸', ['yin', 'yin', 'yang', 'yang', 'yang', 'yin'])

export class DemoCurrentFlowProvider implements CurrentFlowProvider {
  async getSnapshot(at: Date): Promise<CurrentFlowSnapshot> {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Browser local time'

    return Promise.resolve({
      generatedAtIso: at.toISOString(),
      timezone,
      status: 'demo',
      temporal: {
        year: makeTemporal('year', 'Year field', YEAR, 'Demo · 庚子'),
        month: makeTemporal('month', 'Month field', MONTH, 'Demo · 己卯'),
        day: makeTemporal('day', 'Day field', DAY, 'Demo · 乙巳'),
        hour: makeTemporal('hour', 'Hour field', HOUR, 'Demo · 丁酉'),
      },
      organ: {
        key: 'heart',
        nameEnglish: 'Heart period',
        nameChinese: '心',
        timeRangeLabel: 'Demo window · 11:00–13:00',
        status: 'demo',
        sourceLabel: 'Interface fixture · organ clock not connected',
      },
      synthesis: {
        status: 'demo',
        sourceLabel: 'Curated interface fixture · not calculated',
        oltr: 'A steady approach leaves room for the next useful opening to become visible.',
        recommendedIntention:
          'Hold the direction lightly enough to notice where conditions are already cooperating.',
        recommendedExecution: [
          {
            label: 'Refine an existing draft',
            friction: 'lower',
            rationale: 'Conditions in this demo favor patient, incremental shaping.',
          },
          {
            label: 'Routine correspondence',
            friction: 'neutral',
            rationale: 'Maintain course without forcing significance.',
          },
          {
            label: 'Irreversible commitments',
            friction: 'higher',
            rationale: 'Leave a little more room for information to arrive.',
          },
        ],
        relatedHexagrams: [
          {
            hexagram: INNER,
            relationshipLabel: 'Inner pattern · demo',
            status: 'demo',
            sourceLabel: 'Interface fixture · not calculated',
          },
          {
            hexagram: LIMITATION,
            relationshipLabel: 'Boundary lens · demo',
            status: 'demo',
            sourceLabel: 'Interface fixture · not calculated',
          },
          {
            hexagram: INFLUENCE,
            relationshipLabel: 'Contrast · demo',
            status: 'demo',
            sourceLabel: 'Interface fixture · not calculated',
          },
        ],
      },
      provenance: {
        providerId: 'demo-current-flow',
        modelVersion: 'fixture-0.1',
        factors: ['Curated layout fixture', 'Static line arrays', 'Example synthesis copy'],
        notes: [
          'No calendrical calculation was performed.',
          'This snapshot does not represent the actual current temporal configuration.',
          'Relationship labels are illustrative and were not computed.',
        ],
      },
    })
  }
}
