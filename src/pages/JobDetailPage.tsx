import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Briefcase, Clock, Building2, ExternalLink, Share2, CheckCircle2 } from 'lucide-react';
import { AmbientCanvas } from '../components/AmbientCanvas.tsx';
import { PromoSlot } from '../components/PromoSlot.tsx';
import { JobListing } from '../types/index.ts';
import { injectAnimations } from '../lib/animations.ts';
import { buildJobUrl } from '../lib/slugify.ts';
import { renderRichText } from '../lib/richText.ts';

function jobSection(job: JobListing): 'jobs' | 'internships' | 'articleship' {
  if (job.jobType.includes('Articleship')) return 'articleship';
  if (job.jobType === 'Internship') return 'internships';
  return 'jobs';
}

injectAnimations();

function mapExternal(j: any): JobListing {
  const company = j.company || 'CA Firm';
  return {
    id: j.id,
    title: j.title || 'Untitled',
    company,
    logoText: company.charAt(0).toUpperCase(),
    location: j.location || 'India',
    city: (j.location || 'India').split(',')[0].trim(),
    workplaceType: j.is_remote ? 'Remote' : 'Onsite',
    jobType: j.job_type === 'articleship' || j.job_type === 'trainee'
      ? 'Articleship / Industrial Training'
      : j.job_type === 'internship' ? 'Internship' : 'Full-Time',
    experienceLevel: '0-1 yr (Fresher)',
    minExperienceYears: 0,
    salaryText: j.stipend > 0 ? `₹${j.stipend.toLocaleString('en-IN')}/mo` : 'As per norms',
    salaryMinLPA: j.stipend > 0 ? parseFloat((j.stipend * 12 / 100000).toFixed(1)) : undefined,
    qualifications: j.courses || ['CA'],
    mandatorySkills: [],
    goodToHaveSkills: [],
    description: j.description || '',
    keyResponsibilities: [],
    source: j.source?.includes('icai') ? 'arivupro_exclusive' : 'naukri',
    sourceUrl: j.apply_url,
    arivuproExclusive: j.source?.includes('icai') || j.source === 'icmai',
    isUrgent: false,
    postedDate: j.posted_at ? j.posted_at.split('T')[0] : '',
    deadlineDate: '',
    applicantsCount: 0,
    department: 'Audit & Assurance',
  };
}

function mapInternal(j: any): JobListing {
  return {
    id: j.id,
    title: j.title || '',
    company: j.company || '',
    logoText: (j.company || '?').charAt(0).toUpperCase(),
    location: j.location || '',
    city: j.city || (j.location || '').split(',')[0].trim(),
    workplaceType: j.workplace_type === 'remote' ? 'Remote' : j.workplace_type === 'hybrid' ? 'Hybrid' : 'Onsite',
    jobType: j.job_type === 'articleship' ? 'Articleship / Industrial Training'
      : j.job_type === 'internship' ? 'Internship' : 'Full-Time',
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
    source: 'direct_recruiter',
    sourceUrl: undefined,
    arivuproExclusive: j.arivupro_exclusive ?? false,
    isUrgent: j.is_urgent ?? false,
    postedDate: j.posted_date ? j.posted_date.split('T')[0] : '',
    deadlineDate: j.deadline_date ? j.deadline_date.split('T')[0] : '',
    applicantsCount: j.applicants_count ?? 0,
    department: j.department || 'Audit & Assurance',
  };
}

