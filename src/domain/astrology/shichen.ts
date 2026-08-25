export type ShichenId =
  'zi' | 'chou' | 'yin' | 'mao' | 'chen' | 'si' | 'wu' | 'wei' | 'shen' | 'you' | 'xu' | 'hai'

export type ShichenIdentity = Readonly<{
  index: number
  id: ShichenId
  branchChinese: string
  branchPinyin: string
  animalEnglish: string
  startCivilHour: number
}>

const SHICHEN_IDENTITIES: readonly ShichenIdentity[] = Object.freeze([
  {
    index: 0,
    id: 'zi',
    branchChinese: '子',
    branchPinyin: 'Zǐ',
    animalEnglish: 'Rat',
    startCivilHour: 23,
  },
  {
    index: 1,
    id: 'chou',
    branchChinese: '丑',
    branchPinyin: 'Chǒu',
    animalEnglish: 'Ox',
    startCivilHour: 1,
  },
  {
    index: 2,
    id: 'yin',
    branchChinese: '寅',
    branchPinyin: 'Yín',
    animalEnglish: 'Tiger',
    startCivilHour: 3,
  },
  {
    index: 3,
    id: 'mao',
    branchChinese: '卯',
    branchPinyin: 'Mǎo',
    animalEnglish: 'Rabbit',
    startCivilHour: 5,
  },
  {
    index: 4,
    id: 'chen',
    branchChinese: '辰',
    branchPinyin: 'Chén',
    animalEnglish: 'Dragon',
    startCivilHour: 7,
  },
  {
    index: 5,
    id: 'si',
    branchChinese: '巳',
    branchPinyin: 'Sì',
    animalEnglish: 'Snake',
    startCivilHour: 9,
  },
  {
    index: 6,
    id: 'wu',
    branchChinese: '午',
    branchPinyin: 'Wǔ',
    animalEnglish: 'Horse',
    startCivilHour: 11,
  },
  {
    index: 7,
    id: 'wei',
    branchChinese: '未',
    branchPinyin: 'Wèi',
    animalEnglish: 'Goat',
    startCivilHour: 13,
  },
  {
    index: 8,
    id: 'shen',
    branchChinese: '申',
    branchPinyin: 'Shēn',
    animalEnglish: 'Monkey',
    startCivilHour: 15,
  },
  {
    index: 9,
    id: 'you',
    branchChinese: '酉',
    branchPinyin: 'Yǒu',
    animalEnglish: 'Rooster',
    startCivilHour: 17,
  },
  {
    index: 10,
    id: 'xu',
    branchChinese: '戌',
    branchPinyin: 'Xū',
    animalEnglish: 'Dog',
    startCivilHour: 19,
  },
  {
    index: 11,
    id: 'hai',
    branchChinese: '亥',
    branchPinyin: 'Hài',
    animalEnglish: 'Pig',
    startCivilHour: 21,
  },
])

const assertCivilHour = (civilHour: number) => {
  if (!Number.isInteger(civilHour) || civilHour < 0 || civilHour > 23) {
    throw new Error(`Civil hour must be an integer from 0 through 23; received ${civilHour}.`)
  }
}

export const getShichenIndex = (civilHour: number) => {
  assertCivilHour(civilHour)
  return Math.floor(((civilHour + 1) % 24) / 2)
}

export const getShichenIdentity = (civilHour: number): ShichenIdentity => {
  const identity = SHICHEN_IDENTITIES[getShichenIndex(civilHour)]
  if (!identity) throw new Error(`No Shíchen identity exists for civil hour ${civilHour}.`)
  return identity
}

export const getNextShichenIdentity = (identity: ShichenIdentity): ShichenIdentity => {
  const next = SHICHEN_IDENTITIES[(identity.index + 1) % SHICHEN_IDENTITIES.length]
  if (!next) throw new Error(`No next Shíchen identity exists after ${identity.id}.`)
  return next
}

export const getShichenElapsedWholeCivilMinutes = (civilHour: number, civilMinute: number) => {
  assertCivilHour(civilHour)
  if (!Number.isInteger(civilMinute) || civilMinute < 0 || civilMinute > 59) {
    throw new Error(`Civil minute must be an integer from 0 through 59; received ${civilMinute}.`)
  }
  const identity = getShichenIdentity(civilHour)
  const elapsedHours = (civilHour - identity.startCivilHour + 24) % 24
  if (elapsedHours > 1) {
    throw new Error(`Civil hour ${civilHour} is inconsistent with Shíchen ${identity.id}.`)
  }
  return elapsedHours * 60 + civilMinute
}

export const SHICHEN_COUNT = SHICHEN_IDENTITIES.length
