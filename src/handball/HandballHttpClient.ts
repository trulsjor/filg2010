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

export class HandballRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HandballRequestError'
  }
}

export interface HandballHttpClientOptions {
  maxRetries?: number
  backoffMs?: number
  timeoutMs?: number
}

export class HandballHttpClient {
  private readonly maxRetries: number
  private readonly backoffMs: number
  private readonly timeoutMs: number

  constructor(options: HandballHttpClientOptions = {}) {
    this.maxRetries = Math.max(1, options.maxRetries ?? 3)
    this.backoffMs = Math.max(0, options.backoffMs ?? 500)
    this.timeoutMs = Math.max(100, options.timeoutMs ?? 20000)
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
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

      try {
        const response = await fetch(url, { headers, signal: controller.signal })
        if (!response.ok) {
          throw new HandballRequestError(`${url} svarte ${response.status} ${response.statusText}`)
        }
        return await response.text()
      } catch (error) {
        lastError = error
      } finally {
        clearTimeout(timeout)
      }

      if (attempt < this.maxRetries) {
        await delay(this.backoffMs * attempt)
      }
    }

    throw new HandballRequestError(`Klarte ikke å hente ${url}: ${describeError(lastError)}`)
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
