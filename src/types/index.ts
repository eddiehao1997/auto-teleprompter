// Speaker assigned to script sections
export interface Speaker {
  id: string
  name: string
  color: string
}

// A section of the script assigned to a speaker
export interface ScriptSection {
  id: string
  speakerId: string | null
  content: string
  order: number
}

// Full structured script
export interface Script {
  id: string
  title: string
  sections: ScriptSection[]
  speakers: Speaker[]
}

// Speech recognition state
export interface SpeechState {
  transcript: string
  interimTranscript: string
  isListening: boolean
  confidence: number
  error: string | null
  isSupported: boolean
}

// Scroll engine state
export interface ScrollEngineState {
  mode: 'constant' | 'voice'
  position: number
  isActive: boolean
  progress: number
  pixelsPerSecond: number
}

// Voice match result
export interface VoiceMatchResult {
  wordIndex: number
  confidence: number
  matchedText: string
}

// App settings
export interface TeleprompterSettings {
  fontSize: number
  speed: number
  mirrorMode: boolean
  scrollMode: 'constant' | 'voice'
}

// Script context actions
export type ScriptAction =
  | { type: 'SET_SCRIPT'; payload: Script }
  | { type: 'SET_SCRIPT_TEXT'; payload: string }
  | { type: 'ADD_SPEAKER'; payload: Speaker }
  | { type: 'REMOVE_SPEAKER'; payload: string }
  | { type: 'UPDATE_SPEAKER'; payload: Speaker }
  | { type: 'ADD_SECTION'; payload: ScriptSection }
  | { type: 'UPDATE_SECTION'; payload: ScriptSection }
  | { type: 'REMOVE_SECTION'; payload: string }
  | { type: 'ASSIGN_SPEAKER_TO_SECTION'; payload: { sectionId: string; speakerId: string | null } }
  | { type: 'RESET' }

// Session context actions
export type SessionAction =
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'SET_FONT_SIZE'; payload: number }
  | { type: 'SET_MIRROR_MODE'; payload: boolean }
  | { type: 'SET_SCROLL_MODE'; payload: 'constant' | 'voice' }
  | { type: 'SET_IS_PROMPTING'; payload: boolean }
  | { type: 'RESET' }

// Session state
export interface SessionState {
  isPrompting: boolean
  isPlaying: boolean
  speed: number
  fontSize: number
  mirrorMode: boolean
  scrollMode: 'constant' | 'voice'
}
