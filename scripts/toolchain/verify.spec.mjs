import assert from 'node:assert/strict'
import test from 'node:test'

import { assertPythonRange, assertRuntimeVersion, isExactSpecifier } from './verify-core.mjs'

test('runtime mismatches fail with the tool name and exact versions', () => {
  assert.throws(
    () => assertRuntimeVersion('Node.js', '24.18.0', '24.19.0'),
    /Node\.js mismatch: expected 24\.19\.0, received 24\.18\.0/,
  )
  assert.throws(
    () => assertRuntimeVersion('npm', '11.16.0', '11.17.0'),
    /npm mismatch: expected 11\.17\.0, received 11\.16\.0/,
  )
})

test('direct dependency policy accepts only exact semantic versions', () => {
  assert.equal(isExactSpecifier('7.3.6'), true)
  assert.equal(isExactSpecifier('1.0.0-beta.1'), true)
  assert.equal(isExactSpecifier('^7.3.6'), false)
  assert.equal(isExactSpecifier('latest'), false)
})

test('Python patch policy requires the exact lower bound', () => {
  assert.doesNotThrow(() => assertPythonRange('requires-python = ">=3.13.14,<3.14"', '3.13.14'))
  assert.throws(
    () => assertPythonRange('requires-python = ">=3.13,<3.14"', '3.13.14'),
    /Python declaration mismatch/,
  )
})
