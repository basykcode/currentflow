import { describe, expect, it } from 'vitest'

import {
  lunarMarkerAngleDegrees,
  pointOnCircle,
  resolveBranchMonthFromSolarLongitude,
  resolveChineseSolarSeason,
  solarMarkerAngleDegrees,
  unwrapAngleForShortestPath,
} from '../geometry'

describe('celestial instrument geometry', () => {
  it.each([
    [0, 50, 10],
    [90, 90, 50],
    [180, 50, 90],
    [270, 10, 50],
  ])('maps %i° clockwise from top to the expected cardinal point', (angle, x, y) => {
    const point = pointOnCircle(50, 50, 40, angle)
    expect(point.x).toBeCloseTo(x, 8)
    expect(point.y).toBeCloseTo(y, 8)
    expect(point.x).toBeGreaterThanOrEqual(10)
    expect(point.x).toBeLessThanOrEqual(90)
    expect(point.y).toBeGreaterThanOrEqual(10)
    expect(point.y).toBeLessThanOrEqual(90)
  })

  it('uses astronomical elongation directly for the lunar ring', () => {
    expect(lunarMarkerAngleDegrees(0)).toBe(0)
    expect(lunarMarkerAngleDegrees(90)).toBe(90)
    expect(lunarMarkerAngleDegrees(180)).toBe(180)
    expect(lunarMarkerAngleDegrees(270)).toBe(270)
  })

  it('orients Winter Solstice to the top of the solar ring', () => {
    expect(solarMarkerAngleDegrees(270)).toBe(0)
    expect(solarMarkerAngleDegrees(0)).toBe(90)
    expect(solarMarkerAngleDegrees(90)).toBe(180)
    expect(solarMarkerAngleDegrees(180)).toBe(270)
  })

  it('unwraps ordinary transitions through 360° by the shortest path', () => {
    expect(unwrapAngleForShortestPath(359, 1)).toBe(361)
    expect(unwrapAngleForShortestPath(1, 359)).toBe(-1)
    expect(unwrapAngleForShortestPath(120, 130)).toBe(130)
  })

  it.each([
    [314.999, 'Winter'],
    [315, 'Spring'],
    [44.999, 'Spring'],
    [45, 'Summer'],
    [134.999, 'Summer'],
    [135, 'Autumn'],
    [224.999, 'Autumn'],
    [225, 'Winter'],
  ] as const)('resolves %f° to the Chinese-defined %s season', (longitude, season) => {
    expect(resolveChineseSolarSeason(longitude)).toBe(season)
  })

  it.each([
    [255, '子'],
    [284.999, '子'],
    [285, '丑'],
    [315, '寅'],
    [345, '卯'],
    [15, '辰'],
    [45, '巳'],
    [75, '午'],
    [105, '未'],
    [135, '申'],
    [165, '酉'],
    [195, '戌'],
    [225, '亥'],
  ] as const)('resolves %f° to Branch %s at the exact sector convention', (longitude, branch) => {
    expect(resolveBranchMonthFromSolarLongitude(longitude).character).toBe(branch)
  })
})
