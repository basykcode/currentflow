import type {
  AlchemyProviderCapabilities,
  Citation,
  FormulaDetail,
  HerbDetail,
  SourceClaim,
  TextPassageResult,
} from '../domain/types'

const citation = (
  id: string,
  sourceTitle: string,
  locator: string,
  quotation?: string,
): Citation => ({
  id: `demo:citation:${id}`,
  sourceId: `demo:source:${id.split(':')[0]}`,
  sourceTitle,
  locator,
  language: 'Synthetic English',
  ...(quotation ? { quotation } : {}),
  reviewStatus: 'synthetic_fixture',
})

const claim = (
  id: string,
  predicate: string,
  value: string,
  source: Citation,
  options: {
    status?: SourceClaim['status']
    normalizedValue?: string
    conflictGroupId?: string
  } = {},
): SourceClaim => ({
  id: `demo:claim:${id}`,
  predicate,
  value,
  status: options.status ?? 'demo',
  citations: [source],
  ...(options.normalizedValue ? { normalizedValue: options.normalizedValue } : {}),
  ...(options.conflictGroupId ? { conflictGroupId: options.conflictGroupId } : {}),
})

export const DEMO_INDEX_CITATION = citation(
  'index:leaf-12',
  'Synthetic Materia Index',
  'Leaf 12',
  'Fixture wording only: this passage does not describe a real material.',
)

export const DEMO_NOTEBOOK_CITATION = citation(
  'notebook:folio-7',
  'Demonstration Formulary Notebook',
  'Folio 7b',
  'A synthetic composition prepared to exercise source comparison.',
)

export const DEMO_DISPUTE_CITATION = citation(
  'annotations:card-3',
  'Synthetic Annotation Cards',
  'Card 3',
  'Alternate fixture classification retained to demonstrate disagreement.',
)

const rootA: HerbDetail = {
  id: 'demo:herb:root-a',
  displayName: 'Demo Root A',
  nameChineseSimplified: '演示根甲',
  nameChineseTraditional: '演示根甲',
  pinyin: 'Yǎnshì Gēn Jiǎ',
  latinDrugName: 'Radix demonstrationis alpha',
  botanicalNames: ['Planta exemplaris alpha'],
  aliases: ['Archive Root A', 'Index Root Alpha'],
  categoryLabels: ['Demo roots', 'Index specimens'],
  status: 'conflicted',
  reviewStatus: 'synthetic_fixture',
  sourceCount: 2,
  biologicalSources: [
    claim(
      'root-a:biology',
      'Biological source',
      'Synthetic perennial specimen alpha',
      DEMO_INDEX_CITATION,
    ),
  ],
  medicinalParts: [
    claim('root-a:part', 'Medicinal part', 'Illustrative storage root', DEMO_INDEX_CITATION),
  ],
  preparations: [
    claim('root-a:prep-raw', 'Preparation', 'Unprepared demo slice', DEMO_INDEX_CITATION),
    claim('root-a:prep-toast', 'Preparation', 'Toasted demo slice', DEMO_NOTEBOOK_CITATION),
  ],
  thermalNatures: [
    claim(
      'root-a:nature-balanced',
      'Thermal nature',
      'Balanced — synthetic classification',
      DEMO_INDEX_CITATION,
      { status: 'conflicted', conflictGroupId: 'demo:conflict:root-a-nature' },
    ),
    claim(
      'root-a:nature-cool',
      'Thermal nature',
      'Gently cool — synthetic alternate',
      DEMO_DISPUTE_CITATION,
      { status: 'conflicted', conflictGroupId: 'demo:conflict:root-a-nature' },
    ),
  ],
  flavors: [
    claim(
      'root-a:flavor',
      'Flavor',
      'Mildly aromatic — synthetic classification',
      DEMO_INDEX_CITATION,
    ),
  ],
  channels: [
    claim('root-a:channel', 'Channel', 'Archive channel I — synthetic system', DEMO_INDEX_CITATION),
  ],
  actions: [
    claim(
      'root-a:action',
      'Documented action',
      'Supports indexing exercises — synthetic only',
      DEMO_INDEX_CITATION,
    ),
  ],
  patterns: [
    claim(
      'root-a:pattern',
      'Pattern association',
      'Demonstration pattern alpha — synthetic only',
      DEMO_NOTEBOOK_CITATION,
    ),
  ],
  cautions: [
    claim(
      'root-a:caution',
      'Caution',
      'No interaction data exists beyond this synthetic fixture',
      DEMO_NOTEBOOK_CITATION,
      { status: 'incomplete' },
    ),
  ],
  compounds: [
    claim('root-a:compound', 'Compound', 'Compound-A0 — placeholder identity', DEMO_INDEX_CITATION),
  ],
  relatedFormulaIds: ['demo:formula:one', 'demo:formula:four'],
  completeness: {
    knownFieldCount: 8,
    totalFieldCount: 9,
    unresolvedConflictCount: 1,
  },
}

