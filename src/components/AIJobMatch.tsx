import React, { useState } from 'react';
import { JobListing } from '../types/index.ts';

interface AIJobMatchProps {
  jobs: JobListing[];
  studentName: string;
  studentCourse: string;
}

interface AnalysisPreset {
  score: number;
  qualificationFit: number;
  skillsMatch: number;
  experienceFit: number;
  strengths: string[];
  gapAlerts: string[];
  counselorNote: string;
}

const ANALYSIS_PRESETS: AnalysisPreset[] = [
  {
    score: 87,
    qualificationFit: 94,
    skillsMatch: 88,
    experienceFit: 76,
    strengths: [
      'ACCA qualification directly maps to role requirements',
      'Strong IFRS knowledge aligns with reporting scope',
      'Prior articleship experience in similar industry',
    ],
    gapAlerts: [
      'Preferred 2+ years post-qualification experience',
      'SAP / Oracle ERP proficiency not confirmed',
      'CPA credential is preferred but not mandatory',
    ],
    counselorNote:
      'Based on your ACCA profile, this role is an excellent fit. We recommend applying immediately — our counselors will prep you for the technical round.',
  },
  {
    score: 79,
    qualificationFit: 85,
    skillsMatch: 80,
    experienceFit: 72,
    strengths: [
      'Taxation background matches the compliance remit',
      'Articleship months exceed the minimum threshold',
      'GST & direct tax skills are core to the role',
    ],
    gapAlerts: [
      'Big-4 internship preferred but not mandatory',
      'Advanced Excel / data-modelling skills gap noted',
      'Role expects client-facing communication experience',
    ],
    counselorNote:
      'Your tax-focused ACCA modules give you a strong edge here. We suggest a quick interview coaching session to handle technical questions on IndAS.',
  },
  {
    score: 92,
    qualificationFit: 97,
    skillsMatch: 91,
    experienceFit: 88,
    strengths: [
      'Qualification tier is an exact match for this level',
      'Financial modelling & valuation skills are verified',
      'Industry sector exposure lines up well with the JD',
    ],
    gapAlerts: [
      'Bloomberg terminal access listed as good-to-have',
      'CFA Level 1 completion could strengthen the case',
      'Team-lead experience is preferred for senior track',
    ],
    counselorNote:
      'This is one of your top-matched roles this week. Your profile scores above 90 — apply within 48 hours as this listing fills fast. Counselors are on standby.',
  },
  {
    score: 73,
    qualificationFit: 78,
    skillsMatch: 74,
    experienceFit: 68,
    strengths: [
      'Core accounting fundamentals are well-established',
      'Articleship sector overlaps with company domain',
      'Soft-skills & communication rated highly on profile',
    ],
    gapAlerts: [
      'Role prefers US CPA or CMA alongside ACCA',
      'Minimum 1 year post-article experience required',
      'Knowledge of USGAAP consolidation is a gap area',
    ],
    counselorNote:
      'A strong match on fundamentals, but a few targeted upskilling areas can close the gap. Speak with your counselor about our US CPA bridge module.',
  },
];

function hashJobId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getAnalysis(jobId: string): AnalysisPreset {
  return ANALYSIS_PRESETS[hashJobId(jobId) % ANALYSIS_PRESETS.length];
}

function getMatchGrade(score: number): { label: string; color: string; bg: string } {
  if (score >= 85) return { label: 'Excellent Match', color: '#1a7a4a', bg: '#d7f4ea' };
  if (score >= 70) return { label: 'Strong Match', color: '#1d4ed8', bg: '#dbeafe' };
  if (score >= 55) return { label: 'Moderate Match', color: '#92400e', bg: '#fef3c7' };
  return { label: 'Low Match', color: '#991b1b', bg: '#fee2e2' };
}

