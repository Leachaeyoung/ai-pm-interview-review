'use client';

import { useRouter } from 'next/navigation';
import { saveInterviewAction } from '@/lib/actions';
import InterviewForm from '@/components/InterviewForm';
import type { Interview } from '@/lib/types';

export default function ReviewClient({ initialData }: { initialData?: Interview }) {
  const router = useRouter();

  const handleSave = async (data: Omit<Interview, 'id' | 'createdAt'>) => {
    await saveInterviewAction(initialData, data);
    router.push('/timeline');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div>
      <h1 className="mb-8 text-xl font-bold text-white">
        {initialData ? '编辑面试记录' : '新增面试记录'}
      </h1>
      <InterviewForm
        initialData={initialData}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
