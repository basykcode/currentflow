export type GanZhiElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

export type GanZhiAnimal =
  | 'rat'
  | 'ox'
  | 'tiger'
  | 'rabbit'
  | 'dragon'
  | 'snake'
  | 'horse'
  | 'goat'
  | 'monkey'
  | 'rooster'
  | 'dog'
  | 'pig'

export type GanZhiZodiac = Readonly<{
  ganZhi: string
  polarity: 'yang' | 'yin'
  element: GanZhiElement
  animal: GanZhiAnimal
  animalLabel: string
}>

const STEMS = new Map<
  string,
  Readonly<{ polarity: GanZhiZodiac['polarity']; element: GanZhiElement }>
>([
  ['甲', { polarity: 'yang', element: 'wood' }],
  ['乙', { polarity: 'yin', element: 'wood' }],
  ['丙', { polarity: 'yang', element: 'fire' }],
  ['丁', { polarity: 'yin', element: 'fire' }],
  ['戊', { polarity: 'yang', element: 'earth' }],
  ['己', { polarity: 'yin', element: 'earth' }],
  ['庚', { polarity: 'yang', element: 'metal' }],
  ['辛', { polarity: 'yin', element: 'metal' }],
  ['壬', { polarity: 'yang', element: 'water' }],
  ['癸', { polarity: 'yin', element: 'water' }],
])

const BRANCH_ANIMALS = new Map<string, Readonly<{ animal: GanZhiAnimal; animalLabel: string }>>([
  ['子', { animal: 'rat', animalLabel: 'Rat' }],
  ['丑', { animal: 'ox', animalLabel: 'Ox' }],
  ['寅', { animal: 'tiger', animalLabel: 'Tiger' }],
  ['卯', { animal: 'rabbit', animalLabel: 'Rabbit' }],
  ['辰', { animal: 'dragon', animalLabel: 'Dragon' }],
  ['巳', { animal: 'snake', animalLabel: 'Snake' }],
  ['午', { animal: 'horse', animalLabel: 'Horse' }],
  ['未', { animal: 'goat', animalLabel: 'Goat' }],
  ['申', { animal: 'monkey', animalLabel: 'Monkey' }],
  ['酉', { animal: 'rooster', animalLabel: 'Rooster' }],
  ['戌', { animal: 'dog', animalLabel: 'Dog' }],
  ['亥', { animal: 'pig', animalLabel: 'Pig' }],
])

export const resolveGanZhiZodiac = (ganZhi: string): GanZhiZodiac => {
  const [stemCharacter, branchCharacter] = [...ganZhi]
  const stem = stemCharacter ? STEMS.get(stemCharacter) : undefined
  const branch = branchCharacter ? BRANCH_ANIMALS.get(branchCharacter) : undefined

  if (!stem || !branch) {
    throw new Error(`Unsupported GanZhi value: ${ganZhi}`)
  }

  return {
    ganZhi,
    polarity: stem.polarity,
    element: stem.element,
    animal: branch.animal,
    animalLabel: branch.animalLabel,
  }
}

const titleCase = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`

export const describeGanZhi = (ganZhi: string) => {
  const zodiac = resolveGanZhiZodiac(ganZhi)

  return `${ganZhi} · ${titleCase(zodiac.element)} ${zodiac.animalLabel}`
}
