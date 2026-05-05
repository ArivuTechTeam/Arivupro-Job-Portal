import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, CheckCircle2, ExternalLink, RefreshCw,
  X, AlertTriangle, Eye, GraduationCap, Clock,
} from 'lucide-react';
import { evaluationsAPI } from '../services/api';

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:    { bg: '#fef3c7', color: '#d97706', border: '#fde68a', label: 'Pending' },
  processing: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: 'Processing' },
  completed:  { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: 'AI Evaluated' },
  approved:   { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', label: 'Approved' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>{m.label}</span>
  );
}

// ── Evaluate Modal (answer sheet + marks side-by-side) ─────────────────────────
function EvaluateModal({ evaluation, onClose, onSave }) {
  const [viewed,   setViewed]   = useState(false);
  const [marks,    setMarks]    = useState(evaluation.total_marks_obtained?.toString() || '');
  const [remarks,  setRemarks]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const studentName = evaluation.student_name || evaluation.student_username || 'Student';
  const paperTitle  = evaluation.exam_paper_title || '—';
  const answerUrl   = evaluation.answer_script_url;
  const maxMarks    = evaluation.total_marks_possible;

  const handleSave = async () => {
    if (!viewed && answerUrl) {
      setError('Please view the answer sheet before approving.');
      return;
    }
    if (!marks && marks !== '0') { setError('Please enter marks.'); return; }
    const m = parseFloat(marks);
    if (isNaN(m) || m < 0) { setError('Enter a valid marks value.'); return; }
    if (maxMarks && m > maxMarks) { setError(`Marks cannot exceed ${maxMarks}.`); return; }
    try {
      setSaving(true); setError('');
      await evaluationsAPI.approve(evaluation.id, {
        status: 'approved',
        total_marks_obtained: m,
        remarks,
      });
      onSave();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to approve. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20,
        width: '100%', maxWidth: 680,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#0a1f14,#2E8857)',
          padding: '1.25rem 1.5rem', borderRadius: '20px 20px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', margin: '0 0 2px',
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>Evaluate Submission</p>
            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0 }}>
              {studentName} — {paperTitle}
            </h3>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
            width: 32, height: 32, cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={16} /></button>
        </div>

        <div style={{ padding: '1.5rem' }}>

          {/* Answer Sheet section */}
          <div style={{
            background: answerUrl ? '#f0fdf4' : '#f8fafc',
            border: `1.5px solid ${answerUrl ? '#86efac' : '#e2e8f0'}`,
            borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: answerUrl ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FileText size={18} color={answerUrl ? '#fff' : '#94a3b8'} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', margin: 0 }}>
                    Student Answer Sheet
                  </p>
                  <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '2px 0 0' }}>
                    {answerUrl
                      ? viewed ? '✓ Viewed — you can now approve' : 'Click to open and review before approving'
                      : 'No answer sheet uploaded for this submission'}
                  </p>
                </div>
              </div>

              {answerUrl && (
                <a
                  href={answerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setViewed(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '0.5rem 1.25rem', borderRadius: 10, textDecoration: 'none',
                    background: viewed ? '#166534' : 'linear-gradient(135deg,#2E8857,#16a34a)',
                    color: '#fff', fontWeight: 700, fontSize: '0.82rem',
                    boxShadow: '0 3px 10px rgba(22,163,74,0.3)',
                  }}
                >
                  {viewed ? <CheckCircle2 size={14} /> : <Eye size={14} />}
                  {viewed ? 'Viewed' : 'Open Answer Sheet'}
                  {!viewed && <ExternalLink size={12} />}
                </a>
              )}
            </div>

            {!viewed && answerUrl && (
              <div style={{
                marginTop: '0.875rem', background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 8, padding: '0.5rem 0.875rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.78rem', color: '#92400e',
              }}>
                <AlertTriangle size={13} />
                You must open and review the answer sheet before approving.
              </div>
            )}
          </div>

          {/* AI Score info */}
          {evaluation.total_marks_obtained != null && (
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
              padding: '0.875rem 1rem', marginBottom: '1.25rem',
              display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
            }}>
              {[
                { label: 'AI Score', value: `${evaluation.total_marks_obtained} / ${evaluation.total_marks_possible ?? '?'}` },
                { label: 'Percentage', value: evaluation.percentage ? `${parseFloat(evaluation.percentage).toFixed(1)}%` : '—' },
                { label: 'Presentation', value: evaluation.presentation_score != null ? `${evaluation.presentation_score}/20` : '—' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{s.value}</div>
                </div>
              ))}
              <Link
                to={`/report/${evaluation.submission_id || evaluation.id}`}
                target="_blank"
                style={{
                  marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4,
                  color: '#6366f1', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none',
                  alignSelf: 'center',
                }}
              >
                <GraduationCap size={13} /> Full Report <ExternalLink size={11} />
              </Link>
            </div>
          )}

          {/* Marks override */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700,
              color: '#374151', marginBottom: 6 }}>
              Final Marks{maxMarks ? ` (out of ${maxMarks})` : ''} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              min="0"
              max={maxMarks || undefined}
              step="0.5"
              value={marks}
              onChange={e => setMarks(e.target.value)}
              placeholder="Enter marks awarded..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.6rem 0.875rem', border: '1.5px solid #e2e8f0',
                borderRadius: 10, fontSize: '0.95rem', fontWeight: 600,
                outline: 'none', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = '#2E8857'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Remarks */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700,
              color: '#374151', marginBottom: 6 }}>
              Admin Remarks <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Feedback or notes for this evaluation..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.6rem 0.875rem', border: '1.5px solid #e2e8f0',
                borderRadius: 10, fontSize: '0.875rem',
                outline: 'none', fontFamily: 'inherit', resize: 'vertical',
              }}
              onFocus={e => e.target.style.borderColor = '#2E8857'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {error && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10,
              padding: '0.625rem 0.875rem', marginBottom: '1rem',
              fontSize: '0.82rem', color: '#dc2626',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 2, padding: '0.7rem', borderRadius: 12, border: 'none',
                background: saving ? '#e2e8f0' : 'linear-gradient(135deg,#2E8857,#16a34a)',
                color: saving ? '#94a3b8' : '#fff',
                fontWeight: 700, fontSize: '0.875rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: saving ? 'none' : '0 4px 14px rgba(46,136,87,0.3)',
              }}
            >
              <CheckCircle2 size={16} />
              {saving ? 'Approving…' : 'Approve & Save'}
            </button>
            <button onClick={onClose} style={{
              flex: 1, padding: '0.7rem', borderRadius: 12,
              border: '1px solid #e2e8f0', background: '#f8fafc',
              color: '#64748b', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [activeFilter,setActiveFilter]= useState('all');
  const [evalModal,   setEvalModal]   = useState(null); // evaluation object

  const FILTERS = {
    all:          {},
    pending:      { status: 'pending' },
    ai_evaluated: { status: 'completed', is_ai_evaluated: true },
    approved:     { status: 'approved' },
  };

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const { data } = await evaluationsAPI.list(FILTERS[activeFilter] || {});
      setEvaluations(Array.isArray(data) ? data : data?.results || []);
      setError(null);
    } catch (e) {
      setError('Failed to load evaluations: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvaluations(); }, [activeFilter]); // eslint-disable-line

  const pendingCount = evaluations.filter(e => e.status !== 'approved').length;

  return (
    <div className="page">

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#0a1f14,#124D2A,#2E8857)',
        borderRadius: 20, padding: '1.5rem 2rem', marginBottom: '1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.25rem', margin: '0 0 4px' }}>
            Manage Evaluations
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', margin: 0 }}>
            Review AI scores, view answer sheets, and approve final marks
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 10, padding: '0.5rem 1rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fde68a' }}>{pendingCount}</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)' }}>Pending</div>
          </div>
          <button onClick={fetchEvaluations} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 10, padding: '0.5rem 0.875rem', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem',
          }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12,
          padding: '0.875rem 1.25rem', marginBottom: '1.25rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.875rem', color: '#991b1b',
        }}>
          <span><AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}><X size={16} /></button>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all',          label: 'All' },
          { key: 'pending',      label: 'Pending Review' },
          { key: 'ai_evaluated', label: 'AI Evaluated' },
          { key: 'approved',     label: 'Approved' },
        ].map(f => (
          <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
            padding: '0.4rem 1rem', borderRadius: 20, border: 'none',
            background: activeFilter === f.key ? '#2E8857' : '#f1f5f9',
            color: activeFilter === f.key ? '#fff' : '#64748b',
            fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      {loading && evaluations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
      ) : evaluations.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
          padding: '3rem', textAlign: 'center', color: '#94a3b8',
        }}>
          <Clock size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontWeight: 600, fontSize: '1rem' }}>No evaluations found</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Student', 'Paper', 'Answer Sheet', 'AI Score', 'Status', 'Date', 'Action'].map(h => (
                  <th key={h} style={{
                    padding: '0.75rem 1rem', textAlign: 'left',
                    fontSize: '0.68rem', color: '#64748b', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evaluations.map((ev, i) => {
                const name     = ev.student_name || ev.student_username || 'Unknown';
                const paper    = ev.exam_paper_title || '—';
                const obtained = ev.total_marks_obtained;
                const possible = ev.total_marks_possible;
                const pct      = ev.percentage;
                const hasFile  = !!ev.answer_script_url;
                return (
                  <tr key={ev.id} style={{
                    borderBottom: i < evaluations.length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#1e293b' }}>{name}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#374151', maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{paper}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>{ev.subject_name}</div>
                    </td>

                    {/* Answer Sheet column */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {hasFile ? (
                        <a
                          href={ev.answer_script_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 8,
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            color: '#15803d', fontWeight: 600, fontSize: '0.75rem',
                            textDecoration: 'none',
                          }}
                        >
                          <FileText size={12} /> View PDF
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>No file</span>
                      )}
                    </td>

                    <td style={{ padding: '0.875rem 1rem' }}>
                      {obtained != null ? (
                        <div>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>
                            {obtained}/{possible ?? '?'}
                          </span>
                          {pct != null && (
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 1 }}>
                              {parseFloat(pct).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '0.875rem 1rem' }}>
                      <StatusBadge status={ev.status} />
                    </td>

                    <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {ev.created_at
                        ? new Date(ev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>

                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {ev.status !== 'approved' && (
                          <button
                            onClick={() => setEvalModal(ev)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '5px 12px', borderRadius: 8, border: 'none',
                              background: 'linear-gradient(135deg,#2E8857,#16a34a)',
                              color: '#fff', fontWeight: 600, fontSize: '0.75rem',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(46,136,87,0.25)',
                            }}
                          >
                            <CheckCircle2 size={12} /> Evaluate
                          </button>
                        )}
                        {ev.status === 'approved' && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '5px 12px', borderRadius: 8,
                            background: '#f5f3ff', color: '#7c3aed',
                            fontSize: '0.75rem', fontWeight: 600,
                          }}>
                            <CheckCircle2 size={12} /> Approved
                          </span>
                        )}
                        <Link
                          to={`/report/${ev.submission_id || ev.id}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '5px 10px', borderRadius: 8,
                            border: '1px solid #e2e8f0', background: '#f8fafc',
                            color: '#64748b', fontWeight: 600, fontSize: '0.75rem',
                            textDecoration: 'none',
                          }}
                        >
                          <Eye size={12} /> Report
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Evaluate Modal */}
      {evalModal && (
        <EvaluateModal
          evaluation={evalModal}
          onClose={() => setEvalModal(null)}
          onSave={() => { setEvalModal(null); fetchEvaluations(); }}
        />
      )}
    </div>
  );
}
