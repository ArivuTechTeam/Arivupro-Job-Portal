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
import { CompanyProfile } from './components/CompanyProfile.tsx';
import { AIJobMatch } from './components/AIJobMatch.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { DbSchema } from './components/DbSchema.tsx';
import { TechStack } from './components/TechStack.tsx';
import {
  JobListing, JobApplication, StudentProfile as StudentProfileType,
  ScraperSourceStatus, RegisteredCompany,
} from './types/index.ts';
import { CheckCircle2, X } from 'lucide-react';

// ── Seed data ─────────────────────────────────────────────────────────────
const SEED_JOBS: JobListing[] = [
  {
    id: 'j1', title: 'Audit & Assurance Associate', company: 'Deloitte India', logoText: 'D',
    location: 'Bangalore, KA', city: 'Bangalore', jobType: 'Full-Time', workplaceType: 'Hybrid',
    experienceLevel: '0-1 yr (Fresher)', minExperienceYears: 0,
    salaryText: '₹7.5–9.5 LPA', salaryMinLPA: 7.5, salaryMaxLPA: 9.5,
    qualifications: ['ACCA', 'US_CPA'],
    mandatorySkills: ['US GAAP', 'PCAOB', 'Audit', 'Excel'],
    goodToHaveSkills: ['SAP', 'Alteryx'],
    description: 'Exclusive campus hiring for ArivuPro ACCA Affiliates and US CPA candidates. Execute statutory audit testing for Fortune 500 US clients using PCAOB standards.',
    keyResponsibilities: ['Execute audit procedures for US listed clients', 'Prepare audit documentation', 'Work with Big 4 international teams', 'Assist in SOX compliance testing'],
    source: 'arivupro_exclusive', arivuproExclusive: true, isUrgent: true,
    postedDate: '2026-11-02', deadlineDate: '2026-11-20',
    applicantsCount: 34, department: 'Audit & Assurance',
  },
  {
    id: 'j2', title: 'CA Articleship Trainee', company: 'BDO India LLP', logoText: 'BDO',
    location: 'Bangalore / Chennai', city: 'Bangalore', jobType: 'Articleship / Industrial Training', workplaceType: 'Onsite',
    experienceLevel: 'Articleship / 0 yrs', minExperienceYears: 0,
    salaryText: '₹22k–30k / month stipend', salaryMinLPA: 0, salaryMaxLPA: 0,
    qualifications: ['CA_INTER'],
    mandatorySkills: ['Ind AS', 'Tax Audit', 'TallyPrime', 'Excel'],
    goodToHaveSkills: ['SAP FICO'],
    description: '2-year practical articleship training with structured exposure to listed manufacturing and SaaS audits. ICAI registered principal firm.',
    keyResponsibilities: ['Statutory audit of listed companies', 'Tax audit under Income Tax Act', 'Internal audit assignments', 'GST compliance'],
    source: 'arivupro_exclusive', arivuproExclusive: true, isUrgent: false,
    postedDate: '2026-11-01', deadlineDate: '2026-11-25',
    applicantsCount: 52, department: 'Articleship Desk',
  },
  {
    id: 'j3', title: 'Financial Analyst — FP&A', company: 'Goldman Sachs Services', logoText: 'GS',
    location: 'Bangalore, KA', city: 'Bangalore', jobType: 'Full-Time', workplaceType: 'Hybrid',
    experienceLevel: '1-3 yrs', minExperienceYears: 1,
    salaryText: '₹14–18.5 LPA', salaryMinLPA: 14, salaryMaxLPA: 18.5,
    qualifications: ['CA', 'CFA', 'US_CMA'],
    mandatorySkills: ['Financial Modeling', 'Variance Analysis', 'DCF', 'Excel'],
    goodToHaveSkills: ['Tableau', 'SQL'],
    description: 'Corporate finance professionals for global BU budgeting, variance analysis, and board decks. GCC role supporting GS New York office.',
    keyResponsibilities: ['Monthly BU P&L variance analysis', 'Annual budgeting process', 'Board deck preparation', 'DCF modeling for new investments'],
    source: 'arivupro_exclusive', arivuproExclusive: true, isUrgent: true,
    postedDate: '2026-10-30', deadlineDate: '2026-11-18',
    applicantsCount: 41, department: 'FP&A & Corporate Finance',
  },
  {
    id: 'j4', title: 'US Corporate Taxation Senior', company: 'PwC Acceleration Center', logoText: 'PwC',
    location: 'Hyderabad, TS', city: 'Hyderabad', jobType: 'Full-Time', workplaceType: 'Hybrid',
    experienceLevel: '1-3 yrs', minExperienceYears: 1,
    salaryText: '₹10.5–13 LPA', salaryMinLPA: 10.5, salaryMaxLPA: 13,
    qualifications: ['US_CPA', 'CA', 'ACCA'],
    mandatorySkills: ['Form 1120', 'Form 1065', 'Federal Tax', 'OneSource'],
    goodToHaveSkills: ['CCH Axcess', 'GoSystem'],
    description: 'Federal, state, and partnership income tax compliance for multinational hedge funds and corporate entities.',
    keyResponsibilities: ['Form 1120 / 1065 preparation', 'State & local tax compliance', 'Tax provision under ASC 740', 'Client liaison for US partners'],
    source: 'big4_portal', arivuproExclusive: false, isUrgent: false,
    postedDate: '2026-11-03', deadlineDate: '2026-11-30',
    applicantsCount: 28, department: 'Taxation',
    sourceUrl: 'https://www.pwc.in/careers',
  },
  {
    id: 'j5', title: 'Investment Banking Analyst — M&A', company: 'Avendus Capital', logoText: 'AC',
    location: 'Mumbai, MH', city: 'Mumbai', jobType: 'Full-Time', workplaceType: 'Onsite',
    experienceLevel: '0-1 yr (Fresher)', minExperienceYears: 0,
    salaryText: '₹16–22 LPA + bonus', salaryMinLPA: 16, salaryMaxLPA: 22,
    qualifications: ['CA', 'CFA'],
    mandatorySkills: ['LBO Modeling', 'M&A Valuation', 'Pitchbook', 'Capital IQ'],
    goodToHaveSkills: ['Bloomberg', 'FactSet'],
    description: 'Premier boutique IB seeking Rank-holder CA or CFA L2/L3 for sell-side technology and consumer M&A transactions.',
    keyResponsibilities: ['Pitchbook preparation', 'LBO and DCF modeling', 'Due diligence coordination', 'CIM drafting'],
    source: 'quintedge', arivuproExclusive: false, isUrgent: false,
    postedDate: '2026-11-03', deadlineDate: '2026-11-25',
    applicantsCount: 65, department: 'Investment Banking & M&A',
    sourceUrl: 'https://www.avendus.com/careers',
  },
  {
    id: 'j6', title: 'Company Secretary & Compliance Officer', company: 'Grant Thornton LLP', logoText: 'GT',
    location: 'Delhi NCR', city: 'Delhi', jobType: 'Full-Time', workplaceType: 'Onsite',
    experienceLevel: '0-1 yr (Fresher)', minExperienceYears: 0,
    salaryText: '₹6.5–8.5 LPA', salaryMinLPA: 6.5, salaryMaxLPA: 8.5,
    qualifications: ['CS'],
    mandatorySkills: ['Companies Act', 'MCA V3', 'SEBI LODR', 'Secretarial Audit'],
    goodToHaveSkills: ['FEMA', 'RBI Compliance'],
    description: 'Qualified CS for corporate governance consulting, annual filings, RBI/FDI reporting, and board meeting management.',
    keyResponsibilities: ['Annual return filing with ROC', 'Board meeting management', 'SEBI compliance for listed entities', 'FDI/RBI reporting'],
    source: 'efinancialcareers', arivuproExclusive: false, isUrgent: false,
    postedDate: '2026-10-29', deadlineDate: '2026-11-20',
    applicantsCount: 16, department: 'Risk & Compliance',
    sourceUrl: 'https://www.grantthornton.in/careers',
  },
];

