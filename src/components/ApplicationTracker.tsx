import React from 'react';
import { RefreshCw, FileText, Calendar, User, CheckCircle2, Clock } from 'lucide-react';
import { JobApplication, StudentProfile } from '../types/index.ts';

interface ApplicationTrackerProps {
  applications: JobApplication[];
  student: StudentProfile;
  onRefresh: () => void;
  onSelectApplication: (app: JobApplication) => void;
}

const STAGES = [
  'Applied',
  'ArivuPro Review',
  'Recruiter Screen',
  'Technical Round',
  'Partner Interview',
  'Offer Released',
  'Placed',
];

function getStageIndex(stage: string): number {
  return STAGES.indexOf(stage);
}

function getStageColor(stage: string): string {
  if (stage === 'Placed') return '#1a7a4a';
  if (stage === 'Offer Released') return '#059669';
  if (stage === 'Declined') return '#dc2626';
  if (stage === 'Technical Round' || stage === 'Partner Interview') return '#7c3aed';
  if (stage === 'Recruiter Screen') return '#1d4ed8';
  if (stage === 'ArivuPro Review') return '#b45309';
  return '#6b7280';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  applications,
  student,
  onRefresh,
  onSelectApplication,
}) => {
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f2419 0%, #1a7a4a 100%)',
          borderRadius: 14,
          padding: '28px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fede6d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              ArivuPro Placement Directorate · Real-Time Tracking
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
              My Applications
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              <span style={{ fontWeight: 700, color: '#fff' }}>{student.name}</span>
              <span>·</span>
              <span style={{ fontWeight: 700, color: '#fede6d', fontFamily: 'monospace' }}>{student.arivuproStudentId}</span>
              <span>·</span>
              <span>{student.enrollmentCohort}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>CRM Connection</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#86efac',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#4ade80',
                    display: 'inline-block',
                  }}
                  className="animate-pulse-dot"
                />
                Live Syncing
              </div>
            </div>
            <button
              onClick={onRefresh}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
              title="Refresh from CRM"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }} className="tracker-stats">
          {[
            { label: 'Total Applied', value: applications.length },
            { label: 'In Progress', value: applications.filter((a) => !['Placed', 'Declined'].includes(a.status)).length },
            { label: 'Interviews', value: applications.filter((a) => ['Technical Round', 'Partner Interview'].includes(a.status)).length },
            { label: 'Offers', value: applications.filter((a) => ['Offer Released', 'Placed'].includes(a.status)).length },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Applications list */}
      {applications.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '56px 20px',
            border: '2px dashed #e5e7eb',
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <FileText size={36} color="#d1d5db" />
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f2419' }}>No applications yet</div>
          <p style={{ fontSize: 13, color: '#9ca3af', maxWidth: 320 }}>
            Browse jobs and apply with your ArivuPro profile to track your placement journey here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {applications.map((app) => {
            const stageIdx = getStageIndex(app.status);
            const stageColor = getStageColor(app.status);

            return (
              <div
                key={app.id}
                className="card"
                style={{ padding: '20px 22px' }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f2419', marginBottom: 4, letterSpacing: '-0.01em' }}>
                      {app.jobTitle}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13, color: '#6b7280' }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{app.company}</span>
                      <span>·</span>
                      <span>{app.location}</span>
                      <span>·</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        Applied {formatDate(app.appliedDate)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                    {/* Match score */}
                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: '#f0faf4',
                        border: '1px solid #d7f4ea',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>AI Match</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1a7a4a', fontFamily: 'monospace' }}>
                        {app.aiMatchScore}%
                      </div>
                    </div>

                    {/* CRM badge */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>CRM Lead</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', fontFamily: 'monospace' }}>
                        {app.crmLeadId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage current status pill */}
                <div style={{ marginBottom: 12 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      background: stageColor + '12',
                      color: stageColor,
                      border: `1px solid ${stageColor}30`,
                    }}
                  >
                    {app.status === 'Placed' || app.status === 'Offer Released' ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: stageColor,
                          display: 'inline-block',
                        }}
                        className="animate-pulse-dot"
                      />
                    )}
                    {app.status}
                  </span>
                </div>

                {/* Stage stepper */}
                <div style={{ marginBottom: 14 }}>
                  {/* Desktop */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
                      gap: 4,
                    }}
                    className="stage-stepper-desktop"
                  >
                    {STAGES.map((stage, idx) => {
                      const isCompleted = idx < stageIdx;
                      const isCurrent = idx === stageIdx;
                      return (
                        <div key={stage} style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              height: 4,
                              borderRadius: 999,
                              marginBottom: 5,
                              background: isCompleted
                                ? '#1a7a4a'
                                : isCurrent
                                ? stageColor
                                : '#e5e7eb',
                              boxShadow: isCurrent ? `0 0 0 2px ${stageColor}30` : 'none',
                              transition: 'background 0.2s ease',
                            }}
                          />
                          <div
                            style={{
                              fontSize: 9,
                              fontWeight: isCurrent ? 800 : 500,
                              color: isCurrent ? '#0f2419' : isCompleted ? '#1a7a4a' : '#9ca3af',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={stage}
                          >
                            {stage}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile linear bar */}
                  <div
                    className="stage-stepper-mobile"
                    style={{
                      display: 'none',
                      height: 6,
                      background: '#e5e7eb',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(10, ((stageIdx + 1) / STAGES.length) * 100)}%`,
                        background: stageColor,
                        borderRadius: 999,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Interview date */}
                {app.interviewDate && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <Calendar size={16} color="#1d4ed8" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>
                        Interview Scheduled: {app.interviewDate}
                      </div>
                      {app.interviewNotes && (
                        <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 2 }}>
                          {app.interviewNotes}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Counselor + timeline */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 12,
                    borderTop: '1px solid #f3f4f6',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                    <User size={13} />
                    <span>Counselor:</span>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{app.assignedCounselor}</span>
                  </div>

                  <button
                    onClick={() => onSelectApplication(app)}
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '5px 10px' }}
                  >
                    View Job Details
                  </button>
                </div>

                {/* Timeline */}
                {app.timeline && app.timeline.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Stage Timeline
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {app.timeline.map((entry, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#d1d5db',
                              marginTop: 5,
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ color: '#9ca3af', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {entry.timestamp}
                          </span>
                          <span style={{ fontWeight: 700, color: '#374151' }}>{entry.stage}</span>
                          <span style={{ color: '#9ca3af' }}>·</span>
                          <span style={{ color: '#6b7280' }}>{entry.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .tracker-stats { grid-template-columns: 1fr 1fr !important; }
          .stage-stepper-desktop { display: none !important; }
          .stage-stepper-mobile { display: block !important; }
        }
      `}</style>
    </div>
  );
};
