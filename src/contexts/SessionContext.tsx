import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { SessionState, SessionAction } from '../types'

const defaultState: SessionState = {
  isPrompting: false,
  isPlaying: false,
  speed: 50,
  fontSize: 32,
  mirrorMode: false,
  scrollMode: 'constant',
}

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload }
    case 'SET_SPEED':
      return { ...state, speed: action.payload }
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: action.payload }
    case 'SET_MIRROR_MODE':
      return { ...state, mirrorMode: action.payload }
    case 'SET_SCROLL_MODE':
      return { ...state, scrollMode: action.payload }
    case 'SET_IS_PROMPTING':
      return { ...state, isPrompting: action.payload }
    case 'RESET':
      return defaultState
    default:
      return state
  }
}

interface SessionContextValue {
  state: SessionState
  dispatch: React.Dispatch<SessionAction>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, defaultState)
  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return ctx
}
