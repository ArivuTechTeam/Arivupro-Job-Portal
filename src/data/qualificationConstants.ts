import { QualificationType } from '../types/index.ts';

export interface QualificationInfo {
  code: QualificationType;
  shortName: string;
  fullName: string;
  governingBody: string;
  arivuproCourse: string;
  typicalRoles: string[];
  averageFresherSalary: string;
  accentColor: string;
  badgeBg: string;
}

export const QUALIFICATIONS_METADATA: Record<QualificationType, QualificationInfo> = {
  CA: {
    code: 'CA',
    shortName: 'CA (Chartered Accountant)',
    fullName: 'Chartered Accountant (Final Cleared)',
    governingBody: 'ICAI (Institute of Chartered Accountants of India)',
    arivuproCourse: 'CA Foundation, Inter & Final Comprehensive Coaching',
    typicalRoles: ['Statutory Audit Senior', 'Manager - Direct & Indirect Tax', 'FP&A Manager', 'Corporate Controller'],
    averageFresherSalary: '₹10.5 - ₹16.0 LPA',
    accentColor: 'text-blue-700',
    badgeBg: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  CA_INTER: {
    code: 'CA_INTER',
    shortName: 'CA Inter / Articleship',
    fullName: 'CA Intermediate (Both / Single Group Cleared)',
    governingBody: 'ICAI (Institute of Chartered Accountants of India)',
    arivuproCourse: 'CA Intermediate Fast-Track & Articleship Placement Desk',
    typicalRoles: ['Audit Article Assistant', 'Tax Articleship Trainee', 'Industrial Trainee (Big 4 & GCCs)'],
    averageFresherSalary: '₹20,000 - ₹35,000 / month Stipend',
    accentColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  },
  ACCA: {
    code: 'ACCA',
    shortName: 'ACCA (UK)',
    fullName: 'Association of Chartered Certified Accountants (Affiliate / Member)',
    governingBody: 'ACCA Global (UK)',
    arivuproCourse: 'ACCA Approved Learning Partner (Knowledge, Skills, Strategic Professional)',
    typicalRoles: ['IFRS Reporting Specialist', 'Global Audit Associate', 'US/UK Tax Analyst', 'Financial Accounting Analyst'],
    averageFresherSalary: '₹7.5 - ₹12.5 LPA',
    accentColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800'
  },
  ACCA_AFFILIATE: {
    code: 'ACCA_AFFILIATE',
    shortName: 'ACCA Affiliate',
    fullName: 'ACCA Affiliate (All 13 Papers Cleared)',
    governingBody: 'ACCA Global (UK)',
    arivuproCourse: 'ACCA Strategic Professional Coaching & Campus Connect',
    typicalRoles: ['Associate - Statutory Audit', 'Financial Reporting Analyst', 'Management Trainee'],
    averageFresherSalary: '₹8.0 - ₹13.0 LPA',
    accentColor: 'text-teal-700',
    badgeBg: 'bg-teal-50 border-teal-200 text-teal-800'
  },
  US_CPA: {
    code: 'US_CPA',
    shortName: 'US CPA',
    fullName: 'Certified Public Accountant (US AICPA)',
    governingBody: 'AICPA & NASBA (USA)',
    arivuproCourse: 'US CPA 4-Section Exam Prep (FAR, AUD, REG, BAR/ISC/TCP)',
    typicalRoles: ['US GAAP Audit Specialist', 'US Corporate Tax Senior', 'SEC Reporting Analyst', 'Big 4 Offshore Consultant'],
    averageFresherSalary: '₹8.5 - ₹14.0 LPA',
    accentColor: 'text-amber-700',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-800'
  },
  US_CMA: {
    code: 'US_CMA',
    shortName: 'US CMA',
    fullName: 'Certified Management Accountant (IMA USA)',
    governingBody: 'IMA (Institute of Management Accountants, USA)',
    arivuproCourse: 'US CMA 2-Part Preparation (Financial Planning & Financial Decision Making)',
    typicalRoles: ['FP&A Analyst', 'Plant Cost Controller', 'Budgeting & Performance Analyst', 'Finance Business Partner'],
    averageFresherSalary: '₹7.5 - ₹12.0 LPA',
    accentColor: 'text-orange-700',
    badgeBg: 'bg-orange-50 border-orange-200 text-orange-800'
  },
  CMA_INDIA: {
    code: 'CMA_INDIA',
    shortName: 'CMA India',
    fullName: 'Cost and Management Accountant (ICMAI)',
    governingBody: 'ICMAI (Institute of Cost Accountants of India)',
    arivuproCourse: 'CMA Foundation, Intermediate & Final Coaching',
    typicalRoles: ['Cost Accountant', 'Internal Auditor', 'Inventory Controller', 'Pricing Analyst'],
    averageFresherSalary: '₹7.0 - ₹11.5 LPA',
    accentColor: 'text-cyan-700',
    badgeBg: 'bg-cyan-50 border-cyan-200 text-cyan-800'
  },
  CS: {
    code: 'CS',
    shortName: 'Company Secretary (CS)',
    fullName: 'Company Secretary (ICSI)',
    governingBody: 'ICSI (Institute of Company Secretaries of India)',
    arivuproCourse: 'CS Executive & Professional Executive Mentorship',
    typicalRoles: ['Company Secretary', 'Corporate Governance Associate', 'Secretarial Auditor', 'Legal & Regulatory Compliance'],
    averageFresherSalary: '₹6.5 - ₹10.0 LPA',
    accentColor: 'text-purple-700',
    badgeBg: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  CFA: {
    code: 'CFA',
    shortName: 'CFA (US)',
    fullName: 'Chartered Financial Analyst (Level 1, 2, 3 or Charterholder)',
    governingBody: 'CFA Institute (USA)',
    arivuproCourse: 'CFA Exam Prep & Portfolio Valuation Masterclass',
    typicalRoles: ['Equity Research Associate', 'Investment Banking Analyst', 'Portfolio Risk Analyst', 'Credit Analyst'],
    averageFresherSalary: '₹12.0 - ₹20.0 LPA',
    accentColor: 'text-rose-700',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-800'
  },
  FINANCIAL_MODELING: {
    code: 'FINANCIAL_MODELING',
    shortName: 'Financial Modeling',
    fullName: 'Financial Modeling & Valuation Analyst',
    governingBody: 'ArivuPro Financial Modeling Academy',
    arivuproCourse: 'Applied 3-Statement & M&A Valuation Bootcamp',
    typicalRoles: ['M&A Analyst', 'Valuation Consultant', 'Corporate Finance Associate'],
    averageFresherSalary: '₹8.0 - ₹14.0 LPA',
    accentColor: 'text-violet-700',
    badgeBg: 'bg-violet-50 border-violet-200 text-violet-800'
  },
  BCOM_MCOM_MBA: {
    code: 'BCOM_MCOM_MBA',
    shortName: 'B.Com / M.Com / MBA',
    fullName: 'Commerce Graduate / Post-Graduate in Finance',
    governingBody: 'UGC Recognized Universities / B-Schools',
    arivuproCourse: 'ArivuPro Commerce Integrated Degree + Professional Certification',
    typicalRoles: ['Accountant', 'Financial Operations Trainee', 'Tax Associate'],
    averageFresherSalary: '₹4.5 - ₹7.0 LPA',
    accentColor: 'text-slate-700',
    badgeBg: 'bg-slate-100 border-slate-200 text-slate-800'
  }
};

export const SOURCE_LABELS: Record<string, { label: string; badge: string; isScraped: boolean }> = {
  arivupro_exclusive: {
    label: 'ArivuPro Exclusive Campus Drive',
    badge: 'bg-amber-50 text-amber-900 border-amber-300 font-semibold',
    isScraped: false
  },
  direct_recruiter: {
    label: 'Direct Recruiter Post (Verified)',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    isScraped: false
  },
  linkedin: {
    label: 'Scraped from LinkedIn Jobs',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    isScraped: true
  },
  naukri: {
    label: 'Scraped from Naukri.com',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    isScraped: true
  },
  quintedge: {
    label: 'Scraped from Quintedge Finance',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    isScraped: true
  },
  big4_portal: {
    label: 'Scraped from Big 4 Direct Career ATS',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    isScraped: true
  },
  efinancialcareers: {
    label: 'Scraped from eFinancialCareers',
    badge: 'bg-stone-100 text-stone-800 border-stone-200',
    isScraped: true
  },
  indeed: {
    label: 'Scraped from Indeed India',
    badge: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    isScraped: true
  }
};
