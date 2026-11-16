import React, { useState, useEffect, useCallback } from 'react';
import { JobListing, JobApplication } from '../types/index.ts';
import { adminFetch } from '../lib/supabase/auth.ts';

interface AdminDashboardProps {
  jobs: JobListing[];
  applications: JobApplication[];
  activeTab?: AdminTab;
}

type AdminTab = 'Dashboard' | 'All Students' | 'All Jobs' | 'Companies' | 'Recruiters';

// ── Seed Data ──────────────────────────────────────────────────────────────


const PIPELINE_STAGES = [
  { label: 'Applied', count: 148 },
  { label: 'ArivuPro Review', count: 112 },
  { label: 'Recruiter Screen', count: 64 },
  { label: 'Interview Stages', count: 26 },
  { label: 'Offers Released', count: 19 },
  { label: 'Placed', count: 87 },
];

const SALARY_BENCHMARKS = [
  { qualification: 'CA', fresher: '₹7–9 LPA', top: '₹24.5 LPA', big4: '68%' },
  { qualification: 'ACCA (Affiliate)', fresher: '₹7.5–9.5 LPA', top: '₹18 LPA', big4: '72%' },
  { qualification: 'US CPA', fresher: '₹8–11 LPA', top: '₹22 LPA', big4: '55%' },
  { qualification: 'CFA L2/L3', fresher: '₹9–14 LPA', top: '₹28 LPA', big4: '40%' },
  { qualification: 'US CMA / CMA India', fresher: '₹6.5–9 LPA', top: '₹16 LPA', big4: '30%' },
  { qualification: 'CA Articleship', fresher: '₹22–30k/mo', top: '—', big4: '100%' },
];

