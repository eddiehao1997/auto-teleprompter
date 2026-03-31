import type { Script } from '../types'

/**
 * Convert a plain-text string into a Script with a single section and no speakers.
 */
export function plainTextToScript(text: string): Script {
  return {
    id: crypto.randomUUID(),
    title: '',
    sections: [
      {
        id: crypto.randomUUID(),
        speakerId: null,
        content: text,
        order: 0,
      },
    ],
    speakers: [],
  }
}

/**
 * Concatenate all section contents (sorted by order) into a plain-text string.
 */
export function scriptToPlainText(script: Script): string {
  return script.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => s.content)
    .join('\n')
}
