import { useState, useRef, useEffect } from 'react'

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

function getAppleMapsUrl(location: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(location)}`
}

function getGoogleMapsUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

interface MapLinkProps {
  location: string
  className?: string
  children: React.ReactNode
}

export function MapLink({ location, className, children }: MapLinkProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isApple = isAppleDevice()

  useEffect(() => {
    if (!showMenu) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && e.target instanceof Node && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  if (!isApple) {
    return (
      <a
        href={getGoogleMapsUrl(location)}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    )
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowMenu(!showMenu)
  }

  const handleSelect = (url: string) => {
    setShowMenu(false)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="map-link-wrapper" ref={menuRef}>
      <a href="#" onClick={handleClick} className={className} role="button">
        {children}
      </a>

      {showMenu && (
        <div className="map-link-menu">
          <button
            type="button"
            className="map-link-option"
            onClick={() => handleSelect(getAppleMapsUrl(location))}
          >
            Apple Maps
          </button>
          <button
            type="button"
            className="map-link-option"
            onClick={() => handleSelect(getGoogleMapsUrl(location))}
          >
            Google Maps
          </button>
        </div>
      )}
    </div>
  )
}
