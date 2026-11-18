import React from 'react';
import { MapPin, Clock, ExternalLink, CheckCircle2, Bookmark, BookmarkCheck } from 'lucide-react';
import { JobListing } from '../types/index.ts';

interface JobCardProps {
  job: JobListing;
  onApply: (job: JobListing) => void;
  onViewDetails: (job: JobListing) => void;
  isApplied: boolean;
  isSaved?: boolean;
  onSaveToggle?: (job: JobListing) => void;
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function getCompanyInitials(company: string): string {
  return company.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function JobTypePill({ jobType }: { jobType: string }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    'Full-Time':                      { bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' },
    'Articleship / Industrial Training': { bg: '#fff8e1', color: '#f57f17', border: '#ffe082' },
    'Internship':                     { bg: '#e3f2fd', color: '#1565c0', border: '#bbdefb' },
    'Contract':                       { bg: '#f3e5f5', color: '#6a1b9a', border: '#e1bee7' },
  };
  const s = styles[jobType] ?? { bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' };
  const label = jobType === 'Articleship / Industrial Training' ? 'Articleship' : jobType;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 6,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.01em',
    }}>
      {label}
    </span>
  );
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply, onViewDetails, isApplied, isSaved, onSaveToggle }) => {
  const isScraped = job.source !== 'arivupro_exclusive' && job.source !== 'direct_recruiter';
  const companyInitials = getCompanyInitials(job.company);
  const postedLabel = relativeTime(job.postedDate);

  return (
    <div
      className="job-card-pro"
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '20px 22px',
        transition: 'box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease',
        cursor: 'default',
        position: 'relative',
      }}
    >
      {/* Top: logo + title/company + badges */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

        {/* Company Logo */}
        <div style={{
          width: 48, height: 48, borderRadius: 10, flexShrink: 0,
          background: '#f3f4f6', border: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13, color: '#374151',
          letterSpacing: '-0.01em', fontFamily: 'Manrope, sans-serif',
        }}>
          {job.logoText || companyInitials}
        </div>

        {/* Title + Company + Badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => onViewDetails(job)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
            >
              <span className="job-title-link" style={{
                fontSize: 15, fontWeight: 800, color: '#111827',
                lineHeight: 1.3, letterSpacing: '-0.01em', display: 'block',
                marginBottom: 2,
              }}>
                {job.title}
              </span>
            </button>

            {/* Top-right badges */}
            <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap' }}>
              {job.arivuproExclusive && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '3px 9px', borderRadius: 6,
                  background: '#f0faf4', border: '1px solid #d7f4ea',
                  color: '#1a7a4a', fontSize: 10, fontWeight: 700,
                }}>
                  ArivuPro
                </span>
              )}
              {job.isUrgent && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '3px 9px', borderRadius: 6,
                  background: '#fef2f2', border: '1px solid #fecaca',
                  color: '#dc2626', fontSize: 10, fontWeight: 700,
                }}>
                  Urgent
                </span>
              )}
            </div>
          </div>

          {/* Company name + location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
              {job.company}
            </span>
            <span style={{ color: '#d1d5db', fontSize: 12 }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
              <MapPin size={11} color="#9ca3af" />
              {job.city}{job.workplaceType === 'Remote' ? ' (Remote)' : job.workplaceType === 'Hybrid' ? ' (Hybrid)' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ── Key Details row ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 16,
        margin: '12px 0 10px',
        fontSize: 13, color: '#374151',
      }}>
        <span><span style={{ color: '#9ca3af', fontWeight: 500 }}>Stipend/CTC </span><strong style={{ fontWeight: 700, color: '#111827' }}>{job.salaryText}</strong></span>
        <span style={{ color: '#e5e7eb' }}>·</span>
        <span><span style={{ color: '#9ca3af', fontWeight: 500 }}>Exp </span><strong style={{ fontWeight: 600, color: '#374151' }}>{job.experienceLevel}</strong></span>
        <span style={{ color: '#e5e7eb' }}>·</span>
        <span style={{ fontWeight: 600, color: '#374151' }}>{job.qualifications.slice(0, 3).map(q => q.replace(/_/g, ' ')).join(', ') || 'Open'}</span>
      </div>

      {/* ── Type + Department tags ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <JobTypePill jobType={job.jobType} />
        {job.department && (
          <span style={{
            padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: '#f5f5f5', color: '#616161', border: '1px solid #e0e0e0',
          }}>
            {job.department}
          </span>
        )}
        {job.workplaceType !== 'Onsite' && (
          <span style={{
            padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb',
          }}>
            {job.workplaceType}
          </span>
        )}
      </div>

      {/* ── Footer: posted time + action buttons ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 12, borderTop: '1px solid #f3f4f6', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {postedLabel && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
              <Clock size={11} color="#d1d5db" />
              {postedLabel}
            </span>
          )}
          {job.applicantsCount > 0 && (
            <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
              {job.applicantsCount} applicants
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onSaveToggle && (
            <button
              onClick={e => { e.stopPropagation(); onSaveToggle(job); }}
              title={isSaved ? 'Remove from saved' : 'Save job'}
              style={{
                background: isSaved ? '#f0faf4' : 'none',
                border: `1.5px solid ${isSaved ? '#d7f4ea' : '#e5e7eb'}`,
                borderRadius: 8, padding: '7px 10px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                color: isSaved ? '#1a7a4a' : '#9ca3af',
                transition: 'all 0.15s',
              }}
              className="save-btn"
            >
              {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </button>
          )}
          <button
            onClick={() => onViewDetails(job)}
            style={{
              background: 'none', border: '1.5px solid #e5e7eb',
              borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 700, color: '#374151',
              cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            className="view-details-btn"
          >
            Details
          </button>

          {isApplied ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#e8f5e9', color: '#2e7d32',
              borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 700, border: '1.5px solid #c8e6c9',
            }}>
              <CheckCircle2 size={13} />
              Applied
            </span>
          ) : isScraped ? (
            <a
              href={job.sourceUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#1a7a4a', color: '#fff',
                borderRadius: 8, padding: '7px 16px',
                fontSize: 12, fontWeight: 700, textDecoration: 'none',
                border: '1.5px solid #1a7a4a', fontFamily: 'Manrope, sans-serif',
                transition: 'background 0.15s',
              }}
              className="apply-btn-external"
            >
              Apply Now
              <ExternalLink size={11} />
            </a>
          ) : (
            <button
              onClick={() => onApply(job)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#1a7a4a', color: '#fff',
                borderRadius: 8, padding: '7px 16px',
                fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                transition: 'background 0.15s',
              }}
              className="apply-btn-easy"
            >
              Apply
            </button>
          )}
        </div>
      </div>

      <style>{`
        .job-card-pro:hover {
          box-shadow: 0 4px 24px rgba(15,36,25,0.10);
          border-color: #d7f4ea;
          transform: translateY(-1px);
        }
        .job-title-link:hover { color: #1a7a4a !important; }
        .view-details-btn:hover { border-color: #1a7a4a !important; color: #1a7a4a !important; }
        .apply-btn-external:hover, .apply-btn-easy:hover { background: #155f39 !important; }
        .save-btn:hover { border-color: #1a7a4a !important; color: #1a7a4a !important; background: #f0faf4 !important; }
        @media (max-width: 640px) {
          .job-card-pro { padding: 14px 14px !important; }
          .job-card-pro:hover { transform: none !important; }
        }
      `}</style>
    </div>
  );
};
