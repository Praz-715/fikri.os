'use client'

/**
 * The knowledge graph.
 *
 * Roughly forty nodes and their edges, drawn as one InstancedMesh and one
 * LineSegments — two draw calls for the whole structure. Per-node colour
 * and scale live in instance attributes, so highlighting a selection
 * costs a buffer write rather than forty material swaps.
 *
 * Rotation is applied to the graph group rather than the camera. The
 * camera is the narrator for the whole site and belongs to the rig; a
 * second controller fighting it for the same transform is the usual way
 * these scenes end up feeling unpredictable.
 */

import { Html } from '@react-three/drei'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { clusters, skills } from '@/data/skills'
import { palette, tmpObj } from '@/lib/three'
import { useSystem } from '@/lib/system'
import { getSelection, setSelection, useSelection } from '@/lib/store'
import { graphLayout, KNOWLEDGE_ORIGIN } from './layout'

interface Props {
  active: boolean
  drawEdges: boolean
}

const IDLE = new THREE.Color('#39405a')
const CLUSTER_COLOR = new THREE.Color(palette.accent)
const ROOT_COLOR = new THREE.Color(palette.accentWarm)
const LIT = new THREE.Color(palette.accentWarm)
const MUTED = new THREE.Color('#1a1e2b')

/** Every edge in the graph, derived once from the data. */
function buildEdges() {
  const edges: Array<[string, string]> = []
  for (const c of clusters) edges.push(['root', c.id])
  for (const s of skills) {
    edges.push([s.cluster, s.id])
    for (const link of s.links ?? []) edges.push([s.id, link])
  }
  return edges
}

/** id -> set of directly connected ids. Used for the highlight pass. */
function buildAdjacency(edges: Array<[string, string]>) {
  const map = new Map<string, Set<string>>()
  const add = (a: string, b: string) => {
    if (!map.has(a)) map.set(a, new Set())
    map.get(a)!.add(b)
  }
  for (const [a, b] of edges) {
    add(a, b)
    add(b, a)
  }
  return map
}