const seedB: HerbDetail = {
  id: 'demo:herb:seed-b',
  displayName: 'Demo Seed B',
  nameChineseSimplified: '演示籽乙',
  nameChineseTraditional: '演示籽乙',
  pinyin: 'Yǎnshì Zǐ Yǐ',
  latinDrugName: 'Semen demonstrationis beta',
  botanicalNames: ['Planta exemplaris beta'],
  aliases: ['Reference Seed B'],
  categoryLabels: ['Demo seeds'],
  status: 'demo',
  reviewStatus: 'synthetic_fixture',
  sourceCount: 1,
  biologicalSources: [
    claim(
      'seed-b:biology',
      'Biological source',
      'Synthetic annual specimen beta',
      DEMO_INDEX_CITATION,
    ),
  ],
  medicinalParts: [
    claim('seed-b:part', 'Medicinal part', 'Illustrative mature seed', DEMO_INDEX_CITATION),
  ],
  preparations: [claim('seed-b:prep', 'Preparation', 'Crushed demo seed', DEMO_NOTEBOOK_CITATION)],
  thermalNatures: [
    claim(
      'seed-b:nature',
      'Thermal nature',
      'Warm — synthetic classification',
      DEMO_INDEX_CITATION,
    ),
  ],
  flavors: [
    claim('seed-b:flavor', 'Flavor', 'Dry — synthetic classification', DEMO_INDEX_CITATION),
  ],
  channels: [
    claim(
      'seed-b:channel',
      'Channel',
      'Archive channel II — synthetic system',
      DEMO_INDEX_CITATION,
    ),
  ],
  actions: [
    claim(
      'seed-b:action',
      'Documented action',
      'Demonstrates grouped source claims — synthetic only',
      DEMO_INDEX_CITATION,
    ),
  ],
  patterns: [
    claim(
      'seed-b:pattern',
      'Pattern association',
      'Demonstration pattern beta — synthetic only',
      DEMO_NOTEBOOK_CITATION,
    ),
  ],
  cautions: [
    claim(
      'seed-b:caution',
      'Caution',
      'Fixture relationship coverage is intentionally partial',
      DEMO_NOTEBOOK_CITATION,
      { status: 'incomplete' },
    ),
  ],
  compounds: [
    claim('seed-b:compound', 'Compound', 'Compound-B0 — placeholder identity', DEMO_INDEX_CITATION),
  ],
  relatedFormulaIds: ['demo:formula:one', 'demo:formula:two'],
  completeness: {
    knownFieldCount: 9,
    totalFieldCount: 9,
    unresolvedConflictCount: 0,
  },
}

