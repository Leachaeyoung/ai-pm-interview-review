# AI PM 面试复盘网站 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个基于 Next.js 的 AI 产品经理面试复盘个人网站，包含面试前模拟准备、面试后记录复盘、复盘库时间线浏览、个人能力总结四大模块。

**Architecture:** Next.js App Router 单页应用，数据存储在 JSON 文件中并通过 lib/data.ts 读写，AI 能力通过 API Routes 调用 LLM，Tailwind CSS + Framer Motion 实现样式与动画。

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, UUID, date-fns, Web Speech API

## Global Constraints

- 桌面端优先设计，移动端保证可读
- SkillRadar 使用 SVG/CSS 手写，不引入图表库
- AI API Key 通过 `.env.local` 中的 `ANTHROPIC_API_KEY` 管理，不提交到仓库
- 数据文件 `data/interviews.json` 和 `data/profile.json` 随代码部署，通过 lib 层读写
- 模拟面试全屏模式使用独立路由 `/prepare/mock`
- 所有代码使用 TypeScript

## 文件结构（最终）

```
/
├── app/
│   ├── layout.tsx              # 根布局 + 导航栏
│   ├── page.tsx                # 重定向到 /timeline
│   ├── globals.css             # Tailwind 基础样式 + 自定义计时器颜色
│   ├── prepare/
│   │   ├── page.tsx            # 面试前：JD 输入 + 解析 + 出题
│   │   └── mock/
│   │       └── page.tsx        # 全屏模拟面试
│   ├── review/
│   │   └── page.tsx            # 面试后：新增/编辑面试记录
│   ├── timeline/
│   │   ├── page.tsx            # 复盘库：时间线列表
│   │   └── [id]/
│   │       └── page.tsx        # 单次面试详情
│   ├── profile/
│   │   └── page.tsx            # 我的：能力总结
│   └── api/
│       ├── parse-jd/route.ts   # AI 解析 JD
│       ├── generate-questions/route.ts  # AI 生成模拟题
│       └── review-answer/route.ts      # AI 复盘建议
├── components/
│   ├── Navigation.tsx          # 顶部导航栏
│   ├── Timeline.tsx            # 时间线容器
│   ├── InterviewCard.tsx       # 时间线卡片
│   ├── InterviewForm.tsx       # 面试记录表单
│   ├── MockSession.tsx         # 模拟面试核心
│   ├── VoiceInput.tsx          # 语音输入组件
│   ├── SkillRadar.tsx          # SVG 技能雷达图
│   └── SearchFilter.tsx        # 筛选搜索栏
├── lib/
│   ├── types.ts                # TypeScript 类型定义
│   ├── data.ts                 # JSON 数据读写
│   └── ai.ts                   # AI API 调用客户端
├── data/
│   ├── interviews.json         # 面试记录（种子数据）
│   └── profile.json            # 个人档案（种子数据）
├── .env.local.example          # 环境变量示例
└── tailwind.config.ts
```

---

### Task 1: 项目脚手架与依赖安装

**Files:**
- Create: 项目根目录（`/Users/ll/Desktop/Lea-Claude code/Interview/`）的所有脚手架文件
- Create: `.env.local.example`

**Interfaces:**
- Produces: `package.json` 中的 `dev/build/lint` 脚本，项目可启动

- [ ] **Step 1: 创建 Next.js 项目**

```bash
cd "/Users/ll/Desktop/Lea-Claude code"
npx create-next-app@latest Interview --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-turbopack
```

安装完毕后，进入项目目录安装额外依赖：

```bash
cd Interview
npm install framer-motion uuid date-fns
npm install -D @types/uuid
```

- [ ] **Step 2: 创建环境变量示例文件**

创建 `.env.local.example`，内容：

```
# 将本文件复制为 .env.local 并填入你的 API Key
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

- [ ] **Step 3: 初始化 Git 仓库**

```bash
cd "/Users/ll/Desktop/Lea-Claude code/Interview"
git init
echo "node_modules\n.next\n.env.local" > .gitignore
git add -A
git commit -m "chore: scaffold Next.js project with Tailwind CSS and TypeScript"
```

- [ ] **Step 4: 验证项目启动**

```bash
npm run dev
```

在浏览器打开 `http://localhost:3000`，确认 Next.js 默认页面正常显示。确认后停止开发服务器。

---

### Task 2: 类型定义与数据种子

**Files:**
- Create: `lib/types.ts`
- Create: `data/interviews.json`
- Create: `data/profile.json`

**Interfaces:**
- Produces: `Interview`, `Question`, `Profile`, `SelfAssessment`, `Resource` 类型
- Produces: 种子数据文件，供后续所有 Task 使用

- [ ] **Step 1: 编写类型定义**

创建 `lib/types.ts`：

```typescript
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
```

- [ ] **Step 2: 编写种子数据 — 面试记录**

创建 `data/interviews.json`：

```json
[
  {
    "id": "seed-001",
    "company": "字节跳动",
    "position": "AI产品经理",
    "date": "2026-06-15",
    "round": "二面",
    "questions": [
      {
        "id": "q-001",
        "question": "如何定义AI产品的北极星指标？",
        "answer": "我当时的回答围绕用户留存和模型调用量展开，但缺少对业务价值的直接关联...",
        "reflection": "应该先明确AI产品与普通产品的本质区别——AI产品的价值不只是功能使用，更是模型输出的质量和效率。北极星指标应该同时考虑用户侧价值和模型侧成本。"
      },
      {
        "id": "q-002",
        "question": "你怎么看待大模型在产品中的定位？",
        "answer": "我回答大模型是核心引擎，但没有展开具体场景...",
        "reflection": "需要更具体地分层：基础模型层、应用层、交互层，每层的产品策略不同。下次应该用例子说明。"
      }
    ],
    "createdAt": "2026-06-15T10:30:00.000Z"
  },
  {
    "id": "seed-002",
    "company": "阿里云",
    "position": "产品专家",
    "date": "2026-06-03",
    "round": "一面",
    "questions": [
      {
        "id": "q-003",
        "question": "如何评估一个B端AI产品的商业价值？",
        "answer": "我从用户付费意愿和效率提升角度回答...",
        "reflection": "缺少量化分析框架，应该准备具体的ROI计算模型。"
      }
    ],
    "createdAt": "2026-06-03T14:00:00.000Z"
  },
  {
    "id": "seed-003",
    "company": "腾讯",
    "position": "AI产品经理",
    "date": "2026-05-20",
    "round": "一面",
    "questions": [
      {
        "id": "q-004",
        "question": "设计一个AI客服产品的MVP，你会怎么做？",
        "answer": "我从用户需求出发，设计了核心功能清单...",
        "reflection": "MVP定义清晰，但遗漏了人工兜底机制的设计，这是AI产品的关键。"
      },
      {
        "id": "q-005",
        "question": "如何衡量AI客服相比传统客服的增量价值？",
        "answer": "回答偏定性，缺少数据支撑...",
        "reflection": "应该准备具体的指标体系：响应时间、解决率、转人工率、成本节省、用户满意度。"
      }
    ],
    "createdAt": "2026-05-20T09:15:00.000Z"
  }
]
```

