/**
 * FIKRI.OS — KNOWLEDGE GRAPH
 * ------------------------------------------------------------------
 * Nodes are the technologies and methods Fikri names publicly: the
 * "ask me about" list and tool icons on his GitHub profile README, the
 * capabilities he describes there (AML on TigerGraph, Oracle APEX,
 * Python/Spark + Informatica pipelines, Oracle stored procedures, ETL
 * DataStage), the skills listed against each role on his LinkedIn, the
 * methods in the CITSM 2022 paper, and the stack of his public
 * repositories.
 *
 * Nothing here is inferred from a job title. If a technology is not
 * named in one of those sources, it is not in this graph.
 *
 * `source` records which of those it came from, and the UI can surface it.
 */

export type SkillSourceId = 'readme' | 'paper' | 'repo' | 'linkedin'

export interface SkillCluster {
  id: string
  label: string
  /** Direction the cluster sits in, normalised in the 3D layout. */
  dir: [number, number, number]
  summary: string
}

export interface SkillNode {
  id: string
  label: string
  cluster: string
  /** 1 = supporting, 2 = working, 3 = named as a specialism. Drives node size only. */
  weight: 1 | 2 | 3
  source: SkillSourceId
  /** Extra ids this node connects to beyond its own cluster. */
  links?: string[]
  note?: string
}

export const rootNode = {
  id: 'root',
  label: 'DATA',
  summary:
    'Everything below is something Fikri names publicly. The graph is his stated toolset, not a guess at one.',
}

export const clusters: SkillCluster[] = [
  {
    id: 'graph',
    label: 'GRAPH',
    dir: [1, 0.45, 0.15],
    summary:
      'Graph databases as an analytical medium — the area Fikri calls out first, including anti-money-laundering implementation on TigerGraph.',
  },
  {
    id: 'pipeline',
    label: 'PIPELINES',
    dir: [0.35, -0.5, 1],
    summary:
      'Moving data between systems: ETL DataStage and Informatica alongside Python and Spark, on Cloudera.',
  },
  {
    id: 'stores',
    label: 'DATA STORES',
    dir: [-1, 0.2, 0.55],
    summary:
      'Relational and search stores. Oracle sits at the centre of the current engagement, down to stored procedures.',
  },
  {
    id: 'ml',
    label: 'ANALYSIS & ML',
    dir: [0.1, 1, -0.5],
    summary:
      'The modelling end — the toolkit behind the published sentiment analysis and the notebook work.',
  },
  {
    id: 'platform',
    label: 'PLATFORM',
    dir: [-0.6, -0.85, -0.4],
    summary: 'The ground the rest runs on: Linux, containers, version control and observability.',
  },
  {
    id: 'apps',
    label: 'APPLICATIONS',
    dir: [-0.25, 0.35, -1],
    summary: 'Where analysis becomes something a person uses.',
  },
]

