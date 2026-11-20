import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, Globe, CheckCircle2, ArrowRight, Layers, FileCode, Clock, Play, Terminal, Database, ShieldAlert, Cpu, FlaskConical, Lock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { ScraperSourceStatus, ScraperLog, JobListing } from '../types/index.ts';
import { adminFetch } from '../lib/supabase/auth.ts';

const SEED_SOURCES: ScraperSourceStatus[] = [
  { id: 'caclubindia',       name: 'CA Club India',       url: 'caclubindia.com',          lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'RSS Feed — Articleship & CA Jobs' },
  { id: 'buddingca',         name: 'BuddingCA',           url: 'buddingca.com',             lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'WordPress REST API' },
  { id: 'jsearch',           name: 'JSearch API',         url: 'jsearch.p.rapidapi.com',    lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: '61 finance-focused search queries' },
  { id: 'icai_eirc',         name: 'ICAI EIRC',           url: 'icaieirc.org',              lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'ICAI East — Articleship vacancies' },
  { id: 'icai_sirc',         name: 'ICAI SIRC',           url: 'icai-sirc.org',             lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'ICAI South — Articleship vacancies' },
  { id: 'icai_wirc',         name: 'ICAI WIRC',           url: 'icaiwirc.org',              lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'ICAI West — Articleship vacancies' },
  { id: 'icai_kochi',        name: 'ICAI Kochi',          url: 'icaikochi.org',             lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'ICAI Kochi branch' },
  { id: 'icai_pune',         name: 'ICAI Pune',           url: 'icaipune.org',              lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'ICAI Pune branch' },
  { id: 'icai_bangalore',    name: 'ICAI Bangalore',      url: 'icaibangalore.com',         lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'ICAI Bangalore branch' },
  { id: 'icai_nirc',         name: 'ICAI NIRC',           url: 'nirc.icai.org',             lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'ICAI North — Delhi NCR Articleship vacancies' },
  { id: 'icmai',             name: 'ICMAI',               url: 'icmai.in',                  lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'CMA — Cost Accountant training' },
  { id: 'jobspy',            name: 'JobSpy (Indeed/Glassdoor/Naukri)', url: 'python-jobspy', lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'Free scraper — Indeed, Glassdoor, Naukri' },
  { id: 'apify_google_jobs', name: 'Google Jobs (Apify)', url: 'apify.com',                 lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: '39 queries via Google for Jobs — weekly' },
  { id: 'apify_multi_board', name: 'Multi-Board (Apify)', url: 'apify.com',                 lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'Naukri via vero-api actor — weekly' },
  { id: 'apify_career_sites',name: 'Career Sites (Apify)',url: 'apify.com',                 lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'Big 4 ATS (Workday/Greenhouse) — weekly' },
  { id: 'greenhouse',        name: 'Greenhouse API',      url: 'boards-api.greenhouse.io',  lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'Free — Groww, TCS, Stripe, 60+ company boards' },
  { id: 'lever',             name: 'Lever API',           url: 'api.lever.co',              lastRun: '—', jobsCount: 0, status: 'Idle', categoryFocus: 'Free — CRED, Meesho, fintech career boards' },
];

function formatSyncTime(isoStr: string): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

interface ScraperDashboardProps {
  sources?: ScraperSourceStatus[];
  onTriggerScrape: (sourceId?: string) => Promise<any>;
  totalScrapedJobs: number;
}

