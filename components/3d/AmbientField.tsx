'use client'

/**
 * The ground the whole world sits in.
 *
 * One Points object spanning every module's address, so travelling
 * between sections passes through a continuous medium rather than
 * cutting between empty voids. Density is deliberately low — the field
 * is there to give depth cues and parallax, not to be looked at.
 */

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { makeRng, palette } from '@/lib/three'
import { useSystem } from '@/lib/system'
import { driftVertex, pointFragment } from './shaders'

interface Props {
  count: number
}

export function AmbientField({ count }: Props) {
  const points = useRef<THREE.Points>(null)
  const material = useRef<THREE.ShaderMaterial>(null)
  const { reducedMotion } = useSystem()

  const geometry = useMemo(() => {
    const rng = makeRng(20220920)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const scales = new Float32Array(count)

    // The world spans roughly x −75…75, y −10…55, z −85…85. The field
    // covers it with a little margin so edges are never visible.
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rng() - 0.5) * 190
      positions[i * 3 + 1] = (rng() - 0.35) * 110
      positions[i * 3 + 2] = (rng() - 0.5) * 210
      seeds[i] = rng()
      // A few larger points give the field a sense of near and far.
      scales[i] = rng() < 0.06 ? 1.8 + rng() * 1.4 : 0.45 + rng() * 0.6
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    g.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    // Frustum culling a cloud this large would cull all or nothing;
    // skipping the test saves the bounding-sphere computation.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 220)
    return g
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 9 },
      uPixelRatio: { value: 1 },
      uDrift: { value: 0.9 },
      uColor: { value: new THREE.Color(palette.accentWarm) },
      uOpacity: { value: 0.34 },
      uFogNear: { value: 40 },
      uFogFar: { value: 150 },
    }),
    [],
  )

  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(
      typeof window === 'undefined' ? 1 : window.devicePixelRatio,
      2,
    )
    uniforms.uDrift.value = reducedMotion ? 0 : 0.9
  }, [uniforms, reducedMotion])

  // Explicit teardown: the geometry is created here, so it is disposed
  // here. R3F disposes the material it attached.
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    if (reducedMotion) return
    const m = material.current
    if (!m) return
    m.uniforms.uTime.value += Math.min(delta, 0.1)
  })

  return (
    <points ref={points} geometry={geometry} frustumCulled={false} raycast={() => null}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={driftVertex}
        fragmentShader={pointFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
