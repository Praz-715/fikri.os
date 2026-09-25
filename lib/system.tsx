'use client'

/**
 * The FIKRI.OS system bus.
 *
 * One context carries the small amount of state that both the DOM and the
 * 3D world need: which section is live, whether the system has booted,
 * what the device can afford, and where the pointer is.
 *
 * The pointer deliberately lives in a ref rather than state — it changes
 * every mouse move, and re-rendering React sixty times a second to move a
 * camera would be the single most expensive thing on the page.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { budgetFor, degrade, detectTier, hasWebGL, type QualityBudget } from './quality'
import { sections, type SectionId } from '@/data/sections'

export interface Pointer {
  /** Normalised −1…1, origin at viewport centre. */
  x: number
  y: number
  /** Damped copy, used where raw pointer movement would look twitchy. */
  sx: number
  sy: number
  /** Whether a pointing device is actually present and has moved. */
  active: boolean
}

interface SystemState {
  booted: boolean
  enter: () => void
  activeSection: SectionId
  /** 0–1 progress through the active section, driven by scroll. */
  sectionProgress: number
  setActive: (id: SectionId, progress: number) => void
  goTo: (id: SectionId) => void
  budget: QualityBudget
  reducedMotion: boolean
  /**
   * True on touch-primary devices. Used to pick instruction copy: telling
   * someone to shift-scroll or hover is worse than saying nothing when
   * they have neither a shift key nor a cursor.
   */
  coarsePointer: boolean
  webgl: boolean
  pointer: RefObject<Pointer>
  /** Set when the scene reports sustained low frame rates. */
  reportSlowFrames: () => void
}

const SystemContext = createContext<SystemState | null>(null)

const STORAGE_KEY = 'fikri-os:booted'

export function SystemProvider({ children }: { children: ReactNode }) {
  const [booted, setBooted] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>('profile')
  const [sectionProgress, setSectionProgress] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  // false on the server and first paint; corrected on mount, so the
  // markup never disagrees with itself before hydration.
  const [coarsePointer, setCoarsePointer] = useState(false)
  const [webgl, setWebgl] = useState(true)
  // Start at 'mid' so server and first client render agree; corrected on mount.
  const [tier, setTier] = useState(() => budgetFor('mid').tier)

  const pointer = useRef<Pointer>({ x: 0, y: 0, sx: 0, sy: 0, active: false })
  const degraded = useRef(false)

  // Capability detection, client-only.
  useEffect(() => {
    setTier(detectTier())
    setWebgl(hasWebGL())

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyMotion = () => setReducedMotion(mq.matches)
    applyMotion()
    mq.addEventListener('change', applyMotion)

    const pointerMq = window.matchMedia('(pointer: coarse)')
    const applyPointer = () => setCoarsePointer(pointerMq.matches)
    applyPointer()
    pointerMq.addEventListener('change', applyPointer)

    let resizeTimer: number
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      // Only re-tier after the resize settles; dragging a window edge
      // should not thrash particle buffers.
      resizeTimer = window.setTimeout(() => {
        if (!degraded.current) setTier(detectTier())
      }, 400)
    }
    window.addEventListener('resize', onResize)

    return () => {
      mq.removeEventListener('change', applyMotion)
      pointerMq.removeEventListener('change', applyPointer)
      window.removeEventListener('resize', onResize)
      window.clearTimeout(resizeTimer)
    }
  }, [])

  // Someone who has already booted once this session shouldn't sit through
  // the sequence again on a soft reload.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setBooted(true)
    } catch {
      // Private mode or blocked storage — the boot screen simply shows.
    }
  }, [])

  // Pointer tracking outside React's render cycle.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const p = pointer.current
      p.x = (e.clientX / window.innerWidth) * 2 - 1
      p.y = -((e.clientY / window.innerHeight) * 2 - 1)
      p.active = e.pointerType !== 'touch'
    }
    const onLeave = () => {
      pointer.current.active = false
      pointer.current.x = 0
      pointer.current.y = 0
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  const enter = useCallback(() => {
    setBooted(true)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* non-fatal */
    }
  }, [])

  const setActive = useCallback((id: SectionId, progress: number) => {
    setActiveSection((prev) => (prev === id ? prev : id))
    setSectionProgress(progress)
  }, [])

  const goTo = useCallback(
    (id: SectionId) => {
      const el = document.getElementById(`section-${id}`)
      if (!el) return
      el.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      })
      // Move keyboard focus with the view, otherwise tabbing after a nav
      // click resumes from wherever the user was before.
      const heading = el.querySelector<HTMLElement>('[data-section-heading]')
      heading?.focus({ preventScroll: true })
    },
    [reducedMotion],
  )

  const reportSlowFrames = useCallback(() => {
    if (degraded.current) return
    degraded.current = true
    setTier((t) => degrade(t))
  }, [])

  const budget = useMemo(() => budgetFor(tier), [tier])

  const value = useMemo<SystemState>(
    () => ({
      booted,
      enter,
      activeSection,
      sectionProgress,
      setActive,
      goTo,
      budget,
      reducedMotion,
      coarsePointer,
      webgl,
      pointer,
      reportSlowFrames,
    }),
    [
      booted,
      enter,
      activeSection,
      sectionProgress,
      setActive,
      goTo,
      budget,
      reducedMotion,
      coarsePointer,
      webgl,
      reportSlowFrames,
    ],
  )

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>
}

export function useSystem() {
  const ctx = useContext(SystemContext)
  if (!ctx) throw new Error('useSystem must be used inside <SystemProvider>')
  return ctx
}

/** Index of the active section, handy for directional transitions. */
export function useSectionIndex() {
  const { activeSection } = useSystem()
  return sections.findIndex((s) => s.id === activeSection)
}
