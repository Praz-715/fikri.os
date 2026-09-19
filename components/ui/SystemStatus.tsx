'use client'

/**
 * System status.
 *
 * The one piece of chrome that keeps the operating-system premise alive
 * between sections. It reports something true — which module the camera
 * is in, and the quality tier the device actually got — rather than
 * decorating the corner with fake telemetry.
 *
 * Hidden entirely below `lg`, where the screen is needed for content.
 */

import { sections } from '@/data/sections'
import { useSystem } from '@/lib/system'

const TIER_LABEL: Record<string, string> = {
  high: 'FULL',
  mid: 'REDUCED',
  low: 'LIGHT',
}

export function SystemStatus() {
  const { activeSection, budget, reducedMotion, webgl } = useSystem()
  const current = sections.find((s) => s.id === activeSection)

  return (
    <aside
      aria-label="System status"
      className="fixed right-6 bottom-6 z-40 hidden w-44 lg:block"
    >
      <div className="u-panel px-3.5 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="u-mono text-[var(--color-ink)]">FIKRI.OS</span>
          <span
            aria-hidden="true"
            className="u-live-dot block h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--color-accent)' }}
          />
        </div>

        <dl className="space-y-1.5">
          <Row label="Module" value={current?.label ?? '—'} accent />
          <Row
            label="Render"
            value={webgl ? TIER_LABEL[budget.tier] : 'TEXT ONLY'}
          />
          <Row label="Motion" value={reducedMotion ? 'REDUCED' : 'FULL'} />
        </dl>
      </div>
    </aside>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="u-label">{label}</dt>
      <dd
        className="u-mono text-[0.625rem] truncate"
        style={{ color: accent ? 'var(--color-accent-soft)' : 'var(--color-muted)' }}
      >
        {value}
      </dd>
    </div>
  )
}
