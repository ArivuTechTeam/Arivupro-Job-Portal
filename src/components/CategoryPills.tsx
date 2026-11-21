import { useMemo } from 'react';
import { JobListing } from '../types/index.ts';

interface CategoryPillsProps {
  jobs: JobListing[];
  activeDepartment: string;
  onSelect: (dept: string) => void;
}

export function CategoryPills({ jobs, activeDepartment, onSelect }: CategoryPillsProps) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const j of jobs) {
      if (j.department) map[j.department] = (map[j.department] ?? 0) + 1;
    }
    return Object.entries(map)
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [jobs]);

  if (counts.length === 0) return null;

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', overflowX: 'auto', scrollbarWidth: 'none' }}>
      <div style={{ display: 'flex', gap: 8, padding: '12px 24px', maxWidth: 1180, margin: '0 auto', width: 'max-content', minWidth: '100%', boxSizing: 'border-box' }}>
        {/* All pill */}
        <button
          onClick={() => onSelect('')}
          style={{
            flexShrink: 0,
            padding: '6px 16px', borderRadius: 20, border: '1.5px solid',
            borderColor: activeDepartment === '' ? '#1a7a4a' : '#e5e7eb',
            background: activeDepartment === '' ? '#1a7a4a' : '#fff',
            color: activeDepartment === '' ? '#fff' : '#374151',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
        >
          All jobs
        </button>

        {counts.map(([dept, count]) => {
          const active = activeDepartment === dept;
          return (
            <button
              key={dept}
              onClick={() => onSelect(active ? '' : dept)}
              style={{
                flexShrink: 0,
                padding: '6px 16px', borderRadius: 20, border: '1.5px solid',
                borderColor: active ? '#1a7a4a' : '#e5e7eb',
                background: active ? '#f0fdf4' : '#fff',
                color: active ? '#1a7a4a' : '#374151',
                fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {dept}
              <span style={{
                background: active ? '#1a7a4a' : '#f3f4f6',
                color: active ? '#fff' : '#6b7280',
                borderRadius: 10, padding: '1px 7px',
                fontSize: 11, fontWeight: 700,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <style>{`.category-pills-row::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
