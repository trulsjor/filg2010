import { HandballPayloadError } from './HandballPayloadReader.js'

const NAMED_ENTITIES: Record<string, string> = {
  quot: '"',
  apos: "'",
  amp: '&',
  lt: '<',
  gt: '>',
  nbsp: ' ',
}

export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|\w+);/g, (whole, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      return String.fromCodePoint(parseInt(entity.slice(2), 16))
    }
    if (entity.startsWith('#')) {
      return String.fromCodePoint(parseInt(entity.slice(1), 10))
    }
    const named = NAMED_ENTITIES[entity.toLowerCase()]
    return named === undefined ? whole : named
  })
}

function findComponent(html: string, tagName: string): number {
  const tagStart = html.indexOf(`<${tagName}`)
  if (tagStart === -1) {
    throw new HandballPayloadError(`Fant ikke komponenten <${tagName}> i HTML-en`)
  }
  return tagStart
}

function extractDelimited(
  html: string,
  searchFrom: number,
  marker: string,
  closing: string,
  description: string
): string {
  const markerStart = html.indexOf(marker, searchFrom)
  if (markerStart === -1) {
    throw new HandballPayloadError(`Fant ikke ${description}`)
  }
  const valueStart = markerStart + marker.length
  const valueEnd = html.indexOf(closing, valueStart)
  if (valueEnd === -1) {
    throw new HandballPayloadError(`${description} er ikke avsluttet`)
  }
  return html.slice(valueStart, valueEnd)
}

export function readVueProp(html: string, tagName: string, propName: string): unknown {
  const tagStart = findComponent(html, tagName)
  const raw = decodeHtmlEntities(
    extractDelimited(html, tagStart, `${propName}='`, "'", `egenskapen ${propName} på <${tagName}>`)
  )

  try {
    return JSON.parse(raw)
  } catch {
    throw new HandballPayloadError(`Egenskapen ${propName} på <${tagName}> er ikke gyldig JSON`)
  }
}

export function readVueStringProp(html: string, tagName: string, propName: string): string {
  const tagStart = findComponent(html, tagName)
  return decodeHtmlEntities(
    extractDelimited(
      html,
      tagStart,
      `${propName}="'`,
      `'"`,
      `tekstegenskapen ${propName} på <${tagName}>`
    )
  )
}

export function readPageTitle(html: string): string {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i)
  if (match === null) {
    throw new HandballPayloadError('Fant ikke <title> i HTML-en')
  }
  return decodeHtmlEntities(match[1]).trim()
}
