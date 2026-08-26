export function assertRuntimeVersion(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${expected}, received ${actual || 'unavailable'}`)
  }
}

export function isExactSpecifier(specifier) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(specifier)
}

export function assertPythonRange(pyproject, expectedVersion) {
  const declaration = `requires-python = ">=${expectedVersion},<3.13"`
  if (!pyproject.includes(declaration)) {
    throw new Error(`Python declaration mismatch: expected ${declaration}`)
  }
}
