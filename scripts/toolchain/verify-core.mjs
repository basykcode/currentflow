export function assertRuntimeVersion(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${expected}, received ${actual || 'unavailable'}`)
  }
}

export function isExactSpecifier(specifier) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(specifier)
}

export function assertPythonRange(pyproject, expectedVersion) {
  const [major, minor] = expectedVersion.split('.').map(Number)
  const declaration = `requires-python = ">=${expectedVersion},<${major}.${minor + 1}"`
  if (!pyproject.includes(declaration)) {
    throw new Error(`Python declaration mismatch: expected ${declaration}`)
  }
}
