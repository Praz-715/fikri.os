/**
 * FIKRI.OS — PROFILE
 * ------------------------------------------------------------------
 * Single source of truth for identity, contact and summary copy.
 * Edit this file to update the site. No 3D component reads anything
 * other than what is exported from `data/`.
 *
 * PROVENANCE RULE: every factual claim below is traceable to a public,
 * first-party or publisher-registered source, recorded in `source`.
 * If you add a claim, add its source too. Do not add unverifiable
 * numbers, awards, client names or metrics.
 */

export type SourceId = 'github-profile' | 'ieee-crossref' | 'linkedin' | 'authored'

export interface ProfileLink {
  id: string
  label: string
  /** Shown under the label in the contact section. */
  handle: string
  href: string
  source: SourceId
  /** Primary links get visual emphasis in the Contact section. */
  primary?: boolean
}

export const profile = {
  name: 'Fikri Rama Singgih',
  /** Rendered as three stacked editorial lines in the Profile section. */
  nameLines: ['FIKRI', 'RAMA', 'SINGGIH'],
  shortName: 'Fikri',

  /** Self-described on his public GitHub profile. */
  title: 'Data Analytics Engineer',
  /** Current engagement, per LinkedIn. */
  subtitle: 'Data Engineer — Bank Mandiri via Lawencon Internasional',

  location: 'Jakarta, Indonesia',

  /** Self-authored taglines from his public GitHub profile README. */
  tagline: 'Clean data, powerful insights.',
  motto: 'Why make it complex when you can simplify it?',

  /**
   * Summary assembled strictly from statements Fikri published himself
   * (GitHub profile README, LinkedIn experience) plus his IEEE-registered
   * affiliation. No invented metrics, no invented scope.
   */
  summary:
    'Data Analytics Engineer based in Jakarta, working across the full path from raw source systems to the query that answers a question. Currently a Data Engineer at Bank Mandiri, contracted through Lawencon Internasional, on Oracle stored procedures and ETL DataStage. Before that, a year as tier-3 data analyst at Telkomsel, and nearly three years at the consultancy PT Prima Integrasi — the last six months leading its data analytics team — implementing anti-money-laundering analytics on TigerGraph, building Oracle APEX applications, and assembling pipelines with Python, Spark and Informatica.',

  /** Short version used in the boot sequence and meta description. */
  summaryShort:
    'Data Analytics Engineer in Jakarta. Banking and telco data engineering, graph databases, and sentiment analysis research published with IEEE.',

  /** Rendered as small labelled facts beside the profile particle form. */
  facts: [
    { label: 'ROLE', value: 'Data Analytics Engineer', source: 'github-profile' as SourceId },
    { label: 'BASE', value: 'Jakarta, Indonesia', source: 'github-profile' as SourceId },
    // Derived from the earliest dated role on LinkedIn (Jun 2022), not an
    // estimate — if the dates change, this line changes with them.
    { label: 'WORKING SINCE', value: '2022', source: 'linkedin' as SourceId },
    { label: 'PUBLISHED', value: 'IEEE CITSM 2022', source: 'ieee-crossref' as SourceId },
  ],

  /**
   * Education. Affiliation is the one registered with Crossref/IEEE for
   * the 2022 CITSM paper — i.e. publisher-verified, not self-reported.
   * Degree level and graduation year are deliberately omitted because no
   * public source states them. Fill them in if you know them.
   */
  education: [
    {
      institution: 'Universitas Islam Negeri Syarif Hidayatullah Jakarta',
      shortName: 'UIN Syarif Hidayatullah Jakarta',
      department: 'Information Systems Department',
      location: 'Jakarta, Indonesia',
      /** null = not publicly documented. The UI renders these as "—". */
      degree: null as string | null,
      years: null as string | null,
      source: 'ieee-crossref' as SourceId,
    },
  ],

  links: [
    {
      id: 'linkedin',
      label: 'LinkedIn',
      handle: 'fikri-rama-singgih',
      href: 'https://www.linkedin.com/in/fikri-rama-singgih/',
      source: 'linkedin',
      primary: true,
    },
    {
      id: 'email',
      label: 'Email',
      handle: 'fikrirama79@gmail.com',
      href: 'mailto:fikrirama79@gmail.com',
      source: 'github-profile',
      primary: true,
    },
    {
      id: 'github',
      label: 'GitHub',
      handle: 'ebola1997',
      href: 'https://github.com/ebola1997',
      source: 'github-profile',
    },
    {
      id: 'ieee',
      label: 'IEEE Xplore',
      handle: 'Author profile',
      href: 'https://ieeexplore.ieee.org/author/37089595590',
      source: 'ieee-crossref',
    },
    {
      id: 'x',
      label: 'X / Twitter',
      handle: '@pikrirama',
      href: 'https://twitter.com/pikrirama',
      source: 'github-profile',
    },
  ] satisfies ProfileLink[],

  /** Where each `source` id came from — surfaced in the UI provenance note. */
  sources: {
    'github-profile': {
      label: 'Self-published GitHub profile',
      href: 'https://github.com/ebola1997',
    },
    'ieee-crossref': {
      label: 'IEEE / Crossref publication record',
      href: 'https://doi.org/10.1109/CITSM56380.2022.9935990',
    },
    linkedin: {
      label: 'LinkedIn profile',
      href: 'https://www.linkedin.com/in/fikri-rama-singgih/',
    },
    authored: {
      label: 'Editorial copy written for this site',
      href: null as string | null,
    },
  },
} as const

export type Profile = typeof profile
