import type { GeneKeySpectrum } from './types'

type GeneKeyDefinition = readonly [shadow: string, gift: string, siddhi: string]

const GENE_KEYS_SOURCE_LABEL = 'Gene Keys Living Library · Spectrum of Consciousness'

const DEFINITIONS: readonly GeneKeyDefinition[] = [
  ['Entropy', 'Freshness', 'Beauty'],
  ['Dislocation', 'Orientation', 'Unity'],
  ['Chaos', 'Innovation', 'Innocence'],
  ['Intolerance', 'Understanding', 'Forgiveness'],
  ['Impatience', 'Patience', 'Timelessness'],
  ['Conflict', 'Diplomacy', 'Peace'],
  ['Division', 'Guidance', 'Virtue'],
  ['Mediocrity', 'Style', 'Exquisiteness'],
  ['Inertia', 'Determination', 'Invincibility'],
  ['Self Obsession', 'Naturalness', 'Being'],
  ['Obscurity', 'Idealism', 'Light'],
  ['Vanity', 'Discrimination', 'Purity'],
  ['Discord', 'Discernment', 'Empathy'],
  ['Compromise', 'Competence', 'Bounteousness'],
  ['Dullness', 'Magnetism', 'Florescence'],
  ['Indifference', 'Versatility', 'Mastery'],
  ['Opinion', 'Far-sightedness', 'Omniscience'],
  ['Judgment', 'Integrity', 'Perfection'],
  ['Co-dependence', 'Sensitivity', 'Sacrifice'],
  ['Superficiality', 'Self Assurance', 'Presence'],
  ['Control', 'Authority', 'Valor'],
  ['Dishonor', 'Graciousness', 'Grace'],
  ['Complexity', 'Simplicity', 'Quintessence'],
  ['Addiction', 'Invention', 'Silence'],
  ['Constriction', 'Acceptance', 'Universal Love'],
  ['Pride', 'Artfulness', 'Invisibility'],
  ['Selfishness', 'Altruism', 'Selflessness'],
  ['Purposelessness', 'Totality', 'Immortality'],
  ['Half-Heartedness', 'Commitment', 'Devotion'],
  ['Desire', 'Lightness', 'Rapture'],
  ['Arrogance', 'Leadership', 'Humility'],
  ['Failure', 'Preservation', 'Veneration'],
  ['Forgetting', 'Mindfulness', 'Revelation'],
  ['Force', 'Strength', 'Majesty'],
  ['Hunger', 'Adventure', 'Boundlessness'],
  ['Turbulence', 'Humanity', 'Compassion'],
  ['Weakness', 'Equality', 'Tenderness'],
  ['Struggle', 'Perseverance', 'Honor'],
  ['Provocation', 'Dynamism', 'Liberation'],
  ['Exhaustion', 'Resolve', 'Divine Will'],
  ['Fantasy', 'Anticipation', 'Emanation'],
  ['Expectation', 'Detachment', 'Celebration'],
  ['Deafness', 'Insight', 'Epiphany'],
  ['Interference', 'Teamwork', 'Synarchy'],
  ['Dominance', 'Synergy', 'Communion'],
  ['Seriousness', 'Delight', 'Ecstasy'],
  ['Oppression', 'Transmutation', 'Transfiguration'],
  ['Inadequacy', 'Resourcefulness', 'Wisdom'],
  ['Reaction', 'Revolution', 'Rebirth'],
  ['Corruption', 'Equilibrium', 'Harmony'],
  ['Agitation', 'Initiative', 'Awakening'],
  ['Stress', 'Restraint', 'Stillness'],
  ['Immaturity', 'Expansion', 'Superabundance'],
  ['Greed', 'Aspiration', 'Ascension'],
  ['Victimisation', 'Freedom', 'Freedom'],
  ['Distraction', 'Enrichment', 'Intoxication'],
  ['Unease', 'Intuition', 'Clarity'],
  ['Dissatisfaction', 'Vitality', 'Bliss'],
  ['Dishonesty', 'Intimacy', 'Transparency'],
  ['Limitation', 'Realism', 'Justice'],
  ['Psychosis', 'Inspiration', 'Sanctity'],
  ['Intellect', 'Precision', 'Impeccability'],
  ['Doubt', 'Inquiry', 'Truth'],
  ['Confusion', 'Imagination', 'Illumination'],
]

export const getGeneKeySpectrum = (number: number): GeneKeySpectrum => {
  const definition = DEFINITIONS[number - 1]
  if (!definition) {
    throw new Error(`Unknown Gene Key number: ${number}`)
  }

  return {
    shadow: definition[0],
    gift: definition[1],
    siddhi: definition[2],
    status: 'curated',
    sourceLabel: GENE_KEYS_SOURCE_LABEL,
    sourceUrl: `https://genekeys.com/gene-key-${number}/`,
  }
}

export const GENE_KEY_COUNT = DEFINITIONS.length
