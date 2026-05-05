import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submissionsAPI } from '../../services/api';

/* ─── Overall feedback panel ──────────────────────────────────────────── */
function OverallView({ report }) {
  const score  = report.total_score  != null ? parseFloat(report.total_score).toFixed(1)  : '—';
  const total  = report.total_marks  != null ? parseFloat(report.total_marks).toFixed(0)  : '—';

  return (
    <div style={{ maxWidth: '780px' }}>
      {/* Heading + score badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#111827' }}>Overall Feedback</h2>
        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.35rem 1rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '1.1rem', border: '1px solid #fecaca' }}>
          {score} / {total}
        </span>
      </div>

      {/* Summary */}
      {report.overall_feedback && (
        <div style={card}>
          <p style={sectionLabel}>Summary</p>
          <p style={{ color: '#374151', fontSize: '0.9rem', lineHeight: '1.65' }}>{report.overall_feedback}</p>
        </div>
      )}

      {/* Key Strengths */}
      {report.strengths && report.strengths.length > 0 && (
        <div style={{ ...card, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <p style={{ ...sectionLabel, color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            ✅ Key Strengths
          </p>
          <ul style={list}>
            {report.strengths.map((s, i) => <li key={i} style={{ color: '#166534' }}>{s}</li>)}
          </ul>
        </div>
      )}

      {/* Areas for Improvement */}
      {report.areas_to_improve && report.areas_to_improve.length > 0 && (
        <div style={{ ...card, background: '#fff7ed', borderColor: '#fed7aa' }}>
          <p style={{ ...sectionLabel, color: '#c2410c', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            ⚠️ Areas for Improvement
          </p>
          <ul style={list}>
            {report.areas_to_improve.map((a, i) => <li key={i} style={{ color: '#7c2d12' }}>{a}</li>)}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {report.suggestions && report.suggestions.length > 0 && (
        <div style={card}>
          <p style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            💡 Suggestions
          </p>
          <ul style={list}>
            {report.suggestions.map((s, i) => <li key={i} style={{ color: '#374151' }}>{s}</li>)}
          </ul>
        </div>
      )}

      {/* Action Plan */}
      {report.action_plan && report.action_plan.length > 0 && (
        <div style={card}>
          <p style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📋 Action Plan
          </p>
          <ol style={{ ...list, paddingLeft: '1.4rem' }}>
            {report.action_plan.map((a, i) => <li key={i} style={{ color: '#374151' }}>{a}</li>)}
          </ol>
        </div>
      )}

      {/* Empty state */}
      {!report.overall_feedback &&
        (!report.strengths || !report.strengths.length) &&
        (!report.areas_to_improve || !report.areas_to_improve.length) && (
        <div style={{ ...card, textAlign: 'center', color: '#6b7280' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</p>
          <p style={{ fontWeight: 600, color: '#374151' }}>Evaluation in progress</p>
          <p style={{ fontSize: '0.875rem' }}>The AI is reviewing your answer sheet. Please check back shortly.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Per-question panel ──────────────────────────────────────────────── */
function QuestionView({ question }) {
  const pct = question.marks_possible > 0
    ? (question.marks_obtained / question.marks_possible) * 100
    : 0;
  const scoreColor = pct >= 50 ? '#16a34a' : '#dc2626';
  const scoreBg    = pct >= 50 ? '#dcfce7' : '#fee2e2';

  return (
    <div style={{ maxWidth: '780px' }}>
      {/* Q header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem' }}>
        <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.3rem 0.8rem', borderRadius: '0.375rem', fontWeight: 700, fontSize: '0.9rem' }}>
          Q{question.question_number}
        </span>
        <span style={{ background: scoreBg, color: scoreColor, padding: '0.3rem 0.8rem', borderRadius: '0.375rem', fontWeight: 700, fontSize: '0.9rem', border: `1px solid ${pct >= 50 ? '#bbf7d0' : '#fecaca'}` }}>
          {question.marks_obtained} / {question.marks_possible}
        </span>
      </div>

      {/* Question text */}
      <div style={card}>
        <p style={sectionLabel}>Question</p>
        <p style={{ color: '#111827', fontSize: '0.9rem', lineHeight: '1.65' }}>{question.question_text}</p>
      </div>

      {/* Feedback */}
      {question.feedback && (
        <div style={card}>
          <p style={sectionLabel}>Feedback</p>
          <p style={{ color: '#374151', fontSize: '0.875rem', lineHeight: '1.65' }}>{question.feedback}</p>
        </div>
      )}

      {/* Criteria breakdown */}
      {question.criteria && question.criteria.length > 0 && (
        <div style={card}>
          <p style={sectionLabel}>Criteria breakdown</p>
          {question.criteria.map((c, i) => (
            <div
              key={i}
              style={{
                paddingBottom: '0.8rem',
                marginBottom: '0.8rem',
                borderBottom: i < question.criteria.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', flex: 1, margin: 0, lineHeight: '1.4' }}>
                  {c.description}
                </p>
                <span style={{
                  fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap',
                  color: c.marks_obtained > 0 ? '#16a34a' : '#dc2626',
                }}>
                  {c.marks_obtained} / {c.marks_available}
                </span>
              </div>
              {c.ai_feedback && (
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.3rem', lineHeight: '1.5', margin: '0.3rem 0 0' }}>
                  {c.ai_feedback}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Missing points */}
      {question.missing_points && question.missing_points.length > 0 && (
        <div style={{ ...card, background: '#fff7ed', borderColor: '#fed7aa' }}>
          <p style={{ ...sectionLabel, color: '#c2410c' }}>Missing Points</p>
          <ul style={list}>
            {question.missing_points.map((mp, i) => <li key={i} style={{ color: '#7c2d12' }}>{mp}</li>)}
          </ul>
        </div>
      )}

      {/* Student answer excerpt */}
      {question.student_answer_excerpt && (
        <div style={card}>
          <p style={sectionLabel}>Answer Sheet Image</p>
          <pre style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.875rem', fontSize: '0.78rem', color: '#374151', whiteSpace: 'pre-wrap', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '280px', overflowY: 'auto' }}>
            {question.student_answer_excerpt}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ─── Main EvaluationReport component ────────────────────────────────── */
export function EvaluationReport() {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const [report, setReport]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [pollingMsg, setPollingMsg] = useState(null);
  const [error, setError]           = useState(null);
  const [selectedQ, setSelectedQ]   = useState('overall');

  const pollRef    = useRef(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    attemptRef.current = 0;

    const fetchReport = async () => {
      try {
        const { data } = await submissionsAPI.getReport(submissionId);
        setReport(data);
        setLoading(false);
        setPollingMsg(null);
      } catch (err) {
        if (err.response?.status === 404 && attemptRef.current < 24) {
          attemptRef.current += 1;
          setPollingMsg('AI is evaluating your answer sheet — this takes about 1–2 minutes.');
          pollRef.current = setTimeout(fetchReport, 5000);
        } else {
          setError(err.response?.data?.detail || 'Failed to load evaluation report.');
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [submissionId]);

  /* Loading / error states */
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="spinner" style={{ marginBottom: '1.25rem' }} />
        {pollingMsg ? (
          <>
            <p style={{ fontWeight: 700, color: '#374151', marginBottom: '0.25rem', fontSize: '1rem' }}>AI Evaluation in Progress</p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', maxWidth: '340px' }}>{pollingMsg}</p>
          </>
        ) : (
          <p style={{ color: '#6b7280' }}>Loading report...</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</p>
        <p style={{ color: '#991b1b', fontWeight: 600, marginBottom: '1rem' }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem 1.25rem', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
          Go Back
        </button>
      </div>
    );
  }

  if (!report) return null;

  const questions      = report.questions || [];
  const selectedQuestion = questions.find(q => q.question_number === selectedQ);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', background: '#f9fafb' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '0.375rem', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#374151' }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Evaluation Report</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.38rem 0.85rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.375rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            📊 Report
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr' }}>

        {/* ── Left sidebar ── */}
        <div style={{ background: '#fff', borderRight: '1px solid #e5e7eb', minHeight: 'calc(100vh - 50px)', position: 'sticky', top: 0, height: 'calc(100vh - 50px)', overflowY: 'auto' }}>
          {/* Sidebar header */}
          <div style={{ padding: '0.7rem 1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>Questions</span>
            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>↕</span>
          </div>

          {/* Overall */}
          <div
            onClick={() => setSelectedQ('overall')}
            style={{
              padding: '0.6rem 1rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
              background: selectedQ === 'overall' ? '#dbeafe' : 'transparent',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: selectedQ === 'overall' ? 700 : 500, color: selectedQ === 'overall' ? '#1d4ed8' : '#374151' }}>
              Overall
            </span>
            <span style={{
              fontSize: '0.78rem', fontWeight: 700,
              color: selectedQ === 'overall' ? '#1d4ed8' : '#ef4444',
              background: selectedQ === 'overall' ? '#bfdbfe' : '#fee2e2',
              padding: '0.1rem 0.4rem', borderRadius: '999px',
            }}>
              {report.total_score != null ? Math.round(report.total_score) : 0}
            </span>
          </div>

          {/* Per-question items */}
          {questions.map(q => {
            const isSel = selectedQ === q.question_number;
            return (
              <div
                key={q.id}
                onClick={() => setSelectedQ(q.question_number)}
                style={{
                  padding: '0.6rem 1rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                  background: isSel ? '#eff6ff' : 'transparent',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: isSel ? 700 : 400, color: isSel ? '#1d4ed8' : '#374151' }}>
                  Q{q.question_number}
                </span>
                <span style={{ fontSize: '0.78rem', color: q.marks_obtained > 0 ? '#16a34a' : '#ef4444' }}>
                  {q.marks_obtained}/{q.marks_possible}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Right content ── */}
        <div style={{ padding: '2rem 2rem', overflowY: 'auto' }}>
          {selectedQ === 'overall' ? (
            <OverallView report={report} />
          ) : selectedQuestion ? (
            <QuestionView question={selectedQuestion} />
          ) : (
            <p style={{ color: '#6b7280' }}>Question not found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Shared styles ───────────────────────────────────────────────────── */
const card = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.75rem',
  padding: '1.1rem 1.25rem',
  marginBottom: '1rem',
};

const sectionLabel = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '0.6rem',
};

const list = {
  margin: 0,
  paddingLeft: '1.25rem',
  fontSize: '0.875rem',
  lineHeight: '1.75',
};

export default EvaluationReport;