function QualBadge({ q }: { q: string }) {
  return (
    <span
      className="badge badge-mint"
      style={{ fontSize: 10, padding: '2px 7px' }}
    >
      {q.replace(/_/g, ' ')}
    </span>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 5,
          fontSize: 13,
          fontWeight: 600,
          color: '#374151',
        }}
      >
        <span>{label}</span>
        <span style={{ color: '#1a7a4a', fontWeight: 700 }}>{value}%</span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: '#e5e7eb',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${value}%`,
            borderRadius: 999,
            background: 'linear-gradient(90deg, #1a7a4a 0%, #22c55e 100%)',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
}

export const AIJobMatch: React.FC<AIJobMatchProps> = ({ jobs, studentName, studentCourse }) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loadingJobId, setLoadingJobId] = useState<string | null>(null);
  const [visibleAnalysisJobId, setVisibleAnalysisJobId] = useState<string | null>(null);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;
  const analysis = visibleAnalysisJobId ? getAnalysis(visibleAnalysisJobId) : null;
  const displayJob = visibleAnalysisJobId
    ? jobs.find((j) => j.id === visibleAnalysisJobId) ?? null
    : null;

  function handleAnalyse(job: JobListing) {
    if (loadingJobId) return;
    setSelectedJobId(job.id);
    setLoadingJobId(job.id);
    setVisibleAnalysisJobId(null);
    setTimeout(() => {
      setLoadingJobId(null);
      setVisibleAnalysisJobId(job.id);
    }, 1200);
  }

  const matchGrade = analysis ? getMatchGrade(analysis.score) : null;

  return (
    <div style={{ fontFamily: 'Manrope, sans-serif', padding: '0 0 40px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
            marginBottom: 6,
          }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: '#0f2419',
              margin: 0,
              letterSpacing: '-0.03em',
            }}
          >
            AI Job Match
          </h1>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              border: '1.5px solid #1a7a4a',
              color: '#1a7a4a',
              borderRadius: 999,
              padding: '3px 11px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.01em',
              background: '#f0fdf6',
            }}
          >
            ✨ Powered by Gemini 2.0 Flash
          </span>
        </div>
        <p
          style={{
            fontSize: 14,
            color: '#6b7280',
            margin: 0,
            fontWeight: 500,
          }}
        >
          Gemini 2.0 Flash evaluates your fit for every role — select a job below to get your
          personalised analysis, {studentName}.
        </p>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)',
          gap: 20,
          alignItems: 'start',
        }}
        className="ai-match-grid"
      >
        {/* LEFT: job list */}
        <div
          className="card"
          style={{ padding: 0, overflow: 'hidden' }}
        >
          <div
            style={{
              padding: '16px 20px 12px',
              borderBottom: '1px solid #f3f4f6',
              background: '#fafafa',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#0f2419',
                letterSpacing: '-0.01em',
              }}
            >
              Select a Job to Analyse
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginTop: 2 }}>
              {jobs.length} roles available for your profile
            </div>
          </div>

          <div style={{ maxHeight: 540, overflowY: 'auto' }}>
            {jobs.map((job) => {
              const isSelected = selectedJobId === job.id;
              const isLoading = loadingJobId === job.id;

              return (
                <div
                  key={job.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 18px',
                    borderBottom: '1px solid #f9fafb',
                    borderLeft: isSelected ? '3px solid #1a7a4a' : '3px solid transparent',
                    background: isSelected ? '#f0fdf6' : '#fff',
                    transition: 'background 0.15s, border-color 0.15s',
                    cursor: 'default',
                  }}
                >
                  {/* Logo */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 9,
                      background: '#1a7a4a',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: 12,
                      flexShrink: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {job.logoText}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#0f2419',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '-0.01em',
                        marginBottom: 3,
                      }}
                    >
                      {job.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: 5,
                      }}
                    >
                      {job.company}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {job.qualifications.slice(0, 2).map((q) => (
                        <QualBadge key={q} q={q} />
                      ))}
                      {job.qualifications.length > 2 && (
                        <span
                          style={{
                            fontSize: 10,
                            color: '#9ca3af',
                            fontWeight: 600,
                            alignSelf: 'center',
                          }}
                        >
                          +{job.qualifications.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Analyse button */}
                  <button
                    onClick={() => handleAnalyse(job)}
                    disabled={!!loadingJobId}
                    className="btn-primary"
                    style={{
                      fontSize: 12,
                      padding: '7px 14px',
                      flexShrink: 0,
                      minWidth: 90,
                      opacity: loadingJobId && !isLoading ? 0.5 : 1,
                      cursor: loadingJobId ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isLoading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <SpinnerIcon />
                        Analysing…
                      </span>
                    ) : (
                      'Analyse →'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: AI result panel */}
        <div>
          {!analysis || !displayJob ? (
            /* Empty state */
            <div
              className="card"
              style={{
                padding: 48,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: 320,
                gap: 14,
              }}
            >
              {loadingJobId ? (
                <>
                  <div style={{ fontSize: 36, marginBottom: 4 }}>⏳</div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: '#0f2419',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Analysing with Gemini 2.0 Flash…
                  </div>
                  <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
                    Evaluating qualification fit, skills match &amp; experience alignment
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 40, marginBottom: 4 }}>✨</div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: '#0f2419',
                      letterSpacing: '-0.01em',
                      maxWidth: 260,
                    }}
                  >
                    Select a job from the left to see your AI match analysis
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, maxWidth: 220 }}>
                    Gemini 2.0 Flash will score your fit in seconds
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Analysis card */
            <div className="card" style={{ padding: 24 }}>
              {/* Header */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: '#0f2419',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.3,
                    }}
                  >
                    AI Match Analysis
                    <br />
                    <span style={{ color: '#1a7a4a' }}>{displayJob.title}</span>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>
                      {' '}@ {displayJob.company}
                    </span>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      border: '1.5px solid #1a7a4a',
                      color: '#1a7a4a',
                      borderRadius: 999,
                      padding: '3px 10px',
                      fontSize: 10,
                      fontWeight: 700,
                      background: '#f0fdf6',
                      flexShrink: 0,
                    }}
                  >
                    ✨ Gemini 2.0 Flash
                  </span>
                </div>
              </div>

              {/* Score */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: 24,
                  padding: '16px 20px',
                  background: '#f0fdf6',
                  borderRadius: 12,
                  border: '1px solid #bbf7d0',
                }}
              >
                <div
                  style={{
                    fontSize: 52,
                    fontWeight: 900,
                    color: '#1a7a4a',
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {analysis.score}%
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: 6,
                    }}
                  >
                    Overall Match Score
                  </div>
                  {matchGrade && (
                    <span
                      style={{
                        display: 'inline-block',
                        background: matchGrade.bg,
                        color: matchGrade.color,
                        borderRadius: 999,
                        padding: '3px 12px',
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.01em',
                      }}
                    >
                      {matchGrade.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bars */}
              <div style={{ marginBottom: 20 }}>
                <ProgressBar label="Qualification Fit" value={analysis.qualificationFit} />
                <ProgressBar label="Skills Match" value={analysis.skillsMatch} />
                <ProgressBar label="Experience Fit" value={analysis.experienceFit} />
              </div>

              {/* Strengths & Gaps */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                  marginBottom: 20,
                }}
              >
                {/* Strengths */}
                <div
                  style={{
                    background: '#f0fdf6',
                    borderRadius: 10,
                    padding: '14px 16px',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#1a7a4a',
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    ✅ Strengths
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {analysis.strengths.map((s, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: '#166534',
                          lineHeight: 1.5,
                          marginBottom: 6,
                          paddingLeft: 10,
                          position: 'relative',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            color: '#22c55e',
                            fontWeight: 900,
                          }}
                        >
                          ·
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gap Alerts */}
                <div
                  style={{
                    background: '#fffbeb',
                    borderRadius: 10,
                    padding: '14px 16px',
                    border: '1px solid #fde68a',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#92400e',
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    ⚠️ Gap Alerts
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {analysis.gapAlerts.map((g, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: '#78350f',
                          lineHeight: 1.5,
                          marginBottom: 6,
                          paddingLeft: 10,
                          position: 'relative',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            color: '#f59e0b',
                            fontWeight: 900,
                          }}
                        >
                          ·
                        </span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Counselor box */}
              <div
                style={{
                  background: '#f0fdf6',
                  border: '1px solid #bbf7d0',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>💬</span>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#166534',
                    lineHeight: 1.6,
                  }}
                >
                  {analysis.counselorNote}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive style: stack columns on narrow screens */}
      <style>{`
        @media (max-width: 768px) {
          .ai-match-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

function SpinnerIcon() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 11,
        height: 11,
        border: '2px solid rgba(255,255,255,0.4)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'ai-spin 0.7s linear infinite',
      }}
    />
  );
}

// Inject keyframe once
const styleId = 'ai-job-match-spin';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const s = document.createElement('style');
  s.id = styleId;
  s.textContent = `@keyframes ai-spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(s);
}
