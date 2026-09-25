'use client'

/**
 * Journey.
 *
 * The orbit behind this column is the picture; these cards are the
 * content. Hovering a card lights its node in 3D and hovering the node
 * lights the card — the same state, read from the selection store on both
 * sides.
 *
 * Selecting a card sends the camera to that node. Selecting it again
 * returns to the overview, so the 3D never traps anyone somewhere they
 * cannot get back from.
 */

import { journey } from '@/data/experience'
import { sections } from '@/data/sections'
import { Chip, Section } from '@/components/ui/Section'
import { getSelection, setSelection, useSelection } from '@/lib/store'

const section = sections[1]

export function Journey() {
  const focus = useSelection('journeyFocus')

  return (
    <Section section={section} height="tall">
      <p className="u-body mb-3 max-w-prose">
        {journey.length} milestones, earliest first, each one traceable to a public record.
        Select any of them to fly the camera to its node on the arc.
      </p>
      <p className="u-small mb-10">
        Dates appear where a source states them. Where none does, this says so rather than
        guessing.
      </p>

      <ol className="space-y-3">
        {journey.map((m, i) => (
          <MilestoneCard key={m.id} id={m.id} index={i} />
        ))}
      </ol>

      {focus && (
        <button
          type="button"
          onClick={() => setSelection({ journeyFocus: null })}
          className="u-mono mt-6 text-[var(--color-muted)] underline-offset-4 transition-colors hover:text-[var(--color-ink)] hover:underline"
        >
          ← Back to the full orbit
        </button>
      )}
    </Section>
  )
}

function MilestoneCard({ id, index }: { id: string; index: number }) {
  const milestone = journey[index]
  const hovered = useSelection('journeyHover') === id
  const focused = useSelection('journeyFocus') === id
  const lit = hovered || focused

  return (
    <li>
      <button
        type="button"
        aria-pressed={focused}
        onMouseEnter={() => setSelection({ journeyHover: id })}
        onMouseLeave={() => {
          if (getSelection().journeyHover === id) setSelection({ journeyHover: null })
        }}
        // Keyboard focus drives the same highlight as the mouse, so the
        // 3D responds to tabbing through the list too.
        onFocus={() => setSelection({ journeyHover: id })}
        onBlur={() => {
          if (getSelection().journeyHover === id) setSelection({ journeyHover: null })
        }}
        onClick={() => setSelection({ journeyFocus: focused ? null : id })}
        className="u-panel block w-full px-5 py-4 text-left transition-all duration-300"
        style={{
          borderColor: lit ? 'var(--color-accent)' : 'var(--color-line)',
          transform: lit ? 'translateX(6px)' : 'none',
        }}
      >
        <div className="flex items-baseline justify-between gap-4">
          <span
            className="u-mono transition-colors"
            style={{ color: lit ? 'var(--color-accent-soft)' : 'var(--color-faint)' }}
          >
            {milestone.code}
          </span>
          <span className="u-mono text-[0.5625rem] text-[var(--color-faint)]">
            {milestone.period ?? 'Date not published'}
          </span>
        </div>

        <h3 className="u-h3 mt-2.5 text-[var(--color-ink)]">{milestone.role}</h3>
        <p className="u-mono mt-1.5 text-[0.5625rem] text-[var(--color-ink-soft)]">
          {milestone.organization}
        </p>
        <p className="u-mono mt-1 text-[0.5625rem] text-[var(--color-muted)]">
          {[milestone.location, milestone.engagement].filter(Boolean).join(' · ')}
        </p>

        <p className="u-small mt-3 text-[var(--color-ink-soft)]">{milestone.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {milestone.highlights.map((h) => (
            <Chip key={h}>{h}</Chip>
          ))}
        </div>

        {milestone.current && (
          <p className="u-mono mt-3.5 text-[0.5625rem] text-[var(--color-accent)]">
            ● Current
          </p>
        )}
      </button>

      {milestone.href && (
        <a
          href={milestone.href}
          target="_blank"
          rel="noreferrer noopener"
          className="u-mono mt-2 ml-5 inline-block text-[0.5625rem] text-[var(--color-faint)] underline-offset-4 transition-colors hover:text-[var(--color-accent-soft)] hover:underline"
        >
          Source ↗
        </a>
      )}
    </li>
  )
}
