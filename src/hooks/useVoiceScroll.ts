import { useRef, useEffect, useState, useCallback } from 'react'
import { useSpeechRecognition } from './useSpeechRecognition'
import { createMatcher, findMatch, normalizeText, type MatcherState } from '../utils/voiceMatch'

interface UseVoiceScrollOptions {
  scriptText: string
  isActive: boolean
}

interface UseVoiceScrollReturn {
  wordIndex: number
  totalWords: number
  confidence: number
  isListening: boolean
  error: string | null
  isSupported: boolean
}

/**
 * Combines speech recognition with text matching to produce a current word index
 * that tracks the speaker's position in the script.
 */
export function useVoiceScroll({
  scriptText,
  isActive,
}: UseVoiceScrollOptions): UseVoiceScrollReturn {
  const { state: speechState, start, stop } = useSpeechRecognition()
  const matcherRef = useRef<MatcherState>(createMatcher(scriptText))
  const [wordIndex, setWordIndex] = useState(0)
  const [confidence, setConfidence] = useState(0)
  const lastProcessedTranscriptRef = useRef('')
  const totalWords = useRef(normalizeText(scriptText).length)

  // Reset matcher when script changes
  useEffect(() => {
    matcherRef.current = createMatcher(scriptText)
    totalWords.current = normalizeText(scriptText).length
    setWordIndex(0)
    setConfidence(0)
    lastProcessedTranscriptRef.current = ''
  }, [scriptText])

  // Start/stop speech recognition based on isActive
  useEffect(() => {
    if (isActive) {
      start()
    } else {
      stop()
    }
    // Intentionally not including start/stop as deps since they're stable callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  // Process new transcripts to advance word index
  const processTranscript = useCallback((text: string) => {
    if (!text || text === lastProcessedTranscriptRef.current) return

    lastProcessedTranscriptRef.current = text
    const { newState, result } = findMatch(matcherRef.current, text)
    matcherRef.current = newState

    if (result) {
      setWordIndex(result.wordIndex + Math.min(6, result.matchedText.split(' ').length))
      setConfidence(result.confidence)
    }
  }, [])

  // React to transcript changes
  useEffect(() => {
    // Process final transcript
    if (speechState.transcript) {
      processTranscript(speechState.transcript)
    }
    // Also process interim results for faster tracking
    if (speechState.interimTranscript) {
      processTranscript(speechState.transcript + speechState.interimTranscript)
    }
  }, [speechState.transcript, speechState.interimTranscript, processTranscript])

  return {
    wordIndex,
    totalWords: totalWords.current,
    confidence,
    isListening: speechState.isListening,
    error: speechState.error,
    isSupported: speechState.isSupported,
  }
}
