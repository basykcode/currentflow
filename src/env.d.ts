/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALCHEMY_DATA_MODE?: 'demo' | 'api'
  readonly VITE_ALCHEMY_API_BASE_URL?: string
  readonly VITE_ALCHEMY_API_TIMEOUT_MS?: string
  readonly VITE_PROMPT_LAB_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
