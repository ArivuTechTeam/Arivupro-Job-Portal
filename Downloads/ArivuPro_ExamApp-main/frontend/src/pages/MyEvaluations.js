import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submissionsAPI, evaluationsAPI } from '../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function scoreCol(p) {
  if (p >= 70) return { text: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
  if (p >= 50) return { text: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
  if (p >= 35) return { text: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  return { text: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
}

const STATUS_META = {
  completed:  { label: 'Completed',  bg: '#dcfce7', text: '#166534', border: '#86efac', dot: '#16a34a' },
  evaluated:  { label: 'Evaluated',  bg: '#dcfce7', text: '#166534', border: '#86efac', dot: '#16a34a' },
  approved:   { label: 'Approved',   bg: '#d1fae5', text: '#065f46', border: '#6ee7b7', dot: '#059669' },
  pending:    { label: 'Pending',    bg: '#fef3c7', text: '#92400e', border: '#fcd34d', dot: '#f59e0b' },
  processing: { label: 'Processing', bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', dot: '#3b82f6' },
  failed:     { label: 'Failed',     bg: '#fee2e2', text: '#991b1b', border: '#fecaca', dot: '#dc2626' },
  review:     { label: 'In Review',  bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe', dot: '#9333ea' },
};

// ── Download report as PDF ────────────────────────────────────────────────────
function downloadReport(submissionId) {
  const reportUrl = `/report/${submissionId}`;
  const win = window.open(reportUrl, '_blank');
  if (win) {
    win.onload = () => {
      setTimeout(() => {
        try { win.print(); } catch (e) {}
      }, 1500);
    };
  }
}

// ── Mini score ring ───────────────────────────────────────────────────────────
function ScoreRing({ pct, size = 52 }) {
  const col = scoreCol(pct);
  const r   = (size - 8) / 2;
  const c   = 2 * Math.PI * r;
  const d   = (pct / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col.text} strokeWidth={6}
          strokeDasharray={`${d} ${c}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: '0.65rem', fontWeight: 900, color: col.text, lineHeight: 1 }}>
        {Math.round(pct)}%
      </div>
    </div>
  );
}

// ── Evaluation Card ───────────────────────────────────────────────────────────
function EvalCard({ sub, evalData }) {
  const navigate = useNavigate();
  const sm  = STATUS_META[sub.status] || STATUS_META.pending;
  const done = ['completed', 'evaluated', 'approved'].includes(sub.status);
  const failed = sub.status === 'failed';

  const title   = sub.exam_paper_title || sub.exam_paper?.title || 'Exam Paper';
  const subject = sub.subject_name     || sub.exam_paper?.subject?.name || '';
  const student = sub.student_name     || sub.student?.username || 'Student';
  const date    = fmtDate(sub.created_at);

  // Scores from evaluation
  const pctVal   = evalData?.percentage ?? sub.percentage ?? null;
  const obtained = evalData?.total_marks_obtained ?? sub.total_score ?? null;
  const possible = evalData?.total_marks_possible ?? sub.total_marks ?? null;
  const sc       = pctVal != null ? scoreCol(parseFloat(pctVal)) : null;

  return (
    <div style={{
      background: '#fff', borderRadius: 18,
      border: `1px solid ${done ? (sc?.border || '#e2e8f0') : '#e2e8f0'}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Top accent bar */}
      <div style={{ height: 4, background: done ? (sc?.text || '#6366f1') : sm.dot, opacity: 0.8 }} />

      <div style={{ padding: '1.25rem 1.5rem' }}>
        {/* Row 1: status badge + score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: sm.bg, color: sm.text, border: `1px solid ${sm.border}`,
              borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: sm.dot, display: 'inline-block' }} />
              {sm.label}
            </span>
            {evalData?.is_ai_evaluated && (
              <span style={{
                background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe',
                borderRadius: 20, padding: '3px 10px', fontSize: '0.65rem', fontWeight: 700,
              }}>🤖 AI</span>
            )}
          </div>
          {/* Score ring */}
          {done && pctVal != null && <ScoreRing pct={parseFloat(pctVal)} />}
          {/* Waiting animation for pending */}
          {!done && !failed && (
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: '#fef3c7', border: '2px solid #fcd34d',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem',
              animation: 'pulse 2s ease-in-out infinite',
            }}>⏳</div>
          )}
        </div>

        {/* Row 2: Paper title */}
        <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a',
          margin: '0 0 0.25rem', lineHeight: 1.45,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {title}
        </h3>
        {subject && (
          <span style={{
            display: 'inline-block', background: '#eef2ff', color: '#4f46e5',
            borderRadius: 6, padding: '2px 10px', fontSize: '0.68rem', fontWeight: 700, marginBottom: '0.875rem',
          }}>{subject}</span>
        )}

        {/* Row 3: Meta info */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap',
          fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>
          <span>👤 {student}</span>
          <span>
            📊 {obtained != null
              ? <strong style={{ color: '#1e293b' }}>{obtained}/{possible} marks</strong>
              : done ? '—' : 'Awaiting AI evaluation'}
          </span>
          <span>🗓 {date}</span>
          {sub.time_taken_minutes && <span>⏱ {sub.time_taken_minutes} min</span>}
        </div>

        {/* Score progress bar for completed */}
        {done && pctVal != null && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Score</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: sc?.text }}>{parseFloat(pctVal).toFixed(1)}%</span>
            </div>
            <div style={{ height: 7, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(parseFloat(pctVal), 100)}%`,
                background: sc?.text, borderRadius: 999, transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        )}

        {/* Presentation score chips */}
        {done && evalData?.presentation_score != null && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {[
              { label: 'Presentation', value: evalData.presentation_score, max: 20 },
            ].map(s => (
              <div key={s.label} style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 8, padding: '3px 10px', fontSize: '0.7rem', color: '#475569',
              }}>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{s.value}</span>/{s.max} {s.label}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          {done ? (
            <>
              {/* View AI Evaluation Report */}
              <Link to={`/report/${sub.id}`} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.6rem 1.25rem', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
                color: '#fff', fontWeight: 700, fontSize: '0.82rem',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 18px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.35)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                📊 View AI Evaluation
              </Link>

              {/* Download Report */}
              <button onClick={() => downloadReport(sub.id)} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.6rem 1.125rem', borderRadius: 10,
                border: '1.5px solid #e2e8f0', background: '#fff',
                color: '#374151', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#374151'; }}
              >
                📥 Download Report
              </button>

              {/* Progress details */}
              <Link to="/progress" style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.6rem 1rem', borderRadius: 10,
                border: '1.5px solid #bbf7d0', background: '#f0fdf4',
                color: '#16a34a', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none',
                transition: 'all 0.15s',
              }}>
                📈 Progress
              </Link>
            </>
          ) : failed ? (
            <>
              <span style={{
                padding: '0.6rem 1.125rem', borderRadius: 10,
                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                fontSize: '0.82rem', fontWeight: 600,
              }}>❌ Evaluation Failed</span>
              <Link to={`/report/${sub.id}`} style={{
                padding: '0.6rem 1rem', borderRadius: 10,
                border: '1.5px solid #fde68a', background: '#fffbeb',
                color: '#d97706', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none',
              }}>🔄 Retry</Link>
            </>
          ) : (
            <>
              {/* Pending — clickable to view waiting screen */}
              <Link to={`/report/${sub.id}`} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.6rem 1.25rem', borderRadius: 10,
                background: '#fef3c7', color: '#92400e',
                border: '1.5px solid #fcd34d',
                fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none',
                transition: 'all 0.15s',
              }}>
                ⏳ AI Evaluating… View Status
              </Link>
              <span style={{
                padding: '0.6rem 1rem', borderRadius: 10,
                background: '#f8fafc', color: '#94a3b8',
                border: '1px solid #e2e8f0',
                fontSize: '0.72rem', fontStyle: 'italic', fontWeight: 500,
                display: 'flex', alignItems: 'center',
              }}>
                Usually takes 1–3 min
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyEvaluations() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [evalMap,     setEvalMap]     = useState({}); // submissionId → evaluation
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [refreshing,  setRefreshing]  = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      // Fetch submissions (source of truth for all statuses)
      const [subRes, evalRes] = await Promise.allSettled([
        submissionsAPI.list(),
        evaluationsAPI.getHistory(),
      ]);

      // Map evaluations by submission_id for quick lookup
      const map = {};
      if (evalRes.status === 'fulfilled') {
        const evList = evalRes.value.data?.results || evalRes.value.data || [];
        evList.forEach(ev => {
          if (ev.submission_id) map[ev.submission_id] = ev;
          if (ev.submission?.id) map[ev.submission.id] = ev;
        });
      }
      setEvalMap(map);

      if (subRes.status === 'fulfilled') {
        const list = subRes.value.data?.results || subRes.value.data || [];
        setSubmissions(list);
      }
    } catch (e) {
      console.error('MyEvaluations load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = submissions.filter(s => {
    const done = ['completed', 'evaluated', 'approved'].includes(s.status);
    if (filter === 'all')       return true;
    if (filter === 'completed') return done;
    if (filter === 'pending')   return !done;
    return true;
  });

  const counts = {
    all:       submissions.length,
    completed: submissions.filter(s => ['completed', 'evaluated', 'approved'].includes(s.status)).length,
    pending:   submissions.filter(s => !['completed', 'evaluated', 'approved'].includes(s.status)).length,
  };

  const avgScore = (() => {
    const done = submissions.filter(s => evalMap[s.id]?.percentage != null);
    if (!done.length) return null;
    const avg = done.reduce((sum, s) => sum + parseFloat(evalMap[s.id].percentage), 0) / done.length;
    return avg.toFixed(1);
  })();

  if (loading) return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%)',
        borderRadius: 18, padding: '1.625rem 2rem', marginBottom: '1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
        boxShadow: '0 8px 28px rgba(67,56,202,0.3)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-50, right:-30, width:160, height:160,
          borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <span style={{
              background:'rgba(255,255,255,0.12)', color:'#c7d2fe',
              border:'1px solid rgba(255,255,255,0.2)', borderRadius:20,
              padding:'3px 12px', fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.05em',
            }}>📊 Evaluations</span>
            {avgScore && (
              <span style={{
                background:'rgba(99,102,241,0.3)', color:'#a5b4fc',
                border:'1px solid rgba(99,102,241,0.4)', borderRadius:20,
                padding:'3px 10px', fontSize:'0.68rem', fontWeight:700,
              }}>Avg: {avgScore}%</span>
            )}
          </div>
          <h1 style={{ color:'#fff', fontSize:'1.5rem', fontWeight:900, margin:'0 0 0.25rem' }}>
            My Evaluations
          </h1>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.82rem', margin:0 }}>
            AI-powered evaluation results — scores, feedback, and downloadable reports
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', position: 'relative' }}>
          <button onClick={() => loadData(true)} style={{
            padding:'0.5rem 1rem', borderRadius:10,
            background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)',
            color:'#fff', fontWeight:600, fontSize:'0.78rem', cursor:'pointer',
          }}>
            {refreshing ? '⏳' : '🔄'} Refresh
          </button>
          <Link to="/upload" style={{
            padding:'0.5rem 1.25rem', borderRadius:10,
            background:'linear-gradient(135deg,#22c55e,#16a34a)',
            color:'#fff', fontWeight:700, fontSize:'0.82rem', textDecoration:'none',
            boxShadow:'0 4px 12px rgba(34,197,94,0.4)',
          }}>＋ New Submission</Link>
        </div>
      </div>

      {/* ── Stats strip ───────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',
        gap:'0.875rem', marginBottom:'1.25rem' }}>
        {[
          { icon:'📋', label:'Total',     value: counts.all,       color:'#4f46e5', bg:'#eef2ff' },
          { icon:'✅', label:'Evaluated',  value: counts.completed, color:'#16a34a', bg:'#f0fdf4' },
          { icon:'⏳', label:'Pending',    value: counts.pending,   color:'#d97706', bg:'#fffbeb' },
          { icon:'📊', label:'Avg Score',  value: avgScore ? `${avgScore}%` : '—', color:'#0891b2', bg:'#ecfeff' },
        ].map(s => (
          <div key={s.label} style={{
            background:'#fff', borderRadius:12, padding:'0.875rem 1rem',
            border:'1px solid #e2e8f0', boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
            display:'flex', alignItems:'center', gap:'0.75rem',
          }}>
            <div style={{ width:36, height:36, borderRadius:9, background:s.bg,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize:'1.2rem', fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:'0.65rem', color:'#94a3b8', marginTop:2, fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ───────────────────────────────────────────────── */}
      <div style={{
        display:'flex', gap:'0.375rem', marginBottom:'1.25rem',
        background:'#f8fafc', border:'1px solid #e2e8f0',
        borderRadius:11, padding:'0.3rem', width:'fit-content',
      }}>
        {[
          { id:'all',       label:`All (${counts.all})` },
          { id:'completed', label:`Evaluated (${counts.completed})` },
          { id:'pending',   label:`Pending (${counts.pending})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
            padding:'0.45rem 1.125rem', borderRadius:8, border:'none',
            background: filter === tab.id ? '#4f46e5' : 'transparent',
            color: filter === tab.id ? '#fff' : '#64748b',
            fontWeight:700, fontSize:'0.82rem', cursor:'pointer', transition:'all 0.15s',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Cards ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:18, border:'1px solid #e2e8f0',
          padding:'4rem 2rem', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'0.75rem', opacity:0.3 }}>📋</div>
          <h3 style={{ fontWeight:800, color:'#1e293b', marginBottom:'0.5rem' }}>No evaluations found</h3>
          <p style={{ color:'#94a3b8', fontSize:'0.875rem', marginBottom:'1.5rem' }}>
            Upload an answer script to get an AI evaluation report.
          </p>
          <Link to="/upload" style={{
            display:'inline-flex', alignItems:'center', gap:'0.5rem',
            padding:'0.625rem 1.75rem', borderRadius:10, border:'none',
            background:'linear-gradient(135deg,#4f46e5,#6366f1)',
            color:'#fff', fontWeight:700, fontSize:'0.875rem', textDecoration:'none',
            boxShadow:'0 4px 14px rgba(99,102,241,0.4)',
          }}>📤 Upload Answer Script</Link>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {filtered.map(sub => (
            <EvalCard
              key={sub.id}
              sub={sub}
              evalData={evalMap[sub.id] || null}
            />
          ))}
          <div style={{ textAlign:'center', fontSize:'0.78rem', color:'#94a3b8', paddingTop:'0.5rem' }}>
            Showing {filtered.length} submission{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}
