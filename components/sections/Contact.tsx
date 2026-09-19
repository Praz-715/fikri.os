'use client'

/**
 * Contact.
 *
 * The scene converges to a point behind this section; the content closes
 * the sequence by restating the name and giving the ways to reach him.
 *
 * Every link is one Fikri published himself. There are no contact forms,
 * no invented phone numbers, no "available for hire" claims nobody
 * authorised.
 */

import { profile } from '@/data/profile'
import { sections } from '@/data/sections'
import { useReveal } from '@/lib/hooks'

const section = sections[5]

export function Contact() {
  const { ref, shown } = useReveal<HTMLDivElement>()
  const primary = profile.links.filter((l) => l.primary)
  const secondary = profile.links.filter((l) => !l.primary)

  return (
    <section
      id={`section-${section.id}`}
      aria-labelledby={`heading-${section.id}`}
      className="relative flex min-h-svh w-full items-center justify-center px-6 py-32 text-center sm:px-10"
    >
      <div
        ref={ref}
        data-reveal={shown ? 'true' : 'false'}
        className="relative w-full max-w-2xl"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-10 -inset-y-16 -z-10"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 50%, rgba(7,8,10,0.94) 0%, rgba(7,8,10,0.6) 55%, rgba(7,8,10,0) 100%)',
          }}
        />

        <div className="mb-8 flex items-baseline justify-center gap-3">
          <span className="u-mono text-[var(--color-accent)]">{section.index}</span>
          <span className="u-label">{section.kicker}</span>
        </div>

        <h2 id={`heading-${section.id}`} data-section-heading tabIndex={-1} className="u-display">
          {profile.nameLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>

        <p className="u-mono mt-9 text-[var(--color-ink-soft)]">Let&rsquo;s connect</p>
        <p className="u-small mx-auto mt-3 max-w-md">
          {profile.title} · {profile.location}
        </p>

        <ul className="mt-11 flex flex-wrap justify-center gap-3">
          {primary.map((link) => (
            <li key={link.id}>
              <a
                href={link.href}
                target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                rel="noreferrer noopener"
                className="group block border border-[var(--color-line-strong)] px-7 py-4 transition-colors duration-300 hover:border-[var(--color-accent)]"
              >
                <span className="u-mono block text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent-soft)]">
                  {link.label}
                </span>
                <span className="u-label mt-1.5 block normal-case tracking-normal">
                  {link.handle}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {secondary.map((link) => (
            <li key={link.id}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                className="u-mono text-[var(--color-muted)] underline-offset-4 transition-colors hover:text-[var(--color-ink)] hover:underline"
              >
                {link.label} ↗
              </a>
            </li>
          ))}
        </ul>

        {/* Provenance. The whole site is built on public sources, and
            saying which ones is part of the point. */}
        <footer className="mt-20 border-t border-[var(--color-line)] pt-7">
          <p className="u-label mb-3">Sources</p>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1.5">
            {Object.entries(profile.sources)
              .filter(([, s]) => s.href)
              .map(([key, s]) => (
                <li key={key}>
                  <a
                    href={s.href!}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="u-small text-[var(--color-faint)] underline-offset-4 transition-colors hover:text-[var(--color-muted)] hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
          </ul>
          <p className="u-label mt-7">
            FIKRI.OS — built from publicly verifiable information
          </p>
        </footer>
      </div>
    </section>
  )
}