- [ ] **Step 3: 编写种子数据 — 个人档案**

创建 `data/profile.json`：

```json
{
  "selfAssessment": [
    { "dimension": "AI技术理解", "score": 6 },
    { "dimension": "数据分析", "score": 5 },
    { "dimension": "产品设计", "score": 7 },
    { "dimension": "业务思维", "score": 6 },
    { "dimension": "沟通表达", "score": 7 },
    { "dimension": "项目管理", "score": 5 },
    { "dimension": "行业洞察", "score": 6 },
    { "dimension": "用户研究", "score": 5 }
  ],
  "weakPoints": [
    "数据分析思维需要加强，缺少量化论证习惯",
    "AI技术理解停留在概念层，需要深入理解模型原理",
    "B端商业化分析框架不够清晰"
  ],
  "recommendations": "重点关注：1) 每次面试前准备该公司的业务数据和行业报告；2) 练习用STAR法则组织回答；3) 对AI技术问题建立知识卡片，逐步积累。",
  "resources": [
    {
      "title": "机器学习实战",
      "url": "https://example.com/ml-practice",
      "type": "book"
    },
    {
      "title": "产品沉思录",
      "url": "https://example.com/product-thinking",
      "type": "article"
    },
    {
      "title": "AI产品经理必修课",
      "url": "https://example.com/ai-pm-course",
      "type": "course"
    }
  ]
}
```

- [ ] **Step 4: 提交**

```bash
git add lib/types.ts data/interviews.json data/profile.json
git commit -m "feat: add TypeScript types and seed data"
```

---

### Task 3: 数据读写库

**Files:**
- Create: `lib/data.ts`

**Interfaces:**
- Consumes: `lib/types.ts` 类型
- Produces:
  - `getInterviews(): Interview[]` — 获取所有面试记录，按日期降序
  - `getInterview(id: string): Interview | undefined` — 获取单条
  - `addInterview(data: Omit<Interview, 'id' | 'createdAt'>): Interview` — 新增
  - `updateInterview(id: string, data: Partial<Interview>): Interview | undefined` — 更新
  - `deleteInterview(id: string): boolean` — 删除
  - `getProfile(): Profile` — 获取个人档案
  - `updateProfile(data: Profile): Profile` — 更新档案
  - `getInterviewsByCompany(company: string): Interview[]` — 按公司筛选
  - `searchInterviews(keyword: string): Interview[]` — 搜索

- [ ] **Step 1: 编写数据读写库**

创建 `lib/data.ts`：

```typescript
import { v4 as uuid } from 'uuid';
import type { Interview, Profile } from './types';
import interviewsData from '@/data/interviews.json';
import profileData from '@/data/profile.json';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const INTERVIEWS_PATH = path.join(DATA_DIR, 'interviews.json');
const PROFILE_PATH = path.join(DATA_DIR, 'profile.json');

// In-memory cache — read once at module init, write through on change
let interviews: Interview[] = [...interviewsData] as Interview[];
let profile: Profile = { ...profileData } as Profile;

function persistInterviews(): void {
  fs.writeFileSync(INTERVIEWS_PATH, JSON.stringify(interviews, null, 2), 'utf-8');
}

function persistProfile(): void {
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');
}

export function getInterviews(): Interview[] {
  return [...interviews].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getInterview(id: string): Interview | undefined {
  return interviews.find((i) => i.id === id);
}

export function addInterview(data: Omit<Interview, 'id' | 'createdAt'>): Interview {
  const interview: Interview = {
    ...data,
    id: uuid(),
    createdAt: new Date().toISOString(),
  };
  interviews.push(interview);
  persistInterviews();
  return interview;
}

export function updateInterview(id: string, data: Partial<Interview>): Interview | undefined {
  const index = interviews.findIndex((i) => i.id === id);
  if (index === -1) return undefined;
  interviews[index] = { ...interviews[index], ...data };
  persistInterviews();
  return interviews[index];
}

export function deleteInterview(id: string): boolean {
  const index = interviews.findIndex((i) => i.id === id);
  if (index === -1) return false;
  interviews.splice(index, 1);
  persistInterviews();
  return true;
}

export function getProfile(): Profile {
  return { ...profile };
}

export function updateProfile(data: Profile): Profile {
  profile = { ...data };
  persistProfile();
  return profile;
}

export function getInterviewsByCompany(company: string): Interview[] {
  return getInterviews().filter((i) => i.company.includes(company));
}

export function searchInterviews(keyword: string): Interview[] {
  const kw = keyword.toLowerCase();
  return getInterviews().filter(
    (i) =>
      i.company.toLowerCase().includes(kw) ||
      i.position.toLowerCase().includes(kw) ||
      i.questions.some(
        (q) =>
          q.question.toLowerCase().includes(kw) ||
          q.answer.toLowerCase().includes(kw) ||
          q.reflection.toLowerCase().includes(kw)
      )
  );
}
```

- [ ] **Step 2: 更新 tsconfig.json 添加 JSON 导入支持**

Next.js 默认支持 JSON 导入，无需修改。但需要确认 `tsconfig.json` 中有：

```json
"resolveJsonModule": true,
```

（`create-next-app` 默认已包含此项，检查即可。）

- [ ] **Step 3: 提交**

```bash
git add lib/data.ts
git commit -m "feat: add data I/O library with JSON persistence"
```

---

### Task 4: 根布局与导航组件

