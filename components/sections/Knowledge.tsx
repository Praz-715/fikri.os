'use client'

/**
 * Knowledge.
 *
 * The 3D graph is the headline, but everything in it is also here as a
 * list — grouped by cluster, selectable, with the same highlight state.
 * Nobody should need to operate a 3D control to find out what Fikri
 * works with.
 *
 * Selecting a node here highlights it and its neighbours in the graph;
 * selecting one there updates this list. One state, two surfaces.
 */

import { clusters, skillsByCluster, skillSources } from '@/data/skills'
import { sections } from '@/data/sections'
import { Section } from '@/components/ui/Section'
import { getSelection, setSelection, useSelection } from '@/lib/store'
import { useSystem } from '@/lib/system'

const section = sections[3]

export function Knowledge() {
  const { coarsePointer } = useSystem()
  const selected = useSelection('skillSelected')
  const hovered = useSelection('skillHover')
  const focus = selected ?? hovered

  const focusNode = skillsByCluster
    .flatMap((c) => c.nodes)
    .find((n) => n.id === focus)
  const focusCluster = clusters.find((c) => c.id === focus)

  return (
    <Section section={section} height="tall">
      <p className="u-body mb-3 max-w-prose">
        Every node is something Fikri names publicly — on his GitHub profile, in the CITSM
        paper, or in a public repository. Nothing here is inferred from a job title.
      </p>
      {/* The instruction has to match the hardware. Telling someone to
          shift-scroll on a phone is worse than saying nothing. */}
      <p className="u-small mb-8">
        {coarsePointer
          ? 'Tap anything below to trace it through the graph and see where it comes from.'
          : 'Drag the graph to rotate it. Shift + scroll to zoom. Or use the list below — it does the same thing.'}
      </p>

      {/* The detail panel holds its height so selecting a node never
          shifts the list underneath the cursor. */}
      <div className="u-panel mb-8 min-h-[7.5rem] px-5 py-4">
        {focusNode ? (
          <>
            <p className="u-mono text-[var(--color-accent-soft)]">{focusNode.label}</p>
            <p className="u-label mt-1.5">
              {clusters.find((c) => c.id === focusNode.cluster)?.label} ·{' '}
              {skillSources[focusNode.source]}
            </p>
            {focusNode.note && (
              <p className="u-small mt-2.5 text-[var(--color-ink-soft)]">{focusNode.note}</p>
            )}
          </>
        ) : focusCluster ? (
          <>
            <p className="u-mono text-[var(--color-accent-soft)]">{focusCluster.label}</p>
            <p className="u-small mt-2.5 text-[var(--color-ink-soft)]">{focusCluster.summary}</p>
          </>
        ) : (
          <p className="u-small text-[var(--color-faint)]">
            Select anything below, or a node in the graph, to see where it comes from.
          </p>
        )}
      </div>

      <div className="space-y-7">
        {skillsByCluster.map((cluster) => (
          <div key={cluster.id}>
            <button
              type="button"
              aria-pressed={selected === cluster.id}
              onClick={() =>
                setSelection({
                  skillSelected: selected === cluster.id ? null : cluster.id,
                })
              }
              onMouseEnter={() => setSelection({ skillHover: cluster.id })}
              onMouseLeave={() => {
                if (getSelection().skillHover === cluster.id) setSelection({ skillHover: null })
              }}
              onFocus={() => setSelection({ skillHover: cluster.id })}
              onBlur={() => {
                if (getSelection().skillHover === cluster.id) setSelection({ skillHover: null })
              }}
              className="u-mono mb-1 flex min-h-11 items-center gap-2.5 transition-colors lg:mb-3 lg:min-h-0"
              style={{
                color:
                  focus === cluster.id ? 'var(--color-accent-soft)' : 'var(--color-muted)',
              }}
            >
              <span
                aria-hidden="true"
                className="block h-1.5 w-1.5 rounded-full transition-colors"
                style={{
                  background:
                    focus === cluster.id ? 'var(--color-accent)' : 'var(--color-line-strong)',
                }}
              />
              {cluster.label}
              <span className="u-label">{cluster.nodes.length}</span>
            </button>

            <ul className="flex flex-wrap gap-1.5">
              {cluster.nodes.map((node) => {
                const isFocus = focus === node.id
                const isSelected = selected === node.id
                return (
                  <li key={node.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        setSelection({ skillSelected: isSelected ? null : node.id })
                      }
                      onMouseEnter={() => setSelection({ skillHover: node.id })}
                      onMouseLeave={() => {
                        if (getSelection().skillHover === node.id)
                          setSelection({ skillHover: null })
                      }}
                      onFocus={() => setSelection({ skillHover: node.id })}
                      onBlur={() => {
                        if (getSelection().skillHover === node.id)
                          setSelection({ skillHover: null })
                      }}
                      // 44px tall wherever a finger is the input device;
                      // back to a compact chip once there's a cursor.
                      className="flex min-h-11 items-center rounded-full border px-3.5 text-[0.8125rem] transition-all duration-200 lg:min-h-0 lg:px-3 lg:py-1.5 lg:text-[0.75rem]"
                      style={{
                        borderColor: isFocus
                          ? 'var(--color-accent)'
                          : 'var(--color-line)',
                        color: isFocus ? 'var(--color-ink)' : 'var(--color-muted)',
                        // Weight 3 nodes are the ones he names as
                        // specialisms; they read slightly heavier.
                        fontWeight: node.weight === 3 ? 500 : 400,
                      }}
                    >
                      {node.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {selected && (
        <button
          type="button"
          onClick={() => setSelection({ skillSelected: null })}
          className="u-mono mt-7 text-[var(--color-muted)] underline-offset-4 transition-colors hover:text-[var(--color-ink)] hover:underline"
        >
          ← Clear selection
        </button>
      )}
    </Section>
  )
}
