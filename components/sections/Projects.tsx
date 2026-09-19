'use client'

/**
 * Projects.
 *
 * Not a grid of cards — a list of entries, each bound to its own small 3D
 * world in the scene behind. Hover moves between them, selecting one
 * opens the full record.
 *
 * The note at the end is important: the public repositories are a sample,
 * because Fikri says himself that some of his work is under NDA. Saying
 * that is more honest than padding the list.
 */

import { projects, projectsNote } from '@/data/projects'
import { sections } from '@/data/sections'
import { Section } from '@/components/ui/Section'
import { getSelection, setSelection, useSelection } from '@/lib/store'

const section = sections[4]

export function Projects() {
  return (
    <Section section={section} height="tall">
      <p className="u-body mb-10 max-w-prose">
        Each entry drives one of the structures in the scene behind this column. The form of
        each structure follows what the project actually is — a graph project is drawn as a
        graph, a pipeline as a flow.
      </p>

      <ul className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
        {projects.map((project) => (
          <ProjectRow key={project.id} id={project.id} />
        ))}
      </ul>

      <p className="u-small mt-7 max-w-prose text-[var(--color-faint)]">{projectsNote}</p>
    </Section>
  )
}

function ProjectRow({ id }: { id: string }) {
  const project = projects.find((p) => p.id === id)!
  const hovered = useSelection('projectHover') === id
  const open = useSelection('projectOpen') === id
  const lit = hovered || open

  return (
    <li>
      <button
        type="button"
        onMouseEnter={() => setSelection({ projectHover: id })}
        onMouseLeave={() => {
          if (getSelection().projectHover === id) setSelection({ projectHover: null })
        }}
        onFocus={() => setSelection({ projectHover: id })}
        onBlur={() => {
          if (getSelection().projectHover === id) setSelection({ projectHover: null })
        }}
        onClick={() => setSelection({ projectOpen: id })}
        className="group flex w-full items-start gap-5 py-5 text-left transition-all duration-300"
        style={{ paddingLeft: lit ? '0.75rem' : '0' }}
      >
        <span
          className="u-mono shrink-0 pt-1 transition-colors duration-300"
          style={{ color: lit ? 'var(--color-accent)' : 'var(--color-faint)' }}
        >
          {project.index}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className="u-h3 transition-colors duration-300"
              style={{ color: lit ? 'var(--color-ink)' : 'var(--color-ink-soft)' }}
            >
              {project.title}
            </span>
            {project.featured && (
              <span className="u-mono text-[0.5rem] text-[var(--color-accent)]">
                Featured
              </span>
            )}
          </span>

          <span className="u-small mt-2 block">{project.tagline}</span>

          <span className="u-mono mt-3 block text-[0.5rem] text-[var(--color-faint)]">
            {project.year} · {project.technology.slice(0, 3).join(' · ')}
          </span>
        </span>

        <span
          aria-hidden="true"
          className="u-mono shrink-0 self-center transition-all duration-300"
          style={{
            color: lit ? 'var(--color-accent)' : 'var(--color-faint)',
            transform: lit ? 'translateX(4px)' : 'none',
          }}
        >
          →
        </span>

        <span className="u-sr-only">View details for {project.title}</span>
      </button>
    </li>
  )
}
