import { describe, expect, it } from 'vitest'

import { DemoCurrentFlowProvider } from '../demoCurrentFlow'

describe('DemoCurrentFlowProvider', () => {
  it('returns a fully demo-labeled snapshot without calculation claims', async () => {
    const provider = new DemoCurrentFlowProvider()
    const snapshot = await provider.getSnapshot(new Date('2026-01-02T03:04:05.000Z'))

    expect(snapshot.status).toBe('demo')
    expect(Object.values(snapshot.temporal).every((item) => item.status === 'demo')).toBe(true)
    expect(snapshot.organ.status).toBe('demo')
    expect(snapshot.provenance.notes.join(' ')).toMatch(/No calendrical calculation/i)
  })
})
