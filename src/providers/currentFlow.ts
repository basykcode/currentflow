import type { CurrentFlowProvider } from '@/domain/astrology/provider'

import { DemoCurrentFlowProvider } from './demoCurrentFlow'

export const currentFlowProvider: CurrentFlowProvider = new DemoCurrentFlowProvider()