export function KnowledgeGraph({ active, drawEdges }: Props) {
  const { reducedMotion } = useSystem()
  const gl = useThree((s) => s.gl)

  const group = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const instances = useRef<THREE.InstancedMesh>(null)


  const hovered = useSelection('skillHover')
  const selected = useSelection('skillSelected')

  const { points, index } = graphLayout
  const edges = useMemo(buildEdges, [])
  const adjacency = useMemo(() => buildAdjacency(edges), [edges])

  const skillById = useMemo(() => new Map(skills.map((s) => [s.id, s])), [])
  const clusterById = useMemo(() => new Map(clusters.map((c) => [c.id, c])), [])

  const nodeGeometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), [])
  useEffect(() => () => nodeGeometry.dispose(), [nodeGeometry])

  // ------------------------------------------------------------------
  // Edges
  // ------------------------------------------------------------------
  const edgeBuffers = useMemo(() => {
    const positions = new Float32Array(edges.length * 6)
    const colors = new Float32Array(edges.length * 6)
    edges.forEach(([a, b], i) => {
      const pa = index.get(a)
      const pb = index.get(b)
      if (!pa || !pb) return
      positions.set([pa.position.x, pa.position.y, pa.position.z], i * 6)
      positions.set([pb.position.x, pb.position.y, pb.position.z], i * 6 + 3)
    })
    return { positions, colors }
  }, [edges, index])

  const edgeObject = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(edgeBuffers.positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(edgeBuffers.colors, 3))
    return g
  }, [edgeBuffers])

  useEffect(() => () => edgeObject.dispose(), [edgeObject])

  // ------------------------------------------------------------------
  // Highlight pass — runs only when the selection changes, never per frame
  // ------------------------------------------------------------------
  const targetScale = useRef(new Float32Array(points.length).fill(1))

  useEffect(() => {
    const mesh = instances.current
    if (!mesh) return

    const focus = selected ?? hovered
    const neighbours = focus ? (adjacency.get(focus) ?? new Set<string>()) : null
    const color = new THREE.Color()

    points.forEach((p, i) => {
      const isFocus = p.id === focus
      const isNeighbour = neighbours?.has(p.id) ?? false

      if (!focus) {
        color.copy(
          p.kind === 'root' ? ROOT_COLOR : p.kind === 'cluster' ? CLUSTER_COLOR : IDLE,
        )
        targetScale.current[i] = 1
      } else if (isFocus) {
        color.copy(LIT)
        targetScale.current[i] = 1.65
      } else if (isNeighbour) {
        color.copy(CLUSTER_COLOR)
        targetScale.current[i] = 1.2
      } else {
        // Everything unrelated recedes rather than disappearing, so the
        // shape of the whole graph stays legible while a branch is read.
        color.copy(MUTED)
        targetScale.current[i] = 0.72
      }
      mesh.setColorAt(i, color)
    })

    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true

    // Edges inherit the same logic: lit if they touch the focus.
    const colors = edgeBuffers.colors
    const c = new THREE.Color()
    edges.forEach(([a, b], i) => {
      const touches = !focus || a === focus || b === focus
      if (!focus) c.setRGB(0.16, 0.18, 0.28)
      else if (touches) c.copy(LIT).multiplyScalar(0.85)
      else c.setRGB(0.055, 0.065, 0.1)
      for (let v = 0; v < 2; v++) {
        colors[i * 6 + v * 3] = c.r
        colors[i * 6 + v * 3 + 1] = c.g
        colors[i * 6 + v * 3 + 2] = c.b
      }
    })
    edgeObject.getAttribute('color').needsUpdate = true
  }, [hovered, selected, points, adjacency, edges, edgeBuffers, edgeObject])

  // ------------------------------------------------------------------
  // Instance transforms
  // ------------------------------------------------------------------
  const current = useRef(new Float32Array(points.length).fill(0))

  useFrame((state, rawDelta) => {
    const mesh = instances.current
    if (!mesh) return
    const dt = Math.min(rawDelta, 0.1)
    const t = state.clock.elapsedTime

    let dirty = false
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      const base = p.kind === 'root' ? 0.62 : p.kind === 'cluster' ? 0.4 : 0.16 + p.weight * 0.048
      const goal = active ? targetScale.current[i] : 0.35
      const next = THREE.MathUtils.damp(current.current[i], goal, 6, dt)
      if (Math.abs(next - current.current[i]) > 0.0005) dirty = true
      current.current[i] = next

      tmpObj.position.copy(p.position)
      if (!reducedMotion) {
        // A small per-node float keeps the graph alive without any node
        // drifting far enough to break the mental map of where it is.
        const phase = i * 0.7
        tmpObj.position.y += Math.sin(t * 0.55 + phase) * 0.085
        tmpObj.position.x += Math.cos(t * 0.4 + phase) * 0.06
      }
      tmpObj.scale.setScalar(base * next)
      tmpObj.rotation.set(0, t * 0.1 + i, 0)
      tmpObj.updateMatrix()
      mesh.setMatrixAt(i, tmpObj.matrix)
    }
    if (dirty || !reducedMotion) mesh.instanceMatrix.needsUpdate = true

    if (spin.current) {
      // Idle drift, suspended while the user is driving the rotation
      // themselves so the two never add up into a spin.
      if (active && !reducedMotion && !dragging.current) {
        spin.current.rotation.y += dt * 0.045
      }
      // Drag momentum, decaying. Vertical rotation is clamped so the
      // graph can be tilted but never turned upside down.
      spin.current.rotation.y += velocity.current.x
      spin.current.rotation.x = THREE.MathUtils.clamp(
        spin.current.rotation.x + velocity.current.y,
        -0.7,
        0.7,
      )
      const decay = Math.pow(0.0025, dt)
      velocity.current.x *= decay
      velocity.current.y *= decay
    }
    if (group.current) {
      const zoomGoal = active ? zoom.current : 0.5
      const s = THREE.MathUtils.damp(group.current.scale.x, zoomGoal, 5, dt)
      group.current.scale.setScalar(s)
    }
  })

  // ------------------------------------------------------------------
  // Drag to rotate, wheel to zoom — only while this section is live
  // ------------------------------------------------------------------
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const zoom = useRef(0.88)

  useEffect(() => {
    if (!active) return
    const el = gl.domElement

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      dragging.current = true
      last.current = { x: e.clientX, y: e.clientY }
      el.setPointerCapture?.(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - last.current.x
      const dy = e.clientY - last.current.y
      last.current = { x: e.clientX, y: e.clientY }
      velocity.current.x += dx * 0.00042
      velocity.current.y += dy * 0.00032
    }
    const onUp = (e: PointerEvent) => {
      dragging.current = false
      el.releasePointerCapture?.(e.pointerId)
    }
    const onWheel = (e: WheelEvent) => {
      // Only take the wheel when the pointer is over empty canvas and the
      // user is holding a modifier, otherwise scrolling the page would
      // become impossible over this section.
      if (!e.shiftKey) return
      e.preventDefault()
      zoom.current = THREE.MathUtils.clamp(zoom.current - e.deltaY * 0.0012, 0.55, 2.2)
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      el.removeEventListener('wheel', onWheel)
      dragging.current = false
    }
  }, [active, gl])

  // Leaving the section clears any transient hover.
  useEffect(() => {
    if (!active && getSelection().skillHover) setSelection({ skillHover: null })
  }, [active])

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (dragging.current) return
    e.stopPropagation()
    const id = e.instanceId !== undefined ? points[e.instanceId]?.id : undefined
    if (id && getSelection().skillHover !== id) setSelection({ skillHover: id })
    document.body.style.cursor = id ? 'pointer' : ''
  }

  const onPointerOut = () => {
    setSelection({ skillHover: null })
    document.body.style.cursor = ''
  }

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (e.instanceId === undefined) return
    const id = points[e.instanceId]?.id
    if (!id) return
    setSelection({ skillSelected: getSelection().skillSelected === id ? null : id })
  }

  const focusId = selected ?? hovered
  const focusPoint = focusId ? index.get(focusId) : null
  const focusLabel = focusId
    ? (skillById.get(focusId)?.label ??
      clusterById.get(focusId)?.label ??
      (focusId === 'root' ? 'DATA' : focusId))
    : null

  return (
    <group ref={group} position={KNOWLEDGE_ORIGIN}>
      <group ref={spin}>
        {drawEdges && (
          <lineSegments geometry={edgeObject} raycast={() => null}>
            <lineBasicMaterial
              vertexColors
              transparent
              opacity={active ? 0.75 : 0.15}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>
        )}

        <instancedMesh
          ref={instances}
          args={[nodeGeometry, undefined, points.length]}
          onPointerMove={onPointerMove}
          onPointerOut={onPointerOut}
          onClick={onClick}
          frustumCulled={false}
        >
          <meshStandardMaterial
            metalness={0.75}
            roughness={0.35}
            emissive={new THREE.Color(palette.accent)}
            emissiveIntensity={0.28}
            transparent
            opacity={0.95}
          />
        </instancedMesh>

        {/* Cluster names stay on screen; individual node labels appear
            only for the one being read, so the graph never becomes a
            wall of text. */}
        {clusters.map((c) => {
          const p = index.get(c.id)
          if (!p) return null
          return (
            <Html
              key={c.id}
              center
              distanceFactor={26}
              position={[p.position.x, p.position.y + 1.4, p.position.z]}
              zIndexRange={[18, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <div
                className="u-mono hidden select-none whitespace-nowrap transition-opacity duration-500 lg:block"
                style={{
                  fontSize: '0.6rem',
                  color: focusId && focusId !== c.id ? '#4a5061' : palette.accentWarm,
                  opacity: active ? 1 : 0,
                }}
                aria-hidden="true"
              >
                {c.label}
              </div>
            </Html>
          )
        })}

        {focusPoint && focusLabel && (
          <Html
            center
            distanceFactor={22}
            position={[focusPoint.position.x, focusPoint.position.y - 1.15, focusPoint.position.z]}
            zIndexRange={[19, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="u-mono hidden select-none whitespace-nowrap rounded-full px-2 py-1 lg:block"
              style={{
                fontSize: '0.55rem',
                color: '#07080a',
                background: palette.accentWarm,
                textTransform: 'none',
                letterSpacing: '0.06em',
              }}
              aria-hidden="true"
            >
              {focusLabel}
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}
