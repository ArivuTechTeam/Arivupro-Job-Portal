import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examsAPI } from '../../services/api';

const GraduationIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
  </svg>
);

const CartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const EXAM_TYPE_CONFIG = {
  CA:  { label: 'CA',  color: '#1B6543', bg: '#E6F1EB', border: '#D1E7DD' },
  CS:  { label: 'CS',  color: '#92400E', bg: '#FEF3C7', border: '#FDE68A' },
  CMA: { label: 'CMA', color: '#991B1B', bg: '#FEE2E2', border: '#FECACA' },
};

const ATTEMPT_TYPES = [
  { value: 'mock',      label: 'Mock Test' },
  { value: 'practice', label: 'Practice Paper' },
  { value: 'past_paper',label: 'Past Paper' },
  { value: 'rtp',      label: 'RTP' },
  { value: 'mtp',      label: 'MTP' },
];

export function ExamPapers() {
  const navigate = useNavigate();
  const [papers, setPapers]     = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters]   = useState({ subject: '', attempt_type: '', exam_type: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [accessingId, setAccessingId] = useState(null);

  useEffect(() => {
    examsAPI.getSubjects()
      .then(({ data }) => setSubjects(data.results || data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (filters.subject)      params.subject      = filters.subject;
    if (filters.attempt_type) params.attempt_type = filters.attempt_type;
    examsAPI.getPapers(params)
      .then(({ data }) => setPapers(data.results || data || []))
      .catch(() => setError('Failed to load papers. Please try again.'))
      .finally(() => setLoading(false));
  }, [filters]);

  const handleGetTest = async (paper) => {
    setAccessingId(paper.id);
    try {
      await examsAPI.getAccess(paper.id);
    } catch {
      // already has access or other error — navigate anyway
    } finally {
      setAccessingId(null);
      navigate('/upload', { state: { paperId: paper.id } });
    }
  };

  const examCfg = (examType) => EXAM_TYPE_CONFIG[examType] || EXAM_TYPE_CONFIG.CA;

  const filteredPapers = filters.exam_type
    ? papers.filter(p => p.exam_type === filters.exam_type)
    : papers;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.2rem', fontFamily: 'Fraunces, serif' }}>
          Paper Library
        </h1>
        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
          Browse CA, CS & CMA mock test papers — each includes 1 AI evaluation credit
        </p>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', boxShadow: 'var(--shadow)' }}>
        <div style={{ flex: '1', minWidth: '130px' }}>
          <label style={labelStyle}>Exam Type</label>
          <select value={filters.exam_type} onChange={e => setFilters(p => ({ ...p, exam_type: e.target.value }))} style={selectStyle}>
            <option value="">All Types</option>
            <option value="CA">CA</option>
            <option value="CS">CS</option>
            <option value="CMA">CMA</option>
          </select>
        </div>
        <div style={{ flex: '2', minWidth: '160px' }}>
          <label style={labelStyle}>Subject</label>
          <select value={filters.subject} onChange={e => setFilters(p => ({ ...p, subject: e.target.value }))} style={selectStyle}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ flex: '1', minWidth: '130px' }}>
          <label style={labelStyle}>Paper Type</label>
          <select value={filters.attempt_type} onChange={e => setFilters(p => ({ ...p, attempt_type: e.target.value }))} style={selectStyle}>
            <option value="">All</option>
            {ATTEMPT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <button
          onClick={() => setFilters({ subject: '', attempt_type: '', exam_type: '' })}
          style={{ padding: '0.45rem 0.9rem', background: '#fff', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Clear
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      )}

      {/* Papers list */}
      {!loading && filteredPapers.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {filteredPapers.map(paper => {
            const cfg = examCfg(paper.exam_type);
            const isBusy = accessingId === paper.id;
            const price = parseFloat(paper.price || 0);

            return (
              <div
                key={paper.id}
                style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '1.5rem', 
                  boxShadow: 'var(--shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                {/* Top row: badge + price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.22rem 0.6rem', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 'var(--radius)', fontSize: '0.78rem', fontWeight: 700 }}>
                    <GraduationIcon /> {cfg.label}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-lighter)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>PRICE</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1, fontFamily: 'Fraunces, serif' }}>
                      {price > 0 ? `₹${price % 1 === 0 ? price.toFixed(0) : price}` : 'Free'}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', lineHeight: 1.35, fontFamily: 'Fraunces, serif' }}>
                  {paper.title}
                </h3>

                {/* Level + Subject */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {paper.exam_level && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-lighter)' }}>Level</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{paper.exam_level}</span>
                    </div>
                  )}
                  {paper.subject_name && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-lighter)' }}>Subject</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'right', marginLeft: '1rem' }}>{paper.subject_name}</span>
                    </div>
                  )}
                  {paper.exam_session && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-lighter)' }}>Session</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{paper.exam_session}</span>
                    </div>
                  )}
                </div>

                {/* Marks + Duration pills */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <span style={pillStyle}>📄 {paper.total_marks} marks</span>
                  <span style={pillStyle}>🕐 {paper.duration_minutes} min</span>
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: 'auto' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '1rem', lineHeight: 1.4 }}>
                    Includes <strong style={{ color: 'var(--primary)' }}>1 AI evaluation credit</strong> — instant expert feedback
                  </p>
                  <button
                    onClick={() => handleGetTest(paper)}
                    disabled={isBusy}
                    style={{ 
                      display: 'flex', 
                      width: '100%',
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.5rem', 
                      padding: '0.65rem 1.15rem', 
                      background: isBusy ? 'var(--text-lighter)' : 'var(--primary)', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 'var(--radius)', 
                      fontSize: '0.9rem', 
                      fontWeight: 700, 
                      cursor: isBusy ? 'not-allowed' : 'pointer', 
                      transition: 'all 0.2s' 
                    }}
                  >
                    <CartIcon /> {isBusy ? 'Processing...' : 'Get Test Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredPapers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
          <p style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>No papers found</p>
          <p style={{ fontSize: '0.875rem' }}>
            {Object.values(filters).some(Boolean) ? 'Try adjusting your filters.' : 'Check back soon for new papers.'}
          </p>
        </div>
      )}

      {!loading && filteredPapers.length > 0 && (
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.78rem', marginTop: '1.5rem' }}>
          Showing {filteredPapers.length} paper{filteredPapers.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: '#374151', marginBottom: '0.35rem',
};

const selectStyle = {
  width: '100%', padding: '0.42rem 0.7rem',
  border: '1px solid #d1d5db', borderRadius: '0.375rem',
  fontSize: '0.85rem', color: '#111827', background: '#fff',
};

const pillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
  padding: '0.22rem 0.65rem', background: '#f3f4f6',
  border: '1px solid #e5e7eb', borderRadius: '999px',
  fontSize: '0.78rem', color: '#374151',
};

export default ExamPapers;
