/**
 * Shared maths for the 3D scene.
 *
 * Every layout below is deterministic: the same input always produces the
 * same positions, so the server-rendered markup and the client scene agree
 * and nothing shifts between reloads.
 */

import * as THREE from 'three'

/** Mulberry32 — small, fast, seeded. Good enough for scattering points. */
export function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Frame-rate independent damping. `lambda` is roughly "speed". */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(current, target, lambda, dt)
}

export function dampVec(
  current: THREE.Vector3,
  target: THREE.Vector3,
  lambda: number,
  dt: number,
) {
  current.x = THREE.MathUtils.damp(current.x, target.x, lambda, dt)
  current.y = THREE.MathUtils.damp(current.y, target.y, lambda, dt)
  current.z = THREE.MathUtils.damp(current.z, target.z, lambda, dt)
  return current
}

/**
 * Evenly distributed points on a sphere. Used for the ambient field and
 * for spreading knowledge nodes inside a cluster without them clumping.
 */
export function fibonacciSphere(count: number, radius: number, out?: Float32Array) {
  const arr = out ?? new Float32Array(count * 3)
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = phi * i
    arr[i * 3] = Math.cos(theta) * r * radius
    arr[i * 3 + 1] = y * radius
    arr[i * 3 + 2] = Math.sin(theta) * r * radius
  }
  return arr
}

/**
 * A standing human form, described analytically rather than loaded as a
 * model — head, torso, arms, legs — then sampled as a point cloud.
 *
 * This is the "who is Fikri" figure. It reads as a person at a glance
 * without shipping a mesh, and it costs one Float32Array.
 */
export function sampleHumanForm(count: number, seed = 1337) {
  const rng = makeRng(seed)
  const positions = new Float32Array(count * 3)
  // Per-point scatter target, so the cloud can "breathe" outward on hover.
  const scatter = new Float32Array(count * 3)
  const seeds = new Float32Array(count)

  // Segment table: [weight, yTop, yBottom, rTop, rBottom, xOffset, zSquash]
  const segments: Array<[number, number, number, number, number, number, number]> = [
    // head
    [0.1, 3.5, 2.75, 0.42, 0.46, 0, 0.92],
    // neck
    [0.02, 2.75, 2.5, 0.18, 0.24, 0, 1],
    // shoulders / upper torso
    [0.16, 2.5, 1.5, 0.78, 0.66, 0, 0.62],
    // lower torso
    [0.12, 1.5, 0.45, 0.6, 0.46, 0, 0.6],
    // hips
    [0.06, 0.45, 0.05, 0.52, 0.44, 0, 0.62],
    // arms (mirrored)
    [0.09, 2.4, 0.9, 0.17, 0.12, -0.82, 1],
    [0.09, 2.4, 0.9, 0.17, 0.12, 0.82, 1],
    [0.05, 0.9, -0.1, 0.12, 0.09, -0.95, 1],
    [0.05, 0.9, -0.1, 0.12, 0.09, 0.95, 1],
    // thighs
    [0.08, 0.05, -1.5, 0.26, 0.2, -0.26, 1],
    [0.08, 0.05, -1.5, 0.26, 0.2, 0.26, 1],
    // calves
    [0.05, -1.5, -3.0, 0.19, 0.12, -0.28, 1],
    [0.05, -1.5, -3.0, 0.19, 0.12, 0.28, 1],
  ]

  const totalWeight = segments.reduce((s, seg) => s + seg[0], 0)

  let written = 0
  for (let s = 0; s < segments.length; s++) {
    const [weight, yTop, yBottom, rTop, rBottom, xOff, zSquash] = segments[s]
    const isLast = s === segments.length - 1
    const n = isLast
      ? count - written
      : Math.round((weight / totalWeight) * count)

    for (let i = 0; i < n && written < count; i++, written++) {
      const t = rng()
      const y = yBottom + (yTop - yBottom) * t
      const r = rBottom + (rTop - rBottom) * t
      // sqrt keeps the cloud shell-weighted rather than centre-heavy,
      // which reads as a silhouette instead of a blob.
      const rad = r * Math.sqrt(rng())
      const a = rng() * Math.PI * 2

      const idx = written * 3
      positions[idx] = xOff + Math.cos(a) * rad
      positions[idx + 1] = y
      positions[idx + 2] = Math.sin(a) * rad * zSquash

      // Where this point drifts to when the form disperses.
      const sr = 4.5 + rng() * 5
      const sa = rng() * Math.PI * 2
      const sy = (rng() - 0.5) * 2
      scatter[idx] = Math.cos(sa) * sr
      scatter[idx + 1] = sy * sr * 0.5
      scatter[idx + 2] = Math.sin(sa) * sr

      seeds[written] = rng()
    }
  }

  return { positions, scatter, seeds, count: written }
}

