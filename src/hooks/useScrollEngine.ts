import { useRef, useEffect, useState, useCallback } from 'react'

interface UseScrollEngineOptions {
  scrollRef: React.RefObject<HTMLDivElement | null>
  speed: number
  isPlaying: boolean
  mode: 'constant' | 'voice'
  voiceWordIndex: number
  totalWords: number
}

interface UseScrollEngineReturn {
  progress: number
  pixelsPerSecond: number
}

/**
 * Unified scroll controller that handles both constant-speed and voice-driven
 * scrolling in a single requestAnimationFrame loop.
 */
export function useScrollEngine({
  scrollRef,
  speed,
  isPlaying,
  mode,
  voiceWordIndex,
  totalWords,
}: UseScrollEngineOptions): UseScrollEngineReturn {
  const [progress, setProgress] = useState(0)
  const lastTimeRef = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)
  const currentPxPerSecRef = useRef(0)

  // Constant mode: speed slider (5-100) maps to 20-200 px/s
  const constantPxPerSec = 20 + (speed / 100) * 180

  // Smoothing factor for voice mode interpolation (higher = snappier)
  const VOICE_LERP_SPEED = 5 // units per second in normalized space

  const scrollStep = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp
      }
      const delta = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      const el = scrollRef.current
      if (!el) {
        animationRef.current = requestAnimationFrame(scrollStep)
        return
      }

      const maxScroll = el.scrollHeight - el.clientHeight

      if (mode === 'constant') {
        // Constant speed scrolling
        currentPxPerSecRef.current = constantPxPerSec

        if (el.scrollTop >= maxScroll && maxScroll > 0) {
          // Reached the end
          setProgress(100)
          return
        }

        el.scrollTop += constantPxPerSec * delta
      } else {
        // Voice mode: interpolate toward target position
        const targetFraction = totalWords > 0 ? voiceWordIndex / totalWords : 0
        const targetScroll = targetFraction * maxScroll
        const currentScroll = el.scrollTop

        // Smooth exponential interpolation
        const diff = targetScroll - currentScroll
        const step = diff * Math.min(1, VOICE_LERP_SPEED * delta)
        el.scrollTop = currentScroll + step

        // Track effective speed for display
        currentPxPerSecRef.current = Math.abs(step) / Math.max(delta, 0.001)
      }

      // Update progress
      if (maxScroll > 0) {
        setProgress((el.scrollTop / maxScroll) * 100)
      } else {
        setProgress(0)
      }

      animationRef.current = requestAnimationFrame(scrollStep)
    },
    [constantPxPerSec, mode, voiceWordIndex, totalWords, scrollRef]
  )

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = null
      animationRef.current = requestAnimationFrame(scrollStep)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [isPlaying, scrollStep])

  // Also track progress from manual scroll events (e.g., touch scroll)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const maxScroll = el.scrollHeight - el.clientHeight
      if (maxScroll > 0) {
        setProgress((el.scrollTop / maxScroll) * 100)
      }
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollRef])

  return {
    progress,
    pixelsPerSecond: mode === 'constant' ? constantPxPerSec : currentPxPerSecRef.current,
  }
}