const leafC: HerbDetail = {
  id: 'demo:herb:leaf-c',
  displayName: 'Demo Leaf C',
  nameChineseSimplified: '演示叶丙',
  nameChineseTraditional: '演示葉丙',
  pinyin: 'Yǎnshì Yè Bǐng',
  latinDrugName: 'Folium demonstrationis gamma',
  botanicalNames: ['Planta exemplaris gamma'],
  aliases: ['Study Leaf C', 'Gamma Leaf'],
  categoryLabels: ['Demo leaves', 'Index specimens'],
  status: 'demo',
  reviewStatus: 'synthetic_fixture',
  sourceCount: 2,
  biologicalSources: [
    claim(
      'leaf-c:biology',
      'Biological source',
      'Synthetic shrub specimen gamma',
      DEMO_INDEX_CITATION,
    ),
  ],
  medicinalParts: [
    claim('leaf-c:part', 'Medicinal part', 'Illustrative mature leaf', DEMO_INDEX_CITATION),
  ],
  preparations: [claim('leaf-c:prep', 'Preparation', 'Dried demo leaf', DEMO_NOTEBOOK_CITATION)],
  thermalNatures: [
    claim(
      'leaf-c:nature',
      'Thermal nature',
      'Cool — synthetic classification',
      DEMO_INDEX_CITATION,
    ),
  ],
  flavors: [
    claim('leaf-c:flavor', 'Flavor', 'Light — synthetic classification', DEMO_INDEX_CITATION),
  ],
  channels: [
    claim('leaf-c:channel', 'Channel', 'Archive channel I — synthetic system', DEMO_INDEX_CITATION),
  ],
  actions: [
    claim(
      'leaf-c:action',
      'Documented action',
      'Exercises linked-entity display — synthetic only',
      DEMO_NOTEBOOK_CITATION,
    ),
  ],
  patterns: [
    claim(
      'leaf-c:pattern',
      'Pattern association',
      'Demonstration pattern gamma — synthetic only',
      DEMO_NOTEBOOK_CITATION,
    ),
  ],
  cautions: [
    claim(
      'leaf-c:caution',
      'Caution',
      'No real-world caution record is represented',
      DEMO_NOTEBOOK_CITATION,
      { status: 'incomplete' },
    ),
  ],
  compounds: [
    claim('leaf-c:compound', 'Compound', 'Compound-C0 — placeholder identity', DEMO_INDEX_CITATION),
  ],
  relatedFormulaIds: ['demo:formula:two', 'demo:formula:three'],
  completeness: {
    knownFieldCount: 9,
    totalFieldCount: 9,
    unresolvedConflictCount: 0,
  },
}

const mineralD: HerbDetail = {
  id: 'demo:herb:mineral-d',
  displayName: 'Demo Mineral D',
  nameChineseSimplified: '演示矿丁',
  nameChineseTraditional: '演示礦丁',
  pinyin: 'Yǎnshì Kuàng Dīng',
  latinDrugName: 'Minerale demonstrationis delta',
  botanicalNames: [],
  aliases: ['Reference Mineral D'],
  categoryLabels: ['Demo minerals'],
  status: 'incomplete',
  reviewStatus: 'synthetic_fixture',
  sourceCount: 1,
  biologicalSources: [],
  medicinalParts: [
    claim('mineral-d:part', 'Material part', 'Illustrative mineral fragment', DEMO_INDEX_CITATION),
  ],
  preparations: [
    claim('mineral-d:prep', 'Preparation', 'Powdered demo fragment', DEMO_NOTEBOOK_CITATION),
  ],
  thermalNatures: [],
  flavors: [],
  channels: [],
  actions: [
    claim(
      'mineral-d:action',
      'Documented action',
      'Exercises incomplete-record presentation — synthetic only',
      DEMO_INDEX_CITATION,
      { status: 'incomplete' },
    ),
  ],
  patterns: [],
  cautions: [
    claim(
      'mineral-d:caution',
      'Caution',
      'Most knowledge fields are intentionally unavailable',
      DEMO_NOTEBOOK_CITATION,
      { status: 'incomplete' },
    ),
  ],
  compounds: [],
  relatedFormulaIds: ['demo:formula:three', 'demo:formula:four'],
  completeness: {
    knownFieldCount: 3,
    totalFieldCount: 9,
    unresolvedConflictCount: 0,
  },
}

