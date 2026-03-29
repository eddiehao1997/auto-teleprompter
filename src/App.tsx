import ScriptEditor from './components/ScriptEditor'
import Teleprompter from './components/Teleprompter'
import { ScriptProvider, useScript, scriptTextFromSections } from './contexts/ScriptContext'
import { SessionProvider, useSession } from './contexts/SessionContext'
import './App.css'

function AppContent() {
  const { state: scriptState, dispatch: scriptDispatch } = useScript()
  const { state: session, dispatch: sessionDispatch } = useSession()

  const scriptText = scriptTextFromSections(scriptState.script.sections)

  const handleScriptChange = (text: string) => {
    scriptDispatch({ type: 'SET_SCRIPT_TEXT', payload: text })
  }

  const handleStart = () => {
    if (scriptText.trim()) {
      sessionDispatch({ type: 'SET_IS_PROMPTING', payload: true })
    }
  }

  const handleBack = () => {
    sessionDispatch({ type: 'SET_IS_PROMPTING', payload: false })
  }

  const handleFontSizeChange = (size: number) => {
    sessionDispatch({ type: 'SET_FONT_SIZE', payload: size })
  }

  const handleSpeedChange = (speed: number) => {
    sessionDispatch({ type: 'SET_SPEED', payload: speed })
  }

  const handleMirrorModeChange = (mirror: boolean) => {
    sessionDispatch({ type: 'SET_MIRROR_MODE', payload: mirror })
  }

  if (session.isPrompting) {
    return (
      <Teleprompter
        script={scriptText}
        fontSize={session.fontSize}
        speed={session.speed}
        mirrorMode={session.mirrorMode}
        onBack={handleBack}
      />
    )
  }

  return (
    <ScriptEditor
      script={scriptText}
      onScriptChange={handleScriptChange}
      fontSize={session.fontSize}
      onFontSizeChange={handleFontSizeChange}
      speed={session.speed}
      onSpeedChange={handleSpeedChange}
      mirrorMode={session.mirrorMode}
      onMirrorModeChange={handleMirrorModeChange}
      onStart={handleStart}
    />
  )
}

function App() {
  return (
    <SessionProvider>
      <ScriptProvider>
        <AppContent />
      </ScriptProvider>
    </SessionProvider>
  )
}

export default App
