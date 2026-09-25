/**
 * FIKRI.OS — JOURNEY
 * ------------------------------------------------------------------
 * Career and academic milestones rendered as a vertical 3D arc.
 *
 * Roles, employers, dates, locations and engagement types are taken from
 * Fikri's LinkedIn experience section. Descriptions use only what is
 * actually stated there — where LinkedIn truncates a description behind
 * "…more", the rest is not guessed at, and the entry says what is known.
 *
 * `period` stays null wherever no source states dates. The UI prints
 * "Date not published" rather than inventing one.
 */

import type { SourceId } from './profile'

export type MilestoneKind = 'work' | 'research' | 'education'

export interface Milestone {
  id: string
  /** Short label on the 3D node. */
  code: string
  role: string
  organization: string
  /** e.g. "2022" or "Jun 2022 — Jan 2025". null when not publicly documented. */
  period: string | null
  /** Used to order the arc, earliest first. Derived, not claimed as a date. */
  order: number
  kind: MilestoneKind
  location: string | null
  /** Contract, Full-time, and so on — as stated on LinkedIn. */
  engagement: string | null
  description: string
  /** Verified specifics — rendered as chips. Keep these factual. */
  highlights: string[]
  source: SourceId
  href?: string
  /** Marks a currently held position. */
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
    engagement: null,
    description:
      'Information Systems Department. This is the affiliation registered with IEEE and Crossref for the 2022 CITSM paper, alongside faculty from the same department.',
    highlights: ['Information Systems', 'Data mining', 'Sentiment analysis'],
    source: 'ieee-crossref',
    href: 'https://doi.org/10.1109/CITSM56380.2022.9935990',
  },
  {
    id: 'prima-engineer',
    code: 'DAE',
    role: 'Data Analytic Engineer',
    organization: 'PT Prima Integrasi',
    period: 'Jun 2022 — Jan 2025',
    order: 1,
    kind: 'work',
    location: 'West Jakarta, Jakarta, Indonesia',
    engagement: 'Full-time',
    description:
      'Two years and eight months at an IT consultancy, and the stretch that shaped the rest. This is where the graph work sits: anti-money-laundering analytics implemented on TigerGraph, Oracle APEX applications delivered, and data pipelines built pairing Python and Spark with Informatica.',
    highlights: ['TigerGraph', 'AML analytics', 'Oracle APEX', 'Spark', 'Informatica'],
    source: 'linkedin',
  },
  {
    id: 'citsm-2022',
    code: 'PUB',
    role: 'Co-author — Sentiment analysis research',
    organization: '10th Int. Conference on Cyber and IT Service Management',
    period: 'September 2022',
    order: 2,
    kind: 'research',
    location: 'Yogyakarta, Indonesia',
    engagement: null,
    description:
      'Third author on an IEEE-published study classifying public sentiment toward Kartu Prakerja, Indonesia’s pre-employment card programme, combining a lexicon-based approach with a Support Vector Machine classifier.',
    highlights: ['IEEE', 'SVM', 'Lexicon-based', 'CITSM 2022'],
    source: 'ieee-crossref',
    href: 'https://doi.org/10.1109/CITSM56380.2022.9935990',
  },
  {
    id: 'prima-lead',
    code: 'LEAD',
    role: 'Team Leader, Data Analytic',
    organization: 'PT Prima Integrasi',
    period: 'Aug 2024 — Jan 2025',
    order: 3,
    kind: 'work',
    location: 'Indonesia',
    engagement: 'Full-time · On-site',
    description:
      'Stepped up to lead the data analytics team for the final stretch at Prima Integrasi, while the engineering role continued alongside it. Graph databases and data engineering are the first two skills listed against the position.',
    highlights: ['Graph Databases', 'Data Engineering', 'Team leadership'],
    source: 'linkedin',
  },
  {
    id: 'telkomsel-ts3',
    code: 'TS3',
    role: 'TS3 Data Analyst',
    organization: 'Telkomsel — via Kinarya Alihdaya Mandiri',
    period: 'Feb 2025 — Jan 2026',
    order: 4,
    kind: 'work',
    location: 'Jakarta, Indonesia',
    engagement: 'Contract · Hybrid',
    description:
      'A year as tier-3 technical support data analyst at Indonesia’s largest mobile operator, engaged through Kinarya Alihdaya Mandiri. Third-line work is the escalation point: the problems that the first two tiers could not close.',
    highlights: ['Data Engineering', 'HiveQL', 'Tier-3 support'],
    source: 'linkedin',
  },
  {
    id: 'bank-mandiri',
    code: 'NOW',
    role: 'Data Engineer',
    organization: 'PT Bank Mandiri (Persero) Tbk. — via Lawencon Internasional',
    period: 'Feb 2026 — Present',
    order: 5,
    kind: 'work',
    location: 'West Jakarta, Jakarta, Indonesia',
    engagement: 'Contract · On-site',
    description:
      'Current engagement at one of Indonesia’s largest banks, contracted through Lawencon Internasional. Implemented two new stored procedures and updated six existing ones in Oracle, migrating them from development to production on WFMS (Oracle 19c).',
    highlights: ['PL/SQL', 'Oracle SQL Developer', 'Oracle 19c', 'WFMS'],
    source: 'linkedin',
    current: true,
  },
]

/**
 * Ordered earliest → latest. Both the 3D arc and the DOM cards read this
 * one array, so node three is always card three — reading them from two
 * differently ordered lists is how the two surfaces drift apart.
 */
export const journey = [...experience].sort((a, b) => a.order - b.order)
