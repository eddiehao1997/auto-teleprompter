import { describe, it, expect } from 'vitest'
import {
  createMatcher,
  findMatch,
  levenshtein,
  normalizeText,
} from '../utils/voiceMatch'

describe('normalizeText', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizeText('Hello, World!')).toEqual(['hello', 'world'])
  })

  it('splits on multiple whitespace', () => {
    expect(normalizeText('one   two\tthree')).toEqual(['one', 'two', 'three'])
  })

  it('returns empty array for empty string', () => {
    expect(normalizeText('')).toEqual([])
  })

  it('strips various punctuation marks', () => {
    expect(normalizeText('"Wait—really?" she asked.')).toEqual([
      'waitreally',
      'she',
      'asked',
    ])
  })
})

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('hello', 'hello')).toBe(0)
  })

  it('returns length for empty vs non-empty', () => {
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('abc', '')).toBe(3)
  })

  it('computes single edit distance', () => {
    expect(levenshtein('cat', 'bat')).toBe(1)
    expect(levenshtein('cat', 'cats')).toBe(1)
    expect(levenshtein('cat', 'ca')).toBe(1)
  })

  it('computes multi-edit distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
  })
})

describe('createMatcher', () => {
  it('creates state with cursor at 0 and normalized words', () => {
    const state = createMatcher('Hello, World! This is a test.')
    expect(state.cursorPosition).toBe(0)
    expect(state.scriptWords).toEqual([
      'hello',
      'world',
      'this',
      'is',
      'a',
      'test',
    ])
  })
})

describe('findMatch', () => {
  const script =
    'The quick brown fox jumps over the lazy dog and then runs across the field toward the sunset'

  it('basic matching: exact words advance cursor', () => {
    const state = createMatcher(script)
    const { newState, result } = findMatch(state, 'the quick brown fox jumps over')
    expect(result).not.toBeNull()
    expect(result!.wordIndex).toBe(0)
    expect(result!.confidence).toBe(1)
    expect(newState.cursorPosition).toBeGreaterThan(0)
  })

  it('fuzzy matching: slight misspellings still match', () => {
    const state = createMatcher(
      'The teleprompter displays the script for the speaker'
    )
    // "telepromter" is a misspelling of "teleprompter" (Levenshtein distance 1)
    const { result } = findMatch(state, 'the telepromter displays the script for the')
    expect(result).not.toBeNull()
    expect(result!.confidence).toBeGreaterThanOrEqual(0.6)
  })

  it('forward-only: cursor never goes backward', () => {
    const state = createMatcher(script)
    // First match: advance to some position
    const { newState: state2 } = findMatch(state, 'the quick brown fox jumps over')
    expect(state2.cursorPosition).toBeGreaterThan(0)

    // Try to match words that occur BEFORE the current cursor
    const { newState: state3, result } = findMatch(state2, 'the quick brown fox')
    // Cursor should not go backward
    expect(state3.cursorPosition).toBeGreaterThanOrEqual(state2.cursorPosition)
    // Should return null since those words are behind the cursor
    expect(result).toBeNull()
  })

  it('window boundary: matching stops at window edge', () => {
    // Build a long script where words at positions 60+ are completely
    // different from any word in positions 0-49 (beyond Levenshtein 2).
    // First 60 words are "alpha..." and last 40 are "zzomega..." to be very dissimilar.
    const words: string[] = []
    for (let i = 0; i < 60; i++) {
      words.push(`alphaprefix${String(i).padStart(3, '0')}suffix`)
    }
    for (let i = 60; i < 100; i++) {
      words.push(`zzomegadelta${String(i).padStart(3, '0')}gamma`)
    }
    const state = createMatcher(words.join(' '))
    // Try to match words at positions 70-75, far beyond the 50-word window
    const target = words.slice(70, 76).join(' ')
    const { result } = findMatch(state, target)
    expect(result).toBeNull()
  })

  it('no match: random words do not advance cursor', () => {
    const state = createMatcher(script)
    const { newState, result } = findMatch(
      state,
      'xylophone quantum zebra platypus umbrella banana'
    )
    expect(result).toBeNull()
    expect(newState.cursorPosition).toBe(0)
  })

  it('empty input: returns null', () => {
    const state = createMatcher(script)
    const { newState, result } = findMatch(state, '')
    expect(result).toBeNull()
    expect(newState.cursorPosition).toBe(0)
  })

  it('repeated words: handles script with repeated words correctly', () => {
    const state = createMatcher(
      'the cat sat on the mat and the cat played with the ball'
    )
    // Match first occurrence
    const { newState: state2, result: result1 } = findMatch(
      state,
      'the cat sat on the mat'
    )
    expect(result1).not.toBeNull()
    expect(result1!.wordIndex).toBe(0)

    // Now match second occurrence of "the cat" (should be further ahead)
    const { result: result2 } = findMatch(state2, 'and the cat played with the')
    expect(result2).not.toBeNull()
    expect(result2!.wordIndex).toBeGreaterThanOrEqual(state2.cursorPosition)
  })

  it('multiple advances: sequential findMatch calls advance through the script', () => {
    const state = createMatcher(script)

    const { newState: state2, result: r1 } = findMatch(
      state,
      'the quick brown fox jumps over'
    )
    expect(r1).not.toBeNull()

    const { newState: state3, result: r2 } = findMatch(
      state2,
      'the lazy dog and then runs'
    )
    expect(r2).not.toBeNull()
    expect(state3.cursorPosition).toBeGreaterThan(state2.cursorPosition)

    const { newState: state4, result: r3 } = findMatch(
      state3,
      'across the field toward the sunset'
    )
    expect(r3).not.toBeNull()
    expect(state4.cursorPosition).toBeGreaterThan(state3.cursorPosition)
  })

  it('punctuation: script punctuation does not affect matching', () => {
    const state = createMatcher(
      "Hello, world! It's a beautiful day; isn't it? Yes—absolutely."
    )
    const { result } = findMatch(state, 'hello world its a beautiful day')
    expect(result).not.toBeNull()
    expect(result!.confidence).toBeGreaterThanOrEqual(0.6)
  })

  it('case insensitivity: matching is case-insensitive', () => {
    const state = createMatcher('The Quick Brown Fox Jumps Over')
    const { result } = findMatch(state, 'THE QUICK BROWN FOX JUMPS OVER')
    expect(result).not.toBeNull()
    expect(result!.confidence).toBe(1)
  })
})
