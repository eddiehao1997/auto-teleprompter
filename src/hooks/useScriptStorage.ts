import { useState, useCallback, useEffect } from 'react'
import type { Script } from '../types'

const STORAGE_KEY = 'teleprompter_scripts'

interface ScriptSummary {
  id: string
  title: string
  updatedAt: string
}

function readAllScripts(): Record<string, { script: Script; updatedAt: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function writeAllScripts(data: Record<string, { script: Script; updatedAt: string }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useScriptStorage() {
  const [savedScripts, setSavedScripts] = useState<ScriptSummary[]>([])

  const refresh = useCallback(() => {
    const all = readAllScripts()
    const summaries: ScriptSummary[] = Object.entries(all)
      .map(([id, entry]) => ({
        id,
        title: entry.script.title || 'Untitled',
        updatedAt: entry.updatedAt,
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    setSavedScripts(summaries)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const saveScript = useCallback(
    (script: Script) => {
      const all = readAllScripts()
      all[script.id] = { script, updatedAt: new Date().toISOString() }
      writeAllScripts(all)
      refresh()
    },
    [refresh],
  )

  const loadScript = useCallback((id: string): Script | null => {
    const all = readAllScripts()
    return all[id]?.script ?? null
  }, [])

  const deleteScript = useCallback(
    (id: string) => {
      const all = readAllScripts()
      delete all[id]
      writeAllScripts(all)
      refresh()
    },
    [refresh],
  )

  return { savedScripts, saveScript, loadScript, deleteScript }
}
