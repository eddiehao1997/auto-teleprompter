import { useState } from 'react'
import { useSpeakers } from '../hooks/useSpeakers'
import './SpeakerManager.css'

function SpeakerManager() {
  const { speakers, addSpeaker, removeSpeaker, updateSpeaker } = useSpeakers()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleAdd = () => {
    const nextNum = speakers.length + 1
    addSpeaker(`Speaker ${nextNum}`)
  }

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id)
    setEditValue(currentName)
  }

  const commitEdit = () => {
    if (editingId) {
      const speaker = speakers.find((s) => s.id === editingId)
      if (speaker && editValue.trim()) {
        updateSpeaker({ ...speaker, name: editValue.trim() })
      }
      setEditingId(null)
      setEditValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit()
    } else if (e.key === 'Escape') {
      setEditingId(null)
      setEditValue('')
    }
  }

  return (
    <div className="speaker-manager">
      <div className="speaker-manager-header">
        <span className="speaker-manager-title">Speakers</span>
        <button className="add-speaker-btn" onClick={handleAdd}>
          + Add Speaker
        </button>
      </div>
      <div className="speaker-list">
        {speakers.length === 0 && (
          <div className="speaker-empty">No speakers defined</div>
        )}
        {speakers.map((speaker) => (
          <div key={speaker.id} className="speaker-item">
            <span
              className="speaker-color-dot"
              style={{ background: speaker.color }}
            />
            {editingId === speaker.id ? (
              <input
                className="speaker-name-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            ) : (
              <span
                className="speaker-name-display"
                onClick={() => startEditing(speaker.id, speaker.name)}
              >
                {speaker.name}
              </span>
            )}
            <button
              className="speaker-delete-btn"
              onClick={() => removeSpeaker(speaker.id)}
              title={`Remove ${speaker.name}`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SpeakerManager
