import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { JobListing, JobApplication, StudentProfile, ScraperSourceStatus, CrmPipelineMetrics } from './src/types/index.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize Gemini Client:', err);
  }
}

// In-Memory Seed Data
const INITIAL_JOBS: JobListing[] = [
  {
    id: 'job-arv-001',
    title: 'Audit & Assurance Associate (US / Global Entity)',
    company: 'Deloitte India (Offshore Delivery)',
    logoText: 'D',
    location: 'Bangalore, Karnataka',
    city: 'Bangalore',
    workplaceType: 'Hybrid',
    jobType: 'Full-Time',
    experienceLevel: '0-1 yr (Fresher)',
    minExperienceYears: 0,
    salaryText: '₹7.5 - ₹9.5 LPA + Performance Bonus',
    salaryMinLPA: 7.5,
    salaryMaxLPA: 9.5,
    qualifications: ['ACCA', 'US_CPA', 'CA_INTER'],
    mandatorySkills: ['US GAAP', 'PCAOB Standards', 'Financial Audit', 'Advanced Excel'],
    goodToHaveSkills: ['Alteryx', 'SAP ERP', 'PowerBI'],
    description: 'Exclusive campus hiring drive for ArivuPro Academy ACCA Affiliates and US CPA candidates. You will execute statutory audit testing for Fortune 500 US clients, substantiate trial balances, and perform analytical reviews.',
    keyResponsibilities: [
      'Substantive testing of revenue, cash equivalents, and complex accruals',
      'Evaluation of Internal Controls over Financial Reporting (ICFR)',
      'Direct liaison with US audit managers and client finance controllers',
      'Preparation of audit working papers in Deloitte EMS platform'
    ],
    source: 'arivupro_exclusive',
    arivuproExclusive: true,
    isUrgent: true,
    postedDate: '2026-11-02',
    deadlineDate: '2026-11-20',
    applicantsCount: 34,
    department: 'Audit & Assurance',
    crmDriveCode: 'ARV-DEL-BLR-NOV26'
  },
  {
    id: 'job-arv-002',
    title: 'Statutory Audit Assistant / CA Articleship Trainee',
    company: 'BDO India LLP',
    logoText: 'BDO',
    location: 'Bangalore / Chennai',
    city: 'Bangalore',
    workplaceType: 'Onsite',
    jobType: 'Articleship / Industrial Training',
    experienceLevel: 'Articleship / 0 yrs',
    minExperienceYears: 0,
    salaryText: '₹22,000 - ₹30,000 / month Stipend + Exam Leave',
    salaryMinLPA: 3.0,
    salaryMaxLPA: 3.6,
    qualifications: ['CA_INTER'],
    mandatorySkills: ['Ind AS', 'Tax Audit', 'Vouching & Verification', 'TallyPrime', 'Excel'],
    goodToHaveSkills: ['CARO 2020 Compliance', 'Direct Tax'],
    description: 'Articleship position exclusively for ArivuPro CA Intermediate cleared candidates (Both groups or Single group). Structured 2-year practical training with exposure to listed manufacturing and SaaS audits.',
    keyResponsibilities: [
      'Audit of physical inventory verification and fixed asset registers',
      'Preparation of Form 3CD tax audit annexures and TDS reconciliations',
      'Drafting management representations and risk assessment memos'
    ],
    source: 'arivupro_exclusive',
    arivuproExclusive: true,
    isUrgent: false,
    postedDate: '2026-11-01',
    deadlineDate: '2026-11-25',
    applicantsCount: 52,
    department: 'Articleship Desk',
    crmDriveCode: 'ARV-BDO-ART-2026'
  },
  {
    id: 'job-arv-003',
    title: 'Financial Analyst - FP&A & Corporate Finance',
    company: 'Goldman Sachs Services',
    logoText: 'GS',
    location: 'Bangalore, Karnataka',
    city: 'Bangalore',
    workplaceType: 'Hybrid',
    jobType: 'Full-Time',
    experienceLevel: '1-3 yrs',
    minExperienceYears: 1,
    salaryText: '₹14.0 - ₹18.5 LPA',
    salaryMinLPA: 14.0,
    salaryMaxLPA: 18.5,
    qualifications: ['CA', 'CFA', 'US_CMA', 'FINANCIAL_MODELING'],
    mandatorySkills: ['Financial Modeling', 'Variance Analysis', 'Budgeting & Forecasting', 'DCF Valuation'],
    goodToHaveSkills: ['SQL', 'Python for Finance', 'Tableau'],
    description: 'Seeking corporate finance professionals with strong quantitative foundation to manage global business unit budgeting, variance analysis, and executive board decks.',
    keyResponsibilities: [
      'Build dynamic 3-statement financial models and scenario sensitivities',
      'Analyze monthly P&L variance against operating budget targets',
      'Partner with division managing directors on capital allocation and head-count metrics'
    ],
    source: 'arivupro_exclusive',
    arivuproExclusive: true,
    isUrgent: true,
    postedDate: '2026-10-30',
    deadlineDate: '2026-11-18',
    applicantsCount: 41,
    department: 'FP&A & Corporate Finance',
    crmDriveCode: 'ARV-GS-FPA-2026'
  },
  {
    id: 'job-scr-001',
    title: 'Senior Associate - US Corporate Taxation',
    company: 'PwC Acceleration Center',
    logoText: 'PwC',
    location: 'Hyderabad / Bangalore',
    city: 'Hyderabad',
    workplaceType: 'Hybrid',
    jobType: 'Full-Time',
    experienceLevel: '1-3 yrs',
    minExperienceYears: 1.5,
    salaryText: '₹10.5 - ₹13.0 LPA',
    salaryMinLPA: 10.5,
    salaryMaxLPA: 13.0,
    qualifications: ['US_CPA', 'CA', 'ACCA'],
    mandatorySkills: ['US Form 1120', 'Form 1065', 'Federal & State Tax', 'OneSource'],
    goodToHaveSkills: ['GoSystem', 'Cross-border Withholding'],
    description: 'Scraped from PwC Global Careers. Focuses on federal, state, and partnership income tax compliance for multinational hedge funds and corporate entities.',
    keyResponsibilities: [
      'Prepare federal corporate income tax returns (Form 1120/1065)',
      'Calculate book-to-tax differences and state apportionment schedules',
      'Review foreign bank account reporting (FBAR) and Form 5471 attachments'
    ],
    source: 'big4_portal',
    sourceUrl: 'https://pwc.wd3.myworkdayjobs.com/Global_Experienced_Careers',
    arivuproExclusive: false,
    postedDate: '2026-11-03',
    deadlineDate: '2026-12-05',
    applicantsCount: 28,
    department: 'Taxation'
  },
  {
    id: 'job-scr-002',
    title: 'Management Accountant - Costing & Variance Analysis',
    company: 'Schneider Electric India',
    logoText: 'SE',
    location: 'Bangalore, Karnataka',
    city: 'Bangalore',
    workplaceType: 'Onsite',
    jobType: 'Full-Time',
    experienceLevel: '0-1 yr (Fresher)',
    minExperienceYears: 0,
    salaryText: '₹8.0 - ₹10.5 LPA',
    salaryMinLPA: 8.0,
    salaryMaxLPA: 10.5,
    qualifications: ['CMA_INDIA', 'US_CMA'],
    mandatorySkills: ['Standard Costing', 'Activity-Based Costing', 'SAP CO Module', 'Inventory Valuation'],
    goodToHaveSkills: ['PowerBI', 'Lean Six Sigma'],
    description: 'Scraped from Naukri Finance. Looking for ICMAI Qualified Cost Accountants or US CMA professionals to handle plant operational costing and gross margin optimization.',
    keyResponsibilities: [
      'Maintain standard cost master files for 200+ product SKUs',
      'Compute monthly manufacturing variances (Material, Labor, Overhead)',
      'Provide monthly CAPEX review and payback modeling for plant expansion'
    ],
    source: 'naukri',
    sourceUrl: 'https://www.naukri.com/finance-jobs',
    arivuproExclusive: false,
    postedDate: '2026-11-02',
    deadlineDate: '2026-11-28',
    applicantsCount: 19,
    department: 'FP&A & Corporate Finance'
  },
  {
    id: 'job-scr-003',
    title: 'Investment Banking Analyst - M&A Advisory',
    company: 'Avendus Capital',
    logoText: 'AC',
    location: 'Mumbai, Maharashtra',
    city: 'Mumbai',
    workplaceType: 'Onsite',
    jobType: 'Full-Time',
    experienceLevel: '0-1 yr (Fresher)',
    minExperienceYears: 0,
    salaryText: '₹16.0 - ₹22.0 LPA + Deal Bonus',
    salaryMinLPA: 16.0,
    salaryMaxLPA: 22.0,
    qualifications: ['CA', 'CFA', 'FINANCIAL_MODELING'],
    mandatorySkills: ['LBO Modeling', 'M&A Valuation', 'Pitchbook Preparation', 'Capital IQ'],
    goodToHaveSkills: ['Pitchbook', 'FactSet', 'Merger Modeling'],
    description: 'Scraped from Quintedge Finance Portal. Premier boutique investment bank seeking Rankholder CA or CFA L2/L3 candidates for sell-side technology and consumer M&A transactions.',
    keyResponsibilities: [
      'Build complex valuation models (DCF, Trading Multiples, Precedent Transactions)',
      'Prepare confidential information memorandums (CIM) and teasers',
      'Perform industry market sizing and competitive benchmarking'
    ],
    source: 'quintedge',
    sourceUrl: 'https://quintedge.com/jobs/investment-banking-analyst',
    arivuproExclusive: false,
    postedDate: '2026-11-03',
    deadlineDate: '2026-11-30',
    applicantsCount: 65,
    department: 'Investment Banking & M&A'
  },
  {
    id: 'job-scr-004',
    title: 'Financial Reporting Specialist (IFRS & Consolidation)',
    company: 'KPMG Global Services (KGS)',
    logoText: 'KPMG',
    location: 'Bangalore, Karnataka',
    city: 'Bangalore',
    workplaceType: 'Hybrid',
    jobType: 'Full-Time',
    experienceLevel: '1-3 yrs',
    minExperienceYears: 1,
    salaryText: '₹9.0 - ₹11.5 LPA',
    salaryMinLPA: 9.0,
    salaryMaxLPA: 11.5,
    qualifications: ['ACCA', 'CA', 'US_CPA'],
    mandatorySkills: ['IFRS 15', 'IFRS 16', 'Consolidation Accounting', 'Audit Support'],
    goodToHaveSkills: ['Oracle Financials', 'Workday'],
    description: 'Scraped from LinkedIn Jobs. Support EMEA and UK engagements with complex group consolidation, lease accounting adjustments under IFRS 16, and financial statement disclosures.',
    keyResponsibilities: [
      'Prepare intercompany eliminations and foreign currency translations',
      'Draft footnote disclosures for pension accounting and financial instruments',
      'Facilitate external audit reviews with statutory audit teams in London'
    ],
    source: 'linkedin',
    sourceUrl: 'https://www.linkedin.com/jobs/view/finance-ifrs-specialist',
    arivuproExclusive: false,
    postedDate: '2026-11-01',
    deadlineDate: '2026-11-22',
    applicantsCount: 38,
    department: 'Global Accounting (US GAAP/IFRS)'
  },
  {
    id: 'job-scr-005',
    title: 'Company Secretary & Compliance Associate',
    company: 'Grant Thornton Bharat LLP',
    logoText: 'GT',
    location: 'New Delhi / Gurgaon',
    city: 'Delhi NCR',
    workplaceType: 'Onsite',
    jobType: 'Full-Time',
    experienceLevel: '0-1 yr (Fresher)',
    minExperienceYears: 0,
    salaryText: '₹6.5 - ₹8.5 LPA',
    salaryMinLPA: 6.5,
    salaryMaxLPA: 8.5,
    qualifications: ['CS'],
    mandatorySkills: ['Companies Act 2013', 'MCA V3 Portal', 'SEBI LODR', 'Secretarial Audit'],
    goodToHaveSkills: ['FEMA Compliance', 'Drafting Board Resolutions'],
    description: 'Scraped from eFinancialCareers. Seeking qualified Company Secretary for corporate governance consulting, annual filings, RBI/FDI reporting, and board meeting management.',
    keyResponsibilities: [
      'Handle end-to-end secretarial compliance for 30+ private and public clients',
      'Filing of MGT-7, AOC-4, and DIR-12 with Registrar of Companies (RoC)',
      'Conducting secretarial audit and due diligence for private equity rounds'
    ],
    source: 'efinancialcareers',
    sourceUrl: 'https://www.efinancialcareers.com/jobs-india-compliance',
    arivuproExclusive: false,
    postedDate: '2026-10-29',
    deadlineDate: '2026-11-25',
    applicantsCount: 16,
    department: 'Risk & Compliance'
  },
  {
    id: 'job-scr-006',
    title: 'Senior Associate - Transfer Pricing & Cross-Border Tax',
    company: 'EY Global Delivery Services (GDS)',
    logoText: 'EY',
    location: 'Bangalore / Kochi',
    city: 'Bangalore',
    workplaceType: 'Hybrid',
    jobType: 'Full-Time',
    experienceLevel: '1-3 yrs',
    minExperienceYears: 1,
    salaryText: '₹10.0 - ₹12.5 LPA',
    salaryMinLPA: 10.0,
    salaryMaxLPA: 12.5,
    qualifications: ['CA', 'ACCA', 'US_CPA'],
    mandatorySkills: ['Transfer Pricing Documentation', 'OECD Guidelines', 'Benchmarking Studies', 'TPCatalyst'],
    goodToHaveSkills: ['BEPS Action Plans', 'Advance Pricing Agreements (APA)'],
    description: 'Scraped from Big 4 Careers. Opportunity for finance professionals to specialize in international economic analysis, arm’s length justification, and global Master File/Local File documentation.',
    keyResponsibilities: [
      'Conduct economic benchmarking using Prowess and RoyaltyStat databases',
      'Formulate functional, asset, and risk (FAR) profile analysis',
      'Draft transfer pricing study reports under Section 92D and OECD regulations'
    ],
    source: 'big4_portal',
    sourceUrl: 'https://eygbl.referrals.selectminds.com/',
    arivuproExclusive: false,
    postedDate: '2026-11-03',
    deadlineDate: '2026-11-27',
    applicantsCount: 22,
    department: 'Taxation'
  }
];

