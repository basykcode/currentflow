import type { ReviewStatus } from './types'

const REVIEW_STATUSES: ReadonlySet<string> = new Set<ReviewStatus>([
  'synthetic_fixture',
  'machine_imported',
  'human_reviewed',
  'disputed',
  'superseded',
  'unavailable',
])

export const parseReviewStatus = (value: string): ReviewStatus | undefined =>
  REVIEW_STATUSES.has(value) ? (value as ReviewStatus) : undefined

export const reviewStatusLabel = (status: ReviewStatus): string =>
  status
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
