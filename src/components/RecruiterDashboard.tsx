import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase/client.ts';
import { AmbientCanvas } from './AmbientCanvas.tsx';
import {
  LayoutDashboard, Briefcase, Users, PlusCircle,
  ChevronDown, Download, Eye, CheckCircle2, ArrowLeft,
  FileText, Phone, Mail, GraduationCap, User,
} from 'lucide-react';

interface RecruiterDashboardProps {
  recruiterName: string;
  recruiterEmail: string;
  companyName: string;
  sessionToken: string;
  openProfileSignal?: number;
}

type RecruiterPage = 'dashboard' | 'jobs' | 'applicants' | 'post' | 'profile';

const STAGES = [
  'Applied', 'Recruiter Screen',
  'Technical Round', 'Partner Interview', 'Offer Released', 'Placed', 'Declined',
] as const;

const JOB_TYPES = ['Full-Time', 'Articleship / Industrial Training', 'Internship', 'Contract'];
const WORKPLACES = ['Hybrid', 'Onsite', 'Remote'];
const QUALIFICATIONS = ['CA', 'CA_INTER', 'ACCA', 'US_CPA', 'US_CMA', 'CFA', 'CS', 'CMA_INDIA'];


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

// ── Recruiter Profile Page ───────────────────────────────────────────────────
const FIRM_TYPES = ['Big 4', 'Mid-tier CA Firm', 'Small CA Firm', 'MNC', 'Indian Corporate', 'NBFC / BFSI', 'GCC / Captive', 'Startup'];
const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500–1000', '1000+'];

interface RecruiterProfilePageProps {
  profileData: Record<string, string>;
  companyName: string;
  recruiterName: string;
  recruiterEmail: string;
  logoPreview: string | null;
  logoUploading: boolean;
  logoError: string | null;
  logoSuccess: boolean;
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getToken: () => Promise<string>;
  onSaved: (updated: Record<string, string>) => void;
}

