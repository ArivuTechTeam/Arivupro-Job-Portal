import React, { useState, useEffect } from 'react';
import { adminFetch } from '../lib/supabase/auth';

interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  job_type: string;
  fetched_at: string;
  posted_at: string;
  apply_url: string;
}

const SOURCE_LABELS: Record<string, string> = {
  jsearch: 'JSearch',
  buddingca: 'BuddingCA',
  caclubindia: 'CAclubIndia',
  icai_eirc: 'ICAI EIRC',
  icai_nirc: 'ICAI NIRC',
  icai_sirc: 'ICAI SIRC',
  icai_wirc: 'ICAI WIRC',
  icai_kochi: 'ICAI Kochi',
  icai_pune: 'ICAI Pune',
  icai_bangalore: 'ICAI Bangalore',
  icmai: 'ICMAI',
  jobspy: 'JobSpy',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  workday: 'Workday',
  apify_all_in_one: 'Apify (All-in-One)',
  apify_naukri: 'Apify (Naukri)',
  apify_linkedin_indeed: 'Apify (LinkedIn/Indeed)',
  apify_career_sites: 'Apify (Career Sites)',
};

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export const SyncedJobsTab: React.FC = () => {
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = '/api/external-jobs?limit=5000' + (sourceFilter ? `&source=${encodeURIComponent(sourceFilter)}` : '');
    adminFetch(url)
      .then(r => r.json())
      .then((data: { jobs?: ExternalJob[] } | ExternalJob[]) => {
        const list: ExternalJob[] = Array.isArray(data) ? data : (data.jobs || []);
        const sorted = [...list].sort((a, b) =>
          new Date(b.fetched_at || b.posted_at || 0).getTime() - new Date(a.fetched_at || a.posted_at || 0).getTime()
        );
        setJobs(sorted);
      })
      .catch(() => setError('Failed to load synced jobs.'))
      .finally(() => setLoading(false));
  }, [sourceFilter]);

  const sources = Array.from(new Set(jobs.map(j => j.source))).sort();

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', margin: 0 }}>Synced Jobs</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Jobs fetched from external sources · {jobs.length} total
          </p>
        </div>
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          style={{
            border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px',
            fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif',
          }}
        >
          <option value="">All sources</option>
          {sources.map(s => (
            <option key={s} value={s}>{SOURCE_LABELS[s] || s}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 14 }}>
          Loading synced jobs…
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
          padding: '14px 18px', color: '#dc2626', fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 14 }}>
          No synced jobs yet. Run a scraper sync to populate this tab.
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                {['Title', 'Company', 'Location', 'Source', 'Type', 'Synced At'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left', fontWeight: 700,
                    color: '#374151', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, i) => (
                <tr
                  key={job.id}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: i % 2 === 0 ? '#fff' : '#fafafa',
                  }}
                >
                  <td style={{ padding: '10px 14px', color: '#0f2419', fontWeight: 600, maxWidth: 260 }}>
                    {job.apply_url ? (
                      <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#1a7a4a', textDecoration: 'none' }}>
                        {job.title}
                      </a>
                    ) : job.title}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{job.company || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>{job.location || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                      background: '#f0faf4', color: '#1a7a4a', fontWeight: 700, fontSize: 11,
                    }}>
                      {SOURCE_LABELS[job.source] || job.source}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280', textTransform: 'capitalize' }}>
                    {job.job_type || '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {formatDateTime(job.fetched_at || job.posted_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
