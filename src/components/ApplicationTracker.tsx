import React, { useState, useMemo } from 'react';
import { JobApplication, StudentProfile } from '../types/index.ts';
import { siteName } from '../lib/siteName.ts';

interface ApplicationTrackerProps {
  applications: JobApplication[];
  student: StudentProfile;
  onRefresh: () => void;
  onSelectApplication: (app: JobApplication) => void;
}

function relativeDate(dateStr: string) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

function initials(company: string) {
  return company.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const ICON_OK = (
  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="10" cy="10" r="9" fill="#1a7a4a" />
    <path d="M6 10.3l2.6 2.6L14 7.6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICON_EXT = (
  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M11 3h6v6M17 3l-8 8M14 11v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="#5f6b65" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  applications,
  onRefresh,
  onSelectApplication,
}) => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? applications.filter(a =>
          a.jobTitle.toLowerCase().includes(q) || a.company.toLowerCase().includes(q)
        )
      : applications;
    return [...list].sort((a, b) => {
      const ta = new Date(a.appliedDate).getTime();
      const tb = new Date(b.appliedDate).getTime();
      return sort === 'newest' ? tb - ta : ta - tb;
    });
  }, [applications, search, sort]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24, fontFamily: 'Manrope, sans-serif' }} className="at-root">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 20 }} className="at-head">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#14201a' }}>My applications</h1>
          <p style={{ color: '#5f6b65', margin: 0, fontSize: 14 }}>{applications.length} job{applications.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onRefresh}
          style={{ height: 38, padding: '0 14px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: '1px solid #dfe3e0', background: '#fff', color: '#33403a', fontFamily: 'Manrope, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}
          title="Refresh"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M17 10a7 7 0 1 1-1.5-4.4" stroke="#33403a" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M17 4.5V9h-4.5" stroke="#33403a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }} className="at-toolbar">
        <input
          className="at-search"
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by job or company"
          aria-label="Search applications"
          style={{ height: 38, border: '1px solid #dfe3e0', borderRadius: 6, padding: '0 12px', fontSize: 14, fontFamily: 'Manrope, sans-serif', background: '#fff', width: 280 }}
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value as 'newest' | 'oldest')}
          aria-label="Sort"
          style={{ height: 38, border: '1px solid #dfe3e0', borderRadius: 6, padding: '0 10px', fontSize: 13, fontWeight: 600, fontFamily: 'Manrope, sans-serif', background: '#fff', color: '#33403a', cursor: 'pointer' }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 20px', border: '2px dashed #dfe3e0', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#d1d5db" strokeWidth="1.5" />
            <path d="M14 2v6h6M9 13h6M9 17h4" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#14201a' }}>
            {search ? 'No matching applications' : "You haven't applied to any jobs yet."}
          </div>
          {!search && (
            <p style={{ fontSize: 13, color: '#9ca3af', maxWidth: 320, margin: 0 }}>
              Browse jobs and apply with your ArivuPro profile to track everything here.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }} className="at-cards">
          {filtered.map((app) => {
            const isExt = app.kind === 'external';
            return (
              <article
                key={app.id}
                style={{ background: '#fff', border: '1px solid #dfe3e0', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {/* Top */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: '#e7ece9', color: '#3d4a43', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {initials(app.company)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#14201a', fontSize: 14, lineHeight: 1.3 }}>{app.jobTitle}</div>
                    <div style={{ fontSize: 13, color: '#5f6b65', marginTop: 2 }}>{app.company}{app.location ? ` · ${app.location}` : ''}</div>
                  </div>
                </div>

                {/* Message */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', borderRadius: 6, padding: '10px 12px', fontSize: 13, lineHeight: 1.45, background: isExt ? '#f4f6f5' : '#eef7f1', color: isExt ? '#33403a' : '#14432b' }}>
                  {isExt ? ICON_EXT : ICON_OK}
                  <div>
                    {isExt
                      ? <><b style={{ fontWeight: 700 }}>Opened on {siteName(app.applyUrl || '')}.</b> Complete your application there.</>
                      : <><b style={{ fontWeight: 700 }}>Application sent successfully.</b> {app.company} has your profile and resume.</>}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#7a857f' }}>
                  <span>Applied {relativeDate(app.appliedDate)}</span>
                  {isExt && app.applyUrl
                    ? <a href={app.applyUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1a7a4a', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Open again ↗</a>
                    : <button onClick={() => onSelectApplication(app)} style={{ color: '#1a7a4a', fontWeight: 700, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Manrope, sans-serif' }}>View job</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .at-root { padding: 16px 16px 90px !important; }
          .at-head { flex-direction: column !important; align-items: stretch !important; }
          .at-toolbar { flex-direction: column !important; align-items: stretch !important; }
          .at-search { width: 100% !important; }
          .at-cards { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
