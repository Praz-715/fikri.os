'use client'

/**
 * The career as an orbit.
 *
 * Milestones climb a vertical arc (see `journeyNodePosition`), connected
 * by a spline that runs through them in order — earliest at the top,
 * current at the bottom, matching the cards beside them. Hover lifts a
 * node; clicking sends the camera to it (see CameraRig).
 *
 * Hover and selection live in the external selection store, so hovering a
 * node here lights the matching card in the DOM and vice versa — without
 * either tree re-rendering the other.
 */

import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { experience } from '@/data/experience'
import { palette } from '@/lib/three'
import { useSystem } from '@/lib/system'
import { getSelection, setSelection, useSelection } from '@/lib/store'
import { JOURNEY_ORIGIN, journeyNodePosition } from './layout'

interface Props {
  active: boolean
}

const KIND_LABEL: Record<string, string> = {
  work: 'ROLE',
  research: 'PUBLICATION',
  education: 'EDUCATION',
}

export function JourneyOrbit({ active }: Props) {
  const { reducedMotion } = useSystem()
  const group = useRef<THREE.Group>(null)

  const nodes = useMemo(
    () =>
      experience.map((m, i) => ({
        milestone: m,
        position: journeyNodePosition(i, experience.length),
      })),
    [],
  )

  /**
   * A Catmull-Rom curve through the milestones. Drawing the path as a
   * smooth spline rather than straight segments is what makes it read as
   * one continuous journey instead of four separate points.
   */
  const pathGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      nodes.map((n) => n.position.clone()),
      false,
      'catmullrom',
      0.35,
    )
    const pts = curve.getPoints(180)
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [nodes])

  useEffect(() => () => pathGeometry.dispose(), [pathGeometry])

  // Shared geometries — four nodes, but no reason to allocate eight buffers.
  const shellGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.95, 2), [])
  const coreGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.38, 2), [])
  const ringGeometry = useMemo(() => new THREE.TorusGeometry(1.62, 0.013, 3, 48), [])

  useEffect(
    () => () => {
      shellGeometry.dispose()
      coreGeometry.dispose()
      ringGeometry.dispose()
    },
    [shellGeometry, coreGeometry, ringGeometry],
  )

  const pathMaterial = useRef<THREE.LineBasicMaterial>(null)

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1)
    if (pathMaterial.current) {
      pathMaterial.current.opacity = THREE.MathUtils.damp(
        pathMaterial.current.opacity,
        active ? 0.5 : 0.12,
        3,
        dt,
      )
    }
    if (group.current && !reducedMotion && active) {
      // Barely-there rotation. Enough that the ring reads as a solid
      // object in space; slow enough that it never pulls focus from text.
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.09
    }
  })

  return (
    <group ref={group}>
      <line
        // @ts-expect-error — three's Line takes geometry as a prop here
        geometry={pathGeometry}
        raycast={() => null}
      >
        <lineBasicMaterial
          ref={pathMaterial}
          color={palette.accent}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </line>

      {nodes.map(({ milestone, position }, i) => (
        <MilestoneNode
          key={milestone.id}
          id={milestone.id}
          index={i}
          position={position}
          label={milestone.code}
          period={milestone.period}
          kind={KIND_LABEL[milestone.kind] ?? 'MILESTONE'}
          active={active}
          shellGeometry={shellGeometry}
          coreGeometry={coreGeometry}
          ringGeometry={ringGeometry}
        />
      ))}
    </group>
  )
}

interface NodeProps {
  id: string
  index: number
  position: THREE.Vector3
  label: string
  period: string | null
  kind: string
  active: boolean
  shellGeometry: THREE.BufferGeometry
  coreGeometry: THREE.BufferGeometry
  ringGeometry: THREE.BufferGeometry
}