const barkE: HerbDetail = {
  id: 'demo:herb:bark-e',
  displayName: 'Demo Bark E',
  nameChineseSimplified: '演示皮戊',
  nameChineseTraditional: '演示皮戊',
  pinyin: 'Yǎnshì Pí Wù',
  latinDrugName: 'Cortex demonstrationis epsilon',
  botanicalNames: ['Arbor exemplaris epsilon'],
  aliases: ['Archive Bark E'],
  categoryLabels: ['Demo barks'],
  status: 'demo',
  reviewStatus: 'synthetic_fixture',
  sourceCount: 1,
  ambiguous: true,
  biologicalSources: [
    claim(
      'bark-e:biology',
      'Biological source',
      'Synthetic tree specimen epsilon',
      DEMO_INDEX_CITATION,
    ),
  ],
  medicinalParts: [
    claim('bark-e:part', 'Medicinal part', 'Illustrative outer bark', DEMO_INDEX_CITATION),
  ],
  preparations: [claim('bark-e:prep', 'Preparation', 'Shaved demo bark', DEMO_NOTEBOOK_CITATION)],
  thermalNatures: [
    claim(
      'bark-e:nature',
      'Thermal nature',
      'Neutral — synthetic classification',
      DEMO_INDEX_CITATION,
    ),
  ],
  flavors: [
    claim('bark-e:flavor', 'Flavor', 'Astringent — synthetic classification', DEMO_INDEX_CITATION),
  ],
  channels: [
    claim(
      'bark-e:channel',
      'Channel',
      'Archive channel III — synthetic system',
      DEMO_INDEX_CITATION,
    ),
  ],
  actions: [
    claim(
      'bark-e:action',
      'Documented action',
      'Demonstrates ambiguous identity — synthetic only',
      DEMO_INDEX_CITATION,
    ),
  ],
  patterns: [
    claim(
      'bark-e:pattern',
      'Pattern association',
      'Demonstration pattern epsilon — synthetic only',
      DEMO_NOTEBOOK_CITATION,
    ),
  ],
  cautions: [
    claim(
      'bark-e:caution',
      'Caution',
      'Identity is intentionally ambiguous in the fixture',
      DEMO_NOTEBOOK_CITATION,
      { status: 'incomplete' },
    ),
  ],
  compounds: [
    claim('bark-e:compound', 'Compound', 'Compound-E0 — placeholder identity', DEMO_INDEX_CITATION),
  ],
  relatedFormulaIds: ['demo:formula:four'],
  completeness: {
    knownFieldCount: 8,
    totalFieldCount: 9,
    unresolvedConflictCount: 0,
  },
}

export const DEMO_HERBS: readonly HerbDetail[] = [rootA, seedB, leafC, mineralD, barkE]

const sourceIngredient = (
  id: string,
  herb: HerbDetail,
  amountText: string,
  unit: string,
  preparationLabel?: string,
  role?: string,
) => ({
  id: `demo:formula-line:${id}`,
  herbMaterialId: herb.id,
  herbDisplayName: herb.displayName,
  amountText,
  unit,
  ...(preparationLabel ? { preparationId: `demo:preparation:${id}`, preparationLabel } : {}),
  ...(role ? { role } : {}),
  status: 'demo' as const,
  citations: [DEMO_NOTEBOOK_CITATION],
})

const formulaClaim = (id: string, predicate: string, value: string): SourceClaim =>
  claim(id, predicate, value, DEMO_NOTEBOOK_CITATION)

