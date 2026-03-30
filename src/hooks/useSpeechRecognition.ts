import { useState, useRef, useCallback } from 'react'
import type { SpeechState } from '../types'

// TypeScript declarations for the Web Speech API

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event & { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

const initialState: SpeechState = {
  transcript: '',
  interimTranscript: '',
  isListening: false,
  confidence: 0,
  error: null,
  isSupported: false,
}

export function useSpeechRecognition(): {
  state: SpeechState
  start: () => void
  stop: () => void
} {
  const SpeechRecognitionCtor = getSpeechRecognitionConstructor()
  const isSupported = SpeechRecognitionCtor !== null

  const [state, setState] = useState<SpeechState>({
    ...initialState,
    isSupported,
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const shouldBeListeningRef = useRef(false)

  const start = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      setState((prev) => ({
        ...prev,
        error: 'Speech recognition is not supported in this browser.',
      }))
      return
    }

    // Don't start if already listening
    if (shouldBeListeningRef.current) return

    shouldBeListeningRef.current = true

    // Clean up any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setState((prev) => ({
        ...prev,
        isListening: true,
        error: null,
      }))
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''
      let lastConfidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (!result || !result[0]) continue
        const text = result[0].transcript
        if (result.isFinal) {
          finalTranscript += text
          lastConfidence = result[0].confidence
        } else {
          interimTranscript += text
        }
      }

      setState((prev) => ({
        ...prev,
        transcript: finalTranscript ? prev.transcript + finalTranscript : prev.transcript,
        interimTranscript,
        confidence: lastConfidence || prev.confidence,
      }))
    }

    recognition.onerror = (event: Event & { error: string }) => {
      const error = event.error

      // 'no-speech' and 'aborted' are not real errors, just temporary states
      if (error === 'no-speech' || error === 'aborted') return

      setState((prev) => ({
        ...prev,
        error: `Speech recognition error: ${error}`,
        isListening: false,
      }))

      // On permission errors, stop trying to restart
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        shouldBeListeningRef.current = false
      }
    }

    recognition.onend = () => {
      setState((prev) => ({
        ...prev,
        isListening: false,
      }))

      // Auto-restart if we should still be listening
      // (the API stops after silence or max duration)
      if (shouldBeListeningRef.current) {
        try {
          recognition.start()
        } catch {
          // If restart fails, give up
          shouldBeListeningRef.current = false
        }
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      setState((prev) => ({
        ...prev,
        error: 'Failed to start speech recognition.',
        isListening: false,
      }))
      shouldBeListeningRef.current = false
    }
  }, [SpeechRecognitionCtor])

  const stop = useCallback(() => {
    shouldBeListeningRef.current = false

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }

    setState((prev) => ({
      ...prev,
      isListening: false,
    }))
  }, [])

  return { state, start, stop }
}
