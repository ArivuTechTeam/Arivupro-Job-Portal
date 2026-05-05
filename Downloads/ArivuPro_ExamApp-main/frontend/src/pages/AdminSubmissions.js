import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, ExternalLink, AlertTriangle, CheckCircle2,
  RefreshCw, Search, X, Eye,
} from 'lucide-react';
import { submissionsAPI, evaluationsAPI } from '../services/api';
import { PDFViewerModal, resolveUrl } from '../components/admin/AnswerScriptViewer';

// ── Status metadata ──────────────────────────────────────────────────────────
const STATUS_META = {
  pending:    { label: 'Pending',    bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  processing: { label: 'Processing', bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  evaluated:  { label: 'Evaluated',  bg: '#dcfce7', text: '#166534', border: '#86efac' },
  completed:  { label: 'Completed',  bg: '#dcfce7', text: '#166534', border: '#86efac' },
  failed:     { label: 'Failed',     bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  approved:   { label: 'Approved',   bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
};

const ALL_STATUS_FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'pending',   label: 'Pending' },
  { id: 'processing',label: 'Processing' },
  { id: 'evaluated', label: 'Evaluated' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed',    label: 'Failed' },
  { id: 'approved',  label: 'Approved' },
];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{
      background: m.bg, color: m.text, border: `1px solid ${m.border}`,
      borderRadius: 20, padding: '2px 10px',
      fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
    }}>{m.label}</span>
  );
}

