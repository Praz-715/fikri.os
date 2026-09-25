'use client'

/**
 * Profile — the first ten seconds.
 *
 * Name, what he does, where, and what he is known for, all above the
 * fold. The particle figure is behind and to the right; this column is
 * deliberately the thing the eye lands on first.
 */

import { profile } from '@/data/profile'
import { sections } from '@/data/sections'
import { Fact } from '@/components/ui/Section'
import { useReveal } from '@/lib/hooks'
import { useSystem } from '@/lib/system'

const section = sections[0]

export function Profile() {
  const { ref, shown } = useReveal<HTMLDivElement>()
  const { goTo } = useSystem()

  return (
    <section
      id={`section-${section.id}`}
      aria-labelledby={`heading-${section.id}`}
      className="relative flex min-h-svh w-full items-center px-6 py-28 sm:px-10 lg:pr-16 lg:pl-56 xl:pl-60"
    >
      <div
        ref={ref}
        data-reveal={shown ? 'true' : 'false'}
        className="relative mx-auto w-full max-w-xl lg:mx-0 xl:max-w-2xl"
      >
        <div
          aria-hidden="true"
          className="u-scrim pointer-events-none absolute -inset-x-8 -inset-y-12 -z-10 sm:-inset-x-14"
        />

        <div className="mb-7 flex items-baseline gap-3">
          <span className="u-mono text-[var(--color-accent)]">{section.index}</span>
          <span className="u-label">{section.kicker}</span>
        </div>

        {/* The name carries the section heading, so there is no duplicate
            "PROFILE" title competing with it. */}
        <h2 id={`heading-${section.id}`} data-section-heading tabIndex={-1} className="u-display">
          {profile.nameLines.map((line, i) => (
            <span key={line} className="block">
              {line}
              {i === profile.nameLines.length - 1 && (
                <span className="text-[var(--color-accent)]">.</span>
              )}
            </span>
          ))}
        </h2>

        <p className="u-mono mt-7 text-[var(--color-accent-soft)]">{profile.title}</p>
        <p className="u-mono mt-1.5 text-[var(--color-faint)]">{profile.subtitle}</p>

        <p className="u-body mt-7 max-w-prose">{profile.summary}</p>

        <p className="mt-6 text-[0.9375rem] text-[var(--color-muted)] italic">
          “{profile.motto}”
        </p>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          {profile.facts.map((f) => (
            <Fact key={f.label} label={f.label} value={f.value} />
          ))}
        </dl>

        <div className="mt-10 border-t border-[var(--color-line)] pt-6">
          <p className="u-label mb-2">Education</p>
          {profile.education.map((e) => (
            <div key={e.institution}>
              <p className="text-[0.9375rem] text-[var(--color-ink-soft)]">{e.institution}</p>
              <p className="u-small mt-0.5">
                {e.department}
                {e.degree ? ` · ${e.degree}` : ''}
                {e.years ? ` · ${e.years}` : ''}
              </p>
              {/* Rather than invent a degree title or graduation year, the
                  page says plainly where the affiliation comes from. */}
              <p className="u-small mt-2 text-[var(--color-faint)]">
                Affiliation as registered with IEEE for the 2022 CITSM paper.
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={() => goTo('research')}
            className="group border border-[var(--color-line-strong)] px-6 py-3 transition-colors duration-300 hover:border-[var(--color-accent)]"
          >
            <span className="u-mono text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent-soft)]">
              See the research →
            </span>
          </button>
          <button
            type="button"
            onClick={() => goTo('contact')}
            className="u-mono text-[var(--color-muted)] underline-offset-4 transition-colors hover:text-[var(--color-ink)] hover:underline"
          >
            Contact
          </button>
        </div>
      </div>

      {/* Scroll cue — the whole experience is scroll-driven, so it needs
          to be obvious that there is more below. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-24 left-1/2 hidden -translate-x-1/2 lg:block"
      >
        <span className="u-label">Scroll</span>
      </div>
    </section>
  )
}
