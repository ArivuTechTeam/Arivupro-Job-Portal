import React, { useMemo, lazy, Suspense } from 'react';
import { StudentProfile, JobApplication, JobListing } from '../types/index.ts';
import { siteName } from '../lib/siteName.ts';

const ApplicationPile3D = lazy(() => import('./ApplicationPile3D.tsx'));

interface StudentDashboardProps {
  student: StudentProfile;
  applications: JobApplication[];
  savedJobIds: Set<string>;
  jobs: JobListing[];
  onGoToTab: (tab: string) => void;
  onOpenProfile: () => void;
  onViewJob: (job: JobListing) => void;
}

function computeCompletion(s: StudentProfile): { pct: number; missing: string[] } {
  const checks: [boolean, string][] = [
    [!!s.name, 'Full name'],
    [!!s.phone, 'Phone number'],
    [!!s.aboutBio, 'About / Bio'],
    [s.keySkills.length > 0, 'Key skills'],
    [!!s.resumeFileName, 'Resume upload'],
    [s.qualificationsCompleted.length > 0, 'Qualifications'],
    [s.preferredLocations.length > 0, 'Preferred locations'],
    [!!s.primaryCourse, 'Primary course'],
    [!!s.graduationDegree, 'Education details'],
    [!!s.articleshipFirm, 'Articleship firm'],
    [!!s.joiningAvailability, 'Joining availability'],
    [(s.workExperience?.length ?? 0) > 0 || (s.internshipExperience?.length ?? 0) > 0 || (s.certifications?.length ?? 0) > 0, 'Experience or certifications'],
  ];
  const done = checks.filter(([v]) => v).length;
  const missing = checks.filter(([v]) => !v).map(([, label]) => label);
  return { pct: Math.round((done / checks.length) * 100), missing };
}

function relativeDate(dateStr: string) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

