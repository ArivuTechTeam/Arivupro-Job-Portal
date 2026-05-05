import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Image as ImageIcon,
  FolderOpen,
  ArrowUp,
  Lightbulb,
  Loader2,
  Bot,
  CheckCircle2,
  XCircle,
  Star,
  Plus,
  ChevronDown,
  Book,
  Target,
  Clock,
  Lock,
  Zap,
  BarChart3,
  RefreshCw,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { examsAPI, submissionsAPI, evaluationsAPI } from '../services/api';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXT  = '.pdf,.jpg,.jpeg,.png,.webp';
const MAX_MB = 50;

function fmtSize(b) {
  if (!b) return '';
  return b < 1024 * 1024 ? (b / 1024).toFixed(1) + ' KB' : (b / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ─── Upload Zone ─── */
function UploadZone({ file, onFile, onRemove }) {
  const [drag, setDrag] = useState(false);
  const [dragCount, setDragCount] = useState(0);
  const inputRef = useRef(null);

  const validate = (f) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      alert('Only PDF, JPG, PNG or WEBP files accepted.');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      alert(`File must be under ${MAX_MB} MB.`);
      return;
    }
    onFile(f);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragCount(c => c + 1);
    setDrag(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragCount(c => {
      const next = c - 1;
      if (next <= 0) setDrag(false);
      return next;
    });
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    setDragCount(0);
    validate(e.dataTransfer.files[0]);
  };

  /* ─── File selected state ─── */
  if (file) {
    const isPdf = file.type === 'application/pdf';
    const ext = file.name.split('.').pop().toUpperCase();
    const typeColor = isPdf ? { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
                            : { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
    return (
      <div style={{
        border: '2px solid #6366f1', borderRadius: 16,
        background: 'linear-gradient(135deg,#f5f3ff,#eef2ff)',
        overflow: 'hidden',
      }}>
        {/* Top bar */}
        <div style={{
          background: 'linear-gradient(90deg,#4f46e5,#6366f1)',
          padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600, letterSpacing: '0.04em' }}>
            FILE READY FOR AI ANALYSIS
          </span>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* File icon */}
          <div style={{
            width: 56, height: 64, borderRadius: 10, flexShrink: 0,
            background: typeColor.bg, border: `1.5px solid ${typeColor.border}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '2px',
          }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>{isPdf ? <FileText size={24} color={typeColor.color} /> : <ImageIcon size={24} color={typeColor.color} />}</span>
            <span style={{
              fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.04em',
              color: typeColor.color, background: typeColor.bg,
              border: `1px solid ${typeColor.border}`, borderRadius: 4,
              padding: '1px 4px',
            }}>{ext}</span>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0, fontWeight: 700, color: '#1e1b4b', fontSize: '0.9rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {file.name}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              {fmtSize(file.size)}
            </p>
            {/* Progress bar */}
            <div style={{ marginTop: 8, height: 4, background: '#e0e7ff', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: '100%', borderRadius: 4,
                background: 'linear-gradient(90deg,#6366f1,#818cf8)',
              }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
            <button type="button" onClick={() => inputRef.current?.click()} style={{
              background: '#fff', border: '1.5px solid #6366f1', borderRadius: 8,
              padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer',
              color: '#6366f1', fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              Replace
            </button>
            <button type="button" onClick={onRemove} style={{
              background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 8,
              padding: '5px 10px', cursor: 'pointer', color: '#dc2626',
              fontSize: '0.78rem', fontWeight: 600,
            }}>
              Remove
            </button>
          </div>
        </div>
        <input ref={inputRef} type="file" accept={ACCEPTED_EXT}
          style={{ display: 'none' }} onChange={e => validate(e.target.files[0])} />
      </div>
    );
  }

  /* ─── Empty / drag state ─── */
  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragOver={e => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2.5px dashed ${drag ? '#6366f1' : '#c7d2fe'}`,
        borderRadius: 18,
        background: drag
          ? 'linear-gradient(135deg,#eef2ff 0%,#f0f9ff 100%)'
          : 'linear-gradient(135deg,#fafafe 0%,#f3f4f6 100%)',
        cursor: 'pointer',
        transition: 'all 0.22s ease',
        transform: drag ? 'scale(1.015)' : 'scale(1)',
        boxShadow: drag ? '0 8px 32px rgba(99,102,241,0.18)' : 'none',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* animated glow ring on drag */}
      {drag && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 16,
          background: 'rgba(99,102,241,0.04)',
          animation: 'pulseGlow 1.2s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', position: 'relative' }}>
        {/* Central icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.25rem',
          background: drag
            ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
            : 'linear-gradient(135deg,#e0e7ff,#ddd6fe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem',
          boxShadow: drag ? '0 8px 24px rgba(79,70,229,0.4)' : '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.22s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {drag ? <FolderOpen size={32} color="#fff" /> : <ArrowUp size={32} color="#4f46e5" />}
          </div>
        </div>

        <p style={{
          fontWeight: 800, fontSize: '1.05rem', margin: '0 0 0.4rem',
          color: drag ? '#4f46e5' : '#1e293b',
          transition: 'color 0.22s',
        }}>
          {drag ? 'Drop to upload your script' : 'Click or drag & drop your answer script'}
        </p>
        <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 1.5rem' }}>
          {drag ? 'Release now to select this file' : 'PDF, JPG, PNG or WEBP · Up to 50 MB'}
        </p>

        {/* Accepted file type chips */}
        {!drag && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {[
              { ext: 'PDF', color: '#dc2626', bg: '#fef2f2' },
              { ext: 'JPG', color: '#2563eb', bg: '#eff6ff' },
              { ext: 'PNG', color: '#16a34a', bg: '#f0fdf4' },
              { ext: 'WEBP', color: '#9333ea', bg: '#faf5ff' },
            ].map(t => (
              <span key={t.ext} style={{
                background: t.bg, color: t.color,
                border: `1px solid ${t.color}30`,
                borderRadius: 6, padding: '2px 10px',
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
              }}>
                {t.ext}
              </span>
            ))}
          </div>
        )}

        {/* Tip */}
        {!drag && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: '#fefce8', border: '1px solid #fde047',
            borderRadius: 8, padding: '0.45rem 1rem',
            fontSize: '0.78rem', color: '#854d0e',
          }}>
            <Lightbulb size={16} />
            Keep PDF under 3 MB for best results · Compress at ilovepdf.com if larger
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPTED_EXT}
        style={{ display: 'none' }} onChange={e => validate(e.target.files[0])} />
      <style>{`
        @keyframes pulseGlow {
          0%,100% { opacity: 0.3; }
          50%      { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

/* ─── Status Card ─── */
function StatusCard({ status, evalId, submissionId, onViewReport }) {
  const map = {
    pending:    { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', icon: <Loader2 size={32} className="animate-spin" />, text: 'Queued for evaluation…', sub: 'Your script is in the queue.' },
    processing: { color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc', icon: <Bot size={32} />, text: 'AI is analysing your script…', sub: 'This usually takes 30–60 seconds.' },
    evaluated:  { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: <CheckCircle2 size={32} />, text: 'Evaluation complete!', sub: 'Your detailed report is ready.' },
    failed:     { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: <XCircle size={32} />, text: 'Evaluation failed.', sub: 'Please try submitting again.' },
  };
  const s = map[status] || map.pending;

  return (
    <div style={{
      border: `2px solid ${s.border}`, borderRadius: 16,
      background: s.bg, padding: '2rem', textAlign: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: s.color }}>{s.icon}</div>
      <p style={{ fontWeight: 800, color: s.color, margin: '0 0 0.3rem', fontSize: '1.1rem' }}>{s.text}</p>
      <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>{s.sub}</p>

      {/* Animated dots for processing/pending */}
      {(status === 'processing' || status === 'pending') && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '1.25rem' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%', background: s.color,
              animation: `bounce 1.4s ${i * 0.18}s ease-in-out infinite`,
            }} />
          ))}
        </div>
      )}

      {status === 'evaluated' && evalId && (
        <button onClick={onViewReport} style={{
          marginTop: '1.25rem', background: `linear-gradient(135deg,#16a34a,#22c55e)`,
          color: '#fff', border: 'none', borderRadius: 12,
          padding: '0.75rem 2.5rem', fontWeight: 700,
          fontSize: '0.95rem', cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
        }}>
          View Full Report <ArrowRight size={18} />
        </button>
      )}

      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function AdminAIFeedback() {
  const navigate = useNavigate();
  const [papers,       setPapers]       = useState([]);
  const [papersError,  setPapersError]  = useState('');
  const [paperId,      setPaperId]      = useState('');
  const [paperDetail,  setPaperDetail]  = useState(null);
  const [file,         setFile]         = useState(null);
  const [notes,        setNotes]        = useState('');
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');
  const [submissionId, setSubmissionId] = useState(null);
  const [evalStatus,   setEvalStatus]   = useState(null);
  const [evalId,       setEvalId]       = useState(null);
  const [totalEvals,   setTotalEvals]   = useState(0);
  const pollRef = useRef(null);

  /* load papers + eval count */
  useEffect(() => {
    async function load() {
      try {
        const [pr, er] = await Promise.all([
          examsAPI.getPapers(),
          evaluationsAPI.list(),
        ]);
        const paperList = pr.data?.results ?? pr.data ?? [];
        setPapers(Array.isArray(paperList) ? paperList : []);
        const evalList = er.data?.results ?? er.data ?? [];
        setTotalEvals(Array.isArray(evalList) ? evalList.length : 0);
      } catch (e) {
        setPapersError('Could not load papers. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* sync paper detail */
  useEffect(() => {
    if (paperId) setPaperDetail(papers.find(p => String(p.id) === String(paperId)) || null);
    else setPaperDetail(null);
  }, [paperId, papers]);

  /* polling */
  const startPolling = useCallback((subId) => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await submissionsAPI.get(subId);
        const st = data.status;
        setEvalStatus(st);
        if (st === 'evaluated') {
          clearInterval(pollRef.current);
          try {
            const { data: ev } = await submissionsAPI.getEvaluation(subId);
            setEvalId(ev.id);
          } catch {}
        } else if (st === 'failed') {
          clearInterval(pollRef.current);
        }
      } catch {
        clearInterval(pollRef.current);
      }
    }, 3000);
  }, []);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const handleSubmit = async () => {
    setError('');
    if (!paperId) { setError('Please select an exam paper.'); return; }
    if (!file)    { setError('Please upload an answer script.'); return; }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('exam_paper', paperId);
      fd.append('answer_script_file', file);
      if (notes.trim()) fd.append('notes', notes);
      const { data } = await submissionsAPI.create(fd);
      setSubmissionId(data.id);
      setEvalStatus('pending');
      setTotalEvals(t => t + 1);
      startPolling(data.id);
    } catch (err) {
      const d = err.response?.data;
      let msg = 'Submission failed. Please try again.';
      if (d?.detail) msg = d.detail;
      else if (d && typeof d === 'object') {
        const k = Object.keys(d)[0];
        if (k) msg = `${k}: ${Array.isArray(d[k]) ? d[k][0] : d[k]}`;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    clearInterval(pollRef.current);
    setFile(null); setPaperId(''); setNotes('');
    setSubmissionId(null); setEvalStatus(null); setEvalId(null); setError('');
  };

  if (loading) return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div className="spinner" />
    </div>
  );

  const canSubmit = paperId && file && !submitting;

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bot size={28} color="#4f46e5" /> AI Feedback Tool
          </h1>
          <p className="subtitle">Upload any answer script for instant AI evaluation — admin only</p>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* ── Plan banner ── */}
        <div style={{
          background: 'linear-gradient(135deg,#312e81 0%,#4f46e5 60%,#6d28d9 100%)',
          borderRadius: 16, padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1.5rem',
          boxShadow: '0 6px 24px rgba(79,70,229,0.35)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Star size={20} color="#fff" /></div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.7rem', opacity: 0.7,
                letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff' }}>Admin Plan</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{totalEvals}</span> total evaluations run
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80',
              boxShadow: '0 0 8px #4ade80' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
              Unlimited Access
            </span>
          </div>
        </div>

        {/* ── Main card ── */}
        <div style={{
          background: '#fff', borderRadius: 20,
          boxShadow: '0 4px 28px rgba(0,0,0,0.09)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
              Submit Your Answer Script
            </h2>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Select the exam paper, upload the scanned script and get instant AI feedback
            </p>
          </div>

          <div style={{ padding: '1.75rem' }}>
            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                padding: '0.75rem 1rem', marginBottom: '1.25rem',
                color: '#991b1b', fontSize: '0.875rem',
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              }}>
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            {evalStatus ? (
              /* ── Status view after submit ── */
              <div>
                <StatusCard
                  status={evalStatus}
                  evalId={evalId}
                  submissionId={submissionId}
                  onViewReport={() => navigate(`/report/${submissionId}`)}
                />
                {(evalStatus === 'evaluated' || evalStatus === 'failed') && (
                  <button onClick={reset} style={{
                    display: 'block', width: '100%', marginTop: '0.75rem',
                    background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12,
                    padding: '0.8rem', cursor: 'pointer', fontWeight: 600,
                    color: '#475569', fontSize: '0.9rem', transition: 'background 0.15s',
                  }}
                    onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
                  >
                    {evalStatus === 'failed' ? <><RefreshCw size={18} /> Try Again</> : <><Plus size={18} /> Analyse Another Script</>}
                  </button>
                )}
                {evalStatus === 'failed' && (
                  <p style={{
                    textAlign: 'center', fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.5rem',
                  }}>
                    Check that your backend is running and the exam paper has questions added.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* ── Step 1: Select Paper ── */}
                <StepLabel n={1} label="Select Exam Paper" />

                {papersError ? (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                    padding: '1rem', marginBottom: '0.5rem', color: '#991b1b', fontSize: '0.85rem',
                  }}>
                    {papersError}
                  </div>
                ) : papers.length === 0 ? (
                  <div style={{
                    background: '#f8fafc', border: '1.5px dashed #cbd5e1',
                    borderRadius: 12, padding: '1.25rem', textAlign: 'center',
                    marginBottom: '0.5rem',
                  }}>
                    <p style={{ margin: '0 0 0.6rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
                      No exam papers created yet
                    </p>
                    <p style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                      Create a question paper first, then come back here.
                    </p>
                    <Link to="/admin/papers/new" style={{
                      background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
                      color: '#fff', textDecoration: 'none', borderRadius: 8,
                      padding: '0.55rem 1.25rem', fontSize: '0.82rem', fontWeight: 600,
                      display: 'inline-block',
                    }}>
                      <Plus size={16} /> Create Question Paper
                    </Link>
                  </div>
                ) : (
                  <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    <select
                      value={paperId}
                      onChange={e => setPaperId(e.target.value)}
                      style={{
                        width: '100%', padding: '0.8rem 2.5rem 0.8rem 1rem',
                        border: `2px solid ${paperId ? '#6366f1' : '#e2e8f0'}`,
                        borderRadius: 12, fontSize: '0.9rem', appearance: 'none',
                        background: '#fff', cursor: 'pointer', outline: 'none',
                        color: paperId ? '#0f172a' : '#94a3b8',
                        transition: 'border-color 0.2s',
                        fontFamily: 'inherit',
                      }}
                    >
                      <option value="">— Choose an exam paper —</option>
                      {papers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title || `Paper #${p.id}`}
                          {p.subject_name ? ` · ${p.subject_name}` : ''}
                        </option>
                      ))}
                    </select>
                    <span style={{
                      position: 'absolute', right: '1rem', top: '50%',
                      transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8',
                      display: 'flex', alignItems: 'center'
                    }}><ChevronDown size={18} /></span>
                  </div>
                )}

                {/* Paper info chips */}
                {paperDetail && (
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {[
                      paperDetail.subject_name && { icon: <Book size={14} />, val: paperDetail.subject_name },
                      paperDetail.total_marks  && { icon: <Target size={14} />, val: `${paperDetail.total_marks} marks` },
                      paperDetail.duration_minutes && { icon: <Clock size={14} />, val: `${paperDetail.duration_minutes} min` },
                      paperDetail.attempt_type && { icon: <FileText size={14} />, val: paperDetail.attempt_type },
                    ].filter(Boolean).map((c, i) => (
                      <span key={i} style={{
                        background: '#eef2ff', color: '#4338ca',
                        borderRadius: 8, padding: '4px 10px',
                        fontSize: '0.76rem', fontWeight: 600,
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>{c.icon} {c.val}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ borderTop: '1px solid #f1f5f9', margin: '1.25rem 0' }} />

                {/* ── Step 2: Upload ── */}
                <StepLabel n={2} label="Upload Your Answer Script" />
                <div style={{ marginBottom: '1.5rem' }}>
                  <UploadZone file={file} onFile={setFile} onRemove={() => setFile(null)} />
                </div>

                {/* ── Notes ── */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    fontWeight: 600, fontSize: '0.85rem', color: '#475569',
                    display: 'block', marginBottom: '0.5rem',
                  }}>
                    Notes{' '}
                    <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Any notes about this submission…"
                    style={{
                      width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
                      padding: '0.65rem 0.85rem', fontSize: '0.875rem', resize: 'vertical',
                      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {/* ── Submit ── */}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  style={{
                    width: '100%', padding: '1rem',
                    background: canSubmit
                      ? 'linear-gradient(135deg,#4f46e5 0%,#6366f1 100%)'
                      : '#e2e8f0',
                    color: canSubmit ? '#fff' : '#94a3b8',
                    border: 'none', borderRadius: 14,
                    fontWeight: 700, fontSize: '1rem',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    boxShadow: canSubmit ? '0 4px 18px rgba(99,102,241,0.4)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {submitting ? (
                    <>
                      <div style={{
                        width: 18, height: 18,
                        border: '2.5px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff', borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                      Submitting…
                      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </>
                  ) : (
                    <><Target size={18} /> Get AI Feedback</>
                  )}
                </button>

                {!canSubmit && !submitting && (
                  <p style={{
                    textAlign: 'center', color: '#cbd5e1',
                    fontSize: '0.78rem', marginTop: '0.5rem',
                  }}>
                    {!paperId ? 'Select a paper above to continue'
                              : !file ? 'Upload your script to continue' : ''}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Info footer ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.75rem', marginTop: '1.25rem',
        }}>
          {[
            { icon: <Lock size={24} color="#64748b" />, title: 'Admin Only', desc: 'Restricted to admin users' },
            { icon: <Zap size={24} color="#f59e0b" />, title: 'Instant AI', desc: 'Results in under 60 seconds' },
            { icon: <BarChart3 size={24} color="#4f46e5" />, title: 'Full Report', desc: 'Step-wise marks + feedback' },
          ].map(c => (
            <div key={c.title} style={{
              background: '#fff', borderRadius: 12, padding: '1rem',
              textAlign: 'center', border: '1px solid #f1f5f9',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.35rem' }}>{c.icon}</div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>{c.title}</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Step label helper ─── */
function StepLabel({ n, label }) {
  return (
    <p style={{
      margin: '0 0 0.85rem', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a',
      display: 'flex', alignItems: 'center', gap: '0.5rem',
    }}>
      <span style={{
        width: 26, height: 26, borderRadius: '50%',
        background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
        color: '#fff', display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0,
      }}>{n}</span>
      {label}
    </p>
  );
}
