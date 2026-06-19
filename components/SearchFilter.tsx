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
