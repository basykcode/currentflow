import { handleGenerate } from '../../../server/gene-keys-prompt-lab/generate'
import type { PagesFunction, PromptLabEnv } from '../../../server/gene-keys-prompt-lab/types'

export const onRequestPost: PagesFunction<PromptLabEnv> = handleGenerate
