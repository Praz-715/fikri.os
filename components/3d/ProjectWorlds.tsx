'use client'

/**
 * Projects as small worlds.
 *
 * Each project gets a generated structure whose form matches what the
 * project actually is — a graph project looks like a graph, a pipeline
 * project looks like a flow. The shape is picked in `data/projects.ts`
 * via `shape`, so adding a project means choosing a form, not writing
 * geometry.
 *
 * Idle, a world turns slowly at low brightness. Hovering it — from here
 * or from its card in the DOM — brings it forward and speeds it up.
 */

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { projects, type ProjectShape } from '@/data/projects'
import { makeRng, palette } from '@/lib/three'
import { useSystem } from '@/lib/system'
import { getSelection, setSelection, useSelection } from '@/lib/store'
import { projectWorldPosition } from './layout'

interface Props {
  active: boolean
  eager: boolean
}

export function ProjectWorlds({ active, eager }: Props) {
  const positions = useMemo(
    () => projects.map((_, i) => projectWorldPosition(i, projects.length)),
    [],
  )

  return (
    <group>
      {projects.map((p, i) => (
        <ProjectWorld
          key={p.id}
          id={p.id}
          shape={p.shape}
          seed={i * 131 + 7}
          position={positions[i]}
          active={active}
          eager={eager}
          featured={p.featured ?? false}
        />
      ))}
    </group>
  )
}

/**
 * Builds the vertices and edges for one world. Deterministic per seed, so
 * a project's world is the same object every visit.
 */
function buildShape(shape: ProjectShape, seed: number) {
  const rng = makeRng(seed)
  const verts: THREE.Vector3[] = []
  const edges: Array<[number, number]> = []

  switch (shape) {
    case 'graph': {
      // A hub with satellites and a few cross-links — a small graph.
      verts.push(new THREE.Vector3(0, 0, 0))
      const n = 8
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        const r = 1.1 + rng() * 0.5
        verts.push(
          new THREE.Vector3(Math.cos(a) * r, (rng() - 0.5) * 1.3, Math.sin(a) * r),
        )
        edges.push([0, i + 1])
        if (i > 0 && rng() > 0.45) edges.push([i, i + 1])
      }
      break
    }
    case 'flow': {
      // Staged lanes converging — the sentiment pipeline in miniature.
      const stages = 5
      const lanes = 3
      for (let s = 0; s < stages; s++) {
        const x = (s / (stages - 1) - 0.5) * 3.0
        const spread = 0.95 * (1 - s / (stages - 1)) + 0.12
        for (let l = 0; l < lanes; l++) {
          const y = (l / (lanes - 1) - 0.5) * 2 * spread
          verts.push(new THREE.Vector3(x, y, (rng() - 0.5) * 0.35))
          if (s > 0) {
            const prev = (s - 1) * lanes
            for (let pl = 0; pl < lanes; pl++) {
              if (rng() > 0.45) edges.push([prev + pl, s * lanes + l])
            }
          }
        }
      }
      break
    }
    case 'lattice': {
      // A cube frame — structure, ingestion, ordered flow.
      const c = 0.95
      for (let i = 0; i < 8; i++) {
        verts.push(
          new THREE.Vector3(
            i & 1 ? c : -c,
            i & 2 ? c : -c,
            i & 4 ? c : -c,
          ),
        )
      }
      for (let i = 0; i < 8; i++) {
        for (let j = i + 1; j < 8; j++) {
          // Connect only along cube edges: exactly one bit differs.
          const d = i ^ j
          if (d === 1 || d === 2 || d === 4) edges.push([i, j])
        }
      }
      // A core, linked to every corner.
      verts.push(new THREE.Vector3(0, 0, 0))
      for (let i = 0; i < 8; i++) edges.push([8, i])
      break
    }
    case 'orbit': {
      // A centre with rings around it — collection, repetition.
      verts.push(new THREE.Vector3(0, 0, 0))
      const rings = 2
      const per = 7
      for (let r = 0; r < rings; r++) {
        const radius = 0.75 + r * 0.7
        const tilt = r * 0.5
        const base = 1 + r * per
        for (let i = 0; i < per; i++) {
          const a = (i / per) * Math.PI * 2 + r
          const v = new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius)
          v.applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt)
          verts.push(v)
          edges.push([base + i, base + ((i + 1) % per)])
        }
        edges.push([0, base])
      }
      break
    }
    case 'grid':
    default: {
      // A matrix of samples — notebooks, tabular analysis.
      const n = 4
      for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
          verts.push(
            new THREE.Vector3(
              (x / (n - 1) - 0.5) * 2.2,
              (y / (n - 1) - 0.5) * 2.2,
              (rng() - 0.5) * 0.5,
            ),
          )
          const i = x * n + y
          if (x > 0) edges.push([i - n, i])
          if (y > 0) edges.push([i - 1, i])
        }
      }
      break
    }
  }

  return { verts, edges }
}

