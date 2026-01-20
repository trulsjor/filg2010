import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { getThemeOptions, themes, type ThemeId } from '../themes/ThemeRegistry'

export function ThemeSelector() {
  const { themeId, setThemeId } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const options = getThemeOptions()
  const currentTheme = themes[themeId]

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

  const getThemeIcon = () => {
    return (
      <svg
        width="20"
        height="20"
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
    )
  }

  return (
    <div className="theme-selector" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-selector-button"
        aria-label="Velg tema"
        aria-expanded={isOpen}
      >
        {getThemeIcon()}
        <span className="theme-name">{currentTheme.name}</span>
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="theme-selector-dropdown">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`theme-option ${option.value === themeId ? 'active' : ''}`}
            >
              {getThemeIcon()}
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
        </div>
      )}
    </div>
  )
}
