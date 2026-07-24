import { getHexagram } from './hexagrams'

// Howard Choy's “60 Jia Zi to 64 Da Gua” table. The ordered pairs follow
// the canonical sexagenary cycle; the value is the King Wen hexagram number.
const JIA_ZI_TO_HEXAGRAM = new Map<string, number>([
  ['甲子', 24],
  ['乙丑', 21],
  ['丙寅', 37],
  ['丁卯', 41],
  ['戊辰', 10],
  ['己巳', 34],
  ['庚午', 32],
  ['辛未', 6],
  ['壬申', 7],
  ['癸酉', 53],
  ['甲戌', 39],
  ['乙亥', 35],
  ['丙子', 27],
  ['丁丑', 17],
  ['戊寅', 55],
  ['己卯', 60],
  ['庚辰', 11],
  ['辛巳', 14],
  ['壬午', 57],
  ['癸未', 47],
  ['甲申', 64],
  ['乙酉', 33],
  ['丙戌', 52],
  ['丁亥', 16],
  ['戊子', 3],
  ['己丑', 25],
  ['庚寅', 30],
  ['辛卯', 61],
  ['壬辰', 26],
  ['癸巳', 43],
  ['甲午', 1],
  ['乙未', 48],
  ['丙申', 40],
  ['丁酉', 31],
  ['戊戌', 15],
  ['己亥', 20],
  ['庚子', 42],
  ['辛丑', 36],
  ['壬寅', 13],
  ['癸卯', 54],
  ['甲辰', 38],
  ['乙巳', 5],
  ['丙午', 28],
  ['丁未', 18],
  ['戊申', 59],
  ['己酉', 56],
  ['庚戌', 12],
  ['辛亥', 8],
  ['壬子', 51],
  ['癸丑', 22],
  ['甲寅', 63],
  ['乙卯', 19],
  ['丙辰', 58],
  ['丁巳', 9],
  ['戊午', 50],
  ['己未', 46],
  ['庚申', 29],
  ['辛酉', 62],
  ['壬戌', 45],
  ['癸亥', 23],
])

export const resolveJiaZiHexagram = (ganZhi: string) => {
  const number = JIA_ZI_TO_HEXAGRAM.get(ganZhi)
  if (!number) {
    throw new Error(`No 60 Jia Zi hexagram mapping exists for ${ganZhi}.`)
  }
  return getHexagram(number)
}

export const JIA_ZI_MAPPING_COUNT = JIA_ZI_TO_HEXAGRAM.size
