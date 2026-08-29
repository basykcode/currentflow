import assert from 'node:assert/strict'
import test from 'node:test'

import { assertPythonRange, assertRuntimeVersion, isExactSpecifier } from './verify-core.mjs'

test('runtime mismatches fail with the tool name and exact versions', () => {
  assert.throws(
    () => assertRuntimeVersion('Node.js', '22.22.1', '22.22.2'),
    /Node\.js mismatch: expected 22\.22\.2, received 22\.22\.1/,
  )
  assert.throws(
    () => assertRuntimeVersion('npm', '11.4.1', '11.4.2'),
    /npm mismatch: expected 11\.4\.2, received 11\.4\.1/,
  )
})

test('direct dependency policy accepts only exact semantic versions', () => {
  assert.equal(isExactSpecifier('7.3.6'), true)
  assert.equal(isExactSpecifier('1.0.0-beta.1'), true)
  assert.equal(isExactSpecifier('^7.3.6'), false)
  assert.equal(isExactSpecifier('latest'), false)
})

test('Python patch policy requires the exact lower bound', () => {
  assert.doesNotThrow(() => assertPythonRange('requires-python = ">=3.13.13,<3.14"', '3.13.13'))
  assert.throws(
    () => assertPythonRange('requires-python = ">=3.13,<3.14"', '3.13.13'),
    /Python declaration mismatch/,
  )
})
