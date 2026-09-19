# FIKRI.OS

An interactive 3D portfolio for **Fikri Rama Singgih** — Data Analytics Engineer, Jakarta.

Built as a digital environment rather than a page: a single Three.js world in which each
section of the portfolio occupies its own address, and navigating means travelling between
them. The 3D exists to carry information — a particle figure for the profile, an arc of
career milestones, a live rendering of the published sentiment-analysis pipeline, an
explorable knowledge graph, and a generated structure per project.

```
Next.js 16 · React 19 · TypeScript · Three.js · @react-three/fiber · drei · GSAP · Tailwind 4
```

---

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

---

## Editing the content

**All profile information lives in `data/`. No 3D component reads anything else.** You can
rewrite every fact on the site without opening a component.

| File | Holds |
| --- | --- |
| `data/profile.ts` | Name, title, summary, location, education, contact links, source list |
| `data/experience.ts` | Career and academic milestones (the 3D arc + the cards) |
| `data/research.ts` | The CITSM 2022 paper: metadata, pipeline stages, figures |
| `data/projects.ts` | Projects and repositories, and which 3D form represents each |
| `data/skills.ts` | Every node and cluster in the knowledge graph |
| `data/sections.ts` | Section order, labels, and each one's camera position |

Adding a project means adding an object to `data/projects.ts` and choosing a `shape`
(`graph`, `flow`, `lattice`, `orbit`, `grid`) — the 3D world is generated from it. Reordering
sections means reordering `data/sections.ts`; navigation, the boot sequence, the status panel
and the camera all follow.

### The provenance rule

Every factual claim on this site is traceable to a public source, and each data entry records
which one in a `source` field. Nothing is inferred, rounded or filled in.

