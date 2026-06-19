import { getInterview } from '@/lib/data';
import ReviewClient from './ReviewClient';

export default function ReviewPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const interview = searchParams.id ? getInterview(searchParams.id) : undefined;
  return <ReviewClient initialData={interview} />;
}
