/**
 * World coordinates.
 *
 * Each module occupies its own address in one continuous space, so the
 * camera genuinely travels between them. Shared here because both the
 * modules and the camera rig need to agree on where things are.
 */

import * as THREE from 'three'
import { clusters, skills } from '@/data/skills'
import { layoutGraph } from '@/lib/three'

export const PROFILE_ORIGIN = new THREE.Vector3(0, 0, 0)
export const JOURNEY_ORIGIN = new THREE.Vector3(60, 0, 0)
export const RESEARCH_ORIGIN = new THREE.Vector3(0, 0, -72)
export const KNOWLEDGE_ORIGIN = new THREE.Vector3(-60, 0, 0)
export const PROJECTS_ORIGIN = new THREE.Vector3(0, 0, 70)
export const CONTACT_ORIGIN = new THREE.Vector3(0, 44, 0)

/** Lateral and depth radius of the career arc. */
export const JOURNEY_RADIUS = 7

/**
 * Vertical gap between consecutive milestones.
 *
 * The arc grows with the number of milestones rather than squeezing them
 * into a fixed height — adding a role to `data/experience.ts` should not
 * shrink the gaps until the labels collide. The camera distance below
 * compensates, so the nodes stay the same apparent size.
 */
export const JOURNEY_STEP = 3.3

/** How far the camera needs to stand back to frame `count` milestones. */
export function journeyCameraDistance(count: number) {
  const height = Math.max(1, count - 1) * JOURNEY_STEP
  // Frame the run at roughly 70% of the viewport height at a 46° vertical
  // field of view, leaving room for the labels above each node.
  return Math.max(20, height / (2 * Math.tan((46 * Math.PI) / 360) * 0.7))
}

/**
 * Milestones climb a vertical arc that bows away from the viewer.
 *
 * A flat ring was the obvious shape and the wrong one: on a desktop the
 * text column takes the left two thirds, so a wide circle either runs
 * behind the copy or shrinks to nothing. A tall, narrow arc fits the
 * space that is actually free, and it runs earliest-at-top to
 * latest-at-bottom — the same order as the cards beside it, so the two
 * readings of the same journey line up.
 */
export function journeyNodePosition(index: number, total: number, out?: THREE.Vector3) {
  const v = out ?? new THREE.Vector3()
  const t = total <= 1 ? 0.5 : index / (total - 1)

  // Lateral swing and depth come from the arc; height is linear, so the
  // sequence is never ambiguous.
  const spread = 1.75
  const angle = (t - 0.5) * spread

  v.set(
    Math.sin(angle) * JOURNEY_RADIUS * 0.5,
    -(t - 0.5) * Math.max(1, total - 1) * JOURNEY_STEP,
    // The middle of the run sits deepest, so the path reads as a curve
    // through space rather than a line drawn on glass.
    -Math.cos(angle) * JOURNEY_RADIUS * 0.55,
  )
  return v.add(JOURNEY_ORIGIN)
}

/** Positions of every knowledge node, computed once and shared. */
export const graphLayout = layoutGraph({
  clusters: clusters.map((c) => ({ id: c.id, dir: c.dir })),
  nodes: skills.map((s) => ({ id: s.id, cluster: s.cluster, weight: s.weight })),
})

/** The research pipeline runs along X, centred on its origin. */
export const FLOW_SPAN = 19

export function flowStagePosition(index: number, total: number, out?: THREE.Vector3) {
  const v = out ?? new THREE.Vector3()
  const t = total <= 1 ? 0.5 : index / (total - 1)
  v.set((t - 0.5) * FLOW_SPAN, 0, 0)
  return v.add(RESEARCH_ORIGIN)
}

/**
 * Project worlds sit in a compact two-column constellation rather than
 * one long row: seven worlds in a line would run past both edges of the
 * frame, and pulling the camera back far enough to hold them would shrink
 * every one of them to a speck.
 */
export const PROJECT_COLUMNS = 2
export const PROJECT_SPACING = { x: 5.6, y: 4.6 }

export function projectWorldPosition(index: number, total: number, out?: THREE.Vector3) {
  const v = out ?? new THREE.Vector3()
  const rows = Math.ceil(total / PROJECT_COLUMNS)
  const row = Math.floor(index / PROJECT_COLUMNS)
  const col = index % PROJECT_COLUMNS

  // Centre the last row on its own count so a partial row doesn't hang
  // off one side.
  const inRow = Math.min(PROJECT_COLUMNS, total - row * PROJECT_COLUMNS)

  v.set(
    (col - (inRow - 1) / 2) * PROJECT_SPACING.x,
    -(row - (rows - 1) / 2) * PROJECT_SPACING.y,
    // Stagger depth so the constellation has volume rather than reading
    // as a flat wall of icons.
    ((index % 3) - 1) * 1.8,
  )
  return v.add(PROJECTS_ORIGIN)
}
