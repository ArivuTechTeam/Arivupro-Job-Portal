import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Globe, Users, Briefcase, Building2 } from 'lucide-react';
import { JobListing } from '../types/index.ts';
import { ApiCompany } from './CompanyDirectory.tsx';
import { JobCard } from './JobCard.tsx';

interface CompanyProfileFromApiProps {
  company: ApiCompany;
  onBack: () => void;
  onApply: (job: JobListing) => void;
  appliedIds: Set<string>;
  isGuest: boolean;
}

interface ApiJobListing {
  id: string;
  title: string;
  location?: string;
  workplace_type?: string;
  job_type?: string;
  salary_text?: string;
  salary_min_lpa?: number;
  salary_max_lpa?: number;
  mandatory_skills?: string[];
  apply_url?: string;
  posted_date?: string;
  deadline_date?: string;
  applicants_count?: number;
  arivupro_exclusive?: boolean;
  is_urgent?: boolean;
}

function mapApiJobToListing(job: ApiJobListing, companyName: string): JobListing {
  const logoText = companyName.slice(0, 2).toUpperCase();
  return {
    id: job.id,
    title: job.title,
    company: companyName,
    logoText,
    location: job.location || '',
    city: (job.location || '').split(',')[0].trim(),
    workplaceType: (job.workplace_type as JobListing['workplaceType']) || 'Onsite',
    jobType: (job.job_type === 'articleship' ? 'Articleship / Industrial Training'
      : job.job_type === 'internship' ? 'Internship' : 'Full-Time') as JobListing['jobType'],
    experienceLevel: '0-1 yr (Fresher)' as JobListing['experienceLevel'],
    minExperienceYears: 0,
    salaryText: job.salary_text || 'As per norms',
    salaryMinLPA: job.salary_min_lpa,
    salaryMaxLPA: job.salary_max_lpa,
    qualifications: [],
    mandatorySkills: job.mandatory_skills || [],
    goodToHaveSkills: [],
    description: '',
    keyResponsibilities: [],
    source: job.apply_url ? 'direct_recruiter' : 'direct_recruiter',
    sourceUrl: job.apply_url,
    arivuproExclusive: job.arivupro_exclusive || false,
    isUrgent: job.is_urgent || false,
    postedDate: job.posted_date?.split('T')[0] || '',
    deadlineDate: job.deadline_date?.split('T')[0] || '',
    applicantsCount: job.applicants_count || 0,
    department: 'Audit & Assurance',
  };
}

