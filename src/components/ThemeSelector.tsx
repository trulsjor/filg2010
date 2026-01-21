import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { getThemeOptions, themes, type ThemeId } from '../themes/ThemeRegistry'
import { useMetadata } from '../hooks/useMetadata'
import type { Metadata } from '../types'
import metadataData from '../../data/metadata.json'

const metadata: Metadata = metadataData

function formatLoadTime(date: Date): string {
  return date.toLocaleString('no-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ThemeSelector() {
  const { themeId, setThemeId } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { formattedLastUpdated } = useMetadata(metadata)
  const [loadedAt] = useState(() => new Date())

  const options = getThemeOptions()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (id: ThemeId) => {
    setThemeId(id)
    setIsOpen(false)
  }

  const handleRefresh = () => {
    setIsOpen(false)
    window.location.reload()
  }

  return (
    <div className="theme-selector" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-selector-button"
        aria-label="Meny"
        aria-expanded={isOpen}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span className="theme-name">Meny</span>
      </button>

      {isOpen && (
        <div className="theme-selector-dropdown">
          <span className="menu-section-label">Tema</span>
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`theme-option ${option.value === themeId ? 'active' : ''}`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4c2.8 0 5.1-2.3 5.1-5.1C22.5 5.2 17.8 2 12 2z" />
                <circle cx="7" cy="11" r="1" fill="currentColor" />
                <circle cx="10" cy="7" r="1" fill="currentColor" />
                <circle cx="14" cy="7" r="1" fill="currentColor" />
                <circle cx="17" cy="11" r="1" fill="currentColor" />
              </svg>
              <span
                className="theme-color-preview"
                style={{ backgroundColor: themes[option.value].colors.accentBase }}
              />
              <span style={{ flex: 1 }}>{option.label}</span>
              {option.value === themeId && (
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}

          <div className="menu-divider" />

          <div className="menu-update-info">
            {formattedLastUpdated && (
              <div className="menu-info-row">
                <span className="menu-info-label">Data:</span>
                <span className="menu-info-value">{formattedLastUpdated}</span>
              </div>
            )}
            <div className="menu-info-row">
              <span className="menu-info-label">Oppdatert:</span>
              <span className="menu-info-value">{formatLoadTime(loadedAt)}</span>
            </div>
          </div>
          <button onClick={handleRefresh} className="menu-refresh-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M21 21v-5h-5" />
            </svg>
            Oppdater
          </button>
        </div>
      )}
    </div>
  )
}
