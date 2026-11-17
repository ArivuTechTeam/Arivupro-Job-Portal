export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type JobType = 'full-time' | 'internship' | 'articleship' | 'trainee';
export type WorkplaceType = 'onsite' | 'hybrid' | 'remote';
export type JobStatus = 'draft' | 'active' | 'closed' | 'expired';
export type ApplicationStage =
  | 'applied'
  | 'arivupro_review'
  | 'recruiter_screen'
  | 'technical_round'
  | 'partner_interview'
  | 'offer_released'
  | 'placed'
  | 'declined';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
export type SyncStatus = 'running' | 'ok' | 'error';

export type CourseTag =
  | 'CA' | 'CA_INTER' | 'ACCA' | 'ACCA_AFFILIATE'
  | 'US_CPA' | 'US_CMA' | 'CMA_INDIA' | 'CS' | 'CFA'
  | 'FINANCIAL_MODELING' | 'BCOM_MCOM_MBA';

export type JobSource =
  | 'arivupro_exclusive' | 'direct_recruiter'
  | 'caclubindia' | 'buddingca'
  | 'icai_eirc' | 'icai_sirc' | 'icai_wirc' | 'icai_kochi' | 'icai_pune' | 'icai_bangalore'
  | 'icmai' | 'jsearch'
  | 'linkedin' | 'naukri' | 'indeed' | 'quintedge' | 'efinancialcareers' | 'big4_portal';

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string;
          title: string;
          company: string;
          logo_url: string | null;
          location: string;
          city: string | null;
          workplace_type: WorkplaceType;
          job_type: JobType;
          experience_level: string;
          min_experience_years: number;
          salary_text: string | null;
          salary_min_lpa: number | null;
          salary_max_lpa: number | null;
          stipend_monthly: number | null;
          duration: string | null;
          qualifications: CourseTag[];
          mandatory_skills: string[];
          good_to_have_skills: string[];
          description: string | null;
          key_responsibilities: string[];
          department: string | null;
          source: JobSource;
          source_url: string | null;
          external_id: string | null;
          content_fingerprint: string | null;
          arivupro_exclusive: boolean;
          is_urgent: boolean;
          is_featured: boolean;
          status: JobStatus;
          posted_date: string;
          deadline_date: string | null;
          applicants_count: number;
          crm_drive_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'id' | 'created_at' | 'updated_at' | 'applicants_count'> & {
          id?: string;
          applicants_count?: number;
        };
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
      };

      student_leads: {
        Row: {
          id: string;
          job_id: string | null;
          job_title: string | null;
          company: string | null;
          student_name: string;
          student_email: string;
          student_phone: string;
          student_id: string | null;
          primary_course: string | null;
          resume_url: string | null;
          ai_match_score: number | null;
          match_grade: string | null;
          stage: ApplicationStage;
          status: LeadStatus;
          assigned_counselor: string | null;
          interview_date: string | null;
          interview_notes: string | null;
          crm_lead_id: string | null;
          crm_sync_status: 'synced' | 'pending' | 'syncing';
          notes: string | null;
          timeline: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['student_leads']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['student_leads']['Insert']>;
      };

      company_leads: {
        Row: {
          id: string;
          company_name: string;
          legal_name: string | null;
          website: string | null;
          contact_person: string;
          work_email: string;
          phone: string | null;
          industry: string | null;
          cin_or_gstin: string | null;
          verification_status: 'verified' | 'pending' | 'mou_partner';
          active_jobs_count: number;
          notes: string | null;
          status: LeadStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['company_leads']['Row'], 'id' | 'created_at' | 'updated_at' | 'active_jobs_count'> & {
          id?: string;
          active_jobs_count?: number;
        };
        Update: Partial<Database['public']['Tables']['company_leads']['Insert']>;
      };

      sync_runs: {
        Row: {
          id: string;
          source: string;
          started_at: string;
          finished_at: string | null;
          status: SyncStatus;
          fetched: number;
          created: number;
          updated: number;
          duplicates: number;
          skipped: number;
          error_msg: string | null;
        };
        Insert: Omit<Database['public']['Tables']['sync_runs']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['sync_runs']['Insert']>;
      };

      admin_users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'super_admin' | 'admin' | 'counselor';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admin_users']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['admin_users']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
