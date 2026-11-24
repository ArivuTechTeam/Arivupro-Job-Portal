import React, { useState, useEffect, useCallback } from 'react';
import { JobListing, JobApplication } from '../types/index.ts';
import { adminFetch } from '../lib/supabase/auth.ts';

interface AdminDashboardProps {
  jobs: JobListing[];
  applications: JobApplication[];
  activeTab?: AdminTab;
  onNavigate?: (tab: 'admin-recruiters' | 'admin-dashboard' | 'admin-students' | 'admin-jobs' | 'admin-companies') => void;
  onPendingCountChange?: (n: number) => void;
}

type AdminTab = 'Dashboard' | 'All Students' | 'All Jobs' | 'Companies' | 'Recruiters';

// Pipeline stage display config — labels only, counts come from live API
const PIPELINE_STAGE_KEYS = [
  { key: 'applied',          label: 'Applied' },
  { key: 'arivupro_review',  label: 'ArivuPro Review' },
  { key: 'recruiter_screen', label: 'Recruiter Screen' },
  { key: 'technical_round',  label: 'Interview Stages' },
  { key: 'offer_released',   label: 'Offers Released' },
  { key: 'placed',           label: 'Placed' },
];


// ── Badge Helpers ──────────────────────────────────────────────────────────

type StageType =
  | 'Applied'
  | 'ArivuPro Review'
  | 'Recruiter Screen'
  | 'Technical Round'
  | 'Offer Released'
  | 'Placed';

function stageBadgeClass(stage: StageType | string): string {
  switch (stage) {
    case 'Applied':
      return 'badge badge-gray';
    case 'ArivuPro Review':
      return 'badge badge-blue';
    case 'Recruiter Screen':
      return 'badge badge-amber';
    case 'Technical Round':
      return 'badge badge-purple';
    case 'Offer Released':
    case 'Placed':
      return 'badge badge-green';
    default:
      return 'badge badge-gray';
  }
}

function aiGradeBadgeClass(grade: string): string {
  switch (grade) {
    case 'Excellent':
      return 'badge badge-green';
    case 'Strong':
      return 'badge badge-blue';
    case 'Good':
      return 'badge badge-amber';
    default:
      return 'badge badge-gray';
  }
}

function sourceBadgeClass(source: string): string {
  switch (source) {
    case 'arivupro_exclusive':
      return 'badge badge-green';
    case 'direct_recruiter':
    case 'linkedin':
      return 'badge badge-blue';
    case 'big4_portal':
      return 'badge badge-purple';
    case 'naukri':
    case 'indeed':
    case 'quintedge':
    case 'efinancialcareers':
      return 'badge badge-gray';
    default:
      return 'badge badge-gray';
  }
}

function sourceLabel(source: string): string {
  switch (source) {
    case 'arivupro_exclusive':
      return 'Exclusive';
    case 'direct_recruiter':
      return 'Direct';
    case 'linkedin':
      return 'LinkedIn';
    case 'big4_portal':
      return 'Big 4';
    case 'naukri':
      return 'Naukri';
    case 'indeed':
      return 'Indeed';
    case 'quintedge':
      return 'Quintedge';
    case 'efinancialcareers':
      return 'eFinancial';
    default:
      return source;
  }
}

