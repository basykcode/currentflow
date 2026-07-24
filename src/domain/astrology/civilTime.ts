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
