const STEMS = new Map<string, string>([
  ['甲', 'Yang Wood'],
  ['乙', 'Yin Wood'],
  ['丙', 'Yang Fire'],
  ['丁', 'Yin Fire'],
  ['戊', 'Yang Earth'],
  ['己', 'Yin Earth'],
  ['庚', 'Yang Metal'],
  ['辛', 'Yin Metal'],
  ['壬', 'Yang Water'],
  ['癸', 'Yin Water'],
])

const BRANCH_ANIMALS = new Map<string, string>([
  ['子', 'Rat'],
  ['丑', 'Ox'],
  ['寅', 'Tiger'],
  ['卯', 'Rabbit'],
  ['辰', 'Dragon'],
  ['巳', 'Snake'],
  ['午', 'Horse'],
  ['未', 'Goat'],
  ['申', 'Monkey'],
  ['酉', 'Rooster'],
  ['戌', 'Dog'],
  ['亥', 'Pig'],
])

export const describeGanZhi = (ganZhi: string) => {
  const [stemCharacter, branchCharacter] = [...ganZhi]
  const stem = stemCharacter ? STEMS.get(stemCharacter) : undefined
  const animal = branchCharacter ? BRANCH_ANIMALS.get(branchCharacter) : undefined

  if (!stem || !animal) {
    throw new Error(`Unsupported GanZhi value: ${ganZhi}`)
  }

  return `${ganZhi} · ${stem} ${animal}`
}
