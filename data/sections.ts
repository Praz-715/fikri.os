/**
 * FIKRI.OS — SECTION MAP
 * ------------------------------------------------------------------
 * One list drives navigation, the boot sequence, the system status
 * panel, the scroll observer and the 3D camera anchors. Reorder here
 * and everything follows.
 *
 * `anchor` is the camera's resting position in world space; `look` is
 * what it points at. Each 3D module lives at its own coordinates, so
 * moving between sections is genuine travel through one world rather
 * than a cross-fade between separate scenes.
 */

export type SectionId =
  | 'profile'
  | 'journey'
  | 'research'
  | 'knowledge'
  | 'projects'
  | 'contact'

export interface SectionDef {
  id: SectionId
  index: string
  label: string
  /** Shown under the label in the nav rail. */
  kicker: string
  /** Boot sequence line. */
  bootLabel: string
  anchor: [number, number, number]
  look: [number, number, number]
}

export const sections: SectionDef[] = [
  {
    id: 'profile',
    index: '01',
    label: 'PROFILE',
    kicker: 'Who is Fikri',
    bootLabel: 'Loading profile',
    anchor: [0, 0.6, 15],
    look: [0, 0, 0],
  },
  {
    id: 'journey',
    index: '02',
    label: 'JOURNEY',
    kicker: 'Career orbit',
    bootLabel: 'Loading experience',
    anchor: [60, 0, 23],
    look: [60, 0, -2],
  },
  {
    id: 'research',
    index: '03',
    label: 'RESEARCH',
    kicker: 'Data in motion',
    bootLabel: 'Loading research',
    anchor: [0, 2, -42],
    look: [0, 0, -72],
  },
  {
    id: 'knowledge',
    index: '04',
    label: 'KNOWLEDGE',
    kicker: 'What he knows',
    bootLabel: 'Loading knowledge graph',
    anchor: [-60, 4, 38],
    look: [-60, 0, 0],
  },
  {
    id: 'projects',
    index: '05',
    label: 'PROJECTS',
    kicker: 'Built and published',
    bootLabel: 'Loading projects',
    anchor: [0, 1, 100],
    look: [0, 0, 70],
  },
  {
    id: 'contact',
    index: '06',
    label: 'CONTACT',
    kicker: 'Connect',
    bootLabel: 'Loading contact',
    anchor: [0, 44, 22],
    look: [0, 44, 0],
  },
]

export const sectionIds = sections.map((s) => s.id)
