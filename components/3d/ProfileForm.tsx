'use client'

/**
 * "Who is Fikri" — a standing human form built from points.
 *
 * The figure assembles out of a diffuse cloud when the section becomes
 * active and disperses when you leave it, so arriving at the profile
 * literally resolves a person out of data. The cursor pushes the points
 * apart locally, which makes the form feel like a surface rather than a
 * picture.
 *
 * The silhouette is generated analytically (see `sampleHumanForm`), so
 * there is no model to download and the whole figure costs two
 * Float32Arrays.
 */

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { makeRng, palette, sampleHumanForm } from '@/lib/three'
import { useSystem } from '@/lib/system'
import { morphFragment, morphVertex } from './shaders'
import { PROFILE_ORIGIN } from './layout'

interface Props {
  count: number
  active: boolean
}

export function ProfileForm({ count, active }: Props) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const group = useRef<THREE.Group>(null)
  const { pointer, reducedMotion } = useSystem()

  const geometry = useMemo(() => {
    const { positions, scatter, seeds, count: written } = sampleHumanForm(count)
    const rng = makeRng(4242)
    const scales = new Float32Array(written)
    for (let i = 0; i < written; i++) scales[i] = 0.5 + rng() * 0.75

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, written * 3), 3))
    g.setAttribute('aScatter', new THREE.BufferAttribute(scatter.subarray(0, written * 3), 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds.subarray(0, written), 1))
    g.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 14)
    return g
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 7.5 },
      uPixelRatio: { value: 1 },
      // Starts dispersed; resolves on arrival.
      uMorph: { value: 1 },
      uPointer: { value: new THREE.Vector3(999, 999, 999) },
      uPointerStrength: { value: 0 },
      uColor: { value: new THREE.Color(palette.text) },
      uAccent: { value: new THREE.Color(palette.accent) },
      uOpacity: { value: 0.85 },
      uFogNear: { value: 26 },
      uFogFar: { value: 80 },
    }),
    [],
  )

  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(
      typeof window === 'undefined' ? 1 : window.devicePixelRatio,
      2,
    )
  }, [uniforms])

  useEffect(() => () => geometry.dispose(), [geometry])

  // Cursor position projected onto the figure's plane, reused per frame.
  const plane = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, rawDelta) => {
    const m = material.current
    if (!m) return
    const dt = Math.min(rawDelta, 0.1)

    m.uniforms.uTime.value += dt

    // Assemble when the section is live, disperse otherwise.
    const targetMorph = active ? 0 : 1
    m.uniforms.uMorph.value = THREE.MathUtils.damp(
      m.uniforms.uMorph.value,
      targetMorph,
      reducedMotion ? 20 : 1.5,
      dt,
    )

    const p = pointer.current
    const engaged = active && p.active && !reducedMotion

    if (engaged) {
      // Map the damped cursor onto the figure's local space. The figure
      // is ~7 units tall, so this keeps the interaction in proportion
      // without needing a raycast every frame.
      plane.set(p.sx * 5.2, p.sy * 4.0 + 0.4, 2.2)
      m.uniforms.uPointer.value.lerp(plane, 1 - Math.exp(-6 * dt))
    }
    m.uniforms.uPointerStrength.value = THREE.MathUtils.damp(
      m.uniforms.uPointerStrength.value,
      engaged ? 0.85 : 0,
      5,
      dt,
    )

    // A slow turn, so the silhouette is read in the round rather than
    // as a flat cut-out. Stops entirely under reduced motion.
    if (group.current && !reducedMotion) {
      const t = state.clock.elapsedTime
      group.current.rotation.y = Math.sin(t * 0.13) * 0.32 + p.sx * 0.12
    }
  })

  return (
    <group ref={group} position={PROFILE_ORIGIN}>
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
