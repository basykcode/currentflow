export class GuidanceConstructionError extends Error {
  readonly code = 'guidance-construction-failed' as const

  constructor(message: string) {
    super(message)
    this.name = 'GuidanceConstructionError'
  }
}
