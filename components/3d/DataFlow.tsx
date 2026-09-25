'use client'

/**
 * Research — data in motion.
 *
 * The published pipeline drawn as a pipeline: raw tweets enter on the
 * left as undifferentiated grey, pass through preprocessing, lexicon
 * weighting and the SVM, and leave on the right carrying a sentiment
 * colour. Every particle is the same draw call; the transformation lives
 * entirely in the shader.
 *
 * The gate uniform is driven by scroll progress through the section, so
 * reading the stages and watching them open are the same gesture.
 */

import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { research } from '@/data/research'
import { makeRng, palette } from '@/lib/three'
import { useSystem } from '@/lib/system'
import { flowFragment, flowVertex } from './shaders'
import { FLOW_SPAN, RESEARCH_ORIGIN } from './layout'

interface Props {
  count: number
  active: boolean
  progress: number
}

export function DataFlow({ count, active, progress }: Props) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const { reducedMotion } = useSystem()
  const stages = research.pipeline

  const geometry = useMemo(() => {
    const rng = makeRng(94035)
    const offsets = new Float32Array(count)
    const lanes = new Float32Array(count)
    const seeds = new Float32Array(count)
    const speeds = new Float32Array(count)
    // position is unused by the flow shader but three requires the
    // attribute to exist to derive the draw count.
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      offsets[i] = rng()
      // Cube the lane value so most particles run near the centre line
      // and only a few stray wide — a stream, not a rectangle.
      const l = rng() * 2 - 1
      lanes[i] = l * l * l
      seeds[i] = rng()
      speeds[i] = 0.55 + rng() * 0.85
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1))
    g.setAttribute('aLane', new THREE.BufferAttribute(lanes, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), FLOW_SPAN)
    return g
  }, [count])

  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 9.5 },
      uPixelRatio: { value: 1 },
      uSpeed: { value: 0.09 },
      uSpan: { value: FLOW_SPAN },
      uGate: { value: 0 },
      uRaw: { value: new THREE.Color(palette.neutral) },
      uAccent: { value: new THREE.Color(palette.accent) },
      uPositive: { value: new THREE.Color(palette.positive) },
      uNegative: { value: new THREE.Color(palette.negative) },
      uOpacity: { value: 0 },
      uFogNear: { value: 30 },
      uFogFar: { value: 95 },
    }),
    [],
  )

  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(
      typeof window === 'undefined' ? 1 : window.devicePixelRatio,
      2,
    )
  }, [uniforms])

  useFrame((_, rawDelta) => {
    const m = material.current
    if (!m) return
    const dt = Math.min(rawDelta, 0.1)

    if (!reducedMotion) m.uniforms.uTime.value += dt

    // Scroll opens the pipe. It never fully closes while the section is
    // live, so the first stage is always populated on arrival.
    const gate = active ? THREE.MathUtils.clamp(0.22 + progress * 1.15, 0, 1) : 0.15
    m.uniforms.uGate.value = THREE.MathUtils.damp(m.uniforms.uGate.value, gate, 2.4, dt)
    m.uniforms.uOpacity.value = THREE.MathUtils.damp(
      m.uniforms.uOpacity.value,
      active ? 0.9 : 0,
      3,
      dt,
    )
  })

  return (
    // Yawed away from the camera so the pipeline recedes rather than
    // running flat across the frame: the early stages sit further back
    // and smaller, behind the text column where they belong, and the
    // classified output arrives nearest the viewer. It also separates the
    // stage labels in depth instead of lining them up in a row.
    <group position={[RESEARCH_ORIGIN.x, RESEARCH_ORIGIN.y + 2.4, RESEARCH_ORIGIN.z]} rotation={[0.04, -0.62, 0.05]}>
      <points geometry={geometry} frustumCulled={false} raycast={() => null}>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={flowVertex}
          fragmentShader={flowFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {stages.map((stage, i) => (
        <StageGate
          key={stage.id}
          index={i}
          total={stages.length}
          label={stage.label}
          active={active}
          progress={progress}
        />
      ))}
    </group>
  )
}

interface StageProps {
  index: number
  total: number
  label: string
  active: boolean
  progress: number
}

/**
 * A ring marking each transform in the pipeline. It brightens as the
 * gate reaches it, which is how you can tell at a glance how far the
 * data has travelled.
 */
function StageGate({ index, total, label, active, progress }: StageProps) {
  const ring = useRef<THREE.Mesh>(null)
  const { reducedMotion } = useSystem()

  const t = total <= 1 ? 0.5 : index / (total - 1)
  const x = (t - 0.5) * FLOW_SPAN

  const geometry = useMemo(() => new THREE.TorusGeometry(1.3, 0.014, 3, 64), [])
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  useEffect(() => () => geometry.dispose(), [geometry])

  const reached = useRef(0)

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1)
    const gate = active ? THREE.MathUtils.clamp(0.22 + progress * 1.15, 0, 1) : 0
    const isReached = gate >= t - 0.02
    reached.current = THREE.MathUtils.damp(reached.current, isReached && active ? 1 : 0, 4, dt)

    if (materialRef.current) {
      materialRef.current.opacity = 0.1 + reached.current * 0.62
    }
    if (ring.current && !reducedMotion) {
      ring.current.rotation.z = state.clock.elapsedTime * 0.08 + index
    }
  })

  return (
    <group position={[x, 0, 0]}>
      <mesh ref={ring} geometry={geometry} raycast={() => null}>
        <meshBasicMaterial
          ref={materialRef}
          color={palette.accent}
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>
      <Html
        center
        distanceFactor={26}
        position={[0, -1.95, 0]}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="u-mono hidden select-none whitespace-nowrap transition-opacity duration-700 lg:block"
          style={{
            fontSize: '0.55rem',
            color: palette.neutral,
            opacity: active ? 0.62 : 0,
          }}
          aria-hidden="true"
        >
          {label}
        </div>
      </Html>
    </group>
  )
}