const SEED_SOURCES: ScraperSourceStatus[] = [
  { id: 'arivupro_exclusive', name: 'CA Club India', url: 'caclubindia.com', lastRun: '8 mins ago', jobsCount: 124, status: 'Active', categoryFocus: 'RSS Feed — Articleship & CA Jobs' },
  { id: 'direct_recruiter',   name: 'BuddingCA',    url: 'buddingca.com',   lastRun: '12 mins ago', jobsCount: 89,  status: 'Active', categoryFocus: 'WordPress REST API' },
  { id: 'linkedin',           name: 'JSearch API',  url: 'jsearch.p.rapidapi.com', lastRun: '5 mins ago', jobsCount: 312, status: 'Syncing', categoryFocus: '61 finance-focused search queries' },
  { id: 'quintedge',          name: 'QuintEdge',    url: 'quintedge.in',   lastRun: '18 mins ago', jobsCount: 63,  status: 'Active', categoryFocus: 'IB & Finance roles' },
  { id: 'efinancialcareers',  name: 'eFinancialCareers', url: 'efinancialcareers.com', lastRun: '2 hrs ago', jobsCount: 47, status: 'Idle', categoryFocus: 'Global finance roles' },
  { id: 'big4_portal',        name: 'Big 4 Portals', url: 'direct', lastRun: '1 hr ago', jobsCount: 38, status: 'Idle', categoryFocus: 'Deloitte, PwC, EY, KPMG direct' },
];

