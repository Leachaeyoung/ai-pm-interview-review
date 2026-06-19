import { getInterviews } from '@/lib/data';
import TimelineClient from '@/components/TimelineClient';

export default function TimelinePage() {
  const interviews = getInterviews();
  const companies = Array.from(new Set(interviews.map((i) => i.company)));

  return <TimelineClient interviews={interviews} companies={companies} />;
}
