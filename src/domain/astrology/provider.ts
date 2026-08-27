import type { CurrentFlowSnapshot } from './types'
import type { GlobalConditionsSnapshot } from '@/domain/current-flow/celestial-instruments'

export type CurrentFlowContext = {
  timezone?: string
  locationLabel?: string
  globalConditions?: GlobalConditionsSnapshot
  mode?: 'live' | 'selected'
}

export interface CurrentFlowProvider {
  getSnapshot(at: Date, context?: CurrentFlowContext): Promise<CurrentFlowSnapshot>
}
