export type KvNamespace = {
  get(key: string, type: 'text'): Promise<string | null>
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
  ALLOWED_ORIGINS?: string
  PROMPT_LAB_PASSWORD: string
  PROMPT_LAB_SESSION_SECRET: string
  PROMPT_LAB_MODEL?: string
}

export type WorkerContext<Env> = {
  request: Request
  env: Env
}