function companyStatusBadgeClass(status: string): string {
  switch (status) {
    case 'MoU Partner':
      return 'badge badge-yellow';
    case 'Verified':
      return 'badge badge-green';
    case 'Pending Review':
      return 'badge badge-amber';
    default:
      return 'badge badge-gray';
  }
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    fontFamily: "'Manrope', system-ui, sans-serif",
    background: '#f7fbf9',
    minHeight: '100vh',
  },
  tabStrip: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    gap: 0,
    paddingLeft: 24,
    overflowX: 'auto',
  },
  pageContent: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '32px 24px',
  },
  pageHeader: {
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 800,
    color: '#0f2419',
    margin: 0,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: 500,
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 20,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: 6,
  },
  statNum: {
    fontSize: 32,
    fontWeight: 800,
    color: '#1a7a4a',
    lineHeight: 1,
    marginBottom: 6,
  },
  statSub: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: 500,
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#0f2419',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  alertRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 14px',
    borderLeft: '3px solid #1a7a4a',
    background: '#f0faf4',
    borderRadius: 8,
    marginBottom: 10,
  },
  alertText: {
    fontSize: 13,
    color: '#0f2419',
    fontWeight: 500,
    flex: 1,
  },
  alertTime: {
    fontSize: 11,
    color: '#9ca3af',
    whiteSpace: 'nowrap' as const,
    marginTop: 1,
  },
  pipelineRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  pipelineLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    width: 160,
    flexShrink: 0,
  },
  pipelineCount: {
    fontSize: 13,
    fontWeight: 800,
    color: '#1a7a4a',
    width: 36,
    textAlign: 'right' as const,
    flexShrink: 0,
  },
  pipelineBarTrack: {
    flex: 1,
    height: 8,
    background: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
  },
  th: {
    background: '#f0faf4',
    color: '#1a7a4a',
    padding: '10px 14px',
    textAlign: 'left' as const,
    fontWeight: 800,
    fontSize: 11,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    borderBottom: '2px solid #d7f4ea',
  },
  thFirst: {
    borderTopLeftRadius: 8,
  },
  thLast: {
    borderTopRightRadius: 8,
  },
  td: {
    padding: '10px 14px',
    borderBottom: '1px solid #f3f4f6',
    color: '#374151',
    verticalAlign: 'middle' as const,
  },
  tdAlt: {
    padding: '10px 14px',
    borderBottom: '1px solid #f3f4f6',
    color: '#374151',
    verticalAlign: 'middle' as const,
    background: '#f7fbf9',
  },
  filterBar: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: 180,
    padding: '9px 14px',
    borderRadius: 9,
    border: '1px solid #e5e7eb',
    fontSize: 13,
    fontFamily: "'Manrope', sans-serif",
    color: '#0f2419',
    outline: 'none',
    background: '#fff',
  },
  selectInput: {
    padding: '9px 14px',
    borderRadius: 9,
    border: '1px solid #e5e7eb',
    fontSize: 13,
    fontFamily: "'Manrope', sans-serif",
    color: '#374151',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  btnSmallOutline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 12px',
    borderRadius: 6,
    background: 'transparent',
    color: '#1a7a4a',
    fontSize: 11,
    fontWeight: 700,
    border: '1.5px solid #1a7a4a',
    cursor: 'pointer',
    fontFamily: "'Manrope', sans-serif",
    transition: 'all 0.15s ease',
  },
  btnSmallSolid: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 12px',
    borderRadius: 6,
    background: '#1a7a4a',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Manrope', sans-serif",
    transition: 'all 0.15s ease',
  },
  btnSmallRed: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 12px',
    borderRadius: 6,
    background: 'transparent',
    color: '#dc2626',
    fontSize: 11,
    fontWeight: 700,
    border: '1.5px solid #dc2626',
    cursor: 'pointer',
    fontFamily: "'Manrope', sans-serif",
    transition: 'all 0.15s ease',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  pillSmall: {
    fontSize: 10,
    fontWeight: 700,
    background: '#f3f4f6',
    color: '#6b7280',
    padding: '2px 8px',
    borderRadius: 4,
    letterSpacing: '0.03em',
  },
  toast: {
    position: 'fixed' as const,
    bottom: 32,
    right: 32,
    background: '#fff',
    color: '#0f2419',
    padding: '14px 20px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    boxShadow: '0 8px 32px rgba(26,122,74,0.15)',
    zIndex: 9999,
    fontFamily: "'Manrope', sans-serif",
    maxWidth: 340,
    lineHeight: 1.4,
    borderLeft: '4px solid #1a7a4a',
    border: '1px solid #d7f4ea',
  },
  emptyRow: {
    textAlign: 'center' as const,
    color: '#9ca3af',
    fontSize: 13,
    padding: '24px 0',
  },
};

// ── Companies Tab ──────────────────────────────────────────────────────────