// Current Student Profile (Active ArivuPro Candidate Session)
let activeStudent: StudentProfile = {
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
  aboutBio: 'Passionate finance scholar at ArivuPro Academy with strong foundation in IFRS and US GAAP. Completed 18 months of intensive audit articleship handling manufacturing and IT services audits. Looking for high-impact roles in Big 4 or Global GCCs.',
  verifiedStudent: true,
  gpaOrScore: 'Distinction in SBR & AFM',
  resumeFileName: 'Rohan_Venkatesh_ArivuPro_ACCA_Resume.pdf'
};

// Seed Applications
let applications: JobApplication[] = [
  {
    id: 'app-arv-101',
    jobId: 'job-arv-001',
    jobTitle: 'Audit & Assurance Associate (US / Global Entity)',
    company: 'Deloitte India (Offshore Delivery)',
    location: 'Bangalore, Karnataka',
    studentId: 'stu-arv-9481',
    studentName: 'Rohan Venkatesh',
    studentRoll: 'ARV-2024-ACCA-882',
    studentCourse: 'ACCA & US CPA Dual Track',
    appliedDate: '2026-11-03',
    status: 'Technical Round',
    aiMatchScore: 94,
    matchGrade: 'Excellent',
    matchAnalysis: {
      qualificationFit: 96,
      skillsFit: 92,
      experienceFit: 94,
      strengths: [
        'Cleared ACCA Strategic Business Reporting (SBR)',
        'US CPA FAR & AUD exam components already passed',
        '18 months verified audit articleship in statutory vouching'
      ],
      gapAlerts: ['Alteryx workflow familiarity can be brushed up before Technical Round'],
      counselorRecommendation: 'Priority Candidate: Fast-track to Deloitte Campus hiring pool. High probability of offer release.'
    },
    crmLeadId: 'CRM-LEAD-DEL-4821',
    crmSyncStatus: 'Synced',
    assignedCounselor: 'Priya Sharma (ArivuPro Lead Placement Officer)',
    lastUpdated: '2026-11-04T08:30:00Z',
    interviewDate: '2026-11-07 11:30 AM IST',
    interviewNotes: 'Candidate screened by ArivuPro placement cell. Strong concepts in audit assertions and analytical procedures. Deloitte HR requested slot confirmation.',
    timeline: [
      { stage: 'Applied', timestamp: '2026-11-03 10:15 AM', note: 'Application submitted via ArivuPro Exclusive Drive' },
      { stage: 'ArivuPro Review', timestamp: '2026-11-03 02:40 PM', note: 'Verified by Placement Counselor Priya Sharma (Score: 94%)' },
      { stage: 'Recruiter Screen', timestamp: '2026-11-04 09:10 AM', note: 'Deloitte Offshore Talent Acquisition approved profile' },
      { stage: 'Technical Round', timestamp: '2026-11-04 02:15 PM', note: 'Technical Audit Panel scheduled for Nov 7th' }
    ]
  },
  {
    id: 'app-arv-102',
    jobId: 'job-scr-004',
    jobTitle: 'Financial Reporting Specialist (IFRS & Consolidation)',
    company: 'KPMG Global Services (KGS)',
    location: 'Bangalore, Karnataka',
    studentId: 'stu-arv-9481',
    studentName: 'Rohan Venkatesh',
    studentRoll: 'ARV-2024-ACCA-882',
    studentCourse: 'ACCA & US CPA Dual Track',
    appliedDate: '2026-11-02',
    status: 'Recruiter Screen',
    aiMatchScore: 89,
    matchGrade: 'Strong',
    matchAnalysis: {
      qualificationFit: 90,
      skillsFit: 88,
      experienceFit: 89,
      strengths: [
        'Robust theoretical and practical grasp of IFRS 15 and 16',
        'Advanced financial consolidation skills from ArivuPro Masterclasses'
      ],
      gapAlerts: ['Practical experience with Workday ERP is secondary'],
      counselorRecommendation: 'Recommend scheduling mock consolidation case study with ArivuPro faculty.'
    },
    crmLeadId: 'CRM-LEAD-KPMG-9182',
    crmSyncStatus: 'Synced',
    assignedCounselor: 'Anand Kulkarni (Corporate Relations Manager)',
    lastUpdated: '2026-11-03T16:00:00Z',
    timeline: [
      { stage: 'Applied', timestamp: '2026-11-02 11:20 AM', note: 'Direct submission to KPMG KGS recruitment queue' },
      { stage: 'ArivuPro Review', timestamp: '2026-11-02 04:00 PM', note: 'Internal profile check complete' },
      { stage: 'Recruiter Screen', timestamp: '2026-11-03 04:00 PM', note: 'Under initial resume screening with KPMG HR team' }
    ]
  }
];

