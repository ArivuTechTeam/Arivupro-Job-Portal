import React, { useState, useEffect, useCallback } from 'react';
import { JobListing, JobApplication } from '../types/index.ts';

interface AdminDashboardProps {
  jobs: JobListing[];
  applications: JobApplication[];
}

type AdminTab = 'Dashboard' | 'All Students' | 'All Jobs' | 'Companies';

// ── Seed Data ──────────────────────────────────────────────────────────────

const SEED_STUDENTS = [
  {
    id: 'RV-2024-001',
    name: 'Rohan Venkatesh',
    course: 'ACCA',
    stage: 'Recruiter Screen' as const,
    aiScore: 87,
    aiGrade: 'Excellent' as const,
    counselor: 'Meghna Rao',
    crmSync: 'Synced' as const,
  },
  {
    id: 'PN-2024-022',
    name: 'Priya Nair',
    course: 'CA',
    stage: 'Offer Released' as const,
    aiScore: 91,
    aiGrade: 'Excellent' as const,
    counselor: 'Arjun Pillai',
    crmSync: 'Synced' as const,
  },
  {
    id: 'AS-2024-045',
    name: 'Amit Sharma',
    course: 'US CPA',
    stage: 'ArivuPro Review' as const,
    aiScore: 74,
    aiGrade: 'Strong' as const,
    counselor: 'Meghna Rao',
    crmSync: 'Pending' as const,
  },
  {
    id: 'SR-2024-067',
    name: 'Sneha Reddy',
    course: 'CFA',
    stage: 'Applied' as const,
    aiScore: 68,
    aiGrade: 'Good' as const,
    counselor: '—',
    crmSync: 'Pending' as const,
  },
  {
    id: 'KI-2024-089',
    name: 'Karthik Iyer',
    course: 'CS',
    stage: 'Technical Round' as const,
    aiScore: 82,
    aiGrade: 'Excellent' as const,
    counselor: 'Arjun Pillai',
    crmSync: 'Synced' as const,
  },
  {
    id: 'DM-2024-103',
    name: 'Divya Menon',
    course: 'CA Inter',
    stage: 'Applied' as const,
    aiScore: 71,
    aiGrade: 'Strong' as const,
    counselor: '—',
    crmSync: 'Pending' as const,
  },
];

const SEED_COMPANIES = [
  {
    id: 'c1',
    name: 'Deloitte India',
    email: 'campus@deloitte.com',
    status: 'MoU Partner' as const,
    industry: 'Big 4 Audit',
    activeJobs: 3,
    contact: 'Meghna Rao',
  },
  {
    id: 'c2',
    name: 'Goldman Sachs',
    email: 'campus@gs.com',
    status: 'MoU Partner' as const,
    industry: 'Investment Banking',
    activeJobs: 1,
    contact: 'Ravi Kumar',
  },
  {
    id: 'c3',
    name: 'BDO India LLP',
    email: 'hr@bdo.in',
    status: 'Verified' as const,
    industry: 'Accounting',
    activeJobs: 2,
    contact: 'Suresh Pillai',
  },
  {
    id: 'c4',
    name: 'Grant Thornton',
    email: 'careers@gt.in',
    status: 'Pending Review' as const,
    industry: 'Accounting',
    activeJobs: 0,
    contact: 'Anjali Sharma',
  },
];

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

// ── Main Component ──────────────────────────────────────────────────────────

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ jobs, applications }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStageFilter, setStudentStageFilter] = useState('All Stages');

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  const TABS: AdminTab[] = ['Dashboard', 'All Students', 'All Jobs', 'Companies'];

  // Filter students
  const filteredStudents = SEED_STUDENTS.filter((s) => {
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
      {/* ── Tab Strip ── */}
      <div style={styles.tabStrip}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={'tab-link' + (activeTab === tab ? ' active' : '')}
            onClick={() => setActiveTab(tab)}
            style={{ background: 'none' }}
          >
            {tab}
          </button>
        ))}
      </div>

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
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Industry</th>
                      <th style={styles.th}>Active Jobs</th>
                      <th style={styles.th}>Contact</th>
                      <th style={{ ...styles.th, ...styles.thLast }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SEED_COMPANIES.map((co, i) => (
                      <tr key={co.id}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                          <div style={{ fontWeight: 700, color: '#0f2419', fontSize: 13 }}>
                            {co.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                            {co.email}
                          </div>
                        </td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                          <span className={companyStatusBadgeClass(co.status)}>{co.status}</span>
                        </td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                          <span style={{ fontSize: 13, color: '#374151' }}>{co.industry}</span>
                        </td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: co.activeJobs > 0 ? '#1a7a4a' : '#9ca3af',
                            }}
                          >
                            {co.activeJobs}
                          </span>
                        </td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                          <span style={{ fontSize: 13 }}>{co.contact}</span>
                        </td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              style={styles.btnSmallOutline}
                              onClick={() => showToast(`Viewing ${co.name}`)}
                            >
                              View
                            </button>
                            {co.status === 'Pending Review' && (
                              <button
                                style={styles.btnSmallSolid}
                                onClick={() => showToast(`${co.name} approved`)}
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
