'use client'

/**
 * The camera is the narrator.
 *
 * Section changes tween the rig's anchor and target with GSAP; scroll
 * progress within a section nudges it further so the view keeps moving
 * while you read; the pointer adds a small parallax on top. All three are
 * composed in useFrame, and none of them cause a React render.
 */

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { sections } from '@/data/sections'
import { journey } from '@/data/experience'
import { useSystem } from '@/lib/system'
import { useSelection } from '@/lib/store'
import { dampVec } from '@/lib/three'
import { duration, ease } from '@/lib/animations'
import { JOURNEY_ORIGIN, journeyCameraDistance, journeyNodePosition } from './layout'
import type { SectionDef } from '@/data/sections'

/**
 * Resting camera position for a section.
 *
 * Every section uses the anchor stored in `data/sections.ts` as-is,
 * except the journey: its arc grows taller with each milestone added, so
 * its stand-off is computed from the milestone count. Adding a role to
 * `data/experience.ts` should pull the camera back, not crop the arc off
 * the top and bottom of the frame.
 */
function anchorFor(section: SectionDef): [number, number, number] {
  if (section.id !== 'journey') return section.anchor
  return [section.anchor[0], section.anchor[1], section.look[2] + journeyCameraDistance(journey.length)]
}

export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const { activeSection, sectionProgress, pointer, reducedMotion } = useSystem()
  const journeyFocus = useSelection('journeyFocus')

  /**
   * On wide screens the text column owns the left of the viewport, so the
   * whole scene is pushed right to sit beside it rather than under it.
   *
   * This is done with the camera's view offset rather than by moving each
   * module: it shifts by a fraction of the viewport, so the composition
   * holds at every width, and it collapses to nothing on narrow screens
   * where the content goes full width and the scene belongs behind it.
   *
   * Contact is the exception — it is a centred, symmetrical close.
   */
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    if (typeof cam.setViewOffset !== 'function') return

    const wide = size.width >= 1024
    const centred = activeSection === 'contact'

    if (wide && !centred) {
      cam.setViewOffset(size.width, size.height, -size.width * 0.19, 0, size.width, size.height)
    } else {
      cam.clearViewOffset()
    }
    return () => cam.clearViewOffset()
  }, [camera, size.width, size.height, activeSection])

  // The tweened values. GSAP writes here; useFrame reads.
  const anchor = useRef(new THREE.Vector3(...anchorFor(sections[0])))
  const target = useRef(new THREE.Vector3(...sections[0].look))

  // Composed per frame, never allocated in the loop.
  const scratch = useMemo(
    () => ({
      desired: new THREE.Vector3(),
      look: new THREE.Vector3(),
      current: new THREE.Vector3(...anchorFor(sections[0])),
      currentLook: new THREE.Vector3(...sections[0].look),
    }),
    [],
  )

  const progress = useRef(0)
  progress.current = sectionProgress

  // Travel between sections.
  useEffect(() => {
    const section = sections.find((s) => s.id === activeSection)
    if (!section) return

    const [ax, ay, az] = anchorFor(section)
    const [lx, ly, lz] = section.look

    if (reducedMotion) {
      anchor.current.set(ax, ay, az)
      target.current.set(lx, ly, lz)
      return
    }

    gsap.to(anchor.current, {
      x: ax,
      y: ay,
      z: az,
      duration: duration.travel,
      ease: ease.travel,
      overwrite: true,
    })
    gsap.to(target.current, {
      x: lx,
      y: ly,
      z: lz,
      duration: duration.travel,
      ease: ease.travel,
      overwrite: true,
    })

    return () => {
      gsap.killTweensOf(anchor.current)
      gsap.killTweensOf(target.current)
    }
  }, [activeSection, reducedMotion])

  // Selecting a milestone flies the camera to that node.
  useEffect(() => {
    if (activeSection !== 'journey') return

    const section = sections.find((s) => s.id === 'journey')!
    if (!journeyFocus) {
      // Back to the overview.
      const [ax, ay, az] = anchorFor(section)
      const [lx, ly, lz] = section.look
      gsap.to(anchor.current, { x: ax, y: ay, z: az, duration: duration.base * 1.6, ease: ease.travel, overwrite: true })
      gsap.to(target.current, { x: lx, y: ly, z: lz, duration: duration.base * 1.6, ease: ease.travel, overwrite: true })
      return
    }

    const index = journey.findIndex((m) => m.id === journeyFocus)
    if (index < 0) return
    const node = journeyNodePosition(index, journey.length)

    /**
     * Hold a constant stand-off and move mostly sideways along the arc,
     * rather than diving at the node.
     *
     * Flying in until the node fills the frame sounds like the dramatic
     * choice and is the wrong one: it loses the rest of the journey, and
     * a 1-unit sphere seen from two units away is just a faceted ball.
     * Keeping the distance fixed means selecting a milestone reads as
     * travelling to it, with its neighbours still in view.
     */
    const outward = node.clone().sub(JOURNEY_ORIGIN).normalize()
    const stand = node.clone().addScaledVector(outward, 2.2)
    stand.y += 1.4
    stand.z += 15

    const dur = reducedMotion ? 0 : duration.base * 1.7
    gsap.to(anchor.current, { x: stand.x, y: stand.y, z: stand.z, duration: dur, ease: ease.travel, overwrite: true })
    gsap.to(target.current, { x: node.x, y: node.y, z: node.z, duration: dur, ease: ease.travel, overwrite: true })
  }, [journeyFocus, activeSection, reducedMotion])

  useFrame((_, rawDelta) => {
    // A tab that was backgrounded returns with a huge delta; clamping
    // stops the camera lurching across the world on the first frame back.
    const dt = Math.min(rawDelta, 0.1)
    const p = pointer.current

    // Damp the pointer itself so a flick of the wrist doesn't snap the view.
    p.sx = THREE.MathUtils.damp(p.sx, p.active ? p.x : 0, 2.5, dt)
    p.sy = THREE.MathUtils.damp(p.sy, p.active ? p.y : 0, 2.5, dt)

    const parallax = reducedMotion ? 0 : 1
    const drift = reducedMotion ? 0 : 1

    scratch.desired.copy(anchor.current)
    scratch.desired.x += p.sx * 2.1 * parallax
    scratch.desired.y += p.sy * 1.35 * parallax
    // Scrolling through a section pushes gently inward, so reading feels
    // like approaching rather than standing still.
    scratch.desired.z -= progress.current * 2.4 * drift

    scratch.look.copy(target.current)
    scratch.look.x += p.sx * 0.55 * parallax
    scratch.look.y += p.sy * 0.35 * parallax

    dampVec(scratch.current, scratch.desired, reducedMotion ? 12 : 3.1, dt)
    dampVec(scratch.currentLook, scratch.look, reducedMotion ? 12 : 3.6, dt)

    camera.position.copy(scratch.current)
    camera.lookAt(scratch.currentLook)
  })

  return null
}
