'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Interview } from '@/lib/types';
import Timeline from './Timeline';
import SearchFilter from './SearchFilter';

export default function TimelineClient({
  interviews,
  companies,
}: {
  interviews: Interview[];
  companies: string[];
}) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  const filtered = useMemo(() => {
    let result = interviews;
    if (companyFilter) result = result.filter((i) => i.company === companyFilter);
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      result = result.filter(
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
    return result;
  }, [interviews, keyword, companyFilter]);

  return (
    <div>
      <SearchFilter
        onSearch={setKeyword}
        onCompanyFilter={setCompanyFilter}
        companies={companies}
      />
      <Timeline
        interviews={filtered}
        onSelect={(id) => router.push(`/timeline/${id}`)}
      />
    </div>
  );
}
