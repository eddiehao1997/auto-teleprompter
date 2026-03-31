import { useCallback } from 'react'
import { useScript } from '../contexts/ScriptContext'
import type { Speaker } from '../types'

const SPEAKER_COLORS = [
  '#e94560',
  '#00d4aa',
  '#ffd700',
  '#7b68ee',
  '#ff6b35',
  '#00bfff',
  '#ff69b4',
  '#98fb98',
]

export function useSpeakers() {
  const { state, dispatch } = useScript()
  const speakers = state.script.speakers

  const addSpeaker = useCallback(
    (name: string) => {
      const colorIndex = speakers.length % SPEAKER_COLORS.length
      const speaker: Speaker = {
        id: crypto.randomUUID(),
        name,
        color: SPEAKER_COLORS[colorIndex] ?? '#e94560',
      }
      dispatch({ type: 'ADD_SPEAKER', payload: speaker })
    },
    [speakers.length, dispatch],
  )

  const removeSpeaker = useCallback(
    (id: string) => {
      dispatch({ type: 'REMOVE_SPEAKER', payload: id })
    },
    [dispatch],
  )

  const updateSpeaker = useCallback(
    (speaker: Speaker) => {
      dispatch({ type: 'UPDATE_SPEAKER', payload: speaker })
    },
    [dispatch],
  )

  return { speakers, addSpeaker, removeSpeaker, updateSpeaker }
}
