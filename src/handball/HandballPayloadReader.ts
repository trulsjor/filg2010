export class HandballPayloadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HandballPayloadError'
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function requireRecord(value: unknown, context: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new HandballPayloadError(`${context}: forventet objekt, fikk ${describe(value)}`)
  }
  return value
}

export function requireArray(value: unknown, context: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new HandballPayloadError(`${context}: forventet liste, fikk ${describe(value)}`)
  }
  return value
}

export function requireString(
  record: Record<string, unknown>,
  key: string,
  context: string
): string {
  const value = record[key]
  if (typeof value !== 'string') {
    throw new HandballPayloadError(`${context}.${key}: forventet tekst, fikk ${describe(value)}`)
  }
  return value
}

export function requireNumber(
  record: Record<string, unknown>,
  key: string,
  context: string
): number {
  const value = record[key]
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new HandballPayloadError(`${context}.${key}: forventet tall, fikk ${describe(value)}`)
  }
  return value
}

export function optionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === 'string' ? value : null
}

export function optionalNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key]
  return typeof value === 'number' && !Number.isNaN(value) ? value : null
}

export function optionalBoolean(record: Record<string, unknown>, key: string): boolean | null {
  const value = record[key]
  return typeof value === 'boolean' ? value : null
}

function describe(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'liste'
  return typeof value
}
