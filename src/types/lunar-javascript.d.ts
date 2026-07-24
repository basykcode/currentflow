declare module 'lunar-javascript' {
  export interface LunarDate {
    getYearInGanZhiExact(): string
    getYearShengXiaoExact(): string
    getMonthInGanZhiExact(): string
    getDayInGanZhiExact2(): string
    getTimeInGanZhi(): string
  }

  export interface SolarDate {
    getLunar(): LunarDate
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
