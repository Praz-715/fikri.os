/**
 * FIKRI.OS — PROJECTS
 * ------------------------------------------------------------------
 * Every entry here is a real, public artefact: either a repository on
 * github.com/ebola1997 or the IEEE-published paper. Descriptions are
 * drawn from the repository's own description, its language, and the
 * capabilities Fikri lists on his profile.
 *
 * NOTE ON SCOPE: Fikri states on his GitHub profile that "some repos
 * are private because they involve work that is NDA-compliant". The
 * public set below is therefore a sample, not a complete body of work.
 * That is said plainly in the UI rather than padded with invented
 * projects.
 *
 * `shape` selects which generative 3D world represents the project.
 */

export type ProjectShape = 'graph' | 'flow' | 'lattice' | 'orbit' | 'grid'

export interface Project {
  id: string
  index: string
  title: string
  /** One-line summary shown on the card. */
  tagline: string
  /** Where it lives / what it belongs to. */
  context: string
  role: string
  technology: string[]
  methodology: string | null
  /** What it produced. Only what can be evidenced. */
  outcome: string
  year: string
  href: string
  hrefLabel: string
  shape: ProjectShape
  /** Highlighted as the flagship item. */
  featured?: boolean
}

export const projects: Project[] = [
  {
    id: 'kartu-prakerja',
    index: '01',
    title: 'Sentiment Analysis — Kartu Prakerja',
    tagline:
      'Lexicon-based scoring paired with an SVM classifier to measure public response to a national employment programme.',
    context:
      'Research conducted in the Information Systems Department at UIN Syarif Hidayatullah Jakarta and published by IEEE at CITSM 2022.',
    role: 'Co-author (third of five)',
    technology: ['Python', 'Support Vector Machine', 'Sentiment lexicon', 'Twitter corpus'],
    methodology:
      'Crawling → preprocessing (cleaning, lemmatization, stemming, tokenizing, stopword removal) → lexicon weighting → SVM classification with 10-fold cross validation.',
    outcome:
      '940 tweets classified into 330 positive, 308 neutral and 302 negative. Reported average accuracy 98.75% with precision, recall and f-measure of 0.98 on that dataset.',
    year: '2022',
    href: 'https://doi.org/10.1109/CITSM56380.2022.9935990',
    hrefLabel: 'Read on IEEE Xplore',
    shape: 'flow',
    featured: true,
  },
  {
    id: 'tigergraph-sql',
    index: '02',
    title: 'TigerGraphSQL',
    tagline: 'A working set of GSQL queries for the TigerGraph graph database.',
    context:
      'Public repository. Sits alongside the anti-money-laundering work Fikri describes as implementing on TigerGraph.',
    role: 'Author',
    technology: ['TigerGraph', 'GSQL', 'Graph databases'],
    methodology: 'Graph query design — traversals and pattern matching expressed in GSQL.',
    outcome: 'An openly readable reference for writing graph traversals against TigerGraph.',
    year: '2022',
    href: 'https://github.com/ebola1997/TigerGraphSQL',
    hrefLabel: 'View repository',
    shape: 'graph',
  },
  {
    id: 'tigergraph-kafka',
    index: '03',
    title: 'TigerGraph × Kafka',
    tagline: 'Streaming ingestion into a graph database.',
    context:
      'Public repository connecting a Kafka stream to TigerGraph — the moving end of the graph analytics work.',
    role: 'Author',
    technology: ['TigerGraph', 'Apache Kafka', 'Streaming ingestion'],
    methodology: 'Event stream feeding a graph store, so the graph reflects data as it arrives.',
    outcome: 'A reference wiring for continuous loading rather than batch import.',
    year: '2021–2022',
    href: 'https://github.com/ebola1997/TigerGraph-Kafka',
    hrefLabel: 'View repository',
    shape: 'lattice',
  },
  {
    id: 'belajar',
    index: '04',
    title: 'Belajar — Data Mining Notebooks',
    tagline:
      'A long-running notebook collection covering preprocessing, modelling, algorithms and visualisation.',
    context:
      'Public repository, first committed in 2020 and still receiving commits in 2025 — the longest-running item in the public set.',
    role: 'Author',
    technology: ['Jupyter Notebook', 'Python', 'pandas', 'scikit-learn', 'Seaborn'],
    methodology:
      'Worked examples across the data mining sequence: preprocessing, modelling, algorithm comparison, visualisation.',
    outcome: 'An open, continuously extended body of practice notebooks.',
    year: '2020 — present',
    href: 'https://github.com/ebola1997/Belajar',
    hrefLabel: 'View repository',
    shape: 'grid',
  },
  {
    id: 'freedata',
    index: '05',
    title: 'FreeData',
    tagline: 'Automation for crawling source data.',
    context:
      'Public repository described by its author as "my automation crawling code" — the collection stage that a sentiment pipeline depends on.',
    role: 'Author',
    technology: ['Python', 'Automation', 'Web crawling'],
    methodology: 'Scheduled retrieval of source data into a workable local corpus.',
    outcome: 'Reusable collection tooling feeding downstream analysis.',
    year: '2022',
    href: 'https://github.com/ebola1997/FreeData',
    hrefLabel: 'View repository',
    shape: 'orbit',
  },
  {
    id: 'covid-project',
    index: '06',
    title: 'Covid-Project',
    tagline: 'Pandemic data analysis written in R.',
    context: 'Public repository — analysis work in R rather than Python.',
    role: 'Author',
    technology: ['R', 'Statistical analysis', 'Data visualisation'],
    methodology: null,
    outcome: 'An analysis of COVID-19 data published openly.',
    year: '2022',
    href: 'https://github.com/ebola1997/Covid-Project',
    hrefLabel: 'View repository',
    shape: 'grid',
  },
  {
    id: 'chatbot',
    index: '07',
    title: 'Chatbot',
    tagline: 'Conversational model experiments in notebook form.',
    context:
      'Public repository begun in late 2024 and updated through 2025 — the most recent public work, alongside experiments with Milvus and GraphRAG.',
    role: 'Author',
    technology: ['Jupyter Notebook', 'Python', 'Language models'],
    methodology: null,
    outcome: 'Exploratory work extending the graph and retrieval background toward language models.',
    year: '2024 — 2025',
    href: 'https://github.com/ebola1997/Chatbot',
    hrefLabel: 'View repository',
    shape: 'orbit',
  },
]

export const projectsNote =
  'Public repositories and published research. Fikri notes on his GitHub profile that some repositories stay private because the work is NDA-bound, so this is a sample of his output rather than a full record.'
