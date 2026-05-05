import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, FileText, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, Inbox, BarChart3, RefreshCw, X,
} from 'lucide-react';
import { submissionsAPI } from '../services/api';

const STATUS_META = {
  pending:    { label: 'Pending',    bg: '#fef3c7', color: '#d97706', border: '#fcd34d', dot: '#f59e0b' },
  processing: { label: 'Evaluating', bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd', dot: '#3b82f6' },
  evaluated:  { label: 'Evaluated',  bg: '#dcfce7', color: '#166534', border: '#86efac', dot: '#22c55e' },
  completed:  { label: 'Evaluated',  bg: '#dcfce7', color: '#166534', border: '#86efac', dot: '#22c55e' },
  failed:     { label: 'Failed',     bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', dot: '#ef4444' },
  approved:   { label: 'Approved',   bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', dot: '#8b5cf6' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      borderRadius: 20, padding: '3px 10px',
      fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function ScoreRing({ obtained, possible }) {
  if (obtained == null) return null;
  const pct = possible ? Math.round((obtained / possible) * 100) : 0;
  const col = pct >= 60 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
  const r = 22, C = 2 * Math.PI * r;
  const dash = (pct / 100) * C;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={54} height={54} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={27} cy={27} r={r} fill="none" stroke="#f1f5f9" strokeWidth={5} />
        <circle cx={27} cy={27} r={r} fill="none" stroke={col} strokeWidth={5}
          strokeDasharray={`${dash} ${C}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div style={{ marginLeft: -46, width: 54, textAlign: 'center', position: 'absolute' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: col }}>{pct}%</div>
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', lineHeight: 1 }}>
          {obtained}<span style={{ fontWeight: 400, fontSize: '0.72rem', color: '#94a3b8' }}>/{possible}</span>
        </div>
        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 1 }}>marks</div>
      </div>
    </div>
  );
}

export function MySubmissions() {
  const [submissions,  setSubmissions]  = useState([]);
  const [statusFilter, setStatus]       = useState('all');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await submissionsAPI.list(params);
      setSubmissions(Array.isArray(data) ? data : data?.results || []);
    } catch {
      setError('Failed to load your submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  // Auto-refresh every 20 seconds (shows evaluation progress)
  useEffect(() => {
    const id = setInterval(fetchSubmissions, 20_000);
    return () => clearInterval(id);
  }, [fetchSubmissions]);

  const counts = {
    all:       submissions.length,
    pending:   submissions.filter(s => s.status === 'pending').length,
    evaluated: submissions.filter(s => ['evaluated','completed','approved'].includes(s.status)).length,
    failed:    submissions.filter(s => s.status === 'failed').length,
  };

  const canViewReport = (s) => ['evaluated','completed','approved'].includes(s.status);

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="page">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,#0a1f14 0%,#124D2A 60%,#2E8857 100%)',
        borderRadius: 18, padding: '1.5rem 2rem', marginBottom: '1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', margin: '0 0 4px' }}>
            My Submissions
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', margin: 0 }}>
            Track and review all your submitted answer scripts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          {[
            { label: 'Total',     value: counts.all,       color: '#a5b4fc' },
            { label: 'Evaluated', value: counts.evaluated, color: '#86efac' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 9, padding: '0.375rem 0.875rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
            </div>
          ))}
          <button onClick={fetchSubmissions} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 9, padding: '0.4rem 0.75rem', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem',
          }}>
            <RefreshCw size={13} />
          </button>
          <Link to="/upload" style={{
            padding: '0.5rem 1.25rem', borderRadius: 10,
            background: 'linear-gradient(135deg,#22c55e,#16a34a)',
            color: '#fff', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: '0 4px 12px rgba(34,197,94,0.4)',
          }}>
            <Upload size={14} /> Upload New
          </Link>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5',
          borderLeft: '4px solid #dc2626', borderRadius: 10,
          padding: '0.75rem 1rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.875rem', color: '#991b1b',
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError('')} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', padding: 0,
          }}><X size={14} /></button>
        </div>
      )}

      {/* ── Filter pills ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '1.25rem',
        flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none',
        paddingBottom: 2,
      }}>
        {[
          { id: 'all',       label: 'All',       count: counts.all       },
          { id: 'pending',   label: 'Pending',   count: counts.pending   },
          { id: 'evaluated', label: 'Evaluated', count: counts.evaluated },
          { id: 'failed',    label: 'Failed',    count: counts.failed    },
        ].map(f => {
          const active = statusFilter === f.id;
          return (
            <button key={f.id} onClick={() => setStatus(f.id)} style={{
              flexShrink: 0, padding: '6px 16px', borderRadius: 20,
              border: active ? 'none' : '1.5px solid #e2e8f0',
              background: active ? '#2E8857' : '#fff',
              color: active ? '#fff' : '#64748b',
              fontWeight: active ? 700 : 500, fontSize: '0.8rem', cursor: 'pointer',
            }}>
              {f.label}
              {f.count > 0 && (
                <span style={{
                  marginLeft: 5, background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: active ? '#fff' : '#94a3b8',
                  borderRadius: 999, padding: '0 6px', fontSize: '0.68rem', fontWeight: 700,
                }}>{f.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
      ) : submissions.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
          padding: '4rem', textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1.25rem',
            background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Inbox size={28} color="#2E8857" />
          </div>
          <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            {statusFilter !== 'all' ? 'No submissions here' : 'No submissions yet'}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {statusFilter !== 'all'
              ? 'Try a different filter.'
              : 'Upload your first answer script to get AI evaluation.'}
          </p>
          <Link to="/upload" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '0.625rem 1.5rem', borderRadius: 10,
            background: 'linear-gradient(135deg,#2E8857,#16a34a)',
            color: '#fff', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(46,136,87,0.3)',
          }}>
            <Upload size={16} /> Upload Answer Script
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {submissions.map(sub => {
            const paper   = sub.exam_paper_title || sub.exam_paper?.title || 'Exam Paper';
            const subject = sub.subject_name || (typeof sub.exam_paper?.subject === 'object' ? sub.exam_paper?.subject?.name : sub.exam_paper?.subject) || '—';
            const hasScore = sub.marks_obtained != null;
            const canReport = canViewReport(sub);

            return (
              <div key={sub.id} style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
                padding: '1.125rem 1.375rem',
                display: 'grid',
                gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr) auto',
                gap: '1rem', alignItems: 'center',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >
                {/* Paper info */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                      border: '1px solid #bbf7d0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={16} color="#2E8857" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700, fontSize: '0.875rem', color: '#0f172a',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }} title={paper}>{paper}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 1 }}>{subject}</div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={sub.status} />
                  {sub.status === 'processing' && (
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: 4 }}>
                      AI is evaluating…
                    </div>
                  )}
                </div>

                {/* Score */}
                <div style={{ position: 'relative' }}>
                  {hasScore ? (
                    <ScoreRing obtained={sub.marks_obtained} possible={sub.marks_possible} />
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>—</span>
                  )}
                </div>

                {/* Date */}
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>
                    {fmtDate(sub.created_at)}
                  </div>
                  {sub.time_taken_minutes && (
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> {sub.time_taken_minutes} min
                    </div>
                  )}
                </div>

                {/* Action */}
                <div style={{ flexShrink: 0 }}>
                  {canReport ? (
                    <Link to={`/report/${sub.id}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '6px 14px', borderRadius: 9, textDecoration: 'none',
                      background: 'linear-gradient(135deg,#2E8857,#16a34a)',
                      color: '#fff', fontWeight: 700, fontSize: '0.78rem',
                      boxShadow: '0 3px 10px rgba(46,136,87,0.3)',
                    }}>
                      <BarChart3 size={13} /> View Report <ChevronRight size={12} />
                    </Link>
                  ) : sub.status === 'processing' || sub.status === 'pending' ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '6px 14px', borderRadius: 9,
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                      color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem',
                    }}>
                      <Clock size={12} /> Processing…
                    </span>
                  ) : (
                    <Link to={`/report/${sub.id}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '6px 12px', borderRadius: 9, textDecoration: 'none',
                      background: '#f5f3ff', border: '1px solid #ddd6fe',
                      color: '#7c3aed', fontWeight: 600, fontSize: '0.78rem',
                    }}>
                      <CheckCircle2 size={12} /> Report
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {/* Count */}
          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', paddingTop: '0.5rem' }}>
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
            {' '}&nbsp;·&nbsp; Auto-refreshes every 20 seconds
          </p>
        </div>
      )}
    </div>
  );
}

export default MySubmissions;
