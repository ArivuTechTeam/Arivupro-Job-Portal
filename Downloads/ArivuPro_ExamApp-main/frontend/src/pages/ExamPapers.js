import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Target,
  FileText,
  ScrollText,
  RefreshCw,
  Library,
  Book,
  Calendar,
  Clock,
  Eye,
  Download,
  ClipboardList,
  Upload,
  Search,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { examsAPI, submissionsAPI } from '../services/api';

const MEDIA_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace('/api', '');

const TYPE_META = {
  mock:       { label: 'Mock Test',    icon: <Target size={14} />,     color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  practice:   { label: 'Practice',     icon: <FileText size={14} />,   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  past_paper: { label: 'Past Paper',   icon: <ScrollText size={14} />, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  rtp:        { label: 'RTP',          icon: <RefreshCw size={14} />,  color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  mtp:        { label: 'MTP (ICAI)',   icon: <Library size={14} />,    color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
};

const ALL_TYPES = [
  { value: '',           label: 'All Types', icon: <Book size={14} /> },
  ...Object.entries(TYPE_META).map(([k, v]) => ({ value: k, label: v.label, icon: v.icon })),
];

function pdfSrc(raw) {
  if (!raw) return null;
  return raw.startsWith('http') ? raw : `${MEDIA_BASE}${raw}`;
}

// Fetch-based download — handles cross-origin PDFs that ignore the `download` attribute
async function triggerDownload(url, filename) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network error');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'exam-paper.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch {
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
}

// ─── Paper Card ───────────────────────────────────────────────────────────────
function PaperCard({ paper, onAttempt }) {
  const [downloading, setDownloading] = useState(false);
  const tm   = TYPE_META[paper.attempt_type] || TYPE_META.mock;
  const qPdf = pdfSrc(paper.question_paper_file);
  const aPdf = pdfSrc(paper.suggested_answer_file);
  const subj = paper.subject_name || paper.subject_code ||
               (typeof paper.subject === 'object' ? paper.subject?.name : paper.subject) || '';

  const handleDownload = async () => {
    if (!qPdf || downloading) return;
    setDownloading(true);
    const safeName = (paper.title || 'exam-paper')
      .replace(/[^a-z0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    await triggerDownload(qPdf, `${safeName}.pdf`);
    setDownloading(false);
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Coloured top strip */}
      <div style={{ height: 6, background: `linear-gradient(90deg,${tm.color},${tm.color}66)` }} />

      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

        {/* Row 1: Type pill + Subject badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: tm.bg, color: tm.color, border: `1px solid ${tm.border}`,
            borderRadius: 20, padding: '4px 12px',
            fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>{tm.icon}</span> {tm.label}
          </span>
          {subj && (
            <span style={{
              background: '#D7F4EA', color: '#2E8857', border: '1px solid #7AE582',
              borderRadius: 20, padding: '3px 10px',
              fontSize: '0.68rem', fontWeight: 700,
            }}>
              {subj}
            </span>
          )}
        </div>

        {/* Row 2: Title */}
        <div>
          <h3 style={{
            fontWeight: 800, fontSize: '1rem', color: '#0f172a',
            margin: '0 0 0.3rem', lineHeight: 1.45,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {paper.title || 'Exam Paper'}
          </h3>
          {paper.exam_session && (
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={12} /> {paper.exam_session}
            </span>
          )}
        </div>

        {/* Row 3: Stats chips */}
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          {[
            { icon: <FileText size={14} />, label: 'Marks',    value: paper.total_marks },
            { icon: <Clock size={14} />,    label: 'Duration', value: paper.duration_minutes ? `${paper.duration_minutes} min` : paper.duration ? `${paper.duration} min` : null },
          ].filter(c => c.value).map(c => (
            <div key={c.label} style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: '#f8fafc', border: '1px solid #f1f5f9',
              borderRadius: 8, padding: '4px 10px',
              fontSize: '0.75rem', color: '#475569',
            }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>{c.icon}</span>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{c.value}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Row 4: PDF action buttons */}
        {qPdf ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* View */}
            <a href={qPdf} target="_blank" rel="noopener noreferrer" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              padding: '0.5rem', borderRadius: 10,
              background: 'rgba(53,120,181,0.08)', color: '#3578b5', border: '1px solid rgba(53,120,181,0.25)',
              fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#3578b5'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(53,120,181,0.08)'; e.currentTarget.style.color = '#3578b5'; }}
            >
              <Eye size={14} /> View
            </a>
            {/* Download */}
            <button onClick={handleDownload} disabled={downloading} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              padding: '0.5rem', borderRadius: 10, cursor: downloading ? 'not-allowed' : 'pointer',
              background: downloading ? '#f1f5f9' : '#D7F4EA',
              color: downloading ? '#94a3b8' : '#2E8857',
              border: `1px solid ${downloading ? '#e2e8f0' : '#7AE582'}`,
              fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (!downloading) { e.currentTarget.style.background = '#2E8857'; e.currentTarget.style.color = '#fff'; }}}
              onMouseLeave={e => { if (!downloading) { e.currentTarget.style.background = '#D7F4EA'; e.currentTarget.style.color = '#2E8857'; }}}
            >
              {downloading
                ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Downloading…</>
                : <><Download size={14} /> Download</>
              }
            </button>
            {/* Suggested Answers */}
            {aPdf && (
              <a href={aPdf} target="_blank" rel="noopener noreferrer" title="Suggested Answers" style={{
                padding: '0.5rem 0.75rem', borderRadius: 10,
                background: 'rgba(254,222,109,0.15)', color: '#c49a00', border: '1px solid rgba(254,222,109,0.5)',
                fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#c49a00'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(254,222,109,0.15)'; e.currentTarget.style.color = '#c49a00'; }}
              >
                <ClipboardList size={16} />
              </a>
            )}
          </div>
        ) : (
          <div style={{
            padding: '0.5rem', borderRadius: 10, textAlign: 'center',
            background: '#f8fafc', border: '1px dashed #e2e8f0',
            fontSize: '0.72rem', color: '#cbd5e1', fontStyle: 'italic',
          }}>
            No PDF uploaded yet
          </div>
        )}

        {/* Row 5: Attempt CTA */}
        <button onClick={() => onAttempt(paper)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          padding: '0.7rem', borderRadius: 12, marginTop: 'auto',
          background: 'linear-gradient(135deg,#2E8857,#245a41)',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontWeight: 800, fontSize: '0.85rem',
          boxShadow: '0 4px 14px rgba(46,136,87,0.4)',
          transition: 'all 0.2s', width: '100%',
        }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(46,136,87,0.55)'; e.currentTarget.style.transform = 'scale(1.01)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(46,136,87,0.4)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Upload size={18} /> Attempt This Paper
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ExamPapers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [papers,   setPapers]   = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search,   setSearch]   = useState('');
  const [filters,  setFilters]  = useState({ subject: '', attempt_type: '' });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // Upload Answer Sheet modal state
  const [attemptModal,   setAttemptModal]   = useState(null);
  const [uploadFile,     setUploadFile]     = useState(null);
  const [studentName,    setStudentName]    = useState('');
  const [dragOver,       setDragOver]       = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [submitError,    setSubmitError]    = useState('');
  const [submitSuccess,  setSubmitSuccess]  = useState(false);
  const fileInputRef = useRef(null);

  const openAttemptModal = (paper) => {
    setAttemptModal(paper);
    setUploadFile(null);
    setStudentName('');
    setSubmitError('');
    setSubmitSuccess(false);
  };

  const closeAttemptModal = () => {
    if (submitting) return;
    setAttemptModal(null);
  };

  const handleAttemptFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { setSubmitError('Only PDF files are accepted.'); return; }
    if (f.size > 25 * 1024 * 1024)  { setSubmitError('File must be under 25 MB.'); return; }
    setUploadFile(f);
    setSubmitError('');
  };

  const handleAttemptSubmit = async () => {
    if (!uploadFile) { setSubmitError('Please upload your answer sheet.'); return; }
    try {
      setSubmitting(true);
      setSubmitError('');
      const fd = new FormData();
      fd.append('exam_paper', attemptModal.id);
      fd.append('answer_script_file', uploadFile);
      if (studentName.trim()) fd.append('notes', `Student: ${studentName.trim()}`);
      const { data } = await submissionsAPI.create(fd);
      setSubmitSuccess(true);
      setTimeout(() => navigate(`/report/${data.id}`), 1500);
    } catch (err) {
      const d = err.response?.data;
      let msg = 'Submission failed. Please try again.';
      if (d?.detail) msg = d.detail;
      else if (d && typeof d === 'object') {
        const k = Object.keys(d)[0];
        if (k) msg = `${k}: ${Array.isArray(d[k]) ? d[k][0] : d[k]}`;
      }
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    examsAPI.getSubjects().then(({ data }) => setSubjects(data.results || data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);
        const params = {};
        if (filters.subject)      params.subject      = filters.subject;
        if (filters.attempt_type) params.attempt_type = filters.attempt_type;
        const { data } = await examsAPI.getPapers(params);
        setPapers(data.results || data || []);
      } catch { setError('Failed to load exam papers. Please try again.'); }
      finally { setLoading(false); }
    })();
  }, [filters]);

  const filtered = papers.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.title || '').toLowerCase().includes(q) ||
           (p.subject_name || '').toLowerCase().includes(q) ||
           (p.exam_session || '').toLowerCase().includes(q);
  });

  const hasFilter = search || filters.subject || filters.attempt_type;

  // Type counts for pills
  const typeCounts = {};
  papers.forEach(p => { typeCounts[p.attempt_type] = (typeCounts[p.attempt_type] || 0) + 1; });

  return (
    <div className="page">

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,#0a1f14 0%,#1a3d2a 50%,#2E8857 100%)',
        borderRadius: 20, padding: '1.75rem 2rem', marginBottom: '1.5rem',
        boxShadow: '0 12px 40px rgba(46,136,87,0.3)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-60, right:-40, width:200, height:200,
          borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ position:'absolute', bottom:-40, left:60, width:120, height:120,
          borderRadius:'50%', background:'rgba(255,255,255,0.03)' }} />

        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.625rem' }}>
            <span style={{
              background:'rgba(255,255,255,0.12)', color:'#9FFFCB',
              border:'1px solid rgba(255,255,255,0.2)',
              borderRadius:20, padding:'3px 14px',
              fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.05em',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}><Book size={12} /> Exam Papers</span>
            <span style={{
              background:'rgba(46,136,87,0.3)', color:'#9FFFCB',
              border:'1px solid rgba(46,136,87,0.4)',
              borderRadius:20, padding:'3px 12px',
              fontSize:'0.7rem', fontWeight:700,
            }}>
              {papers.length} Available
            </span>
          </div>
          <h1 style={{ color:'#fff', fontSize:'1.9rem', fontWeight:900,
            margin:'0 0 0.375rem', lineHeight:1.15 }}>
            Available Exam Papers
          </h1>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.875rem', margin:'0 0 1.25rem' }}>
            Select, download, and attempt from our comprehensive exam paper collection
          </p>

          {/* Search bar in hero */}
          <div style={{ position:'relative', maxWidth:480 }}>
            <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
              display: 'flex', alignItems: 'center', opacity: 0.6 }}><Search size={18} color="#fff" /></span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search papers, subjects or sessions…"
              style={{
                width:'100%', padding:'0.75rem 1rem 0.75rem 2.75rem',
                borderRadius:12, border:'1px solid rgba(255,255,255,0.2)',
                background:'rgba(255,255,255,0.12)', backdropFilter:'blur(4px)',
                color:'#fff', fontSize:'0.875rem', outline:'none',
                transition:'all 0.2s',
              }}
              onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.18)'; e.target.style.borderColor = 'rgba(255,255,255,0.4)'; }}
              onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                background:'rgba(255,255,255,0.2)', border:'none', borderRadius:6,
                color:'#fff', cursor:'pointer', width:22, height:22, fontSize:'0.7rem',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}><X size={14} /></button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background:'#fee2e2', color:'#991b1b', padding:'0.875rem 1.25rem',
          borderRadius:12, marginBottom:'1.25rem', border:'1px solid #fecaca',
          borderLeft:'4px solid #dc2626', fontSize:'0.875rem',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <AlertTriangle size={18} /> {error}
          <button onClick={() => setError(null)} style={{ background:'none', border:'none',
            cursor:'pointer', color:'#991b1b', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
        </div>
      )}

      {/* ══ FILTER ROW ═══════════════════════════════════════════════════════ */}
      <div style={{
        background:'#fff', borderRadius:14, border:'1px solid #e2e8f0',
        padding:'0.875rem 1.25rem', marginBottom:'1.25rem',
        boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
      }}>
        {/* Row 1: Subject + count */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem' }}>
          <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b',
            textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0 }}>Subject</span>
          <select value={filters.subject}
            onChange={e => setFilters(p => ({ ...p, subject: e.target.value }))}
            style={{
              flex:1, maxWidth:320, padding:'0.45rem 0.75rem',
              border:'1.5px solid #e2e8f0', borderRadius:9,
              fontSize:'0.82rem', background:'#fafafa',
              color:'#1e293b', cursor:'pointer', outline:'none',
            }}
            onFocus={e => e.target.style.borderColor = '#2E8857'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name || s}</option>)}
          </select>

          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'0.625rem' }}>
            {hasFilter && (
              <button onClick={() => { setSearch(''); setFilters({ subject:'', attempt_type:'' }); }}
                style={{
                  padding:'4px 12px', borderRadius:20, border:'1px solid #fecaca',
                  background:'#fef2f2', color:'#dc2626', fontWeight:700,
                  fontSize:'0.72rem', cursor:'pointer',
                  display:'flex', alignItems:'center', gap:4,
                }}>
                <X size={12} /> Clear
              </button>
            )}
            <span style={{ fontSize:'0.72rem', color:'#94a3b8', whiteSpace:'nowrap' }}>
              {filtered.length} paper{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Row 2: Type pills — full width, no overflow */}
        <div style={{ display:'flex', gap:'0.4rem', flexWrap:'nowrap', overflowX:'auto',
          scrollbarWidth:'none', paddingBottom:2 }}>
          {ALL_TYPES.map(t => {
            const active = filters.attempt_type === t.value;
            const count  = t.value ? (typeCounts[t.value] || 0) : papers.length;
            const meta   = t.value ? TYPE_META[t.value] : null;
            return (
              <button key={t.value}
                onClick={() => setFilters(p => ({ ...p, attempt_type: t.value }))}
                style={{
                  display:'flex', alignItems:'center', gap:'0.3rem', flexShrink:0,
                  padding:'6px 14px', borderRadius:20,
                  border: active ? 'none' : '1.5px solid #e2e8f0',
                  cursor:'pointer',
                  background: active ? (meta ? meta.color : '#2E8857') : '#fff',
                  color: active ? '#fff' : '#64748b',
                  fontWeight: active ? 700 : 500, fontSize:'0.78rem',
                  transition:'all 0.15s',
                  boxShadow: active ? `0 3px 10px ${meta ? meta.color : '#2E8857'}40` : 'none',
                }}>
                <span style={{ display:'flex', alignItems:'center' }}>{t.icon}</span>
                {t.label}
                {count > 0 && (
                  <span style={{
                    background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: active ? '#fff' : '#94a3b8',
                    borderRadius:999, padding:'1px 7px', fontSize:'0.68rem', fontWeight:700,
                    marginLeft:2,
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════════════ */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'5rem 0', gap:'1rem' }}>
          <div className="spinner" />
          <p style={{ color:'#94a3b8', fontSize:'0.875rem' }}>Loading papers…</p>
        </div>
      ) : filtered.length > 0 ? (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1.25rem' }}>
            {filtered.map(p => <PaperCard key={p.id} paper={p} onAttempt={openAttemptModal} />)}
          </div>
          <div style={{ marginTop:'1.5rem', textAlign:'center', fontSize:'0.78rem', color:'#94a3b8' }}>
            Showing <strong style={{ color:'#475569' }}>{filtered.length}</strong> of{' '}
            <strong style={{ color:'#475569' }}>{papers.length}</strong> papers
          </div>
        </>
      ) : (
        <div style={{
          background:'#fff', borderRadius:20, border:'1px solid #e2e8f0',
          padding:'4rem 2rem', textAlign:'center',
          boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom:'1rem', opacity:0.3 }}><ClipboardList size={64} /></div>
          <h3 style={{ fontWeight:800, color:'#1e293b', marginBottom:'0.5rem', fontSize:'1.2rem' }}>
            No Papers Found
          </h3>
          <p style={{ color:'#94a3b8', fontSize:'0.875rem', marginBottom:'1.5rem', maxWidth:360, margin:'0 auto 1.5rem' }}>
            {hasFilter
              ? 'No papers match your current filters. Try adjusting your search or filters.'
              : 'No exam papers have been published yet. Check back soon!'}
          </p>
          {hasFilter && (
            <button onClick={() => { setSearch(''); setFilters({ subject:'', attempt_type:'' }); }}
              style={{
                padding:'0.625rem 1.75rem', borderRadius:12, border:'none',
                background:'linear-gradient(135deg,#2E8857,#245a41)',
                color:'#fff', fontWeight:700, fontSize:'0.875rem', cursor:'pointer',
                boxShadow:'0 4px 14px rgba(46,136,87,0.4)',
              }}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* ══ UPLOAD ANSWER SHEET MODAL ════════════════════════════════════════ */}
      {attemptModal && (
        <div
          onClick={closeAttemptModal}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20,
              width: '100%', maxWidth: 540,
              boxShadow: '0 24px 72px rgba(0,0,0,0.2)',
              overflow: 'hidden', animation: 'modalIn 0.2s ease',
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg,#0a1f14,#1a3d2a,#2E8857)',
              padding: '1.25rem 1.5rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.15rem', margin: 0 }}>
                  Upload Answer Sheet
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', margin: '0.25rem 0 0',
                  maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {attemptModal.title}
                </p>
              </div>
              <button
                onClick={closeAttemptModal}
                disabled={submitting}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                  width: 32, height: 32, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', color: '#fff',
                  flexShrink: 0, marginLeft: '0.75rem',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Instructions */}
              <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderLeft: '4px solid #3578b5', borderRadius: 12,
                padding: '1rem 1.125rem', marginBottom: '1.25rem',
              }}>
                <p style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.82rem', margin: '0 0 0.625rem',
                  display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ClipboardList size={15} /> Instructions
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {[
                    'Write your name at the top of every answer sheet',
                    'Number your questions clearly (e.g., Q1, Q2a)',
                    'Ensure handwriting is legible for accurate AI analysis',
                    'Upload as a single PDF file — maximum 25 MB',
                    'Answer questions in the same order as the paper',
                  ].map((instr, i) => (
                    <li key={i} style={{ color: '#1e40af', fontSize: '0.8rem', lineHeight: 1.6 }}>{instr}</li>
                  ))}
                </ul>
              </div>

              {/* Success state */}
              {submitSuccess ? (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: 12, padding: '2rem', textAlign: 'center',
                }}>
                  <CheckCircle2 size={48} color="#16a34a" style={{ marginBottom: '0.75rem' }} />
                  <p style={{ fontWeight: 800, color: '#166534', fontSize: '1rem', margin: '0 0 0.3rem' }}>
                    Submitted Successfully!
                  </p>
                  <p style={{ color: '#15803d', fontSize: '0.82rem', margin: 0 }}>
                    Redirecting to your evaluation report…
                  </p>
                </div>
              ) : (
                <>
                  {/* Upload zone */}
                  <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem',
                    margin: '0 0 0.625rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} /> Answer Sheet (PDF)
                  </p>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => {
                      e.preventDefault(); setDragOver(false);
                      handleAttemptFile(e.dataTransfer.files[0]);
                    }}
                    style={{
                      border: `2.5px dashed ${dragOver ? '#2E8857' : uploadFile ? '#2E8857' : '#d1d5db'}`,
                      borderRadius: 14,
                      background: dragOver ? '#f0fdf4' : uploadFile ? '#f0fdf4' : '#fafafa',
                      padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
                      transition: 'all 0.2s', marginBottom: '1rem',
                    }}
                  >
                    <input
                      ref={fileInputRef} type="file" accept=".pdf"
                      style={{ display: 'none' }}
                      onChange={e => { handleAttemptFile(e.target.files[0]); e.target.value = ''; }}
                    />
                    {uploadFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: '#D7F4EA', border: '1px solid #7AE582',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FileText size={20} color="#2E8857" />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontWeight: 700, color: '#166534', margin: 0, fontSize: '0.875rem' }}>
                            {uploadFile.name}
                          </p>
                          <p style={{ color: '#16a34a', fontSize: '0.75rem', margin: 0 }}>
                            {(uploadFile.size / (1024 * 1024)).toFixed(1)} MB · Ready to upload
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setUploadFile(null); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer',
                            color: '#94a3b8', marginLeft: 'auto' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={32} color={dragOver ? '#2E8857' : '#94a3b8'}
                          style={{ marginBottom: '0.5rem' }} />
                        <p style={{ fontWeight: 700, color: dragOver ? '#2E8857' : '#374151',
                          margin: '0 0 0.25rem', fontSize: '0.9rem' }}>
                          {dragOver ? 'Drop your PDF here' : 'Click or drag & drop your PDF'}
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>
                          PDF only · Maximum 25 MB
                        </p>
                      </>
                    )}
                  </div>

                  {/* Student name (optional) */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569',
                      fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                      Student Name{' '}
                      <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      placeholder="Enter your full name…"
                      style={{
                        width: '100%', padding: '0.65rem 0.875rem',
                        border: '1.5px solid #e2e8f0', borderRadius: 10,
                        fontSize: '0.875rem', outline: 'none',
                        fontFamily: 'inherit', boxSizing: 'border-box',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => e.target.style.borderColor = '#2E8857'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>

                  {/* Error */}
                  {submitError && (
                    <div style={{
                      background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                      padding: '0.625rem 0.875rem', marginBottom: '1rem',
                      color: '#991b1b', fontSize: '0.8rem',
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                      <AlertTriangle size={16} /> {submitError}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleAttemptSubmit}
                    disabled={submitting}
                    style={{
                      width: '100%', padding: '0.875rem',
                      background: submitting
                        ? '#e2e8f0'
                        : 'linear-gradient(135deg,#2E8857,#245a41)',
                      color: submitting ? '#94a3b8' : '#fff',
                      border: 'none', borderRadius: 12, cursor: submitting ? 'not-allowed' : 'pointer',
                      fontWeight: 800, fontSize: '0.95rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      boxShadow: submitting ? 'none' : '0 4px 14px rgba(46,136,87,0.4)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {submitting ? (
                      <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting…</>
                    ) : (
                      <><Upload size={18} /> Evaluate Answer Sheet</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
          <style>{`
            @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(-10px); } to { opacity:1; transform:scale(1) translateY(0); } }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default ExamPapers;
