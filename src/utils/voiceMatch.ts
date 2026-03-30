import type { VoiceMatchResult } from '../types'

export interface MatcherState {
  cursorPosition: number
  scriptWords: string[]
}

/**
 * Compute the Levenshtein edit distance between two strings.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length

  if (m === 0) return n
  if (n === 0) return m

  // Use a single-row DP approach for space efficiency
  const prev = new Array<number>(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j

  for (let i = 1; i <= m; i++) {
    let prevDiag = prev[0]!
    prev[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = prev[j]!
      if (a[i - 1] === b[j - 1]) {
        prev[j] = prevDiag
      } else {
        prev[j] = 1 + Math.min(prevDiag, prev[j - 1]!, prev[j]!)
      }
      prevDiag = temp
    }
  }

  return prev[n]!
}

/**
 * Normalize text: lowercase, strip punctuation, split by whitespace, filter empties.
 */
export function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0)
}

/**
 * Create a new matcher state from raw script text.
 */
export function createMatcher(scriptText: string): MatcherState {
  return {
    cursorPosition: 0,
    scriptWords: normalizeText(scriptText),
  }
}

/**
 * Determine if two words are a fuzzy match (exact or Levenshtein distance <= 2).
 */
function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true
  // Only apply fuzzy matching if words are long enough to warrant it
  if (a.length <= 2 || b.length <= 2) return false
  return levenshtein(a, b) <= 2
}

const SEARCH_WINDOW = 50
const SEARCH_PHRASE_LENGTH = 6
const MATCH_THRESHOLD = 0.6

/**
 * Find a match for recognized speech in the script, advancing the cursor forward.
 *
 * Returns the new matcher state and a VoiceMatchResult if a match was found,
 * or null if no match above the threshold was found.
 */
export function findMatch(
  state: MatcherState,
  recognizedText: string
): { newState: MatcherState; result: VoiceMatchResult | null } {
  const recognizedWords = normalizeText(recognizedText)

  if (recognizedWords.length === 0) {
    return { newState: state, result: null }
  }

  // Take the last N words of recognized text as the search phrase
  const phraseLen = Math.min(SEARCH_PHRASE_LENGTH, recognizedWords.length)
  const searchPhrase = recognizedWords.slice(-phraseLen)

  const { scriptWords, cursorPosition } = state
  const windowEnd = Math.min(cursorPosition + SEARCH_WINDOW, scriptWords.length)

  let bestScore = 0
  let bestPosition = -1

  // Slide the search phrase across the window ahead of cursor
  for (let pos = cursorPosition; pos <= windowEnd - searchPhrase.length; pos++) {
    let matchCount = 0
    for (let i = 0; i < searchPhrase.length; i++) {
      if (wordsMatch(searchPhrase[i]!, scriptWords[pos + i]!)) {
        matchCount++
      }
    }
    const score = matchCount / searchPhrase.length
    if (score > bestScore) {
      bestScore = score
      bestPosition = pos
    }
  }

  if (bestScore < MATCH_THRESHOLD || bestPosition < 0) {
    return { newState: state, result: null }
  }

  // Advance cursor to the end of the matched phrase
  const newCursorPosition = bestPosition + searchPhrase.length

  const result: VoiceMatchResult = {
    wordIndex: bestPosition,
    confidence: bestScore,
    matchedText: scriptWords.slice(bestPosition, bestPosition + searchPhrase.length).join(' '),
  }

  return {
    newState: {
      ...state,
      cursorPosition: newCursorPosition,
    },
    result,
  }
}
