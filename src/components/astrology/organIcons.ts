import type { OrganKey } from '@/domain/astrology/types'

export type OrganIconDefinition = {
  label: string
  silhouette: readonly string[]
  details: readonly string[]
}

export const ORGAN_ICON_KEYS: readonly OrganKey[] = [
  'gallbladder',
  'liver',
  'lung',
  'large-intestine',
  'stomach',
  'spleen',
  'heart',
  'small-intestine',
  'bladder',
  'kidney',
  'pericardium',
  'san-jiao',
]

export const ORGAN_ICONS: Readonly<Record<OrganKey, OrganIconDefinition>> = {
  gallbladder: {
    label: 'Gallbladder',
    silhouette: [
      'M63 24c11 11 18 25 18 39 0 19-10 34-24 34S33 85 33 69c0-14 9-24 19-30 6-4 8-9 11-15Z',
    ],
    details: ['M62 25c-1 16-7 27-18 36', 'M43 70c8 7 17 9 28 6'],
  },
  liver: {
    label: 'Liver',
    silhouette: [
      'M20 54c2-18 16-30 38-31 18-1 36 5 42 15 6 11-2 30-18 40-12 8-27 10-42 8-15-1-25-8-22-20Z',
    ],
    details: ['M60 28c2 14 11 23 31 27', 'M46 65c14 2 26 8 33 17'],
  },
  lung: {
    label: 'Lungs',
    silhouette: [
      'M53 37c-10 2-19 10-24 23-7 18-3 36 7 39 9 3 20-11 24-28 3-12 2-25 0-34Z',
      'M67 37c10 2 19 10 24 23 7 18 3 36-7 39-9 3-20-11-24-28-3-12-2-25 0-34Z',
    ],
    details: ['M60 19v38', 'M60 42 46 57', 'M60 42 74 57'],
  },
  'large-intestine': {
    label: 'Large intestine',
    silhouette: [
      'M32 26h14v9h28v-9h14c6 0 10 4 10 10v16c0 5-3 9-8 10v22c0 7-5 12-12 12H42c-7 0-12-5-12-12V62c-5-1-8-5-8-10V36c0-6 4-10 10-10Z',
    ],
    details: ['M40 35v17h40V35', 'M40 61v25h40V61', 'M49 52v34', 'M71 52v34'],
  },
  stomach: {
    label: 'Stomach',
    silhouette: [
      'M56 23v24c0 8-4 13-11 17-10 6-13 19-6 29 6 9 20 10 30 4 17-10 27-26 24-42-2-9-9-16-18-18-8-2-14-5-19-10Z',
    ],
    details: ['M55 53c12 1 23 8 30 19', 'M45 79c8 3 17 2 25-4'],
  },
  spleen: {
    label: 'Spleen',
    silhouette: [
      'M77 24c14 10 20 28 14 46-7 21-26 32-45 24-15-6-21-22-13-36 9-17 29-35 44-34Z',
    ],
    details: ['M72 33c-14 18-21 36-19 55', 'M42 65c12 3 24 0 36-9'],
  },
  heart: {
    label: 'Heart',
    silhouette: [
      'M60 98 27 66C8 43 22 24 40 25c10 0 17 6 20 14 3-8 10-14 20-14 18-1 32 18 13 41Z',
    ],
    details: ['M60 41v42', 'M43 56c6 2 12 7 17 15', 'M77 56c-6 2-12 7-17 15'],
  },
  'small-intestine': {
    label: 'Small intestine',
    silhouette: ['M29 29h62v62H29Z'],
    details: [
      'M40 42c15-9 30 8 15 17s0 26 15 17 17 8 8 14c-8 8-30 9-38 0-7-8 1-14 9-19 8-17-9-23-17-7-17-20 0-25Z',
    ],
  },
  bladder: {
    label: 'Bladder',
    silhouette: ['M37 62c0-18 10-31 23-31s23 13 23 31c0 20-9 34-23 34S37 82 37 62Z'],
    details: ['M44 22c0 11 5 20 16 24', 'M76 22c0 11-5 20-16 24', 'M60 96v8'],
  },
  kidney: {
    label: 'Kidneys',
    silhouette: [
      'M45 29c-13 0-22 14-21 31 1 20 12 34 26 31 9-2 10-12 7-22-3-12-2-21 4-31-4-6-9-9-16-9Z',
      'M75 29c13 0 22 14 21 31-1 20-12 34-26 31-9-2-10-12-7-22 3-12 2-21-4-31 4-6 9-9 16-9Z',
    ],
    details: ['M50 55c-8 5-10 15-5 27', 'M70 55c8 5 10 15 5 27', 'M52 83 60 99l8-16'],
  },
  pericardium: {
    label: 'Pericardium',
    silhouette: [
      'M60 88 37 65c-14-16-4-30 9-30 7 0 12 4 14 10 2-6 7-10 14-10 13 0 23 14 9 30Z',
    ],
    details: [
      'M60 18c25 0 42 18 42 42S85 102 60 102 18 84 18 60 35 18 60 18Z',
      'M60 45v33',
    ],
  },
  'san-jiao': {
    label: 'Triple burner',
    silhouette: ['M34 24h52v20H34Z', 'M29 50h62v20H29Z', 'M34 76h52v20H34Z'],
    details: [
      'M43 35c6-6 12 6 18 0s12 6 18 0',
      'M39 61c7-6 14 6 21 0s14 6 21 0',
      'M43 87c6-6 12 6 18 0s12 6 18 0',
    ],
  },
}
