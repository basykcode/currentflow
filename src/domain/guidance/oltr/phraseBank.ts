import type {
  EffortLevel,
  GuidanceCondition,
  GuidanceDirection,
  ImageFamily,
  ResponseRelation,
} from '../types'

export type OltrFieldPhrase = Readonly<{
  text: string
  conditions: readonly GuidanceCondition[]
  directions: readonly GuidanceDirection[]
  imageFamilies: readonly ImageFamily[]
}>

export type OltrResponsePhrase = Readonly<{
  text: string
  relations: readonly ResponseRelation[]
  effortLevels: readonly EffortLevel[]
}>

export type OltrPhraseBank = Readonly<{
  fieldPhrases: readonly OltrFieldPhrase[]
  responsePhrases: readonly OltrResponsePhrase[]
}>

const everyDirection: readonly GuidanceDirection[] = [
  'forward',
  'inward',
  'holding',
  'circulating',
  'closing',
  'releasing',
  'stabilizing',
]

const everyImage: readonly ImageFamily[] = [
  'opening',
  'container',
  'bridge',
  'vessel',
  'threshold',
  'current',
  'shelter',
]

export const CONTROLLED_OLTR_PHRASE_BANK: OltrPhraseBank = Object.freeze({
  fieldPhrases: [
    {
      text: 'A workable opening is gathering through steady forward movement',
      conditions: ['emergence'],
      directions: ['forward', 'circulating'],
      imageFamilies: ['opening', 'current'],
    },
    {
      text: 'The field is opening through movement that already carries support',
      conditions: ['emergence'],
      directions: everyDirection,
      imageFamilies: everyImage,
    },
    {
      text: "Momentum is exceeding the field's present capacity for useful movement",
      conditions: ['excess'],
      directions: everyDirection,
      imageFamilies: everyImage,
    },
    {
      text: 'The field is pressurized by more movement than it can carry cleanly',
      conditions: ['excess'],
      directions: ['forward', 'circulating', 'holding'],
      imageFamilies: ['container', 'vessel', 'current'],
    },
    {
      text: 'The field lacks one stabilizing quality for coherent forward movement',
      conditions: ['deficiency'],
      directions: everyDirection,
      imageFamilies: everyImage,
    },
    {
      text: 'Available movement is weakened by a missing form of practical support',
      conditions: ['deficiency'],
      directions: ['forward', 'stabilizing', 'circulating'],
      imageFamilies: ['bridge', 'shelter', 'vessel'],
    },
    {
      text: 'Ripening work is ready for a clean and proportionate close',
      conditions: ['completion'],
      directions: ['closing', 'releasing', 'inward'],
      imageFamilies: ['vessel', 'container', 'shelter'],
    },
    {
      text: 'The current is gathering completed work toward an orderly close',
      conditions: ['completion'],
      directions: everyDirection,
      imageFamilies: everyImage,
    },
    {
      text: 'Conditions are holding at a threshold where premature movement adds friction',
      conditions: ['threshold'],
      directions: ['holding', 'stabilizing', 'inward'],
      imageFamilies: ['threshold', 'shelter', 'container'],
    },
    {
      text: 'The field is resting at a boundary that does not yet support initiation',
      conditions: ['threshold'],
      directions: everyDirection,
      imageFamilies: everyImage,
    },
    {
      text: 'Accumulated friction is slowing circulation and asking for careful repair',
      conditions: ['repair'],
      directions: everyDirection,
      imageFamilies: everyImage,
    },
    {
      text: 'The current is obstructed where one practical repair could restore movement',
      conditions: ['repair'],
      directions: ['circulating', 'stabilizing', 'forward'],
      imageFamilies: ['current', 'bridge', 'vessel'],
    },
    {
      text: 'Outward momentum is thinning and inward space is becoming more useful',
      conditions: ['withdrawal'],
      directions: everyDirection,
      imageFamilies: everyImage,
    },
    {
      text: 'The field is releasing outward pressure and gathering toward a quieter center',
      conditions: ['withdrawal'],
      directions: ['inward', 'releasing', 'holding'],
      imageFamilies: ['shelter', 'container', 'vessel'],
    },
  ],
  responsePhrases: [
    {
      text: 'follow the clearest opening with measured effort',
      relations: ['follow'],
      effortLevels: ['measured', 'steady'],
    },
    {
      text: 'continue the supported movement without forcing its pace',
      relations: ['follow'],
      effortLevels: ['minimal', 'measured', 'steady'],
    },
    {
      text: 'set one firm boundary and keep movement proportionate',
      relations: ['contain'],
      effortLevels: ['minimal', 'measured'],
    },
    {
      text: 'limit fresh inputs and steady what remains in motion',
      relations: ['contain'],
      effortLevels: ['minimal', 'measured'],
    },
    {
      text: 'add the missing support before extending the work',
      relations: ['counterbalance'],
      effortLevels: ['minimal', 'measured', 'steady'],
    },
    {
      text: 'supply one stabilizing quality before asking for more movement',
      relations: ['counterbalance'],
      effortLevels: ['measured', 'steady'],
    },
    {
      text: 'complete the ripest task, then withdraw from further initiation',
      relations: ['complete'],
      effortLevels: ['measured', 'steady', 'decisive'],
    },
    {
      text: 'close the nearest finished cycle and release its remaining demands',
      relations: ['complete'],
      effortLevels: ['steady', 'decisive'],
    },
    {
      text: 'preserve the threshold and delay fresh commitments',
      relations: ['wait'],
      effortLevels: ['minimal', 'measured'],
    },
    {
      text: 'hold the boundary until a clearer movement becomes available',
      relations: ['wait'],
      effortLevels: ['minimal', 'measured'],
    },
    {
      text: 'repair one obstruction and restore ordinary circulation',
      relations: ['transform'],
      effortLevels: ['minimal', 'measured', 'steady'],
    },
    {
      text: 'clear one blockage, then return the system to ordinary use',
      relations: ['transform'],
      effortLevels: ['measured', 'steady'],
    },
    {
      text: 'reduce outward effort and gather attention inward',
      relations: ['withdraw'],
      effortLevels: ['minimal', 'measured'],
    },
    {
      text: 'release one external demand and preserve the quieter center',
      relations: ['withdraw'],
      effortLevels: ['minimal', 'measured'],
    },
  ],
})
