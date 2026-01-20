import { useState, useEffect, useCallback, useRef } from 'react'

interface UsePullToRefreshOptions {
  threshold?: number
  onRefresh?: () => void
}

interface UsePullToRefreshReturn {
  isPulling: boolean
  pullDistance: number
  isTriggered: boolean
}

const PULL_RESISTANCE = 0.5

function isAtTopOfPage(): boolean {
  return window.scrollY === 0
}

function isTouchDeviceAvailable(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

function isValidDownwardPull(diff: number): boolean {
  return diff > 0 && isAtTopOfPage()
}

function calculatePullDistanceWithResistance(diff: number, maxDistance: number): number {
  return Math.min(diff * PULL_RESISTANCE, maxDistance)
}

export function usePullToRefresh({
  threshold = 80,
  onRefresh = () => window.location.reload(),
}: UsePullToRefreshOptions = {}): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const currentY = useRef(0)
  const isPullingRef = useRef(false)

  const isTriggered = pullDistance >= threshold
  const isPulling = isPullingRef.current

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isAtTopOfPage()) {
      startY.current = e.touches[0].clientY
      isPullingRef.current = true
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPullingRef.current) return

      currentY.current = e.touches[0].clientY
      const diff = currentY.current - startY.current

      if (isValidDownwardPull(diff)) {
        const distance = calculatePullDistanceWithResistance(diff, threshold * 1.5)
        setPullDistance(distance)

        if (distance > 10) {
          e.preventDefault()
        }
      } else {
        setPullDistance(0)
      }
    },
    [threshold]
  )

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= threshold) {
      onRefresh()
    }
    isPullingRef.current = false
    setPullDistance(0)
    startY.current = 0
    currentY.current = 0
  }, [pullDistance, threshold, onRefresh])

  useEffect(() => {
    if (!isTouchDeviceAvailable()) return

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return { isPulling, pullDistance, isTriggered }
}
