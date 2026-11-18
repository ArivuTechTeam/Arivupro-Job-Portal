import React, { useMemo } from 'react';
import {
  BookmarkCheck, Briefcase, User, ChevronRight,
  CheckCircle2, Clock, TrendingUp, MapPin, GraduationCap,
  FileText,
} from 'lucide-react';
import { StudentProfile, JobApplication, JobListing } from '../types/index.ts';

interface StudentDashboardProps {
  student: StudentProfile;
  applications: JobApplication[];
  savedJobIds: Set<string>;
  jobs: JobListing[];
  onGoToTab: (tab: string) => void;
  onOpenProfile: () => void;
  onViewJob: (job: JobListing) => void;
}

// Profile completion — 8 tracked fields
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
  ];
  const done = checks.filter(([v]) => v).length;
  const missing = checks.filter(([v]) => !v).map(([, label]) => label);
  return { pct: Math.round((done / checks.length) * 100), missing };
}

function stageColor(stage: string) {
  if (stage === 'Placed' || stage === 'Offer Released') return { bg: '#dcfce7', color: '#16a34a' };
  if (stage === 'Declined') return { bg: '#fee2e2', color: '#dc2626' };
  if (stage === 'Technical Round' || stage === 'Partner Interview') return { bg: '#ede9fe', color: '#7c3aed' };
  if (stage === 'Recruiter Screen') return { bg: '#dbeafe', color: '#1d4ed8' };
  if (stage === 'ArivuPro Review') return { bg: '#fef3c7', color: '#b45309' };
  return { bg: '#f3f4f6', color: '#6b7280' };
}

