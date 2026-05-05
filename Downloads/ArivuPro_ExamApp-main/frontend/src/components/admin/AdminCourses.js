import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, RefreshCw, GraduationCap, ChevronRight, Search } from 'lucide-react';
import { examsAPI } from '../../services/api';

const TYPE_COLORS = {
  mock:       { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  practice:   { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  past_paper: { bg: '#fff7ed', color: '#d97706', border: '#fde68a' },
  rtp:        { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
  mtp:        { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
};
const TYPE_LABELS = {
  mock: 'Mock', practice: 'Practice', past_paper: 'Past Paper', rtp: 'RTP', mtp: 'MTP',
};

function CourseCard({ courseName, papers, onClick }) {
  const subjects = [...new Set(papers.map(p => p.subject_name).filter(Boolean))];
  const typeCounts = papers.reduce((acc, p) => {
    acc[p.attempt_type] = (acc[p.attempt_type] || 0) + 1;
    return acc;
  }, {});
  const avgMarks = papers.length
    ? Math.round(papers.reduce((s, p) => s + (p.total_marks || 0), 0) / papers.length)
    : 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16,
        padding: '1.375rem 1.5rem', cursor: 'pointer', transition: 'all 0.18s',
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#6366f1';
        e.currentTarget.style.boxShadow = '0 0 0 3px #eef2ff';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <GraduationCap size={22} color="#fff" />
        </div>
        <span style={{
          background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
          borderRadius: 20, padding: '2px 10px', fontSize: '0.68rem', fontWeight: 700,
        }}>Active</span>
      </div>

      <div>
        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', margin: '0 0 4px' }}>
          {courseName}
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
          {papers.length} paper{papers.length !== 1 ? 's' : ''}
          {subjects.length > 0 && ` · ${subjects.slice(0, 2).join(', ')}${subjects.length > 2 ? '…' : ''}`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {Object.entries(typeCounts).map(([type, count]) => {
          const c = TYPE_COLORS[type] || TYPE_COLORS.mock;
          return (
            <span key={type} style={{
              background: c.bg, color: c.color, border: `1px solid ${c.border}`,
              borderRadius: 20, padding: '2px 9px', fontSize: '0.68rem', fontWeight: 600,
            }}>
              {TYPE_LABELS[type] || type} ({count})
            </span>
          );
        })}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem',
        paddingTop: '0.625rem', borderTop: '1px solid #f1f5f9',
      }}>
        {[
          { label: 'Papers',    value: papers.length, color: '#6366f1' },
          { label: 'Avg Marks', value: avgMarks,       color: '#16a34a' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '0.5rem', borderRadius: 10,
        background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff',
        fontWeight: 700, fontSize: '0.8rem',
      }}>
        View Papers <ChevronRight size={14} />
      </div>
    </div>
  );
}

export default function AdminCourses() {
  const navigate = useNavigate();
  const [papers,  setPapers]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const fetchPapers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await examsAPI.getPapers();
      setPapers(Array.isArray(data) ? data : data?.results || []);
    } catch (e) {
      console.error('Failed to load papers:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPapers(); }, [fetchPapers]);

  // Group only papers that have a course_name
  const courseGroups = papers.reduce((acc, p) => {
    const name = (p.course_name || '').trim();
    if (!name) return acc;
    if (!acc[name]) acc[name] = [];
    acc[name].push(p);
    return acc;
  }, {});

  const courseNames = Object.keys(courseGroups)
    .filter(n => n.toLowerCase().includes(search.toLowerCase()))
    .sort();

  const withCourse    = papers.filter(p => (p.course_name || '').trim()).length;
  const withoutCourse = papers.filter(p => !(p.course_name || '').trim()).length;

  return (
    <div className="page">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)',
        borderRadius: 20, padding: '1.75rem 2rem', marginBottom: '1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '0 0 4px' }}>
            Course Management
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', margin: 0 }}>
            Courses appear here automatically when you set a Course Name on a Question Paper.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {[
            { label: 'Courses',  value: Object.keys(courseGroups).length, color: '#a5b4fc' },
            { label: 'Tagged',   value: withCourse,                       color: '#86efac' },
            { label: 'Untagged', value: withoutCourse,                    color: '#fde68a' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 10, padding: '0.5rem 1rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search + Refresh */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '0.625rem',
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.5rem 0.875rem',
        }}>
          <Search size={15} color="#94a3b8" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses..."
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.875rem', fontFamily: 'inherit' }}
          />
        </div>
        <button onClick={fetchPapers} style={{
          padding: '0.5rem 0.875rem', border: '1px solid #e2e8f0', background: '#fff',
          borderRadius: 10, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: '0.8rem',
        }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Untagged papers tip */}
      {!loading && withoutCourse > 0 && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10,
          padding: '0.75rem 1rem', marginBottom: '1.25rem',
          fontSize: '0.8rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <BookOpen size={14} />
          <span>
            <strong>{withoutCourse}</strong> paper{withoutCourse !== 1 ? 's' : ''} have no Course Name.
            {' '}Go to <strong>Question Papers → Edit</strong> and set a Course Name to group them here.
          </span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
      ) : courseNames.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
          padding: '3rem', textAlign: 'center', color: '#94a3b8',
        }}>
          <GraduationCap size={44} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6, color: '#475569' }}>
            {search ? `No courses matching "${search}"` : 'No courses yet'}
          </p>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {search ? 'Try a different search term.' : 'Add a Course Name to a Question Paper to see it here.'}
          </p>
          {!search && (
            <button
              onClick={() => navigate('/admin/papers/new')}
              style={{
                padding: '0.625rem 1.5rem', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <FileText size={15} /> Create a Paper
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
          {courseNames.map(name => (
            <CourseCard
              key={name}
              courseName={name}
              papers={courseGroups[name]}
              onClick={() => navigate(`/admin/papers?course=${encodeURIComponent(name)}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
