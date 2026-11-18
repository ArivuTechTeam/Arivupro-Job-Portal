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
  recency: string;
}

interface JobSearchFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  totalCount: number;
  jobType?: 'all' | 'articleship' | 'internships';
}

const CITIES = ['All Cities', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Chennai', 'Hyderabad', 'Pune', 'Gurugram', 'Ahmedabad', 'Jaipur', 'Remote'];
const QUALIFICATIONS = ['All Qualifications', 'CA', 'CMA India', 'CS', 'ACCA', 'CFA', 'US CPA', 'US CMA', 'B.Com / M.Com'];
const SALARY_RANGES = ['Any Stipend', 'Up to ₹5,000', '₹5,000–₹10,000', '₹10,000–₹15,000', '₹15,000+'];
const JOB_TYPES = ['All Types', 'Full-Time', 'Articleship / Industrial Training', 'Internship', 'Contract'];
const EXPERIENCE_LEVELS = ['All Experience', 'Articleship / 0 yrs', '0-1 yr (Fresher)', '1-3 yrs', '3-5 yrs', '5+ yrs'];
const RECENCY = ['Any Time', 'Last 24 hours', 'Last 3 days', 'Last 7 days', 'Last 14 days'];

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
    filters.experience !== '' ||
    filters.recency !== '';

  const clearAll = () =>
    onFiltersChange({ search: '', type: '', city: '', qualification: '', workplace: '', salary: '', department: '', experience: '', recency: '' });

  return (
    <div style={{
      position: 'sticky',
      top: 65,
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      zIndex: 30,
      padding: '14px 0',
    }}>
      <div style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {/* Search + filter row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Search */}
          <div style={{ position: 'relative', flexShrink: 0, width: 260 }} className="filter-search-wrap">
            <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input-field"
              value={filters.search}
              onChange={(e) => set('search', e.target.value)}
              placeholder="Firm name, role, city..."
              style={{ paddingLeft: 30, paddingRight: 28 }}
            />
            {filters.search && (
              <button
                onClick={() => set('search', '')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9ca3af' }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <select className="input-field filter-select" style={{ width: 'auto' }} value={filters.qualification} onChange={(e) => set('qualification', e.target.value)}>
            {QUALIFICATIONS.map(q => (
              <option key={q} value={q === 'All Qualifications' ? '' : q}>{q}</option>
            ))}
          </select>

          {/* Tier filter maps to job type */}
          <select className="input-field filter-select" style={{ width: 'auto' }} value={filters.type} onChange={(e) => set('type', e.target.value)}>
            {JOB_TYPES.map(t => (
              <option key={t} value={t === 'All Types' ? '' : t}>{t}</option>
            ))}
          </select>

          <select className="input-field filter-select" style={{ minWidth: 110 }} value={filters.city} onChange={(e) => set('city', e.target.value)}>
            {CITIES.map(c => (
              <option key={c} value={c === 'All Cities' ? '' : c}>{c}</option>
            ))}
          </select>

          <select className="input-field filter-select" style={{ width: 'auto' }} value={filters.salary} onChange={(e) => set('salary', e.target.value)}>
            {SALARY_RANGES.map(s => (
              <option key={s} value={s === 'Any Stipend' ? '' : s}>{s}</option>
            ))}
          </select>

          <select className="input-field filter-select" style={{ width: 'auto' }} value={filters.experience} onChange={(e) => set('experience', e.target.value)}>
            {EXPERIENCE_LEVELS.map(e => (
              <option key={e} value={e === 'All Experience' ? '' : e}>{e}</option>
            ))}
          </select>

          {/* Posting recency */}
          <select className="input-field filter-select" style={{ minWidth: 110 }} value={filters.recency ?? ''} onChange={(e) => set('recency', e.target.value)}>
            {RECENCY.map(r => (
              <option key={r} value={r === 'Any Time' ? '' : r}>{r}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearAll}
              style={{
                fontSize: 13, fontWeight: 600, color: '#dc2626',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Result count */}
        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
          Showing <span style={{ fontWeight: 700, color: '#0f2419' }}>{totalCount}</span> {jobType === 'articleship' ? 'vacancies' : 'jobs'}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .filter-search-wrap { width: 100% !important; }
          .filter-select { width: calc(50% - 4px) !important; min-width: 0 !important; font-size: 12px !important; }
        }
        @media (max-width: 400px) {
          .filter-select { width: 100% !important; }
        }
      `}</style>
    </div>
  );
};