export const skills: SkillNode[] = [
  // GRAPH
  { id: 'tigergraph', label: 'TigerGraph', cluster: 'graph', weight: 3, source: 'readme', links: ['aml', 'kafka'], note: 'Named as a specialism; used for AML implementation.' },
  { id: 'gsql', label: 'GSQL', cluster: 'graph', weight: 2, source: 'repo', links: ['tigergraph'] },
  { id: 'neo4j', label: 'Neo4j', cluster: 'graph', weight: 2, source: 'readme' },

  // PIPELINES
  { id: 'datastage', label: 'ETL DataStage', cluster: 'pipeline', weight: 3, source: 'readme', note: 'Current focus at Bank Mandiri.' },
  { id: 'informatica', label: 'Informatica', cluster: 'pipeline', weight: 3, source: 'readme', links: ['spark'] },
  { id: 'spark', label: 'Apache Spark', cluster: 'pipeline', weight: 3, source: 'readme', links: ['python'] },
  { id: 'cloudera', label: 'Cloudera', cluster: 'pipeline', weight: 2, source: 'readme', links: ['hive'] },
  { id: 'hive', label: 'Hive / HiveQL', cluster: 'pipeline', weight: 2, source: 'linkedin', note: 'Named against the tier-3 analyst year at Telkomsel.' },
  { id: 'kafka', label: 'Apache Kafka', cluster: 'pipeline', weight: 1, source: 'repo' },

  // DATA STORES
  { id: 'oracle', label: 'Oracle', cluster: 'stores', weight: 3, source: 'readme', links: ['plsql', 'apex'], note: 'Stored procedures are the current day-to-day.' },
  { id: 'plsql', label: 'PL/SQL', cluster: 'stores', weight: 3, source: 'linkedin', links: ['oracle'], note: 'Two new and six updated stored procedures at Bank Mandiri, migrated dev to production.' },
  { id: 'oracle-sqldev', label: 'Oracle SQL Developer', cluster: 'stores', weight: 2, source: 'linkedin', links: ['oracle'] },
  { id: 'postgres', label: 'PostgreSQL', cluster: 'stores', weight: 2, source: 'readme' },
  { id: 'mysql', label: 'MySQL', cluster: 'stores', weight: 2, source: 'readme' },
  { id: 'mariadb', label: 'MariaDB', cluster: 'stores', weight: 1, source: 'readme' },
  { id: 'elastic', label: 'Elasticsearch', cluster: 'stores', weight: 1, source: 'readme', links: ['kibana'] },

  // ANALYSIS & ML
  { id: 'python', label: 'Python', cluster: 'ml', weight: 3, source: 'readme', links: ['pandas', 'sklearn'] },
  { id: 'r', label: 'R', cluster: 'ml', weight: 2, source: 'readme' },
  { id: 'pandas', label: 'pandas', cluster: 'ml', weight: 2, source: 'readme' },
  { id: 'sklearn', label: 'scikit-learn', cluster: 'ml', weight: 2, source: 'readme', links: ['svm'] },
  { id: 'tensorflow', label: 'TensorFlow', cluster: 'ml', weight: 1, source: 'readme' },
  { id: 'seaborn', label: 'Seaborn', cluster: 'ml', weight: 1, source: 'readme' },
  { id: 'svm', label: 'Support Vector Machine', cluster: 'ml', weight: 3, source: 'paper', note: 'The supervised half of the CITSM 2022 study.' },
  { id: 'lexicon', label: 'Lexicon-based NLP', cluster: 'ml', weight: 3, source: 'paper', links: ['svm'], note: 'The unsupervised half of the CITSM 2022 study.' },

  // PLATFORM
  { id: 'linux', label: 'Linux', cluster: 'platform', weight: 3, source: 'readme', links: ['bash'] },
  { id: 'bash', label: 'Bash', cluster: 'platform', weight: 2, source: 'readme' },
  { id: 'docker', label: 'Docker', cluster: 'platform', weight: 2, source: 'readme', links: ['k8s'] },
  { id: 'k8s', label: 'Kubernetes', cluster: 'platform', weight: 1, source: 'readme' },
  { id: 'git', label: 'Git', cluster: 'platform', weight: 2, source: 'readme' },
  { id: 'grafana', label: 'Grafana', cluster: 'platform', weight: 2, source: 'readme' },
  { id: 'kibana', label: 'Kibana', cluster: 'platform', weight: 1, source: 'readme' },

  // APPLICATIONS
  { id: 'apex', label: 'Oracle APEX', cluster: 'apps', weight: 3, source: 'readme', note: 'Named as an implementation specialism.' },
  { id: 'aml', label: 'AML Analytics', cluster: 'apps', weight: 3, source: 'readme', note: 'Anti-money-laundering, implemented on a graph database.' },
]

export const skillSources: Record<SkillSourceId, string> = {
  readme: 'Named on his GitHub profile',
  paper: 'Method used in the CITSM 2022 paper',
  repo: 'Used in a public repository',
  linkedin: 'Listed against a role on his LinkedIn',
}

/** Convenience lookups used by both the 3D graph and the DOM fallback list. */
export const skillsByCluster = clusters.map((c) => ({
  ...c,
  nodes: skills.filter((s) => s.cluster === c.id),
}))
