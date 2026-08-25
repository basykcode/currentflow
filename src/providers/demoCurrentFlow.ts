import type { CurrentFlowProvider } from '@/domain/astrology/provider'
import { getHexagram } from '@/domain/astrology/hexagrams'
import type {
  CurrentFlowSnapshot,
  HexagramReference,
  TemporalHexagram,
  TemporalScope,
} from '@/domain/astrology/types'

import { createDemoGuidance } from './demoGuidance'

const makeTemporal = (
  scope: TemporalScope,
  label: string,
  hexagram: HexagramReference,
  ganZhiRaw: string,
): TemporalHexagram => ({
  scope,
  label,
  timeBoundsLabel: 'Exact bounds unavailable in interface fixture',
  hexagram,
  ganZhiRaw,
  ganZhi: `Demo · ${ganZhiRaw}`,
  numberingSystem: 'king-wen',
  mappingSystem: 'demo-fixture',
  mappingVersion: 'demo-temporal-fixture-v1',
  status: 'demo',
  sourceLabel: 'Interface fixture · not calculated',
})

const YEAR = getHexagram(32)
const MONTH = getHexagram(53)
const DAY = getHexagram(57)
const HOUR = getHexagram(48)
const INNER = getHexagram(61)
const LIMITATION = getHexagram(60)
const INFLUENCE = getHexagram(31)

export class DemoCurrentFlowProvider implements CurrentFlowProvider {
  async getSnapshot(at: Date): Promise<CurrentFlowSnapshot> {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Browser local time'

    return Promise.resolve({
      generatedAtIso: at.toISOString(),
      timezone,
      status: 'demo',
      temporal: {
        year: makeTemporal('year', 'Year field', YEAR, '庚子'),
        month: makeTemporal('month', 'Month field', MONTH, '己卯'),
        day: makeTemporal('day', 'Day field', DAY, '乙巳'),
        hour: makeTemporal('hour', 'Hour field', HOUR, '丁酉'),
      },
      organ: {
        key: 'heart',
        nameEnglish: 'Heart period',
        nameChinese: '心',
        timeRangeLabel: 'Demo window · 11:00–13:00',
        status: 'demo',
        sourceLabel: 'Interface fixture · organ clock not connected',
      },
      guidance: createDemoGuidance(at),
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
      provenance: {
        providerId: 'demo-current-flow',
        modelVersion: 'fixture-0.1',
        mappingVersion: 'demo-temporal-fixture-v1',
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