export const DEMO_FORMULAS: readonly FormulaDetail[] = [
  {
    id: 'demo:formula:one',
    displayName: 'Demo Formula One',
    nameChineseSimplified: '演示方一',
    nameChineseTraditional: '演示方一',
    pinyin: 'Yǎnshì Fāng Yī',
    categories: ['Archive balance', 'Synthetic formulas'],
    ingredientCount: 2,
    status: 'demo',
    reviewStatus: 'synthetic_fixture',
    sourceCount: 1,
    variants: [
      {
        id: 'demo:variant:one-a',
        label: 'Notebook composition',
        description: 'Primary synthetic composition used in the demo index.',
        status: 'demo',
        citations: [DEMO_NOTEBOOK_CITATION],
      },
    ],
    ingredients: [
      sourceIngredient('one-root', rootA, '6', 'g', 'Unprepared demo slice', 'Primary'),
      sourceIngredient('one-seed', seedB, '3', 'g', 'Crushed demo seed', 'Supporting'),
    ],
    preparationNotes: [
      formulaClaim(
        'formula-one:preparation',
        'Preparation note',
        'Combine only as an interface demonstration; this is not a preparation instruction.',
      ),
    ],
    documentedActions: [
      formulaClaim(
        'formula-one:action',
        'Documented action',
        'Demonstrates two-material analysis — synthetic only',
      ),
    ],
    documentedPatterns: [
      formulaClaim(
        'formula-one:pattern',
        'Pattern association',
        'Demonstration pattern alpha — synthetic only',
      ),
    ],
    cautions: [
      formulaClaim(
        'formula-one:caution',
        'Caution',
        'No real-world compatibility conclusion can be drawn from fixture data.',
      ),
    ],
    conflicts: [],
    citations: [DEMO_NOTEBOOK_CITATION],
    completeness: { knownFieldCount: 6, totalFieldCount: 7, unresolvedConflictCount: 0 },
  },
  {
    id: 'demo:formula:two',
    displayName: 'Demo Formula Two',
    nameChineseSimplified: '演示方二',
    nameChineseTraditional: '演示方二',
    pinyin: 'Yǎnshì Fāng Èr',
    categories: ['Comparative study', 'Synthetic formulas'],
    ingredientCount: 3,
    status: 'demo',
    reviewStatus: 'synthetic_fixture',
    sourceCount: 2,
    variants: [
      {
        id: 'demo:variant:two-a',
        label: 'Crushed-seed version',
        description: 'Synthetic variant used to expose preparation differences.',
        status: 'demo',
        citations: [DEMO_NOTEBOOK_CITATION],
      },
    ],
    ingredients: [
      sourceIngredient('two-seed', seedB, '4', 'g', 'Crushed demo seed', 'Primary'),
      sourceIngredient('two-leaf', leafC, '2', 'g', 'Dried demo leaf', 'Supporting'),
      sourceIngredient('two-seed-second', seedB, '1', 'part', 'Whole demo seed'),
    ],
    preparationNotes: [
      formulaClaim(
        'formula-two:preparation',
        'Preparation note',
        'Different seed preparations are retained as separate source lines.',
      ),
    ],
    documentedActions: [
      formulaClaim(
        'formula-two:action',
        'Documented action',
        'Demonstrates duplicate and preparation-variant reporting — synthetic only',
      ),
    ],
    documentedPatterns: [
      formulaClaim(
        'formula-two:pattern',
        'Pattern association',
        'Demonstration pattern beta — synthetic only',
      ),
    ],
    cautions: [
      formulaClaim(
        'formula-two:caution',
        'Caution',
        'Repeated rows are not automatically combined.',
      ),
    ],
    conflicts: [
      {
        id: 'demo:conflict:formula-two-role',
        field: 'Traditional role',
        summary: 'Synthetic notes assign different roles to Demo Seed B.',
        alternatives: ['Primary', 'Supporting'],
        citations: [DEMO_NOTEBOOK_CITATION, DEMO_DISPUTE_CITATION],
      },
    ],
    citations: [DEMO_NOTEBOOK_CITATION, DEMO_DISPUTE_CITATION],
    completeness: { knownFieldCount: 7, totalFieldCount: 7, unresolvedConflictCount: 1 },
  },
  {
    id: 'demo:formula:three',
    displayName: 'Demo Formula Three',
    nameChineseSimplified: '演示方三',
    nameChineseTraditional: '演示方三',
    pinyin: 'Yǎnshì Fāng Sān',
    categories: ['Incomplete record', 'Synthetic formulas'],
    ingredientCount: 2,
    status: 'incomplete',
    reviewStatus: 'synthetic_fixture',
    sourceCount: 1,
    variants: [],
    ingredients: [
      sourceIngredient('three-leaf', leafC, '2', 'part', 'Dried demo leaf'),
      sourceIngredient('three-mineral', mineralD, '', 'unspecified'),
    ],
    preparationNotes: [],
    documentedActions: [
      formulaClaim(
        'formula-three:action',
        'Documented action',
        'Demonstrates incomplete source coverage — synthetic only',
      ),
    ],
    documentedPatterns: [],
    cautions: [
      formulaClaim(
        'formula-three:caution',
        'Caution',
        'The mineral amount and most source classifications are unavailable.',
      ),
    ],
    conflicts: [],
    citations: [DEMO_NOTEBOOK_CITATION],
    completeness: { knownFieldCount: 3, totalFieldCount: 7, unresolvedConflictCount: 0 },
  },
  {
    id: 'demo:formula:four',
    displayName: 'Demo Formula Four',
    nameChineseSimplified: '演示方四',
    nameChineseTraditional: '演示方四',
    pinyin: 'Yǎnshì Fāng Sì',
    categories: ['Four-way comparison', 'Synthetic formulas'],
    ingredientCount: 3,
    status: 'demo',
    reviewStatus: 'synthetic_fixture',
    sourceCount: 1,
    variants: [],
    ingredients: [
      sourceIngredient('four-root', rootA, '5', 'g', 'Toasted demo slice'),
      sourceIngredient('four-mineral', mineralD, '1', 'part', 'Powdered demo fragment'),
      sourceIngredient('four-bark', barkE, '2', 'g', 'Shaved demo bark'),
    ],
    preparationNotes: [
      formulaClaim(
        'formula-four:preparation',
        'Preparation note',
        'Fixture preparation labels are preserved exactly as entered.',
      ),
    ],
    documentedActions: [
      formulaClaim(
        'formula-four:action',
        'Documented action',
        'Exercises cross-formula comparison — synthetic only',
      ),
    ],
    documentedPatterns: [
      formulaClaim(
        'formula-four:pattern',
        'Pattern association',
        'Demonstration pattern delta — synthetic only',
      ),
    ],
    cautions: [
      formulaClaim(
        'formula-four:caution',
        'Caution',
        'The synthetic record contains deliberately unknown relationships.',
      ),
    ],
    conflicts: [],
    citations: [DEMO_NOTEBOOK_CITATION],
    completeness: { knownFieldCount: 6, totalFieldCount: 7, unresolvedConflictCount: 0 },
  },
]

