declare module 'lunar-javascript' {
  export interface JieQi {
    getName(): string
    getSolar(): SolarDate
  }

  export interface LunarDate {
    getYearInGanZhiExact(): string
    getYearShengXiaoExact(): string
    getMonthInGanZhiExact(): string
    getDayInGanZhiExact2(): string
    getTimeInGanZhi(): string
    getJieQiTable(): Record<string, SolarDate>
    getNextJie(wholeDay?: boolean): JieQi | null
    getPrevJie(wholeDay?: boolean): JieQi | null
  }

  export interface SolarDate {
    getLunar(): LunarDate
    toYmdHms(): string
  }

  export const Solar: {
    fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): SolarDate
  }
}
