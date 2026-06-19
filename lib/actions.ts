'use server';

import { revalidatePath } from 'next/cache';
import { addInterview, updateInterview, deleteInterview, updateProfile } from '@/lib/data';
import type { Interview, Profile } from '@/lib/types';

export async function deleteInterviewAction(id: string): Promise<void> {
  deleteInterview(id);
  revalidatePath('/timeline');
}

export async function saveProfileAction(profile: Profile): Promise<void> {
  updateProfile(profile);
  revalidatePath('/profile');
}

export async function saveInterviewAction(
  initialData: Interview | undefined,
  formData: Omit<Interview, 'id' | 'createdAt'>
): Promise<void> {
  if (initialData) {
    updateInterview(initialData.id, formData);
  } else {
    addInterview(formData);
  }
  revalidatePath('/timeline');
}
