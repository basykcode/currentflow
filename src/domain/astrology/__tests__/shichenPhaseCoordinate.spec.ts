import { describe, expect, it } from 'vitest'

import { resolveLocalCivilShichenPhase } from '../shichenPhaseCoordinate'

describe('resolveLocalCivilShichenPhase', () => {
  it('resolves phase from the same local-civil Shíchen coordinate', () => {
    const state = resolveLocalCivilShichenPhase(
      new Date('2026-07-23T16:30:45.500Z'),
      'America/New_York',
    )

    expect(state.shichen).toMatchObject({ id: 'wu', branchChinese: '午', animalEnglish: 'Horse' })
    expect(state.nextShichen).toMatchObject({ id: 'wei', branchChinese: '未' })
    expect(state.hourPhase).toMatchObject({
      timeBasis: 'local-civil',
      shichenElapsedBasisMinutes: 90.75833333333334,
      macroHour: 'zheng',
      microHour: 2,
      shichenStartUtc: '2026-07-23T15:00:00.000Z',
      shichenEndUtc: '2026-07-23T17:00:00.000Z',
      nextMicroBoundaryUtc: '2026-07-23T16:45:00.000Z',
      nextMacroBoundaryUtc: '2026-07-23T17:00:00.000Z',
    })
  })

  it('uses the configured timezone for the same absolute instant', () => {
    const instant = new Date('2026-07-23T16:00:00.000Z')
    const newYork = resolveLocalCivilShichenPhase(instant, 'America/New_York')
    const losAngeles = resolveLocalCivilShichenPhase(instant, 'America/Los_Angeles')

    expect(newYork.shichen.id).toBe('wu')
    expect(newYork.hourPhase.shichenElapsedBasisMinutes).toBe(60)
    expect(losAngeles.shichen.id).toBe('si')
    expect(losAngeles.hourPhase.shichenElapsedBasisMinutes).toBe(0)
  })

  it('keeps a controlled historical/simulated instant frozen and deterministic', () => {
    const simulated = new Date('1999-12-31T23:44:30.000Z')
    const first = resolveLocalCivilShichenPhase(simulated, 'Asia/Shanghai')
    const repeated = resolveLocalCivilShichenPhase(simulated, 'Asia/Shanghai')

    expect(repeated).toEqual(first)
    expect(first.hourPhase.nextMinuteBoundaryUtc).toBe('1999-12-31T23:45:00.000Z')
  })

  it('follows the existing spring-forward policy without inventing skipped civil time', () => {
    const beforeGap = resolveLocalCivilShichenPhase(
      new Date('2026-03-08T06:30:00.000Z'),
      'America/New_York',
    )
    const afterGap = resolveLocalCivilShichenPhase(
      new Date('2026-03-08T07:00:00.000Z'),
      'America/New_York',
    )

    expect(beforeGap.shichen.id).toBe('chou')
    expect(beforeGap.hourPhase.shichenElapsedBasisMinutes).toBe(30)
    expect(beforeGap.hourPhase.nextMacroBoundaryUtc).toBe('2026-03-08T07:00:00.000Z')
    expect(beforeGap.hourPhase.nextShichenBoundaryUtc).toBe('2026-03-08T07:00:00.000Z')
    expect(beforeGap.hourPhase.warnings[0]).toMatch(/60 real UTC minutes/)
    expect(afterGap.shichen.id).toBe('yin')
    expect(afterGap.hourPhase.shichenElapsedBasisMinutes).toBe(0)
  })

  it('keeps repeated fall-back civil labels in the same authoritative Shíchen', () => {
    const firstOccurrence = resolveLocalCivilShichenPhase(
      new Date('2026-11-01T05:30:00.000Z'),
      'America/New_York',
    )
    const repeatedOccurrence = resolveLocalCivilShichenPhase(
      new Date('2026-11-01T06:30:00.000Z'),
      'America/New_York',
    )

    expect(firstOccurrence.shichen.id).toBe('chou')
    expect(repeatedOccurrence.shichen.id).toBe('chou')
    expect(firstOccurrence.hourPhase.shichenElapsedBasisMinutes).toBe(30)
    expect(repeatedOccurrence.hourPhase.shichenElapsedBasisMinutes).toBe(30)
    expect(repeatedOccurrence.hourPhase.shichenStartUtc).toBe('2026-11-01T05:00:00.000Z')
    expect(repeatedOccurrence.hourPhase.shichenEndUtc).toBe('2026-11-01T08:00:00.000Z')
    expect(repeatedOccurrence.hourPhase.warnings[0]).toMatch(/180 real UTC minutes/)
  })
})
