import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePullToRefresh } from './usePullToRefresh'

function createMockTouch(clientY: number): Touch {
  return {
    clientX: 0,
    clientY,
    force: 0,
    identifier: 0,
    pageX: 0,
    pageY: 0,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    screenX: 0,
    screenY: 0,
    target: document.body,
  }
}

function createTouchEvent(type: string, clientY: number): TouchEvent {
  return new TouchEvent(type, {
    touches: [createMockTouch(clientY)],
    bubbles: true,
    cancelable: true,
  })
}

describe('usePullToRefresh', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
    Object.defineProperty(window, 'ontouchstart', { value: true, writable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns initial state', () => {
    const { result } = renderHook(() => usePullToRefresh())

    expect(result.current.isPulling).toBe(false)
    expect(result.current.pullDistance).toBe(0)
    expect(result.current.isTriggered).toBe(false)
  })

  it('tracks pull distance on touch move', () => {
    const { result } = renderHook(() => usePullToRefresh())

    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 100))
    })

    act(() => {
      document.dispatchEvent(createTouchEvent('touchmove', 200))
    })

    expect(result.current.pullDistance).toBeGreaterThan(0)
  })

  it('triggers when pull distance exceeds threshold', () => {
    const { result } = renderHook(() => usePullToRefresh({ threshold: 40 }))

    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 0))
    })

    act(() => {
      document.dispatchEvent(createTouchEvent('touchmove', 200))
    })

    expect(result.current.isTriggered).toBe(true)
  })

  it('calls onRefresh when released after triggering', () => {
    const onRefresh = vi.fn()
    renderHook(() => usePullToRefresh({ threshold: 40, onRefresh }))

    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 0))
    })

    act(() => {
      document.dispatchEvent(createTouchEvent('touchmove', 200))
    })

    act(() => {
      document.dispatchEvent(new TouchEvent('touchend', { bubbles: true }))
    })

    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('does not call onRefresh when released before triggering', () => {
    const onRefresh = vi.fn()
    renderHook(() => usePullToRefresh({ threshold: 80, onRefresh }))

    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 0))
    })

    act(() => {
      document.dispatchEvent(createTouchEvent('touchmove', 120))
    })

    act(() => {
      document.dispatchEvent(new TouchEvent('touchend', { bubbles: true }))
    })

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('resets state on touch end', () => {
    const { result } = renderHook(() => usePullToRefresh({ threshold: 200 }))

    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 0))
    })

    act(() => {
      document.dispatchEvent(createTouchEvent('touchmove', 100))
    })

    expect(result.current.pullDistance).toBeGreaterThan(0)

    act(() => {
      document.dispatchEvent(new TouchEvent('touchend', { bubbles: true }))
    })

    expect(result.current.pullDistance).toBe(0)
  })

  it('does not track pull when not at top of page', () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(100)
    const { result } = renderHook(() => usePullToRefresh())

    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 100))
    })

    act(() => {
      document.dispatchEvent(createTouchEvent('touchmove', 200))
    })

    expect(result.current.pullDistance).toBe(0)
  })

  it('does not track upward pull', () => {
    const { result } = renderHook(() => usePullToRefresh())

    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 200))
    })

    act(() => {
      document.dispatchEvent(createTouchEvent('touchmove', 100))
    })

    expect(result.current.pullDistance).toBe(0)
  })
})
