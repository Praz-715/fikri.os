'use client'

/**
 * Section shell.
 *
 * Every section is a real <section> with a real <h2>, and the heading is
 * the focus target the navigation moves to — so a keyboard user lands on
 * the content, not next to it.
 *
 * Content sits in a column on one side; the other side is left open for
 * the 3D behind it. On narrow screens the column becomes full width and a
 * scrim keeps the text legible over whatever the scene is doing.
 */

import type { ReactNode } from 'react'
import type { SectionDef } from '@/data/sections'
import { useReveal } from '@/lib/hooks'

interface Props {
  section: SectionDef
  children: ReactNode
  /** Which side the content column sits on at desktop width. */
  align?: 'left' | 'right' | 'center'
  /** Taller sections give scroll-driven 3D more room to play out. */
  height?: 'screen' | 'tall'
  /** Visually hides the heading where the section's own display type
      already states it — it stays in the accessibility tree. */
  hideHeading?: boolean
}

export function Section({
  section,
  children,
  align = 'left',
  height = 'screen',
  hideHeading = false,
}: Props) {
  const { ref, shown } = useReveal<HTMLDivElement>()

  const justify =
    align === 'center' ? 'justify-center' : align === 'right' ? 'lg:justify-end' : 'lg:justify-start'

  return (
    <section
      id={`section-${section.id}`}
      aria-labelledby={`heading-${section.id}`}
      className={[
        'relative flex w-full items-center px-6 sm:px-10 lg:pr-16 lg:pl-56 xl:pl-60',
        height === 'tall' ? 'min-h-[180svh] py-28' : 'min-h-svh py-28',
        justify,
      ].join(' ')}
    >
      <div
        ref={ref}
        data-reveal={shown ? 'true' : 'false'}
        className={[
          'relative w-full',
          // Centred below lg. Between 768 and 1024 the scene sits directly
          // behind the content rather than beside it (no view offset at
          // that width), so a left-hugging column left a dead gutter on
          // the right and read as a broken desktop layout rather than a
          // deliberate one.
          'mx-auto lg:mx-0',
          align === 'center' ? 'max-w-3xl text-center' : 'max-w-xl xl:max-w-2xl',
        ].join(' ')}
      >
        {/* Legibility scrim. Sits behind the column only, so the 3D stays
            fully visible everywhere else. */}
        <div
          aria-hidden="true"
          className="u-scrim pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10 sm:-inset-x-12"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)',
          }}
        />

        <div className="mb-6 flex items-baseline gap-3">
          <span className="u-mono text-[var(--color-accent)]">{section.index}</span>
          <span className="u-label">{section.kicker}</span>
        </div>

        <h2
          id={`heading-${section.id}`}
          data-section-heading
          tabIndex={-1}
          className={hideHeading ? 'u-sr-only' : 'u-h2 mb-8'}
        >
          {section.label}
        </h2>

        {children}
      </div>
    </section>
  )
}

/** Small labelled value, used across several sections. */
export function Fact({
  label,
  value,
  href,
}: {
  label: string
  value: ReactNode
  href?: string
}) {
  return (
    <div className="border-t border-[var(--color-line)] pt-2.5">
      <dt className="u-label mb-1.5">{label}</dt>
      {/* A DOI is one unbroken token wider than a phone column, and the
          default wrapping rules would rather overflow than break it. */}
      <dd className="text-[0.875rem] leading-snug text-[var(--color-ink-soft)] [overflow-wrap:anywhere]">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-[var(--color-line-strong)] underline-offset-4 transition-colors hover:text-[var(--color-accent-soft)] hover:decoration-[var(--color-accent)]"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

/** Inline chip for verified specifics. Never used for anything invented. */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="u-mono inline-block rounded-full border border-[var(--color-line)] px-2.5 py-1 text-[0.5625rem] text-[var(--color-muted)]">
      {children}
    </span>
  )
}