// Scraper Sources Status
let scraperSources: ScraperSourceStatus[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn Jobs (India & Global GCCs)',
    url: 'https://linkedin.com/jobs/finance-accounting',
    lastRun: '10 minutes ago',
    jobsCount: 142,
    status: 'Active',
    categoryFocus: 'Big 4, GCCs, US CPA & ACCA Freshers'
  },
  {
    id: 'naukri',
    name: 'Naukri.com Finance & Accounts Portal',
    url: 'https://naukri.com/finance-jobs',
    lastRun: '15 minutes ago',
    jobsCount: 185,
    status: 'Active',
    categoryFocus: 'CA Inter Articleship, CMA India, Direct/Indirect Tax'
  },
  {
    id: 'quintedge',
    name: 'Quintedge Finance Careers Board',
    url: 'https://quintedge.com/jobs',
    lastRun: '25 minutes ago',
    jobsCount: 38,
    status: 'Active',
    categoryFocus: 'Investment Banking, Equity Research, Financial Modeling'
  },
  {
    id: 'big4_portal',
    name: 'Big 4 Direct Careers (Deloitte, PwC, EY, KPMG)',
    url: 'https://careers.ey.com & workday portals',
    lastRun: '5 minutes ago',
    jobsCount: 94,
    status: 'Active',
    categoryFocus: 'Statutory Audit, US Tax, Transfer Pricing, Risk Advisory'
  },
  {
    id: 'efinancialcareers',
    name: 'eFinancialCareers Asia-Pacific',
    url: 'https://efinancialcareers.com',
    lastRun: '1 hour ago',
    jobsCount: 29,
    status: 'Idle',
    categoryFocus: 'Private Equity, Hedge Funds, CFA Charterholders'
  },
  {
    id: 'arivupro_exclusive',
    name: 'ArivuPro Campus Placement Drives',
    url: 'https://arivupro.com/placements',
    lastRun: 'Live (Real-time)',
    jobsCount: 46,
    status: 'Active',
    categoryFocus: 'Exclusive Partner MoUs for ArivuPro Enrolled Students'
  }
];

