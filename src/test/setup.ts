import '@testing-library/jest-dom'
import * as fs from 'node:fs'
import * as path from 'node:path'

// Data hentes nå med fetch('/data/...'). I testene serverer vi de ekte datafilene
// fra disk, slik at App-testene laster reell sesongdata.
const realFetch = globalThis.fetch
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input.toString()
  if (url.startsWith('/data/')) {
    const filePath = path.join(process.cwd(), url.split('?')[0])
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return new Response(fs.readFileSync(filePath, 'utf-8'), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    return new Response('', { status: 404 })
  }
  return realFetch(input, init)
}) as typeof fetch

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
})
