import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  ClipboardList,
  FileText,
  AlertTriangle,
  Lightbulb,
  Brain,
  Hash,
  BookOpen,
  Inbox,
  Search,
  Bot,
  RefreshCw,
  Printer,
  ChevronDown,
  ArrowLeft,
  Clock,
  Send,
  UserCheck,
} from 'lucide-react';
import { submissionsAPI, validationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Mock report ───────────────────────────────────────────────────────────────
function buildMockReport(id) {
  return {
    id, exam_paper: { title: 'CA Inter GST – Supply Test Paper', subject: 'GST', exam: 'CA', level: 'Intermediate' },
    total_score: 12, total_marks: 30, percentage: 40, status: 'completed',
    submission_date: '2026-05-04', evaluation_date: '2026-05-04',
    overall_summary: 'The student has scored 12 out of 30. While some conceptual understanding of GST basics is evident, the answers lack statutory references and detailed explanations required at the Intermediate level.',
    strengths: ['Basic awareness of GST concepts shown in Q1 and Q3.', 'Attempt to structure answers with definitions.'],
    areas_to_improve: ['Lack of statutory references (Section numbers, Act names).', 'No numerical examples provided where required.', 'Presentation needs improvement — no headings or subpoints used.'],
    suggestions: ['Practice writing answers with Section references from CGST Act 2017.', 'Use tables and bullet points for comparison questions.', 'Solve at least 20 past paper questions per week.'],
    presentation_score: 8, format_score: 6, heading_score: 7, working_notes_score: 5, neatness_score: 8,
    questions: [
      { id: 'q1', question_number: 1, question_type: 'Descriptive', marks_obtained: 3, marks_possible: 5, question_text: 'Explain the concept of "Supply" under GST and its components.', student_answer_excerpt: 'Supply under GST means all forms of sale, transfer, barter, exchange...', feedback_concept: 'Basic definition covered but Schedule I and II activities missing.', feedback_format: 'No statutory reference to Section 7 of CGST Act.', feedback_calculation: 'Not applicable for this question.', feedback_suggestion: 'Add Section 7, Schedule I deemed supplies and Schedule III exclusions.', step_marking: [{ step: 'Definition of Supply (Sec 7)', awarded: 1, max: 2, comment: 'Partial' }, { step: 'Components — Goods/Services', awarded: 1, max: 1, comment: 'Correct' }, { step: 'Schedule I activities', awarded: 0, max: 1, comment: 'Missing' }, { step: 'Examples', awarded: 1, max: 1, comment: 'Good' }], model_answer_excerpt: 'As per Section 7(1) of the CGST Act 2017, "supply" includes all forms of supply such as sale, transfer, barter, exchange, licence, rental, lease or disposal made for a consideration by a person in the course of business.' },
      { id: 'q2', question_number: 2, question_type: 'Descriptive', marks_obtained: 2, marks_possible: 5, question_text: 'Distinguish between Composite Supply and Mixed Supply under GST with examples.', student_answer_excerpt: 'Composite supply is a supply with principal supply...', feedback_concept: 'Definitions are partial. Taxability rule for Mixed Supply not mentioned.', feedback_format: 'No tabular comparison used.', feedback_calculation: 'N/A', feedback_suggestion: 'Use a comparison table with 4 columns: Basis, Composite Supply, Mixed Supply, Example.', step_marking: [{ step: 'Def — Composite Supply (Sec 2(30))', awarded: 1, max: 1, comment: 'Correct' }, { step: 'Def — Mixed Supply (Sec 2(74))', awarded: 1, max: 1, comment: 'Partial' }, { step: 'Tabular comparison', awarded: 0, max: 1, comment: 'Not attempted' }, { step: 'Example — Composite', awarded: 0, max: 1, comment: 'Missing' }, { step: 'Example — Mixed', awarded: 0, max: 1, comment: 'Missing' }], model_answer_excerpt: 'Composite Supply: Two or more taxable supplies naturally bundled together, one being the principal supply.\nMixed Supply: Artificially combined supplies taxed at the highest GST rate.' },
      { id: 'q3', question_number: 3, question_type: 'Descriptive', marks_obtained: 4, marks_possible: 5, question_text: 'Explain Time of Supply for Goods and Services under GST.', student_answer_excerpt: 'Time of Supply for goods is the earliest of invoice date, delivery date...', feedback_concept: 'Good understanding of ToS for goods. Service provisions partly covered.', feedback_format: 'Sections 12 and 13 mentioned. Needs more structured format.', feedback_calculation: 'Date calculation example would strengthen the answer.', feedback_suggestion: 'Add a timeline diagram or numerical example showing ToS determination.', step_marking: [{ step: 'ToS for Goods — Section 12', awarded: 2, max: 2, comment: 'Complete' }, { step: 'ToS for Services — Section 13', awarded: 1, max: 2, comment: 'Partial' }, { step: 'Numerical example', awarded: 1, max: 1, comment: 'Good' }], model_answer_excerpt: 'Time of Supply for Goods (Section 12): Earliest of — (a) date of issue of invoice, (b) last date for issuing invoice, (c) date of receipt of advance payment.' },
      { id: 'q4', question_number: 4, question_type: 'Descriptive', marks_obtained: 1, marks_possible: 5, question_text: 'What are activities treated as Supply without consideration under Schedule I of CGST Act?', student_answer_excerpt: 'Schedule I includes permanent transfer of business assets...', feedback_concept: 'Only 1 of 4 Schedule I activities mentioned.', feedback_format: 'Simple listing format used — acceptable but incomplete.', feedback_calculation: 'N/A', feedback_suggestion: 'Memorise all 4 Schedule I entries with keywords.', step_marking: [{ step: 'Activity 1 — Asset transfer', awarded: 1, max: 1.25, comment: 'Correct' }, { step: 'Activity 2 — Related persons', awarded: 0, max: 1.25, comment: 'Missing' }, { step: 'Activity 3 — Principal-Agent', awarded: 0, max: 1.25, comment: 'Missing' }, { step: 'Activity 4 — Import from related', awarded: 0, max: 1.25, comment: 'Missing' }], model_answer_excerpt: 'Schedule I Activities: (1) Permanent transfer of business assets where ITC was availed; (2) Supply between related/distinct persons; (3) Supply by principal to agent or agent to principal; (4) Import of services from related person.' },
      { id: 'q5', question_number: 5, question_type: 'Descriptive', marks_obtained: 2, marks_possible: 5, question_text: 'Explain the classification of activities under Schedule II of CGST Act.', student_answer_excerpt: 'Schedule II classifies activities as goods or services. Works contract is services...', feedback_concept: 'Only 2 entries covered out of several key ones.', feedback_format: 'No tabular format used.', feedback_calculation: 'N/A', feedback_suggestion: 'List at least 5 Schedule II entries — 3 for goods, 2 for services with examples.', step_marking: [{ step: 'Activities treated as Goods', awarded: 1, max: 2, comment: 'Partial' }, { step: 'Activities treated as Services', awarded: 1, max: 2, comment: 'Partial' }, { step: 'Examples for 2 entries', awarded: 0, max: 1, comment: 'Missing' }], model_answer_excerpt: 'Schedule II classifies transactions as goods or services. Works contract = services; Restaurant food supply = services; Transfer of title in goods = goods.' },
      { id: 'q6', question_number: 6, question_type: 'Descriptive', marks_obtained: 0, marks_possible: 5, question_text: 'Explain the concept of "Reverse Charge Mechanism" (RCM) under GST.', student_answer_excerpt: 'No relevant answer provided for this question.', feedback_concept: 'RCM completely unattempted. No mention of Section 9(3) or 9(4).', feedback_format: 'Missing legal framework, no notified services listed.', feedback_calculation: 'No GST computation under RCM shown.', feedback_suggestion: 'Study Section 9(3) and 9(4). Key: recipient pays tax directly to govt; ITC available on RCM payments.', step_marking: [{ step: 'Definition of RCM (Sec 9(3)/9(4))', awarded: 0, max: 2, comment: 'Not attempted' }, { step: 'Examples of notified services', awarded: 0, max: 1.5, comment: 'Not attempted' }, { step: 'ITC eligibility & procedure', awarded: 0, max: 1.5, comment: 'Not attempted' }], model_answer_excerpt: 'RCM is a mechanism where the liability to pay GST shifts from the supplier to the recipient. Under Section 9(3), notified services like legal services by advocates and GTA transport attract RCM.' },
    ],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const pct       = (s, t) => t ? Math.round((s / t) * 100) : 0;
const scoreCol  = p => p >= 70 ? '#16a34a' : p >= 50 ? '#2563eb' : p >= 35 ? '#d97706' : '#dc2626';
const scoreBg   = p => p >= 70 ? '#f0fdf4' : p >= 50 ? '#eff6ff' : p >= 35 ? '#fffbeb' : '#fef2f2';
const scoreLabel= p => p >= 70 ? 'Excellent' : p >= 50 ? 'Good' : p >= 35 ? 'Fair' : 'Needs Work';

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, total, size = 120 }) {
  const p    = pct(score, total);
  const col  = scoreCol(p);
  const r    = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (p / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 90 ? '1.4rem' : '1rem', fontWeight: 900, color: col, lineHeight: 1 }}>
          {p}%
        </span>
        <span style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 2 }}>
          {score}/{total}
        </span>
      </div>
    </div>
  );
}