const SEED_STUDENT: StudentProfileType = {
  id: 'stu-arv-9481',
  name: 'Rohan Venkatesh',
  email: 'rohan.v@arivupro.student.in',
  phone: '+91 98452 71830',
  arivuproStudentId: 'ARV-2024-ACCA-882',
  enrollmentCohort: 'ACCA Strategic Professional (Batch 2024-BLR)',
  primaryCourse: 'ACCA & US CPA Dual Track',
  currentLevel: 'ACCA 11/13 Papers Cleared & US CPA 2/4 Passed',
  qualificationsCompleted: ['ACCA', 'US_CPA', 'CA_INTER', 'FINANCIAL_MODELING', 'BCOM_MCOM_MBA'],
  articleshipCompletedMonths: 18,
  keySkills: ['IFRS', 'US GAAP', 'Statutory Audit', 'Financial Modeling', 'Ind AS', 'Advanced Excel', 'SAP FICO'],
  preferredLocations: ['Bangalore', 'Hyderabad', 'Remote'],
  expectedSalaryLPA: '8.5 - 11 LPA',
  targetRoles: ['Audit Senior', 'FP&A Analyst', 'Financial Reporting Specialist'],
  aboutBio: 'Passionate finance scholar with strong foundation in IFRS and US GAAP. Completed 18 months of audit articleship handling manufacturing and IT services audits.',
  verifiedStudent: true,
  gpaOrScore: 'Distinction in SBR & AFM',
  resumeFileName: 'Rohan_Venkatesh_ArivuPro_Resume.pdf',
};

const SEED_COMPANY: RegisteredCompany = {
  id: 'co-001', name: 'Deloitte India', legalName: 'Deloitte Touche Tohmatsu India LLP',
  industry: 'Big 4 Audit & Advisory', workEmail: 'campus@deloitte.com',
  website: 'deloitte.com', cinOrGstin: 'U74140DL2015LLC280043',
  verificationStatus: 'MoU Partner', verificationNotes: 'Verified via CIN lookup on MCA21',
  registeredDate: '2024-01-15', activeJobsCount: 3, contactPerson: 'Meghna Rao',
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
];

