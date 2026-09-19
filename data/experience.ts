/**
 * FIKRI.OS — JOURNEY
 * ------------------------------------------------------------------
 * Career and academic milestones rendered as an orbital 3D timeline.
 *
 * `period` is null wherever no public source states dates. The UI
 * renders null periods as "DATE NOT PUBLISHED" rather than guessing.
 * If you know the real dates, fill them in — nothing else changes.
 */

import type { SourceId } from './profile'

export type MilestoneKind = 'work' | 'research' | 'education'

export interface Milestone {
  id: string
  /** Short label on the 3D node. */
  code: string
  role: string
  organization: string
  /** e.g. "2022" or "2021 — 2023". null when not publicly documented. */
  period: string | null
  /** Used to order the orbit. Lower = earlier. Derived, not claimed as a date. */
  order: number
  kind: MilestoneKind
  location: string | null
  description: string
  /** Verified specifics — rendered as chips. Keep these factual. */
  highlights: string[]
  source: SourceId
  href?: string
  /** Marks the node currently held. */
  current?: boolean
}

export const experience: Milestone[] = [
  {
    id: 'uin-is',
    code: 'EDU',
    role: 'Information Systems',
    organization: 'UIN Syarif Hidayatullah Jakarta',
    period: null,
    order: 0,
    kind: 'education',
    location: 'Jakarta, Indonesia',
    description:
      'Information Systems Department. This is the affiliation registered with IEEE and Crossref for the 2022 CITSM paper, alongside faculty from the same department.',
    highlights: ['Information Systems', 'Data mining', 'Sentiment analysis'],
    source: 'ieee-crossref',
    href: 'https://doi.org/10.1109/CITSM56380.2022.9935990',
  },
  {
    id: 'citsm-2022',
    code: 'PUB',
    role: 'Co-author — Sentiment analysis research',
    organization: '10th Int. Conference on Cyber and IT Service Management',
    period: 'September 2022',
    order: 1,
    kind: 'research',
    location: 'Yogyakarta, Indonesia',
    description:
      'Third author on an IEEE-published study classifying public sentiment toward Kartu Prakerja, Indonesia\u2019s pre-employment card programme, combining a lexicon-based approach with a Support Vector Machine classifier.',
    highlights: ['IEEE', 'SVM', 'Lexicon-based', 'CITSM 2022'],
    source: 'ieee-crossref',
    href: 'https://doi.org/10.1109/CITSM56380.2022.9935990',
  },
  {
    id: 'analytics-lead',
    code: 'LEAD',
    role: 'Team Lead, Data Analytics',
    organization: 'IT consultancy',
    period: null,
    order: 2,
    kind: 'work',
    location: 'Jakarta, Indonesia',
    description:
      'Led a data analytics team at an IT consultancy. Implemented anti-money-laundering analytics on the TigerGraph graph database, delivered Oracle APEX applications, and built data pipelines pairing Python and Spark with Informatica.',
    highlights: ['TigerGraph', 'AML analytics', 'Oracle APEX', 'Spark', 'Informatica'],
    source: 'github-profile',
    href: 'https://github.com/ebola1997',
  },
  {
    id: 'bank-mandiri',
    code: 'NOW',
    role: 'Data Engineer',
    organization: 'Bank Mandiri — via Lawencon International',
    period: null,
    order: 3,
    kind: 'work',
    location: 'Jakarta, Indonesia',
    description:
      'Current engagement. Works on Oracle stored procedures and ETL flows in DataStage for one of Indonesia\u2019s largest banks.',
    highlights: ['Oracle PL/SQL', 'ETL DataStage', 'Banking data'],
    source: 'github-profile',
    href: 'https://github.com/ebola1997',
    current: true,
  },
]

/** Ordered earliest → latest, used by both the 3D orbit and the DOM list. */
export const journey = [...experience].sort((a, b) => a.order - b.order)
