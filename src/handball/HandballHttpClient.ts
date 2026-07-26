const XHR_HEADERS: Record<string, string> = {
  'x-requested-with': 'XMLHttpRequest',
  accept: 'application/json, text/plain, */*',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
}

const PAGE_HEADERS: Record<string, string> = {
  accept: 'text/html,application/xhtml+xml',
  'user-agent': XHR_HEADERS['user-agent'],
}

const TOO_MANY_REQUESTS = 429
const SERVER_ERROR_THRESHOLD = 500

export class HandballRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HandballRequestError'
  }
}

export interface HandballHttpClientOptions {
  maxRetries?: number
  backoffMs?: number
  rateLimitBackoffMs?: number
  timeoutMs?: number
  minIntervalMs?: number
  maxIntervalMs?: number
}

export class HandballHttpClient {
  private readonly maxRetries: number
  private readonly backoffMs: number
  private readonly rateLimitBackoffMs: number
  private readonly timeoutMs: number
  private readonly minIntervalMs: number
  private readonly maxIntervalMs: number
  private currentIntervalMs: number
  private nextAllowedRequestAt = 0
  private successesSinceRateLimit = 0

  constructor(options: HandballHttpClientOptions = {}) {
    this.maxRetries = Math.max(1, options.maxRetries ?? 6)
    this.backoffMs = Math.max(0, options.backoffMs ?? 500)
    this.rateLimitBackoffMs = Math.max(0, options.rateLimitBackoffMs ?? 15000)
    this.timeoutMs = Math.max(100, options.timeoutMs ?? 20000)
    this.minIntervalMs = Math.max(0, options.minIntervalMs ?? 400)
    this.maxIntervalMs = Math.max(this.minIntervalMs, options.maxIntervalMs ?? 4000)
    this.currentIntervalMs = this.minIntervalMs
  }

  async fetchJson(url: string): Promise<unknown> {
    const body = await this.fetchText(url, XHR_HEADERS)
    try {
      return JSON.parse(body)
    } catch {
      throw new HandballRequestError(`Svaret fra ${url} er ikke gyldig JSON`)
    }
  }

  async fetchPage(url: string): Promise<string> {
    return this.fetchText(url, PAGE_HEADERS)
  }

  private async fetchText(url: string, headers: Record<string, string>): Promise<string> {
    let lastError: unknown = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      await this.waitForTurn()

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

      try {
        const response = await fetch(url, { headers, signal: controller.signal })
        if (response.ok) {
          this.recordSuccess()
          return await response.text()
        }
        if (!isRetryableStatus(response.status)) {
          throw new HandballRequestError(`${url} svarte ${response.status} ${response.statusText}`)
        }
        if (response.status === TOO_MANY_REQUESTS) {
          this.slowDown()
        }
        lastError = new HandballRequestError(
          `${url} svarte ${response.status} ${response.statusText}`
        )
        if (attempt < this.maxRetries) {
          await delay(this.retryDelay(response.status, attempt, response.headers))
        }
        continue
      } catch (error) {
        if (error instanceof HandballRequestError) throw error
        lastError = error
        if (attempt < this.maxRetries) {
          await delay(this.backoffMs * attempt)
        }
      } finally {
        clearTimeout(timeout)
      }
    }

    throw new HandballRequestError(`Klarte ikke å hente ${url}: ${describeError(lastError)}`)
  }

  private retryDelay(status: number, attempt: number, headers: Headers): number {
    if (status !== TOO_MANY_REQUESTS) return this.backoffMs * attempt

    const retryAfter = headers.get('retry-after')
    if (retryAfter !== null) {
      const seconds = Number.parseInt(retryAfter, 10)
      if (!Number.isNaN(seconds)) return seconds * 1000
    }
    return this.rateLimitBackoffMs * attempt
  }

  private async waitForTurn(): Promise<void> {
    const wait = this.nextAllowedRequestAt - Date.now()
    if (wait > 0) await delay(wait)
    this.nextAllowedRequestAt = Date.now() + this.currentIntervalMs
  }

  private slowDown(): void {
    this.successesSinceRateLimit = 0
    this.currentIntervalMs = Math.min(this.currentIntervalMs * 2, this.maxIntervalMs)
  }

  private recordSuccess(): void {
    if (this.currentIntervalMs === this.minIntervalMs) return

    this.successesSinceRateLimit++
    if (this.successesSinceRateLimit >= SUCCESSES_BEFORE_SPEEDUP) {
      this.successesSinceRateLimit = 0
      this.currentIntervalMs = Math.max(this.currentIntervalMs / 2, this.minIntervalMs)
    }
  }

  currentDelayMs(): number {
    return this.currentIntervalMs
  }
}

const SUCCESSES_BEFORE_SPEEDUP = 25

function isRetryableStatus(status: number): boolean {
  return status === TOO_MANY_REQUESTS || status >= SERVER_ERROR_THRESHOLD
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