// ── Mini progress bar ─────────────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const p = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ background: '#f1f5f9', borderRadius: 999, height: 5, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ── Overall Panel ─────────────────────────────────────────────────────────────
function OverallPanel({ report, submissionId }) {
  const p      = pct(report.total_score, report.total_marks);
  const col    = scoreCol(p);
  const passed = p >= 40;

  return (
    <div>
      {/* Score hero */}
      <div style={{
        background: `linear-gradient(135deg,${col}15,${col}08)`,
        border: `1px solid ${col}25`, borderRadius: 16,
        padding: '1.5rem 1.75rem', marginBottom: '1.25rem',
        display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <ScoreRing score={report.total_score} total={report.total_marks} size={110} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{
              background: passed ? '#dcfce7' : '#fee2e2',
              color: passed ? '#166534' : '#991b1b',
              border: `1px solid ${passed ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: 20, padding: '3px 14px',
              fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}>{passed ? <><CheckCircle2 size={12} /> Passed</> : <><XCircle size={12} /> Below Passing</>}</span>
            <span style={{
              background: col + '15', color: col, border: `1px solid ${col}30`,
              borderRadius: 20, padding: '3px 12px', fontSize: '0.72rem', fontWeight: 700,
            }}>{scoreLabel(p)}</span>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: col, lineHeight: 1, marginBottom: '0.3rem' }}>
            {report.total_score} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>/ {report.total_marks} marks</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {report.exam_paper?.subject} · {report.exam_paper?.exam} {report.exam_paper?.level}
          </div>

          {/* Mini stat pills */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Submission', value: report.submission_date ? new Date(report.submission_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—' },
              { label: 'Evaluated',  value: report.evaluation_date ? new Date(report.evaluation_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—' },
              { label: 'Status',     value: report.status || 'completed' },
            ].map(i => (
              <div key={i.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px' }}>
                <div style={{ fontSize: '0.58rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{i.label}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', marginTop: 1 }}>{i.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Presentation scores */}
      {report.presentation_score != null && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem', marginBottom: '0.875rem' }}>
            <ClipboardList size={16} /> Presentation Score
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              { label: 'Overall Presentation', value: report.presentation_score, max: 20 },
              { label: 'Format & Layout',       value: report.format_score,       max: 5  },
              { label: 'Headings & Structure',  value: report.heading_score,      max: 5  },
              { label: 'Working Notes',         value: report.working_notes_score,max: 5  },
              { label: 'Neatness',              value: report.neatness_score,     max: 5  },
            ].filter(r => r.value != null).map(row => {
              const p2 = pct(row.value, row.max);
              const c  = scoreCol(p2);
              return (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>{row.label}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: c }}>{row.value}/{row.max}</span>
                  </div>
                  <MiniBar value={row.value} max={row.max} color={c} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      {report.overall_summary && (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
          padding: '1.25rem 1.375rem', marginBottom: '1rem',
        }}>
          <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}><FileText size={14} /></span>
            Summary
          </p>
          <p style={{ color: '#374151', fontSize: '0.875rem', lineHeight: 1.8, margin: 0 }}>
            {report.overall_summary}
          </p>
        </div>
      )}

      {/* Strengths / Areas / Suggestions */}
      {[
        { key: 'strengths',       icon: <CheckCircle2 size={16} />, title: 'Key Strengths',         col: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', itemCol: '#166534' },
        { key: 'areas_to_improve',icon: <AlertTriangle size={16} />, title: 'Areas for Improvement', col: '#c2410c', bg: '#fff7ed', border: '#fed7aa', itemCol: '#9a3412' },
        { key: 'suggestions',     icon: <Lightbulb size={16} />, title: 'Suggestions',           col: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', itemCol: '#1e40af' },
      ].map(section => {
        const items = report[section.key] || [];
        if (!items.length) return null;
        return (
          <div key={section.key} style={{
            background: section.bg, border: `1px solid ${section.border}`,
            borderRadius: 14, padding: '1.125rem 1.375rem', marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1rem' }}>{section.icon}</span>
              <p style={{ fontWeight: 800, color: section.col, margin: 0, fontSize: '0.875rem' }}>
                {section.title}
              </p>
              <span style={{ marginLeft: 'auto', background: section.col + '18', color: section.col,
                borderRadius: 20, padding: '1px 8px', fontSize: '0.65rem', fontWeight: 700 }}>
                {items.length}
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {items.map((s, i) => (
                <li key={i} style={{ color: section.itemCol, fontSize: '0.875rem', lineHeight: 1.7 }}>{s}</li>
              ))}
            </ul>
          </div>
        );
      })}

      {/* Faculty Validation */}
      {submissionId && (
        <FacultyValidationCard
          submissionId={submissionId}
          initialStatus={report.validation_request_status}
        />
      )}
    </div>
  );
}

// ── Faculty Validation Card ───────────────────────────────────────────────────
function FacultyValidationCard({ submissionId, initialStatus }) {
  // initialStatus = null | 'pending' | 'reviewed' (from the backend report)
  const alreadyRequested = initialStatus === 'pending' || initialStatus === 'reviewed';
  const [status, setStatus]   = useState(alreadyRequested ? 'done' : 'idle');
  const [note, setNote]       = useState('');
  const [msg, setMsg]         = useState(
    alreadyRequested
      ? initialStatus === 'reviewed'
        ? 'Your submission has been reviewed by faculty.'
        : 'Your request has been sent to the faculty queue.'
      : ''
  );

  const handleRequest = async () => {
    if (status === 'done') return;
    try {
      setStatus('requesting');
      await validationAPI.request(submissionId, note);
      setStatus('done');
      setMsg('Your request has been sent to the faculty queue.');
    } catch (e) {
      setStatus('error');
      setMsg(e.response?.data?.detail || 'Could not send request. Please try again.');
    }
  };

  if (status === 'done') {
    const isReviewed = initialStatus === 'reviewed';
    return (
      <div style={{
        background: isReviewed ? '#f0fdf4' : '#f5f3ff',
        border: `1.5px solid ${isReviewed ? '#86efac' : '#c4b5fd'}`,
        borderRadius: 14, padding: '1.25rem 1.375rem', marginTop: '1rem',
        display: 'flex', alignItems: 'center', gap: '0.875rem',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: isReviewed
            ? 'linear-gradient(135deg,#22c55e,#16a34a)'
            : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <UserCheck size={18} color="#fff" />
        </div>
        <div>
          <p style={{ fontWeight: 700, color: isReviewed ? '#166534' : '#6d28d9', fontSize: '0.875rem', margin: 0 }}>
            {isReviewed ? 'Faculty Reviewed' : 'Validation Request Sent'}
          </p>
          <p style={{ color: isReviewed ? '#15803d' : '#7c3aed', fontSize: '0.78rem', margin: '2px 0 0' }}>
            {msg}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#f5f3ff', border: '1.5px solid #c4b5fd',
      borderRadius: 14, padding: '1.25rem 1.375rem', marginTop: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
        <UserCheck size={16} color="#7c3aed" />
        <p style={{ fontWeight: 800, color: '#6d28d9', margin: 0, fontSize: '0.875rem' }}>
          Get Faculty Validation
        </p>
      </div>
      <p style={{ color: '#4c1d95', fontSize: '0.8rem', lineHeight: 1.6, margin: '0 0 0.875rem' }}>
        This is your AI preliminary score. Would you like a teacher to review and officially
        validate your result? Your submission will be added to the faculty review queue.
      </p>

      {status === 'error' && (
        <p style={{ color: '#dc2626', fontSize: '0.78rem', marginBottom: '0.625rem' }}>{msg}</p>
      )}

      <textarea
        placeholder="Add a note for the faculty (optional)..."
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={2}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: '1px solid #ddd6fe', borderRadius: 8,
          padding: '0.5rem 0.75rem', fontSize: '0.8rem',
          fontFamily: 'inherit', resize: 'vertical',
          background: '#fff', marginBottom: '0.75rem', outline: 'none',
        }}
      />

      <button
        onClick={handleRequest}
        disabled={status === 'requesting'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '0.55rem 1.25rem', borderRadius: 9, border: 'none',
          background: status === 'requesting' ? '#ede9fe' : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
          color: status === 'requesting' ? '#a78bfa' : '#fff',
          fontWeight: 700, fontSize: '0.82rem', cursor: status === 'requesting' ? 'not-allowed' : 'pointer',
        }}
      >
        <Send size={13} />
        {status === 'requesting' ? 'Sending…' : 'Request Faculty Validation'}
      </button>
    </div>
  );
}

// ── Question Panel ────────────────────────────────────────────────────────────
function QuestionPanel({ q, idx }) {
  const [showModel,    setShowModel]    = useState(false);
  const [showMissing,  setShowMissing]  = useState(true);
  const p   = pct(q.marks_obtained, q.marks_possible);
  const col = scoreCol(p);

  // Detect holistic mode: step_scores contains q_number (metadata) not step marks
  const isHolistic = q.step_scores && q.step_scores.q_number !== undefined;
  const stepMarking = (!isHolistic && q.step_marking?.length > 0) ? q.step_marking : null;
  const qNum  = q.question_number || (q.step_scores?.q_number) || (idx + 1);
  const qText = q.question_text   || (q.step_scores?.q_text)   || `Question ${idx + 1}`;
  const qType = q.question_type   || (q.step_scores?.q_type)   || 'Descriptive';

  // For holistic: parse step_scores back into step rows if it has real step data
  const realSteps = (!isHolistic && q.step_scores && typeof q.step_scores === 'object')
    ? Object.entries(q.step_scores).map(([k, v]) => ({
        step: `Step ${k}`, awarded: v?.marks ?? 0, max: v?.max ?? 0, comment: v?.feedback || '',
      })).filter(s => s.max > 0)
    : [];

  const missingPoints = Array.isArray(q.missing_points) ? q.missing_points : [];

  return (
    <div>
      {/* Q Header */}
      <div style={{
        background: `linear-gradient(135deg,${col}12,${col}06)`,
        border: `1px solid ${col}20`, borderRadius: 16,
        padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
              <span style={{
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff',
                borderRadius: 8, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 800,
              }}>Q{qNum}</span>
              <span style={{
                background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0',
                borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 600,
              }}>{qType}</span>
              <span style={{
                background: col + '15', color: col,
                borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700,
              }}>{scoreLabel(p)}</span>
              {isHolistic && (
                <span style={{
                  background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe',
                  borderRadius: 20, padding: '2px 10px', fontSize: '0.68rem', fontWeight: 700,
                }}>🤖 AI Evaluated</span>
              )}
            </div>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', margin: 0, lineHeight: 1.6 }}>
              {qText}
            </h2>
          </div>
          {/* Score ring */}
          <ScoreRing score={q.marks_obtained} total={q.marks_possible} size={80} />
        </div>
        {/* Score bar */}
        <div style={{ marginTop: '0.875rem' }}>
          <div style={{ background: '#fff', borderRadius: 999, height: 7, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(p, 100)}%`,
              background: col, borderRadius: 999, transition: 'width 0.8s ease' }} />
          </div>
        </div>
      </div>

      {/* Student answer excerpt */}
      {q.student_answer_excerpt && (
        <div style={{
          background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '1rem 1.25rem', marginBottom: '1.125rem',
          borderLeft: '4px solid #94a3b8',
        }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b',
            marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Student's Answer (excerpt)
          </p>
          <p style={{ color: '#374151', fontSize: '0.875rem', lineHeight: 1.75,
            margin: 0, fontStyle: 'italic' }}>
            "{q.student_answer_excerpt}"
          </p>
        </div>
      )}

      {/* ── Step-wise Marking (step-wise mode only) ── */}
      {realSteps.length > 0 && (
        <div style={{ marginBottom: '1.125rem' }}>
          <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem',
            marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ background: '#eef2ff', color: '#4f46e5', borderRadius: 6,
              padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
              <Hash size={14} /> Step-wise Marks
            </span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>
              {q.marks_obtained}/{q.marks_possible} total
            </span>
          </p>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Step', 'Marks', 'Comment'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.875rem', textAlign: 'left',
                      fontSize: '0.68rem', color: '#64748b', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {realSteps.map((step, i) => {
                  const sp  = pct(step.awarded, step.max);
                  const sc  = sp >= 70 ? '#16a34a' : sp > 0 ? '#d97706' : '#dc2626';
                  const sbg = sp >= 70 ? '#f0fdf4' : sp > 0 ? '#fffbeb' : '#fef2f2';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.625rem 0.875rem', color: '#374151', lineHeight: 1.5 }}>{step.step}</td>
                      <td style={{ padding: '0.625rem 0.875rem' }}>
                        <span style={{ background: sbg, color: sc, border: `1px solid ${sc}25`,
                          borderRadius: 6, padding: '2px 10px', fontWeight: 800 }}>
                          {step.awarded}/{step.max}
                        </span>
                      </td>
                      <td style={{ padding: '0.625rem 0.875rem', color: '#64748b', fontSize: '0.78rem' }}>{step.comment}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feedback cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.125rem' }}>
        {[
          { icon: <Brain size={16} />, label: 'Concept',    text: q.feedback_concept,    col: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
          { icon: <ClipboardList size={16} />, label: 'Format',     text: q.feedback_format,     col: '#9a3412', bg: '#fff7ed', border: '#fed7aa' },
          { icon: <Hash size={16} />, label: 'Calculation',text: q.feedback_calculation, col: '#92400e', bg: '#fefce8', border: '#fde68a' },
          { icon: <Lightbulb size={16} />, label: 'How to Improve', text: q.feedback_suggestion, col: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
        ].filter(f => f.text).map((f, i) => (
          <div key={i} style={{
            background: f.bg, border: `1px solid ${f.border}`,
            borderRadius: 12, padding: '1rem 1.125rem',
          }}>
            <p style={{ fontWeight: 700, color: f.col, fontSize: '0.78rem',
              marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span>{f.icon}</span> {f.label}
            </p>
            <p style={{ color: f.col, fontSize: '0.875rem', lineHeight: 1.75, margin: 0 }}>
              {f.text}
            </p>
          </div>
        ))}
      </div>

      {/* ── Missing Points ── */}
      {missingPoints.length > 0 && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa',
          borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.125rem',
        }}>
          <button onClick={() => setShowMissing(v => !v)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚠️</span>
              <p style={{ fontWeight: 800, color: '#c2410c', margin: 0, fontSize: '0.875rem' }}>
                Missing Points
              </p>
              <span style={{
                background: '#f97316', color: '#fff', borderRadius: 20,
                padding: '1px 8px', fontSize: '0.65rem', fontWeight: 700,
              }}>{missingPoints.length}</span>
            </div>
            <span style={{ color: '#c2410c', fontSize: '0.7rem', fontWeight: 800,
              transform: showMissing ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>
          {showMissing && (
            <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.25rem',
              display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {missingPoints.map((pt, i) => (
                <li key={i} style={{ color: '#9a3412', fontSize: '0.875rem', lineHeight: 1.65 }}>{pt}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Step-wise mode feedback cards ── */}
      {!isHolistic && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.125rem' }}>
          {[
            { icon: '🧠', label: 'Concept',          text: q.feedback_concept,    col: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
            { icon: '📋', label: 'Format',            text: q.feedback_format,     col: '#9a3412', bg: '#fff7ed', border: '#fed7aa' },
            { icon: '🔢', label: 'Calculation',       text: q.feedback_calculation, col: '#92400e', bg: '#fefce8', border: '#fde68a' },
            { icon: '💡', label: 'How to Improve',    text: q.feedback_suggestion, col: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
          ].filter(f => f.text).map((f, i) => (
            <div key={i} style={{ background: f.bg, border: `1px solid ${f.border}`, borderRadius: 12, padding: '1rem 1.125rem' }}>
              <p style={{ fontWeight: 700, color: f.col, fontSize: '0.78rem',
                marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span>{f.icon}</span> {f.label}
              </p>
              <p style={{ color: f.col, fontSize: '0.82rem', lineHeight: 1.7, margin: 0 }}>{f.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Model answer accordion */}
      {q.model_answer_excerpt && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, overflow: 'hidden' }}>
          <button onClick={() => setShowModel(v => !v)} style={{
            width: '100%', padding: '0.875rem 1.125rem', background: 'transparent',
            border: 'none', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, color: '#15803d', fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={16} /> Model Answer Excerpt
            </span>
            <span style={{
              color: '#16a34a', background: '#dcfce7', borderRadius: 6,
              width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: showModel ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
              fontSize: '0.7rem', fontWeight: 800,
            }}><ChevronDown size={14} /></span>
          </button>
          {showModel && (
            <div style={{ padding: '0 1.125rem 1.125rem', borderTop: '1px solid #bbf7d0' }}>
              <p style={{ color: '#166534', fontSize: '0.875rem', lineHeight: 1.85,
                margin: '0.875rem 0 0', whiteSpace: 'pre-line' }}>
                {q.model_answer_excerpt}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Retry config ─────────────────────────────────────────────────────────────
const RETRY_DELAYS = [15, 20, 30, 30, 45, 60, 60, 60, 60, 60];
const MAX_RETRIES  = RETRY_DELAYS.length;

const EVAL_STEPS = [
  { icon: <Inbox size={18} />, label: 'Script Received',  desc: 'Your answer script was uploaded' },
  { icon: <Search size={18} />, label: 'OCR Processing',   desc: 'Extracting text from your answers' },
  { icon: <Bot size={18} />, label: 'AI Evaluating',    desc: 'Scoring against marking scheme' },
  { icon: <CheckCircle2 size={18} />, label: 'Report Ready',      desc: 'Evaluation complete' },
];

function EvalWaitingScreen({ countdown, retryCount, onRefresh, maxReached, onRetrigger, retriggering }) {
  const stepIdx = Math.min(Math.floor((retryCount / MAX_RETRIES) * 3), 2);
  const totalDelay = RETRY_DELAYS.slice(0, retryCount).reduce((a, b) => a + b, 0);
  const currentDelay = RETRY_DELAYS[retryCount] || 60;
  const cdPct        = currentDelay > 0 ? ((currentDelay - countdown) / currentDelay) * 100 : 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#0a0d14 0%,#0f1520 40%,#0d1017 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 580 }}>

        {/* Main card */}
        <div style={{
          background: '#fff', borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0', overflow: 'hidden',
        }}>
          {/* Header — ArivuPro green brand */}
          <div style={{
            background: maxReached
              ? 'linear-gradient(135deg,#7f1d1d,#991b1b)'
              : 'linear-gradient(135deg,#0a1f14 0%,#124D2A 55%,#2E8857 100%)',
            padding: '2rem 2rem 1.75rem',
            textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position:'absolute', top:-50, right:-40, width:140, height:140,
              borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
            <div style={{ position:'absolute', bottom:-30, left:20, width:90, height:90,
              borderRadius:'50%', background:'rgba(255,255,255,0.03)' }} />

            {/* Spinner / error icon */}
            {maxReached ? (
              <div style={{ display:'flex', justifyContent:'center', marginBottom:'0.875rem' }}>
                <div style={{
                  width:68, height:68, borderRadius:'50%',
                  background:'rgba(255,255,255,0.12)', border:'2px solid rgba(255,255,255,0.25)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <AlertTriangle size={32} color="#fff" />
                </div>
              </div>
            ) : (
              <div style={{ position:'relative', width:88, height:88, margin:'0 auto 1.125rem' }}>
                {/* Outer glow ring */}
                <div style={{
                  position:'absolute', inset:-6, borderRadius:'50%',
                  background:'rgba(46,136,87,0.15)',
                  animation:'pulse 2s ease-in-out infinite',
                }} />
                <svg width={88} height={88} style={{ transform:'rotate(-90deg)', position:'relative', zIndex:1 }}>
                  <circle cx={44} cy={44} r={36} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={5} />
                  <circle cx={44} cy={44} r={36} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={5}
                    strokeDasharray={`${(cdPct/100)*2*Math.PI*36} ${2*Math.PI*36}`}
                    strokeLinecap="round"
                    style={{ transition:'stroke-dasharray 1s linear' }} />
                </svg>
                <div style={{
                  position:'absolute', inset:0, display:'flex',
                  alignItems:'center', justifyContent:'center', zIndex:2,
                  fontSize: countdown > 0 ? '1.25rem' : '1.5rem', fontWeight:900, color:'#fff',
                }}>
                  {countdown > 0 ? countdown : <Bot size={30} />}
                </div>
              </div>
            )}

            <h2 style={{ color:'#fff', fontWeight:900, fontSize:'1.25rem', margin:'0 0 0.3rem', letterSpacing:'-0.01em' }}>
              {maxReached ? 'Taking Longer Than Expected' : 'AI Evaluation In Progress'}
            </h2>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.8rem', margin:0 }}>
              {maxReached
                ? 'The evaluation is taking unusually long. Try refreshing manually.'
                : countdown > 0
                  ? `Auto-checking in ${countdown} second${countdown !== 1 ? 's' : ''}…`
                  : 'Checking for results…'}
            </p>
          </div>

          {/* Steps */}
          <div style={{ padding:'1.375rem 1.75rem' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem', marginBottom:'1.375rem' }}>
              {EVAL_STEPS.map((step, i) => {
                const done    = i < stepIdx;
                const current = i === stepIdx && !maxReached;
                const pending = i > stepIdx;
                return (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:'0.875rem',
                    padding:'0.7rem 0.875rem', borderRadius:11,
                    background: done ? '#f0fdf4' : current ? '#f0fdf4' : '#f8fafc',
                    border:`1px solid ${done ? '#bbf7d0' : current ? '#86efac' : '#f1f5f9'}`,
                    transition:'all 0.3s',
                  }}>
                    <div style={{
                      width:34, height:34, borderRadius:9, flexShrink:0,
                      background: done ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                        : current ? 'linear-gradient(135deg,#2E8857,#16a34a)'
                        : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize:'0.9rem',
                      boxShadow: done ? '0 4px 10px rgba(22,163,74,0.3)'
                        : current ? '0 4px 10px rgba(46,136,87,0.35)' : 'none',
                    }}>
                      {done ? <CheckCircle2 size={18} color="#fff" /> : step.icon}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{
                        fontWeight:700, fontSize:'0.82rem',
                        color: done ? '#166534' : current ? '#15803d' : '#94a3b8',
                      }}>
                        {step.label}
                        {current && (
                          <span style={{
                            marginLeft:8, background:'#dcfce7', color:'#166534',
                            borderRadius:20, padding:'1px 8px',
                            fontSize:'0.62rem', fontWeight:700,
                            animation:'pulse 1.5s ease-in-out infinite',
                          }}>In Progress</span>
                        )}
                      </div>
                      <div style={{ fontSize:'0.7rem', color: done ? '#16a34a' : current ? '#2E8857' : '#cbd5e1', marginTop:1 }}>
                        {step.desc}
                      </div>
                    </div>
                    {done && <span style={{ color:'#16a34a', display:'flex' }}><CheckCircle2 size={15} /></span>}
                    {current && !maxReached && (
                      <div style={{
                        width:18, height:18, border:'2.5px solid #2E8857',
                        borderTopColor:'transparent', borderRadius:'50%',
                        animation:'spin 0.8s linear infinite', flexShrink:0,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Info bar */}
            {!maxReached && (
              <div style={{
                background:'#f0fdf4', border:'1px solid #bbf7d0',
                borderRadius:10, padding:'0.7rem 1rem',
                fontSize:'0.78rem', color:'#166534',
                display:'flex', alignItems:'center', gap:'0.5rem',
                marginBottom:'1.125rem',
              }}>
                <Clock size={15} />
                <span>
                  AI evaluation typically takes <strong>1–3 minutes</strong>.
                  {retryCount > 0 && ` Checked ${retryCount} time${retryCount > 1 ? 's' : ''}.`}
                </span>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={onRefresh} style={{
                flex:2, padding:'0.7rem', borderRadius:12, border:'none',
                background: maxReached
                  ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
                  : 'linear-gradient(135deg,#2E8857,#16a34a)',
                color:'#fff', fontWeight:700, fontSize:'0.875rem',
                cursor:'pointer',
                boxShadow: maxReached
                  ? '0 4px 14px rgba(220,38,38,0.3)'
                  : '0 4px 14px rgba(46,136,87,0.35)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}>
                <RefreshCw size={16} /> Check Now
              </button>
              <Link to="/submissions" style={{
                flex:1, padding:'0.7rem', borderRadius:12,
                border:'1px solid #e2e8f0', background:'#f8fafc',
                color:'#64748b', fontWeight:600, fontSize:'0.82rem',
                textDecoration:'none', textAlign:'center',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                ← Back
              </Link>
            </div>

            {maxReached && onRetrigger && (
              <button onClick={onRetrigger} disabled={retriggering} style={{
                width: '100%', marginTop: '0.75rem',
                padding: '0.65rem', borderRadius: 12, border: 'none',
                background: retriggering ? '#e2e8f0' : 'linear-gradient(135deg,#2E8857,#245a41)',
                color: retriggering ? '#94a3b8' : '#fff',
                fontWeight: 700, fontSize: '0.875rem',
                cursor: retriggering ? 'not-allowed' : 'pointer',
                boxShadow: retriggering ? 'none' : '0 4px 14px rgba(46,136,87,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}>
                <RefreshCw size={16} />
                {retriggering ? 'Restarting…' : 'Restart Evaluation'}
              </button>
            )}
            {maxReached && (
              <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.875rem' }}>
                If the issue persists, contact{' '}
                <a href="mailto:support@arivupro.com" style={{ color: '#2E8857', fontWeight: 600 }}>
                  support@arivupro.com
                </a>
              </p>
            )}
          </div>
        </div>

        {/* ── INFO ──────────────────────────────────────────────────── */}
        {!maxReached && (
          <div style={{
            background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.18)',
            borderRadius: 14, padding: '0.875rem 1.125rem', marginBottom: '1.125rem',
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>⏱</span>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#a5b4fc', fontSize: '0.8rem' }}>
                Typical time: 1–3 minutes
              </p>
              <p style={{ margin: 0, color: 'rgba(165,180,252,0.5)', fontSize: '0.72rem', lineHeight: 1.5 }}>
                {retryCount > 0
                  ? `Checked ${retryCount} time${retryCount > 1 ? 's' : ''}. Tap each step above to learn what's happening.`
                  : 'Click any step above to learn what\'s happening. The AI reads and evaluates your full answer script.'}
              </p>
            </div>
          </div>
        )}

        {/* ── ACTIONS ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onRefresh} style={{
            flex: 2, padding: '0.9rem', borderRadius: 14, border: 'none',
            background: maxReached
              ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
              : 'linear-gradient(135deg,#6366f1,#4f46e5)',
            color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
            boxShadow: maxReached ? '0 4px 18px rgba(220,38,38,0.45)' : '0 4px 18px rgba(99,102,241,0.5)',
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            🔄 Check Now
          </button>
          <Link to="/submissions" style={{
            flex: 1, padding: '0.9rem', borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.55)', fontWeight: 600,
            fontSize: '0.82rem', textDecoration: 'none', textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
          >← Back</Link>
        </div>

        {maxReached && (
          <p style={{ textAlign: 'center', fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.25)', marginTop: '1rem' }}>
            Persists? Email{' '}
            <a href="mailto:support@arivupro.com" style={{ color: '#818cf8', fontWeight: 600 }}>
              support@arivupro.com
            </a>
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.08); } }
      `}</style>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function EvaluationReport() {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const [report,       setReport]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [notReady,     setNotReady]     = useState(false);
  const [evalFailed,   setEvalFailed]   = useState(false); // backend evaluation crashed
  const [error,        setError]        = useState(null);
  const [retryCount,   setRetry]        = useState(0);
  const [triggerKey,   setTriggerKey]   = useState(0); // increment to force effect re-run
  const [countdown,    setCountdown]    = useState(0);
  const [selectedQ,    setSelectedQ]    = useState('overall');
  const [retriggering, setRetriggering] = useState(false);

  const retryRef = useRef(null);
  const cdRef    = useRef(null);
  const maxReached = retryCount >= MAX_RETRIES;

  useEffect(() => {
    // Stop auto-retrying when max retries reached OR backend evaluation crashed
    if ((maxReached || evalFailed) && notReady) return;

    (async () => {
      try {
        setLoading(true); setError(null); setNotReady(false); setEvalFailed(false);
        const { data, status: httpStatus } = await submissionsAPI.getReport(submissionId);

        // 202 = evaluation still in progress (or failed on backend)
        if (httpStatus === 202) {
          setNotReady(true);

          if (data?.status === 'failed') {
            // Backend evaluation crashed — stop polling, show retrigger immediately
            setEvalFailed(true);
            return;
          }

          if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCount] || 60;
            setCountdown(delay);
            clearInterval(cdRef.current);
            cdRef.current = setInterval(() => {
              setCountdown(c => {
                if (c <= 1) { clearInterval(cdRef.current); return 0; }
                return c - 1;
              });
            }, 1000);
            clearTimeout(retryRef.current);
            retryRef.current = setTimeout(() => setRetry(n => n + 1), delay * 1000);
          }
          return;
        }

        clearTimeout(retryRef.current);
        clearInterval(cdRef.current);
        setReport(data);
      } catch (err) {
        const s = err.response?.status;
        if (s === 403) {
          setError('You do not have permission to view this report.');
        } else if (s === 404) {
          if (String(submissionId).startsWith('m')) {
            setReport(buildMockReport(submissionId));
          } else {
            setError('Submission not found.');
          }
        } else {
          setReport(buildMockReport(submissionId));
        }
      } finally { setLoading(false); }
    })();

    return () => { clearTimeout(retryRef.current); clearInterval(cdRef.current); };
  }, [submissionId, retryCount, triggerKey]);

  const handleManualRefresh = () => {
    clearTimeout(retryRef.current);
    clearInterval(cdRef.current);
    setCountdown(0);
    setRetry(n => n + 1);
  };

  const handleRetrigger = async () => {
    try {
      setRetriggering(true);
      await submissionsAPI.retrigger(submissionId);
      clearTimeout(retryRef.current);
      clearInterval(cdRef.current);
      // Clear old report and show the waiting/progress screen
      setReport(null);
      setEvalFailed(false);
      setRetry(0);
      setCountdown(15);
      setNotReady(true);
      setTriggerKey(k => k + 1);
    } catch (err) {
      setError('Could not restart evaluation: ' + (err.response?.data?.detail || err.message));
    } finally {
      setRetriggering(false);
    }
  };

  if (loading && !notReady) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
      <div className="spinner" />
    </div>
  );

  if (notReady && !report) return (
    <EvalWaitingScreen
      countdown={countdown}
      retryCount={retryCount}
      onRefresh={handleManualRefresh}
      maxReached={maxReached || evalFailed}
      onRetrigger={handleRetrigger}
      retriggering={retriggering}
    />
  );

  if (error) return (
    <div className="page">
      <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1.25rem',
        borderRadius: 12, borderLeft: '4px solid #dc2626', marginBottom: '1rem' }}>{error}</div>
      <Link to="/evaluations" className="btn btn-secondary" style={{ textDecoration: 'none' }}>← My Evaluations</Link>
    </div>
  );

  // Show re-trigger option if evaluation has 0 marks (likely engine failed without questions)
  const needsRetrigger = report && report.total_score === 0 &&
    report.total_marks > 0 && !report.overall_feedback?.includes('not extract');

  if (!report) return null;

  const questions = report.questions || [];
  const activeQ   = questions.find(q => q.id === selectedQ);
  const totalPct  = pct(report.total_score, report.total_marks);
  const col       = scoreCol(totalPct);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>

      {/* Re-trigger banner for 0-mark evaluations */}
      {needsRetrigger && (
        <div style={{
          background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
          border: '1px solid #fde68a', borderTop: 'none',
          padding: '0.75rem 1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '1rem', flexWrap: 'wrap',
          boxShadow: '0 2px 8px rgba(245,158,11,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#92400e', fontSize: '0.85rem' }}>
                Evaluation shows 0 marks — the AI engine was updated
              </p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#b45309' }}>
                Click "Re-evaluate" to run the improved AI analysis on your answer script
              </p>
            </div>
          </div>
          <button onClick={handleRetrigger} style={{
            padding: '0.5rem 1.25rem', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#f59e0b,#d97706)',
            color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(245,158,11,0.4)', whiteSpace: 'nowrap',
          }}>🔄 Re-evaluate with AI</button>
        </div>
      )}

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 1.5rem', height: 60,
        borderBottom: '1px solid #e2e8f0', background: '#fff', flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <button onClick={() => navigate(-1)} style={{
            width: 32, height: 32, borderRadius: 8, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: '#f8fafc', border: '1px solid #e2e8f0',
            cursor: 'pointer', color: '#64748b',
          }}><ArrowLeft size={18} /></button>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: 0 }}>
              Evaluation Report
            </h1>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
              {(report.exam_paper?.title || '').substring(0, 55)}
              {(report.exam_paper?.title || '').length > 55 ? '…' : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: col + '12', border: `1px solid ${col}25`,
            borderRadius: 10, padding: '6px 14px',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: col }} />
            <span style={{ fontWeight: 900, color: col, fontSize: '0.9rem' }}>
              {report.total_score}/{report.total_marks}
            </span>
            <span style={{ color: col, fontSize: '0.75rem', fontWeight: 600 }}>
              ({totalPct}%)
            </span>
          </div>
          {report.answer_script_url && (
            <a
              href={report.answer_script_url}
              target="_blank"
              rel="noopener noreferrer"
              title="View your uploaded answer sheet"
              style={{
                padding: '0.45rem 1rem', borderRadius: 8,
                border: '1px solid #dbeafe',
                background: '#eff6ff', color: '#2563eb',
                fontWeight: 600, fontSize: '0.78rem',
                cursor: 'pointer', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <FileText size={14} /> Answer Sheet
            </a>
          )}
          <button
            onClick={handleRetrigger}
            disabled={retriggering}
            title="Re-evaluate this submission with AI"
            style={{
              padding: '0.45rem 1rem', borderRadius: 8,
              border: '1px solid #d1fae5',
              background: retriggering ? '#f0fdf4' : '#ecfdf5',
              color: retriggering ? '#6ee7b7' : '#059669',
              fontWeight: 600, fontSize: '0.78rem',
              cursor: retriggering ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <RefreshCw size={14} style={{ animation: retriggering ? 'spin 0.8s linear infinite' : 'none' }} />
            {retriggering ? 'Starting…' : 'Re-evaluate'}
          </button>
          <button onClick={() => window.print()} style={{
            padding: '0.45rem 1rem', border: '1px solid #e2e8f0',
            background: '#fff', borderRadius: 8, color: '#374151',
            fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}><Printer size={16} /> Print</button>
        </div>
      </div>

      {/* ── Q OVERVIEW STRIP ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        padding: '0.5rem 1.5rem', background: '#fff',
        borderBottom: '1px solid #f1f5f9', overflowX: 'auto',
        scrollbarWidth: 'none', flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0, marginRight: 4 }}>
          Jump to:
        </span>
        <button onClick={() => setSelectedQ('overall')} style={{
          padding: '3px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
          background: selectedQ === 'overall' ? '#4f46e5' : '#f1f5f9',
          color: selectedQ === 'overall' ? '#fff' : '#64748b',
          fontWeight: 700, fontSize: '0.72rem', flexShrink: 0,
        }}>Overview</button>
        {questions.map((q, i) => {
          const qp   = pct(q.marks_obtained, q.marks_possible);
          const qc   = scoreCol(qp);
          const act  = selectedQ === q.id;
          const qNum = q.question_number || q.step_scores?.q_number || (i + 1);
          return (
            <button key={q.id} onClick={() => setSelectedQ(q.id)} style={{
              padding: '3px 10px', borderRadius: 6, border: `1px solid ${act ? qc : qc + '30'}`,
              cursor: 'pointer', background: act ? qc : qc + '10',
              color: act ? '#fff' : qc,
              fontWeight: 700, fontSize: '0.72rem', flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              Q{qNum} · {q.marks_obtained}/{q.marks_possible}
            </button>
          );
        })}
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{
          width: 180, flexShrink: 0, borderRight: '1px solid #e2e8f0',
          background: '#fff', overflowY: 'auto', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>Questions</span>
          </div>
          <button onClick={() => setSelectedQ('overall')} style={{
            width: '100%', padding: '0.75rem 1rem', textAlign: 'left',
            background: selectedQ === 'overall' ? '#eff6ff' : 'transparent',
            border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
            borderLeft: `3px solid ${selectedQ === 'overall' ? '#4f46e5' : 'transparent'}`,
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem',
              color: selectedQ === 'overall' ? '#4f46e5' : '#374151', marginBottom: 4 }}>
              Overview
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: col }}>{report.total_score}/{report.total_marks}</span>
              <span style={{ fontSize: '0.65rem', color: col }}>({totalPct}%)</span>
            </div>
            <div style={{ marginTop: 5 }}>
              <MiniBar value={report.total_score} max={report.total_marks} color={col} />
            </div>
          </button>
          {questions.map((q, idx) => {
            const qp   = pct(q.marks_obtained, q.marks_possible);
            const qc   = scoreCol(qp);
            const act  = selectedQ === q.id;
            const qNum = q.question_number || q.step_scores?.q_number || (idx + 1);
            const qTxt = q.question_text   || q.step_scores?.q_text   || `Question ${idx + 1}`;
            return (
              <button key={q.id} onClick={() => setSelectedQ(q.id)} style={{
                width: '100%', padding: '0.65rem 1rem', textAlign: 'left',
                background: act ? qc + '10' : 'transparent',
                border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                borderLeft: `3px solid ${act ? qc : 'transparent'}`, transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: act ? 700 : 500, fontSize: '0.82rem',
                    color: act ? qc : '#374151' }}>Q{qNum}</span>
                  <span style={{ fontWeight: 800, fontSize: '0.78rem', color: qc }}>
                    {q.marks_obtained}/{q.marks_possible}
                  </span>
                </div>
                <MiniBar value={q.marks_obtained} max={q.marks_possible} color={qc} />
                <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(qTxt || '').substring(0, 38)}{(qTxt || '').length > 38 ? '…' : ''}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', background: '#f8fafc' }}>
          {selectedQ === 'overall'
            ? <OverallPanel report={report} submissionId={submissionId} />
            : activeQ
              ? <QuestionPanel q={activeQ} idx={questions.indexOf(activeQ)} />
              : <p style={{ color: '#64748b' }}>Select a question.</p>}
        </div>
      </div>
    </div>
  );
}

export default EvaluationReport;
