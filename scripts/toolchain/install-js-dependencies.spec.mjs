import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildInstallSteps,
  lockedInstallScripts,
  validateInstallScriptPolicy,
  validateRuntimeInvocation,
} from './install-js-dependencies.mjs'

test('dependency installation rejects non-canonical runtimes before install', () => {
  const canonical = {
    npmExecutable: '/opt/npm/lib/node_modules/npm/bin/npm-cli.js',
    actualNodeVersion: '22.22.2',
    expectedNodeVersion: '22.22.2',
    actualNpmVersion: '11.4.2',
    expectedNpmVersion: '11.4.2',
  }

  assert.doesNotThrow(() => validateRuntimeInvocation(canonical))
  assert.throws(
    () => validateRuntimeInvocation({ ...canonical, actualNodeVersion: '24.19.0' }),
    /Node version mismatch: expected 22\.22\.2, received 24\.19\.0/,
  )
  assert.throws(
    () => validateRuntimeInvocation({ ...canonical, actualNpmVersion: '10.9.7' }),
    /npm version mismatch: expected 11\.4\.2, received 10\.9\.7/,
  )
})

test('dependency installation suppresses all scripts before exact approved rebuilds', () => {
  assert.deepEqual(buildInstallSteps(['esbuild@0.1.2', 'workerd@1.2.3']), [
    ['ci', '--ignore-scripts'],
    ['rebuild', '--ignore-scripts=false', '--foreground-scripts', 'esbuild@0.1.2', 'workerd@1.2.3'],
  ])
})

test('dependency installation rejects ambiguous approval values', () => {
  assert.throws(
    () => validateInstallScriptPolicy({ 'esbuild@0.1.2': false }, {}),
    /Every allowScripts entry must be explicitly true/,
  )
})

test('dependency installation rejects unapproved lockfile scripts before install', () => {
  const lockPackages = {
    'node_modules/esbuild': { version: '0.1.2', hasInstallScript: true },
    'node_modules/unreviewed': { version: '9.9.9', hasInstallScript: true },
  }
  assert.deepEqual(lockedInstallScripts(lockPackages), [
    { lockPath: 'node_modules/esbuild', specifier: 'esbuild@0.1.2' },
    { lockPath: 'node_modules/unreviewed', specifier: 'unreviewed@9.9.9' },
  ])
  assert.throws(
    () => validateInstallScriptPolicy({ 'esbuild@0.1.2': true }, lockPackages),
    /Install-script policy mismatch/,
  )
})
