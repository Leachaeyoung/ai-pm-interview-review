import { getInterview } from '@/lib/data';
import InterviewDetail from '@/components/InterviewDetail';
import { notFound } from 'next/navigation';

export default function InterviewDetailPage({ params }: { params: { id: string } }) {
  const interview = getInterview(params.id);
  if (!interview) notFound();
  return <InterviewDetail interview={interview} />;
}