export const CompanyProfileFromApi: React.FC<CompanyProfileFromApiProps> = ({
  company, onBack, onApply, appliedIds, isGuest,
}) => {
  const [companyDetail, setCompanyDetail] = useState<ApiCompany>(company);
  const [apiJobs, setApiJobs] = useState<ApiJobListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/companies/${company.id}/public`)
      .then(r => r.ok ? r.json() : { company: null, jobs: [] })
      .then(data => {
        if (data.company) {
          const c = data.company;
          setCompanyDetail({
            id: c.id,
            name: c.company_name || c.name || company.name,
            logo_url: c.logo_url,
            industry_category: c.industry || c.industry_category,
            company_type: c.company_type,
            headquarters: c.city || c.headquarters,
            company_size: c.company_size,
            founded_year: c.founded_year,
            about: c.about || c.notes,
            website: c.website,
            specializations: c.hiring_focus,
            status: c.verification_status === 'verified' ? 'Verified' : 'Active',
            active_jobs_count: data.active_jobs_count ?? c.active_jobs_count ?? 0,
          });
        }
        setApiJobs(data.jobs || []);
      })
      .catch(() => setApiJobs([]))
      .finally(() => setLoading(false));
  }, [company.id]);

  const logoFallback = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <div style={{ background: '#f7f7f7', minHeight: '100vh' }}>

      {/* Back bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: '#6b7280',
              fontFamily: 'Manrope, sans-serif', padding: 0,
            }}
          >
            <ArrowLeft size={15} /> Back to Companies
          </button>
        </div>
      </div>

      {/* Company Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>

            {/* Logo */}
            {companyDetail.logo_url ? (
              <img
                src={companyDetail.logo_url}
                alt={companyDetail.name}
                style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'contain', border: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: 14,
                background: '#f0faf4', border: '2px solid #d7f4ea',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 20, color: '#1a7a4a', flexShrink: 0,
              }}>
                {logoFallback(companyDetail.name)}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f2419', margin: 0 }}>{companyDetail.name}</h1>
                <span className={companyDetail.status === 'MoU Partner' ? 'badge badge-yellow' : 'badge badge-green'}>
                  {companyDetail.status === 'MoU Partner' ? '★ MoU Partner' : '✓ Verified'}
                </span>
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 10 }}>
                {companyDetail.industry_category || companyDetail.company_type || 'Company'}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                {companyDetail.headquarters && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6b7280' }}>
                    <MapPin size={13} color="#9ca3af" /> {companyDetail.headquarters}
                  </div>
                )}
                {companyDetail.company_size && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6b7280' }}>
                    <Users size={13} color="#9ca3af" /> {companyDetail.company_size}
                  </div>
                )}
                {companyDetail.website && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6b7280' }}>
                    <Globe size={13} color="#9ca3af" /> {companyDetail.website}
                  </div>
                )}
                {companyDetail.founded_year && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6b7280' }}>
                    <Building2 size={13} color="#9ca3af" /> Est. {companyDetail.founded_year}
                  </div>
                )}
              </div>
            </div>

            {/* Active jobs counter */}
            <div style={{
              background: '#f0faf4', border: '1px solid #d7f4ea',
              borderRadius: 12, padding: '12px 20px', textAlign: 'center', flexShrink: 0,
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1a7a4a' }}>
                {loading ? '—' : apiJobs.length}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Active Jobs</div>
            </div>
          </div>

          {/* Tab row */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #f3f4f6', marginTop: 4 }}>
            {['Jobs', 'About'].map((t, i) => (
              <div key={t} style={{
                padding: '12px 20px', fontSize: 14, fontWeight: 600,
                color: i === 0 ? '#1a7a4a' : '#6b7280',
                borderBottom: i === 0 ? '2px solid #1a7a4a' : '2px solid transparent',
                cursor: 'default',
              }}>
                {t} {i === 0 && (
                  <span style={{ background: '#f0faf4', borderRadius: 999, padding: '1px 8px', fontSize: 11, color: '#1a7a4a', fontWeight: 700, marginLeft: 4 }}>
                    {loading ? '…' : apiJobs.length}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2-col content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* LEFT: Jobs */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>
              Jobs at {companyDetail.name}
            </h2>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
              {loading ? 'Loading…' : `${apiJobs.length} open positions`}
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2].map(i => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, opacity: 0.5 }}>
                  <div style={{ height: 16, background: '#f3f4f6', borderRadius: 6, marginBottom: 10, width: '50%' }} />
                  <div style={{ height: 12, background: '#f3f4f6', borderRadius: 6, width: '30%' }} />
                </div>
              ))}
            </div>
          ) : apiJobs.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '48px 24px', textAlign: 'center' }}>
              <Briefcase size={36} color="#d7f4ea" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#6b7280' }}>No open positions right now</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Check back soon — this company posts regularly</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {apiJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={mapApiJobToListing(job, companyDetail.name)}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* About card */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f2419', margin: '0 0 12px' }}>
              About {companyDetail.name}
            </h3>
            {companyDetail.about ? (
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, margin: '0 0 16px' }}>{companyDetail.about}</p>
            ) : (
              <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7, margin: '0 0 16px' }}>No description available.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Industry', value: companyDetail.industry_category },
                { label: 'Headquarters', value: companyDetail.headquarters },
                { label: 'Company size', value: companyDetail.company_size },
                { label: 'Founded', value: companyDetail.founded_year },
              ].filter(item => item.value).map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#9ca3af', fontWeight: 600 }}>{item.label}</span>
                  <span style={{ color: '#374151', fontWeight: 700, textAlign: 'right', maxWidth: 160 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Specializations */}
          {(companyDetail.specializations || []).length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f2419', margin: '0 0 12px' }}>Specializations</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(companyDetail.specializations || []).map(s => (
                  <span key={s} style={{
                    fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 999,
                    background: '#f0faf4', border: '1px solid #d7f4ea', color: '#1a7a4a',
                  }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
