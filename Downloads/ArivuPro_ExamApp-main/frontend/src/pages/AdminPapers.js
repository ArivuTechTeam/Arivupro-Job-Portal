import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Edit, 
  Lock, 
  Globe, 
  Trash2, 
  FileText, 
  Clock, 
  Inbox, 
  File, 
  ClipboardList, 
  Trophy, 
  TrendingDown, 
  X, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  LayoutGrid,
  List
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { examsAPI } from '../services/api';

const MEDIA_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace('/api', '');

const TYPE_META = {
  mock:       { label: 'Mock',      color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  practice:   { label: 'Practice',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  past_paper: { label: 'Past Paper',color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  rtp:        { label: 'RTP',       color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  mtp:        { label: 'MTP',       color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
};

function pdfUrl(raw) {
  if (!raw) return null;
  return raw.startsWith('http') ? raw : `${MEDIA_BASE}${raw}`;
}

// ─── Paper Card ───────────────────────────────────────────────────────────────
function PaperCard({ paper, onTogglePublish, onDelete, onStats, publishing, deleting }) {
  const tm      = TYPE_META[paper.attempt_type] || TYPE_META.mock;
  const qPdf    = pdfUrl(paper.question_paper_file);
  const aPdf    = pdfUrl(paper.suggested_answer_file);
  const [menu, setMenu] = useState(false);

  return (
    <div style={{
      background: '#fff', borderRadius: 18,
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.2s, transform 0.2s',
      overflow: 'hidden', position: 'relative',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.11)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Coloured top strip */}
      <div style={{ height: 4, background: `linear-gradient(90deg,${tm.color},${tm.color}88)` }} />

      <div style={{ padding: '1.125rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

        {/* Row 1: type + status + menu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            background: tm.bg, color: tm.color, border: `1px solid ${tm.border}`,
            borderRadius: 20, padding: '3px 12px',
            fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{tm.label}</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              background: paper.is_published ? '#dcfce7' : '#f1f5f9',
              color: paper.is_published ? '#16a34a' : '#94a3b8',
              border: `1px solid ${paper.is_published ? '#bbf7d0' : '#e2e8f0'}`,
              borderRadius: 20, padding: '2px 10px',
              fontSize: '0.65rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%',
                background: paper.is_published ? '#16a34a' : '#cbd5e1',
                display: 'inline-block' }} />
              {paper.is_published ? 'Published' : 'Draft'}
            </span>

            {/* 3-dot menu */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenu(m => !m)} style={{
                width: 28, height: 28, borderRadius: 8,
                background: menu ? '#f1f5f9' : 'transparent',
                border: '1px solid transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', color: '#64748b',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseLeave={e => { if (!menu) e.currentTarget.style.background = 'transparent'; }}
              >⋮</button>
              {menu && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 50, minWidth: 150, overflow: 'hidden',
                }}
                  onMouseLeave={() => setMenu(false)}
                >
                  {[
                    { icon: <BarChart3 size={14} />, label: 'View Stats',  action: () => { onStats(paper.id); setMenu(false); }, color: '#4f46e5' },
                    { icon: <Edit size={14} />, label: 'Edit Paper',   href: `/admin/papers/${paper.id}`, color: '#0891b2' },
                    {
                      icon: paper.is_published ? <Lock size={14} /> : <Globe size={14} />,
                      label: paper.is_published ? 'Unpublish' : 'Publish',
                      action: () => { onTogglePublish(paper.id, paper.is_published); setMenu(false); },
                      color: paper.is_published ? '#d97706' : '#16a34a',
                    },
                    { icon: <Trash2 size={14} />, label: 'Delete', action: () => { onDelete(paper.id, paper.title); setMenu(false); }, color: '#dc2626', danger: true },
                  ].map(item => (
                    item.href ? (
                      <Link key={item.label} to={item.href} style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        padding: '0.6rem 0.875rem', textDecoration: 'none',
                        fontSize: '0.82rem', fontWeight: 600, color: '#1e293b',
                        transition: 'background 0.1s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>{item.icon}</span> {item.label}
                      </Link>
                    ) : (
                      <button key={item.label} onClick={item.action} style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        padding: '0.6rem 0.875rem', width: '100%',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        fontSize: '0.82rem', fontWeight: 600,
                        color: item.danger ? '#dc2626' : '#1e293b',
                        transition: 'background 0.1s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = item.danger ? '#fef2f2' : '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>{item.icon}</span> {item.label}
                      </button>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Title + Subject */}
        <div>
          <h3 style={{
            fontWeight: 800, fontSize: '0.95rem', color: '#0f172a',
            margin: '0 0 0.25rem', lineHeight: 1.45,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {paper.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{
              background: '#eef2ff', color: '#4f46e5', borderRadius: 6,
              padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700,
            }}>
              {paper.subject_name || paper.subject_code || '—'}
            </span>
            {paper.exam_session && (
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                {paper.exam_session}
              </span>
            )}
          </div>
        </div>

        {/* Row 3: Stats chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { icon: <FileText size={14} />, label: `${paper.total_marks}m` },
            { icon: <Clock size={14} />, label: `${paper.duration_minutes}min` },
            { icon: <Inbox size={14} />, label: `${paper.submission_count || 0} submissions` },
          ].map(c => (
            <div key={c.label} style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              background: '#f8fafc', border: '1px solid #f1f5f9',
              borderRadius: 8, padding: '3px 10px',
              fontSize: '0.72rem', color: '#64748b', fontWeight: 600,
            }}>
              <span style={{ fontSize: '0.8rem' }}>{c.icon}</span> {c.label}
            </div>
          ))}
        </div>

        {/* Row 4: PDF links */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {qPdf ? (
            <a href={qPdf} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '4px 12px', borderRadius: 8,
              background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
              fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none',
            }}>
              <File size={14} /> Question PDF
            </a>
          ) : (
            <span style={{
              padding: '4px 10px', borderRadius: 8,
              background: '#f8fafc', color: '#cbd5e1',
              border: '1px dashed #e2e8f0',
              fontSize: '0.68rem', fontStyle: 'italic',
            }}>No PDF uploaded</span>
          )}
          {aPdf && (
            <a href={aPdf} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '4px 12px', borderRadius: 8,
              background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
              fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none',
            }}>
              <ClipboardList size={14} /> Answers PDF
            </a>
          )}
        </div>

        {/* Row 5: Action buttons */}
        <div style={{
          display: 'flex', gap: '0.5rem', paddingTop: '0.625rem',
          borderTop: '1px solid #f8fafc', marginTop: 'auto',
        }}>
          <button
            onClick={() => onTogglePublish(paper.id, paper.is_published)}
            disabled={publishing === paper.id}
            style={{
              flex: 1, padding: '0.5rem', borderRadius: 10, border: 'none',
              background: paper.is_published
                ? 'linear-gradient(135deg,#64748b,#475569)'
                : 'linear-gradient(135deg,#16a34a,#22c55e)',
              color: '#fff', fontWeight: 700, fontSize: '0.75rem',
              cursor: publishing === paper.id ? 'not-allowed' : 'pointer',
              opacity: publishing === paper.id ? 0.7 : 1,
              transition: 'all 0.15s',
            }}
          >
            {publishing === paper.id ? '⏳…'
              : paper.is_published ? <><Lock size={14} /> Unpublish</> : <><Globe size={14} /> Publish</>}
          </button>
          <Link to={`/admin/papers/${paper.id}`} style={{
            flex: 1, padding: '0.5rem', borderRadius: 10,
            border: '1px solid #e2e8f0', background: '#f8fafc',
            color: '#475569', fontWeight: 700, fontSize: '0.75rem',
            textDecoration: 'none', textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Edit size={14} /> Edit
          </Link>
          <button
            onClick={() => onDelete(paper.id, paper.title)}
            disabled={deleting === paper.id}
            style={{
              padding: '0.5rem 0.75rem', borderRadius: 10,
              border: '1px solid #fecaca', background: '#fef2f2',
              color: '#dc2626', fontWeight: 700, fontSize: '0.75rem',
              cursor: deleting === paper.id ? 'not-allowed' : 'pointer',
              opacity: deleting === paper.id ? 0.7 : 1,
            }}
          >
            {deleting === paper.id ? '…' : <Trash2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Modal ──────────────────────────────────────────────────────────────
function StatsModal({ modal, paper, onClose }) {
  if (!modal.open) return null;
  const d = modal.data;
  const avgPct = d?.avg_score ? Math.round(d.avg_score) : 0;
  const col = avgPct >= 60 ? '#16a34a' : avgPct >= 40 ? '#d97706' : '#dc2626';
  const r = 30, circ = 2 * Math.PI * r;
  const dash = (avgPct / 100) * circ;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460,
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)',
          padding: '1.5rem 1.75rem', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position:'absolute', top:-40, right:-30, width:120, height:120,
            borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem',
                textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
                Paper Statistics
              </p>
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0,
                maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {paper?.title || 'Paper'}
              </h2>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', cursor: 'pointer', fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><X size={16} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.75rem' }}>
          {!d ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div className="spinner" />
            </div>
          ) : (
            <>
              {/* Avg score ring */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem',
                background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)',
                border: '1px solid #e2e8f0', borderRadius: 14,
                padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={40} cy={40} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8} />
                    <circle cx={40} cy={40} r={r} fill="none" stroke={col} strokeWidth={8}
                      strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontWeight: 900, fontSize: '1.1rem', color: col, lineHeight: 1 }}>
                      {avgPct}%
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                    Class Average Score
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                    Across {d.total_submissions || 0} submissions
                  </div>
                </div>
              </div>

              {/* 4 stat cells */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { icon: <Inbox size={20} />, label: 'Total Submissions', value: d.total_submissions ?? '—', color: '#4f46e5', bg: '#eef2ff' },
                  { icon: <BarChart3 size={20} />, label: 'Average Score',     value: d.avg_score ? `${d.avg_score.toFixed(1)}%` : 'N/A', color: col, bg: col + '12' },
                  { icon: <Trophy size={20} />, label: 'Highest Score',     value: d.highest_score ?? 'N/A', color: '#16a34a', bg: '#f0fdf4' },
                  { icon: <TrendingDown size={20} />, label: 'Lowest Score',      value: d.lowest_score  ?? 'N/A', color: '#dc2626', bg: '#fef2f2' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: s.bg, borderRadius: 12, padding: '1rem',
                    border: `1px solid ${s.color}20`,
                  }}>
                    <div style={{ fontSize: '1.1rem', marginBottom: '0.375rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 3, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ target, onConfirm, onCancel, loading }) {
  if (!target) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(4px)',
    }} onClick={onCancel}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 400,
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', padding: '2rem',
        textAlign: 'center',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 1rem',
          background: 'linear-gradient(135deg,#fee2e2,#fecaca)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}><Trash2 size={24} color="#dc2626" /></div>
        <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Delete Paper?</h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          You're about to delete <strong style={{ color: '#1e293b' }}>"{target.title}"</strong>.
          This will also delete all related questions and evaluations.
          <br /><span style={{ color: '#dc2626', fontWeight: 600 }}>This cannot be undone.</span>
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '0.65rem', borderRadius: 10,
            border: '1px solid #e2e8f0', background: '#f8fafc',
            color: '#64748b', fontWeight: 700, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{
            flex: 1, padding: '0.65rem', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
            color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(220,38,38,0.35)',
          }}>
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPapers() {
  const [searchParams] = useSearchParams();
  const courseFilter   = searchParams.get('course') || '';  // from Course Management click

  const [papers,      setPapers]      = useState([]);
  const [subjects,    setSubjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [filters,     setFilters]     = useState({ subject: '', attempt_type: '', is_published: '' });
  const [publishingId,setPublishing]  = useState(null);
  const [deletingId,  setDeleting]    = useState(null);
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [statsModal,  setStatsModal]  = useState({ open: false, paperId: null, data: null });
  const [viewMode,    setViewMode]    = useState('grid'); // 'grid' | 'list'

  const fetchPapers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.subject)       params.subject       = filters.subject;
      if (filters.attempt_type)  params.attempt_type  = filters.attempt_type;
      if (filters.is_published !== '') params.is_published = filters.is_published;
      const { data } = await examsAPI.getPapers(params);
      setPapers(Array.isArray(data) ? data : data?.results || []);
      setError(null);
    } catch (e) {
      setError('Failed to load papers.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchPapers(); }, [fetchPapers]);

  useEffect(() => {
    examsAPI.getSubjects().then(r => {
      const d = r.data;
      setSubjects(Array.isArray(d) ? d : d?.results || []);
    }).catch(() => {});
  }, []);

  const handleTogglePublish = async (id, current) => {
    try {
      setPublishing(id);
      await examsAPI.updatePaper(id, { is_published: !current });
      await fetchPapers();
    } catch { setError('Failed to update paper.'); }
    finally { setPublishing(null); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(deleteTarget.id);
      await examsAPI.deletePaper(deleteTarget.id);
      setDeleteTarget(null);
      await fetchPapers();
    } catch { setError('Failed to delete paper.'); }
    finally { setDeleting(null); }
  };

  const openStats = async (id) => {
    setStatsModal({ open: true, paperId: id, data: null });
    try {
      const r = await examsAPI.getPaperStats(id);
      setStatsModal(s => ({ ...s, data: r.data || r }));
    } catch { setStatsModal(s => ({ ...s, data: {} })); }
  };

  // Filter by search + optional course (from URL param when clicking Course Management card)
  const filtered = papers.filter(p => {
    if (courseFilter && (p.course_name || '').trim() !== courseFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.subject_name || '').toLowerCase().includes(q) ||
      (p.exam_session || '').toLowerCase().includes(q)
    );
  });

  const published = papers.filter(p => p.is_published).length;
  const drafts    = papers.length - published;
  const withPdf   = papers.filter(p => p.question_paper_file).length;

  return (
    <div className="page">

      {/* Course filter banner */}
      {courseFilter && (
        <div style={{
          background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12,
          padding: '0.75rem 1.25rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: 600 }}>
            📚 Showing papers for course: <strong>{courseFilter}</strong> ({filtered.length} paper{filtered.length !== 1 ? 's' : ''})
          </span>
          <a href="/admin/papers" style={{
            fontSize: '0.78rem', color: '#0284c7', fontWeight: 600, textDecoration: 'none',
            padding: '3px 10px', background: '#e0f2fe', borderRadius: 6, border: '1px solid #bae6fd',
          }}>✕ Clear Filter</a>
        </div>
      )}

      {/* ══ HERO HEADER ══════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%)',
        borderRadius: 20, padding: '1.75rem 2rem', marginBottom: '1.5rem',
        boxShadow: '0 12px 40px rgba(15,23,42,0.3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-50, right:-30, width:180, height:180,
          borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.7rem',
            textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 4px' }}>
            Manage
          </p>
          <h1 style={{ color:'#fff', fontSize:'1.8rem', fontWeight:900,
            margin:'0 0 0.875rem', lineHeight:1.15 }}>
            Question Papers
          </h1>
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
            {[
              { label:'Total',      value: papers.length, color:'#c7d2fe', bg:'rgba(99,102,241,0.2)' },
              { label:'Published',  value: published,     color:'#86efac', bg:'rgba(34,197,94,0.2)'  },
              { label:'Drafts',     value: drafts,        color:'#fcd34d', bg:'rgba(245,158,11,0.2)' },
              { label:'With PDF',   value: withPdf,       color:'#a5f3fc', bg:'rgba(6,182,212,0.2)'  },
            ].map(s => (
              <div key={s.label} style={{
                background: s.bg, borderRadius: 10, padding: '4px 14px',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <span style={{ fontWeight:900, fontSize:'1rem', color:s.color }}>{s.value}</span>
                <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.55)',
                  textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <Link to="/admin/papers/new" style={{
          padding:'0.65rem 1.5rem', borderRadius:12,
          background:'linear-gradient(135deg,#22c55e,#16a34a)',
          color:'#fff', fontWeight:800, fontSize:'0.875rem',
          textDecoration:'none',
          boxShadow:'0 4px 14px rgba(34,197,94,0.45)',
          display:'flex', alignItems:'center', gap:'0.5rem',
          position:'relative', flexShrink:0,
        }}>
          <Plus size={18} /> Create New Paper
        </Link>
      </div>

      {error && (
        <div style={{ background:'#fee2e2', color:'#991b1b', padding:'0.875rem 1.25rem',
          borderRadius:12, marginBottom:'1.25rem', border:'1px solid #fecaca',
          borderLeft:'4px solid #dc2626', fontSize:'0.875rem' }}>
          <AlertTriangle size={18} /> {error}
          <button onClick={() => setError(null)} style={{ float:'right', background:'none',
            border:'none', cursor:'pointer', color:'#991b1b', fontWeight:700 }}><X size={18} /></button>
        </div>
      )}

      {/* ══ FILTER & SEARCH BAR ══════════════════════════════════════════════ */}
      <div style={{
        background:'#fff', borderRadius:16, border:'1px solid #e2e8f0',
        boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
        padding:'1rem 1.25rem', marginBottom:'1.25rem',
        display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center',
      }}>
        {/* Search */}
        <div style={{ flex:2, minWidth:220, position:'relative' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
            display: 'flex', alignItems: 'center' }}><Search size={16} color="#94a3b8" /></span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, subject or session…"
            style={{
              width:'100%', padding:'0.55rem 0.75rem 0.55rem 2.25rem',
              border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:'0.83rem',
              outline:'none', background:'#fafafa', color:'#1e293b',
              transition:'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* Selects */}
        {[
          { label:'Subject', key:'subject', options:[['','All Subjects'],...subjects.map(s => [s.id, s.name || s])] },
          { label:'Type', key:'attempt_type', options:[['','All Types'],['mock','Mock'],['practice','Practice'],['past_paper','Past Paper'],['rtp','RTP'],['mtp','MTP']] },
          { label:'Status', key:'is_published', options:[['','All'],['true','Published'],['false','Draft']] },
        ].map(f => (
          <select key={f.key} value={filters[f.key]}
            onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))}
            style={{
              padding:'0.55rem 0.875rem', border:'1.5px solid #e2e8f0',
              borderRadius:10, fontSize:'0.82rem', background:'#fafafa',
              color:'#374151', cursor:'pointer', outline:'none', minWidth:130,
              transition:'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          >
            {f.options.map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </select>
        ))}

        {/* Clear */}
        {(search || filters.subject || filters.attempt_type || filters.is_published) && (
          <button onClick={() => { setSearch(''); setFilters({ subject:'', attempt_type:'', is_published:'' }); }}
            style={{
              padding:'0.55rem 1rem', borderRadius:10,
              border:'1px solid #fecaca', background:'#fef2f2',
              color:'#dc2626', fontWeight:700, fontSize:'0.78rem', cursor:'pointer',
            }}>
            <X size={16} /> Clear
          </button>
        )}

        {/* View toggle */}
        <div style={{ display:'flex', background:'#f1f5f9', borderRadius:10,
          padding:'3px', gap:'2px', marginLeft:'auto' }}>
          {[['grid',<LayoutGrid size={16} />],['list',<List size={16} />]].map(([mode, icon]) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              width:32, height:32, borderRadius:8, border:'none', cursor:'pointer',
              background: viewMode === mode ? '#fff' : 'transparent',
              color: viewMode === mode ? '#4f46e5' : '#94a3b8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition:'all 0.15s',
            }}>{icon}</button>
          ))}
        </div>

        <span style={{ fontSize:'0.72rem', color:'#94a3b8', whiteSpace:'nowrap' }}>
          {filtered.length} paper{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════════════ */}
      {loading && papers.length === 0 ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'5rem' }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:18, border:'1px solid #e2e8f0',
          padding:'4rem', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'0.75rem', opacity:0.3 }}><File size={48} /></div>
          <h3 style={{ color:'#1e293b', marginBottom:'0.5rem' }}>No papers found</h3>
          <p style={{ color:'#94a3b8', fontSize:'0.875rem', marginBottom:'1.5rem' }}>
            {search || filters.subject || filters.attempt_type || filters.is_published
              ? 'Try adjusting your filters or search.'
              : 'Create your first question paper to get started.'}
          </p>
          <Link to="/admin/papers/new" style={{
            display:'inline-flex', alignItems:'center', gap:'0.5rem',
            padding:'0.625rem 1.5rem', borderRadius:10,
            background:'linear-gradient(135deg,#4f46e5,#6366f1)',
            color:'#fff', textDecoration:'none', fontWeight:700, fontSize:'0.875rem',
            boxShadow:'0 4px 14px rgba(99,102,241,0.4)',
          }}>＋ Create Paper</Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1.25rem' }}>
          {filtered.map(p => (
            <PaperCard key={p.id} paper={p}
              onTogglePublish={handleTogglePublish}
              onDelete={(id, title) => setDeleteTarget({ id, title })}
              onStats={openStats}
              publishing={publishingId}
              deleting={deletingId}
            />
          ))}
        </div>
      ) : (
        /* List view */
        <div style={{ background:'#fff', borderRadius:18, border:'1px solid #e2e8f0',
          overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Title','Subject','Type','Marks','Duration','PDF','Status','Submissions','Actions'].map(h => (
                  <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left',
                    fontSize:'0.68rem', color:'#64748b', fontWeight:700,
                    textTransform:'uppercase', letterSpacing:'0.06em',
                    borderBottom:'1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const tm   = TYPE_META[p.attempt_type] || TYPE_META.mock;
                const qPdf = pdfUrl(p.question_paper_file);
                const aPdf = pdfUrl(p.suggested_answer_file);
                return (
                  <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding:'0.75rem 1rem', fontWeight:700, color:'#0f172a',
                      maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {p.title}
                    </td>
                    <td style={{ padding:'0.75rem 1rem', color:'#475569' }}>
                      {p.subject_name || p.subject_code || '—'}
                    </td>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      <span style={{ background:tm.bg, color:tm.color, border:`1px solid ${tm.border}`,
                        borderRadius:20, padding:'2px 10px', fontSize:'0.68rem', fontWeight:700 }}>
                        {tm.label}
                      </span>
                    </td>
                    <td style={{ padding:'0.75rem 1rem', color:'#475569' }}>{p.total_marks}</td>
                    <td style={{ padding:'0.75rem 1rem', color:'#475569' }}>{p.duration_minutes}m</td>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      {qPdf ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                          <a href={qPdf} target="_blank" rel="noopener noreferrer" style={{
                            padding:'2px 8px', borderRadius:6,
                            background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe',
                            fontSize:'0.68rem', fontWeight:700, textDecoration:'none', whiteSpace:'nowrap',
                            display: 'flex', alignItems: 'center', gap: 2
                          }}><File size={12} /> Q</a>
                          {aPdf && <a href={aPdf} target="_blank" rel="noopener noreferrer" style={{
                            padding:'2px 8px', borderRadius:6,
                            background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0',
                            fontSize:'0.68rem', fontWeight:700, textDecoration:'none', whiteSpace:'nowrap',
                            display: 'flex', alignItems: 'center', gap: 2
                          }}><ClipboardList size={12} /> A</a>}
                        </div>
                      ) : <span style={{ color:'#cbd5e1', fontSize:'0.72rem' }}>—</span>}
                    </td>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      <span style={{
                        background: p.is_published ? '#dcfce7' : '#f1f5f9',
                        color: p.is_published ? '#16a34a' : '#94a3b8',
                        borderRadius:20, padding:'2px 10px', fontSize:'0.68rem', fontWeight:700,
                      }}>
                        {p.is_published ? <><Circle size={8} fill="#16a34a" /> Published</> : <><Circle size={8} /> Draft</>}
                      </span>
                    </td>
                    <td style={{ padding:'0.75rem 1rem', color:'#475569' }}>{p.submission_count || 0}</td>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      <div style={{ display:'flex', gap:'0.375rem' }}>
                        <button onClick={() => handleTogglePublish(p.id, p.is_published)}
                          disabled={publishingId === p.id} style={{
                            padding:'4px 10px', borderRadius:7, border:'none', cursor:'pointer',
                            background: p.is_published ? '#f1f5f9' : '#f0fdf4',
                            color: p.is_published ? '#64748b' : '#16a34a',
                            fontWeight:700, fontSize:'0.7rem',
                          }}>
                          {publishingId === p.id ? '…' : p.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button onClick={() => openStats(p.id)} style={{
                          padding:'4px 10px', borderRadius:7, border:'none', cursor:'pointer',
                          background:'#eef2ff', color:'#4f46e5', fontWeight:700, fontSize:'0.7rem',
                        }}>Stats</button>
                        <Link to={`/admin/papers/${p.id}`} style={{
                          padding:'4px 10px', borderRadius:7,
                          background:'#f8fafc', border:'1px solid #e2e8f0',
                          color:'#475569', fontWeight:700, fontSize:'0.7rem', textDecoration:'none',
                        }}>Edit</Link>
                        <button onClick={() => setDeleteTarget({ id: p.id, title: p.title })} style={{
                          padding:'4px 10px', borderRadius:7, border:'1px solid #fecaca',
                          background:'#fef2f2', color:'#dc2626', fontWeight:700,
                          fontSize:'0.7rem', cursor:'pointer',
                        }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ MODALS ════════════════════════════════════════════════════════════ */}
      <StatsModal
        modal={statsModal}
        paper={papers.find(p => p.id === statsModal.paperId)}
        onClose={() => setStatsModal({ open:false, paperId:null, data:null })}
      />
      <DeleteModal
        target={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={!!deletingId}
      />
    </div>
  );
}
