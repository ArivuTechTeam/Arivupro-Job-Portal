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
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function getCompanyInitials(company: string): string {
  return company.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// Qualification badge — matches the real portal's credential pills
function QualBadge({ qual }: { qual: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'CA':       { bg: '#eff6ff', color: '#1d4ed8' },
    'ACCA':     { bg: '#f0fdf4', color: '#15803d' },
    'CMA':      { bg: '#fef3c7', color: '#b45309' },
    'CMA India':{ bg: '#fef3c7', color: '#b45309' },
    'CS':       { bg: '#f3e8ff', color: '#7c3aed' },
    'CFA':      { bg: '#fff1f2', color: '#be123c' },
    'US CPA':   { bg: '#f0f9ff', color: '#0369a1' },
    'US CMA':   { bg: '#fdf4ff', color: '#7e22ce' },
  };
  const s = map[qual] ?? { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 4,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
    }}>
      {qual}
    </span>
  );
}

// Tier badge
function TierBadge({ jobType }: { jobType: string }) {
  const isArticleship = jobType === 'Articleship / Industrial Training';
  if (!isArticleship) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 4,
      background: '#f0faf4', color: '#1a7a4a',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
    }}>
      Articleship
    </span>
  );
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply, onViewDetails, isApplied, isSaved, onSaveToggle }) => {
  const isScraped = job.source !== 'arivupro_exclusive' && job.source !== 'direct_recruiter';
  const companyInitials = getCompanyInitials(job.company);
  const postedLabel = relativeTime(job.postedDate);

  // Show qualification badges — up to 3
  const quals = job.qualifications.slice(0, 3).map(q => q.replace(/_/g, ' '));

  return (
    <div className="ap-job-card ap-fade-up">
      {/* ── Row 1: Logo + all content ── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* Company logo — 72×72 like the real portal */}
        <div className="ap-company-logo">
          {job.logoText || companyInitials}
        </div>

        {/* Right column */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Badges row — qualification + job type */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
            {quals.map(q => <QualBadge key={q} qual={q} />)}
            <TierBadge jobType={job.jobType} />
            {job.isUrgent && (
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700 }}>
                Urgent
              </span>
            )}
            {job.arivuproExclusive && (
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, background: '#fede6d', color: '#5a4a00', fontSize: 11, fontWeight: 700 }}>
                ArivuPro
              </span>
            )}
          </div>

          {/* Job title */}
          <button
            onClick={() => onViewDetails(job)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', display: 'block', marginBottom: 4 }}
          >
            <span className="ap-job-title">{job.title}</span>
          </button>

          {/* Company name */}
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
            {job.company}
          </div>

          {/* Meta row: location · stipend · duration · posted */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, alignItems: 'center' }}>
            <span className="ap-meta-item">
              <MapPin size={12} color="#9ca3af" />
              {job.city}{job.workplaceType === 'Remote' ? ' (Remote)' : job.workplaceType === 'Hybrid' ? ' (Hybrid)' : ''}
            </span>
            <span className="ap-meta-sep">·</span>
            <span className="ap-meta-item" style={{ fontWeight: 700, color: '#0f2419' }}>
              {job.salaryText}
            </span>
            {job.jobType === 'Articleship / Industrial Training' && (
              <>
                <span className="ap-meta-sep">·</span>
                <span className="ap-meta-item">2 years</span>
              </>
            )}
            {postedLabel && (
              <>
                <span className="ap-meta-sep">·</span>
                <span className="ap-meta-item" style={{ color: '#9ca3af' }}>
                  <Clock size={11} color="#d1d5db" />
                  Posted {postedLabel}
                </span>
              </>
            )}
            {job.applicantsCount > 0 && (
              <>
                <span className="ap-meta-sep">·</span>
                <span className="ap-meta-item" style={{ color: '#9ca3af' }}>{job.applicantsCount} applicants</span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons — right aligned on desktop */}
        <div className="ap-card-actions">
          {onSaveToggle && (
            <button
              onClick={e => { e.stopPropagation(); onSaveToggle(job); }}
              className={`ap-save-btn${isSaved ? ' saved' : ''}`}
              title={isSaved ? 'Remove from saved' : 'Save'}
            >
              {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            </button>
          )}

          {isApplied ? (
            <span className="ap-applied-chip">
              <CheckCircle2 size={13} /> Applied
            </span>
          ) : isScraped ? (
            <a
              href={job.sourceUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="ap-btn-view"
            >
              View <ExternalLink size={11} />
            </a>
          ) : (
            <button onClick={() => onApply(job)} className="ap-btn-apply">
              Apply
            </button>
          )}
        </div>
      </div>

      <style>{`
        .ap-job-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 20px 24px;
          transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
          cursor: default;
          will-change: transform;
        }
        .ap-job-card:hover {
          border-color: #c8e6d6;
          box-shadow: 0 10px 28px rgba(15,36,25,0.10);
          transform: translateY(-3px);
        }
        .ap-company-logo {
          width: 72px; height: 72px;
          border-radius: 8px; flex-shrink: 0;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 15px; color: #495057;
          letter-spacing: -0.01em; font-family: Manrope, sans-serif;
        }
        .ap-job-title {
          font-size: 15px; font-weight: 700; color: #111827;
          line-height: 1.35; display: block;
          font-family: Manrope, sans-serif;
          text-transform: uppercase; letter-spacing: 0.01em;
        }
        .ap-job-title:hover { color: #1a7a4a; }
        .ap-meta-item {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 13px; color: #6b7280; font-weight: 500;
        }
        .ap-meta-sep {
          margin: 0 8px; color: #d1d5db; font-size: 13px;
        }
        .ap-card-actions {
          display: flex; flex-direction: column; gap: 8px;
          align-items: flex-end; flex-shrink: 0;
        }
        .ap-save-btn {
          background: none; border: 1px solid #e5e7eb;
          border-radius: 6px; padding: 6px 8px;
          cursor: pointer; color: #9ca3af;
          display: flex; align-items: center;
          transition: all 0.15s;
        }
        .ap-save-btn:hover, .ap-save-btn.saved {
          border-color: #1a7a4a; color: #1a7a4a; background: #f0faf4;
        }
        .ap-btn-view {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 18px; border-radius: 6px;
          background: #0f2419; color: #fff;
          font-size: 13px; font-weight: 700;
          text-decoration: none; font-family: Manrope, sans-serif;
          border: none; cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .ap-btn-view:hover { background: #1a7a4a; }
        .ap-btn-apply {
          display: inline-flex; align-items: center;
          padding: 7px 18px; border-radius: 6px;
          background: #0f2419; color: #fff;
          font-size: 13px; font-weight: 700;
          border: none; cursor: pointer; font-family: Manrope, sans-serif;
          transition: background 0.15s;
        }
        .ap-btn-apply:hover { background: #1a7a4a; }
        .ap-applied-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: #f0faf4; color: #1a7a4a;
          border-radius: 6px; padding: 7px 14px;
          font-size: 13px; font-weight: 700;
          border: 1px solid #d7f4ea;
        }
        @media (max-width: 640px) {
          .ap-job-card { padding: 14px 14px; }
          .ap-company-logo { width: 48px; height: 48px; font-size: 12px; }
          .ap-card-actions { flex-direction: row; }
        }
      `}</style>
    </div>
  );
};