export const DEMO_TEXT_PASSAGES: readonly TextPassageResult[] = [
  {
    id: 'demo:passage:index-root',
    documentId: 'demo:document:materia-index',
    documentTitle: 'Synthetic Materia Index',
    chapter: 'Roots',
    section: 'Specimen Alpha',
    locator: 'Leaf 12',
    language: 'Synthetic English',
    text: 'Demo Root A is indexed here only to demonstrate how an attributed passage, locator, and linked material appear together.',
    matchedTerms: ['Demo Root A', 'indexed'],
    linkedEntities: [{ id: rootA.id, label: rootA.displayName, entityType: 'herb' }],
    reviewStatus: 'synthetic_fixture',
    status: 'demo',
    citation: DEMO_INDEX_CITATION,
  },
  {
    id: 'demo:passage:notebook-formula',
    documentId: 'demo:document:formulary-notebook',
    documentTitle: 'Demonstration Formulary Notebook',
    chapter: 'Compositions',
    section: 'Formula One',
    locator: 'Folio 7b',
    language: 'Synthetic English',
    text: 'The first demo composition places Root A beside Seed B to exercise overlap and sourced-relationship displays.',
    matchedTerms: ['Root A', 'Seed B'],
    linkedEntities: [
      { id: rootA.id, label: rootA.displayName, entityType: 'herb' },
      { id: seedB.id, label: seedB.displayName, entityType: 'herb' },
      { id: 'demo:formula:one', label: 'Demo Formula One', entityType: 'formula' },
    ],
    reviewStatus: 'synthetic_fixture',
    status: 'demo',
    citation: DEMO_NOTEBOOK_CITATION,
  },
  {
    id: 'demo:passage:annotation-conflict',
    documentId: 'demo:document:annotation-cards',
    documentTitle: 'Synthetic Annotation Cards',
    chapter: 'Unresolved classifications',
    section: 'Thermal nature',
    locator: 'Card 3',
    language: 'Synthetic English',
    text: 'One fixture card labels Root A balanced while another labels it gently cool; the disagreement remains unresolved.',
    matchedTerms: ['balanced', 'gently cool', 'unresolved'],
    linkedEntities: [{ id: rootA.id, label: rootA.displayName, entityType: 'herb' }],
    reviewStatus: 'synthetic_fixture',
    status: 'conflicted',
    citation: DEMO_DISPUTE_CITATION,
  },
  {
    id: 'demo:passage:index-leaf',
    documentId: 'demo:document:materia-index',
    documentTitle: 'Synthetic Materia Index',
    chapter: 'Leaves',
    section: 'Specimen Gamma',
    locator: 'Leaf 19',
    language: 'Synthetic English',
    text: 'Demo Leaf C is a fully invented identity used to test multilingual search and linked-entity context.',
    matchedTerms: ['Demo Leaf C', 'multilingual'],
    linkedEntities: [{ id: leafC.id, label: leafC.displayName, entityType: 'herb' }],
    reviewStatus: 'synthetic_fixture',
    status: 'demo',
    citation: citation('index:leaf-19', 'Synthetic Materia Index', 'Leaf 19'),
  },
  {
    id: 'demo:passage:index-mineral',
    documentId: 'demo:document:materia-index',
    documentTitle: 'Synthetic Materia Index',
    chapter: 'Minerals',
    section: 'Specimen Delta',
    locator: 'Leaf 24',
    language: 'Synthetic English',
    text: 'The Demo Mineral D entry intentionally omits several classifications so missing-data behavior remains visible.',
    matchedTerms: ['Demo Mineral D', 'missing-data'],
    linkedEntities: [{ id: mineralD.id, label: mineralD.displayName, entityType: 'herb' }],
    reviewStatus: 'synthetic_fixture',
    status: 'incomplete',
    citation: citation('index:leaf-24', 'Synthetic Materia Index', 'Leaf 24'),
  },
]

