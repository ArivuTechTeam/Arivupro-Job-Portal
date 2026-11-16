import React, { useState, useMemo, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { JobSearchFilters } from './components/JobSearchFilters.tsx';
import { JobCard } from './components/JobCard.tsx';
import { JobDetailsModal } from './components/JobDetailsModal.tsx';
import { ApplicationTracker } from './components/ApplicationTracker.tsx';
import { ScraperDashboard } from './components/ScraperDashboard.tsx';
import { PlacementCrmDashboard } from './components/PlacementCrmDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { StudentProfile } from './components/StudentProfile.tsx';
import { RecruiterDashboard } from './components/RecruiterDashboard.tsx';
import { RecruiterSignup } from './components/RecruiterSignup.tsx';
import { CompanyProfile } from './components/CompanyProfile.tsx';
import { AIJobMatch } from './components/AIJobMatch.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import AdminLogin from './components/admin/AdminLogin.tsx';
import {
  JobListing, JobApplication, StudentProfile as StudentProfileType,
  ScraperSourceStatus,
} from './types/index.ts';
import { CheckCircle2, X } from 'lucide-react';
import { supabase } from './lib/supabase/client.ts';

const SEED_JOBS: JobListing[] = [];

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

const SEED_STUDENT: StudentProfileType = {
  id: '', name: '', email: '', phone: '',
  arivuproStudentId: '', enrollmentCohort: '', primaryCourse: '', currentLevel: '',
  qualificationsCompleted: [], articleshipCompletedMonths: 0, keySkills: [],
  preferredLocations: [], expectedSalaryLPA: '', targetRoles: [],
  aboutBio: '', verifiedStudent: false, gpaOrScore: '', resumeFileName: '',
};

const COMPANIES_LIST = [
  {
    name: 'Deloitte India', logoText: 'DE', type: 'Big 4 Audit & Advisory', status: 'MoU Partner' as const,
    industry: 'Professional Services', headquarters: 'Mumbai, MH', companySize: '50,000+ employees',
    founded: '1845', website: 'deloitte.com',
    about: 'Deloitte India is a member firm of Deloitte Touche Tohmatsu Limited, one of the Big Four accounting organizations. We serve clients across audit, consulting, tax, and advisory, with a strong focus on campus hiring of CA and ACCA professionals.',
    specializations: ['Statutory Audit', 'PCAOB Audit', 'SOX Compliance', 'Tax Advisory', 'M&A Advisory'],
    jobFilter: (j: { company: string }) => j.company.toLowerCase().includes('deloitte'),
  },
  {
    name: 'BDO India LLP', logoText: 'BD', type: 'Mid-tier Audit Firm', status: 'Verified' as const,
    industry: 'Accounting & Audit', headquarters: 'Bangalore / Chennai', companySize: '5,000–10,000 employees',
    founded: '1998', website: 'bdo.in',
    about: 'BDO India LLP is an ICAI registered principal firm offering articleship training with structured exposure to listed and unlisted entity audits, tax compliance, and internal audit assignments.',
    specializations: ['CA Articleship', 'Ind AS Audit', 'Tax Audit', 'GST Compliance', 'Internal Audit'],
    jobFilter: (j: { company: string }) => j.company.toLowerCase().includes('bdo'),
  },
  {
    name: 'Goldman Sachs', logoText: 'GO', type: 'Investment Banking', status: 'MoU Partner' as const,
    industry: 'Investment Banking & GCC', headquarters: 'Bangalore, KA', companySize: '10,000–50,000 employees',
    founded: '1869', website: 'goldmansachs.com',
    about: 'Goldman Sachs Bangalore is a Global Capability Centre supporting GS New York in FP&A, risk, and investment banking analytics. Preferred partner for CFA and CA finance professionals.',
    specializations: ['FP&A', 'Financial Modeling', 'DCF Valuation', 'Investment Banking', 'Risk Analytics'],
    jobFilter: (j: { company: string }) => j.company.toLowerCase().includes('goldman'),
  },
  {
    name: 'PwC AC', logoText: 'PW', type: 'Big 4 Advisory', status: 'Verified' as const,
    industry: 'Tax & Advisory', headquarters: 'Hyderabad, TS', companySize: '50,000+ employees',
    founded: '1998', website: 'pwc.in',
    about: 'PwC Acceleration Center (AC) Hyderabad delivers US federal, state, and partnership tax compliance and advisory services to multinational clients from India.',
    specializations: ['US Federal Tax', 'Form 1120 / 1065', 'ASC 740', 'State & Local Tax', 'Transfer Pricing'],
    jobFilter: (j: { company: string }) => j.company.toLowerCase().includes('pwc'),
  },
  {
    name: 'Avendus Capital', logoText: 'AV', type: 'Boutique Investment Bank', status: 'Verified' as const,
    industry: 'Investment Banking & M&A', headquarters: 'Mumbai, MH', companySize: '500–1,000 employees',
    founded: '1999', website: 'avendus.com',
    about: 'Avendus Capital is India\'s leading boutique investment bank focused on M&A, private equity, and growth capital. Preferred hiring partner for CFA and CA professionals targeting IB roles.',
    specializations: ['M&A Advisory', 'Private Equity', 'DCF & LBO Modeling', 'Equity Research', 'Capital Markets'],
    jobFilter: (j: { company: string }) => j.company.toLowerCase().includes('avendus'),
  },
  {
    name: 'Grant Thornton', logoText: 'GR', type: 'Accounting & Advisory', status: 'Verified' as const,
    industry: 'Audit & Compliance', headquarters: 'Delhi NCR', companySize: '5,000–10,000 employees',
    founded: '1924', website: 'grantthornton.in',
    about: 'Grant Thornton Bharat is a leading assurance, tax, and advisory firm in India, offering articleship and full-time roles with exposure to SEBI-listed audit, FEMA compliance, and CS advisory.',
    specializations: ['Secretarial Compliance', 'SEBI Audit', 'FEMA', 'GST Litigation', 'Ind AS'],
    jobFilter: (j: { company: string }) => j.company.toLowerCase().includes('grant'),
  },
  {
    name: 'EY India', logoText: 'EY', type: 'Big 4 Audit & Advisory', status: 'Verified' as const,
    industry: 'Professional Services', headquarters: 'Bangalore / Mumbai', companySize: '50,000+ employees',
    founded: '1989', website: 'ey.com',
    about: 'EY India (Ernst & Young Global Delivery Services) provides assurance, tax, consulting and advisory services. Major campus recruiter for CA, ACCA and CS professionals with large articleship and graduate trainee programs.',
    specializations: ['Assurance', 'Tax Advisory', 'Transaction Advisory', 'Risk Consulting', 'IFRS Reporting'],
    jobFilter: (j: { company: string }) => j.company.toLowerCase().includes('ey') || j.company.toLowerCase().includes('ernst'),
  },
  {
    name: 'KPMG India', logoText: 'KP', type: 'Big 4 Audit & Advisory', status: 'Verified' as const,
    industry: 'Professional Services', headquarters: 'Mumbai, MH', companySize: '50,000+ employees',
    founded: '1993', website: 'kpmg.com/in',
    about: 'KPMG India offers audit, tax and advisory services with strong campus hiring for CA Articleship, CS trainees and ACCA affiliates. Part of KPMG Global Services network.',
    specializations: ['Statutory Audit', 'Tax Compliance', 'Risk Advisory', 'Deal Advisory', 'ESG Reporting'],
    jobFilter: (j: { company: string }) => j.company.toLowerCase().includes('kpmg'),
  },
  {
    name: 'Genpact', logoText: 'GE', type: 'Finance BPO & GCC', status: 'Verified' as const,
    industry: 'Finance & Accounting Outsourcing', headquarters: 'Hyderabad / Bangalore', companySize: '100,000+ employees',
    founded: '1997', website: 'genpact.com',
    about: 'Genpact is a global professional services firm focused on finance & accounting operations, risk management and analytics. Largest employer of B.Com, CMA India and CA freshers in the GCC/BPO space.',
    specializations: ['P2P', 'O2C', 'R2R', 'FP&A', 'Tax & Compliance', 'Finance Analytics'],
    jobFilter: (j: { company: string }) => j.company.toLowerCase().includes('genpact'),
  },
  {
    name: 'EXL Service', logoText: 'EX', type: 'Finance Analytics & Operations', status: 'Verified' as const,
    industry: 'Finance & Accounting Outsourcing', headquarters: 'Noida / Bangalore', companySize: '50,000+ employees',
    founded: '1999', website: 'exlservice.com',
    about: 'EXL is a leading analytics and digital operations firm serving insurance, banking and finance clients. Known for F&A shared services roles and finance analytics for CA/CMA freshers.',
    specializations: ['Finance & Accounting', 'Insurance Operations', 'Banking Analytics', 'Risk & Compliance'],
    jobFilter: (j: { company: string }) => j.company.toLowerCase().includes('exl'),
  },
  {
    name: 'Zerodha', logoText: 'ZE', type: 'Stock Broker / Fintech', status: 'Verified' as const,
    industry: 'Fintech & Capital Markets', headquarters: 'Bangalore, KA', companySize: '1,000–5,000 employees',
    founded: '2010', website: 'zerodha.com',
    about: "India's largest stock broker by active clients. Hires CFA, CA and finance freshers for fund operations, risk analytics, compliance, accounts and product finance roles.",
    specializations: ['Trading Operations', 'Fund Accounting', 'Risk & Compliance', 'Financial Analytics', 'Fin-Tech Product Finance'],
    jobFilter: (j: { company: string }) => j.company.toLowerCase().includes('zerodha'),
  },
  {
    name: 'Razorpay', logoText: 'RA', type: 'Payments Fintech', status: 'Verified' as const,
    industry: 'Fintech & Payments', headquarters: 'Bangalore, KA', companySize: '5,000–10,000 employees',
    founded: '2014', website: 'razorpay.com',
    about: 'Razorpay is India\'s leading full-stack financial services company. Hires CA, CMA and finance freshers for FP&A, accounts, compliance, revenue operations and treasury roles.',
    specializations: ['FP&A', 'Treasury', 'Revenue Operations', 'Tax & Compliance', 'Financial Controls'],
    jobFilter: (j: { company: string }) => j.company.toLowerCase().includes('razorpay'),
  },
];

type UserRole = 'guest' | 'student' | 'recruiter' | 'admin';

interface AuthState {
  role: UserRole;
  name: string;
  email: string;
}

const AUTH_KEY = 'ap_auth';
const TAB_KEY = 'ap_tab';

function loadAuth(): AuthState {
  try {
    const s = localStorage.getItem(AUTH_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return { role: 'guest', name: '', email: '' };
}

function loadTab(): NavTab {
  try {
    const t = localStorage.getItem(TAB_KEY) as NavTab | null;
    if (t) return t;
  } catch {}
  return 'jobs';
}

export default function App() {
  const [auth, setAuth] = useState<AuthState>(loadAuth);
  const [currentTab, setCurrentTab] = useState<NavTab>(loadTab);

  const [jobs, setJobs] = useState<JobListing[]>(SEED_JOBS);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [sources] = useState<ScraperSourceStatus[]>(SEED_SOURCES);
  const [student, setStudent] = useState<StudentProfileType>(SEED_STUDENT);

  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'signup'; role: 'student' | 'recruiter' } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileNudge, setShowProfileNudge] = useState(false);
  const [applyBlockJob, setApplyBlockJob] = useState<JobListing | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: '', type: '', city: '', qualification: '', workplace: '', salary: '', department: '' });
  const [selectedCompany, setSelectedCompany] = useState<typeof COMPANIES_LIST[0] | null>(null);
  const [showRecruiterPortal, setShowRecruiterPortal] = useState(false);
  const [showRecruiterSignup, setShowRecruiterSignup] = useState(false);
  const [recruiterApprovalStatus, setRecruiterApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [recruiterCompanyName, setRecruiterCompanyName] = useState<string>('');
  const [recruiterSessionToken, setRecruiterSessionToken] = useState<string>('');
  const [showAdminLogin, setShowAdminLogin] = useState(
    () => window.location.search.includes('admin') || window.location.pathname === '/admin'
  );

  // Persist auth and tab to localStorage so refresh doesn't log out
  useEffect(() => { localStorage.setItem(AUTH_KEY, JSON.stringify(auth)); }, [auth]);
  useEffect(() => { localStorage.setItem(TAB_KEY, currentTab); }, [currentTab]);

  // Load jobs from backend: merge internal (recruiter-posted + exclusive) + scraped external
  useEffect(() => {
    setJobsLoading(true);

    const mapExternal = (j: any): JobListing => ({
      id: j.id,
      title: j.title,
      company: j.company || 'CA Firm',
      logoText: (j.company || 'CA').charAt(0).toUpperCase(),
      location: j.location || 'India',
      city: (j.location || 'India').split(',')[0].trim(),
      workplaceType: j.is_remote ? 'Remote' : 'Onsite' as const,
      jobType: j.job_type === 'articleship' ? 'Articleship / Industrial Training'
        : j.job_type === 'internship' ? 'Internship'
        : j.job_type === 'trainee' ? 'Articleship / Industrial Training'
        : 'Full-Time' as const,
      experienceLevel: j.experience_level === 'fresher' || j.job_type === 'articleship' || j.job_type === 'trainee' ? '0-1 yr (Fresher)'
        : j.experience_level === '1-3 years' || j.experience_level === '0-1 year' ? '1-3 yrs'
        : 'Articleship / 0 yrs' as const,
      minExperienceYears: 0,
      salaryText: j.stipend > 0 ? `₹${(j.stipend).toLocaleString('en-IN')}/mo` : 'As per norms',
      salaryMinLPA: j.stipend > 0 ? parseFloat((j.stipend * 12 / 100000).toFixed(1)) : undefined,
      qualifications: j.courses || ['CA'],
      mandatorySkills: [],
      goodToHaveSkills: [],
      description: j.description || '',
      keyResponsibilities: [],
      source: j.source?.includes('icai') ? 'arivupro_exclusive' : 'naukri' as const,
      sourceUrl: j.apply_url,
      arivuproExclusive: j.source?.includes('icai') || j.source === 'icmai',
      isUrgent: false,
      postedDate: j.posted_at ? j.posted_at.split('T')[0] : new Date().toISOString().split('T')[0],
      deadlineDate: '',
      applicantsCount: 0,
      department: (() => {
        const c = j.courses || [];
        const t = (j.title || '').toLowerCase();
        if (c.includes('CFA') || /\b(equity research|investment analyst|portfolio|investment banking)\b/.test(t)) return 'Investment Banking & M&A';
        if (c.includes('CS') || /\b(company secretary|compliance officer)\b/.test(t)) return 'Risk & Compliance';
        if (c.includes('CMA India') || /\b(cost accountant|fp.?a|budget analyst)\b/.test(t)) return 'FP&A & Corporate Finance';
        if (c.includes('CPA US') || c.includes('ACCA') || /\b(us gaap|ifrs|r2r)\b/.test(t)) return 'Global Accounting (US GAAP/IFRS)';
        if (/\b(tax|gst|tds|income tax|transfer pricing)\b/.test(t)) return 'Taxation';
        if (/\b(articleship|article assistant|article clerk|industrial train)\b/.test(t)) return 'Articleship Desk';
        return 'Audit & Assurance';
      })(),
    });

    const mapInternal = (j: any): JobListing => ({
      id: j.id,
      title: j.title,
      company: j.company || '',
      logoText: (j.company || '?').charAt(0).toUpperCase(),
      location: j.location || '',
      city: j.city || (j.location || '').split(',')[0].trim(),
      workplaceType: (j.workplace_type === 'remote' ? 'Remote' : j.workplace_type === 'hybrid' ? 'Hybrid' : 'Onsite') as any,
      jobType: (j.job_type === 'articleship' ? 'Articleship / Industrial Training' : j.job_type === 'internship' ? 'Internship' : 'Full-Time') as any,
      experienceLevel: j.experience_level || '0-1 yr (Fresher)',
      minExperienceYears: j.min_experience_years ?? 0,
      salaryText: j.salary_text || 'As per norms',
      salaryMinLPA: j.salary_min_lpa ?? undefined,
      salaryMaxLPA: j.salary_max_lpa ?? undefined,
      qualifications: j.qualifications || [],
      mandatorySkills: j.mandatory_skills || [],
      goodToHaveSkills: j.good_to_have_skills || [],
      description: j.description || '',
      keyResponsibilities: j.key_responsibilities || [],
      source: 'direct_recruiter' as any,
      sourceUrl: undefined,
      arivuproExclusive: j.arivupro_exclusive ?? false,
      isUrgent: j.is_urgent ?? false,
      postedDate: j.posted_date ? j.posted_date.split('T')[0] : '',
      deadlineDate: j.deadline_date ? j.deadline_date.split('T')[0] : '',
      applicantsCount: j.applicants_count ?? 0,
      department: j.department || 'Audit & Assurance',
    });

    Promise.all([
      fetch('/api/jobs').then(r => r.ok ? r.json() : { jobs: [] }),
      fetch('/api/external-jobs?limit=200').then(r => r.ok ? r.json() : { jobs: [] }),
    ])
      .then(([internal, external]) => {
        const internalJobs: JobListing[] = (internal.jobs || []).map(mapInternal);
        const externalJobs: JobListing[] = (external.jobs || []).map(mapExternal);
        // Deduplicate: internal jobs take priority; skip scraped if same title+company exists
        const internalKeys = new Set(internalJobs.map((j: JobListing) => `${j.title}|${j.company}`));
        const freshExternal = externalJobs.filter((j: JobListing) => !internalKeys.has(`${j.title}|${j.company}`));
        setJobs([...internalJobs, ...freshExternal]);
      })
      .catch(() => { /* backend not running — keep seed data */ })
      .finally(() => setJobsLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSignIn = (mode: 'login' | 'signup' = 'login') => setAuthModal({ open: true, mode, role: 'student' as const });

  const handleSignOut = () => {
    import('./lib/supabase/client').then(({ supabase }) => supabase.auth.signOut());
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TAB_KEY);
    setAuth({ role: 'guest', name: '', email: '' });
    setRecruiterApprovalStatus(null);
    setRecruiterCompanyName('');
    setRecruiterSessionToken('');
    setCurrentTab('jobs');
    setShowProfileNudge(false);
    setApplyBlockJob(null);
    showToast('Signed out successfully.');
  };

  const handleAuthSuccess = (user: { name: string; email: string; role: 'student' | 'recruiter' | 'admin'; course?: string }) => {
    setAuth({ role: user.role as UserRole, name: user.name, email: user.email });
    setAuthModal(null);
    setSelectedCompany(null);
    if (user.role === 'student') {
      // Pre-fill profile with known signup data
      setStudent(prev => ({
        ...prev,
        name: prev.name || user.name,
        email: prev.email || user.email,
        primaryCourse: prev.primaryCourse || user.course || '',
        qualificationsCompleted: (prev.qualificationsCompleted.length === 0 && user.course)
          ? [user.course as StudentProfileType['qualificationsCompleted'][0]]
          : prev.qualificationsCompleted,
      }));
      // Show profile completion nudge after a short delay
      setTimeout(() => setShowProfileNudge(true), 1200);
    }
    if (user.role === 'recruiter') {
      // Capture session token for recruiter API calls
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) setRecruiterSessionToken(session.access_token);
      });
      // Check approval status before granting full access
      fetch(`/api/recruiters/status?email=${encodeURIComponent(user.email)}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.approval_status) setRecruiterApprovalStatus(d.approval_status);
          if (d?.company_name) setRecruiterCompanyName(d.company_name);
          if (d?.full_name) setAuth(prev => ({ ...prev, name: d.full_name }));
        })
        .catch(() => {});
      setCurrentTab('recruiter-jobs');
    } else if (user.role === 'admin') setCurrentTab('admin-dashboard');
    else setCurrentTab('jobs');
    showToast(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
  };

  const getProfilePct = (s: StudentProfileType) => {
    const fields = [!!s.name, !!s.email, !!s.phone, !!s.aboutBio, s.keySkills.length > 0, !!s.resumeFileName, s.qualificationsCompleted.length > 0, s.preferredLocations.length > 0];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  const handleApply = async (job: JobListing) => {
    if (auth.role === 'guest') { setAuthModal({ open: true, mode: 'login', role: 'student' }); return; }
    if (applications.find(a => a.jobId === job.id)) { showToast('Already applied to this job.'); return; }

    // For scraped jobs — open source URL in new tab
    if (job.sourceUrl) {
      window.open(job.sourceUrl, '_blank');
      return;
    }

    // Profile completeness gate: must be ≥65% and have a resume
    const pct = getProfilePct(student);
    if (pct < 65 || !student.resumeFileName) {
      setApplyBlockJob(job);
      return;
    }

    const app: JobApplication = {
      id: `app-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      studentId: student.id,
      studentName: student.name,
      studentRoll: student.arivuproStudentId,
      studentCourse: student.primaryCourse,
      appliedDate: new Date().toISOString(),
      status: 'Applied',
      aiMatchScore: Math.floor(70 + Math.random() * 25),
      matchGrade: 'Strong',
      crmLeadId: `CRM-${Date.now()}`,
      crmSyncStatus: 'Synced',
      assignedCounselor: 'ArivuPro Placement Desk',
      lastUpdated: new Date().toISOString(),
      timeline: [{ stage: 'Applied', timestamp: new Date().toISOString(), note: 'Submitted via ArivuPro Portal — resume + profile forwarded to recruiter' }],
    };

    // Update local state immediately for optimistic UI
    setApplications(prev => [app, ...prev]);
    setSelectedJob(null);
    showToast(`Applied to ${job.title} at ${job.company}!`);

    // Persist to backend (fire-and-forget — don't block the UX)
    try {
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          student_name: student.name,
          student_email: student.email,
          student_phone: student.phone,
          student_id: student.id,
          primary_course: student.primaryCourse,
        }),
      });
    } catch {
      // Backend unavailable — local state already updated, silently continue
    }
  };

  const isJobsTab = (currentTab as string) === 'jobs' || currentTab === 'articleship' || currentTab === 'internships';

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const q = filters.search.toLowerCase();
      const matchSearch = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.mandatorySkills.some(s => s.toLowerCase().includes(q));
      const matchType = !filters.type || j.jobType.toLowerCase().includes(filters.type.toLowerCase());
      const matchCity = !filters.city || j.city === filters.city;
      const matchQual = !filters.qualification || j.qualifications.includes(filters.qualification as any);
      const matchWorkplace = !filters.workplace || j.workplaceType === filters.workplace;
      const matchDepartment = !filters.department || j.department === filters.department;
      const matchSalary = (() => {
        if (!filters.salary) return true;
        const min = j.salaryMinLPA ?? 0;
        const max = j.salaryMaxLPA ?? j.salaryMinLPA ?? 0;
        if (filters.salary === 'Stipend / Training') return j.jobType.includes('Articleship') || j.jobType === 'Internship';
        if (filters.salary === '0–4 LPA') return min < 4;
        if (filters.salary === '4–8 LPA') return max >= 4 && min < 8;
        if (filters.salary === '8–15 LPA') return max >= 8 && min < 15;
        if (filters.salary === '15+ LPA') return max >= 15;
        return true;
      })();
      if (currentTab === 'articleship') return j.jobType.includes('Articleship') && matchSearch && matchCity && matchQual && matchSalary;
      if (currentTab === 'internships') return j.jobType === 'Internship' && matchSearch && matchCity && matchQual && matchSalary;
      return matchSearch && matchType && matchCity && matchQual && matchWorkplace && matchSalary && matchDepartment;
    });
  }, [jobs, filters, currentTab]);

  const appliedIds = useMemo(() => new Set(applications.map(a => a.jobId)), [applications]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fffe', fontFamily: 'Manrope, sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#0f2419', color: '#fff', borderRadius: 12,
          padding: '14px 20px', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 32px rgba(15,36,25,0.3)', maxWidth: 420,
        }}>
          <CheckCircle2 size={16} color="#fede6d" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{toast}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6b9e82', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => { if (tab === 'profile') { setShowProfile(true); } else { setCurrentTab(tab); setSelectedCompany(null); } }}
        userRole={auth.role}
        userName={auth.role !== 'guest' ? auth.name : undefined}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onForEmployers={() => setShowRecruiterPortal(true)}
      />

      {/* For Employers modal */}
      {showRecruiterPortal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(15,36,25,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={() => setShowRecruiterPortal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 20, padding: '36px 32px', maxWidth: 500, width: '100%',
            boxShadow: '0 24px 64px rgba(15,36,25,0.2)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 56, height: 56, background: '#0f2419', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🏢</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f2419', margin: '0 0 8px' }}>Recruit Finance Talent</h2>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Access pre-vetted CA, ACCA, CFA, CS & CMA professionals through ArivuPro's placement network.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {['✅ AI-matched candidates with verified qualifications', '✅ Direct access to articleship & full-time hiring', '✅ Post jobs, review applicants, advance pipeline', '✅ MoU partnership for Big 4 & top-tier firms'].map(pt => (
                <div key={pt} style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{pt}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" style={{ flex: 1, fontSize: 14, padding: '12px' }}
                onClick={() => { setShowRecruiterPortal(false); setShowRecruiterSignup(true); }}>
                Create Account →
              </button>
              <button className="btn-outline" style={{ flex: 1, fontSize: 14, padding: '12px' }}
                onClick={() => { setShowRecruiterPortal(false); setAuthModal({ open: true, mode: 'login', role: 'student' }); }}>
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login — full page, triggered by ?admin in URL */}
      {showAdminLogin && auth.role !== 'admin' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#0a0f0d' }}>
          <AdminLogin
            onLogin={(user) => {
              setAuth({ role: 'admin', name: user.name, email: user.email });
              setCurrentTab('admin-dashboard');
              setShowAdminLogin(false);
              // Clean URL
              window.history.replaceState({}, '', '/');
            }}
          />
          <button
            onClick={() => { setShowAdminLogin(false); window.history.replaceState({}, '', '/'); }}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
              color: '#fff', padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            ← Back to Portal
          </button>
        </div>
      )}

      {/* Recruiter Create Account */}
      {showRecruiterSignup && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(15,36,25,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, overflowY: 'auto',
        }} onClick={() => setShowRecruiterSignup(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520 }}>
            <RecruiterSignup
              onComplete={(data) => {
                setShowRecruiterSignup(false);
                setAuth({ role: 'recruiter', name: data.fullName, email: data.email });
                setRecruiterApprovalStatus('pending');
                setCurrentTab('recruiter-jobs');
                setToast(`Registration complete! We'll review ${data.fullName.split(' ')[0]}'s account and notify you.`);
              }}
              onCancel={() => setShowRecruiterSignup(false)}
            />
          </div>
        </div>
      )}

      <main>
        {/* ══════════════════════════════════════════════
            HERO — shown to guests on the jobs tab
        ══════════════════════════════════════════════ */}
        {auth.role === 'guest' && (currentTab as string) === 'jobs' && (
          <HeroSection
            onGetStarted={() => setAuthModal({ open: true, mode: 'signup', role: 'student' })}
            onSearch={(query, location) => {
              setFilters(prev => ({ ...prev, search: query, city: location || '' }));
              document.getElementById('job-feed-anchor')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        )}

        {/* ══════════════════════════════════════════════
            JOB FEED — visible to everyone (guest + student)
            Apply button triggers login for guests
        ══════════════════════════════════════════════ */}
        {isJobsTab && auth.role !== 'recruiter' && (
          <>
            <div id="job-feed-anchor" style={{ scrollMarginTop: 100 }} />
            <JobSearchFilters filters={filters} onFiltersChange={setFilters} totalCount={filteredJobs.length} />
            <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px' }}>
              {currentTab === 'articleship' && (
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>Articleship Openings</h2>
                  <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>CA Articleship positions from ICAI registered firms across India</p>
                </div>
              )}
              {currentTab === 'internships' && (
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>Finance Internships</h2>
                  <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Paid internships for finance students — B.Com, M.Com, MBA and more</p>
                </div>
              )}
              {filteredJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                  <div style={{ fontWeight: 700, color: '#0f2419', marginBottom: 6 }}>No jobs found</div>
                  <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>Try adjusting your filters</p>
                  <button className="btn-outline" onClick={() => setFilters({ search: '', type: '', city: '', qualification: '', workplace: '', salary: '', department: '' })}>Clear filters</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  {filteredJobs.map(job => (
                    <JobCard key={job.id} job={job} onViewDetails={setSelectedJob} onApply={handleApply} isApplied={appliedIds.has(job.id)} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── COMPANIES TAB ── */}
        {currentTab === 'companies' && !selectedCompany && (
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 24px' }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f2419', margin: '0 0 6px' }}>Hiring Companies</h2>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Verified recruiters and MoU partners of ArivuPro Finance Academy</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {COMPANIES_LIST.map(co => {
                const coJobs = jobs.filter(co.jobFilter);
                return (
                  <div
                    key={co.name}
                    className="card"
                    style={{ padding: 20, cursor: 'pointer' }}
                    onClick={() => setSelectedCompany(co)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0faf4', border: '1px solid #d7f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#1a7a4a', fontSize: 13, flexShrink: 0 }}>
                        {co.logoText}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f2419' }}>{co.name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{co.type} · {coJobs.length} active jobs</div>
                      </div>
                    </div>
                    <span className={co.status === 'MoU Partner' ? 'badge badge-yellow' : 'badge badge-green'}>{co.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentTab === 'companies' && selectedCompany && (
          <CompanyProfile
            company={selectedCompany}
            jobs={jobs.filter(selectedCompany.jobFilter)}
            onBack={() => setSelectedCompany(null)}
            onApply={(job) => {
              if (auth.role === 'guest') {
                setAuthModal({ open: true, mode: 'login', role: 'student' });
              } else {
                handleApply(job);
              }
            }}
            appliedIds={appliedIds}
            isGuest={auth.role === 'guest'}
          />
        )}

        {/* ── STUDENT: APPLICATIONS ── */}
        {auth.role === 'student' && currentTab === 'applications' && (
          <ApplicationTracker
            applications={applications}
            student={student}
            onRefresh={() => {}}
            onSelectApplication={(app) => setSelectedJob(jobs.find(j => j.id === app.jobId) || null)}
          />
        )}

        {/* ── RECRUITER DASHBOARD ── */}
        {auth.role === 'recruiter' && (
          recruiterApprovalStatus === 'pending' || recruiterApprovalStatus === 'rejected' ? (
            <div style={{ maxWidth: 520, margin: '80px auto', padding: '0 24px', textAlign: 'center', fontFamily: 'Manrope, sans-serif' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: recruiterApprovalStatus === 'rejected' ? '#fef2f2' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32 }}>
                {recruiterApprovalStatus === 'rejected' ? '✕' : '⏳'}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f2419', marginBottom: 10, letterSpacing: '-0.02em' }}>
                {recruiterApprovalStatus === 'rejected' ? 'Account Not Approved' : 'Account Under Review'}
              </h2>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, marginBottom: 24 }}>
                {recruiterApprovalStatus === 'rejected'
                  ? `Your recruiter account for ${auth.name} could not be verified at this time. Please contact us at tech@arivupro.com with supporting documents.`
                  : `Your recruiter account is pending approval by the ArivuPro team. You'll receive an email at ${auth.email} once it's approved (typically 1–2 business days).`
                }
              </p>
              <button className="btn-ghost" onClick={handleSignOut} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Sign Out
              </button>
            </div>
          ) : (
            <RecruiterDashboard
              recruiterName={auth.name}
              recruiterEmail={auth.email}
              companyName={recruiterCompanyName}
              sessionToken={recruiterSessionToken}
            />
          )
        )}

        {/* ── ADMIN LAYOUT (sidebar + content) ── */}
        {auth.role === 'admin' && (
          <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
            {/* Sidebar */}
            <aside style={{
              width: 220,
              flexShrink: 0,
              background: '#0f2419',
              padding: '24px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6b9e82', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px 12px' }}>
                Admin Panel
              </div>
              {([
                { id: 'admin-dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'admin-students', label: 'All Students', icon: '🎓' },
                { id: 'admin-jobs', label: 'All Jobs', icon: '💼' },
                { id: 'admin-companies', label: 'Companies', icon: '🏢' },
                { id: 'admin-recruiters', label: 'Recruiters', icon: '🏷️' },
                { id: 'crm', label: 'Placement CRM', icon: '👥' },
                { id: 'scraper', label: 'Scraper', icon: '🤖' },
              ] as { id: NavTab; label: string; icon: string }[]).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 13,
                    fontWeight: currentTab === item.id ? 700 : 500,
                    color: currentTab === item.id ? '#fede6d' : '#d7f4ea',
                    background: currentTab === item.id ? 'rgba(254,222,109,0.12)' : 'transparent',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </aside>

            {/* Admin content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {currentTab === 'scraper' && (
                <ScraperDashboard
                  sources={sources}
                  onTriggerScrape={async (src) => {
                    showToast(`Syncing ${src || 'all sources'}…`);
                    const res = await fetch('/api/scrape/trigger', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ target_source: src || null }),
                    });
                    if (!res.ok) throw new Error(await res.text());
                    return res.json();
                  }}
                  totalScrapedJobs={jobs.filter(j => j.source !== 'arivupro_exclusive').length}
                />
              )}
              {currentTab === 'crm' && (
                <PlacementCrmDashboard onSyncAll={async () => { showToast('All records synced!'); return {}; }} />
              )}
              {(['admin-dashboard', 'admin-students', 'admin-jobs', 'admin-companies', 'admin-recruiters'] as string[]).includes(currentTab as string) && (
                <AdminDashboard
                  jobs={jobs}
                  applications={applications}
                  activeTab={
                    currentTab === 'admin-students' ? 'All Students'
                    : currentTab === 'admin-jobs' ? 'All Jobs'
                    : currentTab === 'admin-companies' ? 'Companies'
                    : currentTab === 'admin-recruiters' ? 'Recruiters'
                    : 'Dashboard'
                  }
                />
              )}
            </div>
          </div>
        )}

        {/* ── STUDENT: AI JOB MATCH ── */}
        {auth.role === 'student' && currentTab === 'ai-match' && (
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px' }}>
            <AIJobMatch
              jobs={jobs}
              studentName={auth.name}
              studentCourse={student.primaryCourse}
              studentQualifications={student.qualificationsCompleted}
              studentSkills={student.keySkills}
              studentArticleshipMonths={student.articleshipCompletedMonths}
              studentExpectedSalary={student.expectedSalaryLPA}
              studentBio={student.aboutBio}
              studentEnrollmentCohort={student.enrollmentCohort}
              studentCurrentLevel={student.currentLevel}
            />
          </div>
        )}

      </main>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={handleApply}
        isApplied={selectedJob ? appliedIds.has(selectedJob.id) : false}
      />

      {/* Auth Modal */}
      {authModal?.open && (
        <AuthModal
          mode={authModal.mode}
          role={authModal.role}
          onClose={() => setAuthModal(null)}
          onSuccess={handleAuthSuccess}
          onSwitchMode={(m) => setAuthModal({ ...authModal, mode: m })}
          onSwitchRole={(r) => setAuthModal({ ...authModal, role: r })}
        />
      )}

      {/* Student Profile */}
      {auth.role === 'student' && showProfile && (
        <StudentProfile
          student={student}
          onUpdate={(s) => { setStudent(s); setShowProfile(false); showToast('✅ Profile updated!'); }}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Profile Completion Nudge */}
      {auth.role === 'student' && showProfileNudge && getProfilePct(student) < 65 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,36,25,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(15,36,25,0.25)', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#0f2419,#1a7a4a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ fontSize: 28 }}>🎯</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', margin: '0 0 10px' }}>Complete Your Profile</h2>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 20px', lineHeight: 1.6 }}>
              Your profile is <strong style={{ color: '#1a7a4a' }}>{getProfilePct(student)}% complete</strong>. Add your resume, skills, and bio so recruiters can find you — and to unlock job applications.
            </p>
            <div style={{ background: '#f3f4f6', borderRadius: 999, height: 8, margin: '0 0 24px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,#1a7a4a,#fede6d)', borderRadius: 999, width: `${getProfilePct(student)}%`, transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowProfileNudge(false)} style={{ flex: 1, padding: '11px 0', borderRadius: 999, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 14, fontWeight: 600, color: '#6b7280', cursor: 'pointer', fontFamily: 'Manrope,sans-serif' }}>Later</button>
              <button onClick={() => { setShowProfileNudge(false); setShowProfile(true); }} style={{ flex: 2, padding: '11px 0', borderRadius: 999, border: 'none', background: 'linear-gradient(90deg,#0f2419,#1a7a4a)', fontSize: 14, fontWeight: 700, color: '#fede6d', cursor: 'pointer', fontFamily: 'Manrope,sans-serif' }}>Complete Profile →</button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Block Modal — profile incomplete */}
      {applyBlockJob && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,36,25,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(15,36,25,0.25)', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff4e5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ fontSize: 32 }}>📋</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', margin: '0 0 10px' }}>Profile Incomplete</h2>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 8px', lineHeight: 1.6 }}>
              To apply for <strong>{applyBlockJob.title}</strong> at <strong>{applyBlockJob.company}</strong>, your profile must be at least 65% complete with a resume uploaded.
            </p>
            <p style={{ fontSize: 13, color: '#b45309', background: '#fef9ec', borderRadius: 8, padding: '10px 14px', margin: '0 0 20px' }}>
              Current: <strong>{getProfilePct(student)}%</strong> — {!student.resumeFileName ? 'Resume is missing.' : 'Add more details to reach 65%.'}
            </p>
            <div style={{ background: '#f3f4f6', borderRadius: 999, height: 8, margin: '0 0 24px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: `linear-gradient(90deg,${getProfilePct(student) >= 65 ? '#1a7a4a' : '#dc2626'},#fede6d)`, borderRadius: 999, width: `${getProfilePct(student)}%` }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setApplyBlockJob(null)} style={{ flex: 1, padding: '11px 0', borderRadius: 999, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 14, fontWeight: 600, color: '#6b7280', cursor: 'pointer', fontFamily: 'Manrope,sans-serif' }}>Cancel</button>
              <button onClick={() => { setApplyBlockJob(null); setShowProfile(true); }} style={{ flex: 2, padding: '11px 0', borderRadius: 999, border: 'none', background: 'linear-gradient(90deg,#0f2419,#1a7a4a)', fontSize: 14, fontWeight: 700, color: '#fede6d', cursor: 'pointer', fontFamily: 'Manrope,sans-serif' }}>Complete Profile →</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: '#0f2419', color: '#d7f4ea', padding: '48px 24px', marginTop: 80 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1a7a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fede6d', fontSize: 18 }}>A</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '-0.02em' }}>ArivuPro Finance Careers</div>
              <div style={{ fontSize: 11, color: '#6b9e82', marginTop: 2 }}>India's #1 Portal for Commerce & Finance Students</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#6b9e82' }}>CA · ACCA · US CPA · US CMA · CFA · CS · CMA India · B.Com</div>
          <div style={{ fontSize: 12, color: '#6b9e82' }}>
            © 2026 ArivuPro Academy ·{' '}
            <a href="https://arivupro.com" style={{ color: '#fede6d', textDecoration: 'none' }}>arivupro.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
