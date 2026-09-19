/**
 * Motion vocabulary.
 *
 * A handful of named durations and eases, used everywhere, so the whole
 * site moves with one hand. Anything that needs a different curve needs a
 * reason.
 */

import gsap from 'gsap'

export const ease = {
  /** Default for anything travelling through space — long tail, no bounce. */
  travel: 'power3.inOut',
  /** Entrances: fast start, settles. */
  enter: 'power2.out',
  /** Exits: gets out of the way. */
  exit: 'power2.in',
  /** For values that should feel mechanical rather than organic. */
  system: 'none',
} as const

export const duration = {
  instant: 0.18,
  quick: 0.36,
  base: 0.6,
  travel: 1.5,
  cinematic: 2.2,
} as const

/** Stagger presets for text and list reveals. */
export const stagger = {
  tight: 0.035,
  base: 0.07,
  loose: 0.12,
} as const

/**
 * Wraps a tween so it collapses to an instant set when the visitor has
 * asked for reduced motion. Call sites stay identical either way.
 */
export function motionSafe<T extends gsap.TweenVars>(
  vars: T,
  reduced: boolean,
): T {
  if (!reduced) return vars
  return { ...vars, duration: 0, delay: 0, ease: 'none', stagger: 0 }
}

/** Kills every tween attached to a target. Used in effect cleanups. */
export function killTweens(target: object | object[]) {
  gsap.killTweensOf(target)
}

export { gsap }
