'use client'

/**
 * Boot sequence.
 *
 * It exists to set the premise — this is a system, not a page — and then
 * get out of the way. The whole thing runs in about two seconds, a skip
 * control is available from the first frame, and it is stored per session
 * so a reload never makes anyone sit through it twice.
 *
 * Under reduced motion the lines appear at once and the button is
 * immediately ready.
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { profile } from '@/data/profile'
import { sections } from '@/data/sections'
import { useSystem } from '@/lib/system'

const LINE_DELAY = 190
const LEADER = '.'.repeat(80)

/**
 * A modal <dialog> is centred and sized to its content by the UA stylesheet.
 * These override that to a true full-bleed surface — the boot screen is the
 * whole viewport, not a panel floating in it.
 */
const FULLSCREEN: CSSProperties = {
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100dvh',
  maxWidth: '100vw',
  maxHeight: '100dvh',
  margin: 0,
  padding: 0,
}

interface Line {
  label: string
  status: string
}

const LINES: Line[] = sections.map((s) => ({ label: s.bootLabel, status: 'OK' }))

export function BootScreen() {
  const { enter, reducedMotion } = useSystem()
  const [revealed, setRevealed] = useState(0)
  const [ready, setReady] = useState(false)
  const enterButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  const total = LINES.length

  // Reveal the lines one at a time.
  useEffect(() => {
    if (reducedMotion) {
      setRevealed(total)
      setReady(true)
      return
    }

    let cancelled = false
    let timer: number

    const step = (i: number) => {
      if (cancelled) return
      if (i > total) {
        setReady(true)
        return
      }
      setRevealed(i)
      timer = window.setTimeout(() => step(i + 1), LINE_DELAY)
    }

    timer = window.setTimeout(() => step(1), 260)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [total, reducedMotion])

  /**
   * Opened as a modal dialog rather than a styled <div> overlay.
   *
   * aria-modal on a plain element tells assistive tech the rest of the
   * page is hidden, but does nothing to enforce it: the content behind
   * stays focusable and a keyboard user tabs straight into a page they
   * have not entered yet. showModal() makes the rest of the document
   * genuinely inert, and the browser handles it.
   */
  useEffect(() => {
    const el = dialog.current
    if (el && !el.open) el.showModal()
  }, [])

  // Escape is a reasonable way to say "get on with it", so it enters the
  // system rather than dismissing the page into nothing.
  useEffect(() => {
    const el = dialog.current
    if (!el) return
    const onClose = () => enter()
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
  }, [enter])

  // Move focus onto the entry control the moment it is usable, so the
  // keyboard path is the same as the mouse one.
  useEffect(() => {
    if (ready) enterButton.current?.focus()
  }, [ready])

  const skip = useCallback(() => {
    setRevealed(total)
    setReady(true)
  }, [total])

  // Enter or Space enters the system; anything else skips ahead to the
  // finished state rather than doing nothing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (ready) {
          e.preventDefault()
          enter()
        }
        return
      }
      if (e.key === 'Escape' || e.key === 'Tab') return
      if (!ready) skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ready, enter, skip])

  return (
    <dialog
      ref={dialog}
      aria-label="FIKRI.OS system initialisation"
      className="flex h-full max-h-none w-full max-w-none flex-col justify-center border-0 bg-[var(--color-void)] px-6 text-[var(--color-ink)] sm:px-10"
      style={FULLSCREEN}
    >
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="u-display mb-1 leading-none">
          FIKRI<span className="text-[var(--color-accent)]">.OS</span>
        </h1>
        <p className="u-mono mb-10 text-[var(--color-faint)]">
          {profile.name} — {profile.title}
        </p>

        <div
          className="font-[family-name:var(--font-mono)] text-[0.8125rem] leading-[2]"
          // The whole log is announced once, when it finishes, rather than
          // read line by line as it types.
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="mb-3 text-[var(--color-ink-soft)]">Initializing personal system…</p>

          <ul className="list-none">
            {LINES.map((line, i) => {
              const shown = i < revealed
              return (
                <li
                  key={line.label}
                  className="flex items-baseline transition-opacity duration-200"
                  style={{ opacity: shown ? 1 : 0 }}
                >
                  <span className="text-[var(--color-muted)]">{line.label}</span>
                  {/* A generous run of dots clipped by the flex box, so
                      the leader reaches the status column at any width
                      rather than stopping short of it. */}
                  <span
                    className="mx-1.5 flex-1 overflow-hidden whitespace-nowrap text-[var(--color-faint)]"
                    aria-hidden="true"
                  >
                    {LEADER}
                  </span>
                  <span className="text-[var(--color-accent-soft)]">{line.status}</span>
                </li>
              )
            })}
          </ul>

          <p className="mt-5 text-[var(--color-ink)]">
            {ready ? (
              'SYSTEM READY'
            ) : (
              <span className="text-[var(--color-faint)]">
                <span className="u-caret">▌</span>
              </span>
            )}
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            ref={enterButton}
            type="button"
            onClick={enter}
            disabled={!ready}
            className="group relative border border-[var(--color-line-strong)] px-7 py-3.5 transition-colors duration-300 hover:border-[var(--color-accent)] disabled:cursor-default disabled:opacity-35"
          >
            <span className="u-mono text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent-soft)]">
              [ Enter FIKRI.OS ]
            </span>
          </button>

          {!ready && (
            <button
              type="button"
              onClick={skip}
              className="u-mono text-[var(--color-faint)] underline-offset-4 transition-colors hover:text-[var(--color-ink-soft)] hover:underline"
            >
              Skip
            </button>
          )}
        </div>

        {/* Someone using a screen reader gets the summary immediately —
            they should not have to wait out a decorative animation. */}
        <p className="u-sr-only">
          {profile.summaryShort} Select Enter FIKRI.OS to continue to the full content.
        </p>
      </div>
    </dialog>
  )
}