const ICON_OK = (
  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="10" cy="10" r="9" fill="#1a7a4a" />
    <path d="M6 10.3l2.6 2.6L14 7.6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICON_EXT = (
  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M11 3h6v6M17 3l-8 8M14 11v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="#5f6b65" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function initials(company: string) {
  return company.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student, applications, savedJobIds, jobs, onGoToTab, onOpenProfile, onViewJob,
}) => {
  const { pct, missing } = useMemo(() => computeCompletion(student), [student]);

  const recommended = useMemo(() => {
    const courseKey = student.primaryCourse?.toUpperCase();
    const locs = (student.preferredLocations || []).map(l => l.toLowerCase());
    return jobs
      .filter(j => {
        const matchCourse = courseKey && j.qualifications.some(q => q.includes(courseKey));
        const matchLoc = locs.length > 0 && locs.some(l => j.city.toLowerCase().includes(l));
        return matchCourse || matchLoc;
      })
      .slice(0, 4);
  }, [jobs, student.primaryCourse, student.preferredLocations]);

  const savedJobs = useMemo(() => jobs.filter(j => savedJobIds.has(j.id)), [jobs, savedJobIds]);

  const firstName = student.name?.split(' ')[0] || 'there';

  const subtitle = [
    student.primaryCourse,
    student.preferredLocations?.[0] || null,
  ].filter(Boolean).join(' · ');

  const nIn = applications.filter(a => a.kind === 'internal').length;
  const nEx = applications.length - nIn;
  const now = Date.now();
  const nWk = applications.filter(a => a.appliedDate && (now - new Date(a.appliedDate).getTime()) < 7 * 86400000).length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: 'Manrope, sans-serif', padding: 24 }} className="sd-root">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 20 }} className="sd-head">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#14201a' }}>Hi {firstName}</h1>
          {subtitle && <p style={{ color: '#5f6b65', margin: 0, fontSize: 14, fontWeight: 600 }}>{subtitle}</p>}
        </div>
        <button
          onClick={() => onGoToTab('jobs')}
          style={{ height: 38, padding: '0 16px', borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: '1px solid #1a7a4a', background: '#1a7a4a', color: '#fff', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap' }}
          className="sd-browse-btn"
        >
          Browse jobs
        </button>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }} className="sd-grid">

        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

          {/* Your applications — pile + summary */}
          <section style={{ background: '#fff', border: '1px solid #dfe3e0', borderRadius: 8, overflow: 'hidden' }} aria-labelledby="sd-apps-title">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e8ebe9' }}>
              <h2 id="sd-apps-title" style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#14201a' }}>Your applications</h2>
              <button onClick={() => onGoToTab('applications')} style={{ color: '#1a7a4a', fontWeight: 700, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Manrope, sans-serif' }}>
                View all
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)' }} className="sd-pile-grid">
              {/* 3D pile */}
              <div style={{ borderRight: '1px solid #e8ebe9', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="sd-pile3d-wrap">
                <Suspense fallback={<div style={{ background: '#f7f9f8', aspectRatio: '1.25/1', minHeight: 180, width: '100%' }} />}>
                  <ApplicationPile3D applications={applications} onBrowseJobs={() => onGoToTab('jobs')} />
                </Suspense>
              </div>

              {/* Summary */}
              <div style={{ padding: '20px 24px' }} className="sd-pile-sum">
                <div style={{ fontSize: 40, fontWeight: 700, color: '#14201a', lineHeight: 1 }} className="sd-pile-big">{applications.length}</div>
                <div style={{ color: '#5f6b65', margin: '4px 0 16px', fontSize: 14 }}>jobs applied</div>
                <ul style={{ listStyle: 'none', margin: '0 0 18px', padding: 0 }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f2f0', fontSize: 14, color: '#33403a' }}>
                    <span style={{ width: 14, height: 14, borderRadius: 3, background: '#1a7a4a', flexShrink: 0 }} />
                    <b style={{ color: '#14201a', minWidth: 22 }}>{nIn}</b>
                    sent through ArivuPro
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f2f0', fontSize: 14, color: '#33403a' }}>
                    <span style={{ width: 14, height: 14, borderRadius: 3, background: '#fff', border: '1.5px solid #9fb3a8', flexShrink: 0 }} />
                    <b style={{ color: '#14201a', minWidth: 22 }}>{nEx}</b>
                    opened on company sites
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 14, color: '#33403a' }}>
                    <span style={{ width: 14, height: 14, flexShrink: 0 }} />
                    <b style={{ color: '#14201a', minWidth: 22 }}>{nWk}</b>
                    this week
                  </li>
                </ul>
                <button
                  onClick={() => onGoToTab('jobs')}
                  style={{ width: '100%', height: 38, borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: '1px solid #1a7a4a', background: '#fff', color: '#1a7a4a', fontFamily: 'Manrope, sans-serif' }}
                >
                  Find more jobs
                </button>
              </div>
            </div>
          </section>

          {/* Recent applications */}
          <section style={{ background: '#fff', border: '1px solid #dfe3e0', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e8ebe9' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#14201a' }}>Recent applications</h2>
              {applications.length > 0 && (
                <button onClick={() => onGoToTab('applications')} style={{ color: '#1a7a4a', fontWeight: 700, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Manrope, sans-serif' }}>
                  View all
                </button>
              )}
            </div>
            {applications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>No applications yet</div>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Find roles that match your profile and apply directly</p>
                <button onClick={() => onGoToTab('jobs')} style={{ height: 38, padding: '0 16px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: '1px solid #1a7a4a', background: '#1a7a4a', color: '#fff', fontFamily: 'Manrope, sans-serif' }}>
                  Browse jobs
                </button>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {applications.slice(0, 4).map((app, i) => (
                  <li
                    key={app.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < Math.min(applications.length, 4) - 1 ? '1px solid #eef0ee' : 'none', flexWrap: 'wrap' }}
                    className="sd-app"
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 6, background: '#e7ece9', color: '#3d4a43', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {initials(app.company)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }} className="sd-app-grow">
                      <div style={{ fontWeight: 700, color: '#14201a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.jobTitle}</div>
                      <div style={{ fontSize: 12, color: '#7a857f' }}>{app.company}</div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }} className="sd-apptag">
                      {app.kind === 'internal'
                        ? <>{ICON_OK}<span style={{ color: '#1a7a4a' }}>Sent</span></>
                        : <>{ICON_EXT}<span style={{ color: '#5f6b65' }}>Opened on {siteName(app.applyUrl || '')}</span></>}
                    </span>
                    <span style={{ fontSize: 12, color: '#7a857f', width: 72, textAlign: 'right', whiteSpace: 'nowrap' }} className="sd-when">
                      {relativeDate(app.appliedDate)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Saved Jobs */}
          {savedJobs.length > 0 && (
            <section style={{ background: '#fff', border: '1px solid #dfe3e0', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e8ebe9' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#14201a' }}>Saved jobs</h2>
                <button onClick={() => onGoToTab('jobs')} style={{ color: '#1a7a4a', fontWeight: 700, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Manrope, sans-serif' }}>View all</button>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {savedJobs.slice(0, 4).map((job, i) => (
                  <li
                    key={job.id}
                    onClick={() => onViewJob(job)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < Math.min(savedJobs.length, 4) - 1 ? '1px solid #eef0ee' : 'none', cursor: 'pointer' }}
                    className="sd-job-row"
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 6, background: '#e7ece9', color: '#3d4a43', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {job.logoText || initials(job.company)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#14201a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: '#7a857f' }}>{job.company} · {job.city}</div>
                    </div>
                    <span style={{ fontSize: 12, color: '#1a7a4a', fontWeight: 700, whiteSpace: 'nowrap' }}>{job.salaryText}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Profile completion */}
          <section style={{ background: '#fff', border: '1px solid #dfe3e0', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8ebe9' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#14201a' }}>Profile completion</h2>
            </div>
            <div style={{ padding: '16px 20px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <b style={{ fontSize: 22, color: '#14201a', fontWeight: 700 }}>{pct}%</b>
                <span style={{ fontSize: 13, color: '#7a857f' }}>{12 - missing.length} of 12 done</span>
              </div>
              <div style={{ height: 8, background: '#eef1ef', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: '#1a7a4a', borderRadius: 4 }} />
              </div>
              {missing.length > 0 && (
                <ul style={{ listStyle: 'none', margin: '0 0 16px', padding: 0 }}>
                  {missing.slice(0, 4).map(m => (
                    <li key={m} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f0f2f0', fontSize: 13, color: '#33403a' }}>
                      {m}
                      <button onClick={onOpenProfile} style={{ fontSize: 12, color: '#1a7a4a', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Manrope, sans-serif' }}>Add</button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={onOpenProfile}
                style={{ width: '100%', height: 38, borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: '1px solid #1a7a4a', background: '#fff', color: '#1a7a4a', fontFamily: 'Manrope, sans-serif' }}
              >
                {pct < 100 ? 'Complete profile' : 'Edit profile'}
              </button>
            </div>
          </section>

          {/* Recommended for you */}
          {recommended.length > 0 && (
            <section style={{ background: '#fff', border: '1px solid #dfe3e0', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e8ebe9' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#14201a' }}>Recommended for you</h2>
                <button onClick={() => onGoToTab('jobs')} style={{ color: '#1a7a4a', fontWeight: 700, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Manrope, sans-serif' }}>See all</button>
              </div>
              {recommended.map((job) => (
                <div key={job.id} style={{ padding: '12px 20px', borderBottom: '1px solid #eef0ee' }} className="sd-job-row">
                  <div style={{ fontWeight: 700, color: '#14201a', fontSize: 14 }}>{job.title}</div>
                  <div style={{ fontSize: 12, color: '#7a857f', margin: '2px 0 6px' }}>{job.company} · {job.city}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {student.primaryCourse && (
                      <span style={{ fontSize: 12, color: '#33403a', background: '#f0f3f1', borderRadius: 4, padding: '2px 8px' }}>{student.primaryCourse}</span>
                    )}
                    <button onClick={() => onViewJob(job)} style={{ color: '#1a7a4a', fontWeight: 700, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Manrope, sans-serif' }}>View</button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Quick links */}
          <section style={{ background: '#fff', border: '1px solid #dfe3e0', borderRadius: 8, overflow: 'hidden' }}>
            {[
              { label: 'Articleship openings', tab: 'articleship' },
              { label: 'Job match', tab: 'ai-match' },
              { label: 'My applications', tab: 'applications' },
              { label: 'Browse all jobs', tab: 'jobs' },
            ].map((item, i, arr) => (
              <button
                key={item.tab}
                onClick={() => onGoToTab(item.tab)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 20px', borderBottom: i < arr.length - 1 ? '1px solid #eef0ee' : 'none',
                  width: '100%', background: 'none', border: 'none', borderLeft: 'none', borderRight: 'none',
                  borderTop: 'none', color: '#14201a', fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'Manrope, sans-serif', textAlign: 'left',
                  minHeight: 44,
                }}
                className="sd-quick-row"
              >
                {item.label}
                <span style={{ color: '#9aa59f', fontSize: 16 }}>›</span>
              </button>
            ))}
          </section>
        </div>
      </div>

      <style>{`
        :focus-visible { outline: 2px solid #f5a623; outline-offset: 2px; }
        .sd-job-row:hover { background: #fafbfa; }
        .sd-quick-row:hover { background: #fafbfa; }
        @media (max-width: 900px) {
          .sd-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .sd-root { padding: 16px 16px 90px !important; }
          .sd-head { flex-direction: column !important; align-items: stretch !important; }
          .sd-browse-btn { width: 100% !important; }
          .sd-pile-grid { grid-template-columns: 1fr !important; }
          .sd-pile3d-wrap { border-right: none !important; border-bottom: 1px solid #e8ebe9; }
          .pile3d-host { aspect-ratio: 1.7 / 1 !important; border-right: none !important; }
          .sd-pile-sum { padding: 16px !important; }
          .sd-pile-big { font-size: 34px !important; }
          .sd-app { padding: 12px 16px !important; }
          .sd-app-grow { flex-basis: calc(100% - 48px) !important; }
          .sd-apptag { order: 3; margin-left: 48px; }
          .sd-when { order: 4; margin-left: auto; width: auto !important; }
        }
      `}</style>
    </div>
  );
};
