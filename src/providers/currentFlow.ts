import type { CurrentFlowProvider } from '@/domain/astrology/provider'

import { LunarScriptCurrentFlowProvider } from './lunarScriptCurrentFlow'

export const currentFlowProvider: CurrentFlowProvider = new LunarScriptCurrentFlowProvider()
