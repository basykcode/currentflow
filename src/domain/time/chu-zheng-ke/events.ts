import type { ShichenClockState, TemporalClockEvent } from './types'

export const classifyTemporalClockEvent = (
  previous: ShichenClockState,
  next: ShichenClockState,
): TemporalClockEvent => {
  if (
    previous.shichenId !== next.shichenId ||
    previous.hourPhase.shichenStartUtc !== next.hourPhase.shichenStartUtc
  ) {
    return 'shichen-change'
  }
  if (previous.hourPhase.macroHour !== next.hourPhase.macroHour) {
    return 'macro-hour-change'
  }
  if (previous.hourPhase.microHour !== next.hourPhase.microHour) {
    return 'micro-hour-change'
  }
  return 'minute-passage'
}

export const temporalEventRefreshesGuidance = (event: TemporalClockEvent) =>
  event === 'macro-hour-change' || event === 'shichen-change'
