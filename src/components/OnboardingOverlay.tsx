import { useState, useEffect } from 'react'
import './OnboardingOverlay.css'

const STORAGE_KEY = 'onboarding-dismissed'

function OnboardingOverlay() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-title">Welcome to Auto Teleprompter</div>

        <div className="onboarding-tip">
          <div className="onboarding-tip-number">1</div>
          <div className="onboarding-tip-text">
            <strong>Voice Mode</strong> — Toggle the mic icon to let your voice control scrolling
          </div>
        </div>

        <div className="onboarding-tip">
          <div className="onboarding-tip-number">2</div>
          <div className="onboarding-tip-text">
            <strong>Multi-Speaker</strong> — Add speakers in the editor to color-code your script
          </div>
        </div>

        <div className="onboarding-tip">
          <div className="onboarding-tip-number">3</div>
          <div className="onboarding-tip-text">
            <strong>Controls</strong> — Tap the screen during playback to show/hide controls
          </div>
        </div>

        <button className="onboarding-dismiss" onClick={handleDismiss}>
          Got it!
        </button>
      </div>
    </div>
  )
}

export default OnboardingOverlay
