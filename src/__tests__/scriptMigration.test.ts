import { describe, it, expect } from 'vitest'
import { plainTextToScript, scriptToPlainText } from '../utils/scriptMigration'

describe('plainTextToScript', () => {
  it('creates a Script with one section containing the text', () => {
    const script = plainTextToScript('Hello, world!')
    const section = script.sections[0]

    expect(script.sections).toHaveLength(1)
    expect(section).toBeDefined()
    expect(section!.content).toBe('Hello, world!')
    expect(section!.order).toBe(0)
    expect(section!.speakerId).toBeNull()
  })

  it('creates a Script with empty speakers array', () => {
    const script = plainTextToScript('Some text')

    expect(script.speakers).toEqual([])
  })

  it('generates unique ids', () => {
    const script1 = plainTextToScript('Text 1')
    const script2 = plainTextToScript('Text 2')

    expect(script1.id).not.toBe(script2.id)
    expect(script1.sections[0]!.id).not.toBe(script2.sections[0]!.id)
  })

  it('handles empty string', () => {
    const script = plainTextToScript('')

    expect(script.sections).toHaveLength(1)
    expect(script.sections[0]!.content).toBe('')
  })
})

describe('scriptToPlainText', () => {
  it('returns the content of a single-section script', () => {
    const script = plainTextToScript('Hello, world!')
    const text = scriptToPlainText(script)

    expect(text).toBe('Hello, world!')
  })

  it('joins multiple sections sorted by order', () => {
    const script = plainTextToScript('')
    script.sections = [
      { id: '2', speakerId: null, content: 'Second', order: 1 },
      { id: '1', speakerId: null, content: 'First', order: 0 },
      { id: '3', speakerId: null, content: 'Third', order: 2 },
    ]

    const text = scriptToPlainText(script)
    expect(text).toBe('First\nSecond\nThird')
  })
})

describe('round-trip', () => {
  it('preserves content through text -> script -> text', () => {
    const original = 'Line one\nLine two\nLine three'
    const script = plainTextToScript(original)
    const result = scriptToPlainText(script)

    expect(result).toBe(original)
  })

  it('preserves empty string through round-trip', () => {
    const original = ''
    const script = plainTextToScript(original)
    const result = scriptToPlainText(script)

    expect(result).toBe(original)
  })
})
