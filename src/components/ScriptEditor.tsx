import { useRef } from 'react'
import './ScriptEditor.css'

const SAMPLE_SCRIPT = `Welcome to the Teleprompter App!

This is a sample script to demonstrate how the teleprompter works. You can replace this text with your own script.

The teleprompter will scroll through your text at a steady, adjustable speed. You can control the speed, font size, and even mirror the text for use with a reflective teleprompter setup.

Tips for using the teleprompter:

- Write in short paragraphs for easier reading
- Use larger font sizes for better visibility
- Adjust the speed to match your natural speaking pace
- Practice with the script a few times before recording
- Use the pause button if you need to take a break

Good luck with your presentation!`

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

  const handleLoadSample = () => {
    onScriptChange(SAMPLE_SCRIPT)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  return (
    <div className="editor-container">
      <header className="editor-header">
        <h1>Teleprompter</h1>
        <p className="subtitle">Enter your script and customize settings</p>
      </header>

      <div className="editor-content">
        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="script-textarea"
            value={script}
            onChange={(e) => onScriptChange(e.target.value)}
            placeholder="Paste or type your script here..."
            spellCheck={false}
          />
          <button className="sample-btn" onClick={handleLoadSample}>
            Load Sample
          </button>
        </div>

        <div className="settings">
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
        disabled={!script.trim()}
      >
        Start Teleprompter
      </button>
    </div>
  )
}

export default ScriptEditor
