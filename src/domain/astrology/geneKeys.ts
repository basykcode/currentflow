import type { GeneKeySpectrum } from './types'

type GeneKeyDefinition = readonly [title: string, shadow: string, gift: string, siddhi: string]

export type GeneKeyReference = GeneKeySpectrum & {
  number: number
}

const GENE_KEYS_SOURCE_LABEL = 'Gene Keys Living Library · Spectrum of Consciousness'

const DEFINITIONS: readonly GeneKeyDefinition[] = [
  ['From Entropy to Syntropy', 'Entropy', 'Freshness', 'Beauty'],
  ['Returning to the One', 'Dislocation', 'Orientation', 'Unity'],
  ['Through the Eyes of a Child', 'Chaos', 'Innovation', 'Innocence'],
  ['A Universal Panacea', 'Intolerance', 'Understanding', 'Forgiveness'],
  ['The Ending of Time', 'Impatience', 'Patience', 'Timelessness'],
  ['The Path to Peace', 'Conflict', 'Diplomacy', 'Peace'],
  ['Virtue Is Its Own Reward', 'Division', 'Guidance', 'Virtue'],
  ['Diamond of the Self', 'Mediocrity', 'Style', 'Exquisiteness'],
  ['The Power of the Infinitesimal', 'Inertia', 'Determination', 'Invincibility'],
  ['Being at Ease', 'Self Obsession', 'Naturalness', 'Being'],
  ['The Light of Eden', 'Obscurity', 'Idealism', 'Light'],
  ['A Pure Heart', 'Vanity', 'Discrimination', 'Purity'],
  ['Listening Through Love', 'Discord', 'Discernment', 'Empathy'],
  ['Radiating Prosperity', 'Compromise', 'Competence', 'Bounteousness'],
  ['An Eternally Flowering Spring', 'Dullness', 'Magnetism', 'Florescence'],
  ['Magical Genius', 'Indifference', 'Versatility', 'Mastery'],
  ['The Eye', 'Opinion', 'Far-sightedness', 'Omniscience'],
  ['The Healing Power of Mind', 'Judgment', 'Integrity', 'Perfection'],
  ['The Future Human Being', 'Co-dependence', 'Sensitivity', 'Sacrifice'],
  ['The Sacred Om', 'Superficiality', 'Self Assurance', 'Presence'],
  ['A Noble Life', 'Control', 'Authority', 'Valor'],
  ['Grace Under Pressure', 'Dishonor', 'Graciousness', 'Grace'],
  ['The Alchemy of Simplicity', 'Complexity', 'Simplicity', 'Quintessence'],
  ['Silence – The Ultimate Addiction', 'Addiction', 'Invention', 'Silence'],
  ['The Myth of the Sacred Wound', 'Constriction', 'Acceptance', 'Universal Love'],
  ['Sacred Tricksters', 'Pride', 'Artfulness', 'Invisibility'],
  ['Food of the Gods', 'Selfishness', 'Altruism', 'Selflessness'],
  ['Embracing the Dark Side', 'Purposelessness', 'Totality', 'Immortality'],
  ['Leaping into the Void', 'Half-Heartedness', 'Commitment', 'Devotion'],
  ['Celestial Fire', 'Desire', 'Lightness', 'Rapture'],
  ['Sounding Your Truth', 'Arrogance', 'Leadership', 'Humility'],
  ['Ancestral Reverence', 'Failure', 'Preservation', 'Veneration'],
  ['The Final Revelation', 'Forgetting', 'Mindfulness', 'Revelation'],
  ['The Beauty of the Beast', 'Force', 'Strength', 'Majesty'],
  ['Wormholes and Miracles', 'Hunger', 'Adventure', 'Boundlessness'],
  ['Becoming Human', 'Turbulence', 'Humanity', 'Compassion'],
  ['Family Alchemy', 'Weakness', 'Equality', 'Tenderness'],
  ['The Warrior of Light', 'Struggle', 'Perseverance', 'Honor'],
  ['The Tension of Transcendence', 'Provocation', 'Dynamism', 'Liberation'],
  ['The Will to Surrender', 'Exhaustion', 'Resolve', 'Divine Will'],
  ['The Prime Emanation', 'Fantasy', 'Anticipation', 'Emanation'],
  ['Letting Go of Living and Dying', 'Expectation', 'Detachment', 'Celebration'],
  ['Breakthrough', 'Deafness', 'Insight', 'Epiphany'],
  ['Karmic Relationships', 'Interference', 'Teamwork', 'Synarchy'],
  ['Cosmic Communion', 'Dominance', 'Synergy', 'Communion'],
  ['A Science of Luck', 'Seriousness', 'Delight', 'Ecstasy'],
  ['Transmuting the Past', 'Oppression', 'Transmutation', 'Transfiguration'],
  ['The Wonder of Uncertainty', 'Inadequacy', 'Resourcefulness', 'Wisdom'],
  ['Changing the World from the Inside', 'Reaction', 'Revolution', 'Rebirth'],
  ['Cosmic Order', 'Corruption', 'Equilibrium', 'Harmony'],
  ['Initiative to Initiation', 'Agitation', 'Initiative', 'Awakening'],
  ['The Stillpoint', 'Stress', 'Restraint', 'Stillness'],
  ['Evolving Beyond Evolution', 'Immaturity', 'Expansion', 'Superabundance'],
  ['The Serpent Path', 'Greed', 'Aspiration', 'Ascension'],
  ['The Dragonfly’s Dream', 'Victimisation', 'Freedom', 'Freedom'],
  ['Divine Indulgence', 'Distraction', 'Enrichment', 'Intoxication'],
  ['A Gentle Wind', 'Unease', 'Intuition', 'Clarity'],
  ['From Stress to Bliss', 'Dissatisfaction', 'Vitality', 'Bliss'],
  ['The Dragon in Your Genome', 'Dishonesty', 'Intimacy', 'Transparency'],
  ['The Cracking of the Vessel', 'Limitation', 'Realism', 'Justice'],
  ['The Holy of Holies', 'Psychosis', 'Inspiration', 'Sanctity'],
  ['The Language of Light', 'Intellect', 'Precision', 'Impeccability'],
  ['Reaching the Source', 'Doubt', 'Inquiry', 'Truth'],
  ['The Aurora', 'Confusion', 'Imagination', 'Illumination'],
]

export const getGeneKeySpectrum = (number: number): GeneKeySpectrum => {
  const definition = DEFINITIONS[number - 1]
  if (!definition) {
    throw new Error(`Unknown Gene Key number: ${number}`)
  }

  return {
    title: definition[0],
    shadow: definition[1],
    gift: definition[2],
    siddhi: definition[3],
    status: 'curated',
    sourceLabel: GENE_KEYS_SOURCE_LABEL,
    sourceUrl: `https://genekeys.com/gene-key-${number}/`,
  }
}

export const getGeneKeyReferences = (): readonly GeneKeyReference[] =>
  DEFINITIONS.map((_, index) => {
    const number = index + 1
    return {
      number,
      ...getGeneKeySpectrum(number),
    }
  })

export const GENE_KEY_COUNT = DEFINITIONS.length
