import { CELESTIAL_INSTRUMENT_METHODOLOGY } from './methodology'
import type {
  BranchMonthDefinition,
  CantongQiDisplayDefinition,
  CantongQiNodeId,
  SolarTermDisplayDefinition,
} from './types'

export const CANTONG_QI_DISPLAY_DEFINITIONS = Object.freeze([
  {
    nodeId: 'zhen-emergence',
    character: '震',
    pinyin: 'Zhèn',
    englishLabel: 'Emergence',
    yinYangMovement: 'Yang Emerging',
    index: 0,
  },
  {
    nodeId: 'dui-accumulation',
    character: '兌',
    pinyin: 'Duì',
    englishLabel: 'Accumulation',
    yinYangMovement: 'Yang Growing',
    index: 1,
  },
  {
    nodeId: 'qian-culmination',
    character: '乾',
    pinyin: 'Qián',
    englishLabel: 'Culmination',
    yinYangMovement: 'Yang Full',
    index: 2,
  },
  {
    nodeId: 'xun-distribution',
    character: '巽',
    pinyin: 'Xùn',
    englishLabel: 'Distribution',
    yinYangMovement: 'Yin Emerging',
    index: 3,
  },
  {
    nodeId: 'gen-consolidation',
    character: '艮',
    pinyin: 'Gèn',
    englishLabel: 'Consolidation',
    yinYangMovement: 'Yin Growing',
    index: 4,
  },
  {
    nodeId: 'kun-concealment',
    character: '坤',
    pinyin: 'Kūn',
    englishLabel: 'Concealment',
    yinYangMovement: 'Yin Full',
    index: 5,
  },
] as const satisfies readonly CantongQiDisplayDefinition[])

const CANTONG_QI_BY_ID = new Map<CantongQiNodeId, CantongQiDisplayDefinition>(
  CANTONG_QI_DISPLAY_DEFINITIONS.map((definition) => [definition.nodeId, definition]),
)

export const getCantongQiDisplayDefinition = (nodeId: CantongQiNodeId) =>
  CANTONG_QI_BY_ID.get(nodeId) ?? null

export const EARTHLY_BRANCH_MONTH_DEFINITIONS = Object.freeze([
  { character: '子', pinyin: 'Zǐ', animalEnglish: 'Rat', index: 0 },
  { character: '丑', pinyin: 'Chǒu', animalEnglish: 'Ox', index: 1 },
  { character: '寅', pinyin: 'Yín', animalEnglish: 'Tiger', index: 2 },
  { character: '卯', pinyin: 'Mǎo', animalEnglish: 'Rabbit', index: 3 },
  { character: '辰', pinyin: 'Chén', animalEnglish: 'Dragon', index: 4 },
  { character: '巳', pinyin: 'Sì', animalEnglish: 'Snake', index: 5 },
  { character: '午', pinyin: 'Wǔ', animalEnglish: 'Horse', index: 6 },
  { character: '未', pinyin: 'Wèi', animalEnglish: 'Goat', index: 7 },
  { character: '申', pinyin: 'Shēn', animalEnglish: 'Monkey', index: 8 },
  { character: '酉', pinyin: 'Yǒu', animalEnglish: 'Rooster', index: 9 },
  { character: '戌', pinyin: 'Xū', animalEnglish: 'Dog', index: 10 },
  { character: '亥', pinyin: 'Hài', animalEnglish: 'Pig', index: 11 },
] as const satisfies readonly BranchMonthDefinition[])

const term = (
  id: string,
  chineseTraditional: string,
  pinyin: string,
  contextualEnglish: string,
  solarLongitudeDegrees: number,
): SolarTermDisplayDefinition => ({
  id,
  chineseTraditional,
  pinyin,
  contextualEnglish,
  solarLongitudeDegrees,
  displayTableVersion: CELESTIAL_INSTRUMENT_METHODOLOGY.solarTermDisplay,
})

export const SOLAR_TERM_DISPLAY_DEFINITIONS = Object.freeze([
  term('lichun', '立春', 'Lìchūn', 'Beginning of Spring', 315),
  term('yushui', '雨水', 'Yǔshuǐ', 'Rain Water', 330),
  term('jingzhe', '驚蟄', 'Jīngzhé', 'Awakening of Insects', 345),
  term('chunfen', '春分', 'Chūnfēn', 'Spring Equinox', 0),
  term('qingming', '清明', 'Qīngmíng', 'Clear Brightness', 15),
  term('guyu', '穀雨', 'Gǔyǔ', 'Grain Rain', 30),
  term('lixia', '立夏', 'Lìxià', 'Beginning of Summer', 45),
  term('xiaoman', '小滿', 'Xiǎomǎn', 'Lesser Fullness', 60),
  term('mangzhong', '芒種', 'Mángzhòng', 'Grain in Ear', 75),
  term('xiazhi', '夏至', 'Xiàzhì', 'Summer Solstice', 90),
  term('xiaoshu', '小暑', 'Xiǎoshǔ', 'Lesser Heat', 105),
  term('dashu', '大暑', 'Dàshǔ', 'Greater Heat', 120),
  term('liqiu', '立秋', 'Lìqiū', 'Beginning of Autumn', 135),
  term('chushu', '處暑', 'Chǔshǔ', 'Limit of Heat', 150),
  term('bailu', '白露', 'Báilù', 'White Dew', 165),
  term('qiufen', '秋分', 'Qiūfēn', 'Autumn Equinox', 180),
  term('hanlu', '寒露', 'Hánlù', 'Cold Dew', 195),
  term('shuangjiang', '霜降', 'Shuāngjiàng', 'Frost Descent', 210),
  term('lidong', '立冬', 'Lìdōng', 'Beginning of Winter', 225),
  term('xiaoxue', '小雪', 'Xiǎoxuě', 'Lesser Snow', 240),
  term('daxue', '大雪', 'Dàxuě', 'Greater Snow', 255),
  term('dongzhi', '冬至', 'Dōngzhì', 'Winter Solstice', 270),
  term('xiaohan', '小寒', 'Xiǎohán', 'Lesser Cold', 285),
  term('dahan', '大寒', 'Dàhán', 'Greater Cold', 300),
] as const satisfies readonly SolarTermDisplayDefinition[])

const SOLAR_TERM_BY_ID = new Map(
  SOLAR_TERM_DISPLAY_DEFINITIONS.map((definition) => [definition.id, definition]),
)

export const getSolarTermDisplayDefinition = (id: string) => SOLAR_TERM_BY_ID.get(id) ?? null