let allJobs: JobListing[] = [...INITIAL_JOBS];

// Helper: Calculate deterministic matching score
function calculateDeterministicMatch(student: StudentProfile, job: JobListing) {
  let qualScore = 40;
  const matchesQual = job.qualifications.some(q => student.qualificationsCompleted.includes(q));
  if (matchesQual) {
    qualScore = 95;
  } else if (student.qualificationsCompleted.length > 0) {
    qualScore = 65;
  }

  // Skills Score
  const jobSkills = [...job.mandatorySkills, ...job.goodToHaveSkills];
  const matchedSkills = jobSkills.filter(s =>
    student.keySkills.some(ks => ks.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ks.toLowerCase()))
  );
  const skillsScore = Math.min(98, Math.round((matchedSkills.length / Math.max(jobSkills.length, 1)) * 60 + 38));

  // Experience Score
  let expScore = 80;
  if (job.minExperienceYears === 0) {
    expScore = 95;
  } else if (student.articleshipCompletedMonths >= job.minExperienceYears * 12) {
    expScore = 92;
  } else {
    expScore = 70;
  }

  const overall = Math.round(qualScore * 0.45 + skillsScore * 0.35 + expScore * 0.20);
  let grade: 'Excellent' | 'Strong' | 'Moderate' | 'Low' = 'Moderate';
  if (overall >= 90) grade = 'Excellent';
  else if (overall >= 80) grade = 'Strong';
  else if (overall >= 65) grade = 'Moderate';
  else grade = 'Low';

  const strengths = [
    `Strong alignment in core finance qualifications (${student.qualificationsCompleted.join(', ')})`,
    `Competency detected in ${matchedSkills.slice(0, 3).join(', ') || 'Financial reporting'}`,
    `Completed ${student.articleshipCompletedMonths} months of rigorous practical training`
  ];

  const gapAlerts = jobSkills
    .filter(s => !matchedSkills.includes(s))
    .slice(0, 2)
    .map(s => `Consider reviewing ${s} frameworks before interview`);

  return {
    overallScore: overall,
    grade,
    breakdown: {
      qualificationFit: qualScore,
      skillsFit: skillsScore,
      experienceFit: expScore,
      strengths,
      gapAlerts,
      counselorRecommendation: overall >= 85
        ? 'High suitability! Your ArivuPro training gives you an edge. Direct application recommended.'
        : 'Good potential fit. We suggest taking the ArivuPro technical brush-up module for this track.'
    }
  };
}

// REST API Endpoints

// 1. Get All Jobs with filters
app.get('/api/jobs', (req: Request, res: Response) => {
  const { query, qualification, location, jobType, experience, source, exclusiveOnly, department } = req.query;

  let filtered = [...allJobs];

  if (query && typeof query === 'string' && query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.mandatorySkills.some(s => s.toLowerCase().includes(q)) ||
        j.location.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q)
    );
  }

  if (qualification && typeof qualification === 'string' && qualification !== 'ALL') {
    filtered = filtered.filter(j => j.qualifications.includes(qualification as any));
  }

  if (location && typeof location === 'string' && location !== 'ALL') {
    filtered = filtered.filter(j => j.city.toLowerCase() === location.toLowerCase() || j.location.toLowerCase().includes(location.toLowerCase()));
  }

  if (jobType && typeof jobType === 'string' && jobType !== 'ALL') {
    filtered = filtered.filter(j => j.jobType === jobType);
  }

  if (experience && typeof experience === 'string' && experience !== 'ALL') {
    filtered = filtered.filter(j => j.experienceLevel === experience);
  }

  if (source && typeof source === 'string' && source !== 'ALL') {
    filtered = filtered.filter(j => j.source === source);
  }

  if (department && typeof department === 'string' && department !== 'ALL') {
    filtered = filtered.filter(j => j.department === department);
  }

  if (exclusiveOnly === 'true') {
    filtered = filtered.filter(j => j.arivuproExclusive);
  }

  res.json({
    total: filtered.length,
    jobs: filtered
  });
});

