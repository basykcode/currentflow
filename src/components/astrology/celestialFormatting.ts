import type { CelestialPeriodBounds } from '@/domain/current-flow/celestial-instruments'

const normalizeGmtLabel = (label: string) =>
  label.replace('GMT+00:00', 'GMT').replace('GMT-00:00', 'GMT').replace('-', '−')

export const formatGmtOffsetLabel = (instant: Date, timezone: string) => {
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  })
    .formatToParts(instant)
    .find(({ type }) => type === 'timeZoneName')
  return normalizeGmtLabel(part?.value ?? 'GMT')
}

const zonedDateParts = (instant: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
  }).formatToParts(instant)
  return {
    month: parts.find(({ type }) => type === 'month')?.value ?? '',
    day: parts.find(({ type }) => type === 'day')?.value ?? '',
  }
}

const exactBoundaryLabel = (instant: Date, timezone: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(instant)

export const formatCelestialPeriodBounds = (
  bounds: CelestialPeriodBounds | null,
  timezone: string,
) => {
  if (!bounds) {
    return Object.freeze({
      compactLabel: 'Bounds unavailable',
      accessibleLabel: 'Period bounds unavailable',
    })
  }

  const start = new Date(bounds.startUtc)
  const end = new Date(bounds.endExclusiveUtc)
  const startDate = zonedDateParts(start, timezone)
  const endDate = zonedDateParts(end, timezone)
  const compactLabel =
    startDate.month === endDate.month
      ? `${startDate.month} ${startDate.day}–${endDate.day}`
      : `${startDate.month} ${startDate.day}–${endDate.month} ${endDate.day}`
  const accessibleLabel = `${exactBoundaryLabel(start, timezone)} ${formatGmtOffsetLabel(start, timezone)} – ${exactBoundaryLabel(end, timezone)} ${formatGmtOffsetLabel(end, timezone)}`

  return Object.freeze({ compactLabel, accessibleLabel })
}
