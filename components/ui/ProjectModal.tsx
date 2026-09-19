'use client'

/**
 * Project detail.
 *
 * A native <dialog>, so the browser handles the top layer, the backdrop,
 * Escape, and — with showModal() — the focus trap and inert background.
 * Reimplementing any of that by hand is how these end up unusable with a
 * keyboard.
 */

import { useEffect, useRef } from 'react'
import { projects } from '@/data/projects'
import { Chip } from './Section'
import { setSelection, useSelection } from '@/lib/store'

export function ProjectModal() {
  const openId = useSelection('projectOpen')
  const dialog = useRef<HTMLDialogElement>(null)
  const project = projects.find((p) => p.id === openId) ?? null

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (project && !el.open) el.showModal()
    if (!project && el.open) el.close()
  }, [project])

  // Escape and the backdrop both close through the same path, so the
  // store never disagrees with what is on screen.
  useEffect(() => {
    const el = dialog.current
    if (!el) return
    const onClose = () => setSelection({ projectOpen: null })
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
  }, [])

  return (
    <dialog
      ref={dialog}
      data-modal-open={project ? 'true' : 'false'}
      aria-labelledby="project-modal-title"
      onClick={(e) => {
        // A click that lands on the dialog element itself is a click on
        // the backdrop — the content is inside a child.
        if (e.target === dialog.current) dialog.current?.close()
      }}
      className="m-auto w-[min(42rem,calc(100vw-2rem))] border border-[var(--color-line-strong)] bg-[var(--color-ground)] p-0 text-[var(--color-ink)] backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      {project && (
        <article className="max-h-[85svh] overflow-y-auto p-7 sm:p-10">
          <div className="mb-6 flex items-start justify-between gap-6">
            <div>
              <p className="u-mono text-[var(--color-accent)]">
                Project {project.index}
                {project.featured ? ' · Featured' : ''}
              </p>
              <h2 id="project-modal-title" className="u-h3 mt-2.5 text-balance">
                {project.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="u-mono shrink-0 border border-[var(--color-line)] px-3 py-2 text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
            >
              Close
            </button>
          </div>

          <p className="u-body mb-8">{project.tagline}</p>

          <dl className="space-y-5">
            <Row label="Context" value={project.context} />
            <Row label="Role" value={project.role} />
            <Row label="Year" value={project.year} />
            {project.methodology && <Row label="Methodology" value={project.methodology} />}
            <Row label="Result" value={project.outcome} />
          </dl>

          <div className="mt-7">
            <p className="u-label mb-2.5">Technology</p>
            <div className="flex flex-wrap gap-1.5">
              {project.technology.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </div>

          <a
            href={project.href}
            target="_blank"
            rel="noreferrer noopener"
            className="group mt-9 inline-block border border-[var(--color-line-strong)] px-6 py-3 transition-colors duration-300 hover:border-[var(--color-accent)]"
          >
            <span className="u-mono transition-colors group-hover:text-[var(--color-accent-soft)]">
              {project.hrefLabel} ↗
            </span>
          </a>
        </article>
      )}
    </dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-[var(--color-line)] pt-3.5">
      <dt className="u-label mb-1.5">{label}</dt>
      <dd className="u-small text-[var(--color-ink-soft)]">{value}</dd>
    </div>
  )
}
