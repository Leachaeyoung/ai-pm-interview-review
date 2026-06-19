import 'server-only';
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
