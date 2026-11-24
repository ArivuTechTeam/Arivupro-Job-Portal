import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import JobDetailPage from './pages/JobDetailPage.tsx';
import { Navbar, NavTab } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { JobSearchFilters } from './components/JobSearchFilters.tsx';
import { matchesCategory } from './components/CategoryPills.tsx';
import { PromoSlot } from './components/PromoSlot.tsx';
import { FilterSidebar } from './components/JobSearchFilters.tsx';
import { JobCard } from './components/JobCard.tsx';
import { JobDetailsModal } from './components/JobDetailsModal.tsx';
import { ApplicationTracker } from './components/ApplicationTracker.tsx';
import { ScraperDashboard } from './components/ScraperDashboard.tsx';
import { PlacementCrmDashboard } from './components/PlacementCrmDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { StudentProfile } from './components/StudentProfile.tsx';
import { RecruiterDashboard } from './components/RecruiterDashboard.tsx';
import { RecruiterSignup } from './components/RecruiterSignup.tsx';
import { CompanyDirectory, ApiCompany } from './components/CompanyDirectory.tsx';
import { StudentDashboard } from './components/StudentDashboard.tsx';
import { CompanyProfileFromApi } from './components/CompanyProfileFromApi.tsx';
import { AIJobMatch } from './components/AIJobMatch.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { SyncedJobsTab } from './components/SyncedJobsTab.tsx';
import AdminLogin from './components/admin/AdminLogin.tsx';
import { useAuth } from './lib/supabase/AuthContext.tsx';
import {
  JobListing, JobApplication, StudentProfile as StudentProfileType,
} from './types/index.ts';
import { CheckCircle2, X, Home, Briefcase, User } from 'lucide-react';
import { DashboardIcon, JobPostsIcon, StudentsIcon, RecruitersIcon, CompaniesIcon, PlacementCrmIcon, ScraperIcon, SyncedJobsIcon, ProfileIcon } from './components/icons/AdminNavIcons.tsx';
import { supabase } from './lib/supabase/client.ts';
import { injectAnimations } from './lib/animations.ts';

// Inject global animation CSS once at app startup
injectAnimations();

const SEED_JOBS: JobListing[] = [];


const SEED_STUDENT: StudentProfileType = {
  id: '', name: '', email: '', phone: '',
  arivuproStudentId: '', enrollmentCohort: '', primaryCourse: '', currentLevel: '',
  qualificationsCompleted: [], articleshipCompletedMonths: 0, keySkills: [],
  preferredLocations: [], expectedSalaryLPA: '', targetRoles: [],
  aboutBio: '', verifiedStudent: false, gpaOrScore: '', resumeFileName: '',
};


type UserRole = 'guest' | 'student' | 'recruiter' | 'admin';

interface AuthState {
  role: UserRole;
  name: string;
  email: string;
}

interface AppHistoryState {
  __arivuproApp: true;
  role: UserRole;
  tab: NavTab;
  depth: number;
}

const AUTH_KEY = 'ap_auth';
const TAB_KEY = 'ap_tab';

