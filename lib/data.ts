import 'server-only';
import { v4 as uuid } from 'uuid';
import type { Interview, Profile, KnowledgeConcept } from './types';
import interviewsData from '@/data/interviews.json';
import profileData from '@/data/profile.json';
import knowledgeFeedData from '@/data/knowledge-feed.json';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const INTERVIEWS_PATH = path.join(DATA_DIR, 'interviews.json');
const PROFILE_PATH = path.join(DATA_DIR, 'profile.json');
const KNOWLEDGE_PATH = path.join(DATA_DIR, 'knowledge-feed.json');

// In-memory cache — read once at module init, write through on change
let interviews: Interview[] = [...interviewsData] as Interview[];
let profile: Profile = { ...profileData } as Profile;
let knowledgeFeed: KnowledgeConcept[] = [...knowledgeFeedData] as KnowledgeConcept[];

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
  const interview = interviews.find((i) => i.id === id);
  return interview ? { ...interview } : undefined;
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
  return interviews
    .filter((i) => i.company.includes(company))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function searchInterviews(keyword: string): Interview[] {
  const kw = keyword.toLowerCase();
  return interviews
    .filter(
      (i) =>
        i.company.toLowerCase().includes(kw) ||
        i.position.toLowerCase().includes(kw) ||
        i.questions.some(
          (q) =>
            q.question.toLowerCase().includes(kw) ||
            q.answer.toLowerCase().includes(kw) ||
            q.reflection.toLowerCase().includes(kw)
        )
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ---- Knowledge Feed ----

function persistKnowledge(): void {
  fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify(knowledgeFeed, null, 2), 'utf-8');
}

export function getKnowledgeFeed(): KnowledgeConcept[] {
  return [...knowledgeFeed].sort(
    (a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime()
  );
}

export function getNewKnowledgeCount(): number {
  return knowledgeFeed.filter((c) => c.isNew).length;
}

export function markKnowledgeAsRead(): void {
  let changed = false;
  for (const c of knowledgeFeed) {
    if (c.isNew) {
      c.isNew = false;
      changed = true;
    }
  }
  if (changed) persistKnowledge();
}

export function replaceKnowledgeFeed(concepts: KnowledgeConcept[]): KnowledgeConcept[] {
  knowledgeFeed = concepts;
  persistKnowledge();
  return knowledgeFeed;
}
