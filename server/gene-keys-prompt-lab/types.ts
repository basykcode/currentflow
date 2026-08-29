export type KvNamespace = {
  get(key: string, type: 'text'): Promise<string | null>
  put(key: string, value: string): Promise<void>
  list(options?: {
    prefix?: string
    cursor?: string
    limit?: number
  }): Promise<{
    keys: Array<{ name: string }>
    list_complete: boolean
    cursor?: string
  }>
}

export type WorkersAi = {
  run(model: string, input: WorkersAiInput): Promise<unknown>
}

export type WorkersAiInput = {
  messages: Array<{ role: 'system' | 'user'; content: string }>
  response_format: {
    type: 'json_schema'
    json_schema: Record<string, unknown>
  }
  max_tokens: number
  temperature: number
}

export type PromptLabEnv = {
  AI: WorkersAi
  GENE_KEYS_SOURCES: KvNamespace
  PROMPT_LAB_STATE: KvNamespace
  ALLOWED_ORIGINS?: string
  PROMPT_LAB_PASSWORD: string
  PROMPT_LAB_SESSION_SECRET: string
  PROMPT_LAB_MODEL?: string
  OPENAI_API_KEY?: string
}

export type WorkerContext<Env> = {
  request: Request
  env: Env
}
