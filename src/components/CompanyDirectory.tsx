import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building2, MapPin, Briefcase, ChevronRight } from 'lucide-react';

export interface ApiCompany {
  id: string;
  name: string;
  logo_url?: string;
  industry_category?: string;
  company_type?: string;
  headquarters?: string;
  company_size?: string;
  founded_year?: string;
  about?: string;
  website?: string;
  specializations?: string[];
  status: 'MoU Partner' | 'Verified' | 'Active';
  active_jobs_count: number;
}

interface CompanyDirectoryProps {
  onSelectCompany: (company: ApiCompany) => void;
}

const PAGE_SIZE = 24;

const CATEGORY_FILTERS = [
  'All',
  'Big 4 / Audit',
  'Investment Banking',
  'Fintech',
  'GCC / BPO',
  'Boutique Firms',
];

export const CompanyDirectory: React.FC<CompanyDirectoryProps> = ({ onSelectCompany }) => {
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [hiringOnly, setHiringOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch('/api/companies/public')
      .then(r => r.ok ? r.json() : { companies: [] })
      .then(data => {
        const mapped = (data.companies || []).map((c: Record<string, unknown>) => ({
          id: c.id,
          name: c.company_name || c.name || 'Unknown',
          logo_url: c.logo_url,
          industry_category: c.industry || c.industry_category,
          company_type: c.company_type,
          headquarters: c.city || c.headquarters,
          company_size: c.company_size,
          founded_year: c.founded_year,
          about: c.about || c.notes,
          website: c.website,
          specializations: c.hiring_focus,
          status: c.verification_status === 'verified' ? 'Verified' : 'Active',
          active_jobs_count: c.active_jobs_count ?? 0,
        }));
        setCompanies(mapped);
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return companies.filter(co => {
      if (q && !co.name.toLowerCase().includes(q) && !co.industry_category?.toLowerCase().includes(q)) return false;
      if (hiringOnly && co.active_jobs_count === 0) return false;
      if (categoryFilter !== 'All') {
        const cat = (co.industry_category || co.company_type || '').toLowerCase();
        if (categoryFilter === 'Big 4 / Audit' && !/(big 4|audit|assurance|advisory|accounting)/.test(cat)) return false;
        if (categoryFilter === 'Investment Banking' && !/(investment bank|ib|m&a|capital)/.test(cat)) return false;
        if (categoryFilter === 'Fintech' && !/(fintech|payment|broker|capital market)/.test(cat)) return false;
        if (categoryFilter === 'GCC / BPO' && !/(gcc|bpo|outsourc|shared service)/.test(cat)) return false;
        if (categoryFilter === 'Boutique Firms' && !/(boutique|mid-tier|small)/.test(cat)) return false;
      }
      return true;
    });
  }, [companies, search, categoryFilter, hiringOnly]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const logoFallback = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div className="ap-fade-left ap-d0" style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f2419', margin: '0 0 6px' }}>Hiring Companies</h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
          Verified recruiters and MoU partners of ArivuPro Finance Academy
        </p>
      </div>

      {/* Search + filters */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search companies..."
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12,
              height: 40, border: '1px solid #e5e7eb', borderRadius: 10,
              fontSize: 13, fontFamily: 'Manrope, sans-serif', outline: 'none',
              color: '#0f2419', background: '#fff', boxSizing: 'border-box',
            }}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={hiringOnly}
            onChange={e => { setHiringOnly(e.target.checked); setPage(1); }}
            style={{ accentColor: '#1a7a4a', width: 15, height: 15 }}
          />
          Hiring now
        </label>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {CATEGORY_FILTERS.map(cat => (
          <button
            key={cat}
            onClick={() => { setCategoryFilter(cat); setPage(1); }}
            style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: '1.5px solid',
              borderColor: categoryFilter === cat ? '#1a7a4a' : '#e5e7eb',
              background: categoryFilter === cat ? '#1a7a4a' : '#fff',
              color: categoryFilter === cat ? '#fff' : '#374151',
              fontFamily: 'Manrope, sans-serif',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
        {loading ? 'Loading companies…' : `${filtered.length} ${filtered.length === 1 ? 'company' : 'companies'}`}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, minHeight: 100 }}>
              <div className="ap-skeleton" style={{ width: 44, height: 44, marginBottom: 12 }} />
              <div className="ap-skeleton" style={{ height: 14, marginBottom: 8 }} />
              <div className="ap-skeleton" style={{ height: 11, width: '60%' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb' }}>
          <Building2 size={40} color="#d7f4ea" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 700, color: '#0f2419', marginBottom: 6 }}>No companies found</div>
          <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>Try adjusting your search or filters</p>
          <button className="btn-outline" onClick={() => { setSearch(''); setCategoryFilter('All'); setHiringOnly(false); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {paginated.map((co, i) => (
              <div
                key={co.id}
                className={`ap-card ap-fade-up ap-d${Math.min(i % 6, 7)}`}
                style={{ padding: 20, cursor: 'pointer', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14 }}
                onClick={() => onSelectCompany(co)}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  {co.logo_url ? (
                    <img
                      src={co.logo_url}
                      alt={co.name}
                      style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain', border: '1px solid #e5e7eb', flexShrink: 0, background: '#fff' }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0faf4', border: '1px solid #d7f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#1a7a4a', fontSize: 13, flexShrink: 0 }}>
                      {logoFallback(co.name)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f2419', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{co.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{co.industry_category || co.company_type || 'Company'}</div>
                  </div>
                  <ChevronRight size={15} color="#9ca3af" style={{ flexShrink: 0, marginTop: 2 }} />
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  {co.headquarters && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                      <MapPin size={11} color="#9ca3af" />
                      {co.headquarters}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: co.active_jobs_count > 0 ? '#1a7a4a' : '#9ca3af', fontWeight: co.active_jobs_count > 0 ? 700 : 400 }}>
                    <Briefcase size={11} color={co.active_jobs_count > 0 ? '#1a7a4a' : '#9ca3af'} />
                    {co.active_jobs_count > 0 ? `${co.active_jobs_count} open roles` : 'No open roles'}
                  </div>
                </div>

                {/* Badge */}
                <span className={co.status === 'MoU Partner' ? 'badge badge-yellow' : 'badge badge-green'}>
                  {co.status === 'MoU Partner' ? '★ MoU Partner' : '✓ Verified'}
                </span>
              </div>
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button
                className="btn-outline"
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '10px 28px' }}
              >
                Load more ({filtered.length - paginated.length} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
