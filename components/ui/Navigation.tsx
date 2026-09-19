'use client'

/**
 * Navigation.
 *
 * A numbered rail on the left at desktop width, a compact bar at the
 * bottom on small screens. It is a real <nav> of real links, so it works
 * without JavaScript, reads correctly to assistive tech, and supports the
 * browser's own find-and-focus behaviour.
 *
 * The active item is marked with aria-current, not just a colour.
 */

import { sections } from '@/data/sections'
import { useSystem } from '@/lib/system'

export function Navigation() {
  const { activeSection, goTo } = useSystem()

  return (
    <>
      {/* Desktop: vertical rail */}
      <nav
        aria-label="Sections"
        className="fixed top-1/2 left-6 z-50 hidden -translate-y-1/2 lg:block"
      >
        <ul className="flex flex-col gap-1">
          {sections.map((s) => {
            const active = s.id === activeSection
            return (
              <li key={s.id}>
                <a
                  href={`#section-${s.id}`}
                  aria-current={active ? 'true' : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    goTo(s.id)
                  }}
                  className="group flex items-center gap-3 py-2 pr-4"
                >
                  <span
                    aria-hidden="true"
                    className="h-px transition-all duration-500"
                    style={{
                      width: active ? '2rem' : '0.75rem',
                      background: active ? 'var(--color-accent)' : 'var(--color-line-strong)',
                    }}
                  />
                  <span className="flex items-baseline gap-2">
                    <span
                      className="u-mono transition-colors duration-300"
                      style={{ color: active ? 'var(--color-accent)' : 'var(--color-faint)' }}
                    >
                      {s.index}
                    </span>
                    <span
                      className="u-mono transition-colors duration-300 group-hover:text-[var(--color-ink)]"
                      style={{
                        color: active ? 'var(--color-ink)' : 'var(--color-muted)',
                      }}
                    >
                      {s.label}
                    </span>
                  </span>
                </a>
              </li>
            )
          })}
        </ul>

        <p className="u-label mt-6 max-w-[11rem] leading-relaxed">
          ↑ ↓ or 1–6 to navigate
        </p>
      </nav>

      {/* Mobile / tablet: a compact bar.

          Six full labels will not fit a phone without either wrapping or
          becoming a horizontal scroller people have to discover. Instead
          every section shows as its number, and only the current one
          expands to its name — so the bar always fits, and always says
          where you are. */}
      <nav
        aria-label="Sections"
        className="u-panel fixed inset-x-0 bottom-0 z-50 lg:hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.25rem)' }}
      >
        <ul className="flex items-center justify-center gap-0.5 px-2 pt-2.5 pb-1.5">
          {sections.map((s) => {
            const active = s.id === activeSection
            return (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#section-${s.id}`}
                  aria-current={active ? 'true' : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    goTo(s.id)
                  }}
                  className="flex min-h-11 items-center gap-1.5 rounded-full px-2.5 transition-colors duration-300"
                  style={{
                    background: active ? 'rgba(110,123,255,0.12)' : 'transparent',
                  }}
                >
                  <span
                    className="u-mono transition-colors duration-300"
                    style={{ color: active ? 'var(--color-accent)' : 'var(--color-faint)' }}
                  >
                    {s.index}
                  </span>
                  {/* Hidden visually when inactive, but always present for
                      screen readers — the link must still say where it goes. */}
                  <span
                    className={
                      active
                        ? 'u-mono whitespace-nowrap text-[var(--color-ink)]'
                        : 'u-sr-only'
                    }
                  >
                    {s.label}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