// 2. Get Single Job
app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = allJobs.find(j => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// 3. Post a Job (Recruiter portal)
app.post('/api/jobs', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.title || !body.company || !body.salaryText) {
    return res.status(400).json({ error: 'Missing mandatory fields' });
  }

  const newJob: JobListing = {
    id: `job-rec-${Date.now().toString(36)}`,
    title: body.title,
    company: body.company,
    logoText: body.company.slice(0, 3).toUpperCase(),
    location: body.location || 'Bangalore, Karnataka',
    city: body.city || 'Bangalore',
    workplaceType: body.workplaceType || 'Hybrid',
    jobType: body.jobType || 'Full-Time',
    experienceLevel: body.experienceLevel || '0-1 yr (Fresher)',
    minExperienceYears: Number(body.minExperienceYears) || 0,
    salaryText: body.salaryText,
    salaryMinLPA: body.salaryMinLPA,
    salaryMaxLPA: body.salaryMaxLPA,
    qualifications: body.qualifications || ['ACCA', 'CA'],
    mandatorySkills: body.mandatorySkills || ['Financial Analysis', 'Excel'],
    goodToHaveSkills: body.goodToHaveSkills || ['ERP', 'PowerBI'],
    description: body.description || 'Join our finance and accounting practice.',
    keyResponsibilities: body.keyResponsibilities || [
      'Execution of financial accounting and month-end close',
      'Preparation of regulatory work papers and audit support'
    ],
    source: 'direct_recruiter',
    arivuproExclusive: body.arivuproExclusive || false,
    isUrgent: body.isUrgent || false,
    postedDate: new Date().toISOString().split('T')[0],
    deadlineDate: body.deadlineDate || '2026-12-15',
    applicantsCount: 0,
    department: body.department || 'FP&A & Corporate Finance',
    crmDriveCode: `REC-${Date.now().toString().slice(-4)}`
  };

  allJobs.unshift(newJob);
  res.status(201).json({ message: 'Job successfully published', job: newJob });
});

// 4. Trigger Web Scraper Engine
app.post('/api/scrape/trigger', (req: Request, res: Response) => {
  const { targetSource, keywords } = req.body;

  // Simulate realistic newly scraped jobs from the requested platform
  const simulatedScrapedJobs: JobListing[] = [
    {
      id: `job-live-scr-${Date.now()}-1`,
      title: 'US Tax Senior Analyst (State & Local Tax - SALT)',
      company: 'Grant Thornton US Delivery Center',
      logoText: 'GT',
      location: 'Bangalore, Karnataka',
      city: 'Bangalore',
      workplaceType: 'Hybrid',
      jobType: 'Full-Time',
      experienceLevel: '1-3 yrs',
      minExperienceYears: 1,
      salaryText: '₹9.5 - ₹12.0 LPA',
      salaryMinLPA: 9.5,
      salaryMaxLPA: 12.0,
      qualifications: ['US_CPA', 'ACCA', 'CA_INTER'],
      mandatorySkills: ['US Tax Form 1120', 'SALT Compliance', 'Apportionment', 'Excel'],
      goodToHaveSkills: ['GoSystems', 'Vertex'],
      description: 'Scraped live from LinkedIn Jobs. Grant Thornton US tax practice seeks candidates with US CPA or ACCA credentials for multi-state corporate apportionment and tax return preparation.',
      keyResponsibilities: [
        'Review state tax returns and franchise tax estimates',
        'Prepare composite returns for pass-through entities',
        'Collaborate with US onshore engagement teams'
      ],
      source: 'linkedin',
      sourceUrl: 'https://linkedin.com/jobs/view/grant-thornton-us-tax',
      arivuproExclusive: false,
      isUrgent: true,
      postedDate: new Date().toISOString().split('T')[0],
      deadlineDate: '2026-12-10',
      applicantsCount: 9,
      department: 'Taxation'
    },
    {
      id: `job-live-scr-${Date.now()}-2`,
      title: 'Junior Equity Research Associate - BFSI Sector',
      company: 'Edelweiss Securities',
      logoText: 'EDL',
      location: 'Mumbai, Maharashtra',
      city: 'Mumbai',
      workplaceType: 'Onsite',
      jobType: 'Full-Time',
      experienceLevel: '0-1 yr (Fresher)',
      minExperienceYears: 0,
      salaryText: '₹12.0 - ₹15.0 LPA',
      salaryMinLPA: 12.0,
      salaryMaxLPA: 15.0,
      qualifications: ['CA', 'CFA', 'FINANCIAL_MODELING'],
      mandatorySkills: ['Financial Modeling', 'DCF', 'Sector Research', 'Earnings Analysis'],
      goodToHaveSkills: ['Bloomberg Terminal', 'Python'],
      description: 'Scraped live from Quintedge. Track domestic banking and NBFC counters, build detailed forecasting models, and author initiation notes.',
      keyResponsibilities: [
        'Quarterly earnings preview and review notes for institutional clients',
        'Maintain detailed three-statement models for 15 coverage stocks',
        'Attend analyst conference calls and management interviews'
      ],
      source: 'quintedge',
      sourceUrl: 'https://quintedge.com/jobs/edelweiss-equity-research',
      arivuproExclusive: false,
      isUrgent: false,
      postedDate: new Date().toISOString().split('T')[0],
      deadlineDate: '2026-12-01',
      applicantsCount: 14,
      department: 'Investment Banking & M&A'
    },
    {
      id: `job-live-scr-${Date.now()}-3`,
      title: 'Plant Cost Controller & Budgeting Specialist',
      company: 'Titan Company Limited',
      logoText: 'TCL',
      location: 'Hosur / Bangalore',
      city: 'Bangalore',
      workplaceType: 'Onsite',
      jobType: 'Full-Time',
      experienceLevel: '1-3 yrs',
      minExperienceYears: 1,
      salaryText: '₹9.0 - ₹12.5 LPA',
      salaryMinLPA: 9.0,
      salaryMaxLPA: 12.5,
      qualifications: ['CMA_INDIA', 'US_CMA', 'CA_INTER'],
      mandatorySkills: ['Cost Accounting Standards', 'SAP ERP', 'BOM Verification', 'Variance Analysis'],
      goodToHaveSkills: ['Tally', 'PowerBI'],
      description: 'Scraped live from Naukri.com Finance. Manage precision manufacturing plant costing, bill of material audits, and scrap analysis for Titan Watches & Wearables division.',
      keyResponsibilities: [
        'Formulate monthly standard vs actual manufacturing variances',
        'Conduct physical stock audit and inventory valuation under Ind AS 2',
        'Evaluate capital investment projects and cost-reduction initiatives'
      ],
      source: 'naukri',
      sourceUrl: 'https://naukri.com/titan-plant-cost-accountant',
      arivuproExclusive: false,
      isUrgent: false,
      postedDate: new Date().toISOString().split('T')[0],
      deadlineDate: '2026-12-15',
      applicantsCount: 7,
      department: 'FP&A & Corporate Finance'
    }
  ];

  // Prepend scraped jobs
  allJobs = [...simulatedScrapedJobs, ...allJobs];

  // Update scraper source statuses
  scraperSources = scraperSources.map(s => {
    if (!targetSource || s.id === targetSource) {
      return {
        ...s,
        lastRun: 'Just now',
        jobsCount: s.jobsCount + Math.floor(Math.random() * 5 + 3),
        status: 'Active'
      };
    }
    return s;
  });

  res.json({
    message: 'Scraper engine executed successfully across target job boards',
    newJobsScraped: simulatedScrapedJobs.length,
    totalActiveJobs: allJobs.length,
    scrapedJobs: simulatedScrapedJobs,
    updatedSources: scraperSources
  });
});

