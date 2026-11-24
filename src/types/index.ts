export type QualificationType =
  | 'CA'
  | 'CA_INTER'
  | 'ACCA'
  | 'ACCA_AFFILIATE'
  | 'US_CPA'
  | 'US_CMA'
  | 'CMA_INDIA'
  | 'CS'
  | 'CFA'
  | 'FINANCIAL_MODELING'
  | 'BCOM_MCOM_MBA';

export type JobSourceType =
  | 'arivupro_exclusive'
  | 'direct_recruiter'
  | 'linkedin'
  | 'naukri'
  | 'indeed'
  | 'quintedge'
  | 'efinancialcareers'
  | 'big4_portal';

export type JobType = 'Full-Time' | 'Articleship / Industrial Training' | 'Contract' | 'Internship' | 'Trainee';
export type WorkplaceType = 'Onsite' | 'Hybrid' | 'Remote';
export type ExperienceLevel = 'Articleship / 0 yrs' | '0-1 yr (Fresher)' | '1-3 yrs' | '3-5 yrs' | '5+ yrs';

export interface JobListing {
  id: string;
  title: string;
  company: string;
  logoText: string;
  location: string;
  city: string;
  workplaceType: WorkplaceType;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  minExperienceYears: number;
  salaryText: string;
  salaryMinLPA?: number;
  salaryMaxLPA?: number;
  qualifications: QualificationType[];
  mandatorySkills: string[];
  goodToHaveSkills: string[];
  description: string;
  keyResponsibilities: string[];
  source: JobSourceType;
  sourceUrl?: string;
  arivuproExclusive: boolean;
  isUrgent?: boolean;
  postedDate: string;
  deadlineDate: string;
  applicantsCount: number;
  department: 'Audit & Assurance' | 'Taxation' | 'FP&A & Corporate Finance' | 'Investment Banking & M&A' | 'Global Accounting (US GAAP/IFRS)' | 'Risk & Compliance' | 'Articleship Desk' | 'Banking & Financial Services' | 'Consulting & Advisory' | 'Finance Operations & GCCs';
  crmDriveCode?: string;
  logoUrl?: string;
}

export interface WorkExperience {
  company: string;
  role: string;
  startMonth: string;
  endMonth: string;
  description: string;
}

export interface InternshipExperience {
  company: string;
  role: string;
  startMonth: string;
  endMonth: string;
  stipend: string;
  description: string;
}

export interface Project {
  title: string;
  role: string;
  outcome: string;
  url?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  arivuproStudentId: string;
  enrollmentCohort: string;
  primaryCourse: string;
  currentLevel: string;
  qualificationsCompleted: QualificationType[];
  articleshipCompletedMonths: number;
  keySkills: string[];
  preferredLocations: string[];
  expectedSalaryLPA: string;
  targetRoles: string[];
  aboutBio: string;
  verifiedStudent: boolean;
  gpaOrScore?: string;
  resumeFileName?: string;
  linkedinUrl?: string;
  // Exam & qualification details
  attemptCount?: string;         // 'first' | 'second' | 'multiple'
  icitssCompleted?: boolean;
  // Articleship details
  articleshipFirm?: string;
  articleshipFirmType?: string;  // 'Big 4' | 'Mid-tier' | 'Small firm'
  articleshipAreas?: string[];
  joiningAvailability?: string;
  willingToRelocate?: boolean;
  // Education
  graduationDegree?: string;
  graduationCollege?: string;
  graduationYear?: number;
  graduationPercent?: string;
  twelfthPercent?: string;
  // JSONB extras
  workExperience?: WorkExperience[];
  internshipExperience?: InternshipExperience[];
  projects?: Project[];
  certifications?: Certification[];
}

export type ApplicationStage =
  | 'Applied'
  | 'Recruiter Screen'
  | 'Technical Round'
  | 'Partner Interview'
  | 'Offer Released'
  | 'Placed'
  | 'Declined';

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentCourse: string;
  appliedDate: string;
  status: ApplicationStage;
  kind: 'internal' | 'external';
  applyUrl?: string;
  aiMatchScore: number;
  matchGrade: 'Excellent' | 'Strong' | 'Moderate' | 'Low';
  matchAnalysis?: {
    qualificationFit: number;
    skillsFit: number;
    experienceFit: number;
    strengths: string[];
    gapAlerts: string[];
    counselorRecommendation: string;
  };
  crmLeadId: string;
  crmSyncStatus: 'Synced' | 'Pending' | 'Syncing';
  assignedCounselor: string;
  lastUpdated: string;
  interviewDate?: string;
  interviewNotes?: string;
  timeline: {
    stage: string;
    timestamp: string;
    note: string;
  }[];
}

export interface ScraperSourceStatus {
  id: string;
  name: string;
  url: string;
  lastRun: string;
  jobsCount: number;
  status: 'Active' | 'Syncing' | 'Idle';
  categoryFocus: string;
}

export interface CrmPipelineMetrics {
  totalArivuProApplicants: number;
  activeInterviews: number;
  offersReleased: number;
  totalPlaced: number;
  avgPackageLPA: number;
  highestPackageLPA: number;
  big4PlacementsCount: number;
  topDemandedCourse: string;
}

export interface RegisteredCompany {
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

export interface ScraperLog {
  id: string;
  timestamp: string;
  source: string;
  url: string;
  scannedCount: number;
  parsedValidCount: number;
  qualificationsDetected: Record<string, number>;
  status: string;
  message: string;
}
