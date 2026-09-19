'use client'

/**
 * Research.
 *
 * The strongest verifiable thing in the whole profile, so it gets the
 * most space and the most careful presentation: full publication
 * metadata, the pipeline the 3D is animating, the reported figures, and
 * a plain statement of what those figures do and do not mean.
 */

import { research } from '@/data/research'
import { sections } from '@/data/sections'
import { Chip, Fact, Section } from '@/components/ui/Section'

const section = sections[2]

const DIST_COLOR: Record<string, string> = {
  positive: 'var(--color-positive)',
  neutral: 'var(--color-neutral)',
  negative: 'var(--color-negative)',
}

export function Research() {
  return (
    <Section section={section} height="tall">
      <p className="u-mono mb-4 text-[var(--color-accent-soft)]">
        {research.venueShort} · {research.publisher}
      </p>

      <h3 className="u-h3 mb-5 text-balance text-[var(--color-ink)]">{research.title}</h3>

      <p className="u-body mb-4 max-w-prose">{research.abstract}</p>
      <p className="u-small mb-9 max-w-prose">{research.context}</p>

      {/* Authorship, stated exactly as registered. Fikri is third of five
          and the page says so rather than implying sole authorship. */}
      <div className="mb-9">
        <p className="u-label mb-2.5">Authors</p>
        <ol className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {research.authors.map((a, i) => (
            <li key={a.name} className="text-[0.875rem]">
              <span style={{ color: a.self ? 'var(--color-accent-soft)' : 'var(--color-muted)' }}>
                {a.name}
              </span>
              {i < research.authors.length - 1 && (
                <span className="text-[var(--color-faint)]">,</span>
              )}
            </li>
          ))}
        </ol>
        <p className="u-small mt-2 text-[var(--color-faint)]">{research.affiliation}</p>
      </div>

      <dl className="mb-10 grid grid-cols-2 gap-x-6 gap-y-5">
        <Fact label="Venue" value={research.venue} />
        <Fact label="Held" value={`${research.date} · ${research.venueLocation}`} />
        <Fact label="Publisher" value={`${research.publisher} · pp. ${research.pages}`} />
        <Fact label="DOI" value={research.doi} href={research.doiUrl} />
      </dl>

      {/* The pipeline the 3D scene animates, written out so the diagram is
          never the only way to get the information. */}
      <div className="mb-10">
        <p className="u-label mb-3.5">Method</p>
        <ol className="space-y-2.5">
          {research.pipeline.map((stage, i) => (
            <li
              key={stage.id}
              className="flex gap-4 border-l border-[var(--color-line)] pl-4"
            >
              <span className="u-mono shrink-0 pt-0.5 text-[var(--color-faint)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="u-mono text-[var(--color-accent-soft)]">{stage.label}</p>
                <p className="u-small mt-1">{stage.detail}</p>
                {stage.steps && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {stage.steps.map((s) => (
                      <Chip key={s}>{s}</Chip>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Distribution. The bar is proportional to the real counts — the
          only honest way to draw a chart of three near-equal classes. */}
      <div className="mb-9">
        <div className="mb-3.5 flex items-baseline justify-between">
          <p className="u-label">Classified sentiment</p>
          <p className="u-mono text-[var(--color-muted)]">
            {research.corpus.value} tweets
          </p>
        </div>

        <div
          className="flex h-2 w-full overflow-hidden rounded-full"
          role="img"
          aria-label={research.distribution
            .map((d) => `${d.label.toLowerCase()} ${d.count} tweets, ${d.percent} percent`)
            .join('; ')}
        >
          {research.distribution.map((d) => (
            <span
              key={d.id}
              style={{ width: `${d.percent}%`, background: DIST_COLOR[d.id] }}
              className="block h-full"
            />
          ))}
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-4">
          {research.distribution.map((d) => (
            <div key={d.id}>
              <dt className="u-label mb-1.5 flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="block h-1.5 w-1.5 rounded-full"
                  style={{ background: DIST_COLOR[d.id] }}
                />
                {d.label}
              </dt>
              <dd className="font-[family-name:var(--font-mono)] text-[1.375rem] text-[var(--color-ink)]">
                {d.count}
                <span className="ml-1.5 text-[0.75rem] text-[var(--color-faint)]">
                  {d.percent}%
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mb-6">
        <p className="u-label mb-3.5">Reported performance</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {research.metrics.map((m) => (
            <div key={m.label}>
              <dt className="u-label mb-1.5">{m.label}</dt>
              <dd className="font-[family-name:var(--font-mono)] text-[1.25rem] text-[var(--color-accent-soft)]">
                {m.value}
              </dd>
              {m.note && <p className="u-label mt-1">{m.note}</p>}
            </div>
          ))}
        </dl>
      </div>

      {/* Context for the numbers. A 98.75% accuracy figure quoted bare
          would be misleading; quoted with its dataset it is just a fact. */}
      <p className="u-small max-w-prose border-l-2 border-[var(--color-line-strong)] pl-4 text-[var(--color-faint)]">
        {research.caveat}
      </p>

      <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3">
        <a
          href={research.doiUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="group border border-[var(--color-line-strong)] px-6 py-3 transition-colors duration-300 hover:border-[var(--color-accent)]"
        >
          <span className="u-mono text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent-soft)]">
            Read the paper ↗
          </span>
        </a>
        <a
          href={research.ieeeUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="u-mono self-center text-[var(--color-muted)] underline-offset-4 transition-colors hover:text-[var(--color-ink)] hover:underline"
        >
          IEEE Xplore
        </a>
      </div>
    </Section>
  )
}
