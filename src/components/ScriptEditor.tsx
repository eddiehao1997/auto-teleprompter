import { useRef, useCallback } from 'react'
import { useScript } from '../contexts/ScriptContext'
import { useSpeakers } from '../hooks/useSpeakers'
import SpeakerManager from './SpeakerManager'
import type { ScriptSection } from '../types'
import './ScriptEditor.css'

const MULTI_SPEAKER_SAMPLE = `Good evening and welcome to tonight's debate. I'm your moderator, and I'll be guiding the discussion between our two speakers.

Let's begin with opening statements. Speaker One, the floor is yours.

Thank you. I believe that technology has fundamentally improved how we communicate, work, and solve problems. The evidence is clear in every sector from healthcare to education.

Interesting perspective. Speaker Two, your opening statement please.

While I appreciate the optimism, I think we need to critically examine the costs of rapid technological adoption. Not every community benefits equally, and we must address the digital divide.

Excellent points from both sides. Let's dive deeper into specific examples.`

interface ScriptEditorProps {
  script: string
  onScriptChange: (script: string) => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  speed: number
  onSpeedChange: (speed: number) => void
  mirrorMode: boolean
  onMirrorModeChange: (mirror: boolean) => void
  onStart: () => void
}

function ScriptEditor({
  script,
  onScriptChange,
  fontSize,
  onFontSizeChange,
  speed,
  onSpeedChange,
  mirrorMode,
  onMirrorModeChange,
  onStart,
}: ScriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { state, dispatch } = useScript()
  const { speakers } = useSpeakers()

  const sections = state.script.sections
    .slice()
    .sort((a, b) => a.order - b.order)

  const hasSpeakers = speakers.length > 0

  const handleLoadSample = () => {
    onScriptChange(MULTI_SPEAKER_SAMPLE)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  // Split plain text into paragraph-based sections when speakers exist
  const syncSectionsFromText = useCallback(
    (text: string) => {
      if (!hasSpeakers) {
        onScriptChange(text)
        return
      }
      // Split by blank lines into paragraphs
      const paragraphs = text.split(/\n\n+/).filter((p) => p.trim())
      const existingSections = state.script.sections
        .slice()
        .sort((a, b) => a.order - b.order)

      const newSections: ScriptSection[] = paragraphs.map((content, i) => ({
        id: existingSections[i]?.id ?? crypto.randomUUID(),
        speakerId: existingSections[i]?.speakerId ?? null,
        content: content.trim(),
        order: i,
      }))

      dispatch({
        type: 'SET_SCRIPT',
        payload: {
          ...state.script,
          sections: newSections,
        },
      })
    },
    [hasSpeakers, onScriptChange, state.script, dispatch],
  )

  const handleTextChange = (text: string) => {
    if (hasSpeakers) {
      syncSectionsFromText(text)
    } else {
      onScriptChange(text)
    }
  }

  const handleSpeakerAssign = (sectionId: string, speakerId: string | null) => {
    dispatch({
      type: 'ASSIGN_SPEAKER_TO_SECTION',
      payload: { sectionId, speakerId },
    })
  }

  // Build display text from sections
  const displayText = hasSpeakers
    ? sections.map((s) => s.content).join('\n\n')
    : script

  return (
    <div className="editor-container">
      <header className="editor-header">
        <h1>Teleprompter</h1>
        <p className="subtitle">Enter your script and customize settings</p>
      </header>

      <div className="editor-content">
        {hasSpeakers ? (
          <div className="section-editor-wrapper">
            {sections.map((section) => {
              const speaker = speakers.find((s) => s.id === section.speakerId)
              const borderColor = speaker?.color ?? '#444'
              return (
                <div
                  key={section.id}
                  className="section-block"
                  style={{ borderLeftColor: borderColor }}
                >
                  <div className="section-header">
                    <select
                      className="speaker-select"
                      value={section.speakerId ?? ''}
                      onChange={(e) =>
                        handleSpeakerAssign(
                          section.id,
                          e.target.value || null,
                        )
                      }
                    >
                      <option value="">Unassigned</option>
                      {speakers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {speaker && (
                      <span
                        className="section-speaker-dot"
                        style={{ background: speaker.color }}
                      />
                    )}
                  </div>
                  <textarea
                    className="section-textarea"
                    value={section.content}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_SECTION',
                        payload: { ...section, content: e.target.value },
                      })
                    }
                    rows={Math.max(2, section.content.split('\n').length)}
                    spellCheck={false}
                  />
                </div>
              )
            })}
            <button className="sample-btn section-sample-btn" onClick={handleLoadSample}>
              Load Sample
            </button>
          </div>
        ) : (
          <div className="textarea-wrapper">
            <textarea
              ref={textareaRef}
              className="script-textarea"
              value={displayText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Paste or type your script here..."
              spellCheck={false}
            />
            <button className="sample-btn" onClick={handleLoadSample}>
              Load Sample
            </button>
          </div>
        )}

        <div className="settings">
          <SpeakerManager />

          <div className="setting-group">
            <label className="setting-label">
              Font Size: <span className="setting-value">{fontSize}px</span>
            </label>
            <input
              type="range"
              min="16"
              max="72"
              value={fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-label">
              Scroll Speed: <span className="setting-value">{speed}%</span>
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>

          <div className="setting-group">
            <label className="toggle-label">
              <span>Mirror Mode</span>
              <button
                className={`toggle-btn ${mirrorMode ? 'active' : ''}`}
                onClick={() => onMirrorModeChange(!mirrorMode)}
                role="switch"
                aria-checked={mirrorMode}
              >
                <span className="toggle-knob" />
              </button>
            </label>
          </div>
        </div>
      </div>

      <button
        className="start-btn"
        onClick={onStart}
        disabled={!script.trim() && sections.every((s) => !s.content.trim())}
      >
        Start Teleprompter
      </button>
    </div>
  )
}

export default ScriptEditor