function RecruiterProfilePage({ profileData, companyName, recruiterName, recruiterEmail, logoPreview, logoUploading, logoError, logoSuccess, handleLogoChange, getToken, onSaved }: RecruiterProfilePageProps) {
  const [editForm, setEditForm] = useState({
    company_summary: profileData.company_summary || '',
    founded_year: profileData.founded_year || '',
    company_size: profileData.company_size || '',
    firm_type: profileData.firm_type || '',
    linkedin_page: profileData.linkedin_page || '',
    office_address: profileData.office_address || '',
    company_website: profileData.company_website || '',
    company_domain: profileData.company_domain || '',
    phone: profileData.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const field = (label: string, key: keyof typeof editForm, opts?: { type?: string; placeholder?: string; textarea?: boolean; select?: string[] }) => (
    <div key={key}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 5 }}>{label}</label>
      {opts?.select ? (
        <select value={editForm[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'Manrope, sans-serif', background: '#fff', color: '#0f2419', outline: 'none' }}>
          <option value="">— Select —</option>
          {opts.select.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : opts?.textarea ? (
        <textarea value={editForm[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} rows={4}
          placeholder={opts?.placeholder}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'Manrope, sans-serif', resize: 'vertical', boxSizing: 'border-box' as const, outline: 'none' }} />
      ) : (
        <input type={opts?.type || 'text'} value={editForm[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={opts?.placeholder}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'Manrope, sans-serif', boxSizing: 'border-box' as const, outline: 'none' }} />
      )}
    </div>
  );

  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      const token = await getToken();
      const body: Record<string, string | number | null> = {};
      for (const [k, v] of Object.entries(editForm)) {
        if (k === 'founded_year') {
          body[k] = v ? (parseInt(v) || null) : null;
        } else {
          body[k] = v || null;
        }
      }
      const res = await fetch('/api/recruiters/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      onSaved(editForm);
    } catch (e) {
      setSaveError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '8px 0' }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', marginBottom: 24 }}>My Profile</h2>

      {/* Logo */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2419', marginBottom: 4 }}>Company Logo</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>PNG, JPG or WebP · max 2 MB · shown on all your job listings</div>
        {logoPreview ? (
          <img src={logoPreview} alt="Company logo" style={{ width: 160, height: 80, objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', marginBottom: 16, display: 'block' }} />
        ) : (
          <div style={{ width: 160, height: 80, borderRadius: 8, border: '2px dashed #d1d5db', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>No logo yet</span>
          </div>
        )}
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#1a7a4a', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}>
          <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleLogoChange} />
          {logoUploading ? 'Uploading…' : 'Upload Logo'}
        </label>
        {logoError && <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>{logoError}</div>}
        {logoSuccess && <div style={{ marginTop: 8, fontSize: 12, color: '#1a7a4a' }}>Logo saved!</div>}
      </div>

      {/* Read-only identity */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2419', marginBottom: 16 }}>Account Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }} className="rd-form-row">
          {[
            { label: 'Company Name', value: profileData.company_name || companyName },
            { label: 'Contact Name', value: profileData.full_name || recruiterName || '—' },
            { label: 'Email', value: profileData.email || recruiterEmail || '—' },
            { label: 'City', value: profileData.city || '—' },
            { label: 'State', value: profileData.state || '—' },
            { label: 'Status', value: profileData.approval_status || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f2419', wordBreak: 'break-word' as const }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: '#9ca3af' }}>Company name, city, and state are set during registration. Contact support to update them.</div>
      </div>

      {/* Editable company profile */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2419', marginBottom: 20 }}>Company Profile</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }} className="rd-form-row">
            {field('Firm Type', 'firm_type', { select: FIRM_TYPES })}
            {field('Company Size', 'company_size', { select: COMPANY_SIZES })}
            {field('Founded Year', 'founded_year', { type: 'number', placeholder: 'e.g. 2005' })}
            {field('Phone', 'phone', { type: 'tel', placeholder: '+91 98765 43210' })}
            {field('Website', 'company_website', { placeholder: 'https://yourfirm.com' })}
            {field('Industry Domain', 'company_domain', { placeholder: 'e.g. Audit & Tax Advisory' })}
            {field('LinkedIn Page', 'linkedin_page', { placeholder: 'https://linkedin.com/company/...' })}
            {field('Office Address', 'office_address', { placeholder: 'Full address' })}
          </div>
          {field('About Your Company', 'company_summary', { textarea: true, placeholder: 'What your firm does, culture, who you hire (up to 500 chars)…' })}
        </div>
        {saveError && <div style={{ marginTop: 12, fontSize: 13, color: '#dc2626' }}>{saveError}</div>}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ marginTop: 20, padding: '10px 28px', background: saving ? '#9ca3af' : '#1a7a4a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: 'Manrope, sans-serif', cursor: saving ? 'default' : 'pointer' }}
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ recruiterName, recruiterEmail, companyName, sessionToken, openProfileSignal }) => {
  const [page, setPage] = useState<RecruiterPage>('dashboard');

  // When parent increments openProfileSignal (e.g. Navbar "My Profile" click), open profile page
  React.useEffect(() => {
    if (openProfileSignal) setPage('profile');
  }, [openProfileSignal]);
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);
  const [viewingApplicant, setViewingApplicant] = useState<any | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ title: '', location: '', salary_text: '', deadline_date: '', description: '', is_urgent: false });
  const [editSaving, setEditSaving] = useState(false);
  const tokenRef = useRef(sessionToken);

  // Always fetch a fresh token from Supabase — never rely on the prop being set yet.
  // The prop may arrive late (async setState in parent) causing all API calls to fire
  // with an empty token and silently return nothing.
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      tokenRef.current = session.access_token;
      return session.access_token;
    }
    return tokenRef.current ?? '';
  };

  const fetchJobs = async () => {
    const token = await getToken();
    if (!token) return;
    fetch('/api/recruiters/jobs', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { jobs: [] })
      .then(d => setJobs(d.jobs || []))
      .catch(() => {});
  };

  const fetchApplicants = async (jobId?: string) => {
    const token = await getToken();
    if (!token) return;
    const url = jobId ? `/api/recruiters/applicants?job_id=${jobId}` : '/api/recruiters/applicants';
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { applicants: [] })
      .then(d => setApplicants(d.applicants || []))
      .catch(() => {});
  };

  const authHeader = async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    tokenRef.current = sessionToken;
  }, [sessionToken]);

  // Load data on mount — getToken() fetches fresh from Supabase, no prop dependency
  useEffect(() => {
    fetchJobs();
    fetchApplicants();
  }, []);
  const [stages, setStages] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSuccess, setLogoSuccess] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, string>>({});

  // Fetch full profile once on mount
  useEffect(() => {
    getToken().then(token => {
      if (!token) return;
      fetch('/api/recruiters/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setProfileData(data);
            if (data.logo_url) setLogoPreview(data.logo_url);
          }
        }).catch(() => {});
    });
  }, []);
  const [form, setForm] = useState({ title: '', company: '', type: 'Full-Time', workplace: 'Hybrid', experience: 'Fresher / 0-1 yr', location: '', salary: '', skills: '', deadline: '', description: '', qualifications: [] as string[] });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const normalizeStage = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const getStage = (id: string, def: string) => normalizeStage(stages[id] ?? def);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setLogoSuccess(false);
    if (!['image/webp', 'image/png', 'image/jpeg'].includes(file.type)) { setLogoError('Please upload a PNG, JPG or WebP file.'); return; }
    if (file.size > 2 * 1024 * 1024) { setLogoError('File too large — max 2 MB.'); return; }
    setLogoPreview(URL.createObjectURL(file));
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = async () => {
      URL.revokeObjectURL(url);
      setLogoUploading(true);
      try {
        const token = await getToken();
        const form = new FormData();
        form.append('logo', file);
        const res = await fetch('/api/recruiters/logo', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
        if (!res.ok) throw new Error('Upload failed');
        setLogoSuccess(true);
      } catch { setLogoError('Upload failed. Please try again.'); }
      finally { setLogoUploading(false); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); setLogoError('Could not read image.'); };
    img.src = url;
  };

  const setStage = async (id: string, s: string) => {
    setStages(p => ({ ...p, [id]: s })); // optimistic
    try {
      const headers = { 'Content-Type': 'application/json', ...(await authHeader()) };
      await fetch(`/api/recruiters/applicants/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ stage: s }),
      });
    } catch { /* silent — optimistic state already set */ }
  };

  const handleResumeOpen = async (resumeUrl: string, candidateName: string) => {
    if (!resumeUrl) { showToast('No resume uploaded by this candidate.'); return; }
    // Extract storage path from URL (last segment after /resumes/ or the raw value)
    const pathMatch = resumeUrl.match(/\/resumes\/([^?#]+)/);
    const storagePath = pathMatch ? decodeURIComponent(pathMatch[1]) : resumeUrl;
    try {
      const headers = await authHeader();
      const res = await fetch(`/api/recruiters/resume-url?path=${encodeURIComponent(storagePath)}`, { headers });
      if (res.ok) {
        const { url } = await res.json();
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        // Fallback: try opening original URL directly
        window.open(resumeUrl, '_blank', 'noopener,noreferrer');
        showToast(`Opening ${candidateName}'s resume…`);
      }
    } catch {
      window.open(resumeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const openEditJob = (job: any) => {
    setEditingJob(job);
    setEditForm({
      title: job.title || '',
      location: job.location || '',
      salary_text: job.salary_text || '',
      deadline_date: job.deadline_date ? job.deadline_date.slice(0, 10) : '',
      description: job.description || '',
      is_urgent: job.is_urgent ?? false,
    });
  };

  const handleEditSave = async () => {
    if (!editingJob) return;
    setEditSaving(true);
    try {
      const headers = { 'Content-Type': 'application/json', ...(await authHeader()) };
      const res = await fetch(`/api/recruiters/jobs/${editingJob.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        showToast('Job updated.');
        setEditingJob(null);
        fetchJobs();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Failed to update job.');
      }
    } catch { showToast('Network error.'); }
    finally { setEditSaving(false); }
  };

  const handleCloseJob = async (jobId: string, jobTitle: string) => {
    try {
      const headers = { 'Content-Type': 'application/json', ...(await authHeader()) };
      const res = await fetch(`/api/recruiters/jobs/${jobId}/close`, { method: 'POST', headers });
      if (res.ok) {
        showToast(`Job "${jobTitle}" closed.`);
        fetchJobs();
      } else {
        showToast(`❌ Failed to close job.`);
      }
    } catch { showToast('❌ Network error.'); }
  };

  const toggleQual = (q: string) => setForm(p => ({
    ...p,
    qualifications: p.qualifications.includes(q) ? p.qualifications.filter(x => x !== q) : [...p.qualifications, q],
  }));

  const handlePublish = async (isDraft: boolean) => {
    if (!form.title.trim()) { showToast('⚠️ Job title is required.'); return; }
    const payload = {
      title: form.title,
      company: form.company || companyName,
      salary_text: form.salary || '—',
      location: form.location || '',
      city: form.location?.split(',')[0]?.trim() || '',
      workplace_type: form.workplace.toLowerCase(),
      job_type: ({ 'Full-Time': 'full-time', 'Articleship / Industrial Training': 'articleship', 'Internship': 'internship', 'Contract': 'full-time' } as Record<string,string>)[form.type] ?? 'full-time',
      experience_level: form.experience,
      min_experience_years: form.experience.startsWith('1') ? 1 : form.experience.startsWith('3') ? 3 : form.experience.startsWith('5') ? 5 : 0,
      qualifications: form.qualifications,
      mandatory_skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      description: form.description,
      deadline_date: form.deadline || undefined,
      crm_drive_code: isDraft ? 'draft' : undefined,
    };
    try {
      const res = await fetch('/api/recruiters/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); showToast(`❌ ${err.detail || 'Failed to publish job.'}`); return; }
      showToast(isDraft ? '📋 Draft saved!' : '✅ Job published to ArivuPro Portal!');
      setForm({ title: '', company: '', type: 'Full-Time', workplace: 'Hybrid', experience: 'Fresher / 0-1 yr', location: '', salary: '', skills: '', deadline: '', description: '', qualifications: [] });
      fetchJobs();
      if (!isDraft) setPage('jobs');
    } catch { showToast('❌ Network error. Please try again.'); }
  };

  // Normalize DB snake_case to display fields
  const normalizeApplicant = (a: any) => ({
    id: a.id,
    jobId: a.job_id,
    name: a.student_name || '—',
    email: a.student_email || '—',
    phone: a.student_phone || '—',
    course: a.primary_course || '—',
    match: a.ai_match_score ?? 0,
    stage: a.stage || 'applied',
    applied: a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : '—',
    about: a.about_bio || a.cover_note || '',
    skills: Array.isArray(a.key_skills) ? a.key_skills : [],
    resumeUrl: a.resume_url || a.resume_file_name || '',
    qualifications: Array.isArray(a.qualifications_completed) ? a.qualifications_completed : [],
    expectedSalary: a.expected_salary || '',
    articleshipMonths: a.articleship_months || 0,
  });
  const normalizedApplicants = applicants.map(normalizeApplicant);
  // Which applicants to show (filtered by job)
  const jobApplicants = viewingJobId ? normalizedApplicants.filter((a: any) => a.jobId === viewingJobId) : normalizedApplicants;
  const viewingJob = jobs.find((j: any) => j.id === viewingJobId);

  // Sidebar nav items
  const NAV = [
    { id: 'dashboard' as RecruiterPage, icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { id: 'jobs'      as RecruiterPage, icon: <Briefcase size={16} />,       label: 'My Job Posts' },
    { id: 'applicants'as RecruiterPage, icon: <Users size={16} />,           label: 'Applicants' },
    { id: 'post'      as RecruiterPage, icon: <PlusCircle size={16} />,      label: 'Post a Job' },
    { id: 'profile'   as RecruiterPage, icon: <User size={16} />,            label: 'My Profile' },
  ];

  const navTo = (p: RecruiterPage) => {
    setPage(p);
    setViewingJobId(null);
    setViewingApplicant(null);
    if (p === 'applicants') fetchApplicants();
    setSidebarOpen(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 112px)', background: '#f7f7f7' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f2419', color: '#fff', borderRadius: 12, padding: '14px 20px', fontSize: 13, fontWeight: 600, boxShadow: '0 8px 32px rgba(15,36,25,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={15} color="#fede6d" />{toast}
        </div>
      )}

      {/* Mobile hamburger button */}
      <button
        className="rec-hamburger"
        onClick={() => setSidebarOpen(o => !o)}
        style={{ display: 'none', position: 'fixed', top: 70, left: 12, zIndex: 400, width: 38, height: 38, borderRadius: 8, background: '#1a7a4a', border: 'none', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(26,122,74,0.35)' }}
        aria-label="Toggle menu"
      >
        <span style={{ color: '#fff', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {sidebarOpen ? '✕' : '☰'}
        </span>
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="rec-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199 }}
        />
      )}

      {/* ── EDIT JOB MODAL ───────────────────────────────────────── */}
      {editingJob && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,36,25,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setEditingJob(null); }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(15,36,25,0.2)', fontFamily: 'Manrope, sans-serif', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f2419', margin: 0 }}>Edit Job</h2>
              <button onClick={() => setEditingJob(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af', lineHeight: 1 }}>✕</button>
            </div>

            {[
              { label: 'Job Title', key: 'title', type: 'text' },
              { label: 'Location', key: 'location', type: 'text' },
              { label: 'Salary / Stipend', key: 'salary_text', type: 'text' },
              { label: 'Application Deadline', key: 'deadline_date', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={(editForm as any)[f.key]}
                  onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'Manrope, sans-serif', boxSizing: 'border-box', outline: 'none', color: '#0f2419' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1a7a4a'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Description</label>
              <textarea
                value={editForm.description}
                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                rows={4}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'Manrope, sans-serif', boxSizing: 'border-box', outline: 'none', resize: 'vertical', color: '#0f2419' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1a7a4a'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={editForm.is_urgent}
                onChange={e => setEditForm(p => ({ ...p, is_urgent: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: '#1a7a4a' }}
              />
              Mark as Urgent
            </label>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingJob(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'Manrope, sans-serif', color: '#6b7280' }}>
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editForm.title.trim()}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: editSaving || !editForm.title.trim() ? '#d7f4ea' : '#1a7a4a', color: editSaving || !editForm.title.trim() ? '#6b9e82' : '#fff', cursor: editSaving || !editForm.title.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'Manrope, sans-serif' }}
              >
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside className={`ap-fade-left ap-d0 rec-sidebar${sidebarOpen ? ' rec-sidebar-open' : ''}`} style={{ width: 220, background: '#fff', borderRight: '1px solid #e5e7eb', flexShrink: 0, padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Company chip */}
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #f3f4f6', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1a7a4a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
              {(companyName || '??').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f2419', lineHeight: 1.2 }}>{companyName}</div>
              <span className="badge badge-green" style={{ fontSize: '0.55rem', marginTop: 2 }}>Verified</span>
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
              onClick={() => navTo(n.id)}
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
      <main className="rec-main" style={{ flex: 1, padding: '32px 32px', overflowY: 'auto', minWidth: 0, position: 'relative' }}>
        <AmbientCanvas density="low" style={{ opacity: 0.4 }} />

        {/* DASHBOARD */}
        {page === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="ap-fade-left ap-d0">
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>Recruiter Dashboard</h1>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>{companyName} — Campus Recruitment</p>
            </div>

            {/* Stat cards — FIX 1: rd-stats-grid collapses to 2-col on mobile */}
            <div className="rd-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                { label: 'Active Job Posts',   value: jobs.filter((j: any) => j.status === 'Active').length, sub: 'Currently active', color: '#b45309', border: '#fde68a', delay: 'ap-d1' },
                { label: 'Total Applicants',   value: normalizedApplicants.length, sub: 'All time',          color: '#1a7a4a', border: '#d7f4ea', delay: 'ap-d2' },
                { label: 'In Interview Stage', value: 0, sub: 'Scheduled this week',               color: '#1d4ed8', border: '#dbeafe', delay: 'ap-d3' },
                { label: 'Offers Extended',    value: 0, sub: 'Awaiting acceptance',               color: '#7c3aed', border: '#ede9fe', delay: 'ap-d4' },
              ].map(s => (
                <div key={s.label} className={`ap-card ap-scale-in ${s.delay}`} style={{ background: '#fff', border: `1px solid ${s.border}`, borderLeft: `4px solid ${s.color}`, borderRadius: 12, padding: '20px 20px 16px' }}>
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
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setPage('applicants')}>View all</button>
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
                  {normalizedApplicants.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No applicants yet. Post a job to start receiving applications.</td></tr>
                  )}
                  {normalizedApplicants.slice(0, 3).map((ap: any, i: number) => {
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
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: stageColor(getStage(ap.id, ap.stage)) + '18', color: stageColor(getStage(ap.id, ap.stage)) }}>
                            {getStage(ap.id, ap.stage)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 12 }}>{ap.applied}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => { setViewingApplicant(ap); setPage('applicants'); }}>
                              <Eye size={11} /> View
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

        {/* MY JOB POSTS */}
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
                  {jobs.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No job posts yet. <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setPage('post')}>Post your first job</button></td></tr>
                  )}
                  {jobs.map((job: any, i: number) => (
                    <tr key={job.id} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 700, color: '#0f2419' }}>{job.title}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{job.job_type}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className={job.status === 'active' ? 'badge badge-green' : 'badge badge-gray'}>{job.status}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: (job.applicants_count ?? 0) > 0 ? '#1a7a4a' : '#9ca3af', fontSize: 15 }}>{job.applicants_count ?? 0}</td>
                      <td style={{ padding: '14px 20px', color: '#6b7280' }}>{job.posted_date ? new Date(job.posted_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ padding: '14px 20px', color: '#6b7280' }}>{job.deadline_date ? new Date(job.deadline_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn-primary"
                            style={{ fontSize: 12, padding: '6px 14px' }}
                            onClick={() => { setViewingJobId(job.id); fetchApplicants(job.id); }}
                          >
                            View Apps {(job.applicants_count ?? 0) > 0 && `(${job.applicants_count})`}
                          </button>
                          {job.status !== 'closed' && (
                            <>
                              <button
                                style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: '1px solid #d7f4ea', background: 'transparent', color: '#1a7a4a', fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
                                onClick={() => openEditJob(job)}
                              >
                                Edit
                              </button>
                              <button
                                style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: '1px solid #fca5a5', background: 'transparent', color: '#dc2626', fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
                                onClick={() => handleCloseJob(job.id, job.title)}
                              >
                                Close
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW APPLICANTS FOR A JOB */}
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
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: stageColor(currentStage) + '18', color: stageColor(currentStage) }}>
                              {currentStage}
                            </span>
                            <div style={{ position: 'relative' }}>
                              <select
                                value={currentStage}
                                onChange={e => { setStage(ap.id, e.target.value); showToast(`${ap.name} → ${e.target.value}`); void 0; }}
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
                              onClick={() => handleResumeOpen(ap.resumeUrl, ap.name)}
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

        {/* APPLICANT DETAIL / PROFILE */}
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
                  {viewingApplicant.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
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
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 6, background: stageColor(getStage(viewingApplicant.id, viewingApplicant.stage)) + '18', color: stageColor(getStage(viewingApplicant.id, viewingApplicant.stage)) }}>
                    {getStage(viewingApplicant.id, viewingApplicant.stage)}
                  </span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {viewingApplicant.resumeUrl ? (
                      <a
                        href={viewingApplicant.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="btn-outline"
                        style={{ fontSize: 12, padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                      >
                        <Download size={13} /> Download Resume
                      </a>
                    ) : (
                      <button className="btn-outline" style={{ fontSize: 12, padding: '7px 16px', opacity: 0.5, cursor: 'not-allowed' }} disabled>
                        <Download size={13} /> No Resume
                      </button>
                    )}
                    <button
                      style={{ fontSize: 12, padding: '7px 16px', borderRadius: 8, border: '1.5px solid #16a34a', background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', fontWeight: 700, fontFamily: 'Manrope, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => { setStage(viewingApplicant.id, 'Offer Released'); showToast(`${viewingApplicant.name} accepted — they'll be notified to expect a call!`); }}
                    >
                      ✓ Accept
                    </button>
                    <button
                      style={{ fontSize: 12, padding: '7px 16px', borderRadius: 8, border: '1.5px solid #dc2626', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontFamily: 'Manrope, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => { setStage(viewingApplicant.id, 'Declined'); showToast(`${viewingApplicant.name} marked as not shortlisted.`); }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-col: about + skills | stage update — FIX 2: rd-applicant-grid stacks on mobile */}
            <div className="rd-applicant-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* About */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', marginBottom: 10 }}>About</div>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>{viewingApplicant.about}</p>
                </div>

                {/* Skills */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', marginBottom: 12 }}>Key Skills</div>
                  {viewingApplicant.skills.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {viewingApplicant.skills.map((s: string) => (
                        <span key={s} style={{ padding: '5px 14px', borderRadius: 6, background: '#f0faf4', border: '1px solid #d7f4ea', fontSize: 12, fontWeight: 700, color: '#1a7a4a' }}>{s}</span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No skills listed</p>
                  )}
                </div>

                {/* Qualifications + Salary */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', marginBottom: 12 }}>Academic & Compensation</div>
                  <div className="rd-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>Qualifications</div>
                      {viewingApplicant.qualifications.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {viewingApplicant.qualifications.map((q: string) => (
                            <span key={q} style={{ padding: '3px 10px', borderRadius: 6, background: '#f3e5f5', border: '1px solid #e1bee7', fontSize: 11, fontWeight: 700, color: '#6a1b9a' }}>{q.replace(/_/g, ' ')}</span>
                          ))}
                        </div>
                      ) : <span style={{ fontSize: 13, color: '#9ca3af' }}>—</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>Expected Salary</div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f2419' }}>{viewingApplicant.expectedSalary || '—'}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>Articleship Months</div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f2419' }}>{viewingApplicant.articleshipMonths || '—'}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>Course</div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f2419' }}>{viewingApplicant.course || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Resume placeholder */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={16} color="#1a7a4a" /> Resume
                  </div>
                  {viewingApplicant.resumeUrl ? (
                    <div style={{ background: '#f0faf4', border: '1.5px solid #d7f4ea', borderRadius: 10, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={28} color="#1a7a4a" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2419' }}>
                            {viewingApplicant.resumeUrl.startsWith('http') ? viewingApplicant.resumeUrl.split('/').pop() : viewingApplicant.resumeUrl}
                          </div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>Resume on file</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleResumeOpen(viewingApplicant.resumeUrl, viewingApplicant.name)}
                        className="btn-primary"
                        style={{ fontSize: 12, padding: '8px 20px' }}
                      >
                        <Download size={13} /> View / Download
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: 10, padding: '28px', textAlign: 'center' }}>
                      <FileText size={32} color="#d1d5db" style={{ marginBottom: 8 }} />
                      <div style={{ fontSize: 13, color: '#9ca3af' }}>No resume uploaded by candidate</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: stage updater + AI score */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* AI Match breakdown */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', marginBottom: 16 }}>
                    Match Score
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
                      <div style={{ height: 6, background: '#f0faf4', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${bar.pct}%`, height: '100%', background: '#1a7a4a', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stage updater */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', marginBottom: 4 }}>Update Stage</div>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>Move the candidate through the hiring pipeline.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {STAGES.map(s => {
                      const current = getStage(viewingApplicant.id, viewingApplicant.stage);
                      const isActive = current === s;
                      const locked = s === 'Applied';
                      return (
                        <button
                          key={s}
                          onClick={() => { if (!locked) { setStage(viewingApplicant.id, s); showToast(`${viewingApplicant.name} → ${s}`); } }}
                          disabled={locked}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '8px 12px', borderRadius: 8, border: `1px solid ${isActive ? stageColor(s) : '#e5e7eb'}`,
                            background: isActive ? stageColor(s) + '12' : locked ? '#f9fafb' : '#fff',
                            cursor: locked ? 'not-allowed' : 'pointer', textAlign: 'left', fontFamily: 'Manrope, sans-serif',
                            fontSize: 12, fontWeight: isActive ? 800 : 600,
                            color: isActive ? stageColor(s) : locked ? '#d1d5db' : '#6b7280',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? stageColor(s) : '#d1d5db', flexShrink: 0 }} />
                          {s}
                          {locked && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#d1d5db' }}>ArivuPro</span>}
                          {isActive && !locked && <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓ Current</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ALL APPLICANTS */}
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
                    {['Candidate', 'Mobile', 'Course', 'AI Match', 'Stage', 'Applied For', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {normalizedApplicants.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No applicants yet.</td></tr>
                  )}
                  {normalizedApplicants.map((ap: any, i: number) => {
                    const mb = matchBadge(ap.match);
                    const jobTitle = jobs.find((j: any) => j.id === ap.jobId)?.title ?? '—';
                    return (
                      <tr key={ap.id} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 700, color: '#0f2419' }}>{ap.name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{ap.email}</div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {ap.phone && ap.phone !== '—' ? (
                            <a href={`tel:${ap.phone}`} style={{ fontSize: 12, fontWeight: 600, color: '#1a7a4a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Phone size={11} />{ap.phone}
                            </a>
                          ) : <span style={{ fontSize: 12, color: '#d1d5db' }}>—</span>}
                        </td>
                        <td style={{ padding: '14px 20px', fontWeight: 600, color: '#374151' }}>{ap.course}</td>
                        <td style={{ padding: '14px 20px' }}><span className={mb.cls}>{ap.match}% {mb.label}</span></td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: stageColor(getStage(ap.id, ap.stage)) + '18', color: stageColor(getStage(ap.id, ap.stage)) }}>
                            {getStage(ap.id, ap.stage)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: '#6b7280', maxWidth: 160 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{jobTitle}</div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button className="btn-primary" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => { setViewingApplicant(ap); if (getStage(ap.id, ap.stage) === 'Applied') { setStage(ap.id, 'Recruiter Screen'); } }}>
                              <Eye size={11} /> View
                            </button>
                            <button className="btn-outline" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => handleResumeOpen(ap.resumeUrl, ap.name)}>
                              <Download size={11} /> Resume
                            </button>
                            <button style={{ fontSize: 11, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #16a34a', background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
                              onClick={() => { setStage(ap.id, 'Offer Released'); showToast(`${ap.name} accepted — they'll be notified to expect a call!`); }}>
                              ✓ Accept
                            </button>
                            <button style={{ fontSize: 11, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #dc2626', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
                              onClick={() => { setStage(ap.id, 'Declined'); showToast(`${ap.name} rejected.`); }}>
                              ✗ Reject
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

        {/* POST A JOB */}
        {page === 'post' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>Post a New Job</h1>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Fill in the details and publish to ArivuPro Portal</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* FIX 3: rd-form-row collapses to 1-col on mobile */}
              <div className="rd-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Job Title *</label>
                  <input className="input-field" placeholder="e.g. Audit Associate" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Company Name</label>
                  <input className="input-field" value={form.company || companyName} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Company name" />
                </div>
              </div>
              <div className="rd-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
              <div className="rd-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Experience Required</label>
                  <select className="input-field" value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}>
                    <option>Fresher / 0-1 yr</option>
                    <option>1-3 yrs</option>
                    <option>3-5 yrs</option>
                    <option>5+ yrs</option>
                    <option>Articleship / Training</option>
                  </select>
                </div>
              </div>
              <div className="rd-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                      <button key={q} type="button" onClick={() => toggleQual(q)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, border: sel ? '2px solid #1a7a4a' : '1.5px solid #e5e7eb', background: sel ? '#f0faf4' : '#fff', color: sel ? '#1a7a4a' : '#6b7280', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', transition: 'all 0.15s' }}>
                        {q}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rd-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Key Skills (comma-separated)</label>
                  <input className="input-field" placeholder="e.g. Ind AS, Excel, SAP" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Application Deadline</label>
                  <input className="input-field" type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Job Description</label>
                <div style={{ border: '1px solid #d1d5db', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                  {/* Toolbar */}
                  <div style={{ display: 'flex', gap: 2, padding: '6px 8px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', flexWrap: 'wrap' }}>
                    {[
                      { cmd: 'bold', label: <strong>B</strong>, title: 'Bold' },
                      { cmd: 'italic', label: <em>I</em>, title: 'Italic' },
                      { cmd: 'underline', label: <u>U</u>, title: 'Underline' },
                    ].map(({ cmd, label, title }) => (
                      <button key={cmd} type="button" title={title} onMouseDown={e => { e.preventDefault(); document.execCommand(cmd, false); }}
                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'Manrope, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {label}
                      </button>
                    ))}
                    <div style={{ width: 1, background: '#e5e7eb', margin: '2px 4px' }} />
                    {[
                      { cmd: 'insertUnorderedList', label: '• List', title: 'Bullet List' },
                      { cmd: 'insertOrderedList', label: '1. List', title: 'Numbered List' },
                    ].map(({ cmd, label, title }) => (
                      <button key={cmd} type="button" title={title} onMouseDown={e => { e.preventDefault(); document.execCommand(cmd, false); }}
                        style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}>
                        {label}
                      </button>
                    ))}
                    <div style={{ width: 1, background: '#e5e7eb', margin: '2px 4px' }} />
                    <select title="Heading" onMouseDown={e => e.stopPropagation()} onChange={e => { document.execCommand('formatBlock', false, e.target.value); e.target.value = 'p'; }}
                      style={{ height: 28, padding: '0 6px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: 'Manrope, sans-serif' }}>
                      <option value="p">Paragraph</option>
                      <option value="h3">Heading</option>
                      <option value="h4">Sub-heading</option>
                    </select>
                    <div style={{ width: 1, background: '#e5e7eb', margin: '2px 4px' }} />
                    <button type="button" title="Clear formatting" onMouseDown={e => { e.preventDefault(); document.execCommand('removeFormat', false); }}
                      style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: 'Manrope, sans-serif', color: '#6b7280' }}>
                      Clear
                    </button>
                  </div>
                  {/* Editable area */}
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onInput={e => setForm(p => ({ ...p, description: (e.target as HTMLDivElement).innerHTML }))}
                    dangerouslySetInnerHTML={{ __html: form.description }}
                    style={{ minHeight: 160, padding: '12px 14px', fontSize: 13, lineHeight: 1.7, color: '#374151', outline: 'none', fontFamily: 'Manrope, sans-serif' }}
                    data-placeholder="Describe the role, responsibilities, and requirements..."
                  />
                </div>
                <style>{`[contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }`}</style>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-primary" style={{ fontSize: 14, padding: '11px 28px' }} onClick={() => handlePublish(false)}>Publish Job</button>
                <button className="btn-outline" style={{ fontSize: 14, padding: '11px 24px' }} onClick={() => handlePublish(true)}>Save Draft</button>
                <button className="btn-ghost" style={{ fontSize: 13, marginLeft: 'auto' }} onClick={() => setForm({ title: '', company: '', type: 'Full-Time', workplace: 'Hybrid', experience: 'Fresher / 0-1 yr', location: '', salary: '', skills: '', deadline: '', description: '', qualifications: [] as string[] })}>Clear</button>
              </div>
            </div>
          </div>
        )}

        {/* MY PROFILE */}
        {page === 'profile' && (
          <RecruiterProfilePage
            profileData={profileData}
            companyName={companyName}
            recruiterName={recruiterName}
            recruiterEmail={recruiterEmail}
            logoPreview={logoPreview}
            logoUploading={logoUploading}
            logoError={logoError}
            logoSuccess={logoSuccess}
            handleLogoChange={handleLogoChange}
            getToken={getToken}
            onSaved={(updated) => { setProfileData(p => ({ ...p, ...updated })); showToast('Profile saved!'); }}
          />
        )}

      </main>

      <style>{`
        @media (max-width: 768px) {
          .rec-hamburger { display: flex !important; }
          .rec-overlay { display: block !important; }
          .rec-main { padding: 24px 16px 24px 16px !important; }
          .rec-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            height: 100vh !important;
            z-index: 300 !important;
            transform: translateX(-100%) !important;
            transition: transform 0.25s ease !important;
            box-shadow: none !important;
          }
          .rec-sidebar.rec-sidebar-open {
            transform: translateX(0) !important;
            box-shadow: 4px 0 24px rgba(15,36,25,0.15) !important;
          }
          .rd-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .rd-applicant-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .rd-form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
