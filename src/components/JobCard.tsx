import React from 'react';
import { MapPin, Briefcase, Clock, ExternalLink, CheckCircle2, Star, Zap, IndianRupee, GraduationCap, Building2, Bookmark, BookmarkCheck } from 'lucide-react';
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

function getLogoColors(company: string): { bg: string; text: string } {
  const hash = company.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const palettes = [
    { bg: '#e8f5e9', text: '#2e7d32' },
    { bg: '#e3f2fd', text: '#1565c0' },
    { bg: '#fce4ec', text: '#c62828' },
    { bg: '#fff3e0', text: '#e65100' },
    { bg: '#f3e5f5', text: '#6a1b9a' },
    { bg: '#e0f7fa', text: '#00695c' },
    { bg: '#fafafa', text: '#37474f' },
    { bg: '#fff8e1', text: '#f57f17' },
  ];
  return palettes[hash % palettes.length];
}

function JobTypePill({ jobType }: { jobType: string }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    'Full-Time':                      { bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' },
    'Articleship / Industrial Training': { bg: '#fff8e1', color: '#f57f17', border: '#ffe082' },
    'Internship':                     { bg: '#e3f2fd', color: '#1565c0', border: '#bbdefb' },
    'Contract':                       { bg: '#f3e5f5', color: '#6a1b9a', border: '#e1bee7' },
  };
  const s = styles[jobType] ?? { bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 6,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.01em',
    }}>
      <Briefcase size={9} />
      {jobType}
    </span>
  );
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply, onViewDetails, isApplied, isSaved, onSaveToggle }) => {
  const isScraped = job.source !== 'arivupro_exclusive' && job.source !== 'direct_recruiter';
  const logoColors = getLogoColors(job.company);
  const postedLabel = relativeTime(job.postedDate);

  return (
    <div
      className="job-card-pro"
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 14,
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
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: logoColors.bg, border: '1.5px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 18, color: logoColors.text,
          letterSpacing: '-0.03em', fontFamily: 'Manrope, sans-serif',
        }}>
          {job.logoText || job.company.charAt(0)}
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
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '3px 9px', borderRadius: 6,
                  background: '#fff8e1', border: '1px solid #ffe082',
                  color: '#f57f17', fontSize: 10, fontWeight: 800,
                }}>
                  <Star size={9} />
                  Exclusive
                </span>
              )}
              {job.isUrgent && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '3px 9px', borderRadius: 6,
                  background: '#fce4ec', border: '1px solid #f48fb1',
                  color: '#c62828', fontSize: 10, fontWeight: 800,
                }}>
                  <Zap size={9} />
                  Urgent
                </span>
              )}
            </div>
          </div>

          {/* Company name + location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 1 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#374151' }}>
              <Building2 size={12} color="#9ca3af" />
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
        display: 'flex', flexWrap: 'wrap', gap: 10,
        margin: '14px 0 12px',
        padding: '12px 14px',
        background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6',
      }}>
        {/* Salary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 120 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={12} color="#2e7d32" />
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, lineHeight: 1 }}>Salary</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>{job.salaryText}</div>
          </div>
        </div>

        <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch' }} />

        {/* Experience */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 110 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={12} color="#1565c0" />
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, lineHeight: 1 }}>Experience</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{job.experienceLevel}</div>
          </div>
        </div>

        <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch' }} />

        {/* Qualification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#f3e5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={12} color="#6a1b9a" />
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, lineHeight: 1 }}>Qualification</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
              {job.qualifications.slice(0, 3).map(q => q.replace(/_/g, ' ')).join(' · ') || 'Open'}
            </div>
          </div>
        </div>
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
            background: job.workplaceType === 'Remote' ? '#e0f2f1' : '#e8f5e9',
            color: job.workplaceType === 'Remote' ? '#00695c' : '#2e7d32',
            border: `1px solid ${job.workplaceType === 'Remote' ? '#b2dfdb' : '#c8e6c9'}`,
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
            View Details
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
              Easy Apply →
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
      `}</style>
    </div>
  );
};
