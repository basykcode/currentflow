export type ZonedCivilTime = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  timezone: string
  usedTimezoneFallback: boolean
}

export type CivilWallTime = Pick<
  ZonedCivilTime,
  'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'
>

const systemTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

const isSupportedTimezone = (timezone: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format()
    return true
  } catch {
    return false
  }
}

const numericPart = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) => {
  const part = parts.find((candidate) => candidate.type === type)
  if (!part) {
    throw new Error(`Intl did not return a ${type} date part.`)
  }
  return Number(part.value)
}

export const getZonedCivilTime = (instant: Date, requestedTimezone?: string): ZonedCivilTime => {
  if (Number.isNaN(instant.getTime())) {
    throw new Error('A valid instant is required to calculate the current flow.')
  }

  const fallbackTimezone = systemTimezone()
  const timezone =
    requestedTimezone && isSupportedTimezone(requestedTimezone)
      ? requestedTimezone
      : fallbackTimezone

  const formatter = new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const parts = formatter.formatToParts(instant)

  return {
    year: numericPart(parts, 'year'),
    month: numericPart(parts, 'month'),
    day: numericPart(parts, 'day'),
    hour: numericPart(parts, 'hour'),
    minute: numericPart(parts, 'minute'),
    second: numericPart(parts, 'second'),
    timezone,
    usedTimezoneFallback: Boolean(requestedTimezone && requestedTimezone !== timezone),
  }
}

const wallTimeEpoch = (value: CivilWallTime) =>
  Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute, value.second)

export const zonedWallTimeToUtc = (value: CivilWallTime, timezone: string): string => {
  if (!isSupportedTimezone(timezone)) throw new Error(`Unsupported IANA timezone: ${timezone}.`)
  const target = wallTimeEpoch(value)
  let candidate = target

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const projected = getZonedCivilTime(new Date(candidate), timezone)
    const delta = target - wallTimeEpoch(projected)
    if (delta === 0) return new Date(candidate).toISOString()
    candidate += delta
  }

  throw new Error(
    `Unable to resolve ${JSON.stringify(value)} as an exact wall time in ${timezone}.`,
  )
}