// 5. Scraper Sources Status
app.get('/api/scrape/status', (req: Request, res: Response) => {
  res.json({
    sources: scraperSources,
    totalScrapedAcrossSources: allJobs.filter(j => j.source !== 'arivupro_exclusive' && j.source !== 'direct_recruiter').length,
    totalExclusiveDrives: allJobs.filter(j => j.arivuproExclusive).length
  });
});

// 6. Student Profile
app.get('/api/student/profile', (req: Request, res: Response) => {
  res.json(activeStudent);
});

app.put('/api/student/profile', (req: Request, res: Response) => {
  activeStudent = { ...activeStudent, ...req.body };
  res.json({ message: 'Profile updated', profile: activeStudent });
});

// 7. AI Matching Engine: evaluate candidate vs job
app.post('/api/ai/match', async (req: Request, res: Response) => {
  const { jobId, studentProfile } = req.body;
  const targetJob = allJobs.find(j => j.id === jobId);

  if (!targetJob) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const profile = studentProfile || activeStudent;

  // If Gemini client available, get intelligent contextual evaluation
  if (geminiClient) {
    try {
      const prompt = `
You are an expert Finance Talent Partner and Senior Recruiter at ArivuPro Academy (a premier coaching academy for CA, ACCA, US CPA, US CMA, CFA, CS, and CMA India).
Evaluate this candidate against the job description.

Candidate Profile:
- Name: ${profile.name}
- Enrolled Course & Stage: ${profile.enrollmentCohort} (${profile.currentLevel})
- Completed Qualifications: ${profile.qualificationsCompleted.join(', ')}
- Articleship Experience: ${profile.articleshipCompletedMonths} months
- Key Skills: ${profile.keySkills.join(', ')}
- Expected CTC: ${profile.expectedSalaryLPA}
- About: ${profile.aboutBio}

Job Details:
- Title: ${targetJob.title}
- Company: ${targetJob.company}
- Qualifications Required: ${targetJob.qualifications.join(', ')}
- Mandatory Skills: ${targetJob.mandatorySkills.join(', ')}
- Good to Have Skills: ${targetJob.goodToHaveSkills.join(', ')}
- Experience Level: ${targetJob.experienceLevel} (${targetJob.minExperienceYears} yrs min)
- Department: ${targetJob.department}
- Job Description: ${targetJob.description}

Evaluate and return a JSON object with:
- overallScore (number between 50 and 99)
- grade ("Excellent" | "Strong" | "Moderate" | "Low")
- qualificationFit (number 0-100)
- skillsFit (number 0-100)
- experienceFit (number 0-100)
- strengths (array of 3 specific bullet points highlighting candidate fit)
- gapAlerts (array of 1-2 points on missing skills or areas to revise before interview)
- counselorRecommendation (1 concise advisory sentence for ArivuPro placement counselor)
- personalizedElevatorPitch (2-3 sentences pitch that the candidate can use when applying)
`;

      const aiResponse = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = aiResponse.text;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        return res.json({
          source: 'gemini-3.8-flash',
          jobId: targetJob.id,
          candidateId: profile.id,
          match: {
            overallScore: parsed.overallScore || 90,
            grade: parsed.grade || 'Strong',
            breakdown: {
              qualificationFit: parsed.qualificationFit || 92,
              skillsFit: parsed.skillsFit || 88,
              experienceFit: parsed.experienceFit || 89,
              strengths: parsed.strengths || [],
              gapAlerts: parsed.gapAlerts || [],
              counselorRecommendation: parsed.counselorRecommendation || 'Recommended for initial screening.',
              personalizedElevatorPitch: parsed.personalizedElevatorPitch || ''
            }
          }
        });
      }
    } catch (err) {
      console.warn('Gemini match error, using algorithmic fallback:', err);
    }
  }

  // Deterministic fallback matching
  const matchResult = calculateDeterministicMatch(profile, targetJob);
  res.json({
    source: 'arivupro-algorithmic-engine',
    jobId: targetJob.id,
    candidateId: profile.id,
    match: {
      overallScore: matchResult.overallScore,
      grade: matchResult.grade,
      breakdown: matchResult.breakdown
    }
  });
});

// 8. AI Interview Preparation & Technical Question Generator
app.post('/api/ai/prep', async (req: Request, res: Response) => {
  const { jobId } = req.body;
  const targetJob = allJobs.find(j => j.id === jobId);

  if (!targetJob) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (geminiClient) {
    try {
      const prompt = `
Generate 4 realistic technical and behavioral interview questions for a candidate with finance qualifications (${targetJob.qualifications.join(', ')}) interviewing for the role of "${targetJob.title}" at "${targetJob.company}".
Department: ${targetJob.department}.
Skills involved: ${targetJob.mandatorySkills.join(', ')}.

Return a JSON array of objects, each with:
- question (string)
- keyConceptsTested (string)
- sampleIdealAnswerGuideline (2-3 sentences guidance on how an ArivuPro student should structure the answer, citing Ind AS/IFRS/US GAAP standards or practical finance logic)
`;

      const aiResponse = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = aiResponse.text;
      if (responseText) {
        const questions = JSON.parse(responseText);
        return res.json({
          role: targetJob.title,
          company: targetJob.company,
          questions
        });
      }
    } catch (err) {
      console.warn('Gemini prep error, using fallback:', err);
    }
  }

  // Fallback interview questions
  res.json({
    role: targetJob.title,
    company: targetJob.company,
    questions: [
      {
        question: `How would you verify revenue recognition under ${targetJob.mandatorySkills.includes('IFRS') ? 'IFRS 15' : 'Ind AS 115 / US GAAP ASC 606'} for a multi-element contract?`,
        keyConceptsTested: 'Five-Step Revenue Model, Performance Obligations, Transaction Price Allocation',
        sampleIdealAnswerGuideline: 'Walk through identifying the distinct goods/services, allocating standalone selling price, and verifying whether control transfers over time or at a point in time.'
      },
      {
        question: 'Explain the difference between substantive testing and test of controls in a statutory audit.',
        keyConceptsTested: 'Audit Risk Model, Assertions, Internal Financial Controls',
        sampleIdealAnswerGuideline: 'Highlight that tests of controls evaluate operational efficacy of client controls, while substantive tests directly detect material misstatements in balances and disclosures.'
      },
      {
        question: 'In financial modeling or budgeting, how do you handle sensitivity around working capital and debtor days?',
        keyConceptsTested: 'Working Capital Days, Cash Conversion Cycle, Stress Testing',
        sampleIdealAnswerGuideline: 'Explain linking Days Sales Outstanding (DSO) dynamically to receivables balance, and modeling a base, bull, and bear scenario impact on operating cash flow.'
      },
      {
        question: `Why do you feel your ArivuPro ${targetJob.qualifications[0] || 'Finance'} preparation sets you apart for ${targetJob.company}?`,
        keyConceptsTested: 'Self-awareness, practical application, commitment to professional ethics',
        sampleIdealAnswerGuideline: 'Connect your rigorous case-study curriculum, articleship simulations, and understanding of commercial acumen fostered at ArivuPro.'
      }
    ]
  });
});

