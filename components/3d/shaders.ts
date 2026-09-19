/**
 * Point-cloud shaders.
 *
 * Every particle system on the site draws through one of these two
 * programs. Points are shaded procedurally in the fragment stage rather
 * than sampled from a sprite: no texture upload, no filtering cost, and
 * the falloff stays crisp at any pixel ratio.
 *
 * Both programs discard outside the disc before doing any further work,
 * which matters when a few thousand overlapping quads are in flight.
 */

/** Ambient / drifting field. Positions are static; motion lives in the GPU. */
export const driftVertex = /* glsl */ `
  attribute float aSeed;
  attribute float aScale;

  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uDrift;

  varying float vTwinkle;
  varying float vDepth;

  void main() {
    vec3 p = position;

    // Two out-of-phase sines per axis: enough to look unrepeating,
    // cheap enough to run on every point every frame.
    float s = aSeed * 6.2831853;
    p.x += sin(uTime * 0.21 + s) * uDrift;
    p.y += cos(uTime * 0.17 + s * 1.7) * uDrift * 0.7;
    p.z += sin(uTime * 0.13 + s * 2.3) * uDrift;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    vTwinkle = 0.45 + 0.55 * sin(uTime * 0.9 + aSeed * 41.0);
    vDepth = -mv.z;

    // Perspective size attenuation, clamped so near points never become
    // dinner plates and far ones never vanish into sub-pixel shimmer.
    gl_PointSize = clamp(uSize * aScale * uPixelRatio * (14.0 / max(vDepth, 0.001)), 0.6, 26.0);
  }
`

export const pointFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uFogNear;
  uniform float uFogFar;

  varying float vTwinkle;
  varying float vDepth;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d2 = dot(c, c);
    if (d2 > 0.25) discard;

    // Soft core with a long tail — reads as light rather than a sticker.
    float alpha = smoothstep(0.25, 0.008, d2);
    float fog = 1.0 - smoothstep(uFogNear, uFogFar, vDepth);

    gl_FragColor = vec4(uColor, alpha * vTwinkle * uOpacity * fog);
    if (gl_FragColor.a < 0.004) discard;
  }
`

/**
 * Morphing cloud. Interpolates each point between two stored positions,
 * which is how the profile figure assembles from, and disperses into,
 * a diffuse cloud.
 *
 * `uMorph` 0 = formed silhouette, 1 = fully dispersed.
 */
export const morphVertex = /* glsl */ `
  attribute vec3 aScatter;
  attribute float aSeed;
  attribute float aScale;

  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uMorph;
  uniform vec3 uPointer;
  uniform float uPointerStrength;

  varying float vTwinkle;
  varying float vDepth;
  varying float vEnergy;

  void main() {
    // Per-point offset staggers the transition so the form doesn't
    // snap as one rigid body — it assembles.
    float stagger = smoothstep(0.0, 1.0, clamp(uMorph * 1.6 - aSeed * 0.6, 0.0, 1.0));
    vec3 p = mix(position, aScatter, stagger);

    float s = aSeed * 6.2831853;
    p.x += sin(uTime * 0.6 + s) * 0.035;
    p.y += cos(uTime * 0.5 + s * 1.4) * 0.035;

    // Cursor repulsion, falling off over a fixed radius so the effect is
    // local — the figure reacts where you point, not everywhere.
    vec3 toPointer = p - uPointer;
    float dist = length(toPointer);
    float push = uPointerStrength * exp(-dist * dist * 0.28);
    p += normalize(toPointer + 0.0001) * push;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    vTwinkle = 0.5 + 0.5 * sin(uTime * 1.3 + aSeed * 33.0);
    vEnergy = clamp(push * 2.2, 0.0, 1.0);
    vDepth = -mv.z;

    gl_PointSize = clamp(
      uSize * aScale * uPixelRatio * (14.0 / max(vDepth, 0.001)) * (1.0 + vEnergy * 0.8),
      0.6,
      30.0
    );
  }
`

/** Fragment for the morph cloud — brightens where the cursor disturbs it. */
export const morphFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uOpacity;
  uniform float uFogNear;
  uniform float uFogFar;

  varying float vTwinkle;
  varying float vDepth;
  varying float vEnergy;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d2 = dot(c, c);
    if (d2 > 0.25) discard;

    float alpha = smoothstep(0.25, 0.008, d2);
    float fog = 1.0 - smoothstep(uFogNear, uFogFar, vDepth);
    vec3 col = mix(uColor, uAccent, vEnergy);

    gl_FragColor = vec4(col, alpha * vTwinkle * uOpacity * fog);
    if (gl_FragColor.a < 0.004) discard;
  }
`

/**
 * Data flowing along a path. Each point carries its own offset along a
 * polyline supplied as a uniform array, so one draw call animates the
 * whole research pipeline.
 */
export const flowVertex = /* glsl */ `
  attribute float aOffset;   // 0..1 starting position along the path
  attribute float aLane;     // -1..1 lateral spread
  attribute float aSeed;
  attribute float aSpeed;

  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uSpeed;
  uniform float uSpan;       // total path length in world units
  uniform float uGate;       // 0..1 — how far along the pipeline is "open"

  varying float vTwinkle;
  varying float vDepth;
  varying float vProgress;

  void main() {
    // The gate scales the travelled length rather than clipping it.
    // Clamping with min() would stack every point that has run past the
    // gate onto the same coordinate — a wall of particles at the cut
    // instead of a stream. Scaling keeps them evenly spread through
    // however much of the pipeline is open.
    float t = fract(aOffset + uTime * uSpeed * aSpeed) * uGate;
    vProgress = t;

    vec3 p;
    p.x = (t - 0.5) * uSpan;
    // Lanes converge slightly at each stage boundary, which reads as
    // data being funnelled through a transform.
    float pinch = 0.55 + 0.45 * cos(t * 6.2831853 * 4.0);
    p.y = aLane * 1.05 * pinch + sin(uTime * 0.8 + aSeed * 20.0) * 0.08;
    p.z = sin(aSeed * 6.2831853) * 1.05 * pinch;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    vTwinkle = 0.55 + 0.45 * sin(uTime * 2.0 + aSeed * 25.0);
    vDepth = -mv.z;
    gl_PointSize = clamp(uSize * uPixelRatio * (14.0 / max(vDepth, 0.001)), 0.8, 22.0);
  }
`

/**
 * Fragment for the flow: raw data enters neutral and leaves carrying the
 * colour of its sentiment class, which is the whole point of the section.
 */
export const flowFragment = /* glsl */ `
  uniform vec3 uRaw;
  uniform vec3 uAccent;
  uniform vec3 uPositive;
  uniform vec3 uNegative;
  uniform float uOpacity;
  uniform float uFogNear;
  uniform float uFogFar;

  varying float vTwinkle;
  varying float vDepth;
  varying float vProgress;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d2 = dot(c, c);
    if (d2 > 0.25) discard;

    // Neutral grey until the classifier stage, then split toward the
    // sentiment colours. The split is deterministic per point.
    vec3 col = mix(uRaw, uAccent, smoothstep(0.18, 0.62, vProgress));
    float side = step(0.5, fract(vTwinkle * 7.3));
    vec3 outcome = mix(uNegative, uPositive, side);
    col = mix(col, outcome, smoothstep(0.72, 0.97, vProgress));

    float alpha = smoothstep(0.25, 0.01, d2);
    float fog = 1.0 - smoothstep(uFogNear, uFogFar, vDepth);

    gl_FragColor = vec4(col, alpha * vTwinkle * uOpacity * fog);
    if (gl_FragColor.a < 0.004) discard;
  }
`
