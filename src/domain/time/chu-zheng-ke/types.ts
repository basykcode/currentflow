export type TemporalTimeBasis = 'local-civil' | 'local-mean-solar' | 'apparent-solar'

export type ShichenPhaseCoordinate = Readonly<{
  timeBasis: TemporalTimeBasis
  elapsedBasisMinutes: number
  totalBasisMinutes: 120
  startUtc: string
  endUtc: string
  nextMinuteBoundaryUtc: string
  nextMicroBoundaryUtc: string
  nextMacroBoundaryUtc: string
  nextShichenBoundaryUtc: string
  warnings: readonly string[]
}>

export type MacroHour = 'chu' | 'zheng'
export type MacroSemantic = 'entering' | 'established'
export type MicroHour = 0 | 1 | 2 | 3
export type ChineseMacroLabel = '初' | '正'
export type ChineseKeLabel = '初刻' | '一刻' | '二刻' | '三刻'

export type HourPhase = Readonly<{
  methodologyId: 'temporal-hour-phase:chu-zheng-ke-96-v1'
  methodologyVersion: string
  timeBasis: TemporalTimeBasis
  shichenStartUtc: string
  shichenEndUtc: string
  shichenElapsedBasisMinutes: number
  shichenElapsedWholeMinutes: number
  macroHour: MacroHour
  macroSemantic: MacroSemantic
  chineseMacroLabel: ChineseMacroLabel
  macroElapsedBasisMinutes: number
  macroElapsedWholeMinutes: number
  microHour: MicroHour
  chineseKeLabel: ChineseKeLabel
  timelinePosition: number
  nextMinuteBoundaryUtc: string
  nextMicroBoundaryUtc: string
  nextMacroBoundaryUtc: string
  nextShichenBoundaryUtc: string
  warnings: readonly string[]
}>

export type TemporalClockEvent =
  'minute-passage' | 'micro-hour-change' | 'macro-hour-change' | 'shichen-change'

export type ShichenClockState = Readonly<{
  shichenId: string
  hourPhase: HourPhase
}>
