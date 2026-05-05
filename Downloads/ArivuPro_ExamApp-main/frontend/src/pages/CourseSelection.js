import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COURSES } from '../data/examData';

export function CourseSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Select Your Course</h1>
          <p className="subtitle">Choose your professional exam course to begin your assessment</p>
        </div>
      </div>

      {/* Exam Structure Info Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontWeight: 700, color: '#15803d', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
            Exam Structure — 100 Marks Total
          </p>
          <p style={{ color: '#374151', fontSize: '0.875rem' }}>
            Each exam is divided into two parts. Complete the Quiz section first to unlock the Theory section.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '0.75rem 1.25rem',
              textAlign: 'center',
              minWidth: 130,
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🎯</div>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>30 Marks</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Quiz Section</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>10 MCQs × 3 marks</div>
          </div>
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '0.75rem 1.25rem',
              textAlign: 'center',
              minWidth: 130,
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>✍️</div>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>70 Marks</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Theory Section</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>5 Questions × 14 marks</div>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {COURSES.map((course) => (
          <div
            key={course.id}
            onClick={() => navigate(`/exam/${course.id}`)}
            style={{
              background: '#fff',
              border: `1px solid ${course.border}`,
              borderRadius: 12,
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 8px 24px ${course.border}`;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = course.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = course.border;
            }}
          >
            {/* Course Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: course.bg,
                  border: `1px solid ${course.border}`,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  flexShrink: 0,
                }}
              >
                {course.icon}
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.2rem' }}>
                  {course.label}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: course.bg,
                      color: course.color,
                      border: `1px solid ${course.border}`,
                      borderRadius: 20,
                      padding: '0.15rem 0.6rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {course.board}
                  </span>
                  <span
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      borderRadius: 20,
                      padding: '0.15rem 0.6rem',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                    }}
                  >
                    {course.level}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {course.description}
            </p>

            {/* Subjects */}
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {course.subjects.map((subj) => (
                <span
                  key={subj}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    borderRadius: 6,
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.72rem',
                  }}
                >
                  {subj}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid #f1f5f9',
              }}
            >
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>100 marks · Quiz + Theory</span>
              <span
                style={{
                  background: course.color,
                  color: '#fff',
                  padding: '0.4rem 1rem',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Start Exam →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CourseSelection;
