import assert from 'node:assert/strict'
import test from 'node:test'

import { codexExecutionMode } from './execution-mode.mjs'

test('defaults to local and accepts explicit local or cloud execution', () => {
  assert.equal(codexExecutionMode({}), 'local')
  assert.equal(codexExecutionMode({ CURRENT_FLOW_CODEX_EXECUTION: 'local' }), 'local')
  assert.equal(codexExecutionMode({ CURRENT_FLOW_CODEX_EXECUTION: ' cloud ' }), 'cloud')
})

test('fails closed for an unknown execution mode', () => {
  assert.throws(
    () => codexExecutionMode({ CURRENT_FLOW_CODEX_EXECUTION: 'remote' }),
    /must be either local or cloud/,
  )
})
