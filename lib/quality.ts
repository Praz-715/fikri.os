/**
 * Device capability tiers.
 *
 * Everything expensive in the 3D scene reads its budget from here rather
 * than hard-coding a count, so a phone never gets asked to draw a desktop
 * scene. Tiers are resolved once on mount and re-resolved on resize
 * (orientation change, window drag between monitors).
 */

export type QualityTier = 'low' | 'mid' | 'high'

export interface QualityBudget {
  tier: QualityTier
  /** Ambient starfield particle count. */
  ambient: number
  /** Points composing the profile figure. */
  profile: number
  /** Particles travelling the research pipeline. */
  flow: number
  /** Particles converging in the contact scene. */
  converge: number
  /** Max device pixel ratio the renderer is allowed to use. */
  dpr: [number, number]
  /** Antialiasing costs real frames on weak GPUs. */
  antialias: boolean
  /** Whether project worlds animate all at once or only the hovered one. */
  eagerProjectWorlds: boolean
  /** Whether connection lines between knowledge nodes are drawn. */
  graphEdges: boolean
}

const BUDGETS: Record<QualityTier, Omit<QualityBudget, 'tier'>> = {
  low: {
    ambient: 700,
    profile: 2200,
    flow: 240,
    converge: 500,
    dpr: [1, 1.5],
    antialias: false,
    eagerProjectWorlds: false,
    graphEdges: true,
  },
  mid: {
    ambient: 1800,
    profile: 4800,
    flow: 520,
    converge: 1100,
    dpr: [1, 1.75],
    antialias: true,
    eagerProjectWorlds: false,
    graphEdges: true,
  },
  high: {
    ambient: 4000,
    profile: 9000,
    flow: 900,
    converge: 2200,
    dpr: [1, 2],
    antialias: true,
    eagerProjectWorlds: true,
    graphEdges: true,
  },
}

/** Resolved on the client only — never call during SSR. */
export function detectTier(): QualityTier {
  if (typeof window === 'undefined') return 'mid'

  const width = window.innerWidth
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency ?? 4
  // deviceMemory is Chromium-only; absence is not evidence of a weak device.
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory

  if (width < 768 || (coarse && width < 1024)) return 'low'
  if (cores <= 4 || (memory !== undefined && memory <= 4)) return 'low'
  if (width < 1280 || coarse || cores <= 8) return 'mid'
  return 'high'
}

export function budgetFor(tier: QualityTier): QualityBudget {
  return { tier, ...BUDGETS[tier] }
}

/**
 * A scale applied on top of the budget once we observe the scene actually
 * running slowly. Lets a mid-tier phone that turns out to be a fast one
 * keep its detail while a stuttering laptop sheds some.
 */
export function degrade(tier: QualityTier): QualityTier {
  return tier === 'high' ? 'mid' : 'low'
}

/** Cheap WebGL support probe. Runs once; the context is released immediately. */
export function hasWebGL(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl')
    if (!gl) return false
    const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')
    lose?.loseContext()
    return true
  } catch {
    return false
  }
}