// Use sessionStorage so each browser tab has its own independent auth state.
// localStorage is shared across all tabs in the same origin — logging in as a
// recruiter in Tab B would overwrite the student session in Tab A on refresh.
function loadAuth(): AuthState {
  try {
    const s = sessionStorage.getItem(AUTH_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return { role: 'guest', name: '', email: '' };
}

function loadTab(): NavTab {
  // Map URL path to initial tab on first load / hard refresh
  const path = window.location.pathname;
  if (path === '/jobseeker')   return 'dashboard';
  if (path === '/recruiter')   return 'recruiter-jobs';
  if (path === '/admin')       return 'admin-dashboard';
  if (path === '/jobs')        return 'jobs';
  if (path === '/internships') return 'internships';
  if (path === '/articleship') return 'articleship';
  if (path === '/companies')   return 'companies';
  try {
    const t = sessionStorage.getItem(TAB_KEY) as NavTab | null;
    if (t) return t;
  } catch {}
  return 'jobs';
}

export default function App() {
  const { user: supabaseUser, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [auth, setAuth] = useState<AuthState>(loadAuth);
  const [currentTab, setCurrentTab] = useState<NavTab>(loadTab);

  const [jobs, setJobs] = useState<JobListing[]>(SEED_JOBS);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [studentSessionToken, setStudentSessionToken] = useState<string>('');
  const [student, setStudent] = useState<StudentProfileType>(() => {
    try {
      const saved = localStorage.getItem('arivupro_student_profile');
      return saved ? { ...SEED_STUDENT, ...JSON.parse(saved) } : SEED_STUDENT;
    } catch { return SEED_STUDENT; }
  });

  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'signup'; role: 'student' | 'recruiter' } | null>(null);
  const [showProfileNudge, setShowProfileNudge] = useState(false);
  const [applyBlockJob, setApplyBlockJob] = useState<JobListing | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filters, setFilters] = useState<import('./components/JobSearchFilters.tsx').Filters>({ search: '', type: '', city: [], qualification: [], workplace: [], salary: '', department: '', category: [], experience: '', recency: '' });
  const [jobPage, setJobPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<ApiCompany | null>(null);
  const [showRecruiterPortal, setShowRecruiterPortal] = useState(false);
  const [showRecruiterSignup, setShowRecruiterSignup] = useState(false);
  const [recruiterApprovalStatus, setRecruiterApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [recruiterCompanyName, setRecruiterCompanyName] = useState<string>('');
  const [recruiterSessionToken, setRecruiterSessionToken] = useState<string>('');
  const [showAdminLogin, setShowAdminLogin] = useState(
    () => window.location.search.includes('admin') || window.location.pathname === '/admin'
  );
  const [adminPendingCount, setAdminPendingCount] = useState(0);
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);
  const [recruiterProfileSignal, setRecruiterProfileSignal] = useState(0);

  // Persist auth and tab to sessionStorage (tab-isolated — no cross-tab contamination)
  useEffect(() => { sessionStorage.setItem(AUTH_KEY, JSON.stringify(auth)); }, [auth]);
  useEffect(() => { sessionStorage.setItem(TAB_KEY, currentTab); }, [currentTab]);

  // Keep navigation inside the SPA. Each app-owned history entry carries its
  // own depth, so the in-app back button never needs to call history.back()
  // when that would leave the portal and potentially exit the browser tab.
  useEffect(() => {
    const existing = window.history.state as Partial<AppHistoryState> | null;
    if (!existing?.__arivuproApp) {
      window.history.replaceState({
        __arivuproApp: true,
        role: auth.role,
        tab: currentTab,
        depth: 0,
      } satisfies AppHistoryState, '', window.location.pathname);
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as Partial<AppHistoryState> | null;
      if (!state?.__arivuproApp || !state.tab) {
        window.history.pushState({
          __arivuproApp: true,
          role: auth.role,
          tab: currentTab,
          depth: 0,
        } satisfies AppHistoryState, '', window.location.pathname);
        return;
      }
      setCurrentTab(state.tab);
      setSelectedCompany(null);
      setSelectedJob(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  // The listener is installed once so it can handle browser back events.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch applications when JobDetailPage records an external application
  useEffect(() => {
    const handler = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) loadStudentData(session.access_token);
      });
    };
    window.addEventListener('arivupro:external-applied', handler);
    return () => window.removeEventListener('arivupro:external-applied', handler);
  // loadStudentData is stable (defined outside effect); supabase is module-level
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep browser URL in sync with the active role so the address bar always
  // shows the right path and hard-refresh lands on the correct view.
  useEffect(() => {
    let path = '/';
    if (auth.role === 'student')   path = '/jobseeker';
    if (auth.role === 'recruiter') path = '/recruiter';
    if (auth.role === 'admin')     path = '/admin';
    if (window.location.pathname !== path) {
      window.history.replaceState({
        __arivuproApp: true,
        role: auth.role,
        tab: currentTab,
        depth: 0,
      } satisfies AppHistoryState, '', path);
    }
  }, [auth.role]);

  const tabPath = (tab: NavTab): string => {
    if (tab === 'jobs')        return '/jobs';
    if (tab === 'internships') return '/internships';
    if (tab === 'articleship') return '/articleship';
    if (tab === 'companies')   return '/companies';
    return window.location.pathname; // preserve /jobseeker, /recruiter, /admin
  };

  const navigateToTab = (tab: NavTab, options?: { replace?: boolean }) => {
    if (tab === 'profile' && auth.role === 'recruiter') {
      setRecruiterProfileSignal(s => s + 1);
      return;
    }
    if (tab === 'profile' && auth.role === 'admin') {
      setCurrentTab('admin-profile' as NavTab);
      return;
    }
    if (tab === 'profile' && auth.role !== 'student') return;
    setCurrentTab(tab);
    setSelectedCompany(null);

    const currentState = window.history.state as Partial<AppHistoryState> | null;
    const depth = currentState?.__arivuproApp ? currentState.depth ?? 0 : 0;
    const nextState: AppHistoryState = {
      __arivuproApp: true,
      role: auth.role,
      tab,
      depth: options?.replace ? depth : depth + 1,
    };
    const path = tabPath(tab);

    if (options?.replace || (currentState?.__arivuproApp && currentState.tab === tab)) {
      window.history.replaceState(nextState, '', path);
    } else {
      window.history.pushState(nextState, '', path);
    }
  };

  const goBack = () => {
    if (selectedJob) {
      setSelectedJob(null);
      return;
    }
    if (selectedCompany) {
      setSelectedCompany(null);
      return;
    }

    const state = window.history.state as Partial<AppHistoryState> | null;
    if (state?.__arivuproApp && (state.depth ?? 0) > 0) {
      window.history.back();
      return;
    }

    const fallbackTab: NavTab = auth.role === 'student' ? 'dashboard' : 'jobs';
    if (currentTab !== fallbackTab) {
      navigateToTab(fallbackTab, { replace: true });
    }
  };

  const canGoBack = Boolean(
    (window.history.state as Partial<AppHistoryState> | null)?.__arivuproApp &&
    ((window.history.state as Partial<AppHistoryState>).depth ?? 0) > 0
  ) || Boolean(selectedJob || selectedCompany) || currentTab !== (auth.role === 'student' ? 'dashboard' : 'jobs');

  // On mount: restore tokens for the role stored in this tab's sessionStorage.
  // We do NOT clear auth if there is no Supabase session — the session may have
  // expired or the tab may have been opened before the JWT was written (race).
  // The role stored in sessionStorage is the source of truth; we only use the
  // Supabase session to obtain a fresh access token for API calls.
  useEffect(() => {
    if (auth.role === 'guest') return; // nothing to restore

    import('./lib/supabase/client').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const token = session?.access_token ?? null;

        if (auth.role === 'student') {
          if (token) {
            setStudentSessionToken(token);
            loadStudentData(token);
          }
          if (['jobs', 'articleship', 'internships'].includes(currentTab as string)) {
            setCurrentTab('dashboard');
          }
        } else if (auth.role === 'recruiter') {
          if (token) setRecruiterSessionToken(token);
          // Re-verify approval status so the dashboard loads correctly
          fetch(`/api/recruiters/status?email=${encodeURIComponent(auth.email)}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => {
              if (d?.approval_status) setRecruiterApprovalStatus(d.approval_status);
              if (d?.company_name) setRecruiterCompanyName(d.company_name);
              if (d?.full_name) setAuth(prev => ({ ...prev, name: d.full_name }));
            })
            .catch(() => {});
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load jobs from backend: merge internal (recruiter-posted + exclusive) + scraped external
  useEffect(() => {
    setJobsLoading(true);

    // Strip noise from scraped titles/fields that entered DB before the server-side cleaner
    const cleanTitle = (t: string): string => {
      if (!t) return t;
      let s = t
        .replace(/:\s*apply\s+now[!.]?/gi, '')
        .replace(/\[[^\]]{0,80}\]/g, '')
        .replace(/\([^)]{0,80}\)/g, '')
        .replace(/\bat\s+[A-Z][^,]{3,40}(,|$)/g, '')
        .replace(/\s*[-–|]\s*.{0,40}$/, '')
        .trim()
        .replace(/[,:;\s-]+$/, '');
      return s.length > 5 ? s.slice(0, 80) : t.slice(0, 80);
    };

    // If company/location look like blog nav text, fall back to safe defaults
    const cleanCompany = (company: string, title: string): string => {
      if (!company || company.length > 60 || /how to apply|tips for|offers|established in|read more/i.test(company)) {
        // Try to extract from title: "Article Assistant at <Firm>, <City>"
        const m = title.match(/\bat\s+([A-Za-z][^:,\n]{4,55?})(?:,|:|\s*$)/);
        if (m) return m[1].trim().replace(/[,:]+$/, '');
        return 'CA Firm';
      }
      return company;
    };

    const cleanLocation = (loc: string): string => {
      if (!loc || loc.length > 60 || /how to apply|tips for|ca students|read more/i.test(loc)) return 'India';
      return loc;
    };

    const mapExternal = (j: any): JobListing => {
      const title = cleanTitle(j.title);
      const company = cleanCompany(j.company, j.title);
      const location = cleanLocation(j.location);
      return ({
      id: j.id,
      title,
      company: company || 'CA Firm',
      logoText: (company || 'CA').charAt(0).toUpperCase(),
      logoUrl: j.logo_url || undefined,
      location: location || 'India',
      city: (location || 'India').split(',')[0].trim(),
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
      qualifications: (j.courses || ['CA']).map((c: string) =>
        c === 'CPA US' ? 'US CPA' : c === 'B.Com' ? 'B.Com / M.Com' : c === 'M.Com' ? 'B.Com / M.Com' : c
      ),
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
    });};

    const mapInternal = (j: any): JobListing => ({
      id: j.id,
      title: j.title,
      company: j.company || '',
      logoText: (j.company || '?').charAt(0).toUpperCase(),
      logoUrl: j.logo_url || undefined,
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
      fetch('/api/external-jobs?limit=5000').then(r => r.ok ? r.json() : { jobs: [] }),
    ])
      .then(([internal, external]) => {
        const internalJobs: JobListing[] = (internal.jobs || []).map(mapInternal);
        const externalJobs: JobListing[] = (external.jobs || []).map(mapExternal);
        // Deduplicate by cleaned title+company
        const internalKeys = new Set(internalJobs.map((j: JobListing) => `${j.title.toLowerCase()}|${j.company.toLowerCase()}`));
        const seen = new Set<string>();
        const freshExternal = externalJobs.filter((j: JobListing) => {
          const key = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`;
          if (internalKeys.has(key) || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(TAB_KEY);
    localStorage.removeItem('arivupro_student_profile');
    setStudent(SEED_STUDENT);
    setAuth({ role: 'guest', name: '', email: '' });
    setRecruiterApprovalStatus(null);
    setRecruiterCompanyName('');
    setRecruiterSessionToken('');
    setStudentSessionToken('');
    setApplications([]);
    setSavedJobIds(new Set());
    setCurrentTab('jobs');
    setShowProfileNudge(false);
    setApplyBlockJob(null);
    showToast('Signed out successfully.');
  };

  const loadStudentData = (token: string) => {
    // Load applications from backend
    fetch('/api/applications/mine', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        const apps: JobApplication[] = (d.applications || []).map((a: any) => ({
          id: a.id,
          jobId: a.job_id || a.external_job_id || '',
          jobTitle: a.job_title || '',
          company: a.company || '',
          location: a.location || '',
          studentId: a.student_id || '',
          studentName: a.student_name || '',
          studentRoll: a.student_id || '',
          studentCourse: a.primary_course || '',
          appliedDate: a.created_at || '',
          status: (a.kind === 'external' ? 'Applied' : (a.stage ? a.stage.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Applied')) as JobApplication['status'],
          kind: (a.kind === 'external' ? 'external' : 'internal') as JobApplication['kind'],
          applyUrl: a.apply_url || undefined,
          aiMatchScore: a.ai_match_score || 0,
          matchGrade: (a.match_grade || 'Moderate') as JobApplication['matchGrade'],
          crmLeadId: a.crm_lead_id || '',
          crmSyncStatus: 'Synced' as const,
          assignedCounselor: a.assigned_counselor || 'ArivuPro Placement Desk',
          lastUpdated: a.updated_at || a.created_at || '',
          timeline: a.timeline || [],
        }));
        setApplications(apps);
      })
      .catch((e) => { console.error('[loadStudentData] /api/applications/mine failed:', e); });

    // Load saved jobs
    fetch('/api/saved-jobs/mine', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : { saved: [] })
      .then(d => {
        const ids = new Set<string>((d.saved || []).map((s: any) => s.job_id || s.external_job_id).filter(Boolean));
        setSavedJobIds(ids);
      })
      .catch(() => {});

    // Load student profile from DB (overrides localStorage if DB has data)
    fetch('/api/students/profile', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : { profile: null })
      .then(d => {
        if (d.profile) {
          setStudent(prev => {
            const updated = {
              ...prev,
              phone: d.profile.phone || prev.phone,
              primaryCourse: d.profile.primary_course || prev.primaryCourse,
              currentLevel: d.profile.current_level || prev.currentLevel,
              qualificationsCompleted: d.profile.qualifications_completed?.length ? d.profile.qualifications_completed : prev.qualificationsCompleted,
              articleshipCompletedMonths: d.profile.articleship_months ?? prev.articleshipCompletedMonths,
              keySkills: d.profile.key_skills?.length ? d.profile.key_skills : prev.keySkills,
              preferredLocations: d.profile.preferred_locations?.length ? d.profile.preferred_locations : prev.preferredLocations,
              expectedSalaryLPA: d.profile.expected_salary_lpa || prev.expectedSalaryLPA,
              targetRoles: d.profile.target_roles?.length ? d.profile.target_roles : prev.targetRoles,
              aboutBio: d.profile.about_bio || prev.aboutBio,
              resumeFileName: d.profile.resume_url || prev.resumeFileName,
              arivuproStudentId: d.profile.arivupro_student_id || prev.arivuproStudentId,
              enrollmentCohort: d.profile.enrollment_cohort || prev.enrollmentCohort,
            };
            localStorage.setItem('arivupro_student_profile', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch(() => {});
  };

  const handleAuthSuccess = (user: { name: string; email: string; role: 'student' | 'recruiter' | 'admin'; course?: string }) => {
    setAuth({ role: user.role as UserRole, name: user.name, email: user.email });
    setAuthModal(null);
    setSelectedCompany(null);
    if (user.role === 'student') {
      setStudent(prev => {
        const updated = {
          ...prev,
          name: user.name || prev.name,
          email: user.email || prev.email,
          primaryCourse: prev.primaryCourse || user.course || '',
          qualificationsCompleted: (prev.qualificationsCompleted.length === 0 && user.course)
            ? [user.course as StudentProfileType['qualificationsCompleted'][0]]
            : prev.qualificationsCompleted,
        };
        localStorage.setItem('arivupro_student_profile', JSON.stringify(updated));
        return updated;
      });
      // Load applications, saved jobs, and DB profile after student login
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          setStudentSessionToken(session.access_token);
          loadStudentData(session.access_token);
        }
      });
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
    else setCurrentTab('dashboard');
    showToast(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
  };

  // OAuth returns to the SPA after Supabase creates the session. Sync that
  // session into the existing app auth state so navigation follows the same
  // path as password sign-in without changing the existing tab structure.
  useEffect(() => {
    if (authLoading || auth.role !== 'guest' || !supabaseUser) return;
    handleAuthSuccess(supabaseUser);
  }, [authLoading, auth.role, supabaseUser]);

  const getProfilePct = (s: StudentProfileType) => {
    const fields = [!!s.name, !!s.email, !!s.phone, !!s.aboutBio, s.keySkills.length > 0, !!s.resumeFileName, s.qualificationsCompleted.length > 0, s.preferredLocations.length > 0];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  const handleApply = async (job: JobListing) => {
    if (auth.role === 'guest') { setAuthModal({ open: true, mode: 'login', role: 'student' }); return; }

    // External (scraped) job — open the site immediately (must be synchronous for popup blockers)
    if (job.sourceUrl) {
      window.open(job.sourceUrl, '_blank', 'noopener');
      const alreadyTracked = applications.find(a => a.jobId === job.id && a.kind === 'external');
      if (alreadyTracked) return; // repeat click — just reopen, no duplicate toast/record

      const { siteName: sn } = await import('./lib/siteName.ts');
      showToast(`Opened on ${sn(job.sourceUrl)}. Complete your application there.`);

      const optimistic: JobApplication = {
        id: `ext-${Date.now()}`,
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
        kind: 'external',
        applyUrl: job.sourceUrl,
        aiMatchScore: 0,
        matchGrade: 'Moderate',
        crmLeadId: '',
        crmSyncStatus: 'Synced',
        assignedCounselor: '',
        lastUpdated: new Date().toISOString(),
        timeline: [],
      };
      setApplications(prev => [optimistic, ...prev]);
      setSelectedJob(null);

      try {
        const { supabase: sb } = await import('./lib/supabase/client');
        const { data: { session: freshSession } } = await sb.auth.getSession();
        const token = freshSession?.access_token || studentSessionToken;
        if (!token) { console.error('[apply/external] no auth token'); return; }
        const res = await fetch('/api/applications/external', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ external_job_id: job.id }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('[apply/external] backend error:', res.status, err);
        }
      } catch (err) {
        console.error('[apply/external] network error:', err);
      }
      return;
    }

    if (applications.find(a => a.jobId === job.id)) { showToast('Already applied to this job.'); return; }

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
      kind: 'internal',
      aiMatchScore: 0,
      matchGrade: 'Strong',
      crmLeadId: `CRM-${Date.now()}`,
      crmSyncStatus: 'Synced',
      assignedCounselor: 'ArivuPro Placement Desk',
      lastUpdated: new Date().toISOString(),
      timeline: [{ stage: 'Applied', timestamp: new Date().toISOString(), note: 'Submitted via ArivuPro Portal — resume + profile forwarded to recruiter' }],
    };

    setApplications(prev => [app, ...prev]);
    setSelectedJob(null);
    showToast(`Applied to ${job.title} at ${job.company}!`);

    try {
      const { supabase: sb } = await import('./lib/supabase/client');
      const { data: { session: freshSession } } = await sb.auth.getSession();
      const token = freshSession?.access_token || studentSessionToken;
      if (!token) {
        console.error('[apply] no auth token — application not saved to backend');
        return;
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          job_id: job.id,
          student_name: student.name,
          student_email: student.email,
          student_phone: student.phone,
          student_id: student.id,
          primary_course: student.primaryCourse,
          key_skills: student.keySkills,
          resume_file_name: student.resumeFileName,
          about_bio: student.aboutBio,
          qualifications_completed: student.qualificationsCompleted,
          expected_salary: student.expectedSalaryLPA,
          articleship_months: student.articleshipCompletedMonths,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[apply] backend error:', res.status, err);
      }
    } catch (err) {
      console.error('[apply] network error:', err);
    }
  };

  // Phase B: recruiter job "Apply via ArivuPro" from JobDetailPage lands here
  // via /jobs?apply=<id>. Read once, fire handleApply, clear the param.
  useEffect(() => {
    const applyId = searchParams.get('apply');
    if (!applyId || jobs.length === 0) return;
    const target = jobs.find(j => j.id === applyId);
    if (target) handleApply(target);
    setSearchParams({}, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, jobs]);

  const handleSaveToggle = async (job: JobListing) => {
    if (auth.role !== 'student' || !studentSessionToken) return;
    const jobKey = job.id;
    const alreadySaved = savedJobIds.has(jobKey);

    // Optimistic update
    setSavedJobIds(prev => {
      const next = new Set(prev);
      if (alreadySaved) next.delete(jobKey); else next.add(jobKey);
      return next;
    });
    showToast(alreadySaved ? `Removed from saved` : `Saved: ${job.title}`);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentSessionToken}`,
      };
      if (alreadySaved) {
        await fetch(`/api/saved-jobs/${jobKey}`, { method: 'DELETE', headers });
      } else {
        const isExternal = job.source !== 'direct_recruiter' && job.source !== 'arivupro_exclusive';
        await fetch('/api/saved-jobs', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            job_id: isExternal ? undefined : job.id,
            external_job_id: isExternal ? job.id : undefined,
            job_title: job.title,
            company: job.company,
            location: job.location,
            job_type: job.jobType,
            source: job.source,
            apply_url: job.sourceUrl || '',
          }),
        });
      }
    } catch {
      // Revert on failure
      setSavedJobIds(prev => {
        const next = new Set(prev);
        if (alreadySaved) next.add(jobKey); else next.delete(jobKey);
        return next;
      });
    }
  };

  const isJobsTab = (currentTab as string) === 'jobs' || currentTab === 'articleship' || currentTab === 'internships';

  const JOBS_PER_PAGE = 20;

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const q = filters.search.toLowerCase();
      const matchSearch = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.mandatorySkills.some(s => s.toLowerCase().includes(q));
      const matchType = !filters.type || j.jobType.toLowerCase().includes(filters.type.toLowerCase());
      const KNOWN_CITIES = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Chennai', 'Hyderabad', 'Pune', 'Gurugram', 'Ahmedabad', 'Jaipur', 'Remote'];
      const matchCity = filters.city.length === 0 ? true : filters.city.some(c =>
        c === 'other' ? !KNOWN_CITIES.includes(j.city) : j.city === c
      );
      const KNOWN_QUALS = ['CA', 'CMA India', 'CS', 'ACCA', 'CFA', 'US CPA', 'US CMA', 'B.Com / M.Com'];
      const matchQual = filters.qualification.length === 0 ? true : filters.qualification.some(q =>
        q === 'other' ? !j.qualifications?.some(jq => KNOWN_QUALS.includes(jq as string)) : j.qualifications?.includes(q as any)
      );
      const matchWorkplace = filters.workplace.length === 0 || filters.workplace.includes(j.workplaceType);
      const matchDepartment = !filters.department || j.department === filters.department;
      const ALL_CAT_KEYS = ['ca-articleship','cma-articleship','cs-training','internship','big4','fpa-finance','taxation','audit','investment-banking','compliance','acca-cfa','remote'];
      const matchCategory = filters.category.length === 0 ? true : filters.category.some(cat =>
        cat === 'other' ? !ALL_CAT_KEYS.some(k => matchesCategory(j, k)) : matchesCategory(j, cat)
      );
      const matchExperience = !filters.experience || j.experienceLevel === filters.experience;
      const matchRecency = (() => {
        if (!filters.recency || !j.postedDate) return true;
        const posted = new Date(j.postedDate).getTime();
        const now = Date.now();
        const msPerDay = 86400000;
        if (filters.recency === 'Last 24 hours') return now - posted <= msPerDay;
        if (filters.recency === 'Last 3 days') return now - posted <= 3 * msPerDay;
        if (filters.recency === 'Last 7 days') return now - posted <= 7 * msPerDay;
        if (filters.recency === 'Last 14 days') return now - posted <= 14 * msPerDay;
        return true;
      })();
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
      return matchSearch && matchType && matchCity && matchQual && matchWorkplace && matchSalary && matchDepartment && matchCategory && matchExperience && matchRecency;
    });
  }, [jobs, filters, currentTab]);

  // Reset to page 1 whenever filters or tab changes
  React.useEffect(() => { setJobPage(1); }, [filters, currentTab]);

  const pagedJobs = useMemo(() => {
    const start = (jobPage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [filteredJobs, jobPage]);

  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);

  const appliedIds = useMemo(() => new Set(applications.map(a => a.jobId)), [applications]);

  return (
    <Routes>
      {/* Deep-link job detail pages — must come before the catch-all */}
      <Route path="/jobs/:company/:title/:id" element={<JobDetailPage />} />
      <Route path="/internships/:company/:title/:id" element={<JobDetailPage />} />
      <Route path="/articleship/:company/:title/:id" element={<JobDetailPage />} />

      {/* Existing SPA — all other paths */}
      <Route path="*" element={
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
        onTabChange={navigateToTab}
        onBack={goBack}
        canGoBack={canGoBack}
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
          background: 'rgba(10,24,16,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={() => setShowRecruiterPortal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460,
            boxShadow: '0 32px 80px rgba(10,24,16,0.28)',
            overflow: 'hidden',
          }}>
            {/* Header band */}
            <div style={{ background: '#0f2419', padding: '28px 32px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img src="/logo-white.png" alt="ArivuPro" style={{ height: 36, width: 'auto', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Recruit Finance Talent</div>
                  <div style={{ fontSize: 12, color: '#86efac', fontWeight: 500, marginTop: 3 }}>ArivuPro Employer Portal</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#d1fae5', margin: '14px 0 0', lineHeight: 1.6 }}>
                Access pre-vetted CA, ACCA, CFA, CS & CMA professionals through India's dedicated finance placement network.
              </p>
            </div>

            {/* Features list */}
            <div style={{ padding: '20px 32px', borderBottom: '1px solid #f1f5f9' }}>
              {[
                'AI-matched candidates with verified qualifications',
                'Direct access to articleship & full-time hiring',
                'Post jobs, review applicants, advance pipeline',
                'MoU partnership for Big 4 & top-tier firms',
              ].map(pt => (
                <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{pt}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ padding: '20px 32px 24px', display: 'flex', gap: 10 }}>
              <button
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center', fontSize: 14, padding: '11px 0' }}
                onClick={() => { setShowRecruiterPortal(false); setShowRecruiterSignup(true); }}
              >
                Create Account →
              </button>
              <button
                className="btn-outline"
                style={{ flex: 1, justifyContent: 'center', fontSize: 14, padding: '11px 0' }}
                onClick={() => { setShowRecruiterPortal(false); setAuthModal({ open: true, mode: 'login', role: 'student' }); }}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login — full page, triggered by ?admin in URL */}
      {showAdminLogin && auth.role !== 'admin' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#f0faf4' }}>
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
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          overflowY: 'auto',
        }} onClick={() => setShowRecruiterSignup(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, padding: '24px 24px', flexShrink: 0 }}>
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
              setFilters(prev => ({ ...prev, search: query, city: location ? [location] : [] }));
              document.getElementById('job-feed-anchor')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onCompanyClick={(companyName) => {
              setFilters(prev => ({ ...prev, search: companyName }));
              setCurrentTab('jobs');
              setTimeout(() => document.getElementById('job-feed-anchor')?.scrollIntoView({ behavior: 'smooth' }), 100);
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

            {/* Articleship strip promo */}
            {currentTab === 'articleship' && (
              <PromoSlot placement="articleship_header" context={{}} />
            )}

            <JobSearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              totalCount={filteredJobs.length}
              jobType={currentTab === 'articleship' ? 'articleship' : currentTab === 'internships' ? 'internships' : 'all'}
            />

            {/* Sidebar + feed layout */}
            <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 24px' }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

                {/* LEFT: Filter sidebar — rendered by JobSearchFilters via portal */}
                <div className="filter-sidebar" style={{
                  width: 220, flexShrink: 0,
                  background: '#fff', borderRadius: 14,
                  border: '1px solid #e5e7eb',
                  padding: '20px 18px',
                  position: 'sticky', top: 120,
                  maxHeight: 'calc(100vh - 140px)',
                  overflowY: 'auto',
                }}>
                  <FilterSidebar
                    filters={filters}
                    onFiltersChange={setFilters}
                    jobType={currentTab === 'articleship' ? 'articleship' : currentTab === 'internships' ? 'internships' : 'all'}
                  />
                </div>

                {/* RIGHT: Job list */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {currentTab === 'articleship' && (
                    <div style={{ marginBottom: 20 }}>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>Articleship Openings</h2>
                      <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>CA Articleship positions from ICAI registered firms across India</p>
                    </div>
                  )}
                  {currentTab === 'internships' && (
                    <div style={{ marginBottom: 20 }}>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>Finance Internships</h2>
                      <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Paid internships for finance students — B.Com, M.Com, MBA and more</p>
                    </div>
                  )}

                  {filteredJobs.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
                        Showing <span style={{ fontWeight: 800, color: '#0f2419' }}>{(jobPage - 1) * JOBS_PER_PAGE + 1}–{Math.min(jobPage * JOBS_PER_PAGE, filteredJobs.length)}</span> of <span style={{ fontWeight: 800, color: '#0f2419' }}>{filteredJobs.length}</span> jobs
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                        Updated just now
                      </div>
                    </div>
                  )}

                  {filteredJobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                      <div style={{ fontWeight: 700, color: '#0f2419', marginBottom: 6 }}>No jobs found</div>
                      <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>Try adjusting your filters</p>
                      <button className="btn-outline" onClick={() => setFilters({ search: '', type: '', city: [], qualification: [], workplace: [], salary: '', department: '', category: [], experience: '', recency: '' })}>Clear filters</button>
                    </div>
                  ) : (
                    <>
                      <div className="jobs-grid">
                        {pagedJobs.map(job => (
                          <JobCard key={job.id} job={job} isSaved={savedJobIds.has(job.id)} onSaveToggle={auth.role === 'student' ? handleSaveToggle : undefined} />
                        ))}
                      </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 32, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => { setJobPage(p => Math.max(1, p - 1)); document.getElementById('job-feed-anchor')?.scrollIntoView({ behavior: 'smooth' }); }}
                        disabled={jobPage === 1}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: jobPage === 1 ? '#f9fafb' : '#fff', color: jobPage === 1 ? '#d1d5db' : '#374151', fontWeight: 700, fontSize: 13, cursor: jobPage === 1 ? 'not-allowed' : 'pointer', fontFamily: 'Manrope, sans-serif' }}
                      >← Prev</button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - jobPage) <= 2)
                        .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, idx) => p === '...' ? (
                          <span key={`dots-${idx}`} style={{ padding: '8px 4px', color: '#9ca3af', fontSize: 13 }}>…</span>
                        ) : (
                          <button key={p}
                            onClick={() => { setJobPage(p as number); document.getElementById('job-feed-anchor')?.scrollIntoView({ behavior: 'smooth' }); }}
                            style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid', borderColor: p === jobPage ? '#1a7a4a' : '#e5e7eb', background: p === jobPage ? '#1a7a4a' : '#fff', color: p === jobPage ? '#fff' : '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
                          >{p}</button>
                        ))
                      }

                      <button
                        onClick={() => { setJobPage(p => Math.min(totalPages, p + 1)); document.getElementById('job-feed-anchor')?.scrollIntoView({ behavior: 'smooth' }); }}
                        disabled={jobPage === totalPages}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: jobPage === totalPages ? '#f9fafb' : '#fff', color: jobPage === totalPages ? '#d1d5db' : '#374151', fontWeight: 700, fontSize: 13, cursor: jobPage === totalPages ? 'not-allowed' : 'pointer', fontFamily: 'Manrope, sans-serif' }}
                      >Next →</button>
                    </div>
                  )}
                    </>
                  )}
                </div>{/* end job list */}
              </div>{/* end flex row */}
              <style>{`
                .jobs-grid { display: grid; gap: 14px; grid-template-columns: 1fr; }
                @media (min-width: 900px) { .jobs-grid { grid-template-columns: 1fr 1fr; } }
                @media (max-width: 768px) {
                  .filter-sidebar { display: none !important; }
                }
              `}</style>
            </div>
          </>
        )}

        {/* ── COMPANIES TAB ── */}
        {currentTab === 'companies' && !selectedCompany && (
          <CompanyDirectory onSelectCompany={setSelectedCompany} />
        )}

        {currentTab === 'companies' && selectedCompany && (
          <CompanyProfileFromApi
            company={selectedCompany}
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

        {/* ── STUDENT: DASHBOARD ── */}
        {auth.role === 'student' && currentTab === 'dashboard' && (
          <StudentDashboard
            student={student}
            applications={applications}
            savedJobIds={savedJobIds}
            jobs={jobs}
            onGoToTab={(tab) => navigateToTab(tab as NavTab)}
            onOpenProfile={() => navigateToTab('profile')}
            onViewJob={setSelectedJob}
          />
        )}

        {/* ── STUDENT: PROFILE ── */}
        {auth.role === 'student' && currentTab === 'profile' && (
          <StudentProfile
            presentation="page"
            student={student}
            onUpdate={(s) => {
              setStudent(s);
              localStorage.setItem('arivupro_student_profile', JSON.stringify(s));
              if (studentSessionToken) {
                fetch('/api/students/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentSessionToken}` },
                  body: JSON.stringify({
                    full_name: s.name,
                    phone: s.phone,
                    primary_course: s.primaryCourse,
                    current_level: s.currentLevel,
                    qualifications_completed: s.qualificationsCompleted,
                    articleship_months: s.articleshipCompletedMonths,
                    key_skills: s.keySkills,
                    preferred_locations: s.preferredLocations,
                    expected_salary_lpa: s.expectedSalaryLPA,
                    target_roles: s.targetRoles,
                    about_bio: s.aboutBio,
                    resume_url: s.resumeFileName,
                    arivupro_student_id: s.arivuproStudentId,
                    enrollment_cohort: s.enrollmentCohort,
                    attempt_count: s.attemptCount,
                    icitss_completed: s.icitssCompleted,
                    linkedin_url: s.linkedinUrl,
                    joining_availability: s.joiningAvailability,
                    willing_to_relocate: s.willingToRelocate,
                    graduation_degree: s.graduationDegree,
                    graduation_college: s.graduationCollege,
                    graduation_year: s.graduationYear,
                    graduation_percent: s.graduationPercent,
                    twelfth_percent: s.twelfthPercent,
                    articleship_firm: s.articleshipFirm,
                    articleship_firm_type: s.articleshipFirmType,
                    articleship_areas: s.articleshipAreas,
                    work_experience: s.workExperience,
                    internship_experience: s.internshipExperience,
                    projects: s.projects,
                    certifications: s.certifications,
                  }),
                }).catch(() => {});
              }
              showToast('✅ Profile updated!');
            }}
            onClose={goBack}
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
              openProfileSignal={recruiterProfileSignal}
            />
          )
        )}

        {/* ── ADMIN LAYOUT (sidebar + content) ── */}
        {auth.role === 'admin' && (
          <div style={{ display: 'flex', minHeight: 'calc(100vh - 112px)', background: '#f3f4f2', position: 'relative' }}>

            {/* Mobile sidebar toggle button */}
            <button
              onClick={() => setAdminSidebarOpen(o => !o)}
              style={{
                display: 'none',
                position: 'fixed', bottom: 20, left: 20, zIndex: 300,
                width: 44, height: 44, borderRadius: 10,
                background: '#163d2e', border: 'none', cursor: 'pointer',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(22,61,46,0.4)',
              }}
              className="admin-sidebar-toggle"
              aria-label="Toggle menu"
            >
              <span style={{ color: '#fff', fontSize: 20 }}>{adminSidebarOpen ? '✕' : '☰'}</span>
            </button>

            {/* Mobile overlay */}
            {adminSidebarOpen && (
              <div
                onClick={() => setAdminSidebarOpen(false)}
                style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199 }}
                className="admin-overlay"
              />
            )}

            {/* Sidebar */}
            <aside
              className={`admin-sidebar${adminSidebarOpen ? ' admin-sidebar-open' : ''}`}
              style={{ width: 232, flexShrink: 0, background: '#163d2e', display: 'flex', flexDirection: 'column', padding: '16px 12px' }}>

              {/* Brand chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 16px', borderBottom: '1px solid rgba(255,255,255,.12)', marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 6, background: '#fff', color: '#163d2e', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>AP</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.2 }}>ArivuPro</div>
                  <div style={{ fontSize: 12, color: '#a9c4b6', marginTop: 2 }}>Admin console</div>
                </div>
              </div>

              {/* Nav */}
              <nav style={{ flex: 1 }}>
                {/* Dashboard (no group label) */}
                {(() => {
                  const active = currentTab === 'admin-dashboard';
                  return (
                    <button onClick={() => { navigateToTab('admin-dashboard'); setAdminSidebarOpen(false); }} aria-current={active ? 'page' : undefined} className={`adm-nav-btn${active ? ' adm-nav-active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: 40, padding: '0 10px', border: 'none', borderRadius: 6, background: active ? 'rgba(255,255,255,.14)' : 'transparent', color: active ? '#fff' : '#d5e2db', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'Manrope, sans-serif', marginBottom: 2 }}>
                      <span style={{ color: active ? '#fff' : '#9fbcae', flexShrink: 0 }}><DashboardIcon /></span>Dashboard
                    </button>
                  );
                })()}

                {/* People */}
                <div style={{ fontSize: 12, fontWeight: 600, color: '#7f9e90', padding: '14px 10px 4px' }}>People</div>
                {[
                  { id: 'admin-students' as NavTab, label: 'Students', icon: <StudentsIcon /> },
                  { id: 'admin-recruiters' as NavTab, label: 'Recruiters', icon: <RecruitersIcon />, badge: adminPendingCount > 0 ? `${adminPendingCount} to approve` : null },
                ].map(item => {
                  const active = currentTab === item.id;
                  return (
                    <button key={item.id} onClick={() => { navigateToTab(item.id); setAdminSidebarOpen(false); }} aria-current={active ? 'page' : undefined} className={`adm-nav-btn${active ? ' adm-nav-active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: 40, padding: '0 10px', border: 'none', borderRadius: 6, background: active ? 'rgba(255,255,255,.14)' : 'transparent', color: active ? '#fff' : '#d5e2db', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'Manrope, sans-serif', marginBottom: 2 }}>
                      <span style={{ color: active ? '#fff' : '#9fbcae', flexShrink: 0 }}>{item.icon}</span>
                      {item.label}
                      {item.badge && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#163d2e', background: '#f5a623', borderRadius: 10, padding: '1px 7px', whiteSpace: 'nowrap' }}>{item.badge}</span>}
                    </button>
                  );
                })}

                {/* Listings */}
                <div style={{ fontSize: 12, fontWeight: 600, color: '#7f9e90', padding: '14px 10px 4px' }}>Listings</div>
                {[
                  { id: 'admin-jobs' as NavTab, label: 'Job postings', icon: <JobPostsIcon /> },
                  { id: 'admin-companies' as NavTab, label: 'Companies', icon: <CompaniesIcon /> },
                ].map(item => {
                  const active = currentTab === item.id;
                  return (
                    <button key={item.id} onClick={() => { navigateToTab(item.id); setAdminSidebarOpen(false); }} aria-current={active ? 'page' : undefined} className={`adm-nav-btn${active ? ' adm-nav-active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: 40, padding: '0 10px', border: 'none', borderRadius: 6, background: active ? 'rgba(255,255,255,.14)' : 'transparent', color: active ? '#fff' : '#d5e2db', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'Manrope, sans-serif', marginBottom: 2 }}>
                      <span style={{ color: active ? '#fff' : '#9fbcae', flexShrink: 0 }}>{item.icon}</span>{item.label}
                    </button>
                  );
                })}

                {/* Placement */}
                <div style={{ fontSize: 12, fontWeight: 600, color: '#7f9e90', padding: '14px 10px 4px' }}>Placement</div>
                {(() => {
                  const active = currentTab === 'crm';
                  return (
                    <button onClick={() => { navigateToTab('crm'); setAdminSidebarOpen(false); }} aria-current={active ? 'page' : undefined} className={`adm-nav-btn${active ? ' adm-nav-active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: 40, padding: '0 10px', border: 'none', borderRadius: 6, background: active ? 'rgba(255,255,255,.14)' : 'transparent', color: active ? '#fff' : '#d5e2db', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'Manrope, sans-serif', marginBottom: 2 }}>
                      <span style={{ color: active ? '#fff' : '#9fbcae', flexShrink: 0 }}><PlacementCrmIcon /></span>Placement CRM
                    </button>
                  );
                })()}

                {/* System */}
                <div style={{ fontSize: 12, fontWeight: 600, color: '#7f9e90', padding: '14px 10px 4px' }}>System</div>
                {[
                  { id: 'scraper' as NavTab, label: 'Job scraper', icon: <ScraperIcon /> },
                  { id: 'synced-jobs' as NavTab, label: 'Synced jobs', icon: <SyncedJobsIcon /> },
                ].map(item => {
                  const active = currentTab === item.id;
                  return (
                    <button key={item.id} onClick={() => { navigateToTab(item.id); setAdminSidebarOpen(false); }} aria-current={active ? 'page' : undefined} className={`adm-nav-btn${active ? ' adm-nav-active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: 40, padding: '0 10px', border: 'none', borderRadius: 6, background: active ? 'rgba(255,255,255,.14)' : 'transparent', color: active ? '#fff' : '#d5e2db', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'Manrope, sans-serif', marginBottom: 2 }}>
                      <span style={{ color: active ? '#fff' : '#9fbcae', flexShrink: 0 }}>{item.icon}</span>{item.label}
                    </button>
                  );
                })}
              </nav>

              {/* Footer */}
              <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 8 }}>
                {(() => {
                  const active = currentTab === 'admin-profile';
                  return (
                    <button onClick={() => { navigateToTab('admin-profile'); setAdminSidebarOpen(false); }} aria-current={active ? 'page' : undefined} className={`adm-nav-btn${active ? ' adm-nav-active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: 40, padding: '0 10px', border: 'none', borderRadius: 6, background: active ? 'rgba(255,255,255,.14)' : 'transparent', color: active ? '#fff' : '#d5e2db', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'Manrope, sans-serif', marginBottom: 6 }}>
                      <span style={{ color: active ? '#fff' : '#9fbcae', flexShrink: 0 }}><ProfileIcon /></span>My profile
                    </button>
                  );
                })()}
                <div style={{ padding: '0 10px 4px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e4ede8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{auth.name}</div>
                  <div style={{ fontSize: 12, color: '#8fae9f', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{auth.email}</div>
                </div>
              </div>
            </aside>

            {/* Admin content */}
            <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
              {currentTab === 'scraper' && (
                <ScraperDashboard
                  onTriggerScrape={async (src) => {
                    showToast(`Syncing ${src || 'all sources'}…`);
                    const { adminFetch } = await import('./lib/supabase/auth');
                    const res = await adminFetch('/api/scrape/trigger', {
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

              {currentTab === 'synced-jobs' && <SyncedJobsTab />}
              {currentTab === 'crm' && (
                <PlacementCrmDashboard onSyncAll={async () => {
                  const { adminFetch } = await import('./lib/supabase/auth');
                  const res = await adminFetch('/api/crm/sync-all', { method: 'POST' });
                  if (!res.ok) throw new Error('Sync failed');
                  return res.json();
                }} />
              )}
              {currentTab === 'admin-profile' && (
                <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 24px' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', marginBottom: 24 }}>My Profile</div>
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 28, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1a7a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fede6d', flexShrink: 0 }}>
                        {auth.name ? auth.name.split(' ').map((n: string) => n[0]).slice(0,2).join('').toUpperCase() : 'A'}
                      </div>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f2419' }}>{auth.name || 'Admin'}</div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{auth.email}</div>
                        <span style={{ display: 'inline-block', marginTop: 6, padding: '2px 10px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>ADMINISTRATOR</span>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
                      {[
                        { label: 'Full Name', value: auth.name || '—' },
                        { label: 'Email', value: auth.email || '—' },
                        { label: 'Role', value: 'Super Admin' },
                        { label: 'Portal', value: 'ArivuPro Finance Career Portal' },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f9fafb' }}>
                          <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>{label}</span>
                          <span style={{ fontSize: 13, color: '#0f2419', fontWeight: 700 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: '#f0faf4', border: '1px solid #d7f4ea', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#1a7a4a', fontWeight: 600 }}>
                    To change your password or email, use Supabase Auth or contact your platform administrator.
                  </div>
                </div>
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
                  onNavigate={navigateToTab}
                  onPendingCountChange={setAdminPendingCount}
                />
              )}
            </div>

            <style>{`
              .adm-nav-btn:hover { background: rgba(255,255,255,.07) !important; color: #fff !important; }
              .adm-nav-btn:hover span { color: #fff !important; }
              .adm-nav-btn:focus-visible { outline: 2px solid #f5a623; outline-offset: 2px; }
              .adm-nav-active { background: rgba(255,255,255,.14) !important; }
              @media (max-width: 768px) {
                .admin-sidebar {
                  position: fixed !important;
                  top: 0; left: 0; bottom: 0;
                  z-index: 200;
                  transform: translateX(-100%);
                  transition: transform 0.25s ease;
                  overflow-y: auto;
                }
                .admin-sidebar.admin-sidebar-open {
                  transform: translateX(0);
                }
                .admin-sidebar-toggle {
                  display: flex !important;
                }
                .admin-overlay {
                  display: block !important;
                }
              }
            `}</style>
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
              onApply={handleApply}
              appliedIds={appliedIds}
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
        isSaved={selectedJob ? savedJobIds.has(selectedJob.id) : false}
        onSaveToggle={auth.role === 'student' ? handleSaveToggle : undefined}
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
      {false && (
        <StudentProfile
          student={student}
          onUpdate={(s) => {
            setStudent(s);
            localStorage.setItem('arivupro_student_profile', JSON.stringify(s));
            // Also persist to backend if we have a session token
            if (studentSessionToken) {
              fetch('/api/students/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentSessionToken}` },
                body: JSON.stringify({
                  full_name: s.name,
                  phone: s.phone,
                  primary_course: s.primaryCourse,
                  current_level: s.currentLevel,
                  qualifications_completed: s.qualificationsCompleted,
                  articleship_months: s.articleshipCompletedMonths,
                  key_skills: s.keySkills,
                  preferred_locations: s.preferredLocations,
                  expected_salary_lpa: s.expectedSalaryLPA,
                  target_roles: s.targetRoles,
                  about_bio: s.aboutBio,
                  resume_url: s.resumeFileName,
                  arivupro_student_id: s.arivuproStudentId,
                  enrollment_cohort: s.enrollmentCohort,
                  attempt_count: s.attemptCount,
                  icitss_completed: s.icitssCompleted,
                  linkedin_url: s.linkedinUrl,
                  joining_availability: s.joiningAvailability,
                  willing_to_relocate: s.willingToRelocate,
                  graduation_degree: s.graduationDegree,
                  graduation_college: s.graduationCollege,
                  graduation_year: s.graduationYear,
                  graduation_percent: s.graduationPercent,
                  twelfth_percent: s.twelfthPercent,
                  articleship_firm: s.articleshipFirm,
                  articleship_firm_type: s.articleshipFirmType,
                  articleship_areas: s.articleshipAreas,
                  work_experience: s.workExperience,
                  internship_experience: s.internshipExperience,
                  projects: s.projects,
                  certifications: s.certifications,
                }),
              }).catch(() => {});
            }
            navigateToTab('profile');
            showToast('✅ Profile updated!');
          }}
          onClose={goBack}
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
              <button onClick={() => { setShowProfileNudge(false); navigateToTab('profile'); }} style={{ flex: 2, padding: '11px 0', borderRadius: 999, border: 'none', background: 'linear-gradient(90deg,#0f2419,#1a7a4a)', fontSize: 14, fontWeight: 700, color: '#fede6d', cursor: 'pointer', fontFamily: 'Manrope,sans-serif' }}>Complete Profile →</button>
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
              <button onClick={() => { setApplyBlockJob(null); navigateToTab('profile'); }} style={{ flex: 2, padding: '11px 0', borderRadius: 999, border: 'none', background: 'linear-gradient(90deg,#0f2419,#1a7a4a)', fontSize: 14, fontWeight: 700, color: '#fede6d', cursor: 'pointer', fontFamily: 'Manrope,sans-serif' }}>Complete Profile →</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer — 100% matches arivupro.com */}
      <footer style={{ background: '#1b5234', color: '#fff', fontFamily: 'Manrope, sans-serif', marginTop: 80 }}>

        {/* ── Top section: Logo + 3 nav columns ── */}
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '60px 32px 48px', display: 'grid', gridTemplateColumns: '280px 1fr 1fr 1fr', gap: 48 }} className="footer-main-grid">

          {/* Col 1 — Logo + tagline + corporate office */}
          <div>
            <a href="https://arivupro.com" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', marginBottom: 18 }}>
              <img
                src="/logo-white.png"
                alt="ArivuPro Academy"
                style={{ height: 44, width: 'auto', display: 'block' }}
              />
            </a>
            <p style={{ fontSize: 13, color: '#c8e6d4', lineHeight: 1.65, margin: '0 0 20px', fontWeight: 400 }}>
              Commerce and finance education,<br />
              with a learning plan that fits your goals.
            </p>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f5c518', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Corporate Office</div>
            <p style={{ fontSize: 12, color: '#a8d4bc', lineHeight: 1.7, margin: '0 0 12px', fontWeight: 400 }}>
              <strong style={{ color: '#fff', fontWeight: 700 }}>Arivu Educational Consultants Private Limited</strong><br />
              2nd Floor, Sai Prema, Christ Lane No. 39,<br />
              Krishnanagar, Hosur Rd, Industrial Area,<br />
              Koramangala, Bengaluru, Karnataka – 560029.
            </p>
            <a href="https://maps.app.goo.gl/NKZB4khx59MVVyCUA" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#f5c518', textDecoration: 'underline', fontWeight: 600 }}>
              View on Google Maps
            </a>
          </div>

          {/* Col 2 — Professional Courses (2-column grid) */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f5c518', letterSpacing: '0.04em', marginBottom: 18 }}>Professional Courses</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
              {[
                ['CA',                  'https://www.arivupro.com/ca-coaching-classes-institute-center-in-bangalore'],
                ['CS',                  'https://www.arivupro.com/best-cs-coaching-classes-institute-center-in-bangalore'],
                ['CMA India',           'https://www.arivupro.com/best-icwa-cma-india-coaching-classes-institute-center-in-bangalore'],
                ['ACCA',                'https://www.arivupro.com/acca-coaching-classes-institute-center-in-bangalore'],
                ['CMA USA',             'https://www.arivupro.com/best-cma-usa-coaching-classes-institute-center-in-bangalore'],
                ['CPA US',              'https://www.arivupro.com/best-cpa-usa-coaching-classes-institute-center-in-bangalore'],
                ['CFA',                 'https://www.arivupro.com/cfa-course-in-bangalore'],
                ['FRM',                 'https://www.arivupro.com/frm-coaching-classes-in-bangalore'],
                ['Enrolled Agent (EA)', 'https://www.arivupro.com/enrolled-agent-course-in-bangalore'],
                ['CIA',                 'https://www.arivupro.com/cia-course-in-bangalore'],
              ].map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#c8e6d4', textDecoration: 'none', fontWeight: 400, lineHeight: 1.4 }}
                  className="ap-footer-link">
                  {label}
                </a>
              ))}
            </div>

            {/* ArivuPro ONE accent block */}
            <div style={{ marginTop: 20, borderLeft: '3px solid #f5c518', paddingLeft: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 3 }}>ArivuPro ONE</div>
              <div style={{ fontSize: 12, color: '#a8d4bc', marginBottom: 6 }}>B.Com with a professional pathway</div>
              <a href="https://www.arivupro.com/arivupro-one" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#f5c518', textDecoration: 'none', fontWeight: 700 }}
                className="ap-footer-link">
                Explore Integrated Programmes →
              </a>
            </div>
          </div>

          {/* Col 3 — Learn & Get Support */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f5c518', letterSpacing: '0.04em', marginBottom: 18 }}>Learn & Get Support</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Live & Recorded Classes',   'https://online.arivupro.com/learn'],
                ['Books & Study Materials',   'https://www.arivupro.com/shop'],
                ['Articleship Opportunities', 'https://articleship.arivupro.com/'],
                ['Student Login',             'https://online.arivupro.com/learn/account/signin'],
                ['Help Portal',               'https://help.arivupro.com/portal/en/kb'],
                ['Track Book Delivery',       'https://arivupro.shiprocket.co/'],
              ].map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#c8e6d4', textDecoration: 'none', fontWeight: 400 }}
                  className="ap-footer-link">
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Col 4 — Discover ArivuPro */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f5c518', letterSpacing: '0.04em', marginBottom: 18 }}>Discover ArivuPro</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['About ArivuPro',    'https://www.arivupro.com/about-us'],
                ['Blogs & Resources', 'https://www.arivupro.com/blogs'],
                ['Contact Us',        'https://www.arivupro.com/contact'],
                ['Careers',           'https://www.arivupro.com/careers'],
              ].map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#c8e6d4', textDecoration: 'none', fontWeight: 400 }}
                  className="ap-footer-link">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Mid section: Learning Centres + Admissions ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }} className="footer-mid-grid">

            {/* Learning Centres */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#f5c518', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Visit Our Learning Centres</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { city: 'Bengaluru', areas: ['Koramangala', 'Malleshwaram'] },
                  { city: 'Chennai',   areas: ['Nungambakkam', 'Tambaram'] },
                  { city: 'Coimbatore', areas: ['Ram Nagar'] },
                ].map(({ city, areas }) => (
                  <div key={city}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{city}</div>
                    {areas.map(a => (
                      <div key={a} style={{ fontSize: 12, color: '#a8d4bc', lineHeight: 1.6 }}>{a}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Admissions & Support */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#f5c518', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Admissions & Support</div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 8 }}>
                <a href="tel:+919686665253" style={{ fontSize: 15, fontWeight: 700, color: '#fff', textDecoration: 'none' }} className="ap-footer-link">
                  +91 9686665253
                </a>
                <a href="mailto:help@arivupro.com" style={{ fontSize: 15, fontWeight: 700, color: '#fff', textDecoration: 'none' }} className="ap-footer-link">
                  help@arivupro.com
                </a>
              </div>
              <div style={{ fontSize: 12, color: '#a8d4bc' }}>10 AM – 8 PM · Open all days</div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar: Stay connected + social icons + legal ── */}
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 13, color: '#c8e6d4', fontWeight: 500 }}>Stay connected with ArivuPro.</span>
            <span style={{ fontSize: 11, color: '#7aad8e' }}>© 2026 ArivuPro Academy. All rights reserved.</span>
          </div>

          {/* Social icons — matching arivupro.com style */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {[
              { label: 'YouTube',   href: 'https://www.youtube.com/channel/UCP8wEbtqYPaPT6iS_9T6A1Q',
                svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75 15.5v-7l6.25 3.5-6.25 3.5z"/></svg> },
              { label: 'Instagram', href: 'https://www.instagram.com/arivupro/',
                svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8 0 3.2 0 3.6-.1 4.8-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1-3.2 0-3.6 0-4.8-.1-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.3 2.2 12c0-3.2 0-3.6.1-4.8C2.4 3.9 4 2.3 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zm0 2.2c-3.2 0-3.5 0-4.7.1-2.2.1-3.2 1.1-3.3 3.3C4 8.9 4 9.3 4 12c0 3.2 0 3.5.1 4.7.1 2.2 1.1 3.2 3.3 3.3C8.5 20 8.8 20 12 20c3.2 0 3.5 0 4.7-.1 2.2-.1 3.2-1.1 3.3-3.3.1-1.2.1-1.5.1-4.7 0-3.2 0-3.5-.1-4.7-.1-2.2-1.1-3.2-3.3-3.3C15.5 4.4 15.2 4.4 12 4.4zm0 3.6a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 6.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2zm5.2-6.8a.95.95 0 1 1-1.9 0 .95.95 0 0 1 1.9 0z"/></svg> },
              { label: 'Facebook',  href: 'https://www.facebook.com/arivupro/',
                svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.27h3.32l-.53 3.5h-2.79V24C19.62 23.1 24 18.1 24 12.07z"/></svg> },
              { label: 'X',         href: 'https://x.com/ArivuPro',
                svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
              { label: 'WhatsApp',  href: 'https://whatsapp.com/channel/0029Va4FvCxHVvTTyU8PvP17',
                svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                title={s.label}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                className="ap-footer-social">
                {s.svg}
              </a>
            ))}
          </div>

          {/* Legal links */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              ['Privacy Policy',     'https://www.arivupro.com/privacy-policy'],
              ['Terms & Conditions', 'https://www.arivupro.com/terms-and-conditions'],
              ['Refund Policy',      'https://www.arivupro.com/refund-policy'],
            ].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#7aad8e', textDecoration: 'none', fontWeight: 500 }}
                className="ap-footer-link">
                {label}
              </a>
            ))}
          </div>
        </div>

        <style>{`
          .ap-footer-link:hover { color: #f5c518 !important; }
          .ap-footer-social:hover { background: rgba(245,197,24,0.25) !important; }
          @media (max-width: 900px) {
            .footer-main-grid { grid-template-columns: 1fr 1fr !important; }
            .footer-mid-grid  { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 640px) {
            .footer-main-grid { grid-template-columns: 1fr !important; padding: 32px 20px 28px !important; gap: 28px !important; }
            .footer-mid-grid  { padding: 24px 20px !important; gap: 24px !important; }
          }
          @media (max-width: 540px) {
            .footer-main-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </footer>

      {/* ── GLOBAL MOBILE BOTTOM NAV (student only) ── */}
      {auth.role === 'student' && (
        <>
          <nav style={{ display: 'none' }} className="global-bottom-nav">
            {([
              { icon: <Home size={20} />, label: 'Home', tab: 'dashboard' as NavTab },
              { icon: <Briefcase size={20} />, label: 'Apply', tab: 'jobs' as NavTab },
              { icon: <User size={20} />, label: 'Profile', tab: 'profile' as NavTab },
            ] as { icon: React.ReactNode; label: string; tab: NavTab }[]).map(item => (
              <button
                key={item.tab}
                onClick={() => navigateToTab(item.tab)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 3, background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
                  color: currentTab === item.tab ? '#1a7a4a' : '#6b7280', padding: '8px 0',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <style>{`
            @media (max-width: 768px) {
              .global-bottom-nav {
                display: flex !important;
                position: fixed !important;
                bottom: 0 !important; left: 0 !important; right: 0 !important;
                height: 64px !important;
                background: #fff !important;
                border-top: 1px solid #e5e7eb !important;
                z-index: 200 !important;
                align-items: stretch !important;
              }
            }
            @media (min-width: 769px) {
              .global-bottom-nav { display: none !important; }
            }
          `}</style>
        </>
      )}
    </div>
      } />
    </Routes>
  );
}