function relativeDate(dateStr: string) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student, applications, savedJobIds, jobs, onGoToTab, onOpenProfile, onViewJob,
}) => {
  const { pct, missing } = useMemo(() => computeCompletion(student), [student]);

  // Recommended: jobs matching student's primary course or preferred locations
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

  // Saved jobs data
  const savedJobs = useMemo(() => jobs.filter(j => savedJobIds.has(j.id)), [jobs, savedJobIds]);

  const firstName = student.name?.split(' ')[0] || 'there';

  const pctColor = pct >= 80 ? '#1a7a4a' : pct >= 50 ? '#b45309' : '#dc2626';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: 'Manrope, sans-serif' }} className="sd-root">
    <div className="sd-scroll-area" style={{ padding: '32px 24px' }}>

      {/* Welcome header */}
      <div style={{ marginBottom: 20 }}>
        {firstName && (
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f2419', margin: '0 0 3px', letterSpacing: '-0.02em' }}>
            Hey, {firstName} 👋
          </h1>
        )}
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          {applications.length === 0
            ? 'Start applying to kick off your journey'
            : `${applications.length} application${applications.length !== 1 ? 's' : ''} so far${student.primaryCourse ? ` · ${student.primaryCourse}` : ''}`}
        </p>
      </div>

      {/* Top stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
        {[
          { icon: <Briefcase size={14} />, label: 'Applied', value: applications.length, tab: 'applications', accent: '#1a7a4a', bg: '#f0faf4', border: '#d7f4ea' },
          { icon: <BookmarkCheck size={14} />, label: 'Saved', value: savedJobIds.size, tab: 'jobs', accent: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
          { icon: <TrendingUp size={14} />, label: 'Active', value: applications.filter(a => a.status !== 'Declined' && a.status !== 'Placed').length, tab: 'applications', accent: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe' },
        ].map(item => (
          <div
            key={item.label}
            onClick={() => onGoToTab(item.tab)}
            style={{
              background: item.bg, border: `1px solid ${item.border}`,
              borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
              transition: 'transform 0.12s ease, box-shadow 0.12s ease',
            }}
            className="stat-tile"
          >
            <div style={{ color: item.accent, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f2419', letterSpacing: '-0.03em', lineHeight: 1 }}>{item.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: item.accent, marginTop: 3 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="sd-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Recent Applications */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={16} color="#1a7a4a" />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0f2419' }}>Recent Applications</span>
              </div>
              {applications.length > 0 && (
                <button
                  onClick={() => onGoToTab('applications')}
                  style={{ fontSize: 12, fontWeight: 700, color: '#1a7a4a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  View all <ChevronRight size={13} />
                </button>
              )}
            </div>

            {applications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Briefcase size={32} color="#d7f4ea" style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>No applications yet</div>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Find roles that match your profile and apply directly</p>
                <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => onGoToTab('jobs')}>
                  Browse Jobs →
                </button>
              </div>
            ) : (
              <div>
                {applications.slice(0, 5).map((app, i) => {
                  const sc = stageColor(app.status);
                  return (
                    <div key={app.id} style={{ padding: '14px 20px', borderBottom: i < Math.min(applications.length, 5) - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0faf4', border: '1px solid #d7f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#1a7a4a', flexShrink: 0 }}>
                        {app.company.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f2419', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.jobTitle}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <span>{app.company}</span>
                          <span style={{ color: '#d1d5db' }}>·</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} color="#9ca3af" /> {relativeDate(app.appliedDate)}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: sc.bg, color: sc.color, flexShrink: 0 }}>
                        {app.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Saved Jobs */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookmarkCheck size={16} color="#1d4ed8" />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0f2419' }}>Saved Jobs</span>
              </div>
              {savedJobs.length > 0 && (
                <button
                  onClick={() => onGoToTab('jobs')}
                  style={{ fontSize: 12, fontWeight: 700, color: '#1a7a4a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  View all <ChevronRight size={13} />
                </button>
              )}
            </div>

            {savedJobs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <BookmarkCheck size={32} color="#bfdbfe" style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>No saved jobs</div>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Bookmark roles to revisit them later</p>
                <button className="btn-outline" style={{ fontSize: 13 }} onClick={() => onGoToTab('jobs')}>
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div>
                {savedJobs.slice(0, 4).map((job, i) => (
                  <div
                    key={job.id}
                    onClick={() => onViewJob(job)}
                    style={{ padding: '14px 20px', borderBottom: i < Math.min(savedJobs.length, 4) - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#fafafa'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#374151', flexShrink: 0 }}>
                      {job.logoText || job.company.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f2419', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span>{job.company}</span>
                        <span style={{ color: '#d1d5db' }}>·</span>
                        <MapPin size={10} color="#9ca3af" />
                        <span>{job.city}</span>
                        <span style={{ color: '#d1d5db' }}>·</span>
                        <span style={{ color: '#1a7a4a', fontWeight: 700 }}>{job.salaryText}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Jobs */}
          {recommended.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0f2419' }}>Recommended for you</span>
                  {student.primaryCourse && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: '#f0faf4', color: '#1a7a4a', border: '1px solid #d7f4ea' }}>
                      {student.primaryCourse}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onGoToTab('jobs')}
                  style={{ fontSize: 12, fontWeight: 700, color: '#1a7a4a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  View all <ChevronRight size={13} />
                </button>
              </div>
              <div>
                {recommended.map((job, i) => (
                  <div
                    key={job.id}
                    onClick={() => onViewJob(job)}
                    style={{ padding: '14px 20px', borderBottom: i < recommended.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#fafafa'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#374151', flexShrink: 0 }}>
                      {job.logoText || job.company.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f2419', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span>{job.company}</span>
                        <span style={{ color: '#d1d5db' }}>·</span>
                        <span>{job.city}</span>
                        <span style={{ color: '#d1d5db' }}>·</span>
                        <span style={{ color: '#1a7a4a', fontWeight: 700 }}>{job.salaryText}</span>
                      </div>
                    </div>
                    {job.arivuproExclusive && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#f0faf4', border: '1px solid #d7f4ea', color: '#1a7a4a', flexShrink: 0 }}>
                        ArivuPro
                      </span>
                    )}
                    <ChevronRight size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Profile completion card */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={15} color="#1a7a4a" />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f2419' }}>Profile Completion</span>
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: pctColor }}>{pct}%</span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pctColor, borderRadius: 4, transition: 'width 0.5s ease' }} />
            </div>

            {pct < 100 && missing.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Missing
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {missing.slice(0, 4).map(m => (
                    <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#6b7280' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />
                      {m}
                    </div>
                  ))}
                  {missing.length > 4 && (
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>+{missing.length - 4} more</div>
                  )}
                </div>
              </div>
            )}

            {pct === 100 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#1a7a4a', fontWeight: 700, marginBottom: 14 }}>
                <CheckCircle2 size={15} /> Profile complete
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%', fontSize: 13 }}
              onClick={onOpenProfile}
            >
              {pct < 100 ? 'Complete profile' : 'Edit profile'}
            </button>
          </div>

          {/* Quick actions */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', marginBottom: 14 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: <Briefcase size={14} />, label: 'Browse All Jobs', tab: 'jobs' },
                { icon: <GraduationCap size={14} />, label: 'Articleship Openings', tab: 'articleship' },
                { icon: <FileText size={14} />, label: 'My Applications', tab: 'applications' },
                { icon: <TrendingUp size={14} />, label: 'Job Match', tab: 'ai-match' },
              ].map(item => (
                <button
                  key={item.tab}
                  onClick={() => onGoToTab(item.tab)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 9,
                    border: '1px solid #e5e7eb', background: '#fff',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: '#374151', fontFamily: 'Manrope, sans-serif',
                    textAlign: 'left', transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a7a4a'; (e.currentTarget as HTMLButtonElement).style.color = '#1a7a4a'; (e.currentTarget as HTMLButtonElement).style.background = '#f0faf4'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.color = '#374151'; (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
                >
                  <span style={{ color: '#9ca3af' }}>{item.icon}</span>
                  {item.label}
                  <ChevronRight size={12} color="#d1d5db" style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Profile snapshot */}
          {(student.primaryCourse || student.preferredLocations.length > 0 || student.keySkills.length > 0) && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', marginBottom: 14 }}>Your Profile</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {student.primaryCourse && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Course</div>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: '#f0faf4', border: '1px solid #d7f4ea', color: '#1a7a4a' }}>{student.primaryCourse}</span>
                  </div>
                )}
                {student.preferredLocations.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Preferred Cities</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {student.preferredLocations.slice(0, 4).map(loc => (
                        <span key={loc} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: '#f3f4f6', color: '#374151' }}>{loc}</span>
                      ))}
                    </div>
                  </div>
                )}
                {student.keySkills.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Top Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {student.keySkills.slice(0, 5).map(sk => (
                        <span key={sk} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: '#f3f4f6', color: '#374151' }}>{sk}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .stat-tile:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; }
      `}</style>
    </div>{/* end sd-scroll-area */}

      <style>{`
        @media (max-width: 768px) {
          .sd-scroll-area { padding: 20px 16px 90px !important; }
          .sd-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
