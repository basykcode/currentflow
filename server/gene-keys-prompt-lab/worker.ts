import { handleLogin, handleLogout, handleSession } from './auth.ts'
import { handleGenerate } from './generate.ts'
import { errorResponse } from './http.ts'
import { handleCreateUser, handleWorkspace } from './state.ts'
import type { PromptLabEnv, WorkerContext } from './types.ts'

export function handlePromptLabRequest(context: WorkerContext<PromptLabEnv>) {
  const pathname = new URL(context.request.url).pathname
  const route = `${context.request.method} ${pathname}`
  switch (route) {
    case 'GET /api/gene-keys-lab/session':
      return handleSession(context)
    case 'POST /api/gene-keys-lab/login':
      return handleLogin(context)
    case 'POST /api/gene-keys-lab/logout':
      return handleLogout(context)
    case 'POST /api/gene-keys-lab/generate':
      return handleGenerate(context)
    case 'GET /api/gene-keys-lab/workspace':
      return handleWorkspace(context)
    case 'POST /api/gene-keys-lab/users':
      return handleCreateUser(context)
    default:
      if (
        [
          '/api/gene-keys-lab/session',
          '/api/gene-keys-lab/login',
          '/api/gene-keys-lab/logout',
          '/api/gene-keys-lab/generate',
          '/api/gene-keys-lab/workspace',
          '/api/gene-keys-lab/users',
        ].includes(pathname)
      ) {
        return errorResponse('Method not allowed.', 405)
      }
      return errorResponse('Prompt Lab route not found.', 404)
  }
}
