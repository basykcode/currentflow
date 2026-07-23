import type { CurrentFlowSnapshot } from './types'

export interface CurrentFlowProvider {
  getSnapshot(at: Date): Promise<CurrentFlowSnapshot>
}
