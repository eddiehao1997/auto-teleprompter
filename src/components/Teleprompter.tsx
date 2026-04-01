import { useState, useEffect, useRef, useCallback } from 'react'
import { useScrollEngine } from '../hooks/useScrollEngine'
import { useVoiceScroll } from '../hooks/useVoiceScroll'
import ScriptRenderer from './ScriptRenderer'
import type { ScriptSection, Speaker } from '../types'
import './Teleprompter.css'

interface TeleprompterProps {
  script: string
  sections?: ScriptSection[]
  speakers?: Speaker[]
  fontSize: number
  speed: number
  mirrorMode: boolean
  scrollMode?: 'constant' | 'voice'
  onBack: () => void
}

function Teleprompter({ script, sections, speakers, fontSize, speed, mirrorMode, scrollMode = 'constant', onBack }: TeleprompterProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(speed)
  const [currentMode, setCurrentMode] = useState<'constant' | 'voice'>(scrollMode)
  const [countdown, setCountdown] = useState(3)
  const [showControls, setShowControls] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Voice scroll hook — active when in voice mode and playing
  const voiceScroll = useVoiceScroll({
    scriptText: script,
    isActive: currentMode === 'voice' && isPlaying && countdown <= 0,
  })

  // Unified scroll engine
  const { progress, pixelsPerSecond: _pixelsPerSecond } = useScrollEngine({
    scrollRef,
    speed: currentSpeed,
    isPlaying: isPlaying && countdown <= 0,
    mode: currentMode,
    voiceWordIndex: voiceScroll.wordIndex,
    totalWords: voiceScroll.totalWords,
  })

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

  // Auto-hide controls after 3s of no interaction
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current)
    }
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
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current)
      }
    }
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current)
      }
    }
  }, [isPlaying, resetControlsTimer])

  const handleScreenTap = () => {
    if (countdown > 0) return
    resetControlsTimer()
  }

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPlaying(!isPlaying)
    resetControlsTimer()
  }

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    setCurrentSpeed(Number(e.target.value))
    resetControlsTimer()
  }

  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
    setIsPlaying(true)
    resetControlsTimer()
  }

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation()
    onBack()
  }

  const toggleMode = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentMode((prev) => (prev === 'constant' ? 'voice' : 'constant'))
    resetControlsTimer()
  }

  // Error banner state
  const [showErrorBanner, setShowErrorBanner] = useState(false)
  const [errorBannerMessage, setErrorBannerMessage] = useState('')

  useEffect(() => {
    if (currentMode !== 'voice') return

    if (voiceScroll.error && voiceScroll.error.includes('not-allowed')) {
      setErrorBannerMessage('Microphone access denied. Switched to manual scroll.')
      setShowErrorBanner(true)
      setCurrentMode('constant')
    } else if (!voiceScroll.isSupported) {
      setErrorBannerMessage('Voice mode not supported in this browser.')
      setShowErrorBanner(true)
      setCurrentMode('constant')
    }
  }, [voiceScroll.error, voiceScroll.isSupported, currentMode])

  // Mic indicator color
  const getMicIndicatorClass = () => {
    if (currentMode !== 'voice') return 'mic-indicator mic-off'
    if (voiceScroll.error) return 'mic-indicator mic-error'
    if (voiceScroll.isListening) return 'mic-indicator mic-listening'
    return 'mic-indicator mic-off'
  }

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
        {sections && speakers && speakers.length > 0 ? (
          <ScriptRenderer
            sections={sections}
            speakers={speakers}
            fontSize={fontSize}
            scrollContainerRef={scrollRef}
            activeWordIndex={currentMode === 'voice' ? voiceScroll.wordIndex : undefined}
          />
        ) : (
          <div
            className="script-text"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
          >
            {currentMode === 'voice' ? (
              script.split(/(\s+)/).reduce<{ elements: React.ReactNode[]; wordCount: number }>(
                (acc, token, i) => {
                  if (/^\s+$/.test(token) || token === '') {
                    acc.elements.push(token)
                  } else {
                    const idx = acc.wordCount
                    acc.wordCount++
                    acc.elements.push(
                      idx === voiceScroll.wordIndex ? (
                        <span key={i} className="word-active">{token}</span>
                      ) : (
                        token
                      )
                    )
                  }
                  return acc
                },
                { elements: [], wordCount: 0 }
              ).elements
            ) : (
              script
            )}
          </div>
        )}
        <div className="script-spacer" />
      </div>

      {/* Error banner */}
      {showErrorBanner && (
        <div className="error-banner">
          <span className="error-banner-message">{errorBannerMessage}</span>
          <button className="error-banner-dismiss" onClick={(e) => { e.stopPropagation(); setShowErrorBanner(false) }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Controls overlay */}
      <div className={`controls-overlay ${showControls ? 'visible' : ''}`}>
        <div className="controls-top">
          <button className="control-btn back-btn" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="speed-display">
            {currentMode === 'voice' ? (
              <span className="speed-display-voice">
                {/* Mic icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                <span className={getMicIndicatorClass()} />
              </span>
            ) : (
              <>{currentSpeed}%</>
            )}
          </div>

          <div className="controls-top-right">
            {/* Mode toggle button */}
            <button
              className={`control-btn mode-toggle-btn ${currentMode === 'voice' ? 'mode-btn-active' : ''}`}
              onClick={toggleMode}
              title={currentMode === 'constant' ? 'Switch to voice mode' : 'Switch to constant mode'}
            >
              {currentMode === 'voice' ? (
                // Mic icon for voice mode (active)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              ) : (
                // Clock icon for constant mode
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              )}
            </button>
            <button className="control-btn restart-btn" onClick={handleRestart}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
            </button>
          </div>
        </div>

        <div className="controls-bottom">
          {currentMode === 'constant' ? (
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
          ) : (
            <div className="voice-status" onClick={(e) => e.stopPropagation()}>
              <span className={getMicIndicatorClass()} />
              {voiceScroll.error ? (
                <span className="voice-status-text voice-status-error">{voiceScroll.error}</span>
              ) : voiceScroll.isListening ? (
                <span className="voice-status-text">Listening...</span>
              ) : !voiceScroll.isSupported ? (
                <span className="voice-status-text voice-status-error">Voice not supported</span>
              ) : (
                <span className="voice-status-text">Microphone off</span>
              )}
            </div>
          )}
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