**Files:**
- Modify: `app/globals.css`
- Create: `components/Navigation.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: 无
- Produces: 全局布局（导航栏 + 内容区），首页重定向到 `/timeline`

- [ ] **Step 1: 编写全局样式**

修改 `app/globals.css`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-neutral-950 text-neutral-100 antialiased;
  }
}

@layer components {
  .timer-safe {
    @apply text-emerald-400;
  }
  .timer-warn {
    @apply text-amber-400;
  }
  .timer-danger {
    @apply text-red-400;
  }
}

/* 时间线竖线 */
.timeline-line {
  @apply absolute left-[120px] top-0 bottom-0 w-px bg-neutral-700;
}
```

- [ ] **Step 2: 编写导航组件**

创建 `components/Navigation.tsx`：

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/prepare', label: '面试前' },
  { href: '/review', label: '面试后' },
  { href: '/timeline', label: '复盘库' },
  { href: '/profile', label: '我的' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/timeline" className="text-lg font-semibold text-white tracking-tight">
          AI PM 面试复盘
        </Link>
        <nav className="flex gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: 修改根布局**

修改 `app/layout.tsx`：

```tsx
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI PM 面试复盘',
  description: 'AI产品经理面试复盘与模拟面试工具',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <Navigation />
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: 修改首页为重定向**

修改 `app/page.tsx`：

```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/timeline');
}
```

- [ ] **Step 5: 提交**

```bash
git add app/globals.css app/layout.tsx app/page.tsx components/Navigation.tsx
git commit -m "feat: add root layout with navigation bar and redirect"
```

---

### Task 5: 时间线页面（复盘库）

**Files:**
- Create: `components/Timeline.tsx`
- Create: `components/InterviewCard.tsx`
- Create: `components/SearchFilter.tsx`
- Create: `app/timeline/page.tsx`

**Interfaces:**
- Consumes: `lib/types.ts`, `lib/data.ts` 的 `getInterviews`
- Produces: 时间线页面（按月份分组 + 卡片列表 + 筛选搜索）

- [ ] **Step 1: 编写时间线容器组件**

创建 `components/Timeline.tsx`：

```typescript
'use client';

import { motion } from 'framer-motion';
import type { Interview } from '@/lib/types';

