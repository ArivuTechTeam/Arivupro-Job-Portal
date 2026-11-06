import React, { useEffect } from 'react';
import { X, MapPin, CheckCircle2, ExternalLink, Star, Zap, Briefcase, Globe } from 'lucide-react';
import { JobListing } from '../types/index.ts';

interface JobDetailsModalProps {
  job: JobListing | null;
  onClose: () => void;
  onApply: (job: JobListing) => void;
  isApplied: boolean;
}

function getJobTypeBadgeClass(jobType: string): string {
  if (jobType.includes('Articleship')) return 'badge badge-amber';
  if (jobType === 'Internship') return 'badge badge-blue';
  if (jobType === 'Full-Time') return 'badge badge-green';
  if (jobType === 'Contract') return 'badge badge-purple';
  return 'badge badge-gray';
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  onClose,
  onApply,
  isApplied,
}) => {
  const isScraped = job
    ? job.source !== 'arivupro_exclusive' && job.source !== 'direct_recruiter'
    : false;

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    if (job) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [job]);

  if (!job) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(15,36,25,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-up"
        style={{
          background: '#fff',
          borderRadius: 14,
          maxWidth: 640,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(15,36,25,0.2)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: '#1a7a4a',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {job.logoText}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f2419', marginBottom: 2, letterSpacing: '-0.02em' }}>
              {job.title}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{job.company}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span className={getJobTypeBadgeClass(job.jobType)}>{job.jobType}</span>
              {job.arivuproExclusive && (
                <span className="badge badge-yellow">
                  <Star size={9} /> Exclusive
                </span>
              )}
              {job.isUrgent && (
                <span className="badge badge-red">
                  <Zap size={9} /> Urgent
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: 4,
              borderRadius: 6,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body: scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Meta info row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              fontSize: 13,
              color: '#6b7280',
              padding: '14px 16px',
              background: '#f9fafb',
              borderRadius: 10,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={14} color="#9ca3af" />
              {job.location}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Globe size={14} color="#9ca3af" />
              {job.workplaceType}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Briefcase size={14} color="#9ca3af" />
              {job.experienceLevel}
            </span>
          </div>

          {/* Salary */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Compensation
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a7a4a', letterSpacing: '-0.02em' }}>
              {job.salaryText}
            </div>
          </div>

          {/* Qualifications */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Qualifications Required
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {job.qualifications.map((q) => (
                <span key={q} className="badge badge-mint" style={{ fontSize: 12 }}>
                  {q.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              About the Role
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#374151' }}>{job.description}</p>
          </div>

          {/* Key responsibilities */}
          {job.keyResponsibilities && job.keyResponsibilities.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Key Responsibilities
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {job.keyResponsibilities.map((r, i) => (
                  <li key={i} style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {job.mandatorySkills && job.mandatorySkills.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Skills
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {job.mandatorySkills.map((s, i) => (
                  <span key={i} className="badge badge-gray" style={{ fontSize: 12 }}>{s}</span>
                ))}
                {job.goodToHaveSkills?.map((s, i) => (
                  <span key={`g${i}`} style={{
                    display: 'inline-flex', alignItems: 'center',
                    fontSize: 11, fontWeight: 600, padding: '2px 8px',
                    borderRadius: 999, border: '1px dashed #d1d5db', color: '#9ca3af',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 10,
            background: '#fafafa',
          }}
        >
          <button onClick={onClose} className="btn-ghost">
            Close
          </button>

          {isApplied ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#d7f4ea',
                color: '#1a7a4a',
                borderRadius: 999,
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              <CheckCircle2 size={15} />
              Applied ✓
            </span>
          ) : isScraped ? (
            <a
              href={job.sourceUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Apply on {job.source} ↗
              <ExternalLink size={13} />
            </a>
          ) : (
            <button
              onClick={() => {
                onApply(job);
                onClose();
              }}
              className="btn-primary"
            >
              Easy Apply →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
