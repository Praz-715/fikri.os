'use client'

/**
 * One canvas, one world.
 *
 * Every module lives at its own address in a single scene (see
 * `layout.ts`), so moving between sections is travel rather than a
 * cross-fade. Only the module the camera is looking at does real work;
 * the rest damp down to a dim, static state.
 *
 * The canvas sits behind the DOM and is transparent to pointer events by
 * default — the sections above it handle their own. It only takes the
 * pointer where the 3D is genuinely interactive.
 */

import { Canvas, useFrame } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { useSystem } from '@/lib/system'
import { useDocumentVisible } from '@/lib/hooks'
import { palette } from '@/lib/three'
import { AmbientField } from './AmbientField'
import { CameraRig } from './CameraRig'
import { Convergence } from './Convergence'
import { DataFlow } from './DataFlow'
import { JourneyOrbit } from './JourneyOrbit'
import { KnowledgeGraph } from './KnowledgeGraph'
import { ProfileForm } from './ProfileForm'
import { ProjectWorlds } from './ProjectWorlds'

export default function Scene() {
  const { budget, reducedMotion, activeSection, sectionProgress } = useSystem()
  const visible = useDocumentVisible()

  // The knowledge section is the only place the canvas needs the pointer
  // for dragging; everywhere else clicks belong to the DOM above it.
  const interactive =
    activeSection === 'knowledge' ||
    activeSection === 'journey' ||
    activeSection === 'projects'

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden"
      style={{ pointerEvents: interactive ? 'auto' : 'none' }}
    >
      <Canvas
        // Pausing entirely when the tab is hidden means a backgrounded
        // portfolio costs nothing at all.
        frameloop={visible ? 'always' : 'never'}
        dpr={budget.dpr}
        gl={{
          antialias: budget.antialias,
          alpha: false,
          powerPreference: 'high-performance',
          // The scene is authored in additive light on near-black; tone
          // mapping would crush exactly the range it lives in.
          toneMapping: THREE.NoToneMapping,
          stencil: false,
          depth: true,
        }}
        camera={{ fov: 46, near: 0.1, far: 260, position: [0, 0.6, 15] }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(palette.background, 1)
          scene.fog = new THREE.FogExp2(palette.background, 0.0155)
        }}
      >
        <Suspense fallback={null}>
          <CameraRig />
          <PerfGuard />

          {/* Two lights only. The scene is mostly emissive; these exist
              to give the solid nodes a metallic edge. */}
          <ambientLight intensity={0.55} />
          <directionalLight position={[6, 10, 8]} intensity={1.15} color="#aab4ff" />

          <AmbientField count={budget.ambient} />

          <ProfileForm count={budget.profile} active={activeSection === 'profile'} />

          <JourneyOrbit active={activeSection === 'journey'} />

          <DataFlow
            count={budget.flow}
            active={activeSection === 'research'}
            progress={sectionProgress}
          />

          <KnowledgeGraph
            active={activeSection === 'knowledge'}
            drawEdges={budget.graphEdges}
          />

          <ProjectWorlds
            active={activeSection === 'projects'}
            eager={budget.eagerProjectWorlds}
          />

          <Convergence
            count={budget.converge}
            active={activeSection === 'contact'}
            progress={sectionProgress}
          />

          {/* Compiles every material up front, so the first section
              change doesn't stall on a shader compile. */}
          <Preload all />
        </Suspense>
      </Canvas>

      {reducedMotion && <span className="u-sr-only">Background animation reduced.</span>}
    </div>
  )
}

/**
 * Watches real frame times and asks the system to drop a quality tier if
 * the scene is genuinely struggling.
 *
 * Deliberately slow to trigger: it samples over three seconds and needs a
 * sustained bad average, so a single stall — a shader compile, a garbage
 * collection, the user dragging the window to another monitor — never
 * costs them their detail level.
 */
function PerfGuard() {
  const { reportSlowFrames } = useSystem()
  const done = useRef(false)
  const frames = useRef(0)
  const elapsed = useRef(0)
  const grace = useRef(0)

  useFrame((_, rawDelta) => {
    if (done.current) return
    const delta = Math.min(rawDelta, 0.25)

    // Ignore the first second outright — startup is never representative.
    if (grace.current < 1) {
      grace.current += delta
      return
    }

    frames.current += 1
    elapsed.current += delta
    if (elapsed.current < 3) return

    const fps = frames.current / elapsed.current
    frames.current = 0
    elapsed.current = 0

    if (fps < 34) {
      done.current = true
      reportSlowFrames()
    }
  })

  return null
}
