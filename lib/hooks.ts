'use client'

import { useEffect, useRef, useState } from 'react'
import { sections, type SectionId } from '@/data/sections'
import { useSystem } from './system'

/**
 * Watches the scroll container and reports which section owns the viewport
 * plus how far through it we are.
 *
 * Uses a single rAF-throttled scroll listener rather than an
 * IntersectionObserver per section: we need continuous progress, not just
 * crossing events, and one listener is cheaper than six observers firing
 * at different thresholds.
 */
export function useScrollSections(enabled: boolean) {
  const { setActive } = useSystem()

  useEffect(() => {
    if (!enabled) return

    let frame = 0
    let mounted = true

    const measure = () => {
      frame = 0
      if (!mounted) return

      const mid = window.innerHeight * 0.4
      let bestId: SectionId = sections[0].id
      let bestProgress = 0

      for (const s of sections) {
        const el = document.getElementById(`section-${s.id}`)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top <= mid && rect.bottom > mid) {
          bestId = s.id
          const span = Math.max(1, rect.height)
          bestProgress = Math.min(1, Math.max(0, (mid - rect.top) / span))
          break
        }
        // Past the end of the document, hold the last section.
        if (rect.top > mid) break
        bestId = s.id
        bestProgress = 1
      }

      setActive(bestId, bestProgress)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      mounted = false
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [enabled, setActive])
}

/**
 * Reveals an element once it enters the viewport, by toggling a data
 * attribute that CSS animates. Keeping the animation in CSS means the
 * main thread does no work per frame.
 */
export function useReveal<T extends HTMLElement>(options?: { threshold?: number }) {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || shown) return

    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        }
      },
      { threshold: options?.threshold ?? 0.18, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [shown, options?.threshold])

  return { ref, shown }
}

/**
 * Keyboard navigation for the whole system: arrows and j/k move between
 * sections, digits jump straight to one.
 *
 * Skipped whenever focus is inside a field or a dialog is open, so it
 * never steals a keystroke someone meant for something else.
 */
export function useKeyboardNav(enabled: boolean) {
  const { goTo, activeSection } = useSystem()

  useEffect(() => {
    if (!enabled) return

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return
      }
      if (document.querySelector('[data-modal-open="true"]')) return

      const current = sections.findIndex((s) => s.id === activeSection)

      if (e.key >= '1' && e.key <= String(Math.min(9, sections.length))) {
        const idx = Number(e.key) - 1
        if (sections[idx]) {
          e.preventDefault()
          goTo(sections[idx].id)
        }
        return
      }

      const forward = ['ArrowDown', 'ArrowRight', 'j'].includes(e.key)
      const back = ['ArrowUp', 'ArrowLeft', 'k'].includes(e.key)
      if (!forward && !back) return

      const next = current + (forward ? 1 : -1)
      if (next < 0 || next >= sections.length) return
      e.preventDefault()
      goTo(sections[next].id)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, goTo, activeSection])
}

/**
 * True while the document is hidden. Drives the render loop's pause —
 * a backgrounded tab should cost nothing.
 */
export function useDocumentVisible() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible')
    onChange()
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return visible
}
