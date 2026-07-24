/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALCHEMY_DATA_MODE?: 'demo' | 'api'
  readonly VITE_ALCHEMY_API_BASE_URL?: string
  readonly VITE_ALCHEMY_REQUEST_TIMEOUT_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