export default function JobDetailPage() {
  const { id } = useParams<{ company: string; title: string; id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [similarJobs, setSimilarJobs] = useState<JobListing[]>([]);

  useEffect(() => {
    if (!id) { setError(true); setLoading(false); return; }
    setLoading(true);
    setError(false);

    // Try internal jobs first, fall back to external
    fetch(`/api/jobs/${id}`)
      .then(r => {
        if (r.ok) return r.json().then(mapInternal);
        return fetch(`/api/external-jobs/${id}`).then(r2 => {
          if (r2.ok) return r2.json().then(mapExternal);
          throw new Error('not found');
        });
      })
      .then(j => { setJob(j); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [id]);

  // Similar jobs — same department, different id
  useEffect(() => {
    if (!job) return;
    fetch('/api/external-jobs?limit=200')
      .then(r => r.ok ? r.json() : { jobs: [] })
      .then(data => {
        const related: JobListing[] = (data.jobs || [])
          .map(mapExternal)
          .filter((j: JobListing) => j.id !== job.id && j.department === job.department)
          .slice(0, 4);
        setSimilarJobs(related);
      })
      .catch(() => {});
  }, [job]);

  const handleApply = () => {
    if (!job) return;
    if (job.sourceUrl) {
      window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Recruiter job — pass intent to App.tsx via search param (history.state
      // gets overwritten by the app's own pushState before it can be read)
      navigate('/jobs?apply=' + job.id);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: ignore
    }
  };

  const isScraped = job && job.source !== 'direct_recruiter' && job.source !== 'arivupro_exclusive';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fffe', fontFamily: 'Manrope, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#1a7a4a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280', fontSize: 14 }}>Loading job details…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fffe', fontFamily: 'Manrope, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', margin: '0 0 8px' }}>Job not found</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>This listing may have expired or been removed.</p>
          <button className="btn-primary" onClick={() => navigate('/jobs')} style={{ justifyContent: 'center' }}>Browse open roles →</button>
        </div>
      </div>
    );
  }

  const tags = [
    job.jobType,
    job.workplaceType,
    job.experienceLevel,
    ...(job.qualifications.slice(0, 3)),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fffe', fontFamily: 'Manrope, sans-serif' }}>
      {/* Header banner */}
      <div style={{ background: '#0f2419', position: 'relative', overflow: 'hidden', padding: '20px 24px 28px' }}>
        <AmbientCanvas density="low" style={{ opacity: 0.3 }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#86efac', padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20, fontFamily: 'Manrope, sans-serif' }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="ap-fade-up" style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            {/* Logo circle */}
            <div style={{ width: 60, height: 60, borderRadius: 14, background: job.logoUrl ? '#fff' : '#1a7a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fede6d', flexShrink: 0, border: job.logoUrl ? '1px solid rgba(255,255,255,0.15)' : undefined, overflow: 'hidden', padding: job.logoUrl ? 4 : 0 }}>
              {job.logoUrl
                ? <img src={job.logoUrl} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).textContent = job.logoText; }} />
                : job.logoText
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>{job.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: '#86efac', fontWeight: 700, fontSize: 15 }}>{job.company}</span>
                {job.arivuproExclusive && (
                  <span style={{ background: '#fede6d', color: '#0f2419', fontSize: 10, fontWeight: 800, borderRadius: 6, padding: '2px 8px', letterSpacing: '0.04em' }}>EXCLUSIVE</span>
                )}
                {job.isUrgent && (
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 6, padding: '2px 8px', letterSpacing: '0.04em' }}>URGENT</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content — two columns on desktop when similar jobs exist */}
      <div style={{ maxWidth: similarJobs.length > 0 ? 1140 : 860, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: similarJobs.length > 0 ? 'minmax(0,1fr) 280px' : '1fr', gap: 28, alignItems: 'start' }} className="job-detail-grid">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* Quick facts row */}
        <div className="ap-fade-up ap-d1" style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          {[
            { icon: <MapPin size={15} />, label: 'Location', value: job.location },
            { icon: <Briefcase size={15} />, label: 'Type', value: job.jobType },
            { icon: <Building2 size={15} />, label: 'Workplace', value: job.workplaceType },
            { icon: <Clock size={15} />, label: 'Experience', value: job.experienceLevel },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
              <span style={{ color: '#1a7a4a' }}>{icon}</span>
              <div>
                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2419' }}>{value}</div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
            <span style={{ color: '#1a7a4a' }}>₹</span>
            <div>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Compensation</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2419' }}>{job.salaryText}</div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="ap-fade-up ap-d2" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tags.map(tag => (
            <span key={tag} style={{ background: '#f0fdf4', color: '#1a7a4a', border: '1px solid #bbf7d0', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700 }}>{tag}</span>
          ))}
          {job.department && (
            <span style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700 }}>{job.department}</span>
          )}
        </div>

        {/* Two-column layout: description + sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 20 }}>
          {/* Description */}
          {job.description && (
            <div className="ap-fade-up ap-d3" style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '24px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f2419', margin: '0 0 14px' }}>About this role</h2>
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: renderRichText(job.description) }} />
            </div>
          )}

          {/* Key responsibilities */}
          {job.keyResponsibilities.length > 0 && (
            <div className="ap-fade-up ap-d4" style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '24px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f2419', margin: '0 0 14px' }}>Key Responsibilities</h2>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {job.keyResponsibilities.map((r, i) => (
                  <li key={i} style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 6 }}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {(job.mandatorySkills.length > 0 || job.goodToHaveSkills.length > 0) && (
            <div className="ap-fade-up ap-d5" style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '24px' }}>
              {job.mandatorySkills.length > 0 && (
                <>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f2419', margin: '0 0 12px' }}>Required Skills</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: job.goodToHaveSkills.length > 0 ? 20 : 0 }}>
                    {job.mandatorySkills.map(s => (
                      <span key={s} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </>
              )}
              {job.goodToHaveSkills.length > 0 && (
                <>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#6b7280', margin: '0 0 12px' }}>Good to Have</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {job.goodToHaveSkills.map(s => (
                      <span key={s} style={{ background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Promo — below apply button */}
        <PromoSlot
          placement="job_detail_after_apply"
          context={{ qualifications: job.qualifications, jobType: job.jobType, city: job.city, title: job.title, description: job.description }}
        />

        {/* CTA row */}
        <div className="ap-fade-up ap-d6" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingBottom: 40 }}>
          <button
            className="btn-primary"
            onClick={handleApply}
            style={{ flex: '1 1 200px', justifyContent: 'center', gap: 8, fontSize: 15, padding: '14px 24px' }}
          >
            {isScraped ? (
              <><ExternalLink size={16} /> Apply on {job.source}</>
            ) : (
              <>Apply via ArivuPro →</>
            )}
          </button>

          <button
            onClick={handleShare}
            style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, background: copied ? '#f0fdf4' : '#fff', border: `1.5px solid ${copied ? '#86efac' : '#e5e7eb'}`, borderRadius: 10, padding: '14px 20px', fontSize: 14, fontWeight: 700, color: copied ? '#1a7a4a' : '#374151', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', transition: 'all 0.2s ease' }}
          >
            {copied ? <CheckCircle2 size={15} /> : <Share2 size={15} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      {/* Right sidebar — similar jobs + promo card */}
      {similarJobs.length > 0 && (
        <div className="ap-fade-right ap-d2" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PromoSlot
            placement="job_detail_sidebar"
            context={{ qualifications: job.qualifications, jobType: job.jobType, city: job.city, title: job.title, description: job.description }}
          />
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>Similar jobs</h3>
          {similarJobs.map(sj => (
            <Link
              key={sj.id}
              to={buildJobUrl(jobSection(sj), sj)}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                padding: '14px 16px', transition: 'all 0.15s ease', cursor: 'pointer',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#1a7a4a';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 14px rgba(26,122,74,0.09)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: sj.logoUrl ? '#fff' : '#f0faf4', border: '1px solid #d7f4ea',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 13, color: '#1a7a4a', overflow: 'hidden', padding: sj.logoUrl ? 3 : 0,
                  }}>
                    {sj.logoUrl
                      ? <img src={sj.logoUrl} alt={sj.company} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).textContent = sj.logoText; }} />
                      : sj.logoText
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2419', lineHeight: 1.3, marginBottom: 3 }}
                      className="similar-job-title">
                      {sj.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{sj.company}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={10} /> {sj.city}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .job-detail-grid { grid-template-columns: 1fr !important; }
        }
        .similar-job-title { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
      `}</style>
      </div>
    </div>
  );
}