function CompaniesTab({ displayCompanies }: { displayCompanies: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Registered Companies</h1>
        <p style={styles.pageSubtitle}>Recruiter partners and MoU holders</p>
      </div>
      <div style={{ ...styles.card, padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...styles.thFirst }}>Company</th>
                <th style={styles.th}>Contact Person</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Website</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Active Jobs</th>
                <th style={{ ...styles.th, ...styles.thLast }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayCompanies.map((co: any, i: number) => {
                const id = co.id || String(i);
                const name = co.company_name || co.name || '—';
                const email = co.work_email || co.email || '—';
                const phone = co.phone || '—';
                const website = co.website || co.company_website || '';
                const contact = co.contact_person || co.contact || '—';
                const activeJobs = co.active_jobs_count ?? co.activeJobs ?? 0;
                const rawStatus = co.verification_status || co.status || '';
                const statusLabel =
                  rawStatus === 'verified' ? 'Verified'
                  : rawStatus === 'pending' ? 'Pending Review'
                  : rawStatus === 'mou_partner' ? 'MoU Partner'
                  : rawStatus || '—';
                const notes = co.notes || '';
                const cin = co.cin_or_gstin || '';
                const isExpanded = expandedId === id;
                const tdSt = i % 2 === 0 ? styles.td : styles.tdAlt;
                return (
                  <React.Fragment key={id}>
                    <tr>
                      <td style={tdSt}>
                        <div style={{ fontWeight: 700, color: '#0f2419', fontSize: 13 }}>{name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{email}</div>
                      </td>
                      <td style={tdSt}><span style={{ fontSize: 13 }}>{contact}</span></td>
                      <td style={tdSt}><span style={{ fontSize: 13 }}>{phone}</span></td>
                      <td style={tdSt}>
                        {website
                          ? <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#1a7a4a', textDecoration: 'none' }}>{website}</a>
                          : <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={tdSt}><span className={companyStatusBadgeClass(statusLabel)}>{statusLabel}</span></td>
                      <td style={tdSt}>
                        <span style={{ fontWeight: 700, color: activeJobs > 0 ? '#1a7a4a' : '#9ca3af' }}>{activeJobs}</span>
                      </td>
                      <td style={tdSt}>
                        <button
                          style={isExpanded ? styles.btnSmallSolid : styles.btnSmallOutline}
                          onClick={() => setExpandedId(isExpanded ? null : id)}
                        >
                          {isExpanded ? 'Close' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ padding: '16px 20px', background: '#f0faf4', borderBottom: '1px solid #d1fae5' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px 24px', fontSize: 13 }}>
                            <DetailItem label="Company Email" value={email} />
                            <DetailItem label="Phone" value={phone} />
                            <DetailItem label="Website" value={website || '—'} />
                            <DetailItem label="CIN / GSTIN" value={cin || '—'} />
                            <DetailItem label="Status" value={statusLabel} />
                            <DetailItem label="Active Jobs" value={String(activeJobs)} />
                            {notes && <DetailItem label="Notes" value={notes} />}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ color: '#0f2419', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ jobs, applications, activeTab: propTab, onNavigate, onPendingCountChange }) => {
  const activeTab: AdminTab = propTab ?? 'Dashboard';
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStageFilter, setStudentStageFilter] = useState('All Stages');
  const [liveCompanies, setLiveCompanies] = useState<any[]>([]);
  const [liveStudents, setLiveStudents] = useState<any[]>([]);
  const [liveRecruiters, setLiveRecruiters] = useState<any[]>([]);
  const [recruitersLoading, setRecruitersLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [pendingRecruiterCount, setPendingRecruiterCount] = useState(0);
  const [liveStats, setLiveStats] = useState<{
    active_jobs?: number;
    total_applications?: number;
    placed?: number;
    active_interviews?: number;
    applications_by_stage?: Record<string, number>;
    offer_released?: number;
  } | null>(null);
  const [liveJobs, setLiveJobs] = useState<any[]>([]);
  const [liveJobsTotal, setLiveJobsTotal] = useState(0);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [cleanupBusy, setCleanupBusy] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  const handlePurgeDeadLinks = useCallback(async () => {
    if (cleanupBusy) return;
    setCleanupBusy(true);
    try {
      const res = await adminFetch('/api/admin/purge-dead-links?limit=500', { method: 'POST' });
      const data = await res.json();
      showToast(`Checked ${data.checked} links — deactivated ${data.deactivated} dead jobs`);
    } catch {
      showToast('Purge failed — check console');
    } finally {
      setCleanupBusy(false);
    }
  }, [cleanupBusy, showToast]);

  const handleExpireOld = useCallback(async () => {
    if (cleanupBusy) return;
    setCleanupBusy(true);
    try {
      const res = await adminFetch('/api/admin/expire-old-jobs?days=45', { method: 'POST' });
      const data = await res.json();
      showToast(`Expired ${data.expired} jobs older than 45 days`);
    } catch {
      showToast('Expire failed — check console');
    } finally {
      setCleanupBusy(false);
    }
  }, [cleanupBusy, showToast]);

  const handleDeleteInactive = useCallback(async () => {
    if (cleanupBusy) return;
    if (!window.confirm('Permanently delete all inactive jobs with no applications? This cannot be undone.')) return;
    setCleanupBusy(true);
    try {
      const res = await adminFetch('/api/admin/delete-inactive-jobs', { method: 'DELETE' });
      const data = await res.json();
      showToast(`Deleted ${data.deleted} inactive jobs (preserved ${data.preserved_applied} with applications)`);
    } catch {
      showToast('Delete failed — check console');
    } finally {
      setCleanupBusy(false);
    }
  }, [cleanupBusy, showToast]);

  // Fetch live stats for Dashboard tab
  useEffect(() => {
    if (activeTab === 'Dashboard') {
      adminFetch('/api/admin/stats')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setLiveStats(d); })
        .catch(() => {});
    }
  }, [activeTab]);

  // Fetch live companies when Companies tab is active
  useEffect(() => {
    if (activeTab === 'Companies') {
      adminFetch('/api/companies')
        .then(r => r.json())
        .then(d => setLiveCompanies(d.companies || []))
        .catch(() => setLiveCompanies([]));
    }
  }, [activeTab]);

  // Fetch live jobs when All Jobs tab is active
  useEffect(() => {
    if (activeTab === 'All Jobs') {
      setJobsLoading(true);
      const params = new URLSearchParams({ limit: '100' });
      if (jobStatusFilter) params.set('status', jobStatusFilter);
      if (jobSearch) params.set('search', jobSearch);
      adminFetch(`/api/admin/jobs?${params}`)
        .then(r => r.ok ? r.json() : { jobs: [], total: 0 })
        .then(d => { setLiveJobs(d.jobs || []); setLiveJobsTotal(d.total || 0); })
        .catch(() => setLiveJobs([]))
        .finally(() => setJobsLoading(false));
    }
  }, [activeTab, jobStatusFilter, jobSearch]);

  // Fetch pending recruiters on mount — powers both the badge and the dashboard panel
  useEffect(() => {
    adminFetch('/api/recruiters/pending')
      .then(r => r.json())
      .then(d => {
        const all = d.recruiters || [];
        setLiveRecruiters(all);
        setPendingRecruiterCount(all.filter((r: any) => r.approval_status === 'pending').length);
      })
      .catch(() => {});
  }, []);

  // Fetch recruiters when Recruiters tab is active
  useEffect(() => {
    if (activeTab === 'Recruiters') {
      setRecruitersLoading(true);
      adminFetch('/api/recruiters/pending')
        .then(r => r.json())
        .then(d => {
          const all = d.recruiters || [];
          setLiveRecruiters(all);
          setPendingRecruiterCount(all.filter((r: any) => r.approval_status === 'pending').length);
        })
        .catch(() => setLiveRecruiters([]))
        .finally(() => setRecruitersLoading(false));
    }
  }, [activeTab]);

  // Notify parent when pending count changes (drives sidebar badge)
  useEffect(() => {
    onPendingCountChange?.(pendingRecruiterCount);
  }, [pendingRecruiterCount, onPendingCountChange]);

  const handleRecruiterAction = useCallback(async (recruiterId: string, action: 'approve' | 'reject') => {
    setApprovingId(recruiterId);
    try {
      const res = await adminFetch(`/api/recruiters/${recruiterId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setLiveRecruiters(prev => prev.map(r =>
          r.id === recruiterId ? { ...r, approval_status: action === 'approve' ? 'approved' : 'rejected' } : r
        ));
        setPendingRecruiterCount(c => Math.max(0, c - 1));
        showToast(action === 'approve' ? 'Recruiter approved — email sent' : 'Recruiter rejected');
      } else {
        showToast('Action failed — check console');
      }
    } catch {
      showToast('Network error');
    } finally {
      setApprovingId(null);
    }
  }, [showToast]);

  // Fetch live students (applications) when All Students tab is active
  useEffect(() => {
    if (activeTab === 'All Students') {
      adminFetch('/api/applications')
        .then(r => r.json())
        .then(d => setLiveStudents(d.applications || []))
        .catch(() => setLiveStudents([]));
    }
  }, [activeTab]);

  const displayCompanies = liveCompanies;
  const displayStudents = liveStudents.map((a: any) => ({
    id: a.student_id || a.id,
    name: a.student_name || '—',
    course: a.primary_course || '—',
    stage: a.stage || 'Applied',
    aiScore: a.ai_match_score || 0,
    aiGrade: a.match_grade || 'Good',
    counselor: a.assigned_counselor || '—',
    crmSync: a.crm_sync_status === 'synced' ? 'Synced' : 'Pending',
  }));

  // Filter students
  const filteredStudents = displayStudents.filter((s: any) => {
    const matchSearch =
      studentSearch.trim() === '' ||
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.course.toLowerCase().includes(studentSearch.toLowerCase());
    const matchStage =
      studentStageFilter === 'All Stages' || s.stage === studentStageFilter;
    return matchSearch && matchStage;
  });

  const handleAdminJobUpdate = useCallback(async (jobId: string, update: Record<string, unknown>) => {
    setUpdatingJobId(jobId);
    try {
      const res = await adminFetch(`/api/admin/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (res.ok) {
        const updated = await res.json();
        setLiveJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...updated.job } : j));
        showToast('Job updated');
      } else {
        showToast('Update failed');
      }
    } catch { showToast('Network error'); }
    finally { setUpdatingJobId(null); }
  }, [showToast]);

  const stageCounts = liveStats?.applications_by_stage ?? {};
  const maxPipelineCount = Math.max(1, ...PIPELINE_STAGE_KEYS.map(s => stageCounts[s.key] ?? 0));

  return (
    <div style={{ ...styles.wrapper, position: 'relative' }}>
      {/* ── Tab Content ── */}
      <div style={styles.pageContent}>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'Dashboard' && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' as const }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f2419', margin: 0, letterSpacing: '-0.01em' }}>Dashboard</h1>
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>ArivuPro placement operations</p>
              </div>
            </div>

            {/* Pending Recruiters Notice */}
            {pendingRecruiterCount > 0 && (
              <div style={{ background: '#fff7e6', border: '1px solid #f3d9a4', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#7c4a00' }}>
                  {pendingRecruiterCount} recruiter{pendingRecruiterCount > 1 ? 's' : ''} awaiting approval
                  <span style={{ fontSize: 12, color: '#a0601a', fontWeight: 500, marginLeft: 8 }}>New registrations pending your review</span>
                </div>
                <button
                  onClick={() => onNavigate?.('admin-recruiters')}
                  style={{ background: '#f57f17', color: '#fff', padding: '7px 18px', borderRadius: 7, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap' as const }}
                >
                  Review Now
                </button>
              </div>
            )}

            {/* Stat Strip */}
            <div style={{ background: '#fff', border: '1px solid #dfe3e0', borderRadius: 8, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
              {[
                { label: 'Active jobs', value: liveStats?.active_jobs ?? '—', sub: 'Live on portal' },
                { label: 'Applications', value: liveStats?.total_applications ?? '—', sub: 'Total submitted' },
                { label: 'In interviews', value: liveStats?.active_interviews ?? '—', sub: 'Interview stages' },
                { label: 'Placed', value: liveStats?.placed ?? '—', sub: 'Confirmed' },
              ].map((cell, i) => (
                <div key={cell.label} style={{ padding: '18px 20px', borderLeft: i > 0 ? '1px solid #dfe3e0' : undefined }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }}>{cell.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#1a7a4a', lineHeight: 1, marginBottom: 4 }}>{cell.value}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{cell.sub}</div>
                </div>
              ))}
            </div>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Placement Pipeline */}
              <div style={styles.card}>
                <div style={styles.cardTitle}>Placement pipeline</div>
                {PIPELINE_STAGE_KEYS.map((s) => {
                  const count = stageCounts[s.key] ?? 0;
                  return (
                    <div key={s.key} style={styles.pipelineRow}>
                      <div style={styles.pipelineLabel}>{s.label}</div>
                      <div style={styles.pipelineCount}>{count}</div>
                      <div style={styles.pipelineBarTrack}>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 4,
                            background: '#1a7a4a',
                            width: `${Math.round((count / maxPipelineCount) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recruiters Awaiting Approval */}
              <div style={styles.card}>
                <div style={styles.cardTitle}>
                  Recruiters awaiting approval
                  {pendingRecruiterCount > 0 && (
                    <span style={{ marginLeft: 8, background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '2px 8px' }}>
                      {pendingRecruiterCount}
                    </span>
                  )}
                </div>
                {liveRecruiters.filter((r: any) => r.approval_status === 'pending').length === 0 ? (
                  <div style={{ color: '#9ca3af', fontSize: 13, padding: '12px 0', textAlign: 'center' as const }}>No pending approvals</div>
                ) : (
                  liveRecruiters.filter((r: any) => r.approval_status === 'pending').slice(0, 5).map((r: any) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2419' }}>{r.company_name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{r.full_name} · {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          style={styles.btnSmallSolid}
                          disabled={approvingId === r.id}
                          onClick={() => handleRecruiterAction(r.id, 'approve')}
                        >
                          {approvingId === r.id ? '…' : 'Approve'}
                        </button>
                        <button
                          style={styles.btnSmallRed}
                          disabled={approvingId === r.id}
                          onClick={() => handleRecruiterAction(r.id, 'reject')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {liveRecruiters.filter((r: any) => r.approval_status === 'pending').length > 5 && (
                  <button
                    style={{ ...styles.btnSmallOutline, marginTop: 10, width: '100%', justifyContent: 'center' }}
                    onClick={() => onNavigate?.('admin-recruiters')}
                  >
                    View all →
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: ALL STUDENTS */}
        {activeTab === 'All Students' && (
          <>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>All Student Applications</h1>
              <p style={styles.pageSubtitle}>
                Monitor and manage every candidate in the pipeline
              </p>
            </div>

            {/* Filter Bar */}
            <div style={styles.filterBar}>
              <input
                style={styles.searchInput}
                placeholder="Search by name, ID, course…"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              <select
                style={styles.selectInput}
                value={studentStageFilter}
                onChange={(e) => setStudentStageFilter(e.target.value)}
              >
                <option>All Stages</option>
                <option>Applied</option>
                <option>ArivuPro Review</option>
                <option>Technical Round</option>
                <option>Placed</option>
              </select>
              <button
                className="btn-outline"
                style={{ padding: '8px 18px', fontSize: 13 }}
                onClick={() => showToast('CSV export coming soon')}
              >
                Export CSV
              </button>
              <button
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: 13 }}
                onClick={() => showToast('CRM sync started for all students')}
              >
                Sync All to CRM
              </button>
            </div>

            <div style={{ ...styles.card, padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, ...styles.thFirst }}>Student</th>
                      <th style={styles.th}>Course</th>
                      <th style={styles.th}>Stage</th>
                      <th style={styles.th}>AI Score</th>
                      <th style={styles.th}>Counselor</th>
                      <th style={styles.th}>CRM Sync</th>
                      <th style={{ ...styles.th, ...styles.thLast }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={styles.emptyRow}>
                          No students match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s, i) => (
                        <tr key={s.id}>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <div style={{ fontWeight: 700, color: '#0f2419', fontSize: 13 }}>
                              {s.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                              {s.id}
                            </div>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span style={{ fontWeight: 600, color: '#374151' }}>{s.course}</span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span className={stageBadgeClass(s.stage)}>{s.stage}</span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span className={aiGradeBadgeClass(s.aiGrade)}>
                              {s.aiScore}% {s.aiGrade}
                            </span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span style={{ fontSize: 13, color: s.counselor === '—' ? '#9ca3af' : '#374151' }}>
                              {s.counselor}
                            </span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span
                              className={
                                s.crmSync === 'Synced' ? 'badge badge-green' : 'badge badge-amber'
                              }
                            >
                              {s.crmSync}
                            </span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                style={styles.btnSmallOutline}
                                onClick={() => showToast(`Viewing profile: ${s.name}`)}
                              >
                                View
                              </button>
                              <button
                                style={styles.btnSmallSolid}
                                onClick={() => showToast(`${s.name} advanced to next stage`)}
                              >
                                Advance
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB 3: ALL JOBS */}
        {activeTab === 'All Jobs' && (
          <>
            <div style={styles.headerRow}>
              <div>
                <h1 style={styles.pageTitle}>All Jobs</h1>
                <p style={styles.pageSubtitle}>Manage every listing in the portal</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  style={{ padding: '8px 14px', fontSize: 12, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: cleanupBusy ? 'not-allowed' : 'pointer', opacity: cleanupBusy ? 0.6 : 1 }}
                  onClick={handlePurgeDeadLinks}
                  disabled={cleanupBusy}
                  title="HEAD-check up to 500 active external jobs and deactivate dead links"
                >
                  {cleanupBusy ? '…' : '🔗 Purge dead links'}
                </button>
                <button
                  style={{ padding: '8px 14px', fontSize: 12, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: cleanupBusy ? 'not-allowed' : 'pointer', opacity: cleanupBusy ? 0.6 : 1 }}
                  onClick={handleExpireOld}
                  disabled={cleanupBusy}
                  title="Deactivate all external jobs older than 45 days"
                >
                  {cleanupBusy ? '…' : '📅 Expire 45d+ jobs'}
                </button>
                <button
                  style={{ padding: '8px 14px', fontSize: 12, borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: cleanupBusy ? 'not-allowed' : 'pointer', opacity: cleanupBusy ? 0.6 : 1 }}
                  onClick={handleDeleteInactive}
                  disabled={cleanupBusy}
                  title="Permanently delete all inactive jobs with no student applications"
                >
                  {cleanupBusy ? '…' : '🗑 Delete inactive'}
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div style={styles.filterBar}>
              <input
                style={styles.searchInput}
                placeholder="Search by title or company…"
                value={jobSearch}
                onChange={e => setJobSearch(e.target.value)}
              />
              <select
                style={styles.selectInput}
                value={jobStatusFilter}
                onChange={e => setJobStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
                <option value="expired">Expired</option>
              </select>
              <span style={{ fontSize: 13, color: '#6b7280', alignSelf: 'center' }}>
                {liveJobsTotal} total
              </span>
            </div>

            <div style={{ ...styles.card, padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, ...styles.thFirst }}>Title</th>
                      <th style={styles.th}>Company</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Applicants</th>
                      <th style={styles.th}>Status</th>
                      <th style={{ ...styles.th, ...styles.thLast }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobsLoading ? (
                      <tr><td colSpan={6} style={styles.emptyRow}>Loading…</td></tr>
                    ) : liveJobs.length === 0 ? (
                      <tr><td colSpan={6} style={styles.emptyRow}>No jobs found.</td></tr>
                    ) : (
                      liveJobs.map((job, i) => (
                        <tr key={job.id}>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <div style={{ fontWeight: 700, color: '#0f2419', fontSize: 13 }}>{job.title}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{job.location}</div>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span style={{ fontWeight: 600 }}>{job.company_name || job.company}</span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{job.job_type || job.jobType || '—'}</span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span style={{ fontWeight: 700, color: '#1a7a4a' }}>{job.applicants_count ?? 0}</span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                              background: job.status === 'active' ? '#d7f4ea' : job.status === 'closed' ? '#fee2e2' : '#f3f4f6',
                              color: job.status === 'active' ? '#1a7a4a' : job.status === 'closed' ? '#dc2626' : '#6b7280',
                            }}>
                              {job.status ?? 'draft'}
                            </span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {job.status !== 'active' && (
                                <button
                                  style={styles.btnSmallOutline}
                                  disabled={updatingJobId === job.id}
                                  onClick={() => handleAdminJobUpdate(job.id, { status: 'active' })}
                                >
                                  Approve
                                </button>
                              )}
                              {job.status === 'active' && (
                                <button
                                  style={styles.btnSmallRed}
                                  disabled={updatingJobId === job.id}
                                  onClick={() => handleAdminJobUpdate(job.id, { status: 'closed' })}
                                >
                                  Close
                                </button>
                              )}
                              <button
                                style={{ ...styles.btnSmallOutline, background: job.arivupro_exclusive ? '#d7f4ea' : undefined }}
                                disabled={updatingJobId === job.id}
                                onClick={() => handleAdminJobUpdate(job.id, { arivupro_exclusive: !job.arivupro_exclusive })}
                              >
                                {job.arivupro_exclusive ? 'Exclusive' : 'Mark exclusive'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB 4: COMPANIES */}
        {activeTab === 'Companies' && (
          <CompaniesTab displayCompanies={displayCompanies} />
        )}
        {/* TAB 5: RECRUITERS */}
        {activeTab === 'Recruiters' && (
          <>
            <div style={{ ...styles.pageHeader, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h1 style={styles.pageTitle}>Recruiter Applications</h1>
                  {pendingRecruiterCount > 0 && (
                    <span style={{ background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 4, padding: '2px 9px', lineHeight: 1.6 }}>
                      {pendingRecruiterCount} pending
                    </span>
                  )}
                </div>
                <p style={styles.pageSubtitle}>Review and approve recruiter account registrations</p>
              </div>
            </div>
            {recruitersLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>Loading…</div>
            ) : liveRecruiters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', color: '#9ca3af', fontSize: 14 }}>
                No recruiter registrations yet.
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, ...styles.thFirst }}>Company Name</th>
                      <th style={styles.th}>Company Website</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Contact Number</th>
                      <th style={styles.th}>Mail</th>
                      <th style={styles.th}>Office Address</th>
                      <th style={styles.th}>Status</th>
                      <th style={{ ...styles.th, ...styles.thLast }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveRecruiters.map((r: any, i: number) => {
                      const tdSt = i % 2 === 0 ? styles.td : styles.tdAlt;
                      const statusColor =
                        r.approval_status === 'approved' ? '#1a7a4a'
                        : r.approval_status === 'rejected' ? '#dc2626'
                        : '#b45309';
                      const statusLabel =
                        r.approval_status === 'approved' ? 'Approved'
                        : r.approval_status === 'rejected' ? 'Rejected'
                        : 'Pending';
                      return (
                        <tr key={r.id}>
                          <td style={tdSt}>
                            <div style={{ fontWeight: 700, color: '#0f2419', fontSize: 13 }}>{r.company_name}</div>
                          </td>
                          <td style={tdSt}>
                            {r.company_website
                              ? <a href={r.company_website.startsWith('http') ? r.company_website : `https://${r.company_website}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#1a7a4a', textDecoration: 'none' }}>{r.company_website}</a>
                              : <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>}
                          </td>
                          <td style={tdSt}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.full_name}</div>
                          </td>
                          <td style={tdSt}>
                            <div style={{ fontSize: 13, color: '#374151' }}>{r.phone || <span style={{ color: '#9ca3af' }}>—</span>}</div>
                          </td>
                          <td style={tdSt}>
                            <div style={{ fontSize: 12, color: '#374151' }}>{r.email}</div>
                          </td>
                          <td style={tdSt}>
                            {r.office_address
                              ? <div style={{ fontSize: 12, color: '#374151' }}>{r.office_address}{r.city ? `, ${r.city}` : ''}{r.state ? `, ${r.state}` : ''}</div>
                              : <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>}
                          </td>
                          <td style={tdSt}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
                            {r.created_at && (
                              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                                {new Date(r.created_at).toLocaleDateString('en-IN')}
                              </div>
                            )}
                          </td>
                          <td style={tdSt}>
                            {r.approval_status === 'pending' ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  style={styles.btnSmallSolid}
                                  disabled={approvingId === r.id}
                                  onClick={() => handleRecruiterAction(r.id, 'approve')}
                                >
                                  {approvingId === r.id ? '…' : 'Approve'}
                                </button>
                                <button
                                  style={styles.btnSmallRed}
                                  disabled={approvingId === r.id}
                                  onClick={() => handleRecruiterAction(r.id, 'reject')}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: '#9ca3af' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Toast ── */}
      {toastMsg && (
        <div style={styles.toast}>
          {toastMsg}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