| Source | Used for |
| --- | --- |
| [github.com/ebola1997](https://github.com/ebola1997) — Fikri's own profile | Title, current and previous roles, specialisms, toolset, email, social links |
| [DOI 10.1109/CITSM56380.2022.9935990](https://doi.org/10.1109/CITSM56380.2022.9935990) — IEEE / Crossref | Publication metadata, author order, university affiliation, every research figure |
| [Public repositories](https://github.com/ebola1997?tab=repositories) | Projects, their stacks and their dates |

The GitHub account is confirmed as Fikri's: its profile README carries the same LinkedIn URL
as the brief. LinkedIn itself returns HTTP 999 to automated requests, so nothing was scraped
from it — the affiliation and roles come from the sources above instead.

Where a public source states no date, the data file holds `null` and the UI prints
"Date not published" rather than guessing. Two places are worth filling in if you know them:
`profile.education[0].degree` and `.years`, and the `period` on each milestone in
`data/experience.ts`.

The research figures (940 tweets; 330/308/302; 98.75% accuracy) are quoted verbatim from the
paper's abstract and are shown next to `research.caveat`, which states that they describe
that dataset and are not a general claim. Please keep that pairing if you edit the section.

---

## How it is put together

```
app/
  layout.tsx          fonts, metadata, Person JSON-LD
  page.tsx            mounts SystemProvider → Shell
  globals.css         design tokens, typography, surfaces, reduced-motion
components/
  Shell.tsx           boot gate, lazy 3D mount, section order
  3d/
    Scene.tsx         the single <Canvas>, quality budget, frame-rate guard
    CameraRig.tsx     GSAP travel between sections, parallax, view offset
    layout.ts         world coordinates for every module
    shaders.ts        three point-cloud programs (drift, morph, flow)
    AmbientField      the medium the world sits in
    ProfileForm       the particle figure
    JourneyOrbit      the career arc
    DataFlow          the research pipeline
    KnowledgeGraph    instanced nodes + edges, drag to rotate
    ProjectWorlds     one generated structure per project
    Convergence       the closing gather
  sections/           the DOM content for each section
  ui/                 Navigation, SystemStatus, ProjectModal, Section shell
lib/
  system.tsx          section state, quality tier, pointer, reduced motion
  store.ts            hover/selection bus shared by the DOM and the canvas
  quality.ts          device tiers and particle budgets
  three.ts            layout maths, the human-form sampler, the palette
  hooks.ts            scroll observer, reveal, keyboard nav, tab visibility
  animations.ts       shared durations and easings
```

### Three decisions worth knowing

**One canvas, one world.** Every module lives at its own coordinates in a single scene, so
moving between sections is genuine camera travel, not a cross-fade between separate scenes.
Only the active module does real work; the rest damp down to a dim, static state.

**The DOM is the content; the 3D is the telling.** Every fact rendered in 3D is also present
as semantic HTML. With WebGL unavailable the canvas never mounts and the site remains
complete and fully readable — that path is tested, not theoretical.

**Hover state is shared, not duplicated.** `lib/store.ts` is a small external store, so
hovering a card lights its node and hovering the node lights the card without either tree
re-rendering the other. A React context here would push an update through every consumer on
every mouse move.

---

## Performance

Measured on the production build at 1440×900, Chrome:

- **148 KB** of JavaScript on first load. Three.js, drei and R3F are a dynamic import that is
  fetched only when someone enters the system — **+270 KB**, and never at all for a visitor
  who does not, or whose device has no WebGL.
- **60 fps** in every section, including the knowledge graph while being dragged.

How it is kept there:

- Particle counts, pixel ratio, antialiasing and project-world animation all read from a
  device tier resolved in `lib/quality.ts` (low / mid / high, re-resolved on resize).
- A frame-rate guard samples over three seconds after a one-second grace period, and drops a
  tier only on a sustained bad average — a single stall never costs anyone their detail.
- The render loop stops entirely (`frameloop="never"`) while the tab is hidden.
- The knowledge graph is two draw calls: one `InstancedMesh`, one `LineSegments`. Highlighting
  a selection writes to instance buffers rather than swapping forty materials, and runs on
  selection change, never per frame.
- No post-processing. The scene is authored in additive light on near-black, which is cheaper
  than bloom and avoids everything glowing at once.
- Decorative objects opt out of raycasting; project worlds use a single invisible sphere as a
  hit target instead of testing their own geometry.
- Geometries created in components are disposed in the matching effect cleanup.

---

## Accessibility

- Semantic sectioning throughout; the navigation moves focus to the section heading, not just
  the scroll position.
- The boot screen and the project detail are native `<dialog>` elements opened with
  `showModal()`, so the browser makes the rest of the document genuinely inert. `aria-modal`
  on a styled `<div>` would only claim that.
- Keyboard: `↑ ↓ ← →` or `j`/`k` move between sections, `1`–`6` jump directly, and the keys
  are ignored while a field has focus or a dialog is open. Every 3D interaction has a DOM
  equivalent — the knowledge graph can be driven entirely from the list beneath it.
- `prefers-reduced-motion` collapses transitions, stops the camera drift, the particle drift
  and the caret, and shows the boot sequence complete on arrival.
- Focus is always visible and never removed. Text meets contrast over the scene via a
  two-layer scrim that reorients on narrow screens.
- Colour is never the only signal: the active nav item carries `aria-current`, selections
  carry `aria-pressed`, and the sentiment chart has a text label describing every value.

---

## Responsive behaviour

| Width | Behaviour |
| --- | --- |
| `≥1024px` | Full scene. Content sits in a left column; the camera's view offset pushes the whole world right to sit beside it. Vertical nav rail, system status panel. |
| `768–1023px` | Reduced particle counts, no view offset — the scene centres behind full-width content. |
| `<768px` | Lowest tier: ~700 ambient particles, capped pixel ratio, no antialiasing, project worlds animate only on hover. Compact bottom nav showing numbers, expanding only the current section's name. |

---

## Deploying

Static output, no server runtime or environment variables:

```bash
npm run build && npm start
```

It deploys to Vercel, Netlify or any Node host as-is.
