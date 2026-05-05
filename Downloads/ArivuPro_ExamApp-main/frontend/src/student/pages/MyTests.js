import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { examsAPI, submissionsAPI, API_HOST } from '../../services/api';

const GraduationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
  </svg>
);

const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const EXAM_TYPE_CONFIG = {
  CA:  { label: 'CA',  color: '#1B6543', bg: '#E6F1EB', border: '#D1E7DD' }, // Green
  CS:  { label: 'CS',  color: '#92400E', bg: '#FEF3C7', border: '#FDE68A' }, // Amber
  CMA: { label: 'CMA', color: '#991B1B', bg: '#FEE2E2', border: '#FECACA' }, // Red
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const MyTests = () => {
  const navigate = useNavigate();
  const [accesses, setAccesses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [modal, setModal]       = useState(null); // { paper }
  const [upload, setUpload]     = useState({ file: null, studentName: '', uploading: false, err: null });
  const fileRef = useRef(null);

  useEffect(() => {
    examsAPI.getMyTests()
      .then(({ data }) => setAccesses(data))
      .catch(() => setError('Failed to load your tests.'))
      .finally(() => setLoading(false));
  }, []);

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_HOST}${url}`;
  };

  const openModal = (paper) => {
    setModal({ paper });
    setUpload({ file: null, studentName: '', uploading: false, err: null });
  };

  const closeModal = () => setModal(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUpload(p => ({ ...p, err: 'Only PDF files are accepted.' }));
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUpload(p => ({ ...p, err: 'File must be under 25 MB.' }));
      return;
    }
    setUpload(p => ({ ...p, file, err: null }));
  };

  const handleEvaluate = async () => {
    if (!upload.file) {
      setUpload(p => ({ ...p, err: 'Please select your answer sheet PDF.' }));
      return;
    }
    setUpload(p => ({ ...p, uploading: true, err: null }));
    try {
      const form = new FormData();
      form.append('exam_paper', modal.paper.id);
      form.append('answer_script_file', upload.file);
      if (upload.studentName) form.append('notes', upload.studentName);
      const { data } = await submissionsAPI.create(form);
      closeModal();
      navigate(`/report/${data.id}`);
    } catch (err) {
      setUpload(p => ({
        ...p,
        uploading: false,
        err: err.response?.data?.detail || 'Upload failed. Please try again.',
      }));
    }
  };

  const examCfg = (t) => EXAM_TYPE_CONFIG[t] || EXAM_TYPE_CONFIG.CA;

  if (loading) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem', fontFamily: 'Fraunces, serif' }}>My Tests</h1>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.2rem', fontFamily: 'Fraunces, serif' }}>My Tests</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Your purchased mock tests — view, download, or evaluate</p>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {accesses.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
          <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>No tests yet</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Browse the Paper Library to get your first mock test.</p>
          <button
            onClick={() => navigate('/papers')}
            style={{ marginTop: '1rem', padding: '0.5rem 1.25rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
          >
            Browse Papers
          </button>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {accesses.map(access => {
          const paper = access.paper;
          if (!paper) return null;
          const cfg = examCfg(paper.exam_type);
          const price = parseFloat(access.amount_paid || 0);
          const fullPdfUrl = getFullUrl(paper.question_paper_file);

          return (
            <div 
              key={access.id} 
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
              {/* Top row: badges + PAID */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 'var(--radius)', fontSize: '0.76rem', fontWeight: 700 }}>
                    <GraduationIcon /> {cfg.label}
                  </span>
                  {paper.exam_level && (
                    <span style={{ padding: '0.2rem 0.6rem', background: 'var(--border-light)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.76rem', fontWeight: 500 }}>
                      {paper.exam_type} {paper.exam_level}
                    </span>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 'var(--radius)', fontSize: '0.76rem', fontWeight: 700 }}>
                    ✅ Purchased
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-lighter)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>PAID</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1, fontFamily: 'Fraunces, serif' }}>
                    {price > 0 ? `₹${price % 1 === 0 ? price.toFixed(0) : price}` : 'Free'}
                  </div>
                </div>
              </div>

              {/* Title + subject */}
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.15rem', fontFamily: 'Fraunces, serif' }}>{paper.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.6rem' }}>{paper.subject_name}</p>

              {/* Pills */}
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--text-light)' }}>
                <span style={pillStyle}>📄 {paper.total_marks} marks</span>
                <span style={pillStyle}>🕐 {paper.duration_minutes} min</span>
                {price > 0 && <span style={pillStyle}>₹ {price % 1 === 0 ? price.toFixed(0) : price}</span>}
                {access.purchased_at && <span style={pillStyle}>Bought {formatDate(access.purchased_at)}</span>}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
                <button
                  onClick={() => navigate('/upload', { state: { paperId: paper.id } })}
                  style={{ 
                    ...btnBase, 
                    background: 'var(--primary)', 
                    color: '#fff', 
                    border: 'none', 
                    display: 'flex', 
                    width: '100%',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.35rem' 
                  }}
                >
                  <UploadIcon /> Get AI Feedback
                </button>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  <button
                    onClick={() => fullPdfUrl && window.open(fullPdfUrl, '_blank')}
                    disabled={!paper.question_paper_file}
                    style={{ ...btnBase, flex: 1, background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)', opacity: paper.question_paper_file ? 1 : 0.5 }}
                  >
                    👁 View
                  </button>
                  <button
                    onClick={async () => {
                      if (!fullPdfUrl) return;
                      try {
                        const response = await fetch(fullPdfUrl);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = (paper.title || 'exam_paper') + '.pdf';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (err) {
                        window.open(fullPdfUrl, '_blank');
                      }
                    }}
                    disabled={!paper.question_paper_file}
                    style={{ ...btnBase, flex: 1, background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)', opacity: paper.question_paper_file ? 1 : 0.5 }}
                  >
                    ⬇ Download
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Answer Sheet Modal */}
      {modal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', marginBottom: '0.15rem' }}>Upload Answer Sheet</h2>
                <p style={{ fontSize: '0.82rem', color: '#6b7280' }}>{modal.paper.title}</p>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#9ca3af', padding: '0.2rem', lineHeight: 1 }}>✕</button>
            </div>

            {/* Instructions */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.65rem', padding: '0.9rem 1rem', marginBottom: '1.25rem' }}>
              <p style={{ fontWeight: 700, color: '#1e40af', marginBottom: '0.45rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                ℹ️ Instructions
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.82rem', color: '#3b82f6', lineHeight: '1.75' }}>
                <li>Write your <strong>name</strong> clearly on the first page</li>
                <li>Mention <strong>question numbers</strong> clearly before each answer</li>
                <li>Ensure photos/scans are <strong>clear and legible</strong></li>
                <li>Upload as a <strong>single PDF</strong> (max 25MB)</li>
                <li>Write answers in <strong>order</strong> for best results</li>
              </ul>
            </div>

            {/* File zone */}
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.45rem' }}>Answer Sheet (PDF)</p>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${upload.file ? '#86efac' : '#d1d5db'}`,
                borderRadius: '0.5rem', padding: '1.75rem 1rem',
                textAlign: 'center', cursor: 'pointer', marginBottom: '1rem',
                background: upload.file ? '#f0fdf4' : '#fafafa', transition: 'all 0.15s',
              }}
            >
              <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFile} />
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={upload.file ? '#16a34a' : '#9ca3af'} strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 0.5rem' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {upload.file ? (
                <p style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>{upload.file.name}</p>
              ) : (
                <>
                  <p style={{ fontSize: '0.85rem', color: '#374151' }}>Click to select your answer sheet PDF</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>PDF only · at least 1 page · max 25MB</p>
                </>
              )}
            </div>

            {/* Student name */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ display: 'block', fontSize: '0.83rem', color: '#374151', marginBottom: '0.4rem' }}>
                Student Name <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional — AI will extract from sheet)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ansh Gupta"
                value={upload.studentName}
                onChange={e => setUpload(p => ({ ...p, studentName: e.target.value }))}
                style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#111827', boxSizing: 'border-box' }}
              />
            </div>

            {upload.err && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem', marginBottom: '0.875rem' }}>
                {upload.err}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleEvaluate}
              disabled={upload.uploading}
              style={{
                width: '100%', padding: '0.7rem',
                background: upload.uploading
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                color: '#fff', border: 'none', borderRadius: '0.5rem',
                fontSize: '0.95rem', fontWeight: 700,
                cursor: upload.uploading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              {upload.uploading ? '⏳ Uploading...' : '📊 Evaluate Answer Sheet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const pillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
  padding: '0.2rem 0.6rem', background: '#f3f4f6',
  border: '1px solid #e5e7eb', borderRadius: '999px',
};

const btnBase = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
  padding: '0.45rem 1rem', borderRadius: '0.5rem',
  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
};

export default MyTests;