export const DEMO_CAPABILITIES: AlchemyProviderCapabilities = {
  providerId: 'demo-alchemy',
  canSearchHerbs: true,
  canSearchFormulas: true,
  canAnalyzeFormulas: true,
  canCompareFormulas: true,
  canSearchTexts: true,
  canBuildRetrievalContext: true,
  canExploreRelationships: true,
  maxComparisonFormulas: 4,
  supportedUnits: ['g', 'mg', 'kg', 'part', 'unspecified'],
  filters: {
    thermalNatures: ['Balanced', 'Warm', 'Cool', 'Neutral'],
    flavors: ['Mildly aromatic', 'Dry', 'Light', 'Astringent'],
    channels: ['Archive channel I', 'Archive channel II', 'Archive channel III'],
    categories: [
      'Demo roots',
      'Demo seeds',
      'Demo leaves',
      'Demo minerals',
      'Demo barks',
      'Archive balance',
      'Comparative study',
      'Incomplete record',
      'Four-way comparison',
    ],
    actions: [
      'Supports indexing exercises',
      'Demonstrates grouped source claims',
      'Exercises linked-entity display',
    ],
    sources: [
      'Synthetic Materia Index',
      'Demonstration Formulary Notebook',
      'Synthetic Annotation Cards',
    ],
    reviewStatuses: ['synthetic_fixture'],
    languages: ['Synthetic English'],
    documents: [
      'demo:document:materia-index',
      'demo:document:formulary-notebook',
      'demo:document:annotation-cards',
    ],
  },
}
