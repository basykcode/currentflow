import { describe, expect, it } from 'vitest'

import { DemoCurrentFlowProvider } from '../demoCurrentFlow'

describe('DemoCurrentFlowProvider', () => {
  it('returns a fully demo-labeled snapshot without calculation claims', async () => {
    const provider = new DemoCurrentFlowProvider()
    const snapshot = await provider.getSnapshot(new Date('2026-01-02T03:04:05.000Z'))

    expect(snapshot.status).toBe('demo')
    expect(Object.values(snapshot.temporal).every((item) => item.status === 'demo')).toBe(true)
    expect(snapshot.organ.status).toBe('demo')
    expect(snapshot.guidance.status).toBe('available')
    expect(snapshot.guidance.primaryCurrent.status.value).toBe('demo')
    expect(snapshot.guidance.intentions.length).toBeGreaterThan(0)
    expect(snapshot.guidance.executions.length).toBeGreaterThan(0)
    expect(snapshot.provenance.mappingVersion).toBe('demo-temporal-fixture-v1')
    expect(snapshot.provenance.notes.join(' ')).toMatch(/No calendrical calculation/i)
  })
})
