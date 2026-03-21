import { useState } from 'react'
import ScriptEditor from './components/ScriptEditor'
import Teleprompter from './components/Teleprompter'
import './App.css'

function App() {
  const [script, setScript] = useState('')
  const [isPrompting, setIsPrompting] = useState(false)
  const [fontSize, setFontSize] = useState(32)
  const [speed, setSpeed] = useState(50)
  const [mirrorMode, setMirrorMode] = useState(false)

  const handleStart = () => {
    if (script.trim()) {
      setIsPrompting(true)
    }
  }

  const handleBack = () => {
    setIsPrompting(false)
  }

  if (isPrompting) {
    return (
      <Teleprompter
        script={script}
        fontSize={fontSize}
        speed={speed}
        mirrorMode={mirrorMode}
        onBack={handleBack}
      />
    )
  }

  return (
    <ScriptEditor
      script={script}
      onScriptChange={setScript}
      fontSize={fontSize}
      onFontSizeChange={setFontSize}
      speed={speed}
      onSpeedChange={setSpeed}
      mirrorMode={mirrorMode}
      onMirrorModeChange={setMirrorMode}
      onStart={handleStart}
    />
  )
}

export default App