function groupByMonth(interviews: Interview[]): Map<string, Interview[]> {
  const groups = new Map<string, Interview[]>();
  for (const interview of interviews) {
    const key = interview.date.slice(0, 7); // "2026-06"
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(interview);
  }
  return groups;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${year}年${parseInt(month)}月`;
}

export default function Timeline({
  interviews,
  onSelect,
}: {
  interviews: Interview[];
  onSelect: (id: string) => void;
}) {
  const groups = groupByMonth(interviews);

  if (interviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <p className="text-lg">还没有面试记录</p>
        <p className="mt-2 text-sm">点击右上角「面试后」开始记录你的第一次面试复盘</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 时间线竖线 */}
      <div className="absolute left-[120px] top-0 bottom-0 w-px bg-neutral-800" />

      {Array.from(groups.entries()).map(([key, items]) => (
        <div key={key} className="mb-10">
          {/* 月份标签 */}
          <div className="flex items-center mb-6">
            <div className="w-[120px] pr-6 text-right">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400">
                <span className="h-2 w-2 rounded-full bg-neutral-600" />
                {formatMonthLabel(key)}
              </span>
            </div>
          </div>

          {/* 该月的卡片 */}
          <div className="ml-[120px] space-y-4">
            {items.map((interview, index) => (
              <motion.div
                key={interview.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <InterviewCard interview={interview} onClick={() => onSelect(interview.id)} />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 编写卡片组件**

创建 `components/InterviewCard.tsx`：

```typescript
'use client';

import type { Interview } from '@/lib/types';

const ROUND_COLORS: Record<string, string> = {
  '一面': 'bg-blue-900/50 text-blue-300 border-blue-800',
  '二面': 'bg-purple-900/50 text-purple-300 border-purple-800',
  '三面': 'bg-amber-900/50 text-amber-300 border-amber-800',
  '终面': 'bg-red-900/50 text-red-300 border-red-800',
  'HR面': 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
};

export default function InterviewCard({
  interview,
  onClick,
}: {
  interview: Interview;
  onClick: () => void;
}) {
  const roundColor = ROUND_COLORS[interview.round] || 'bg-neutral-800 text-neutral-300 border-neutral-700';

  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-left transition-all hover:border-neutral-600 hover:bg-neutral-800/50"
    >
      {/* 左侧连接点 */}
      <div className="absolute -left-[33px] top-6 h-2.5 w-2.5 rounded-full border-2 border-neutral-600 bg-neutral-950 group-hover:border-neutral-400 transition-colors" />

      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-100">
            {interview.company} · {interview.position}
          </h3>
          <p className="mt-2 text-sm text-neutral-400">
            {interview.date} · {interview.round} · {interview.questions.length} 个问题
          </p>
        </div>
        <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${roundColor}`}>
          {interview.round}
        </span>
      </div>
    </button>
  );
}
```

- [ ] **Step 3: 编写筛选搜索组件**

创建 `components/SearchFilter.tsx`：

```typescript
'use client';

import { useState } from 'react';

export default function SearchFilter({
  onSearch,
  onCompanyFilter,
  companies,
}: {
  onSearch: (keyword: string) => void;
  onCompanyFilter: (company: string) => void;
  companies: string[];
}) {
  const [searchText, setSearchText] = useState('');

  const handleSearch = (value: string) => {
    setSearchText(value);
    onSearch(value);
  };

  return (
    <div className="mb-8 flex gap-4">
      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          placeholder="搜索公司、岗位、题目关键词..."
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none transition-colors"
        />
        {searchText && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
          >
            ✕
          </button>
        )}
      </div>
      <select
        onChange={(e) => onCompanyFilter(e.target.value)}
        className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none transition-colors"
      >
        <option value="">全部公司</option>
        {companies.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 4: 编写时间线页面**

创建 `app/timeline/page.tsx`：

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getInterviews, getInterviewsByCompany, searchInterviews } from '@/lib/data';
import Timeline from '@/components/Timeline';
import SearchFilter from '@/components/SearchFilter';

export default function TimelinePage() {
  const router = useRouter();
  const allInterviews = getInterviews();
  const [interviews, setInterviews] = useState(allInterviews);

  const companies = [...new Set(allInterviews.map((i) => i.company))];

  const handleSearch = (keyword: string) => {
    if (!keyword.trim()) {
      setInterviews(allInterviews);
      return;
    }
    setInterviews(searchInterviews(keyword));
  };

  const handleCompanyFilter = (company: string) => {
    if (!company) {
      setInterviews(allInterviews);
      return;
    }
    setInterviews(getInterviewsByCompany(company));
  };

  return (
    <div>
      <SearchFilter
        onSearch={handleSearch}
        onCompanyFilter={handleCompanyFilter}
        companies={companies}
      />
      <Timeline
        interviews={interviews}
        onSelect={(id) => router.push(`/timeline/${id}`)}
      />
    </div>
  );
}
```

- [ ] **Step 5: 启动开发服务器验证**

```bash
npm run dev
```

访问 `http://localhost:3000/timeline`，确认：
- 时间线按月份分组显示
- 三张种子卡片依次展示
- 搜索框输入"字节"能筛选
- 公司下拉选择功能正常

- [ ] **Step 6: 提交**

```bash
git add components/Timeline.tsx components/InterviewCard.tsx components/SearchFilter.tsx app/timeline/page.tsx
git commit -m "feat: add timeline page with search and company filter"
```

---

### Task 6: 面试详情页

**Files:**
- Create: `app/timeline/[id]/page.tsx`

**Interfaces:**
- Consumes: `lib/data.ts` 的 `getInterview`, `deleteInterview`
- Produces: 单次面试详情页（题目、回答、反思完整展示）

- [ ] **Step 1: 编写面试详情页**

创建 `app/timeline/[id]/page.tsx`：

```typescript
'use client';

import { useParams, useRouter } from 'next/navigation';
import { getInterview, deleteInterview } from '@/lib/data';
import { useState } from 'react';
import Link from 'next/link';

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const interview = getInterview(params.id as string);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!interview) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <p className="text-lg">面试记录未找到</p>
        <Link href="/timeline" className="mt-4 text-sm text-neutral-400 hover:text-white underline">
          返回时间线
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    deleteInterview(interview.id);
    router.push('/timeline');
  };

  return (
    <div className="max-w-3xl">
      {/* 面包屑 */}
      <Link
        href="/timeline"
        className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
      >
        ← 返回时间线
      </Link>

      {/* 头部信息 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {interview.company} · {interview.position}
        </h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-neutral-400">
          <span>{interview.date}</span>
          <span className="text-neutral-700">|</span>
          <span>{interview.round}</span>
          <span className="text-neutral-700">|</span>
          <span>{interview.questions.length} 个问题</span>
        </div>
      </div>

      {/* 问题列表 */}
      <div className="space-y-8">
        {interview.questions.map((q, index) => (
          <div key={q.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="flex items-center gap-3 text-lg font-medium text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-400">
                {index + 1}
              </span>
              {q.question}
            </h3>

            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                我的回答
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap">
                {q.answer}
              </p>
            </div>

            <div className="mt-5 rounded-lg bg-neutral-950 p-4 border border-neutral-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                复盘反思
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap">
                {q.reflection}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 操作区 */}
      <div className="mt-8 flex gap-3">
        <Link
          href={`/review?id=${interview.id}`}
          className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700 transition-colors"
        >
          编辑
        </Link>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
          >
            删除
          </button>
        ) : (
          <button
            onClick={handleDelete}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-600 transition-colors"
          >
            确认删除？
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证**

```bash
npm run dev
```

点击时间线卡片 → 进入详情页 → 确认题目、回答、反思全部展示 → 测试返回和删除功能。

- [ ] **Step 3: 提交**

```bash
git add app/timeline/[id]/page.tsx
git commit -m "feat: add interview detail page with view, edit link, and delete"
```

---

### Task 7: 面试记录表单（新增/编辑）

**Files:**
- Create: `components/InterviewForm.tsx`
- Create: `app/review/page.tsx`

**Interfaces:**
- Consumes: `lib/data.ts` 的 `addInterview`, `updateInterview`, `getInterview`; `lib/types.ts`
- Produces: 面试记录表单页面，支持新增和编辑模式（通过 `?id=` 参数区分）

- [ ] **Step 1: 编写面试记录表单组件**

创建 `components/InterviewForm.tsx`：

```typescript
'use client';

import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { Interview, Question } from '@/lib/types';
import { ROUND_OPTIONS } from '@/lib/types';

interface FormData {
  company: string;
  position: string;
  date: string;
  round: string;
  questions: Question[];
}

function emptyQuestion(): Question {
  return { id: uuid(), question: '', answer: '', reflection: '' };
}

export default function InterviewForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: Interview;
  onSave: (data: Omit<Interview, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormData>({
    company: initialData?.company || '',
    position: initialData?.position || '',
    date: initialData?.date || new Date().toISOString().slice(0, 10),
    round: initialData?.round || '一面',
    questions: initialData?.questions || [emptyQuestion()],
  });
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateQuestion = (id: string, field: keyof Question, value: string) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      ),
    }));
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, emptyQuestion()],
    }));
  };

  const removeQuestion = (id: string) => {
    if (form.questions.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const handleSubmit = () => {
    if (!form.company.trim() || !form.position.trim()) return;
    setSaving(true);
    onSave({
      company: form.company.trim(),
      position: form.position.trim(),
      date: form.date,
      round: form.round,
      questions: form.questions.filter((q) => q.question.trim()),
    });
  };

  return (
    <div className="max-w-3xl">
      {/* 基本信息 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-1.5">公司</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => updateField('company', e.target.value)}
            placeholder="例如：字节跳动"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-1.5">岗位</label>
          <input
            type="text"
            value={form.position}
            onChange={(e) => updateField('position', e.target.value)}
            placeholder="例如：AI产品经理"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-1.5">面试日期</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => updateField('date', e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-1.5">轮次</label>
          <select
            value={form.round}
            onChange={(e) => updateField('round', e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
          >
            {ROUND_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-neutral-800 my-6" />

      {/* 问题列表 */}
      <div className="space-y-6">
        {form.questions.map((q, index) => (
          <div key={q.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-300">问题 {index + 1}</h3>
              {form.questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
                >
                  删除此问题
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">面试题目</label>
                <textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                  placeholder="面试官问的具体问题..."
                  rows={2}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">我的回答思路</label>
                <textarea
                  value={q.answer}
                  onChange={(e) => updateQuestion(q.id, 'answer', e.target.value)}
                  placeholder="我当时是怎么回答的..."
                  rows={3}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-500 mb-1">复盘反思</label>
                <textarea
                  value={q.reflection}
                  onChange={(e) => updateQuestion(q.id, 'reflection', e.target.value)}
                  placeholder="哪些地方可以改进？有什么收获？"
                  rows={3}
                  className="w-full rounded-lg border border-amber-900/50 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-amber-700 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="mt-4 w-full rounded-lg border border-dashed border-neutral-700 py-3 text-sm text-neutral-500 hover:border-neutral-500 hover:text-neutral-300 transition-colors"
      >
        + 添加问题
      </button>

      {/* 底部操作 */}
      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg px-5 py-2.5 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !form.company.trim()}
          className="rounded-lg bg-neutral-100 px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-white transition-colors disabled:opacity-40"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 编写面试记录页面（路由 + 逻辑）**

创建 `app/review/page.tsx`：

```typescript
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { addInterview, updateInterview, getInterview } from '@/lib/data';
import InterviewForm from '@/components/InterviewForm';
import type { Interview } from '@/lib/types';

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('id');
  const existingInterview = editId ? getInterview(editId) : undefined;

  const handleSave = (data: Omit<Interview, 'id' | 'createdAt'>) => {
    if (existingInterview) {
      updateInterview(existingInterview.id, data);
    } else {
      addInterview(data);
    }
    router.push('/timeline');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div>
      <h1 className="mb-8 text-xl font-bold text-white">
        {existingInterview ? '编辑面试记录' : '新增面试记录'}
      </h1>
      <InterviewForm
        initialData={existingInterview}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
```

- [ ] **Step 3: 验证**

```bash
npm run dev
```

1. 访问 `/review` → 空表单 → 填入公司/岗位 → 添加问题 → 保存 → 确认跳转到时间线
2. 在时间线点击卡片 → 详情页 → 编辑 → 修改内容 → 保存 → 确认更新
3. 测试删除问题和公司必填校验

- [ ] **Step 4: 提交**

```bash
git add components/InterviewForm.tsx app/review/page.tsx
git commit -m "feat: add interview create/edit form with dynamic questions"
```

---

### Task 8: AI API 客户端与解析 JD 接口

**Files:**
- Create: `lib/ai.ts`
- Create: `app/api/parse-jd/route.ts`

**Interfaces:**
- Consumes: `ANTHROPIC_API_KEY` 环境变量
- Produces:
  - `lib/ai.ts` 的 `callAI(system: string, prompt: string): Promise<string>`
  - `POST /api/parse-jd` — 接收 `{ jd: string }`，返回 `{ requirements, keywords, businessDirection }`

- [ ] **Step 1: 编写 AI 调用客户端**

创建 `lib/ai.ts`：

```typescript
export async function callAI(system: string, prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY 未配置。请在 .env.local 中设置。');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API 调用失败: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}
```

- [ ] **Step 2: 编写解析 JD 的 API Route**

创建 `app/api/parse-jd/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

const SYSTEM_PROMPT = `你是一位资深的 AI 产品经理面试官。你的任务是分析用户提供的职位描述(JD)，提取关键信息。

请返回严格的 JSON 格式（不要包含 markdown 标记）：
{
  "requirements": ["核心要求1", "核心要求2", ...],
  "keywords": ["关键词1", "关键词2", ...],
  "businessDirection": "该公司在JD中体现的业务方向"
}`;

export async function POST(request: NextRequest) {
  try {
    const { jd } = await request.json();

    if (!jd || typeof jd !== 'string' || jd.trim().length < 50) {
      return NextResponse.json(
        { error: '请提供完整的职位描述（至少50字）' },
        { status: 400 }
      );
    }

    const result = await callAI(SYSTEM_PROMPT, jd.trim());
    const parsed = JSON.parse(result);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add lib/ai.ts app/api/parse-jd/route.ts
git commit -m "feat: add AI client and JD parsing API route"
```

---

### Task 9: 面试前页面（JD 解析 + 模拟题生成）

**Files:**
- Create: `app/prepare/page.tsx`
- Create: `app/api/generate-questions/route.ts`

**Interfaces:**
- Consumes: `lib/ai.ts`, `lib/data.ts`, `lib/types.ts`
- Produces: `POST /api/generate-questions` — 接收 `{ jd: string, company: string }`，返回 `{ questions: string[] }`
- Produces: 面试前页面（JD 输入 → 解析结果 → 模拟题 → 进入模拟）

- [ ] **Step 1: 编写生成模拟题的 API Route**

创建 `app/api/generate-questions/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import { getInterviews } from '@/lib/data';

function buildSystemPrompt(company: string): string {
  const allInterviews = getInterviews();

  // 提取同公司的历史真题
  const sameCompany = allInterviews
    .filter((i) => i.company === company)
    .flatMap((i) => i.questions.map((q) => q.question));

  // 提取所有历史真题
  const allQuestions = allInterviews.flatMap((i) =>
    i.questions.map((q) => q.question)
  );

  let sameCompanySection = '';
  if (sameCompany.length > 0) {
    sameCompanySection = `\n\n该公司历史真实面试题（请参考风格和难度，生成变体题）：\n${sameCompany.slice(0, 10).map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
  }

  const generalSection = allQuestions.length > 0
    ? `\n\n该用户所有历史面试题（避免超过70%重复）：\n${allQuestions.slice(0, 20).map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  return `你是一位资深的 AI 产品经理面试官。请基于职位描述为用户生成 6 道模拟面试题。

题目应该覆盖以下维度：
- AI技术理解
- 数据分析与指标体系
- 产品设计与用户体验
- 业务思维与商业化
- 项目管理与跨团队协作
- 行业趋势与竞品分析

生成规则：
- 优先参考同公司历史题目的风格和难度
- 至少 30% 的题目要是全新的（不在历史题库中）
- 题目应该贴近真实面试，有深度，能考察产品思维

${sameCompanySection}${generalSection}

请返回严格的 JSON 格式（不要包含 markdown 标记）：
{ "questions": ["题1", "题2", ...共6道...] }`;
}

export async function POST(request: NextRequest) {
  try {
    const { jd, company } = await request.json();

    if (!jd || typeof jd !== 'string') {
      return NextResponse.json({ error: '请提供职位描述' }, { status: 400 });
    }

    const system = buildSystemPrompt(company || '');
    const result = await callAI(system, jd);
    const parsed = JSON.parse(result);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: 编写面试前页面**

创建 `app/prepare/page.tsx`：

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface JDAnalysis {
  requirements: string[];
  keywords: string[];
  businessDirection: string;
}

export default function PreparePage() {
  const router = useRouter();
  const [jd, setJd] = useState('');
  const [company, setCompany] = useState('');
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<'parse' | 'generate' | null>(null);
  const [error, setError] = useState('');

  const handleParseJD = async () => {
    if (jd.trim().length < 50) {
      setError('职位描述太短，请至少输入50字');
      return;
    }
    setError('');
    setLoading('parse');
    try {
      const res = await fetch('/api/parse-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jd.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败');
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateQuestions = async () => {
    setError('');
    setLoading('generate');
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jd.trim(), company }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 text-xl font-bold text-white">面试前 · 模拟准备</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-red-900 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* JD 输入区 */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 mb-6">
        <label className="block text-sm font-medium text-neutral-300 mb-3">
          粘贴目标公司的职位描述 (JD)
        </label>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="将公司招聘页面上的 JD 文本粘贴到这里..."
          rows={6}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none resize-none"
        />
        <div className="mt-4 flex items-center gap-4">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="公司名（可选，用于匹配历史题目）"
            className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
          <button
            onClick={handleParseJD}
            disabled={loading === 'parse'}
            className="rounded-lg bg-neutral-700 px-5 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-600 transition-colors disabled:opacity-50"
          >
            {loading === 'parse' ? '解析中...' : '解析 JD'}
          </button>
        </div>
      </div>

      {/* JD 解析结果 */}
      {analysis && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 mb-6">
          <h2 className="text-sm font-semibold text-neutral-200 mb-4">JD 解析结果</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="text-xs font-medium text-neutral-500 mb-2">岗位核心要求</h3>
              <ul className="space-y-1">
                {analysis.requirements.map((r, i) => (
                  <li key={i} className="text-sm text-neutral-300">• {r}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium text-neutral-500 mb-2">关键词</h3>
              <div className="flex flex-wrap gap-1">
                {analysis.keywords.map((kw, i) => (
                  <span key={i} className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-neutral-500 mb-2">业务方向</h3>
              <p className="text-sm text-neutral-300">{analysis.businessDirection}</p>
            </div>
          </div>
          <button
            onClick={handleGenerateQuestions}
            disabled={loading === 'generate'}
            className="mt-5 rounded-lg bg-neutral-100 px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading === 'generate' ? '生成中...' : '生成模拟题'}
          </button>
        </div>
      )}

      {/* 模拟题列表 */}
      {questions.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-neutral-200">
              模拟面试题 ({questions.length} 题)
            </h2>
            <button
              onClick={handleGenerateQuestions}
              disabled={loading === 'generate'}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {loading === 'generate' ? '重新生成中...' : '重新生成'}
            </button>
          </div>
          <ol className="space-y-3">
            {questions.map((q, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-200"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-400">
                  {i + 1}
                </span>
                {q}
              </li>
            ))}
          </ol>
          <button
            onClick={() => {
              sessionStorage.setItem('mockQuestions', JSON.stringify(questions));
              router.push('/prepare/mock');
            }}
            className="mt-6 w-full rounded-lg bg-emerald-700 py-3 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
          >
            开始模拟面试 →
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add app/api/generate-questions/route.ts app/prepare/page.tsx
git commit -m "feat: add interview prep page with JD parsing and AI question generation"
```

---

### Task 10: 全屏模拟面试

**Files:**
- Create: `components/MockSession.tsx`
- Create: `components/VoiceInput.tsx`
- Create: `app/prepare/mock/page.tsx`

**Interfaces:**
- Consumes: `sessionStorage` 中的 `mockQuestions`（由面试前页面存入）
- Produces: 全屏模拟面试模式（出题 → 思考 → 回答 → 循环 → 完成保存）

- [ ] **Step 1: 编写语音输入组件**

创建 `components/VoiceInput.tsx`：

```typescript
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceInputProps {
  onTextChange: (text: string) => void;
  text: string;
}

export default function VoiceInput({ onTextChange, text }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [browserSupport, setBrowserSupport] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupport(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) {
        onTextChange(text + final);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [text, onTextChange]);

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }, [isRecording]);

  if (!browserSupport) {
    return null;
  }

  return (
    <button
      onClick={toggleRecording}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${
        isRecording
          ? 'border-red-700 bg-red-900/30 text-red-300 animate-pulse'
          : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-500'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isRecording ? 'bg-red-400' : 'bg-neutral-500'}`} />
      {isRecording ? '● 录音中' : '🎤 语音输入'}
    </button>
  );
}
```

- [ ] **Step 2: 编写模拟面试核心组件**

创建 `components/MockSession.tsx`：

```typescript
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInput from './VoiceInput';

interface MockSessionProps {
  questions: string[];
  onComplete: (answers: Array<{ question: string; answer: string }>) => void;
  onExit: () => void;
}

const THINK_TIME = 60; // seconds

export default function MockSession({ questions, onComplete, onExit }: MockSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'thinking' | 'answering'>('thinking');
  const [thinkTimeLeft, setThinkTimeLeft] = useState(THINK_TIME);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<Array<{ question: string; answer: string }>>([]);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 总计时
  useEffect(() => {
    totalTimerRef.current = setInterval(() => {
      setTotalElapsed((t) => t + 1);
    }, 1000);
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, []);

  // 思考倒计时
  useEffect(() => {
    if (phase !== 'thinking') return;
    setThinkTimeLeft(THINK_TIME);
    timerRef.current = setInterval(() => {
      setThinkTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('answering');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentIndex]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timerColor = (time: number, total: number): string => {
    const ratio = time / total;
    if (ratio > 0.5) return 'text-emerald-400';
    if (ratio > 0.2) return 'text-amber-400';
    return 'text-red-400';
  };

  const handleNext = useCallback(() => {
    setAnswers((prev) => [...prev, { question: questions[currentIndex], answer: currentAnswer }]);
    setCurrentAnswer('');

    if (currentIndex + 1 >= questions.length) {
      setIsCompleted(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setPhase('thinking');
    }
  }, [currentIndex, currentAnswer, questions]);

  const handleComplete = () => {
    const finalAnswers = [
      ...answers,
      { question: questions[currentIndex], answer: currentAnswer },
    ];
    onComplete(finalAnswers);
  };

  // 完成页面
  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="mb-6 text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-3">模拟面试完成</h2>
          <p className="text-neutral-400">
            用时 {formatTime(totalElapsed)} · 共 {questions.length} 题
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={onExit}
              className="rounded-lg border border-neutral-700 px-6 py-3 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              返回
            </button>
            <button
              onClick={handleComplete}
              className="rounded-lg bg-emerald-700 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
            >
              保存并复盘
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-8">
        <button
          onClick={onExit}
          className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          ← 退出模拟
        </button>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-neutral-400">
            第 {currentIndex + 1}/{questions.length} 题
          </span>
          <span className={`font-mono ${timerColor(totalElapsed, 1800)}`}>
            ⏱ {formatTime(totalElapsed)}
          </span>
        </div>
      </div>

      {/* 题目显示 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, rotateX: 90 }}
          animate={{ opacity: 1, rotateX: 0 }}
          exit={{ opacity: 0, rotateX: -90 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col"
        >
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 mb-6">
            <p className="text-lg leading-relaxed text-neutral-100">{currentQuestion}</p>
          </div>

          {/* 思考阶段 */}
          {phase === 'thinking' && (
            <div className="flex items-center justify-center gap-4 py-6">
              <div className="text-center">
                <p className="text-sm text-neutral-500 mb-2">思考时间</p>
                <p className={`text-3xl font-mono font-bold ${timerColor(thinkTimeLeft, THINK_TIME)}`}>
                  {formatTime(thinkTimeLeft)}
                </p>
              </div>
              <button
                onClick={() => setPhase('answering')}
                className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                跳过思考 →
              </button>
            </div>
          )}

          {/* 回答阶段 */}
          {phase === 'answering' && (
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-neutral-400">你的回答</label>
                <VoiceInput onTextChange={setCurrentAnswer} text={currentAnswer} />
              </div>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="输入你的回答思路，或使用语音输入..."
                rows={8}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-4 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none resize-none"
                autoFocus
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleNext}
                  className="rounded-lg bg-neutral-100 px-6 py-2.5 text-sm font-medium text-neutral-900 hover:bg-white transition-colors"
                >
                  下一题 →
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 3: 编写模拟面试页面**

创建 `app/prepare/mock/page.tsx`：

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MockSession from '@/components/MockSession';
import { addInterview } from '@/lib/data';

export default function MockPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('mockQuestions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestions(parsed);
        }
      } catch {}
    }
    setLoaded(true);
  }, []);

  const handleComplete = (answers: Array<{ question: string; answer: string }>) => {
    addInterview({
      company: '',
      position: '',
      date: new Date().toISOString().slice(0, 10),
      round: '模拟面试',
      questions: answers.map((a) => ({
        id: crypto.randomUUID(),
        question: a.question,
        answer: a.answer,
        reflection: '',
      })),
    });
    sessionStorage.removeItem('mockQuestions');
    router.push('/timeline');
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-neutral-500">
        加载中...
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-500">
        <p>没有模拟题目。请先在面试前页面生成题目。</p>
        <button
          onClick={() => router.push('/prepare')}
          className="mt-4 text-sm text-neutral-400 hover:text-white underline"
        >
          返回面试前
        </button>
      </div>
    );
  }

  return (
    <MockSession
      questions={questions}
      onComplete={handleComplete}
      onExit={() => router.push('/prepare')}
    />
  );
}
```

- [ ] **Step 4: 提交**

```bash
git add components/MockSession.tsx components/VoiceInput.tsx app/prepare/mock/page.tsx
git commit -m "feat: add full-screen mock interview with voice input and timer"
```

---

### Task 11: 个人档案页面（我的）

**Files:**
- Create: `components/SkillRadar.tsx`
- Create: `app/profile/page.tsx`

**Interfaces:**
- Consumes: `lib/data.ts` 的 `getProfile`, `updateProfile`; `lib/types.ts`
- Produces: 个人档案页面（能力雷达图 + 薄弱环节 + 学习资源）

- [ ] **Step 1: 编写 SVG 技能雷达图**

创建 `components/SkillRadar.tsx`：

```typescript
'use client';

import type { SelfAssessment } from '@/lib/types';

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 30;
const LEVELS = 5;

function polarToCartesian(angle: number, radius: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
}

export default function SkillRadar({ data }: { data: SelfAssessment[] }) {
  const n = data.length;
  const angleStep = 360 / n;

  // 背景网格
  const gridPolygons = Array.from({ length: LEVELS }, (_, level) => {
    const r = (RADIUS * (level + 1)) / LEVELS;
    const points = Array.from({ length: n }, (_, i) => {
      const [x, y] = polarToCartesian(i * angleStep, r);
      return `${x},${y}`;
    }).join(' ');
    return (
      <polygon
        key={level}
        points={points}
        fill="none"
        stroke="rgb(64 64 64)"
        strokeWidth="0.5"
      />
    );
  });

  // 轴线
  const axes = Array.from({ length: n }, (_, i) => {
    const [x, y] = polarToCartesian(i * angleStep, RADIUS);
    return (
      <line
        key={i}
        x1={CENTER}
        y1={CENTER}
        x2={x}
        y2={y}
        stroke="rgb(64 64 64)"
        strokeWidth="0.5"
      />
    );
  });

  // 数据多边形
  const dataPoints = Array.from({ length: n }, (_, i) => {
    const r = (data[i].score / 10) * RADIUS;
    const [x, y] = polarToCartesian(i * angleStep, r);
    return `${x},${y}`;
  }).join(' ');

  // 标签
  const labels = data.map((d, i) => {
    const [x, y] = polarToCartesian(i * angleStep, RADIUS + 20);
    const dx = x > CENTER ? 4 : x < CENTER ? -4 : 0;
    const dy = y > CENTER ? 14 : y < CENTER ? -4 : 4;
    return (
      <text
        key={i}
        x={x}
        y={y}
        dx={dx}
        dy={dy}
        textAnchor={x > CENTER ? 'start' : x < CENTER ? 'end' : 'middle'}
        fill="rgb(163 163 163)"
        fontSize="11"
      >
        {d.dimension}
      </text>
    );
  });

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[300px] h-auto">
      {gridPolygons}
      {axes}
      <polygon
        points={dataPoints}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="rgb(96 165 250)"
        strokeWidth="1.5"
      />
      {data.map((d, i) => {
        const r = (d.score / 10) * RADIUS;
        const [cx, cy] = polarToCartesian(i * angleStep, r);
        return (
          <circle key={i} cx={cx} cy={cy} r="3" fill="rgb(96 165 250)" />
        );
      })}
      {labels}
    </svg>
  );
}
```

- [ ] **Step 2: 编写个人档案页面**

创建 `app/profile/page.tsx`：

```typescript
'use client';

import { useState } from 'react';
import { getProfile, updateProfile } from '@/lib/data';
import SkillRadar from '@/components/SkillRadar';
import { SKILL_DIMENSIONS } from '@/lib/types';
import type { Profile } from '@/lib/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(getProfile());
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateProfile(profile);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateScore = (dimension: string, score: number) => {
    setProfile((prev) => ({
      ...prev,
      selfAssessment: prev.selfAssessment.map((a) =>
        a.dimension === dimension ? { ...a, score } : a
      ),
    }));
  };

  const toggleWeakPoint = (point: string) => {
    setProfile((prev) => ({
      ...prev,
      weakPoints: prev.weakPoints.includes(point)
        ? prev.weakPoints.filter((p) => p !== point)
        : [...prev.weakPoints, point],
    }));
  };

  const addCustomWeakPoint = (point: string) => {
    if (!point.trim()) return;
    setProfile((prev) => ({
      ...prev,
      weakPoints: [...prev.weakPoints, point.trim()],
    }));
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-white">我的 · 能力总结</h1>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-emerald-400">已保存 ✓</span>}
          {editing ? (
            <button
              onClick={handleSave}
              className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white transition-colors"
            >
              保存
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
              编辑
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* 左侧：技能雷达图 */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-sm font-semibold text-neutral-200 mb-6">能力雷达</h2>
          <div className="flex justify-center">
            <SkillRadar data={profile.selfAssessment} />
          </div>
          {editing && (
            <div className="mt-6 space-y-3">
              {profile.selfAssessment.map((item) => (
                <div key={item.dimension} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-neutral-400">{item.dimension}</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={item.score}
                    onChange={(e) => updateScore(item.dimension, parseInt(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="w-6 text-right text-xs text-neutral-300">{item.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：薄弱环节 + 建议 */}
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-sm font-semibold text-neutral-200 mb-4">薄弱环节</h2>
            {editing ? (
              <div className="space-y-2">
                {profile.weakPoints.map((point, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-neutral-300 rounded-lg bg-neutral-800 px-3 py-2">
                      {point}
                    </span>
                    <button
                      onClick={() => toggleWeakPoint(point)}
                      className="text-xs text-neutral-500 hover:text-red-400 shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder="+ 添加薄弱环节"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addCustomWeakPoint((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="w-full rounded-lg border border-dashed border-neutral-700 bg-transparent px-3 py-2 text-sm text-neutral-300 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
                />
              </div>
            ) : (
              <ul className="space-y-2">
                {profile.weakPoints.map((point, i) => (
                  <li key={i} className="text-sm text-neutral-400">• {point}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-sm font-semibold text-neutral-200 mb-4">总体建议</h2>
            {editing ? (
              <textarea
                value={profile.recommendations}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, recommendations: e.target.value }))
                }
                rows={4}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none resize-none"
              />
            ) : (
              <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">
                {profile.recommendations}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 学习资源 */}
      <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-semibold text-neutral-200 mb-4">推荐学习资源</h2>
        <div className="grid grid-cols-3 gap-4">
          {profile.resources.map((res, i) => (
            <a
              key={i}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 hover:border-neutral-600 transition-colors"
            >
              <span className="text-xs text-neutral-500 uppercase">{res.type}</span>
              <p className="mt-1 text-sm font-medium text-neutral-200">{res.title}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add components/SkillRadar.tsx app/profile/page.tsx
git commit -m "feat: add profile page with skill radar, weak points, and resources"
```

---

### Task 12: 最终整合与部署准备

**Files:**
- Create: `.gitignore`（已有则更新）
- Create: `README.md`（项目说明）
- Modify: `app/layout.tsx`（metadata 更新）

- [ ] **Step 1: 确保 .gitignore 完整**

```bash
cat > .gitignore << 'EOF'
node_modules
.next
.env.local
EOF
```

- [ ] **Step 2: 创建 README**

```bash
cat > README.md << 'EOF'
# AI PM 面试复盘

AI 产品经理面试复盘与模拟面试工具。

## 功能

- **面试前**：上传 JD → AI 解析 → 生成针对性模拟题 → 全屏模拟面试
- **面试后**：记录真实面试题目、回答思路、复盘反思
- **复盘库**：时间线浏览所有面试记录，支持搜索和筛选
- **我的**：能力雷达图、薄弱环节分析、学习资源管理

## 开发

```bash
npm install
cp .env.local.example .env.local  # 编辑填入 ANTHROPIC_API_KEY
npm run dev
```

## 部署

```bash
# Vercel 一键部署
vercel
```

环境变量：`ANTHROPIC_API_KEY`
EOF
```

- [ ] **Step 3: 全流程验证**

启动开发服务器，走一遍完整流程：

```bash
npm run dev
```

1. 首页 → 自动跳转 `/timeline` → 种子数据正常展示
2. 点击卡片 → 详情页 → 返回
3. 面试后 → 新增一条记录 → 保存 → 时间线出现新卡片
4. 面试前 → 粘贴 JD → 解析 → 生成题目
5. 开始模拟 → 思考倒计时 → 回答 → 下一题 → 完成 → 保存 → 时间线出现模拟记录
6. 我的 → 查看雷达图 → 编辑 → 修改评分 → 保存
7. 搜索和公司筛选 → 功能正常
8. 移动端浏览器查看 → 布局可读

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "chore: final integration with README, gitignore, and metadata"
```

- [ ] **Step 5: 部署到 Vercel（可选，需要用户操作）**

```bash
npx vercel --env ANTHROPIC_API_KEY=your_key_here
```

---
