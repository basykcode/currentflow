import { getZonedCivilTime } from '@/domain/astrology/civilTime'

const MINUTE_MS = 60_000
const MAX_SCAN_MINUTES = 4 * 60

const earthlyBranchIndex = (hour: number) => Math.floor(((hour + 1) % 24) / 2)

export const getNextEarthlyBranchBoundaryUtc = (at: Date, timezone: string) => {
  if (Number.isNaN(at.getTime())) throw new Error('A valid instant is required.')
  const currentBranch = earthlyBranchIndex(getZonedCivilTime(at, timezone).hour)
  const firstWholeMinute = Math.floor(at.getTime() / MINUTE_MS) * MINUTE_MS + MINUTE_MS

  for (let offset = 0; offset <= MAX_SCAN_MINUTES; offset += 1) {
    const candidate = new Date(firstWholeMinute + offset * MINUTE_MS)
    const civil = getZonedCivilTime(candidate, timezone)
    if (civil.minute === 0 && earthlyBranchIndex(civil.hour) !== currentBranch) {
      return candidate.toISOString()
    }
  }

  throw new Error('Unable to resolve the next Earthly Branch hour boundary.')
}
