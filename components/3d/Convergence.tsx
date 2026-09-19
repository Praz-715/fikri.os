'use client'

/**
 * Contact — everything converges.
 *
 * Points begin scattered across a volume the size of the whole world and
 * collapse toward a single centre as the section is reached. It is the
 * same morph mechanism as the profile figure, run in reverse and toward a
 * point instead of a silhouette: the pieces of the system gathering into
 * one place to close the sequence.
 */

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { makeRng, palette } from '@/lib/three'
import { useSystem } from '@/lib/system'
import { morphFragment, morphVertex } from './shaders'
import { CONTACT_ORIGIN } from './layout'

interface Props {
  count: number
  active: boolean
  progress: number
}

export function Convergence({ count, active, progress }: Props) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const group = useRef<THREE.Group>(null)
  const { reducedMotion } = useSystem()

  const geometry = useMemo(() => {
    const rng = makeRng(70707)
    // `position` is the converged state, `aScatter` the dispersed one.
    // uMorph runs 1 → 0 as the section is entered.
    const positions = new Float32Array(count * 3)
    const scatter = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const scales = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Converged: a tight, slightly flattened sphere.
      const u = rng() * 2 - 1
      const a = rng() * Math.PI * 2
      const r = Math.cbrt(rng()) * 2.1
      const s = Math.sqrt(1 - u * u)
      positions[i * 3] = Math.cos(a) * s * r
      positions[i * 3 + 1] = u * r * 0.72
      positions[i * 3 + 2] = Math.sin(a) * s * r

      // Dispersed: spread wide enough to read as "from everywhere".
      scatter[i * 3] = (rng() - 0.5) * 78
      scatter[i * 3 + 1] = (rng() - 0.5) * 42
      scatter[i * 3 + 2] = (rng() - 0.5) * 78

      seeds[i] = rng()
      scales[i] = 0.4 + rng() * 0.8
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    g.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 90)
    return g
  }, [count])

  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 8 },
      uPixelRatio: { value: 1 },
      uMorph: { value: 1 },
      uPointer: { value: new THREE.Vector3(999, 999, 999) },
      uPointerStrength: { value: 0 },
      uColor: { value: new THREE.Color(palette.accentWarm) },
      uAccent: { value: new THREE.Color(palette.accent) },
      uOpacity: { value: 0 },
      uFogNear: { value: 50 },
      uFogFar: { value: 130 },
    }),
    [],
  )

  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(
      typeof window === 'undefined' ? 1 : window.devicePixelRatio,
      2,
    )
  }, [uniforms])

  useFrame((state, rawDelta) => {
    const m = material.current
    if (!m) return
    const dt = Math.min(rawDelta, 0.1)

    if (!reducedMotion) m.uniforms.uTime.value += dt

    // Scrolling through the section completes the convergence, so the
    // gather resolves exactly as the contact links come into view.
    const goal = active ? Math.max(0, 0.55 - progress * 0.8) : 1
    m.uniforms.uMorph.value = THREE.MathUtils.damp(
      m.uniforms.uMorph.value,
      goal,
      reducedMotion ? 20 : 1.3,
      dt,
    )
    m.uniforms.uOpacity.value = THREE.MathUtils.damp(
      m.uniforms.uOpacity.value,
      active ? 0.9 : 0,
      2.5,
      dt,
    )

    if (group.current && !reducedMotion) {
      group.current.rotation.y = state.clock.elapsedTime * 0.06
    }
  })

  return (
    <group ref={group} position={CONTACT_ORIGIN}>
      <points geometry={geometry} frustumCulled={false} raycast={() => null}>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={morphVertex}
          fragmentShader={morphFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