// 9. Applications API
app.get('/api/applications', (req: Request, res: Response) => {
  res.json({
    total: applications.length,
    applications
  });
});

app.post('/api/applications', (req: Request, res: Response) => {
  const { jobId, coverNote } = req.body;
  const targetJob = allJobs.find(j => j.id === jobId);
  if (!targetJob) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Check if already applied
  const existing = applications.find(a => a.jobId === jobId && a.studentId === activeStudent.id);
  if (existing) {
    return res.status(400).json({ error: 'You have already applied for this job opportunity.' });
  }

  const match = calculateDeterministicMatch(activeStudent, targetJob);
  const newApp: JobApplication = {
    id: `app-arv-${Date.now().toString().slice(-4)}`,
    jobId: targetJob.id,
    jobTitle: targetJob.title,
    company: targetJob.company,
    location: targetJob.location,
    studentId: activeStudent.id,
    studentName: activeStudent.name,
    studentRoll: activeStudent.arivuproStudentId,
    studentCourse: activeStudent.enrollmentCohort,
    appliedDate: new Date().toISOString().split('T')[0],
    status: 'Applied',
    aiMatchScore: match.overallScore,
    matchGrade: match.grade,
    matchAnalysis: match.breakdown,
    crmLeadId: `CRM-LEAD-${Date.now().toString().slice(-5)}`,
    crmSyncStatus: 'Synced',
    assignedCounselor: 'ArivuPro Placement Desk (Bangalore HQ)',
    lastUpdated: new Date().toISOString(),
    timeline: [
      {
        stage: 'Applied',
        timestamp: new Date().toLocaleString('en-US', { hour12: true }),
        note: `Application submitted with ArivuPro Student ID: ${activeStudent.arivuproStudentId}`
      },
      {
        stage: 'ArivuPro Review',
        timestamp: new Date().toLocaleString('en-US', { hour12: true }),
        note: 'Queued for priority profile verification by placement team.'
      }
    ]
  };

  applications.unshift(newApp);
  targetJob.applicantsCount += 1;

  res.status(201).json({
    message: 'Application submitted and synced with ArivuPro Placement CRM',
    application: newApp
  });
});

// 10. Update Application Status (for CRM / Recruiter / Counselor actions)
app.patch('/api/applications/:id', (req: Request, res: Response) => {
  const appIndex = applications.findIndex(a => a.id === req.params.id);
  if (appIndex === -1) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const { status, counselorNotes, interviewDate } = req.body;
  const current = applications[appIndex];

  if (status) {
    current.status = status;
    current.timeline.push({
      stage: status,
      timestamp: new Date().toLocaleString('en-US', { hour12: true }),
      note: counselorNotes || `Stage updated to ${status}`
    });
  }

  if (counselorNotes) {
    current.interviewNotes = counselorNotes;
  }
  if (interviewDate) {
    current.interviewDate = interviewDate;
  }
  current.lastUpdated = new Date().toISOString();
  current.crmSyncStatus = 'Synced';

  res.json({ message: 'Application updated and synced', application: current });
});

// 11. CRM Sync and Metrics
app.post('/api/crm/sync-all', (req: Request, res: Response) => {
  // Mark all pending as synced
  applications = applications.map(a => ({
    ...a,
    crmSyncStatus: 'Synced' as const,
    lastUpdated: new Date().toISOString()
  }));

  const metrics: CrmPipelineMetrics = {
    totalArivuProApplicants: 148,
    activeInterviews: 26,
    offersReleased: 19,
    totalPlaced: 87,
    avgPackageLPA: 9.8,
    highestPackageLPA: 24.5,
    big4PlacementsCount: 64,
    topDemandedCourse: 'ACCA + US CPA Dual Track'
  };

  res.json({
    message: 'All application records successfully pushed to ArivuPro Placement CRM (LeadSquared / Zoho webhook: 200 OK)',
    timestamp: new Date().toISOString(),
    syncedRecordsCount: applications.length,
    pipelineMetrics: metrics
  });
});

app.get('/api/crm/stats', (req: Request, res: Response) => {
  const metrics: CrmPipelineMetrics = {
    totalArivuProApplicants: 148,
    activeInterviews: 26,
    offersReleased: 19,
    totalPlaced: 87,
    avgPackageLPA: 9.8,
    highestPackageLPA: 24.5,
    big4PlacementsCount: 64,
    topDemandedCourse: 'ACCA + US CPA Dual Track'
  };

  const courseWiseSalaryBenchmarks = [
    { course: 'Qualified Chartered Accountant (CA)', fresherAvgLPA: 11.5, topOffersLPA: 24.0, big4Share: '42%' },
    { course: 'ACCA (Affiliate / Member)', fresherAvgLPA: 8.5, topOffersLPA: 16.5, big4Share: '36%' },
    { course: 'US CPA (AICPA Qualified)', fresherAvgLPA: 9.5, topOffersLPA: 18.0, big4Share: '38%' },
    { course: 'CFA (L2/L3 Cleared)', fresherAvgLPA: 12.0, topOffersLPA: 22.0, big4Share: '18%' },
    { course: 'US CMA / CMA India', fresherAvgLPA: 8.0, topOffersLPA: 14.5, big4Share: '22%' },
    { course: 'CA Articleship (Intermediate)', fresherAvgLPA: 3.2, topOffersLPA: 4.8, big4Share: '50%' }
  ];

  res.json({
    metrics,
    courseWiseSalaryBenchmarks
  });
});

// Company Model & In-memory list
interface RegisteredCompany {
  id: string;
  name: string;
  legalName: string;
  industry: string;
  workEmail: string;
  website: string;
  cinOrGstin: string;
  verificationStatus: 'Verified' | 'Pending Review' | 'MoU Partner';
  verificationNotes: string;
  registeredDate: string;
  activeJobsCount: number;
  contactPerson: string;
}

