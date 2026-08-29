import { errorResponse, isAllowedOriginRequest, jsonResponse, readJsonBody } from './http.ts'
import {
  createSessionToken,
  expiredSessionCookie,
  hasValidSession,
  passwordsMatch,
  sessionCookie,
} from './session.ts'
import type { PromptLabEnv, WorkerContext } from './types.ts'

export async function handleSession(context: WorkerContext<PromptLabEnv>) {
  return jsonResponse({ authenticated: await hasValidSession(context.request, context.env) })
}

export async function handleLogin(context: WorkerContext<PromptLabEnv>) {
  if (!isAllowedOriginRequest(context.request, context.env)) {
    return errorResponse('Cross-origin requests are not allowed.', 403)
  }

  let password: unknown
  try {
    const body = (await readJsonBody(context.request)) as { password?: unknown }
    password = body.password
  } catch {
    return errorResponse('Enter the workspace password.', 400)
  }

  if (typeof password !== 'string' || password.length > 256) {
    return errorResponse('Enter the workspace password.', 400)
  }
  if (
    !context.env.PROMPT_LAB_PASSWORD ||
    !context.env.PROMPT_LAB_SESSION_SECRET ||
    context.env.PROMPT_LAB_SESSION_SECRET.length < 32
  ) {
    return errorResponse('The private workspace is not configured yet.', 503)
  }
  if (!(await passwordsMatch(password, context.env.PROMPT_LAB_PASSWORD))) {
    return errorResponse('That password did not open the workspace.', 401)
  }

  const token = await createSessionToken(context.env.PROMPT_LAB_SESSION_SECRET)
  return jsonResponse({ authenticated: true }, 200, { 'Set-Cookie': sessionCookie(token) })
}

export function handleLogout(context: WorkerContext<PromptLabEnv>) {
  if (!isAllowedOriginRequest(context.request, context.env)) {
    return errorResponse('Cross-origin requests are not allowed.', 403)
  }
  return jsonResponse({ authenticated: false }, 200, { 'Set-Cookie': expiredSessionCookie() })
}
