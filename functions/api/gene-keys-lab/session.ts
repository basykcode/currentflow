import { handleSession } from '../../../server/gene-keys-prompt-lab/auth'
import type { PagesFunction, PromptLabEnv } from '../../../server/gene-keys-prompt-lab/types'

export const onRequestGet: PagesFunction<PromptLabEnv> = handleSession
