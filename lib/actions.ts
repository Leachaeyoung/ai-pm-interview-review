'use server';

import { deleteInterview } from '@/lib/data';
import { revalidatePath } from 'next/cache';

export async function deleteInterviewAction(id: string): Promise<void> {
  deleteInterview(id);
  revalidatePath('/timeline');
}