const ALERTS = [
  {
    icon: '🎯',
    text: 'New application: Rohan Venkatesh applied to Audit Associate @ Deloitte',
    time: '12 min ago',
  },
  {
    icon: '🏢',
    text: 'New recruiter signup: Grant Thornton — pending verification',
    time: '34 min ago',
  },
  {
    icon: '✅',
    text: 'Offer released: Priya Nair → Goldman Sachs FP&A Analyst · ₹14 LPA',
    time: '1h ago',
  },
  {
    icon: '🤖',
    text: 'AI Scraper synced 23 new jobs from JSearch API',
    time: '2h ago',
  },
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
    background: '#f9fafb',
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
    borderLeft: '3px solid #fbbf24',
    background: '#fffbeb',
    borderRadius: 8,
    marginBottom: 10,
  },
  alertText: {
    fontSize: 13,
    color: '#1a1a2e',
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
    background: '#1a7a4a',
    color: '#fff',
    padding: '10px 14px',
    textAlign: 'left' as const,
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '0.03em',
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
    background: '#f9fafb',
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
    borderRadius: 999,
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
    borderRadius: 999,
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
    borderRadius: 999,
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
    borderRadius: 999,
    letterSpacing: '0.03em',
  },
  toast: {
    position: 'fixed' as const,
    bottom: 32,
    right: 32,
    background: '#0f2419',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    zIndex: 9999,
    fontFamily: "'Manrope', sans-serif",
    maxWidth: 340,
    lineHeight: 1.4,
    borderLeft: '4px solid #1a7a4a',
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ jobs, applications, activeTab: propTab }) => {
  const activeTab: AdminTab = propTab ?? 'Dashboard';
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStageFilter, setStudentStageFilter] = useState('All Stages');
  const [liveCompanies, setLiveCompanies] = useState<any[]>([]);
  const [liveStudents, setLiveStudents] = useState<any[]>([]);
  const [liveRecruiters, setLiveRecruiters] = useState<any[]>([]);
  const [recruitersLoading, setRecruitersLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  // Fetch live companies when Companies tab is active
  useEffect(() => {
    if (activeTab === 'Companies') {
      adminFetch('/api/companies')
        .then(r => r.json())
        .then(d => setLiveCompanies(d.companies || []))
        .catch(() => setLiveCompanies([]));
    }
  }, [activeTab]);

  // Fetch recruiters when Recruiters tab is active
  useEffect(() => {
    if (activeTab === 'Recruiters') {
      setRecruitersLoading(true);
      adminFetch('/api/recruiters/pending')
        .then(r => r.json())
        .then(d => setLiveRecruiters(d.recruiters || []))
        .catch(() => setLiveRecruiters([]))
        .finally(() => setRecruitersLoading(false));
    }
  }, [activeTab]);

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

  const maxPipelineCount = Math.max(...PIPELINE_STAGES.map((s) => s.count));

  return (
    <div style={styles.wrapper}>
      {/* ── Tab Content ── */}
      <div style={styles.pageContent}>

        {/* ══════════════════════════════════════════════════════════
            TAB 1: DASHBOARD
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'Dashboard' && (
          <>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Admin Dashboard</h1>
              <p style={styles.pageSubtitle}>
                ArivuPro Placement Operations — Live Overview
              </p>
            </div>

            {/* Stat Cards */}
            <div style={styles.grid4}>
              {/* Total Jobs */}
              <div
                style={{
                  ...styles.statCard,
                  borderLeft: '4px solid #f59e0b',
                }}
              >
                <div style={styles.statLabel}>Total Jobs (Live)</div>
                <div style={styles.statNum}>673</div>
                <div style={styles.statSub}>142 exclusive · 531 scraped</div>
              </div>

              {/* Total Placed */}
              <div
                style={{
                  ...styles.statCard,
                  borderLeft: '4px solid #1a7a4a',
                }}
              >
                <div style={styles.statLabel}>Total Placed</div>
                <div style={styles.statNum}>87</div>
                <div style={styles.statSub}>Avg ₹9.8 LPA · Highest ₹24.5 LPA</div>
              </div>

              {/* Active Interviews */}
              <div
                style={{
                  ...styles.statCard,
                  borderLeft: '4px solid #3b82f6',
                }}
              >
                <div style={styles.statLabel}>Active Interviews</div>
                <div style={styles.statNum}>26</div>
                <div style={styles.statSub}>8 scheduled this week</div>
              </div>

              {/* Student Applicants */}
              <div
                style={{
                  ...styles.statCard,
                  borderLeft: '4px solid #7c3aed',
                }}
              >
                <div style={styles.statLabel}>Student Applicants</div>
                <div style={styles.statNum}>148</div>
                <div style={styles.statSub}>19 offers released</div>
              </div>
            </div>

            {/* Live Alerts */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                <span>Live Alerts</span>
                <span style={styles.pillSmall}>last 2 hours</span>
              </div>
              {ALERTS.map((alert, i) => (
                <div key={i} style={styles.alertRow}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{alert.icon}</span>
                  <span style={styles.alertText}>{alert.text}</span>
                  <span style={styles.alertTime}>{alert.time}</span>
                </div>
              ))}
            </div>

            {/* Placement Pipeline */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Placement Pipeline</div>
              {PIPELINE_STAGES.map((stage) => (
                <div key={stage.label} style={styles.pipelineRow}>
                  <div style={styles.pipelineLabel}>{stage.label}</div>
                  <div style={styles.pipelineCount}>{stage.count}</div>
                  <div style={styles.pipelineBarTrack}>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 4,
                        background: 'linear-gradient(90deg, #fede6d, #1a7a4a)',
                        width: `${Math.round((stage.count / maxPipelineCount) * 100)}%`,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Salary Benchmarks Table */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Course-wise Salary Benchmarks</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, ...styles.thFirst }}>Qualification</th>
                      <th style={styles.th}>Fresher Avg LPA</th>
                      <th style={styles.th}>Top Offer LPA</th>
                      <th style={{ ...styles.th, ...styles.thLast }}>Big 4 Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SALARY_BENCHMARKS.map((row, i) => (
                      <tr key={row.qualification}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                          <span style={{ fontWeight: 700, color: '#0f2419' }}>
                            {row.qualification}
                          </span>
                        </td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{row.fresher}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{row.top}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                          <span style={{ fontWeight: 700, color: '#1a7a4a' }}>{row.big4}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: ALL STUDENTS
        ══════════════════════════════════════════════════════════ */}
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

        {/* ══════════════════════════════════════════════════════════
            TAB 3: ALL JOBS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'All Jobs' && (
          <>
            <div style={styles.headerRow}>
              <div>
                <h1 style={styles.pageTitle}>All Jobs</h1>
                <p style={styles.pageSubtitle}>Manage every listing in the portal</p>
              </div>
              <button
                className="btn-primary"
                style={{ padding: '9px 20px', fontSize: 13 }}
                onClick={() => showToast('Coming soon')}
              >
                + New Job
              </button>
            </div>

            <div style={{ ...styles.card, padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, ...styles.thFirst }}>Title</th>
                      <th style={styles.th}>Company</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Source</th>
                      <th style={styles.th}>Applicants</th>
                      <th style={styles.th}>Status</th>
                      <th style={{ ...styles.th, ...styles.thLast }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={styles.emptyRow}>
                          No jobs loaded. Jobs will appear here once fetched.
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job, i) => (
                        <tr key={job.id}>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <div style={{ fontWeight: 700, color: '#0f2419', fontSize: 13 }}>
                              {job.title}
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                              {job.location}
                            </div>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span style={{ fontWeight: 600 }}>{job.company}</span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{job.jobType}</span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span className={sourceBadgeClass(job.source)}>
                              {sourceLabel(job.source)}
                            </span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span style={{ fontWeight: 700, color: '#1a7a4a' }}>
                              {job.applicantsCount}
                            </span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <span className="badge badge-green">Active</span>
                          </td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                style={styles.btnSmallOutline}
                                onClick={() => showToast('Coming soon')}
                              >
                                Edit
                              </button>
                              <button
                                style={styles.btnSmallRed}
                                onClick={() => showToast('Coming soon')}
                              >
                                Close
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

        {/* ══════════════════════════════════════════════════════════
            TAB 4: COMPANIES
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'Companies' && (
          <CompaniesTab displayCompanies={displayCompanies} />
        )}
        {/* ══════════════════════════════════════════════════════════
            TAB 5: RECRUITERS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'Recruiters' && (
          <>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Recruiter Applications</h1>
              <p style={styles.pageSubtitle}>Review and approve recruiter account registrations</p>
            </div>
            {recruitersLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>Loading…</div>
            ) : liveRecruiters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', color: '#9ca3af', fontSize: 14 }}>
                No recruiter registrations yet.
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
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
