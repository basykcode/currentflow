import type { HexagramReference } from './types'

export const normalizeHexagramSearchTerm = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .trim()

export const filterHexagrams = (
  hexagrams: readonly HexagramReference[],
  searchTerm: string,
): readonly HexagramReference[] => {
  const query = normalizeHexagramSearchTerm(searchTerm)
  if (!query) return hexagrams

  if (/^\d+$/.test(query)) {
    const number = Number(query)
    return hexagrams.filter((hexagram) => hexagram.number === number)
  }

  return hexagrams.filter((hexagram) =>
    [
      hexagram.nameEnglish,
      hexagram.nameChinese,
      hexagram.namePinyin,
      hexagram.geneKey.shadow,
      hexagram.geneKey.gift,
      hexagram.geneKey.siddhi,
    ].some((value) => normalizeHexagramSearchTerm(value).includes(query)),
  )
}
