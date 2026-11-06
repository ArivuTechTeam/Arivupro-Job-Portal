import React from 'react';
import { MapPin, Users, Clock, ExternalLink, CheckCircle2, Star, Zap } from 'lucide-react';
import { JobListing } from '../types/index.ts';

interface JobCardProps {
  job: JobListing;
  onApply: (job: JobListing) => void;
  onViewDetails: (job: JobListing) => void;
  isApplied: boolean;
}

function getJobTypeBadgeClass(jobType: string): string {
  if (jobType.includes('Articleship')) return 'badge badge-amber';
  if (jobType === 'Internship') return 'badge badge-blue';
  if (jobType === 'Full-Time') return 'badge badge-green';
  if (jobType === 'Contract') return 'badge badge-purple';
  return 'badge badge-gray';
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply, onViewDetails, isApplied }) => {
  const isScraped = job.source !== 'arivupro_exclusive' && job.source !== 'direct_recruiter';

  return (
    <div
      className="card"
      style={{ padding: 20, cursor: 'default' }}
    >
      {/* Top row: logo + title + match score */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 10 }}>
        {/* Company logo circle */}
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 10,
            background: '#1a7a4a',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 14,
            flexShrink: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {job.logoText}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            onClick={() => onViewDetails(job)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#0f2419',
                lineHeight: 1.3,
                marginBottom: 2,
                letterSpacing: '-0.01em',
              }}
              className="job-title-hover"
            >
              {job.title}
            </div>
          </button>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{job.company}</div>
        </div>
      </div>

      {/* Badge row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        <span className={getJobTypeBadgeClass(job.jobType)}>{job.jobType}</span>
        {job.arivuproExclusive && (
          <span className="badge badge-yellow">
            <Star size={9} />
            Exclusive
          </span>
        )}
        {job.isUrgent && (
          <span className="badge badge-red">
            <Zap size={9} />
            Urgent
          </span>
        )}
        {job.qualifications.slice(0, 3).map((q) => (
          <span key={q} className="badge badge-mint">
            {q.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Salary */}
      <div style={{ fontSize: 15, fontWeight: 800, color: '#1a7a4a', marginBottom: 8 }}>
        {job.salaryText}
      </div>

      {/* Meta row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 12,
          color: '#6b7280',
          marginBottom: 14,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={12} color="#9ca3af" />
          {job.city}
        </span>
        <span className="badge badge-gray" style={{ fontSize: 11 }}>{job.workplaceType}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users size={12} color="#9ca3af" />
          {job.applicantsCount} applied
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} color="#9ca3af" />
          {relativeTime(job.postedDate)}
        </span>
      </div>

      {/* Footer: match score + action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          paddingTop: 12,
          borderTop: '1px solid #f3f4f6',
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => onViewDetails(job)}
            className="btn-ghost"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            View Details
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isApplied ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#d7f4ea',
                color: '#1a7a4a',
                borderRadius: 999,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              <CheckCircle2 size={13} />
              Applied ✓
            </span>
          ) : isScraped ? (
            <a
              href={job.sourceUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
              style={{ fontSize: 12, padding: '6px 14px' }}
            >
              Apply ↗
              <ExternalLink size={11} />
            </a>
          ) : (
            <button
              onClick={() => onApply(job)}
              className="btn-primary"
              style={{ fontSize: 12, padding: '6px 16px' }}
            >
              Easy Apply →
            </button>
          )}
        </div>
      </div>

      <style>{`
        .job-title-hover:hover { color: #1a7a4a; }
      `}</style>
    </div>
  );
};
