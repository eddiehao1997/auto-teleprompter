import { useState, useEffect, useRef, useCallback } from 'react'
import './Teleprompter.css'

function Teleprompter({ script, fontSize, speed, mirrorMode, onBack }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(speed)
  const [countdown, setCountdown] = useState(3)
  const [showControls, setShowControls] = useState(true)
  const scrollRef = useRef(null)
  const animationRef = useRef(null)
  const lastTimeRef = useRef(null)
  const controlsTimerRef = useRef(null)

  // Pixels per second: speed slider (5-100) maps to 20-200 px/s
  const pixelsPerSecond = 20 + (currentSpeed / 100) * 180

  // Countdown before starting
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    if (countdown === 0) {
      setIsPlaying(true)
    }
  }, [countdown])

  // Auto-scroll animation loop
  const scrollStep = useCallback(
    (timestamp) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp
      }
      const delta = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      if (scrollRef.current) {
        const el = scrollRef.current
        const maxScroll = el.scrollHeight - el.clientHeight

        if (el.scrollTop >= maxScroll) {
          setIsPlaying(false)
          return
        }

        el.scrollTop += pixelsPerSecond * delta
      }

      animationRef.current = requestAnimationFrame(scrollStep)
    },
    [pixelsPerSecond]
  )

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = null
      animationRef.current = requestAnimationFrame(scrollStep)
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, scrollStep])

  // Auto-hide controls after 3s of no interaction
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }, [isPlaying])

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimer()
    } else {
      setShowControls(true)
      clearTimeout(controlsTimerRef.current)
    }
    return () => clearTimeout(controlsTimerRef.current)
  }, [isPlaying, resetControlsTimer])

  const handleScreenTap = () => {
    if (countdown > 0) return
    resetControlsTimer()
  }

  const togglePlay = (e) => {
    e.stopPropagation()
    setIsPlaying(!isPlaying)
    resetControlsTimer()
  }

  const handleSpeedChange = (e) => {
    e.stopPropagation()
    setCurrentSpeed(Number(e.target.value))
    resetControlsTimer()
  }

  const handleRestart = (e) => {
    e.stopPropagation()
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
    setIsPlaying(true)
    resetControlsTimer()
  }

  const handleBack = (e) => {
    e.stopPropagation()
    onBack()
  }

  // Calculate progress
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const updateProgress = () => {
      const maxScroll = el.scrollHeight - el.clientHeight
      setProgress(maxScroll > 0 ? (el.scrollTop / maxScroll) * 100 : 0)
    }
    el.addEventListener('scroll', updateProgress)
    return () => el.removeEventListener('scroll', updateProgress)
  }, [])

  if (countdown > 0) {
    return (
      <div className="countdown-overlay">
        <div className="countdown-number">{countdown}</div>
      </div>
    )
  }

  return (
    <div className="prompter-container" onClick={handleScreenTap}>
      {/* Progress bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Center guide line */}
      <div className="guide-line" />

      {/* Scrolling script */}
      <div
        ref={scrollRef}
        className="script-scroll"
        style={{
          transform: mirrorMode ? 'scaleX(-1)' : 'none',
        }}
      >
        <div className="script-spacer" />
        <div
          className="script-text"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
        >
          {script}
        </div>
        <div className="script-spacer" />
      </div>

      {/* Controls overlay */}
      <div className={`controls-overlay ${showControls ? 'visible' : ''}`}>
        <div className="controls-top">
          <button className="control-btn back-btn" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="speed-display">{currentSpeed}%</div>
          <button className="control-btn restart-btn" onClick={handleRestart}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
        </div>

        <div className="controls-bottom">
          <div className="speed-control" onClick={(e) => e.stopPropagation()}>
            <span className="speed-label">Speed</span>
            <input
              type="range"
              min="5"
              max="100"
              value={currentSpeed}
              onChange={handleSpeedChange}
              className="speed-slider"
            />
          </div>
          <button className="play-pause-btn" onClick={togglePlay}>
            {isPlaying ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,4 20,12 6,20" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Teleprompter