export const ScraperDashboard: React.FC<ScraperDashboardProps> = ({
  onTriggerScrape,
  totalScrapedJobs
}) => {
  const [sources, setSources] = useState<ScraperSourceStatus[]>(SEED_SOURCES);
  const [isRunning, setIsRunning] = useState(false);
  const [runningSources, setRunningSources] = useState<Set<string>>(new Set());
  const [autoScrapeInterval, setAutoScrapeInterval] = useState('15');
  const [autoScrapeEnabled, setAutoScrapeEnabled] = useState(true);
  const [logs, setLogs] = useState<ScraperLog[]>([]);
  const [customUrl, setCustomUrl] = useState('https://www.linkedin.com/jobs/search?keywords=ACCA+Fresher+Bangalore');
  const [lastScrapeResult, setLastScrapeResult] = useState<any>(null);

  // API Test state
  const [testSource, setTestSource] = useState('greenhouse');
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testExpanded, setTestExpanded] = useState(true);

  // Fetch scraper logs
  const fetchLogs = () => {
    adminFetch('/api/scrape/logs')
      .then((res) => res.json())
      .then((data) => {
        const mapped = (data.logs || []).map((r: any) => ({
          id: r.id,
          timestamp: r.started_at ? new Date(r.started_at).toLocaleString() : '—',
          source: r.source,
          scannedCount: r.fetched ?? 0,
          parsedValidCount: r.created ?? 0,
          qualificationsDetected: r.skipped != null ? { skipped: r.skipped, dupes: r.duplicates ?? 0 } : {},
          status: r.status ?? 'unknown',
          error: r.error_msg,
        }));
        setLogs(mapped);
      })
      .catch((err) => console.error(err));
  };

  // Fetch last-sync time per source from sync_runs and merge into source cards
  const fetchSourceStatus = () => {
    adminFetch('/api/scrape/source-status')
      .then((res) => res.json())
      .then((data) => {
        const bySource: Record<string, any> = {};
        (data.sources || []).forEach((r: any) => { bySource[r.source] = r; });
        setSources(prev => prev.map(s => {
          const run = bySource[s.id];
          if (!run) return s;
          return {
            ...s,
            lastRun: formatSyncTime(run.started_at),
            jobsCount: run.created ?? s.jobsCount,
            status: run.status === 'success' ? 'Active' : run.status === 'running' ? 'Syncing' : s.status,
          };
        }));
      })
      .catch(() => {}); // silent — not critical
  };

  useEffect(() => {
    fetchLogs();
    fetchSourceStatus();
  }, []);

  const handleDryRun = async () => {
    setTestRunning(true);
    setTestResult(null);
    try {
      const res = await adminFetch(`/api/scrape/dry-run?source=${testSource}`);
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ source: testSource, fetched: 0, sample_jobs: [], error: err.message || 'Network error' });
    } finally {
      setTestRunning(false);
    }
  };

  const handleRunScraper = async (sourceId?: string) => {
    setIsRunning(true);
    if (sourceId) setRunningSources(prev => new Set(prev).add(sourceId));
    setLastScrapeResult(null);
    // Optimistically mark the source as "Running"
    if (sourceId) {
      setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'Syncing' as const } : s));
    }
    try {
      const res = await onTriggerScrape(sourceId);
      setLastScrapeResult(res);
      fetchLogs();
      // Poll for updated status after a short delay (backend runs async)
      setTimeout(() => { fetchSourceStatus(); }, 4000);
      setTimeout(() => { fetchSourceStatus(); }, 12000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
      if (sourceId) setRunningSources(prev => { const s = new Set(prev); s.delete(sourceId); return s; });
    }
  };

  const card: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e2e8e5',
    borderRadius: 12,
    padding: 24,
  };

  return (
    <div style={{ background: '#f4f7f5', minHeight: '100%', padding: '32px 32px 48px', fontFamily: 'Manrope, sans-serif' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Hero Banner ── */}
        <div className="ap-fade-up ap-d0" style={{
          background: '#1a7a4a',
          borderRadius: 14,
          padding: '28px 32px',
          color: '#fff',
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Cpu size={13} color="#fff" />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  Automated Career Board Scraper Engine
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>·</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Finance & Commerce Role Focus</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Job Scraping & Certification Classification
              </h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
                Crawls LinkedIn, Naukri, Big 4 portals for finance openings. Auto-tags by ICAI, ACCA, IFRS, Articleship keywords.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, alignItems: 'flex-end' }}>
              {/* Auto-schedule control */}
              <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Auto-Schedule</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={autoScrapeInterval}
                    onChange={(e) => setAutoScrapeInterval(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'Manrope, sans-serif' }}
                  >
                    <option value="15">Every 15 min</option>
                    <option value="30">Every 30 min</option>
                    <option value="60">Every 1 hour</option>
                    <option value="360">Every 6 hours</option>
                  </select>
                  <button
                    onClick={() => setAutoScrapeEnabled(!autoScrapeEnabled)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: autoScrapeEnabled ? '1px solid #6ee7b7' : '1px solid rgba(255,255,255,0.15)',
                      background: autoScrapeEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                      color: autoScrapeEnabled ? '#6ee7b7' : 'rgba(255,255,255,0.5)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'Manrope, sans-serif',
                    }}
                  >
                    {autoScrapeEnabled ? 'Active' : 'Paused'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleRunScraper()}
                disabled={isRunning}
                style={{
                  padding: '11px 20px',
                  background: '#fff',
                  color: '#1a7a4a',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  opacity: isRunning ? 0.65 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'Manrope, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                <RefreshCw size={15} style={{ animation: isRunning ? 'spin 1s linear infinite' : 'none' }} />
                {isRunning ? 'Crawling Boards...' : 'Run Scraper Now'}
              </button>
            </div>
          </div>

          {/* Result banner */}
          {lastScrapeResult && (
            <div style={{
              marginTop: 18,
              padding: '10px 16px',
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(110,231,183,0.3)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={14} color="#6ee7b7" />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                  {lastScrapeResult.message}: Fetched{' '}
                  <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{lastScrapeResult.newJobsScraped}</strong>
                  {' '}new finance positions.
                </span>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6ee7b7' }}>HTTP 200 OK</span>
            </div>
          )}
        </div>

        {/* ── Sources Grid ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f2419', margin: 0 }}>Connected Career Boards & Ingestion Streams</h3>
            <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
              Total scraped: <strong style={{ color: '#0f2419' }}>{totalScrapedJobs}</strong>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="scraper-sources-grid">
            {sources.map((src, i) => {
              const isSrcRunning = runningSources.has(src.id) || src.status === 'Syncing';
              return (
              <div key={src.id} className={`ap-card ap-scale-in ap-d${Math.min(i % 8, 7)}`} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2419', marginBottom: 2 }}>{src.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.url}</div>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 20,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    ...(isSrcRunning
                      ? { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
                      : src.status === 'Active'
                        ? { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }
                        : { background: '#f1f5f9', color: '#64748b' }
                    ),
                  }}>
                    {isSrcRunning ? 'Syncing…' : src.status}
                  </span>
                </div>

                {/* Category focus */}
                <div style={{ background: '#f4f7f5', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ingestion Filter</div>
                  <div style={{ fontSize: 11, color: '#1e3a2b', fontWeight: 500, lineHeight: 1.5 }}>{src.categoryFocus}</div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    Last sync:{' '}
                    <span style={{ color: src.lastRun === '—' ? '#94a3b8' : '#1a7a4a', fontWeight: src.lastRun === '—' ? 400 : 600 }}>
                      {src.lastRun}
                    </span>
                  </span>
                  <button
                    onClick={() => handleRunScraper(src.id)}
                    disabled={isRunning || isSrcRunning}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: isRunning || isSrcRunning ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      color: isSrcRunning ? '#94a3b8' : '#1a7a4a',
                      padding: 0,
                      opacity: isRunning || isSrcRunning ? 0.5 : 1,
                      fontFamily: 'Manrope, sans-serif',
                    }}
                  >
                    {isSrcRunning
                      ? <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Syncing</>
                      : <>Sync <ArrowRight size={12} /></>
                    }
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* ── Pipeline Steps ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Terminal size={16} color="#1a7a4a" />
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f2419', margin: 0 }}>
              ArivuPro Automated Certification Detection & Tagging Pipeline
            </h3>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.6 }}>
            How the scraper evaluates external unstructured job descriptions and extracts ArivuPro qualifications:
          </p>

          {/* Pipeline steps with connecting arrows */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', alignItems: 'center', gap: 8 }}>
            {/* Step 1 */}
            <div style={{ background: '#f4f7f5', border: '1px solid #e2e8e5', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#1a7a4a', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ background: '#1a7a4a', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>1</span>
                External Requisition Ingest
              </div>
              <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.55 }}>
                Scrapes role titles, employer name, locations, salary range, and candidate requirements from LinkedIn, Naukri, Big 4 portals.
              </p>
            </div>

            {/* Arrow */}
            <ArrowRight size={18} color="#1a7a4a" style={{ flexShrink: 0 }} />

            {/* Step 2 */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#92400e', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ background: '#f59e0b', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>2</span>
                Pattern & Course Matching
              </div>
              <p style={{ fontSize: 12, color: '#78350f', margin: 0, lineHeight: 1.55 }}>
                Regex & semantic rules detect keywords:{' '}
                <code style={{ background: '#fff', padding: '1px 4px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>ACCA</code>,{' '}
                <code style={{ background: '#fff', padding: '1px 4px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>US CPA</code>,{' '}
                <code style={{ background: '#fff', padding: '1px 4px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>Articleship</code>,{' '}
                <code style={{ background: '#fff', padding: '1px 4px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>IFRS 15</code>.
              </p>
            </div>

            {/* Arrow */}
            <ArrowRight size={18} color="#1a7a4a" style={{ flexShrink: 0 }} />

            {/* Step 3 */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#14532d', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ background: '#1a7a4a', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>3</span>
                Taxonomy Tagging & Score
              </div>
              <p style={{ fontSize: 12, color: '#166534', margin: 0, lineHeight: 1.55 }}>
                Maps opening directly to ArivuPro student batches, calculates fit score against candidate profiles, and injects into student portal.
              </p>
            </div>
          </div>

          {/* Custom URL tester */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f2419', marginBottom: 8 }}>
              Test Custom Career Board URL Crawler
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                style={{
                  flex: 1,
                  fontSize: 12,
                  padding: '9px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8e5',
                  borderRadius: 8,
                  fontFamily: 'monospace',
                  color: '#1e293b',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => handleRunScraper()}
                disabled={isRunning}
                style={{
                  padding: '9px 18px',
                  background: '#1a7a4a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  opacity: isRunning ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                <Play size={13} />
                Simulate Crawler
              </button>
            </div>
          </div>
        </div>

        {/* ── API Test Panel ── */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <button
            onClick={() => setTestExpanded(!testExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8faf9'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlaskConical size={16} color="#4f46e5" />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0f2419' }}>Scraper API Test (Dry Run)</span>
              <span style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 20, background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', fontWeight: 700 }}>No DB writes</span>
            </div>
            {testExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
          </button>

          {testExpanded && (
            <div style={{ padding: '0 24px 24px', borderTop: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: 13, color: '#64748b', margin: '16px 0 14px', lineHeight: 1.6 }}>
                Fetch jobs from a source without saving to the database. Use this to verify a scraper is working before triggering a real sync run.
              </p>

              {/* Source selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  { id: 'greenhouse', label: 'Greenhouse', badge: 'Free' },
                  { id: 'lever', label: 'Lever', badge: 'Free' },
                  { id: 'workday', label: 'Workday (Big 4)', badge: 'Free' },
                  { id: 'caclubindia', label: 'CAClubIndia', badge: 'Free' },
                  { id: 'buddingca', label: 'BuddingCA', badge: 'Free' },
                  { id: 'icai_eirc', label: 'ICAI EIRC', badge: 'Free' },
                  { id: 'icai_nirc', label: 'ICAI NIRC', badge: 'Free' },
                  { id: 'icai_sirc', label: 'ICAI SIRC', badge: 'Free' },
                  { id: 'icai_wirc', label: 'ICAI WIRC', badge: 'Free' },
                  { id: 'icai_pune', label: 'ICAI Pune', badge: 'Free' },
                  { id: 'icai_kochi', label: 'ICAI Kochi', badge: 'Free' },
                  { id: 'icai_bangalore', label: 'ICAI Bangalore', badge: 'Free' },
                  { id: 'icmai', label: 'ICMAI', badge: 'Free' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTestSource(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      border: testSource === s.id ? '1px solid #818cf8' : '1px solid #e2e8e5',
                      borderRadius: 8,
                      background: testSource === s.id ? '#eef2ff' : '#f8fafc',
                      color: testSource === s.id ? '#3730a3' : '#475569',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'Manrope, sans-serif',
                      transition: 'border-color 0.1s',
                    }}
                  >
                    <span>{s.label}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: '#dcfce7', color: '#166534', fontWeight: 700 }}>{s.badge}</span>
                  </button>
                ))}
                {/* Paid sources — disabled */}
                {[
                  { id: 'jsearch', label: 'JSearch (RapidAPI)' },
                  { id: 'jobspy', label: 'JobSpy' },
                  { id: 'apify_multi_board', label: 'Apify Multi Board' },
                  { id: 'apify_google_jobs', label: 'Apify Google Jobs' },
                  { id: 'apify_career_sites', label: 'Apify Career Sites' },
                ].map((s) => (
                  <div
                    key={s.id}
                    title="Paid API — dry-run disabled"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      border: '1px solid #f1f5f9',
                      borderRadius: 8,
                      background: '#fafafa',
                      cursor: 'not-allowed',
                      opacity: 0.55,
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{s.label}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, padding: '1px 6px', borderRadius: 20, background: '#f1f5f9', color: '#94a3b8', fontWeight: 700 }}>
                      <Lock size={9} /> Paid
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  Selected: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f2419' }}>{testSource}</span>
                </span>
                <button
                  onClick={handleDryRun}
                  disabled={testRunning}
                  style={{
                    padding: '9px 20px',
                    background: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: testRunning ? 'not-allowed' : 'pointer',
                    opacity: testRunning ? 0.65 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  <FlaskConical size={14} style={{ animation: testRunning ? 'pulse 1s ease-in-out infinite' : 'none' }} />
                  {testRunning ? 'Fetching...' : 'Run Dry Test'}
                </button>
              </div>

              {/* Result */}
              {testResult && (
                <div style={{
                  marginTop: 16,
                  borderRadius: 10,
                  border: `1px solid ${testResult.error ? '#fca5a5' : '#bbf7d0'}`,
                  background: testResult.error ? '#fef2f2' : '#f0fdf4',
                  padding: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: testResult.sample_jobs?.length > 0 ? 12 : 0 }}>
                    {testResult.error
                      ? <AlertTriangle size={15} color="#ef4444" />
                      : <CheckCircle2 size={15} color="#16a34a" />
                    }
                    <span style={{ fontSize: 13, fontWeight: 700, color: testResult.error ? '#991b1b' : '#14532d' }}>
                      {testResult.error
                        ? `Error: ${testResult.error}`
                        : `${testResult.fetched} jobs fetched — no DB write`
                      }
                    </span>
                  </div>

                  {!testResult.error && testResult.sample_jobs?.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #bbf7d0' }}>
                            {['Title', 'Company', 'Location', 'Type'].map(h => (
                              <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: '#14532d', fontSize: 11 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {testResult.sample_jobs.map((job: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(187,247,208,0.4)' }}>
                              <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1e293b', maxWidth: 200 }}>
                                <a href={job.apply_url} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>
                                  {job.title}
                                </a>
                              </td>
                              <td style={{ padding: '7px 10px', color: '#475569' }}>{job.company}</td>
                              <td style={{ padding: '7px 10px', color: '#94a3b8' }}>{job.location || '—'}</td>
                              <td style={{ padding: '7px 10px' }}>
                                <span style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 6px', borderRadius: 4, background: '#fff', border: '1px solid #bbf7d0', color: '#166534' }}>
                                  {job.job_type}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {testResult.fetched > 20 && (
                        <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 10 }}>
                          Showing first 20 of {testResult.fetched} jobs
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Logs Table ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCode size={16} color="#1a7a4a" />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f2419', margin: 0 }}>Crawler Ingestion Logs</h3>
            </div>
            <button
              onClick={fetchLogs}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
              onMouseEnter={e => e.currentTarget.style.color = '#0f2419'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>

          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8faf9', borderRadius: 10, border: '1px dashed #d1e8dc' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2419', marginBottom: 4 }}>No scraper runs yet</div>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Trigger a scrape above to see run history here.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8faf9', borderBottom: '1px solid #e2e8e5' }}>
                    {['Timestamp', 'Career Board', 'Scanned', 'Valid Finance Roles', 'Tags Applied', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, letterSpacing: '0.03em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8faf9')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#94a3b8', whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f2419', whiteSpace: 'nowrap' }}>{log.source}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#475569' }}>{log.scannedCount}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 800, color: '#1a7a4a' }}>{log.parsedValidCount}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {Object.entries(log.qualificationsDetected).map(([k, count]) => (
                            <span key={k} style={{ fontSize: 10, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', color: '#475569' }}>
                              {k}: {String(count)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .scraper-sources-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 600px) { .scraper-sources-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
};
