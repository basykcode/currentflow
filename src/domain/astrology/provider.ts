import type { CurrentFlowSnapshot } from './types'

export type CurrentFlowContext = {
  timezone?: string
  locationLabel?: string
}

export interface CurrentFlowProvider {
  getSnapshot(at: Date, context?: CurrentFlowContext): Promise<CurrentFlowSnapshot>
}