// ── Inline Evaluate Modal ─────────────────────────────────────────────────────
function EvaluateModal({ submission, onClose, onSave }) {
  const [marks,   setMarks]   = useState(submission.marks_obtained?.toString() || '');
  const [remarks, setRemarks] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const [viewed,  setViewed]  = useState(false);

  const maxMarks  = submission.marks_possible || submission.total_marks || null;
  const fileUrl   = submission.answer_script_file;
  const answerUrl = resolveUrl(fileUrl);
  const name      = submission.student_name || submission.student_username || 'Student';
  const paper     = submission.exam_paper_title || '—';

  const handleSave = async () => {
    if (!marks && marks !== '0') { setErr('Enter marks.'); return; }
    const m = parseFloat(marks);
    if (isNaN(m) || m < 0) { setErr('Invalid marks.'); return; }
    if (maxMarks && m > maxMarks) { setErr(`Max marks is ${maxMarks}.`); return; }
    try {
      setSaving(true); setErr('');
      // Find evaluation by submission id and approve
      const evList = await evaluationsAPI.list({ submission_id: submission.id });
      const evData = evList.data?.results || evList.data || [];
      const ev = evData.find(e => String(e.submission_id) === String(submission.id));
      if (ev) {
        await evaluationsAPI.approve(ev.id, { status: 'approved', total_marks_obtained: m, remarks });
      }
      onSave();
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to save.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          background: 'linear-gradient(135deg,#0a1f14,#2E8857)',
          padding: '1.125rem 1.5rem', borderRadius: '20px 20px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Evaluate</p>
            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', margin: 0 }}>{name} — {paper}</h3>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
            width: 30, height: 30, cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={14} /></button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* Answer sheet */}
          <div style={{
            background: answerUrl ? '#f0fdf4' : '#f8fafc',
            border: `1.5px solid ${answerUrl ? '#86efac' : '#e2e8f0'}`,
            borderRadius: 12, padding: '1rem', marginBottom: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: answerUrl ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={16} color={answerUrl ? '#fff' : '#94a3b8'} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', margin: 0 }}>Answer Sheet</p>
                <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '1px 0 0' }}>
                  {answerUrl ? (viewed ? '✓ Viewed' : 'Click to review before approving') : 'No file uploaded'}
                </p>
              </div>
            </div>
            {answerUrl && (
              <a href={answerUrl} target="_blank" rel="noopener noreferrer" onClick={() => setViewed(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '0.45rem 1rem', borderRadius: 9, textDecoration: 'none',
                background: viewed ? '#166534' : 'linear-gradient(135deg,#2E8857,#16a34a)',
                color: '#fff', fontWeight: 700, fontSize: '0.78rem',
              }}>
                {viewed ? <CheckCircle2 size={13} /> : <Eye size={13} />}
                {viewed ? 'Viewed' : 'Open PDF'}
                {!viewed && <ExternalLink size={11} />}
              </a>
            )}
          </div>

          {/* AI score */}
          {submission.marks_obtained != null && (
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
              padding: '0.75rem 1rem', marginBottom: '1rem',
              display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
            }}>
              {[
                { label: 'AI Score', value: `${submission.marks_obtained}/${submission.marks_possible ?? '?'}` },
                { label: 'Percentage', value: submission.eval_percentage ? `${parseFloat(submission.eval_percentage).toFixed(1)}%` : '—' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>{s.value}</div>
                </div>
              ))}
              <Link to={`/report/${submission.id}`} target="_blank" style={{
                marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4,
                color: '#6366f1', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', alignSelf: 'center',
              }}>
                Full Report <ExternalLink size={11} />
              </Link>
            </div>
          )}

          <div style={{ marginBottom: '0.875rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 5 }}>
              Final Marks{maxMarks ? ` (out of ${maxMarks})` : ''} *
            </label>
            <input
              type="number" min="0" max={maxMarks || undefined} step="0.5"
              value={marks} onChange={e => setMarks(e.target.value)}
              placeholder="Enter marks..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.55rem 0.75rem', border: '1.5px solid #e2e8f0',
                borderRadius: 9, fontSize: '0.95rem', fontWeight: 600, outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 5 }}>
              Remarks <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea rows={2} value={remarks} onChange={e => setRemarks(e.target.value)}
              placeholder="Feedback for this submission..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.55rem 0.75rem', border: '1.5px solid #e2e8f0',
                borderRadius: 9, fontSize: '0.875rem', outline: 'none',
                fontFamily: 'inherit', resize: 'vertical',
              }}
            />
          </div>

          {err && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
              padding: '0.5rem 0.75rem', marginBottom: '0.875rem',
              fontSize: '0.78rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <AlertTriangle size={13} /> {err}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 2, padding: '0.65rem', borderRadius: 10, border: 'none',
              background: saving ? '#e2e8f0' : 'linear-gradient(135deg,#2E8857,#16a34a)',
              color: saving ? '#94a3b8' : '#fff', fontWeight: 700, fontSize: '0.875rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <CheckCircle2 size={15} /> {saving ? 'Saving…' : 'Approve & Save'}
            </button>
            <button onClick={onClose} style={{
              flex: 1, padding: '0.65rem', borderRadius: 10,
              border: '1px solid #e2e8f0', background: '#f8fafc',
              color: '#64748b', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminSubmissions() {
  const [submissions,  setSubmissions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [statusFilter, setStatus]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [evalModal,    setEvalModal]    = useState(null);
  const [viewer,       setViewer]       = useState({ open: false, url: null, title: '' });

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await submissionsAPI.list(params);
      setSubmissions(Array.isArray(data) ? data : data?.results || []);
      setError('');
    } catch (e) {
      setError('Failed to load submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    const id = setInterval(fetchSubmissions, 20_000);
    return () => clearInterval(id);
  }, [fetchSubmissions]);

  const filtered = submissions.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.student_name || s.student_username || '').toLowerCase().includes(q) ||
      (s.exam_paper_title || '').toLowerCase().includes(q)
    );
  });

  // Per-status counts for filter badges
  const countFor = (id) => {
    if (id === 'all') return submissions.length;
    if (id === 'evaluated') return submissions.filter(s => s.status === 'evaluated' || s.status === 'completed').length;
    return submissions.filter(s => s.status === id).length;
  };

  return (
    <div className="page" style={{ overflowX: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,#0a1f14,#124D2A,#2E8857)',
        borderRadius: 18, padding: '1.375rem 1.75rem', marginBottom: '1.25rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.2rem', margin: '0 0 3px' }}>
            Student Submissions
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', margin: 0 }}>
            View answer sheets, check marks and evaluate
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          {[
            { label: 'Total',     value: submissions.length,                                        color: '#a5b4fc' },
            { label: 'Pending',   value: submissions.filter(s => s.status === 'pending').length,   color: '#fde68a' },
            { label: 'Evaluated', value: submissions.filter(s => ['evaluated','completed','approved'].includes(s.status)).length, color: '#86efac' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 9, padding: '0.4rem 0.75rem', textAlign: 'center',
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
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10,
          padding: '0.75rem 1rem', marginBottom: '1rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.875rem', color: '#991b1b',
        }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}><X size={15} /></button>
        </div>
      )}

      {/* ── Filter + Search (single row) ───────────────────────────────────── */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
        padding: '0.625rem 0.875rem', marginBottom: '1rem',
        display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Status filter pills */}
        {ALL_STATUS_FILTERS.map(f => {
          const cnt = countFor(f.id);
          const active = statusFilter === f.id;
          return (
            <button key={f.id} onClick={() => setStatus(f.id)} style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 20,
              border: active ? 'none' : '1.5px solid #e2e8f0',
              background: active ? '#2E8857' : '#fff',
              color: active ? '#fff' : '#64748b',
              fontWeight: active ? 700 : 500, fontSize: '0.78rem', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              {f.label}
              {cnt > 0 && (
                <span style={{
                  marginLeft: 5, background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: active ? '#fff' : '#94a3b8',
                  borderRadius: 999, padding: '0 6px', fontSize: '0.68rem', fontWeight: 700,
                }}>{cnt}</span>
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: '#e2e8f0', flexShrink: 0 }} />

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 160 }}>
          <Search size={14} color="#94a3b8" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student or paper..."
            style={{ border: 'none', outline: 'none', fontSize: '0.82rem', fontFamily: 'inherit', flex: 1 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0,
              display: 'flex', alignItems: 'center',
            }}><X size={13} /></button>
          )}
        </div>

        <div style={{ flexShrink: 0, fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Submission rows (no horizontal scroll) ─────────────────────────── */}
      {loading && submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
          padding: '3rem', textAlign: 'center', color: '#94a3b8',
        }}>
          <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>No submissions found</p>
          <p style={{ fontSize: '0.82rem' }}>Try a different filter or search term.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', overflow: 'hidden' }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,2fr) minmax(0,2fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,1fr) minmax(0,90px)',
            gap: '0.5rem', alignItems: 'center',
            padding: '0.5rem 1rem', width: '100%', boxSizing: 'border-box',
          }}>
            {['Student', 'Paper', 'Status', 'Marks', 'Answer Sheet', 'Actions'].map(h => (
              <div key={h} style={{
                fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>{h}</div>
            ))}
          </div>
          {filtered.map((sub, idx) => {
            const name   = sub.student_name || sub.student_username || 'Student';
            const email  = sub.student_email || '';
            const paper  = sub.exam_paper_title || '—';
            const subj   = sub.subject_name || '—';
            const file   = sub.answer_script_file;
            const hasEval = sub.marks_obtained != null;
            const marks  = hasEval ? `${sub.marks_obtained}/${sub.marks_possible ?? '?'}` : null;
            const pct    = sub.eval_percentage ? `${parseFloat(sub.eval_percentage).toFixed(0)}%` : null;

            return (
              <div key={sub.id} style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                padding: '0.75rem 1rem',
                display: 'grid',
                gridTemplateColumns: 'minmax(0,2fr) minmax(0,2fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,1fr) minmax(0,90px)',
                gap: '0.5rem', alignItems: 'center',
                width: '100%', boxSizing: 'border-box',
                minWidth: 0, overflow: 'hidden',
                transition: 'box-shadow 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {/* Student */}
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', marginBottom: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
                </div>

                {/* Paper + Subject */}
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.79rem', color: '#1e293b',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={paper}>{paper}</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subj}</div>
                </div>

                {/* Status + Date */}
                <div style={{ minWidth: 0 }}>
                  <StatusBadge status={sub.status} />
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 3 }}>
                    {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>

                {/* Marks */}
                <div style={{ textAlign: 'center', minWidth: 0 }}>
                  {marks ? (
                    <>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{marks}</div>
                      {pct && <div style={{ fontSize: '0.62rem', color: '#64748b' }}>{pct}</div>}
                    </>
                  ) : (
                    <span style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>—</span>
                  )}
                </div>

                {/* Answer Script */}
                <div style={{ minWidth: 0 }}>
                  {file ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <button
                        onClick={() => setViewer({ open: true, url: file, title: `${name} — ${paper}` })}
                        style={{
                          padding: '3px 8px', borderRadius: 5,
                          background: '#eff6ff', border: '1px solid #bfdbfe',
                          color: '#2563eb', fontWeight: 600, fontSize: '0.68rem',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                        }}
                      >
                        <FileText size={10} /> View PDF
                      </button>
                      <a href={resolveUrl(file)} download style={{
                        padding: '3px 8px', borderRadius: 5,
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        color: '#16a34a', fontWeight: 600, fontSize: '0.68rem',
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3,
                      }}>
                        ⬇ Download
                      </a>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>No file</span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 0 }}>
                  <Link to={`/report/${sub.id}`}
                    style={{
                      padding: '4px 8px', borderRadius: 7,
                      background: '#f5f3ff', border: '1px solid #ddd6fe',
                      color: '#7c3aed', fontWeight: 600, fontSize: '0.7rem',
                      textDecoration: 'none', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 2,
                    }}>
                    📊 Report
                  </Link>
                  {sub.status !== 'approved' && (
                    <button
                      onClick={() => setEvalModal(sub)}
                      style={{
                        padding: '4px 8px', borderRadius: 7,
                        background: 'linear-gradient(135deg,#2E8857,#16a34a)',
                        border: 'none', color: '#fff',
                        fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 2,
                        width: '100%',
                      }}
                    >
                      <CheckCircle2 size={10} /> Evaluate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF Viewer */}
      {viewer.open && (
        <PDFViewerModal
          fileUrl={viewer.url}
          title={viewer.title}
          onClose={() => setViewer({ open: false, url: null, title: '' })}
        />
      )}

      {/* Evaluate Modal */}
      {evalModal && (
        <EvaluateModal
          submission={evalModal}
          onClose={() => setEvalModal(null)}
          onSave={() => { setEvalModal(null); fetchSubmissions(); }}
        />
      )}
    </div>
  );
}
