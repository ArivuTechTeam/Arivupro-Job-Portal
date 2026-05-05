import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2, AlertTriangle, Upload, X, FileText,
  Image as ImageIcon, UploadCloud, FolderOpen, Clock,
  BookOpen, ChevronRight, PartyPopper, Search,
} from 'lucide-react';
import { examsAPI, submissionsAPI } from '../services/api';

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_MB    = 25;

function fmtSize(b) {
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}

const TYPE_META = {
  mock:       { label: 'Mock Test',    bg: '#eff6ff', color: '#2563eb' },
  practice:   { label: 'Practice',     bg: '#f0fdf4', color: '#16a34a' },
  past_paper: { label: 'Past Paper',   bg: '#fff7ed', color: '#d97706' },
  rtp:        { label: 'RTP',          bg: '#fdf4ff', color: '#9333ea' },
  mtp:        { label: 'MTP (ICAI)',   bg: '#ecfdf5', color: '#059669' },
};

// ── Step Bar ────────────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ['Select Paper', 'Upload Script', 'Submit'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
      {steps.map((label, i) => {
        const n    = i + 1;
        const done = n < step;
        const cur  = n === step;
        return (
          <React.Fragment key={n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.88rem',
                background: done ? '#2E8857' : cur ? 'linear-gradient(135deg,#2E8857,#16a34a)' : '#e5e7eb',
                color: done || cur ? '#fff' : '#9ca3af',
                boxShadow: cur ? '0 4px 12px rgba(46,136,87,0.35)' : 'none',
                transition: 'all 0.3s',
              }}>
                {done ? <CheckCircle2 size={18} /> : n}
              </div>
              <span style={{
                marginTop: 6, fontSize: '0.7rem', fontWeight: cur ? 700 : 400,
                color: cur ? '#2E8857' : done ? '#16a34a' : '#9ca3af',
                whiteSpace: 'nowrap',
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 3, margin: '0 6px', marginBottom: 20,
                background: done ? '#2E8857' : '#e5e7eb',
                borderRadius: 2, transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Paper Card ────────────────────────────────────────────────────────────────
function PaperCard({ paper, selected, onSelect }) {
  const tm = TYPE_META[paper.attempt_type] || { label: paper.attempt_type || 'Paper', bg: '#f1f5f9', color: '#475569' };
  return (
    <div
      onClick={() => onSelect(paper)}
      style={{
        border: `2px solid ${selected ? '#2E8857' : '#e2e8f0'}`,
        borderRadius: 14, padding: '1rem 1.125rem',
        background: selected ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : '#fff',
        cursor: 'pointer', transition: 'all 0.18s',
        position: 'relative',
        boxShadow: selected ? '0 4px 16px rgba(46,136,87,0.15)' : 'none',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = '#86efac'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = '#e2e8f0'; }}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          width: 22, height: 22, borderRadius: '50%',
          background: '#2E8857', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle2 size={14} color="#fff" />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{
          background: tm.bg, color: tm.color,
          borderRadius: 6, padding: '2px 8px',
          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
        }}>{tm.label}</span>
        {paper.exam_session && (
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{paper.exam_session}</span>
        )}
      </div>
      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', margin: '0 0 3px',
        overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {paper.title}
      </p>
      <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>
        {paper.subject_name || '—'}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.625rem', fontSize: '0.68rem', color: '#94a3b8' }}>
        <span><FileText size={11} style={{ verticalAlign: 'middle' }} /> {paper.total_marks}m</span>
        {paper.duration_minutes && (
          <span><Clock size={11} style={{ verticalAlign: 'middle' }} /> {paper.duration_minutes}min</span>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function UploadAnswer() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef   = useRef(null);

  const [papers,        setPapers]        = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [file,          setFile]          = useState(null);
  const [dragging,      setDragging]      = useState(false);
  const [notes,         setNotes]         = useState('');
  const [search,        setSearch]        = useState('');
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState(false);

  const step = !selectedPaper ? 1 : !file ? 2 : 3;

  /* Load published papers */
  useEffect(() => {
    examsAPI.getPapers({ is_published: true })
      .then(({ data }) => {
        const list = data?.results ?? data ?? [];
        setPapers(list);
        // Pre-select if ?paper= is in URL
        const pid = searchParams.get('paper');
        if (pid) {
          const found = list.find(p => String(p.id) === String(pid));
          if (found) setSelectedPaper(found);
        }
      })
      .catch(() => setError('Failed to load papers. Please refresh.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const validateFile = useCallback((f) => {
    setError('');
    if (!ACCEPTED.includes(f.type)) {
      setError('Only PDF, JPG or PNG files are accepted.');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB} MB.`);
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) validateFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPaper) { setError('Please select an exam paper.'); return; }
    if (!file)           { setError('Please upload your answer script.'); return; }
    try {
      setSubmitting(true); setError('');
      const fd = new FormData();
      fd.append('exam_paper', selectedPaper.id);
      fd.append('answer_script_file', file);
      if (notes.trim()) fd.append('notes', notes);
      const { data } = await submissionsAPI.create(fd);
      setSuccess(true);
      setTimeout(() => navigate(`/report/${data.id}`), 1800);
    } catch (err) {
      const d = err.response?.data;
      let msg = 'Upload failed. Please try again.';
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

  const filtered = papers.filter(p =>
    !search ||
    (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.subject_name || '').toLowerCase().includes(search.toLowerCase())
  );

  /* Loading */
  if (loading) return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
      <div className="spinner" />
    </div>
  );

  /* Success */
  if (success) return (
    <div className="page">
      <div style={{
        maxWidth: 480, margin: '5rem auto', textAlign: 'center',
        background: '#fff', borderRadius: 20, padding: '3rem 2rem',
        boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.25rem',
          background: 'linear-gradient(135deg,#22c55e,#16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(34,197,94,0.35)',
        }}>
          <PartyPopper size={32} color="#fff" />
        </div>
        <h2 style={{ color: '#166534', fontWeight: 900, marginBottom: '0.5rem' }}>
          Submitted Successfully!
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Your answer script is being processed by AI. Redirecting to your evaluation report…
        </p>
        <div style={{
          height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: 'linear-gradient(90deg,#2E8857,#22c55e)',
            borderRadius: 3, animation: 'prog 1.8s linear forwards',
          }} />
        </div>
        <style>{`@keyframes prog { from { width:0 } to { width:100% } }`}</style>
      </div>
    </div>
  );

  return (
    <div className="page">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,#0a1f14 0%,#124D2A 60%,#2E8857 100%)',
        borderRadius: 18, padding: '1.5rem 2rem', marginBottom: '1.75rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
            <span style={{
              background: 'rgba(255,255,255,0.12)', color: '#9FFFCB',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 20, padding: '2px 12px',
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em',
            }}>
              AI Evaluation
            </span>
          </div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '0 0 4px' }}>
            Upload Answer Script
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', margin: 0 }}>
            Select an exam paper, upload your PDF, and get instant AI feedback
          </p>
        </div>
        <Link to="/papers" style={{
          padding: '0.5rem 1.25rem', borderRadius: 10,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <BookOpen size={14} /> Browse Papers
        </Link>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <StepBar step={step} />

        {/* Error */}
        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5',
            borderLeft: '4px solid #dc2626', borderRadius: 10,
            padding: '0.875rem 1.25rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.875rem', color: '#991b1b',
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError('')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#991b1b', padding: 0, display: 'flex', alignItems: 'center',
            }}><X size={16} /></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── STEP 1: Select Paper ──────────────────────────────────────── */}
          <div style={{
            background: '#fff', borderRadius: 16, marginBottom: '1.25rem',
            border: `2px solid ${selectedPaper ? '#2E8857' : step === 1 ? '#86efac' : '#e2e8f0'}`,
            overflow: 'hidden', transition: 'border-color 0.3s',
          }}>
            {/* Header */}
            <div style={{
              padding: '0.875rem 1.25rem',
              background: selectedPaper ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : step === 1 ? '#f8fafc' : '#fafafa',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: selectedPaper ? '#2E8857' : step === 1 ? '#2E8857' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '0.82rem',
                boxShadow: step === 1 && !selectedPaper ? '0 3px 8px rgba(46,136,87,0.3)' : 'none',
              }}>
                {selectedPaper ? <CheckCircle2 size={16} /> : '1'}
              </div>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', flex: 1 }}>
                Select Exam Paper
              </h2>
              {selectedPaper && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: '#2E8857', borderRadius: 20, padding: '3px 12px',
                }}>
                  <CheckCircle2 size={12} color="#fff" />
                  <span style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 700 }}>Selected</span>
                </div>
              )}
            </div>

            <div style={{ padding: '1.25rem' }}>
              {/* Search */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10,
                padding: '0.5rem 0.875rem', marginBottom: '1rem',
              }}>
                <Search size={15} color="#94a3b8" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search papers..."
                  style={{ border: 'none', outline: 'none', background: 'transparent',
                    fontSize: '0.85rem', flex: 1, fontFamily: 'inherit' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} type="button" style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                    padding: 0, display: 'flex', alignItems: 'center',
                  }}><X size={13} /></button>
                )}
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  <FileText size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>
                    {search ? `No papers match "${search}"` : 'No papers available yet'}
                  </p>
                  <p style={{ fontSize: '0.78rem', margin: 0 }}>
                    Ask your admin to publish exam papers.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
                  gap: '0.75rem',
                }}>
                  {filtered.map(p => (
                    <PaperCard
                      key={p.id}
                      paper={p}
                      selected={selectedPaper?.id === p.id}
                      onSelect={setSelectedPaper}
                    />
                  ))}
                </div>
              )}

              {selectedPaper && (
                <div style={{
                  marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.625rem',
                  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                  padding: '0.625rem 1rem',
                }}>
                  <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                    Selected: <strong>{selectedPaper.title}</strong>
                  </span>
                  <button type="button" onClick={() => setSelectedPaper(null)} style={{
                    marginLeft: 'auto', background: 'none', border: 'none',
                    cursor: 'pointer', color: '#94a3b8', padding: 0,
                    display: 'flex', alignItems: 'center',
                  }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── STEP 2: Upload Script ─────────────────────────────────────── */}
          <div style={{
            background: '#fff', borderRadius: 16, marginBottom: '1.25rem',
            border: `2px solid ${file ? '#2E8857' : step === 2 ? '#86efac' : '#e2e8f0'}`,
            overflow: 'hidden', transition: 'border-color 0.3s',
            opacity: step < 2 ? 0.6 : 1,
          }}>
            <div style={{
              padding: '0.875rem 1.25rem',
              background: file ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : step === 2 ? '#f8fafc' : '#fafafa',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: file ? '#2E8857' : step === 2 ? '#2E8857' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '0.82rem',
                boxShadow: step === 2 && !file ? '0 3px 8px rgba(46,136,87,0.3)' : 'none',
              }}>
                {file ? <CheckCircle2 size={16} /> : '2'}
              </div>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', flex: 1 }}>
                Upload Your Answer Script
              </h2>
              {file && (
                <span style={{
                  background: '#2E8857', color: '#fff',
                  borderRadius: 20, padding: '3px 12px',
                  fontSize: '0.68rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <CheckCircle2 size={11} /> File Ready
                </span>
              )}
            </div>

            <div style={{ padding: '1.25rem' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => { if (e.target.files[0]) validateFile(e.target.files[0]); }}
                style={{ display: 'none' }}
              />

              {!file ? (
                <div
                  onClick={() => step >= 2 && fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); if (step >= 2) setDragging(true); }}
                  onDragLeave={e => { e.preventDefault(); setDragging(false); }}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragging ? '#2E8857' : step >= 2 ? '#cbd5e1' : '#e2e8f0'}`,
                    borderRadius: 14, padding: '2.5rem 1.5rem', textAlign: 'center',
                    cursor: step >= 2 ? 'pointer' : 'not-allowed',
                    background: dragging ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : '#f8fafc',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.875rem' }}>
                    {dragging
                      ? <FolderOpen size={44} color="#2E8857" />
                      : <UploadCloud size={44} color={step >= 2 ? '#94a3b8' : '#cbd5e1'} />
                    }
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: dragging ? '#16a34a' : '#374151', marginBottom: '0.3rem' }}>
                    {dragging ? 'Drop to upload' : 'Drag & drop your answer script'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.125rem' }}>
                    or click to browse files
                  </p>
                  <div style={{
                    display: 'inline-flex', gap: '0.5rem', alignItems: 'center',
                  }}>
                    {['PDF', 'JPG', 'PNG'].map(f => (
                      <span key={f} style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: 6, padding: '2px 8px',
                        fontSize: '0.7rem', fontWeight: 600, color: '#475569',
                      }}>{f}</span>
                    ))}
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>· Max {MAX_MB} MB</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                  border: '2px solid #86efac', borderRadius: 14, padding: '1.125rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: file.type === 'application/pdf' ? '#fee2e2' : '#dbeafe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {file.type === 'application/pdf'
                        ? <FileText size={22} color="#dc2626" />
                        : <ImageIcon size={22} color="#2563eb" />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: '#14532d', margin: '0 0 2px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                        {fmtSize(file.size)} · {file.type.split('/')[1].toUpperCase()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                        background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
                        padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer',
                        fontWeight: 600, color: '#374151',
                      }}>Change</button>
                      <button type="button" onClick={() => setFile(null)} style={{
                        background: '#fee2e2', border: 'none', borderRadius: 8,
                        padding: '5px 9px', cursor: 'pointer',
                        color: '#dc2626', display: 'flex', alignItems: 'center',
                      }}><X size={15} /></button>
                    </div>
                  </div>
                  <div style={{
                    marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.75rem', color: '#16a34a', fontWeight: 600,
                  }}>
                    <CheckCircle2 size={14} /> File ready · AI will evaluate this script
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── STEP 3: Notes (optional) + Submit ───────────────────────── */}
          <div style={{
            background: '#fff', borderRadius: 16, marginBottom: '1.5rem',
            border: `2px solid ${step === 3 ? '#86efac' : '#e2e8f0'}`,
            overflow: 'hidden', transition: 'border-color 0.3s',
            opacity: step < 3 ? 0.6 : 1,
          }}>
            <div style={{
              padding: '0.875rem 1.25rem',
              background: step === 3 ? '#f8fafc' : '#fafafa',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: step === 3 ? '#2E8857' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: step === 3 ? '#fff' : '#9ca3af', fontWeight: 800, fontSize: '0.82rem',
                boxShadow: step === 3 ? '0 3px 8px rgba(46,136,87,0.3)' : 'none',
              }}>3</div>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                Notes <span style={{ fontWeight: 400, fontSize: '0.8rem', color: '#94a3b8' }}>(optional)</span>
              </h2>
            </div>

            <div style={{ padding: '1.25rem' }}>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={step < 3}
                placeholder="Any self-assessment notes about this attempt…"
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: '1.5px solid #e2e8f0', borderRadius: 10,
                  padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                  fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                  background: step < 3 ? '#f8fafc' : '#fff',
                }}
              />
            </div>
          </div>

          {/* ── Submit ───────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', gap: '0.875rem', alignItems: 'center',
            background: '#fff', borderRadius: 14, padding: '1.125rem 1.375rem',
            border: '1px solid #e2e8f0', boxShadow: '0 -2px 12px rgba(0,0,0,0.04)',
          }}>
            <button
              type="submit"
              disabled={submitting || !selectedPaper || !file}
              style={{
                flex: 1, maxWidth: 300, padding: '0.825rem 1.5rem', borderRadius: 12,
                border: 'none',
                background: selectedPaper && file
                  ? 'linear-gradient(135deg,#2E8857,#16a34a)'
                  : '#e5e7eb',
                color: selectedPaper && file ? '#fff' : '#9ca3af',
                fontWeight: 700, fontSize: '0.9rem',
                cursor: selectedPaper && file ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: selectedPaper && file ? '0 4px 14px rgba(46,136,87,0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {submitting ? (
                <>
                  <div style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Uploading…
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </>
              ) : (
                <><Upload size={17} /> Submit Answer Script <ChevronRight size={15} /></>
              )}
            </button>

            <Link to="/papers" style={{
              padding: '0.825rem 1.375rem', borderRadius: 12,
              border: '1.5px solid #e2e8f0', color: '#64748b',
              fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
              background: '#f8fafc', whiteSpace: 'nowrap',
            }}>
              Cancel
            </Link>

            {(!selectedPaper || !file) && (
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {!selectedPaper ? '← Select a paper first' : '← Upload your script to continue'}
              </p>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}

export default UploadAnswer;
