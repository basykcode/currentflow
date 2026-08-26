import { getHexagram } from '@/domain/astrology/hexagrams'
import type { HexagramReference } from '@/domain/astrology/types'

import type { HexagramSemanticProfile } from '../types'
import { HEXAGRAM_SEMANTIC_PROFILES } from './profiles'
import { validateHexagramSemanticProfiles } from './validation'

export type HexagramSemanticRecord = Readonly<{
  hexagram: HexagramReference
  profile: HexagramSemanticProfile
}>

const validation = validateHexagramSemanticProfiles(HEXAGRAM_SEMANTIC_PROFILES)
if (!validation.valid) {
  throw new Error(
    `Invalid Current hexagram semantic registry: ${validation.issues
      .map((issue) => `#${issue.hexagramNumber} ${issue.field}: ${issue.message}`)
      .join(' ')}`,
  )
}

const REGISTRY = new Map<number, HexagramSemanticRecord>(
  HEXAGRAM_SEMANTIC_PROFILES.map((profile) => [
    profile.hexagramNumber,
    Object.freeze({ hexagram: getHexagram(profile.hexagramNumber), profile }),
  ]),
)

export const getHexagramSemanticRecord = (
  hexagramNumber: number,
): HexagramSemanticRecord | undefined => REGISTRY.get(hexagramNumber)

export const getHexagramSemanticProfile = (
  hexagramNumber: number,
): HexagramSemanticProfile | undefined => getHexagramSemanticRecord(hexagramNumber)?.profile

export const getHexagramSemanticRecords = (): readonly HexagramSemanticRecord[] => [
  ...REGISTRY.values(),
]