function MilestoneNode({
  id,
  index,
  position,
  label,
  period,
  kind,
  active,
  shellGeometry,
  coreGeometry,
  ringGeometry,
}: NodeProps) {
  const holder = useRef<THREE.Group>(null)
  const shell = useRef<THREE.Mesh>(null)
  const core = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const { reducedMotion } = useSystem()

  const hovered = useSelection('journeyHover') === id
  const focused = useSelection('journeyFocus') === id

  // Materials are per-node because each animates independently; they are
  // disposed by R3F when the node unmounts.
  const shellMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        // Enough diffuse to read against the background. A near-black,
        // fully metallic shell only shows specular highlights, which at
        // this distance means it shows nothing at all.
        color: '#2b3450',
        metalness: 0.45,
        roughness: 0.3,
        emissive: new THREE.Color(palette.accent),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.94,
      }),
    [],
  )
  const coreMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: palette.accentWarm,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )
  const ringMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: palette.accent,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      }),
    [],
  )

  useEffect(
    () => () => {
      shellMaterial.dispose()
      coreMaterial.dispose()
      ringMaterial.dispose()
    },
    [shellMaterial, coreMaterial, ringMaterial],
  )

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1)
    const t = state.clock.elapsedTime
    const lit = hovered || focused

    if (holder.current) {
      // Each node bobs on its own phase so the ring never pulses in unison.
      const bob = reducedMotion ? 0 : Math.sin(t * 0.7 + index * 1.7) * 0.16
      holder.current.position.y = THREE.MathUtils.damp(
        holder.current.position.y,
        position.y + bob + (lit ? 0.4 : 0),
        4,
        dt,
      )
      const scale = active ? (lit ? 1.28 : 1) : 0.55
      const s = THREE.MathUtils.damp(holder.current.scale.x, scale, 5, dt)
      holder.current.scale.setScalar(s)
    }

    if (shell.current && !reducedMotion) {
      shell.current.rotation.y += dt * (lit ? 0.5 : 0.14)
      shell.current.rotation.x += dt * 0.06
    }

    shellMaterial.emissiveIntensity = THREE.MathUtils.damp(
      shellMaterial.emissiveIntensity,
      lit ? 1.15 : 0.32,
      6,
      dt,
    )
    shellMaterial.opacity = THREE.MathUtils.damp(shellMaterial.opacity, active ? 0.94 : 0.35, 4, dt)
    coreMaterial.opacity = THREE.MathUtils.damp(coreMaterial.opacity, lit ? 1 : 0.72, 6, dt)
    ringMaterial.opacity = THREE.MathUtils.damp(ringMaterial.opacity, lit ? 0.6 : 0.1, 6, dt)

    if (ring.current && !reducedMotion) {
      ring.current.rotation.z += dt * (lit ? 0.6 : 0.12)
    }
  })

  return (
    <group ref={holder} position={position}>
      <mesh
        ref={shell}
        geometry={shellGeometry}
        material={shellMaterial}
        onPointerOver={(e) => {
          e.stopPropagation()
          setSelection({ journeyHover: id })
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          if (getSelection().journeyHover === id) setSelection({ journeyHover: null })
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          e.stopPropagation()
          setSelection({ journeyFocus: getSelection().journeyFocus === id ? null : id })
        }}
      />
      <mesh ref={core} geometry={coreGeometry} material={coreMaterial} raycast={() => null} />
      <mesh
        ref={ring}
        geometry={ringGeometry}
        material={ringMaterial}
        rotation={[Math.PI / 2.3, 0, 0]}
        raycast={() => null}
      />

      {/* A real DOM label, so it stays crisp at any distance and is
          readable by assistive tech through the canvas overlay. */}
      <Html
        center
        distanceFactor={14}
        position={[0, 1.7, 0]}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="select-none whitespace-nowrap text-center transition-opacity duration-500"
          style={{ opacity: active ? 1 : 0 }}
          aria-hidden="true"
        >
          <div
            className="u-mono"
            style={{ color: hovered || focused ? palette.accentWarm : palette.neutral }}
          >
            {label}
          </div>
          <div
            className="u-mono mt-1"
            style={{
              fontSize: '0.5rem',
              letterSpacing: '0.14em',
              color: '#5b6273',
              maxWidth: '14rem',
              whiteSpace: 'normal',
            }}
          >
            {period ?? kind}
          </div>
          {/* The organisation deliberately isn't repeated here. At this
              scale it wrapped to four words a line and became noise —
              and the card beside the node already names it. */}
        </div>
      </Html>
    </group>
  )
}
