import React, { useState } from 'react';
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES } from './CategoryPills.tsx';

export interface Filters {
  search: string;
  type: string;
  city: string[];
  qualification: string[];
  workplace: string[];
  salary: string;
  department: string;
  category: string[];
  experience: string;
  recency: string;
}

export const EMPTY: Filters = {
  search: '', type: '', city: [], qualification: [],
  workplace: [], salary: '', department: '', category: [],
  experience: '', recency: '',
};

interface JobSearchFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  totalCount: number;
  jobType?: 'all' | 'articleship' | 'internships';
}

interface FilterSidebarProps {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  jobType?: 'all' | 'articleship' | 'internships';
}

const CITIES = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Chennai', 'Hyderabad', 'Pune', 'Gurugram', 'Ahmedabad', 'Jaipur', 'Remote'];
const QUALIFICATIONS = ['CA', 'CMA India', 'CS', 'ACCA', 'CFA', 'US CPA', 'US CMA', 'B.Com / M.Com'];
const RECENCY = [
  { label: 'Any time', value: '' },
  { label: 'Today', value: 'Last 24 hours' },
  { label: 'Past 3 days', value: 'Last 3 days' },
  { label: 'Past week', value: 'Last 7 days' },
  { label: 'Past month', value: 'Last 14 days' },
];
const WORKPLACE = ['Onsite', 'Remote', 'Hybrid'];

function toggleArr(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 16, marginBottom: 16 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: open ? 12 : 0 }}
      >
        <span style={{ fontSize: 13, fontWeight: 800, color: '#0f2419', fontFamily: 'Manrope, sans-serif' }}>{title}</span>
        {open ? <ChevronUp size={15} color="#9ca3af" /> : <ChevronDown size={15} color="#9ca3af" />}
      </button>
      {open && children}
    </div>
  );
}

function CheckItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
      <input
        type="checkbox"
        checked={active}
        onChange={onClick}
        style={{ accentColor: '#1a7a4a', width: 15, height: 15, flexShrink: 0, cursor: 'pointer' }}
      />
      <span style={{ fontSize: 13, color: active ? '#1a7a4a' : '#374151', fontWeight: active ? 700 : 500, fontFamily: 'Manrope, sans-serif', lineHeight: 1.3 }}>
        {label}
      </span>
    </label>
  );
}

function SidebarContent({ filters, onFiltersChange, jobType = 'all' }: FilterSidebarProps) {
  const hasActiveFilters = filters.city.length > 0 || filters.qualification.length > 0 ||
    filters.category.length > 0 || filters.workplace.length > 0 || !!filters.recency;

  const toggleMulti = (key: 'city' | 'qualification' | 'category' | 'workplace', value: string) =>
    onFiltersChange({ ...filters, [key]: toggleArr(filters[key], value) });

  const setRecency = (value: string) => onFiltersChange({ ...filters, recency: value });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', fontFamily: 'Manrope, sans-serif' }}>Filters</span>
        {hasActiveFilters && (
          <button onClick={() => onFiltersChange(EMPTY)} style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>
            Clear all
          </button>
        )}
      </div>

      {/* Category — multi-select */}
      {jobType === 'all' && (
        <Section title="Category">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {CATEGORIES.map(cat => (
              <CheckItem key={cat.key} label={cat.label} active={filters.category.includes(cat.key)} onClick={() => toggleMulti('category', cat.key)} />
            ))}
            <CheckItem label="Other" active={filters.category.includes('other')} onClick={() => toggleMulti('category', 'other')} />
          </div>
        </Section>
      )}

      {/* Location — multi-select */}
      <Section title="Location">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {CITIES.map(city => (
            <CheckItem key={city} label={city} active={filters.city.includes(city)} onClick={() => toggleMulti('city', city)} />
          ))}
          <CheckItem label="Other" active={filters.city.includes('other')} onClick={() => toggleMulti('city', 'other')} />
        </div>
      </Section>

      {/* Date posted — single select (radio behaviour) */}
      <Section title="Date posted">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {RECENCY.map(r => (
            <CheckItem key={r.value} label={r.label} active={filters.recency === r.value} onClick={() => setRecency(r.value)} />
          ))}
        </div>
      </Section>

      {/* Qualification — multi-select */}
      <Section title="Qualification" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {QUALIFICATIONS.map(q => (
            <CheckItem key={q} label={q} active={filters.qualification.includes(q)} onClick={() => toggleMulti('qualification', q)} />
          ))}
          <CheckItem label="Other" active={filters.qualification.includes('other')} onClick={() => toggleMulti('qualification', 'other')} />
        </div>
      </Section>

      {/* Workplace — multi-select */}
      <Section title="Workplace" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {WORKPLACE.map(w => (
            <CheckItem key={w} label={w} active={filters.workplace.includes(w)} onClick={() => toggleMulti('workplace', w)} />
          ))}
        </div>
      </Section>
    </div>
  );
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onFiltersChange, jobType = 'all' }) => (
  <SidebarContent filters={filters} onFiltersChange={onFiltersChange} jobType={jobType} />
);

export const JobSearchFilters: React.FC<JobSearchFiltersProps> = ({ filters, onFiltersChange, totalCount, jobType = 'all' }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeFilterCount =
    filters.city.length + filters.qualification.length +
    filters.category.length + filters.workplace.length +
    (filters.recency ? 1 : 0);

  return (
    <>
      {/* Sticky search bar */}
      <div style={{ position: 'sticky', top: 60, background: '#fff', borderBottom: '1px solid #e5e7eb', zIndex: 30, padding: '12px 0' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
            <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input-field"
              value={filters.search}
              onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
              placeholder="Job title, keyword, or company..."
              style={{ paddingLeft: 36, paddingRight: filters.search ? 32 : 12, width: '100%', boxSizing: 'border-box' }}
            />
            {filters.search && (
              <button onClick={() => onFiltersChange({ ...filters, search: '' })} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Mobile filter toggle */}
          <button
            className="filter-mobile-toggle"
            onClick={() => setMobileOpen(v => !v)}
            style={{ display: 'none', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 700, color: '#0f2419', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', flexShrink: 0 }}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{ background: '#1a7a4a', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 800 }}>{activeFilterCount}</span>
            )}
          </button>

          <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, flexShrink: 0, marginLeft: 'auto' }}>
            <span style={{ fontWeight: 800, color: '#0f2419' }}>{totalCount}</span> {jobType === 'articleship' ? 'vacancies' : 'jobs'}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)' }} onClick={() => setMobileOpen(false)}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 300, background: '#fff', overflowY: 'auto', padding: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0f2419', fontFamily: 'Manrope, sans-serif' }}>Filters</span>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}><X size={18} /></button>
            </div>
            <SidebarContent filters={filters} onFiltersChange={onFiltersChange} jobType={jobType} />
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .filter-mobile-toggle { display: flex !important; }
          .filter-sidebar { display: none !important; }
        }
      `}</style>
    </>
  );
};
