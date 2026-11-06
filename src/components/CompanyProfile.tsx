import React from 'react';
import { ArrowLeft, MapPin, Globe, Users, Briefcase, CheckCircle, Star, ExternalLink, Building2 } from 'lucide-react';
import { JobListing } from '../types/index.ts';

interface Company {
  name: string;
  logoText: string;
  type: string;
  status: 'MoU Partner' | 'Verified';
  about: string;
  website: string;
  headquarters: string;
  companySize: string;
  founded: string;
  industry: string;
  specializations: string[];
}

interface CompanyProfileProps {
  company: Company;
  jobs: JobListing[];
  onBack: () => void;
  onApply: (job: JobListing) => void;
  appliedIds: Set<string>;
  isGuest: boolean;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({
  company, jobs, onBack, onApply, appliedIds, isGuest,
}) => {
  return (
    <div style={{ background: '#f7f7f7', minHeight: '100vh' }}>

      {/* ── Top back bar ── */}
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

      {/* ── Company Header Banner ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 0' }}>

          {/* Top row: logo + name + badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 14,
              background: '#f0faf4', border: '2px solid #d7f4ea',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 20, color: '#1a7a4a', flexShrink: 0,
            }}>
              {company.logoText}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f2419', margin: 0 }}>{company.name}</h1>
                <span className={company.status === 'MoU Partner' ? 'badge badge-yellow' : 'badge badge-green'}>
                  {company.status === 'MoU Partner' ? '★ MoU Partner' : '✓ Verified'}
                </span>
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 10 }}>{company.type} · {company.industry}</div>

              {/* Meta row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                {[
                  { icon: <MapPin size={13} />, text: company.headquarters },
                  { icon: <Users size={13} />, text: company.companySize },
                  { icon: <Globe size={13} />, text: company.website },
                  { icon: <Building2 size={13} />, text: `Est. ${company.founded}` },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6b7280' }}>
                    <span style={{ color: '#9ca3af' }}>{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: active jobs count */}
            <div style={{
              background: '#f0faf4', border: '1px solid #d7f4ea',
              borderRadius: 12, padding: '12px 20px', textAlign: 'center', flexShrink: 0,
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1a7a4a' }}>{jobs.length}</div>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Active Jobs</div>
            </div>
          </div>

          {/* Tab row (just Jobs tab for now) */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #f3f4f6', marginTop: 4 }}>
            {['Jobs', 'About', 'Reviews'].map((t, i) => (
              <div key={t} style={{
                padding: '12px 20px', fontSize: 14, fontWeight: 600,
                color: i === 0 ? '#1a7a4a' : '#6b7280',
                borderBottom: i === 0 ? '2px solid #1a7a4a' : '2px solid transparent',
                cursor: 'pointer',
              }}>
                {t} {i === 0 && <span style={{ background: '#f0faf4', borderRadius: 999, padding: '1px 8px', fontSize: 11, color: '#1a7a4a', fontWeight: 700, marginLeft: 4 }}>{jobs.length}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content: 2-col layout ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* LEFT: Job listings */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>
              Jobs at {company.name}
            </h2>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{jobs.length} open positions</p>
          </div>

          {jobs.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '48px 24px', textAlign: 'center' }}>
              <Briefcase size={36} color="#d7f4ea" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#6b7280' }}>No open positions right now</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Check back soon — this company posts regularly</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {jobs.map(job => (
                <div key={job.id} style={{
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
                  padding: '20px 20px 16px', transition: 'all 0.15s ease',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = '#1a7a4a';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(26,122,74,0.08)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  }}
                >
                  {/* Job header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#0f2419' }}>{job.title}</span>
                        {job.arivuproExclusive && <span className="badge badge-green">⭐ Exclusive</span>}
                        {job.isUrgent && <span className="badge badge-red">🔥 Urgent</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>
                        {job.location} · {job.workplaceType} · {job.jobType}
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1a7a4a', flexShrink: 0 }}>{job.salaryText}</div>
                  </div>

                  {/* Skills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {job.mandatorySkills.slice(0, 5).map(skill => (
                      <span key={skill} style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                        background: '#f3f4f6', color: '#374151',
                      }}>{skill}</span>
                    ))}
                  </div>

                  {/* Footer row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {job.applicantsCount} applicants · Posted {job.postedDate} · Deadline {job.deadlineDate}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {appliedIds.has(job.id) ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#1a7a4a' }}>
                          <CheckCircle size={14} /> Applied
                        </span>
                      ) : job.sourceUrl ? (
                        <a
                          href={job.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline"
                          style={{ fontSize: 12, padding: '7px 16px' }}
                        >
                          Apply ↗ <ExternalLink size={11} />
                        </a>
                      ) : (
                        <button
                          className="btn-primary"
                          style={{ fontSize: 12, padding: '7px 20px' }}
                          onClick={() => onApply(job)}
                        >
                          Easy Apply →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Company info sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* About card */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f2419', margin: '0 0 12px' }}>About {company.name}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, margin: '0 0 16px' }}>{company.about}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Industry', value: company.industry },
                { label: 'Headquarters', value: company.headquarters },
                { label: 'Company size', value: company.companySize },
                { label: 'Founded', value: company.founded },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#9ca3af', fontWeight: 600 }}>{item.label}</span>
                  <span style={{ color: '#374151', fontWeight: 700, textAlign: 'right', maxWidth: 160 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Specializations */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f2419', margin: '0 0 12px' }}>Specializations</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {company.specializations.map(s => (
                <span key={s} style={{
                  fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 999,
                  background: '#f0faf4', border: '1px solid #d7f4ea', color: '#1a7a4a',
                }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Rating placeholder */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f2419', margin: '0 0 12px' }}>ArivuPro Rating</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#1a7a4a' }}>4.3</div>
              <div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} fill={i <= 4 ? '#fede6d' : 'none'} color={i <= 4 ? '#fede6d' : '#d1d5db'} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Based on student reviews</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
