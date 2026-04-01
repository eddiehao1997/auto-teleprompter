import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { ScriptSection, Speaker } from '../types'
import './ScriptRenderer.css'

interface ScriptRendererProps {
  sections: ScriptSection[]
  speakers: Speaker[]
  fontSize: number
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  activeWordIndex?: number
}

function ScriptRenderer({ sections, speakers, fontSize, scrollContainerRef, activeWordIndex }: ScriptRendererProps) {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  const speakerMap = new Map(speakers.map((s) => [s.id, s]))

  const sorted = sections.slice().sort((a, b) => a.order - b.order)

  // Compute word boundaries per section for active word highlighting
  const sectionWordBounds = useMemo(() => {
    let runningCount = 0
    return sorted.map((section) => {
      const words = section.content.split(/\s+/).filter((w) => w.length > 0)
      const start = runningCount
      runningCount += words.length
      return { start, end: runningCount, words }
    })
  }, [sorted])

  // Track which section is near the guide line (center of viewport)
  const updateActiveSection = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const guideLine = container.getBoundingClientRect().top + container.clientHeight / 2

    let closestIdx = 0
    let closestDist = Infinity

    sectionRefs.current.forEach((el, i) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const center = rect.top + rect.height / 2
      const dist = Math.abs(center - guideLine)
      if (dist < closestDist) {
        closestDist = dist
        closestIdx = i
      }
    })

    setActiveSectionIndex(closestIdx)
  }, [scrollContainerRef])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', updateActiveSection, { passive: true })
    updateActiveSection()
    return () => container.removeEventListener('scroll', updateActiveSection)
  }, [scrollContainerRef, updateActiveSection])

  // If there are no speakers, render plain text
  const hasSpeakers = speakers.length > 0

  if (!hasSpeakers) {
    const plainText = sorted.map((s) => s.content).join('\n')
    return (
      <div
        className="script-text"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
      >
        {plainText}
      </div>
    )
  }

  return (
    <div className="script-renderer" style={{ fontSize: `${fontSize}px` }}>
      {sorted.map((section, idx) => {
        const speaker = section.speakerId ? speakerMap.get(section.speakerId) : null
        const color = speaker?.color ?? '#ffffff'
        const isActive = idx === activeSectionIndex
        const showLabel =
          speaker && (idx === 0 || sorted[idx - 1]?.speakerId !== section.speakerId)

        return (
          <div
            key={section.id}
            ref={(el) => { sectionRefs.current[idx] = el }}
            className={`script-section ${isActive ? '' : 'dimmed'}`}
          >
            {showLabel && (
              <div className="section-speaker-label" style={{ color }}>
                {speaker.name}
              </div>
            )}
            <div className="section-content" style={{ color }}>
              {(() => {
                const bounds = sectionWordBounds[idx]
                if (activeWordIndex !== undefined && bounds &&
                    activeWordIndex >= bounds.start && activeWordIndex < bounds.end) {
                  return bounds.words.map((word, wi) => {
                    const globalIdx = bounds.start + wi
                    return (
                      <span key={wi}>
                        {wi > 0 ? ' ' : ''}
                        {globalIdx === activeWordIndex ? (
                          <span className="word-active">{word}</span>
                        ) : (
                          word
                        )}
                      </span>
                    )
                  })
                }
                return section.content
              })()}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ScriptRenderer
