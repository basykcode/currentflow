export const CODEX_EXECUTION_ENV = 'CURRENT_FLOW_CODEX_EXECUTION'

export function codexExecutionMode(environment = process.env) {
  const value = environment[CODEX_EXECUTION_ENV]?.trim().toLowerCase()
  if (!value || value === 'local') return 'local'
  if (value === 'cloud') return 'cloud'
  throw new Error(
    `${CODEX_EXECUTION_ENV} must be either local or cloud; received ${JSON.stringify(value)}.`,
  )
}