let registeredCompanies: RegisteredCompany[] = [
  {
    id: 'comp-deloitte',
    name: 'Deloitte India (Offshore Delivery)',
    legalName: 'Deloitte Shared Services India Pvt Ltd',
    industry: 'Big 4 Audit & Advisory',
    workEmail: 'campus.recruitment@deloitte.com',
    website: 'https://deloitte.com',
    cinOrGstin: '29AAACD4981E1Z8',
    verificationStatus: 'MoU Partner',
    verificationNotes: 'Official ArivuPro Campus Recruitment MoU signed for ACCA & US CPA batches.',
    registeredDate: '2025-08-15',
    activeJobsCount: 1,
    contactPerson: 'Meghna Rao (Campus Lead)'
  },
  {
    id: 'comp-bdo',
    name: 'BDO India LLP',
    legalName: 'BDO India LLP',
    industry: 'Accounting & Assurance',
    workEmail: 'careers.assurance@bdo.in',
    website: 'https://bdo.in',
    cinOrGstin: '27AABCB1234F1Z2',
    verificationStatus: 'Verified',
    verificationNotes: 'Articleship training partner verified via ICAI firm registration number.',
    registeredDate: '2025-09-10',
    activeJobsCount: 1,
    contactPerson: 'Suresh Menon (Assurance Partner)'
  },
  {
    id: 'comp-gs',
    name: 'Goldman Sachs Services',
    legalName: 'Goldman Sachs India Services Pvt Ltd',
    industry: 'Global Investment Banking & GCC',
    workEmail: 'talent.bangalore@gs.com',
    website: 'https://goldmansachs.com',
    cinOrGstin: '29AAACG2198D1Z4',
    verificationStatus: 'MoU Partner',
    verificationNotes: 'Direct corporate partner for FP&A and Financial Analyst cohorts.',
    registeredDate: '2025-10-01',
    activeJobsCount: 1,
    contactPerson: 'Aditi Nair (VP Talent Acquisition)'
  }
];

// Scraper Automation Logs
let scraperExecutionLogs = [
  {
    id: 'log-101',
    timestamp: '2026-11-04 08:45:00',
    source: 'LinkedIn Jobs',
    url: 'https://linkedin.com/jobs/finance',
    scannedCount: 38,
    parsedValidCount: 12,
    qualificationsDetected: { ACCA: 6, US_CPA: 4, CA_INTER: 2 },
    status: 'Success',
    message: 'Extracted roles in US Corporate Tax and Audit Assurance with auto-tagging.'
  },
  {
    id: 'log-102',
    timestamp: '2026-11-04 08:30:00',
    source: 'Naukri.com Finance',
    url: 'https://naukri.com/finance-jobs',
    scannedCount: 52,
    parsedValidCount: 16,
    qualificationsDetected: { CMA_INDIA: 7, US_CMA: 5, CA: 4 },
    status: 'Success',
    message: 'Captured plant costing and statutory audit positions across Bangalore & Mumbai.'
  },
  {
    id: 'log-103',
    timestamp: '2026-11-04 08:15:00',
    source: 'Big 4 Portals (Deloitte, EY, PwC, KPMG)',
    url: 'https://careers.ey.com',
    scannedCount: 26,
    parsedValidCount: 8,
    qualificationsDetected: { US_CPA: 5, ACCA: 3 },
    status: 'Success',
    message: 'Parsed Workday ATS job requisitions and matched with ArivuPro skills syllabus.'
  }
];

// 12. Companies API
app.get('/api/companies', (req: Request, res: Response) => {
  res.json({
    total: registeredCompanies.length,
    companies: registeredCompanies
  });
});

app.post('/api/companies/register', (req: Request, res: Response) => {
  const { name, legalName, industry, workEmail, website, cinOrGstin, contactPerson } = req.body;

  if (!name || !workEmail || !cinOrGstin) {
    return res.status(400).json({ error: 'Company Name, Corporate Email, and CIN/GSTIN are required.' });
  }

  // Automatic verification check:
  // Reject free consumer email domains (gmail, yahoo, hotmail, outlook) for corporate trust
  const emailDomain = workEmail.split('@')[1]?.toLowerCase() || '';
  const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com'];
  const isGeneric = genericDomains.includes(emailDomain);

  // Validate GSTIN format (15 characters) or CIN (21 characters)
  const isGstinOrCin = cinOrGstin.trim().length >= 15;

  let verificationStatus: 'Verified' | 'Pending Review' | 'MoU Partner' = 'Pending Review';
  let notes = 'Corporate domain under 24-hour review by ArivuPro Industry Relations Team.';

  if (!isGeneric && isGstinOrCin) {
    verificationStatus = 'Verified';
    notes = `Verified domain (@${emailDomain}) & valid registration identity (${cinOrGstin}).`;
  }

  const newCompany: RegisteredCompany = {
    id: `comp-${Date.now().toString(36)}`,
    name,
    legalName: legalName || name,
    industry: industry || 'Finance & Corporate Services',
    workEmail,
    website: website || `https://${emailDomain}`,
    cinOrGstin: cinOrGstin.toUpperCase(),
    verificationStatus,
    verificationNotes: notes,
    registeredDate: new Date().toISOString().split('T')[0],
    activeJobsCount: 0,
    contactPerson: contactPerson || 'Talent Acquisition Partner'
  };

  registeredCompanies.unshift(newCompany);

  res.status(201).json({
    message: verificationStatus === 'Verified' 
      ? 'Company verified successfully with corporate domain credentials.'
      : 'Company registered. Profile queued for manual document verification by ArivuPro Placement Cell.',
    company: newCompany
  });
});

app.get('/api/companies/:companyId/applications', (req: Request, res: Response) => {
  const company = registeredCompanies.find(c => c.id === req.params.companyId);
  const companyName = company ? company.name : '';

  // Find applications matching this company
  const companyApps = applications.filter(a =>
    a.company.toLowerCase().includes(companyName.toLowerCase()) ||
    companyName.toLowerCase().includes(a.company.toLowerCase())
  );

  res.json({
    companyName,
    totalApplications: companyApps.length,
    applications: companyApps
  });
});

// 13. Scraper Logs and Auto-Scrape Config
app.get('/api/scrape/logs', (req: Request, res: Response) => {
  res.json({
    logs: scraperExecutionLogs,
    lastAutomatedRun: scraperExecutionLogs[0]?.timestamp || 'N/A'
  });
});

// Configure Vite Middlewares or Static Serving
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'dist/index.html'));
  });
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ArivuPro Job Portal Server running on http://0.0.0.0:${PORT}`);
});
