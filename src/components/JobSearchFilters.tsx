import React from 'react';
import { Search, X } from 'lucide-react';

interface Filters {
  search: string;
  type: string;
  city: string;
  qualification: string;
  workplace: string;
  salary: string;
  department: string;
  experience: string;
}

interface JobSearchFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  totalCount: number;
  jobType?: 'all' | 'articleship' | 'internships';
}

const CITIES = ['All Cities', 'Bangalore', 'Mumbai', 'Hyderabad', 'Delhi NCR', 'Chennai', 'Pune', 'Remote'];
const QUALIFICATIONS = ['All Qualifications', 'CA', 'ACCA', 'US CPA', 'CFA', 'CS', 'CMA India', 'US CMA', 'B.Com / M.Com'];
const WORKPLACES = ['All Modes', 'Onsite', 'Hybrid', 'Remote'];
const SALARY_RANGES = ['Any Salary', 'Stipend / Training', '0–4 LPA', '4–8 LPA', '8–15 LPA', '15+ LPA'];
const DEPARTMENTS = [
  'All Categories',
  'Audit & Assurance',
  'Taxation',
  'FP&A & Corporate Finance',
  'Investment Banking & M&A',
  'Global Accounting (US GAAP/IFRS)',
  'Risk & Compliance',
  'Banking & Financial Services',
  'Consulting & Advisory',
  'Finance Operations & GCCs',
  'Articleship Desk',
];
const JOB_TYPES = ['All Types', 'Full-Time', 'Articleship / Industrial Training', 'Internship', 'Contract'];
const EXPERIENCE_LEVELS = ['All Experience', 'Articleship / 0 yrs', '0-1 yr (Fresher)', '1-3 yrs', '3-5 yrs', '5+ yrs'];

export const JobSearchFilters: React.FC<JobSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  totalCount,
  jobType = 'all',
}) => {
  const set = (key: keyof Filters, value: string) =>
    onFiltersChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.search ||
    filters.type !== '' ||
    filters.city !== '' ||
    filters.qualification !== '' ||
    filters.workplace !== '' ||
    filters.salary !== '' ||
    filters.department !== '' ||
    filters.experience !== '';

  const clearAll = () =>
    onFiltersChange({ search: '', type: '', city: '', qualification: '', workplace: '', salary: '', department: '', experience: '' });

  return (
    <div
      style={{
        position: 'sticky',
        top: 65,
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(15,36,25,0.05)',
        zIndex: 30,
        padding: '12px 0',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Search + filter row */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flexShrink: 0, width: 300 }} className="filter-search-wrap">
            <Search
              size={15}
              color="#9ca3af"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              type="text"
              className="input-field"
              value={filters.search}
              onChange={(e) => set('search', e.target.value)}
              placeholder="Search job title, skill..."
              style={{ paddingLeft: 32, paddingRight: 32 }}
            />
            {filters.search && (
              <button
                onClick={() => set('search', '')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  color: '#9ca3af',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <select
            className="input-field filter-select"
            style={{ width: 'auto', paddingRight: 32 }}
            value={filters.type}
            onChange={(e) => set('type', e.target.value)}
          >
            {JOB_TYPES.map((t) => (
              <option key={t} value={t === 'All Types' ? '' : t}>
                {t}
              </option>
            ))}
          </select>

          <select
            className="input-field filter-select"
            style={{ width: 'auto', paddingRight: 32 }}
            value={filters.city}
            onChange={(e) => set('city', e.target.value)}
          >
            {CITIES.map((c) => (
              <option key={c} value={c === 'All Cities' ? '' : c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="input-field filter-select"
            style={{ width: 'auto', paddingRight: 32 }}
            value={filters.qualification}
            onChange={(e) => set('qualification', e.target.value)}
          >
            {QUALIFICATIONS.map((q) => (
              <option key={q} value={q === 'All Qualifications' ? '' : q}>
                {q}
              </option>
            ))}
          </select>

          <select
            className="input-field filter-select"
            style={{ width: 'auto', paddingRight: 32 }}
            value={filters.workplace}
            onChange={(e) => set('workplace', e.target.value)}
          >
            {WORKPLACES.map((w) => (
              <option key={w} value={w === 'All Modes' ? '' : w}>
                {w}
              </option>
            ))}
          </select>

          <select
            className="input-field filter-select"
            style={{ width: 'auto', paddingRight: 32 }}
            value={filters.salary}
            onChange={(e) => set('salary', e.target.value)}
          >
            {SALARY_RANGES.map((s) => (
              <option key={s} value={s === 'Any Salary' ? '' : s}>
                {s}
              </option>
            ))}
          </select>

          <select
            className="input-field filter-select"
            style={{ width: 'auto', paddingRight: 32 }}
            value={filters.experience}
            onChange={(e) => set('experience', e.target.value)}
          >
            {EXPERIENCE_LEVELS.map((e) => (
              <option key={e} value={e === 'All Experience' ? '' : e}>
                {e}
              </option>
            ))}
          </select>

          <select
            className="input-field filter-select"
            style={{ width: 'auto', paddingRight: 32 }}
            value={filters.department}
            onChange={(e) => set('department', e.target.value)}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d === 'All Categories' ? '' : d}>
                {d}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearAll}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#dc2626',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Result count */}
        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
          <span style={{ fontWeight: 700, color: '#0f2419' }}>{totalCount}</span> jobs found
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .filter-search-wrap { width: 100% !important; flex-shrink: 0 !important; }
          .filter-select { width: calc(50% - 5px) !important; min-width: 0 !important; font-size: 12px !important; }
        }
        @media (max-width: 400px) {
          .filter-select { width: 100% !important; }
        }
      `}</style>
    </div>
  );
};
