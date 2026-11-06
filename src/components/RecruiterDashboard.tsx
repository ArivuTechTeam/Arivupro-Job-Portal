import React, { useState } from 'react';
import {
  LayoutDashboard, Briefcase, Users, PlusCircle,
  ChevronDown, Download, Eye, CheckCircle2, ArrowLeft,
  FileText, Phone, Mail, GraduationCap, Star,
} from 'lucide-react';
import { RegisteredCompany } from '../types/index.ts';

interface RecruiterDashboardProps {
  recruiter: RegisteredCompany;
  jobs: any[];
  applicants: any[];
}

type RecruiterPage = 'dashboard' | 'jobs' | 'applicants' | 'post';

const STAGES = [
  'Applied', 'ArivuPro Review', 'Recruiter Screen',
  'Technical Round', 'Partner Interview', 'Offer Released', 'Placed', 'Declined',
] as const;

const JOB_TYPES = ['Full-Time', 'Articleship / Industrial Training', 'Internship', 'Contract'];
const WORKPLACES = ['Hybrid', 'Onsite', 'Remote'];
const QUALIFICATIONS = ['CA', 'CA_INTER', 'ACCA', 'US_CPA', 'US_CMA', 'CFA', 'CS', 'CMA_INDIA'];

// ── Seed data ───────────────────────────────────────────────────────────────
const SEED_JOBS = [
  { id: 'rj1', title: 'Audit & Assurance Associate', type: 'Full-Time', status: 'Active', applicants: 3, posted: '2026-11-02', deadline: '2026-11-20' },
  { id: 'rj2', title: 'US Tax Senior Analyst',       type: 'Full-Time', status: 'Active', applicants: 2, posted: '2026-11-01', deadline: '2026-11-25' },
  { id: 'rj3', title: 'Risk Advisory Associate',     type: 'Full-Time', status: 'Draft',  applicants: 0, posted: '—',          deadline: '—' },
];