/**
 * Lays out the knowledge graph: a root at origin, clusters pushed out
 * along their declared direction, and each cluster's nodes distributed on
 * a small shell around it. Deterministic, so the graph is the same object
 * every visit — people navigate it by memory of where things were.
 */
export interface GraphLayoutInput {
  clusters: Array<{ id: string; dir: [number, number, number] }>
  nodes: Array<{ id: string; cluster: string; weight: number }>
  clusterRadius?: number
  nodeRadius?: number
}

export interface GraphPoint {
  id: string
  position: THREE.Vector3
  kind: 'root' | 'cluster' | 'node'
  cluster: string | null
  weight: number
}

export function layoutGraph({
  clusters,
  nodes,
  clusterRadius = 6.2,
  nodeRadius = 3.6,
}: GraphLayoutInput) {
  const points: GraphPoint[] = [
    { id: 'root', position: new THREE.Vector3(0, 0, 0), kind: 'root', cluster: null, weight: 4 },
  ]
  const index = new Map<string, GraphPoint>()
  index.set('root', points[0])

  clusters.forEach((c, ci) => {
    const dir = new THREE.Vector3(...c.dir).normalize()
    const cp: GraphPoint = {
      id: c.id,
      position: dir.clone().multiplyScalar(clusterRadius),
      kind: 'cluster',
      cluster: c.id,
      weight: 3,
    }
    points.push(cp)
    index.set(c.id, cp)

    const members = nodes.filter((n) => n.cluster === c.id)
    // Local frame so each cluster's shell faces outward from the root.
    const up = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
    const tangent = new THREE.Vector3().crossVectors(up, dir).normalize()
    const bitangent = new THREE.Vector3().crossVectors(dir, tangent).normalize()

    const shell = fibonacciSphere(Math.max(members.length, 3), 1)
    members.forEach((m, mi) => {
      const sx = shell[mi * 3]
      const sy = shell[mi * 3 + 1]
      const sz = shell[mi * 3 + 2]
      // Bias outward along the cluster direction so nodes trail away from
      // the root rather than crowding back over it.
      const rng = makeRng(ci * 977 + mi * 131 + 7)
      const jitter = 0.82 + rng() * 0.4
      const position = cp.position
        .clone()
        .addScaledVector(tangent, sx * nodeRadius * jitter)
        .addScaledVector(bitangent, sy * nodeRadius * jitter)
        .addScaledVector(dir, (sz * 0.6 + 0.55) * nodeRadius * jitter)

      const p: GraphPoint = { id: m.id, position, kind: 'node', cluster: c.id, weight: m.weight }
      points.push(p)
      index.set(m.id, p)
    })
  })

  return { points, index }
}

/** Reusable throwaway objects — avoids allocating inside useFrame. */
export const tmpVec = new THREE.Vector3()
export const tmpVec2 = new THREE.Vector3()
export const tmpObj = new THREE.Object3D()
export const tmpColor = new THREE.Color()

/**
 * A soft radial dot drawn once into a canvas and reused as the sprite for
 * every point cloud. One 64px texture beats a shader branch per particle.
 */
let dotTexture: THREE.Texture | null = null
export function getDotTexture(): THREE.Texture {
  if (dotTexture) return dotTexture
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  dotTexture = tex
  return tex
}

/** Palette shared between CSS and WebGL so the two never drift apart. */
export const palette = {
  background: '#07080a',
  accent: '#6e7bff',
  accentWarm: '#b8c0ff',
  positive: '#7de3b0',
  neutral: '#8a8f9c',
  negative: '#ff8a6b',
  dim: '#2a2f3d',
  text: '#f2f3f6',
} as const
