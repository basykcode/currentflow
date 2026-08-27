import type {
  GeneKeysPromptLabGeneration,
  GeneKeysPromptLabUser,
} from '../../src/features/gene-keys-prompt-lab/domain.ts'
import { errorResponse, jsonResponse, readJsonBody, requireSession } from './http.ts'
import type { KvNamespace, PromptLabEnv, WorkerContext } from './types.ts'

const USER_PREFIX = 'state/v1/users/'
const HISTORY_PREFIX = 'state/v1/history/'
const MAX_USER_NAME_LENGTH = 80

const BUILT_IN_USERS: readonly GeneKeysPromptLabUser[] = [
  { id: 'ben-kind', name: 'Ben Kind', createdAt: '2026-08-27T00:00:00.000Z' },
  { id: 'anthony-love', name: 'Anthony Love', createdAt: '2026-08-27T00:00:00.000Z' },
]

async function listValues<T>(namespace: KvNamespace, prefix: string): Promise<T[]> {
  const values: T[] = []
  let cursor: string | undefined

  do {
    const page = await namespace.list(cursor ? { prefix, cursor, limit: 1_000 } : { prefix, limit: 1_000 })
    const pageValues = await Promise.all(
      page.keys.map(async ({ name }) => {
        const raw = await namespace.get(name, 'text')
        if (!raw) return null
        try {
          return JSON.parse(raw) as T
        } catch {
          return null
        }
      }),
    )
    for (const value of pageValues) {
      if (value !== null) values.push(value)
    }
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor)

  return values
}

export async function listPromptLabUsers(env: PromptLabEnv) {
  const customUsers = await listValues<GeneKeysPromptLabUser>(env.PROMPT_LAB_STATE, USER_PREFIX)
  return [...BUILT_IN_USERS, ...customUsers].sort((left, right) =>
    left.name.localeCompare(right.name, 'en', { sensitivity: 'base' }),
  )
}

export async function findPromptLabUser(env: PromptLabEnv, id: string) {
  const users = await listPromptLabUsers(env)
  return users.find((user) => user.id === id) ?? null
}

export async function listPromptLabHistory(env: PromptLabEnv) {
  const entries = await listValues<GeneKeysPromptLabGeneration>(
    env.PROMPT_LAB_STATE,
    HISTORY_PREFIX,
  )
  return entries.sort((left, right) => right.generatedAt.localeCompare(left.generatedAt))
}

export async function savePromptLabHistoryEntry(
  env: PromptLabEnv,
  entry: GeneKeysPromptLabGeneration,
) {
  const reverseTimestamp = String(9_999_999_999_999 - Date.parse(entry.generatedAt)).padStart(13, '0')
  await env.PROMPT_LAB_STATE.put(
    `${HISTORY_PREFIX}${reverseTimestamp}-${entry.id}`,
    JSON.stringify(entry),
  )
}

export async function handleWorkspace(context: WorkerContext<PromptLabEnv>) {
  const authorizationError = await requireSession(context)
  if (authorizationError) return authorizationError

  const [users, history] = await Promise.all([
    listPromptLabUsers(context.env),
    listPromptLabHistory(context.env),
  ])
  return jsonResponse({ users, history })
}

const normalizeUserName = (value: string) => value.trim().replace(/\s+/gu, ' ')

export async function handleCreateUser(context: WorkerContext<PromptLabEnv>) {
  const authorizationError = await requireSession(context)
  if (authorizationError) return authorizationError

  let body: unknown
  try {
    body = await readJsonBody(context.request)
  } catch {
    return errorResponse('Enter a valid name.', 400)
  }

  const rawName =
    body && typeof body === 'object' && 'name' in body && typeof body.name === 'string'
      ? body.name
      : ''
  const name = normalizeUserName(rawName)
  if (!name || name.length > MAX_USER_NAME_LENGTH) {
    return errorResponse(`Names must be 1–${MAX_USER_NAME_LENGTH} characters.`, 400)
  }

  const users = await listPromptLabUsers(context.env)
  const existing = users.find(
    (user) => user.name.localeCompare(name, 'en', { sensitivity: 'base' }) === 0,
  )
  if (existing) return jsonResponse(existing)

  const user: GeneKeysPromptLabUser = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
  }
  await context.env.PROMPT_LAB_STATE.put(`${USER_PREFIX}${user.id}`, JSON.stringify(user))
  return jsonResponse(user, 201)
}
