export interface Question {
  id: string;
  question: string;
  answer: string;
  reflection: string;
}

export interface Interview {
  id: string;
  company: string;
  position: string;
  date: string;           // "YYYY-MM-DD"
  round: string;          // "一面" | "二面" | "三面" | "终面" | "HR面"
  questions: Question[];
  createdAt: string;      // ISO string
}

export interface SelfAssessment {
  dimension: string;
  score: number;          // 1-10
}

export interface Resource {
  title: string;
  url: string;
  type: 'book' | 'course' | 'article';
}

export interface Profile {
  selfAssessment: SelfAssessment[];
  weakPoints: string[];
  recommendations: string;
  resources: Resource[];
}

export type RoundOption = '一面' | '二面' | '三面' | '终面' | 'HR面';

export const ROUND_OPTIONS: RoundOption[] = ['一面', '二面', '三面', '终面', 'HR面'];

export const SKILL_DIMENSIONS = [
  'AI技术理解',
  '数据分析',
  '产品设计',
  '业务思维',
  '沟通表达',
  '项目管理',
  '行业洞察',
  '用户研究',
] as const;

// ---- Knowledge Feed ----

export type KnowledgeCategory =
  | '大模型'
  | '产品设计'
  | '商业化'
  | '开源工具'
  | '行业政策'
  | '技术架构'
  | '应用案例';

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  '大模型', '产品设计', '商业化', '开源工具', '行业政策', '技术架构', '应用案例',
];

export const CATEGORY_COLORS: Record<KnowledgeCategory, string> = {
  '大模型':   'bg-violet-900/50 text-violet-300 border-violet-800',
  '产品设计': 'bg-sky-900/50 text-sky-300 border-sky-800',
  '商业化':   'bg-amber-900/50 text-amber-300 border-amber-800',
  '开源工具': 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
  '行业政策': 'bg-rose-900/50 text-rose-300 border-rose-800',
  '技术架构': 'bg-cyan-900/50 text-cyan-300 border-cyan-800',
  '应用案例': 'bg-orange-900/50 text-orange-300 border-orange-800',
};

export type KnowledgePriority = 'must-act' | 'focus' | 'aware';

export const PRIORITY_LABELS: Record<KnowledgePriority, string> = {
  'must-act': '必须行动',
  'focus': '重点关注',
  'aware': '保持关注',
};

export const PRIORITY_COLORS: Record<KnowledgePriority, string> = {
  'must-act': 'bg-red-900/50 text-red-300 border-red-800',
  'focus': 'bg-amber-900/50 text-amber-300 border-amber-800',
  'aware': 'bg-neutral-800/50 text-neutral-400 border-neutral-700',
};

export interface KnowledgeConcept {
  id: string;
  title: string;
  summary: string;
  category: KnowledgeCategory;
  source?: string;
  pushedAt: string;
  isNew?: boolean;
  actionableInsight?: string;
  priority?: KnowledgePriority;
}
