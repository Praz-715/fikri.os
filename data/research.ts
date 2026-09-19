/**
 * FIKRI.OS — RESEARCH
 * ------------------------------------------------------------------
 * All metadata and every number below is taken verbatim from the
 * publisher record (Crossref) and the paper's own abstract. Nothing is
 * rounded, restated or extrapolated.
 *
 * DOI: 10.1109/CITSM56380.2022.9935990
 */

export interface PipelineStage {
  id: string
  label: string
  /** One line explaining what happens at this stage, per the abstract. */
  detail: string
  /** Sub-steps, where the abstract enumerates them. */
  steps?: string[]
}

export interface ResearchMetric {
  label: string
  value: string
  /** Optional 0–1 value that drives the bar / ring visual. */
  ratio?: number
  note?: string
}

export const research = {
  title:
    'Support Vector Machine and Lexicon based Sentiment Analysis on Kartu Prakerja (Indonesia Pre-Employment Cards Government Initiatives)',
  shortTitle: 'Sentiment Analysis on Kartu Prakerja',

  year: 2022,
  date: '20–21 September 2022',

  venue: '10th International Conference on Cyber and IT Service Management (CITSM)',
  venueShort: 'IEEE CITSM 2022',
  venueLocation: 'Yogyakarta, Indonesia',
  publisher: 'IEEE',
  pages: '01–06',

  doi: '10.1109/CITSM56380.2022.9935990',
  doiUrl: 'https://doi.org/10.1109/CITSM56380.2022.9935990',
  ieeeUrl: 'https://ieeexplore.ieee.org/document/9935990/',

  /** Author order exactly as registered with Crossref. */
  authors: [
    { name: 'Bayu Waspodo', self: false },
    { name: 'Qurrotul Aini', self: false },
    { name: 'Fikri Rama Singgih', self: true },
    { name: 'Rinda Hesti Kusumaningtyas', self: false },
    { name: 'Elvi Fetrina', self: false },
  ],

  affiliation:
    'Universitas Islam Negeri Syarif Hidayatullah Jakarta, Information Systems Department, Jakarta, Indonesia',

  methodology: [
    'Lexicon-based scoring (unsupervised)',
    'Support Vector Machine (supervised)',
    '10-fold cross validation for cost selection',
  ],

  /**
   * Framing paragraph. Paraphrased from the published abstract without
   * adding claims the abstract does not make.
   */
  abstract:
    'The study classifies public response to Kartu Prakerja, an Indonesian government programme providing assistance to people without work. Sentiment is derived from textual data to establish the public view of the policy. Weighting is based on matching text against a normalised sentiment lexicon, scaled to assign positive, neutral and negative classes; a Support Vector Machine is then trained and evaluated on the labelled set.',

  context:
    'Kartu Prakerja reached 11.4 million recipients across 2020–2021 according to the Central Statistics Agency figures cited in the paper. Public opinion on the programme was divided, and that split is what the study set out to measure.',

  /** The pipeline visualised in 3D. Stages are the paper's own stages. */
  pipeline: [
    {
      id: 'crawl',
      label: 'CRAWLING',
      detail: 'Tweets collected as the raw corpus.',
    },
    {
      id: 'preprocess',
      label: 'PREPROCESSING',
      detail: 'Raw text normalised into comparable tokens.',
      steps: ['Cleaning', 'Lemmatization', 'Stemming', 'Tokenizing', 'Stopword removal'],
    },
    {
      id: 'lexicon',
      label: 'LEXICON WEIGHTING',
      detail:
        'Tokens matched against a normalised sentiment lexicon and scaled into positive, neutral and negative classes.',
    },
    {
      id: 'svm',
      label: 'SVM CLASSIFIER',
      detail:
        'Supervised classification, with the cost parameter selected using 10-fold cross validation.',
    },
    {
      id: 'sentiment',
      label: 'SENTIMENT',
      detail: 'Labelled output and visualisation of the distribution.',
    },
  ] satisfies PipelineStage[],

  /** Corpus size, verbatim from the abstract. */
  corpus: { label: 'Tweets classified', value: 940 },

  /** Class distribution, verbatim from the abstract. */
  distribution: [
    { id: 'positive', label: 'POSITIVE', count: 330, percent: 35 },
    { id: 'neutral', label: 'NEUTRAL', count: 308, percent: 33 },
    { id: 'negative', label: 'NEGATIVE', count: 302, percent: 32 },
  ],

  /** Classifier scores, verbatim from the abstract. */
  metrics: [
    { label: 'Accuracy', value: '98.75%', ratio: 0.9875, note: 'average' },
    { label: 'Precision', value: '0.98', ratio: 0.98 },
    { label: 'Recall', value: '0.98', ratio: 0.98 },
    { label: 'F-measure', value: '0.98', ratio: 0.98 },
  ] satisfies ResearchMetric[],

  /** Shown verbatim so the numbers above are never read out of context. */
  caveat:
    'Figures are those reported by the authors on their own 940-tweet dataset. They describe performance on that dataset and are not a general claim about the methods.',
} as const

export type Research = typeof research