const SEED_APPLICANTS = [
  {
    id: 'ap1', jobId: 'rj1', name: 'Rohan Venkatesh', email: 'rohan.v@arivupro.in',
    phone: '+91 98765 43210', course: 'ACCA + US CPA', match: 94,
    stage: 'Technical Round', applied: 'Nov 3',
    skills: ['US GAAP', 'PCAOB', 'Audit', 'Excel', 'SAP'],
    about: 'ACCA Affiliate with 1 year Big 4 internship experience. Cleared all ACCA papers and 2 US CPA exams.',
    resumeUrl: '#',
  },
  {
    id: 'ap2', jobId: 'rj1', name: 'Priya Sundaram', email: 'priya.s@arivupro.in',
    phone: '+91 91234 56789', course: 'CA Final', match: 88,
    stage: 'Recruiter Screen', applied: 'Nov 2',
    skills: ['Ind AS', 'Statutory Audit', 'TallyPrime', 'Tax Audit'],
    about: 'CA Final student with articleship at mid-tier firm. Strong Ind AS and statutory audit exposure.',
    resumeUrl: '#',
  },
  {
    id: 'ap3', jobId: 'rj1', name: 'Aditya Patel', email: 'aditya.p@arivupro.in',
    phone: '+91 87654 32109', course: 'CFA L2', match: 76,
    stage: 'Applied', applied: 'Nov 4',
    skills: ['Financial Modeling', 'DCF', 'Excel', 'Bloomberg'],
    about: 'CFA Level 2 candidate with strong equity research background. Interned at a SEBI-registered IA.',
    resumeUrl: '#',
  },
  {
    id: 'ap4', jobId: 'rj2', name: 'Sneha Reddy', email: 'sneha.r@arivupro.in',
    phone: '+91 99887 76655', course: 'US CPA', match: 91,
    stage: 'Recruiter Screen', applied: 'Nov 2',
    skills: ['Form 1120', 'Form 1065', 'OneSource', 'Federal Tax'],
    about: 'US CPA candidate with Big 4 US tax internship. Proficient in Form 1120, 1065 and OneSource.',
    resumeUrl: '#',
  },
  {
    id: 'ap5', jobId: 'rj2', name: 'Karthik Iyer', email: 'karthik.i@arivupro.in',
    phone: '+91 88776 65544', course: 'CA + US CPA', match: 83,
    stage: 'Applied', applied: 'Nov 3',
    skills: ['ASC 740', 'CCH Axcess', 'State Tax', 'Transfer Pricing'],
    about: 'CA with US CPA in progress. 2 years tax advisory experience at a consulting firm.',
    resumeUrl: '#',
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function stageColor(s: string) {
  if (s === 'Placed' || s === 'Offer Released') return '#1a7a4a';
  if (s === 'Declined') return '#dc2626';
  if (s === 'Technical Round' || s === 'Partner Interview') return '#7c3aed';
  if (s === 'Recruiter Screen') return '#1d4ed8';
  if (s === 'ArivuPro Review') return '#b45309';
  return '#6b7280';
}

function matchBadge(score: number) {
  if (score >= 85) return { cls: 'badge badge-green', label: 'Excellent' };
  if (score >= 70) return { cls: 'badge badge-blue',  label: 'Strong' };
  return                 { cls: 'badge badge-amber',  label: 'Good' };
}

// ── Component ────────────────────────────────────────────────────────────────
export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ recruiter }) => {
  const [page, setPage] = useState<RecruiterPage>('dashboard');
  const [viewingJobId, setViewingJobId] = useState<string | null>(null); // which job's applicants
  const [viewingApplicant, setViewingApplicant] = useState<typeof SEED_APPLICANTS[0] | null>(null);
  const [stages, setStages] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', type: 'Full-Time', workplace: 'Hybrid', location: '', salary: '', description: '', qualifications: [] as string[] });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const getStage = (id: string, def: string) => stages[id] ?? def;
  const setStage = (id: string, s: string) => setStages(p => ({ ...p, [id]: s }));

  const toggleQual = (q: string) => setForm(p => ({
    ...p,
    qualifications: p.qualifications.includes(q) ? p.qualifications.filter(x => x !== q) : [...p.qualifications, q],
  }));

  const handlePublish = (isDraft: boolean) => {
    if (!form.title.trim()) { showToast('⚠️ Job title is required.'); return; }
    showToast(isDraft ? '📋 Draft saved!' : '✅ Job published to ArivuPro Portal!');
    setForm({ title: '', type: 'Full-Time', workplace: 'Hybrid', location: '', salary: '', description: '', qualifications: [] });
    if (!isDraft) setPage('jobs');
  };

  // Which applicants to show (filtered by job)
  const jobApplicants = viewingJobId ? SEED_APPLICANTS.filter(a => a.jobId === viewingJobId) : [];
  const viewingJob = SEED_JOBS.find(j => j.id === viewingJobId);

  // Sidebar nav items
  const NAV = [
    { id: 'dashboard' as RecruiterPage, icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { id: 'jobs'      as RecruiterPage, icon: <Briefcase size={16} />,       label: 'My Job Posts' },
    { id: 'applicants'as RecruiterPage, icon: <Users size={16} />,           label: 'Applicants' },
    { id: 'post'      as RecruiterPage, icon: <PlusCircle size={16} />,      label: 'Post a Job' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 112px)', background: '#f7f7f7' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f2419', color: '#fff', borderRadius: 12, padding: '14px 20px', fontSize: 13, fontWeight: 600, boxShadow: '0 8px 32px rgba(15,36,25,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={15} color="#fede6d" />{toast}
        </div>
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside style={{ width: 220, background: '#fff', borderRight: '1px solid #e5e7eb', flexShrink: 0, padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Company chip */}
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #f3f4f6', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1a7a4a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
              {recruiter.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f2419', lineHeight: 1.2 }}>{recruiter.name}</div>
              <span className={`badge ${recruiter.verificationStatus === 'MoU Partner' ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize: '0.55rem', marginTop: 2 }}>
                {recruiter.verificationStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Section label */}
        <div style={{ padding: '0 16px 6px', fontSize: 10, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Manage</div>

        {NAV.map(n => {
          const active = page === n.id;
          return (
            <button
              key={n.id}
              onClick={() => { setPage(n.id); setViewingJobId(null); setViewingApplicant(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                margin: '1px 10px', padding: '10px 12px', borderRadius: 8,
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: active ? 700 : 600,
                background: active ? '#f0faf4' : 'transparent',
                color: active ? '#1a7a4a' : '#6b7280',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span style={{ color: active ? '#1a7a4a' : '#9ca3af' }}>{n.icon}</span>
              {n.label}
            </button>
          );
        })}
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px 32px', overflowY: 'auto', minWidth: 0 }}>

        {/* ════════════════ DASHBOARD ════════════════ */}
        {page === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>Recruiter Dashboard</h1>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>{recruiter.name} — Campus Recruitment</p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                { label: 'Active Job Posts', value: 3, sub: '2 receiving applications',   color: '#b45309', border: '#fde68a' },
                { label: 'Total Applicants', value: 53, sub: 'This month',                color: '#1a7a4a', border: '#d7f4ea' },
                { label: 'In Interview Stage', value: 8, sub: 'Scheduled this week',      color: '#1d4ed8', border: '#dbeafe' },
                { label: 'Offers Extended', value: 2, sub: 'Awaiting acceptance',         color: '#7c3aed', border: '#ede9fe' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: `1px solid ${s.border}`, borderLeft: `4px solid ${s.color}`, borderRadius: 12, padding: '20px 20px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{s.label}</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Recent applicants */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f2419' }}>Recent Applicants</div>
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setPage('applicants')}>View all →</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Candidate', 'Course', 'AI Match', 'Stage', 'Applied', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SEED_APPLICANTS.slice(0, 3).map((ap, i) => {
                    const mb = matchBadge(ap.match);
                    return (
                      <tr key={ap.id} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0f2419' }}>{ap.name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{ap.email}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>{ap.course}</td>
                        <td style={{ padding: '12px 16px' }}><span className={mb.cls}>{ap.match}% {mb.label}</span></td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: stageColor(getStage(ap.id, ap.stage)) + '18', color: stageColor(getStage(ap.id, ap.stage)) }}>
                            {getStage(ap.id, ap.stage)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 12 }}>{ap.applied}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => { setViewingApplicant(ap); setPage('applicants'); }}>
                              <Eye size={11} /> View
                            </button>
                            <button className="btn-primary" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => showToast(`Interview scheduled for ${ap.name}`)}>
                              Schedule
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════ MY JOB POSTS ════════════════ */}
        {page === 'jobs' && !viewingJobId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>My Job Posts</h1>
                <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Manage your active listings</p>
              </div>
              <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setPage('post')}>+ Post New Job</button>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Job Title', 'Status', 'Applicants', 'Posted', 'Deadline', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SEED_JOBS.map((job, i) => (
                    <tr key={job.id} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 700, color: '#0f2419' }}>{job.title}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{job.type}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className={job.status === 'Active' ? 'badge badge-green' : 'badge badge-gray'}>{job.status}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: job.applicants > 0 ? '#1a7a4a' : '#9ca3af', fontSize: 15 }}>{job.applicants}</td>
                      <td style={{ padding: '14px 20px', color: '#6b7280' }}>{job.posted}</td>
                      <td style={{ padding: '14px 20px', color: '#6b7280' }}>{job.deadline}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn-primary"
                            style={{ fontSize: 12, padding: '6px 14px' }}
                            onClick={() => { setViewingJobId(job.id); }}
                            disabled={job.applicants === 0}
                          >
                            View Apps {job.applicants > 0 && `(${job.applicants})`}
                          </button>
                          <button
                            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 999, border: '1px solid #fca5a5', background: 'transparent', color: '#dc2626', fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
                            onClick={() => showToast(`Job "${job.title}" closed.`)}
                          >
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════ VIEW APPLICANTS FOR A JOB ════════════════ */}
        {page === 'jobs' && viewingJobId && !viewingApplicant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Back + header */}
            <div>
              <button onClick={() => setViewingJobId(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6b7280', fontFamily: 'Manrope, sans-serif', padding: 0, marginBottom: 16 }}>
                <ArrowLeft size={14} /> Back to My Job Posts
              </button>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>
                Applicants — {viewingJob?.title}
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>{jobApplicants.length} candidates applied for this role</p>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Candidate', 'Course', 'AI Match', 'Stage', 'Applied', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobApplicants.map((ap, i) => {
                    const mb = matchBadge(ap.match);
                    const currentStage = getStage(ap.id, ap.stage);
                    return (
                      <tr key={ap.id} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 700, color: '#0f2419' }}>{ap.name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{ap.email}</div>
                        </td>
                        <td style={{ padding: '14px 20px', fontWeight: 600, color: '#374151' }}>{ap.course}</td>
                        <td style={{ padding: '14px 20px' }}><span className={mb.cls}>{ap.match}% {mb.label}</span></td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: stageColor(currentStage) + '18', color: stageColor(currentStage) }}>
                              {currentStage}
                            </span>
                            <div style={{ position: 'relative' }}>
                              <select
                                value={currentStage}
                                onChange={e => { setStage(ap.id, e.target.value); showToast(`${ap.name} → ${e.target.value}`); }}
                                style={{ fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 20px 3px 8px', cursor: 'pointer', outline: 'none', fontFamily: 'Manrope, sans-serif', background: '#fff', appearance: 'none', color: '#374151' }}
                              >
                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <ChevronDown size={10} color="#9ca3af" style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#9ca3af', fontSize: 12 }}>{ap.applied}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-primary" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => setViewingApplicant(ap)}>
                              <Eye size={11} /> View Profile
                            </button>
                            <button
                              className="btn-outline"
                              style={{ fontSize: 11, padding: '6px 12px' }}
                              onClick={() => showToast(`Downloading ${ap.name}'s resume...`)}
                            >
                              <Download size={11} /> Resume
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════ APPLICANT DETAIL / PROFILE ════════════════ */}
        {viewingApplicant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <button
              onClick={() => setViewingApplicant(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6b7280', fontFamily: 'Manrope, sans-serif', padding: 0 }}
            >
              <ArrowLeft size={14} /> Back to Applicants
            </button>

            {/* Profile header */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{ width: 64, height: 64, borderRadius: 14, background: '#1a7a4a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, flexShrink: 0 }}>
                  {viewingApplicant.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', margin: 0 }}>{viewingApplicant.name}</h2>
                    <span className={matchBadge(viewingApplicant.match).cls}>{viewingApplicant.match}% {matchBadge(viewingApplicant.match).label}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#6b7280' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={13} />{viewingApplicant.email}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={13} />{viewingApplicant.phone}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><GraduationCap size={13} />{viewingApplicant.course}</span>
                  </div>
                </div>

                {/* Stage + actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 999, background: stageColor(getStage(viewingApplicant.id, viewingApplicant.stage)) + '18', color: stageColor(getStage(viewingApplicant.id, viewingApplicant.stage)) }}>
                    {getStage(viewingApplicant.id, viewingApplicant.stage)}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-outline" style={{ fontSize: 12, padding: '7px 16px' }} onClick={() => showToast(`Downloading ${viewingApplicant.name}'s resume...`)}>
                      <Download size={13} /> Download Resume
                    </button>
                    <button className="btn-primary" style={{ fontSize: 12, padding: '7px 16px' }} onClick={() => showToast(`Interview scheduled for ${viewingApplicant.name}!`)}>
                      Schedule Interview
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-col: about + skills | stage update */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* About */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', marginBottom: 10 }}>About</div>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>{viewingApplicant.about}</p>
                </div>

                {/* Skills */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', marginBottom: 12 }}>Key Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {viewingApplicant.skills.map(s => (
                      <span key={s} style={{ padding: '5px 14px', borderRadius: 999, background: '#f0faf4', border: '1px solid #d7f4ea', fontSize: 12, fontWeight: 700, color: '#1a7a4a' }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* Resume placeholder */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={16} color="#1a7a4a" /> Resume
                  </div>
                  <div style={{ background: '#f9fafb', border: '2px dashed #d7f4ea', borderRadius: 10, padding: '28px', textAlign: 'center' }}>
                    <FileText size={32} color="#d7f4ea" style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 12 }}>{viewingApplicant.name}_Resume.pdf</div>
                    <button className="btn-primary" style={{ fontSize: 12, padding: '8px 20px' }} onClick={() => showToast(`Downloading ${viewingApplicant.name}'s resume...`)}>
                      <Download size={13} /> Download PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: stage updater + AI score */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* AI Match breakdown */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={15} color="#fede6d" fill="#fede6d" /> AI Match Score
                  </div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: '#1a7a4a', textAlign: 'center', marginBottom: 4 }}>{viewingApplicant.match}%</div>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}><span className={matchBadge(viewingApplicant.match).cls}>{matchBadge(viewingApplicant.match).label} Match</span></div>
                  {[
                    { label: 'Qualification Fit', pct: Math.min(99, viewingApplicant.match + 7) },
                    { label: 'Skills Match',      pct: viewingApplicant.match },
                    { label: 'Experience Fit',    pct: Math.max(60, viewingApplicant.match - 10) },
                  ].map(bar => (
                    <div key={bar.label} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                        <span>{bar.label}</span><span style={{ color: '#1a7a4a' }}>{bar.pct}%</span>
                      </div>
                      <div style={{ height: 6, background: '#f0faf4', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${bar.pct}%`, height: '100%', background: 'linear-gradient(90deg,#fede6d,#1a7a4a)', borderRadius: 999 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stage updater */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', marginBottom: 12 }}>Update Stage</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {STAGES.map(s => {
                      const current = getStage(viewingApplicant.id, viewingApplicant.stage);
                      const isActive = current === s;
                      return (
                        <button
                          key={s}
                          onClick={() => { setStage(viewingApplicant.id, s); showToast(`${viewingApplicant.name} → ${s}`); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '8px 12px', borderRadius: 8, border: `1px solid ${isActive ? stageColor(s) : '#e5e7eb'}`,
                            background: isActive ? stageColor(s) + '12' : '#fff',
                            cursor: 'pointer', textAlign: 'left', fontFamily: 'Manrope, sans-serif',
                            fontSize: 12, fontWeight: isActive ? 800 : 600,
                            color: isActive ? stageColor(s) : '#6b7280',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? stageColor(s) : '#d1d5db', flexShrink: 0 }} />
                          {s}
                          {isActive && <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓ Current</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ ALL APPLICANTS (from sidebar) ════════════════ */}
        {page === 'applicants' && !viewingApplicant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>All Applicants</h1>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Candidates who applied to your job posts</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Candidate', 'Course', 'AI Match', 'Stage', 'Applied For', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SEED_APPLICANTS.map((ap, i) => {
                    const mb = matchBadge(ap.match);
                    const jobTitle = SEED_JOBS.find(j => j.id === ap.jobId)?.title ?? '—';
                    return (
                      <tr key={ap.id} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 700, color: '#0f2419' }}>{ap.name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{ap.email}</div>
                        </td>
                        <td style={{ padding: '14px 20px', fontWeight: 600, color: '#374151' }}>{ap.course}</td>
                        <td style={{ padding: '14px 20px' }}><span className={mb.cls}>{ap.match}% {mb.label}</span></td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: stageColor(getStage(ap.id, ap.stage)) + '18', color: stageColor(getStage(ap.id, ap.stage)) }}>
                              {getStage(ap.id, ap.stage)}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: '#6b7280', maxWidth: 160 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{jobTitle}</div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-primary" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => setViewingApplicant(ap)}>
                              <Eye size={11} /> View Profile
                            </button>
                            <button className="btn-outline" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => showToast(`Downloading ${ap.name}'s resume...`)}>
                              <Download size={11} /> Resume
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════ POST A JOB ════════════════ */}
        {page === 'post' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>Post a New Job</h1>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Fill in the details and publish to ArivuPro Portal</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Job Title *</label>
                  <input className="input-field" placeholder="e.g. Audit Associate" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Company Name</label>
                  <input className="input-field" value={recruiter.name} readOnly style={{ background: '#f9fafb', color: '#6b7280' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Job Type</label>
                  <select className="input-field" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Workplace</label>
                  <select className="input-field" value={form.workplace} onChange={e => setForm(p => ({ ...p, workplace: e.target.value }))}>
                    {WORKPLACES.map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Location</label>
                  <input className="input-field" placeholder="e.g. Bangalore, KA" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Salary / Stipend</label>
                  <input className="input-field" placeholder="e.g. ₹7.5–9.5 LPA" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>Required Qualifications</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {QUALIFICATIONS.map(q => {
                    const sel = form.qualifications.includes(q);
                    return (
                      <button key={q} type="button" onClick={() => toggleQual(q)} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: sel ? '2px solid #1a7a4a' : '1.5px solid #e5e7eb', background: sel ? '#f0faf4' : '#fff', color: sel ? '#1a7a4a' : '#6b7280', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', transition: 'all 0.15s' }}>
                        {sel ? '✓ ' : ''}{q}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Job Description</label>
                <textarea className="input-field" rows={4} placeholder="Describe the role, responsibilities, and requirements..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical', lineHeight: 1.6 }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-primary" style={{ fontSize: 14, padding: '11px 28px' }} onClick={() => handlePublish(false)}>Publish Job</button>
                <button className="btn-outline" style={{ fontSize: 14, padding: '11px 24px' }} onClick={() => handlePublish(true)}>Save Draft</button>
                <button className="btn-ghost" style={{ fontSize: 13, marginLeft: 'auto' }} onClick={() => setForm({ title: '', type: 'Full-Time', workplace: 'Hybrid', location: '', salary: '', description: '', qualifications: [] })}>Clear</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