interface WorldProps {
  id: string
  shape: ProjectShape
  seed: number
  position: THREE.Vector3
  active: boolean
  eager: boolean
  featured: boolean
}

function ProjectWorld({ id, shape, seed, position, active, eager, featured }: WorldProps) {
  const group = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const { reducedMotion } = useSystem()

  const hovered = useSelection('projectHover') === id
  const open = useSelection('projectOpen') === id
  const lit = hovered || open

  const { verts, edges } = useMemo(() => buildShape(shape, seed), [shape, seed])

  const lineGeometry = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (const [a, b] of edges) {
      if (verts[a] && verts[b]) pts.push(verts[a], verts[b])
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [verts, edges])

  const pointGeometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(verts),
    [verts],
  )

  const nodeGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.075, 1), [])

  useEffect(
    () => () => {
      lineGeometry.dispose()
      pointGeometry.dispose()
      nodeGeometry.dispose()
    },
    [lineGeometry, pointGeometry, nodeGeometry],
  )

  const lineMaterial = useRef<THREE.LineBasicMaterial>(null)
  const nodeMaterial = useRef<THREE.MeshBasicMaterial>(null)

  // Instanced vertices — one draw call per world regardless of vertex count.
  const instances = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    const mesh = instances.current
    if (!mesh) return
    const o = new THREE.Object3D()
    verts.forEach((v, i) => {
      o.position.copy(v)
      o.scale.setScalar(1)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [verts])

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1)
    const t = state.clock.elapsedTime

    // Worlds off-screen are held still unless the device can afford to
    // animate them all.
    const animating = active && (eager || lit || !reducedMotion)

    if (spin.current && animating && !reducedMotion) {
      spin.current.rotation.y += dt * (lit ? 0.55 : 0.12)
      spin.current.rotation.x = Math.sin(t * 0.25 + seed) * 0.16
    }

    if (group.current) {
      const goalScale = active ? (lit ? 1.35 : 1) : 0.4
      const s = THREE.MathUtils.damp(group.current.scale.x, goalScale, 6, dt)
      group.current.scale.setScalar(s)
      group.current.position.y = THREE.MathUtils.damp(
        group.current.position.y,
        position.y + (lit ? 0.5 : 0) + (reducedMotion ? 0 : Math.sin(t * 0.5 + seed) * 0.12),
        4,
        dt,
      )
    }

    if (lineMaterial.current) {
      lineMaterial.current.opacity = THREE.MathUtils.damp(
        lineMaterial.current.opacity,
        active ? (lit ? 0.85 : featured ? 0.3 : 0.18) : 0.05,
        5,
        dt,
      )
    }
    if (nodeMaterial.current) {
      nodeMaterial.current.opacity = THREE.MathUtils.damp(
        nodeMaterial.current.opacity,
        active ? (lit ? 1 : 0.42) : 0.1,
        5,
        dt,
      )
    }
  })

  return (
    <group ref={group} position={position}>
      <group ref={spin}>
        <line
          // @ts-expect-error — geometry is accepted as a prop on three's Line
          geometry={lineGeometry}
          raycast={() => null}
        >
          <lineBasicMaterial
            ref={lineMaterial}
            color={lit ? palette.accentWarm : palette.accent}
            transparent
            opacity={0.18}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </line>

        <instancedMesh
          ref={instances}
          args={[nodeGeometry, undefined, verts.length]}
          frustumCulled={false}
          raycast={() => null}
        >
          <meshBasicMaterial
            ref={nodeMaterial}
            color={lit ? palette.accentWarm : palette.accent}
            transparent
            opacity={0.42}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </instancedMesh>
      </group>

      {/* One invisible hit target per world rather than raycasting the
          structure itself — a sphere is far cheaper to test against and
          gives a forgiving hover area. */}
      <mesh
        visible={false}
        onPointerOver={(e) => {
          e.stopPropagation()
          if (!active) return
          setSelection({ projectHover: id })
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          if (getSelection().projectHover === id) setSelection({ projectHover: null })
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (!active) return
          setSelection({ projectOpen: id })
        }}
      >
        <sphereGeometry args={[2.2, 12, 8]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  )
}
