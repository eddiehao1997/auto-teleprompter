import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Script, ScriptAction, ScriptSection } from '../types'

interface ScriptState {
  script: Script
}

function createDefaultScript(): Script {
  return {
    id: crypto.randomUUID(),
    title: '',
    sections: [
      {
        id: crypto.randomUUID(),
        speakerId: null,
        content: '',
        order: 0,
      },
    ],
    speakers: [],
  }
}

const defaultState: ScriptState = {
  script: createDefaultScript(),
}

/** Concatenate all section contents into a single plain-text string. */
export function scriptTextFromSections(sections: ScriptSection[]): string {
  return sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => s.content)
    .join('\n')
}

function scriptReducer(state: ScriptState, action: ScriptAction): ScriptState {
  switch (action.type) {
    case 'SET_SCRIPT':
      return { script: action.payload }

    case 'SET_SCRIPT_TEXT': {
      // Overwrite the first section's content (or create one) to keep
      // backward-compatibility with the plain-text model.
      const section: ScriptSection = state.script.sections[0]
        ? { ...state.script.sections[0], content: action.payload }
        : {
            id: crypto.randomUUID(),
            speakerId: null,
            content: action.payload,
            order: 0,
          }
      return {
        script: {
          ...state.script,
          sections: [section],
        },
      }
    }

    case 'ADD_SPEAKER':
      return {
        script: {
          ...state.script,
          speakers: [...state.script.speakers, action.payload],
        },
      }

    case 'REMOVE_SPEAKER':
      return {
        script: {
          ...state.script,
          speakers: state.script.speakers.filter((s) => s.id !== action.payload),
          sections: state.script.sections.map((sec) =>
            sec.speakerId === action.payload ? { ...sec, speakerId: null } : sec,
          ),
        },
      }

    case 'UPDATE_SPEAKER':
      return {
        script: {
          ...state.script,
          speakers: state.script.speakers.map((s) =>
            s.id === action.payload.id ? action.payload : s,
          ),
        },
      }

    case 'ADD_SECTION':
      return {
        script: {
          ...state.script,
          sections: [...state.script.sections, action.payload],
        },
      }

    case 'UPDATE_SECTION':
      return {
        script: {
          ...state.script,
          sections: state.script.sections.map((s) =>
            s.id === action.payload.id ? action.payload : s,
          ),
        },
      }

    case 'REMOVE_SECTION':
      return {
        script: {
          ...state.script,
          sections: state.script.sections.filter((s) => s.id !== action.payload),
        },
      }

    case 'ASSIGN_SPEAKER_TO_SECTION':
      return {
        script: {
          ...state.script,
          sections: state.script.sections.map((s) =>
            s.id === action.payload.sectionId
              ? { ...s, speakerId: action.payload.speakerId }
              : s,
          ),
        },
      }

    case 'RESET':
      return { script: createDefaultScript() }

    default:
      return state
  }
}

interface ScriptContextValue {
  state: ScriptState
  dispatch: React.Dispatch<ScriptAction>
}

const ScriptContext = createContext<ScriptContextValue | null>(null)

export function ScriptProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(scriptReducer, defaultState)
  return (
    <ScriptContext.Provider value={{ state, dispatch }}>
      {children}
    </ScriptContext.Provider>
  )
}

export function useScript(): ScriptContextValue {
  const ctx = useContext(ScriptContext)
  if (!ctx) {
    throw new Error('useScript must be used within a ScriptProvider')
  }
  return ctx
}
