import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { JobListing } from '../types/index.ts';
import { buildJobUrl } from '../lib/slugify.ts';

function jobSection(job: JobListing): 'jobs' | 'internships' | 'articleship' {
  if (job.jobType.includes('Articleship')) return 'articleship';
  if (job.jobType === 'Internship') return 'internships';
  return 'jobs';
}

interface JobCardProps {
  job: JobListing;
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

function TierBadge({ jobType }: { jobType: string }) {
  if (jobType !== 'Articleship / Industrial Training') return null;
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

export const JobCard: React.FC<JobCardProps> = ({ job, isSaved, onSaveToggle }) => {
  const companyInitials = getCompanyInitials(job.company);
  const postedLabel = relativeTime(job.postedDate);
  const quals = job.qualifications.slice(0, 3).map(q => q.replace(/_/g, ' '));
  const detailUrl = buildJobUrl(jobSection(job), job);

  return (
    <div className="ap-job-card ap-fade-up">
      {/* Stretched link covers the entire card — real <a> for keyboard + right-click */}
      <Link to={detailUrl} className="ap-card-link" aria-label={`${job.title} at ${job.company}`} />

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div className="ap-company-logo" style={job.logoUrl ? { background: '#fff', padding: 2, border: '1px solid #e5e7eb' } : undefined}>
          {job.logoUrl
            ? <img src={job.logoUrl} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).textContent = job.logoText || companyInitials; }} />
            : (job.logoText || companyInitials)
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
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

          <span className="ap-job-title">{job.title}</span>

          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10, marginTop: 4 }}>
            {job.company}
          </div>

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

        {/* Save button — above the stretched link via z-index */}
        {onSaveToggle && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onSaveToggle(job); }}
            className={`ap-save-btn${isSaved ? ' saved' : ''}`}
            title={isSaved ? 'Remove from saved' : 'Save'}
            style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}
          >
            {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </button>
        )}
      </div>

      <style>{`
        .ap-job-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 20px 24px;
          position: relative;
          transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
          will-change: transform;
          cursor: pointer;
        }
        .ap-job-card:hover {
          border-color: #c8e6d6;
          box-shadow: 0 10px 28px rgba(15,36,25,0.10);
          transform: translateY(-3px);
        }
        .ap-card-link {
          position: absolute;
          inset: 0;
          border-radius: 10px;
          z-index: 0;
        }
        .ap-card-link:focus-visible {
          outline: 2px solid #1a7a4a;
          outline-offset: 2px;
        }
        .ap-company-logo {
          width: 72px; height: 72px;
          border-radius: 8px; flex-shrink: 0;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 15px; color: #495057;
          letter-spacing: -0.01em; font-family: Manrope, sans-serif;
          position: relative; z-index: 1;
        }
        .ap-job-title {
          font-size: 15px; font-weight: 700; color: #111827;
          line-height: 1.35; display: block;
          font-family: Manrope, sans-serif;
          text-transform: uppercase; letter-spacing: 0.01em;
        }
        .ap-job-card:hover .ap-job-title { color: #1a7a4a; }
        .ap-meta-item {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 13px; color: #6b7280; font-weight: 500;
          position: relative; z-index: 1;
        }
        .ap-meta-sep {
          margin: 0 8px; color: #d1d5db; font-size: 13px;
          position: relative; z-index: 1;
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
        @media (max-width: 640px) {
          .ap-job-card { padding: 14px 14px; }
          .ap-company-logo { width: 48px; height: 48px; font-size: 12px; }
        }
      `}</style>
    </div>
  );
};
