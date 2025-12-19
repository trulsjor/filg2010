/**
 * Detects if the user is on an Apple device (iOS/macOS)
 */
function isAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  const userAgent = navigator.userAgent.toLowerCase()
  const platform = (navigator.platform || '').toLowerCase()

  return (
    platform.includes('mac') ||
    platform.includes('iphone') ||
    platform.includes('ipad') ||
    userAgent.includes('mac') ||
    userAgent.includes('iphone') ||
    userAgent.includes('ipad')
  )
}

/**
 * Returns a maps URL for the given location.
 * Uses Apple Maps on Apple devices, Google Maps otherwise.
 */
export function getMapsUrl(location: string): string {
  const encodedLocation = encodeURIComponent(location)

  if (isAppleDevice()) {
    return `https://maps.apple.com/?q=${encodedLocation}`
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`
}