type UserRole = 'guest' | 'student' | 'recruiter' | 'admin';

interface AuthState {
  role: UserRole;
  name: string;
  email: string;
}

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ role: 'guest', name: '', email: '' });
  const [currentTab, setCurrentTab] = useState<NavTab>('jobs');

  const [jobs, setJobs] = useState<JobListing[]>(SEED_JOBS);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [sources] = useState<ScraperSourceStatus[]>(SEED_SOURCES);
  const [student, setStudent] = useState<StudentProfileType>(SEED_STUDENT);

  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'signup'; role: 'student' | 'recruiter' } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: '', type: '', city: '', qualification: '', workplace: '', salary: '' });
  const [selectedCompany, setSelectedCompany] = useState<typeof COMPANIES_LIST[0] | null>(null);
  const [showRecruiterPortal, setShowRecruiterPortal] = useState(false);

  // Load scraped jobs from backend and merge with seed jobs
  useEffect(() => {
    setJobsLoading(true);
    fetch('/api/external-jobs?limit=200')
      .then(r => r.json())
      .then((data: { jobs: any[] }) => {
        const scraped: JobListing[] = (data.jobs || []).map((j: any) => ({
          id: j.id,
          title: j.title,
          company: j.company || 'CA Firm',
          logoText: (j.company || 'CA')[0].toUpperCase(),
          location: j.location || 'India',
          city: (j.location || 'India').split(',')[0].trim(),
          workplaceType: j.is_remote ? 'Remote' : 'Onsite' as const,
          jobType: j.job_type === 'articleship' ? 'Articleship / Industrial Training' : 'Full-Time' as const,
          experienceLevel: j.experience_level === 'fresher' ? '0-1 yr (Fresher)' : 'Articleship / 0 yrs' as const,
          minExperienceYears: 0,
          salaryText: j.stipend > 0 ? `₹${(j.stipend).toLocaleString('en-IN')}/mo` : 'As per norms',
          salaryMinLPA: j.stipend > 0 ? parseFloat((j.stipend * 12 / 100000).toFixed(1)) : undefined,
          qualifications: j.courses || ['CA'],
          mandatorySkills: [],
          goodToHaveSkills: [],
          description: j.description || '',
          keyResponsibilities: [],
          source: j.source === 'caclubindia' ? 'naukri' : j.source === 'buddingca' ? 'naukri' : j.source?.includes('icai') ? 'arivupro_exclusive' : 'naukri' as const,
          sourceUrl: j.apply_url,
          arivuproExclusive: j.source?.includes('icai') || j.source === 'icmai',
          postedDate: j.posted_at ? j.posted_at.split('T')[0] : new Date().toISOString().split('T')[0],
          deadlineDate: '',
          applicantsCount: 0,
          department: j.courses?.includes('CMA India') ? 'FP&A & Corporate Finance' : 'Audit & Assurance',
        }));
        // Merge: seed jobs first, then scraped (deduplicated by title+company)
        const seedTitles = new Set(SEED_JOBS.map(j => `${j.title}|${j.company}`));
        const fresh = scraped.filter(j => !seedTitles.has(`${j.title}|${j.company}`));
        setJobs([...SEED_JOBS, ...fresh]);
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
    setAuth({ role: 'guest', name: '', email: '' });
    setCurrentTab('jobs');
    showToast('Signed out successfully.');
  };

  const handleAuthSuccess = (user: { name: string; email: string; role: 'student' | 'recruiter' | 'admin' }) => {
    setAuth({ role: user.role as UserRole, name: user.name, email: user.email });
    setAuthModal(null);
    setSelectedCompany(null);
    if (user.role === 'recruiter') setCurrentTab('recruiter-jobs');
    else if (user.role === 'admin') setCurrentTab('admin-dashboard');
    else setCurrentTab('jobs');
    showToast(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
  };

  const handleApply = (job: JobListing) => {
    if (auth.role === 'guest') { setAuthModal({ open: true, mode: 'login', role: 'student' }); return; }
    if (applications.find(a => a.jobId === job.id)) { showToast('Already applied to this job.'); return; }

    // For scraped jobs — open source URL
    if (job.sourceUrl) {
      window.open(job.sourceUrl, '_blank');
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

    setApplications(prev => [app, ...prev]);
    setSelectedJob(null);
    showToast(`✅ Applied to ${job.title} at ${job.company}!`);
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
      if (currentTab === 'articleship') return j.jobType.includes('Articleship') && matchSearch && matchCity && matchQual;
      if (currentTab === 'internships') return j.jobType === 'Internship' && matchSearch && matchCity && matchQual;
      return matchSearch && matchType && matchCity && matchQual && matchWorkplace;
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
        onTabChange={(tab) => { setCurrentTab(tab); setSelectedCompany(null); }}
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
                onClick={() => { setShowRecruiterPortal(false); setAuthModal({ open: true, mode: 'login', role: 'student' }); }}>
                Recruiter Login →
              </button>
              <button className="btn-outline" style={{ flex: 1, fontSize: 14, padding: '12px' }}
                onClick={() => setShowRecruiterPortal(false)}>
                Learn More
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#9ca3af' }}>
              Demo: <strong>recruiter@deloitte.com</strong> / <strong>Recruiter@123</strong>
            </div>
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
                  <button className="btn-outline" onClick={() => setFilters({ search: '', type: '', city: '', qualification: '', workplace: '', salary: '' })}>Clear filters</button>
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
          <RecruiterDashboard
            recruiter={SEED_COMPANY}
            jobs={[]}
            applicants={[]}
          />
        )}

        {/* ── ADMIN: SCRAPER ── */}
        {auth.role === 'admin' && currentTab === 'scraper' && (
          <ScraperDashboard
            sources={sources}
            onTriggerScrape={async (src) => { showToast(`🔄 Syncing ${src || 'all sources'}...`); return {}; }}
            totalScrapedJobs={jobs.filter(j => j.source !== 'arivupro_exclusive').length}
          />
        )}

        {/* ── ADMIN: CRM ── */}
        {auth.role === 'admin' && currentTab === 'crm' && (
          <PlacementCrmDashboard onSyncAll={async () => { showToast('All records synced!'); return {}; }} />
        )}

        {/* ── ADMIN: DASHBOARD (also default catch-all for admin role) ── */}
        {auth.role === 'admin' && (currentTab === 'admin-dashboard' || (!['crm','scraper','db-schema','tech-stack'].includes(currentTab as string))) && currentTab !== 'crm' && currentTab !== 'scraper' && currentTab !== 'db-schema' && currentTab !== 'tech-stack' && (
          <AdminDashboard jobs={jobs} applications={applications} />
        )}

        {/* ── ADMIN: DB SCHEMA ── */}
        {auth.role === 'admin' && currentTab === 'db-schema' && (
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px' }}>
            <DbSchema />
          </div>
        )}

        {/* ── ADMIN: TECH STACK ── */}
        {auth.role === 'admin' && currentTab === 'tech-stack' && (
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px' }}>
            <TechStack />
          </div>
        )}

        {/* ── STUDENT: AI JOB MATCH ── */}
        {auth.role === 'student' && currentTab === 'ai-match' && (
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px' }}>
            <AIJobMatch jobs={jobs} studentName={auth.name} studentCourse={student.primaryCourse} />
          </div>
        )}

        {/* ── STUDENT: MY PROFILE ── */}
        {auth.role === 'student' && currentTab === 'profile' && (
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px' }}>
            <StudentProfile
              student={student}
              onUpdate={(updated) => setStudent(updated)}
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
          onUpdate={(s) => { setStudent(s); setShowProfile(false); showToast('Profile updated!'); }}
          onClose={() => setShowProfile(false)}
        />
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
