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
