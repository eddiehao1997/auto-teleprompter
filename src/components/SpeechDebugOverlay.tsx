import type { SpeechState, VoiceMatchResult } from '../types'
import './SpeechDebugOverlay.css'

interface SpeechDebugOverlayProps {
  speechState: SpeechState
  matchResult: VoiceMatchResult | null
  cursorPosition: number
  isVisible: boolean
  onToggle: () => void
}

export function SpeechDebugOverlay({
  speechState,
  matchResult,
  cursorPosition,
  isVisible,
  onToggle,
}: SpeechDebugOverlayProps) {
  return (
    <div className="speech-debug-overlay">
      <button className="speech-debug-toggle" onClick={onToggle}>
        {isVisible ? 'Hide' : 'Show'} Debug
      </button>

      {isVisible && (
        <div className="speech-debug-panel">
          <h4 className="speech-debug-title">Speech Debug</h4>

          <div className="speech-debug-row">
            <span className="speech-debug-label">Supported:</span>
            <span className={speechState.isSupported ? 'status-ok' : 'status-err'}>
              {speechState.isSupported ? 'Yes' : 'No'}
            </span>
          </div>

          <div className="speech-debug-row">
            <span className="speech-debug-label">Listening:</span>
            <span className={speechState.isListening ? 'status-ok' : 'status-off'}>
              {speechState.isListening ? 'Active' : 'Inactive'}
            </span>
          </div>

          {speechState.error && (
            <div className="speech-debug-row">
              <span className="speech-debug-label">Error:</span>
              <span className="status-err">{speechState.error}</span>
            </div>
          )}

          <div className="speech-debug-row">
            <span className="speech-debug-label">Transcript:</span>
            <span className="speech-debug-value">
              {speechState.interimTranscript || speechState.transcript || '(none)'}
            </span>
          </div>

          <div className="speech-debug-row">
            <span className="speech-debug-label">Cursor:</span>
            <span className="speech-debug-value">{cursorPosition}</span>
          </div>

          <div className="speech-debug-row">
            <span className="speech-debug-label">Match:</span>
            <span className="speech-debug-value">
              {matchResult
                ? `"${matchResult.matchedText}" (${Math.round(matchResult.confidence * 100)}%)`
                : '(none)'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
