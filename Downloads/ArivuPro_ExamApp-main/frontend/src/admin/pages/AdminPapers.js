import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examsAPI } from '../../services/api';
import '../styles/AdminPages.css';

export default function AdminPapers() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    subject: '',
    attempt_type: '',
    is_published: '',
  });
  const [subjects, setSubjects] = useState([]);
  const [statsModal, setStatsModal] = useState({
    open: false,
    paperId: null,
    data: null,
  });
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchPapers();
    fetchSubjects();
  }, [filters]);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.subject) params.subject = filters.subject;
      if (filters.attempt_type) params.attempt_type = filters.attempt_type;
      if (filters.is_published !== '') params.is_published = filters.is_published;

      const response = await examsAPI.getPapers(params);
      const data = response.data;
      setPapers(Array.isArray(data) ? data : data?.results || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch papers: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await examsAPI.getSubjects();
      const data = response.data;
      setSubjects(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const handleTogglePublished = async (paperId, currentStatus) => {
    try {
      setPublishingId(paperId);
      await examsAPI.updatePaper(paperId, { is_published: !currentStatus });
      await fetchPapers();
    } catch (err) {
      setError('Failed to update paper: ' + err.message);
    } finally {
      setPublishingId(null);
    }
  };

  const handleDeletePaper = async (paperId, title) => {
    if (!window.confirm(`Are you sure you want to delete the paper "${title}"? This action cannot be undone and will delete all related questions and evaluations.`)) {
      return;
    }

    try {
      setDeletingId(paperId);
      await examsAPI.deletePaper(paperId);
      await fetchPapers();
    } catch (err) {
      setError('Failed to delete paper: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const openStatsModal = async (paperId) => {
    try {
      const stats = await examsAPI.getPaperStats(paperId);
      setStatsModal({
        open: true,
        paperId,
        data: stats.data || stats,
      });
    } catch (err) {
      setError('Failed to fetch paper stats: ' + err.message);
    }
  };

  const closeStatsModal = () => {
    setStatsModal({ open: false, paperId: null, data: null });
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const getTypeColor = (type) => {
    const colors = {
      'mock': 'badge-blue',
      'practice': 'badge-green',
      'past_paper': 'badge-amber',
      'rtp': 'badge-blue',
      'mtp': 'badge-amber',
    };
    return colors[type] || 'badge-blue';
  };

  if (loading && papers.length === 0) {
    return (
      <div className="page">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Manage Question Papers</h1>
          <p className="subtitle">{papers.length > 0 ? `${papers.length} paper${papers.length !== 1 ? 's' : ''} total` : 'Create and manage exam papers'}</p>
        </div>
        <Link to="/admin/papers/new" className="btn btn-primary">
          + Create New Paper
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-bar">
        <div className="form-group" style={{ minWidth: 180 }}>
          <label className="form-label">Subject</label>
          <select
            className="form-select"
            value={filters.subject}
            onChange={(e) => handleFilterChange('subject', e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject.id || subject} value={subject.id || subject}>
                {typeof subject === 'object' ? subject.name : subject}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ minWidth: 160 }}>
          <label className="form-label">Attempt Type</label>
          <select
            className="form-select"
            value={filters.attempt_type}
            onChange={(e) => handleFilterChange('attempt_type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="mock">Mock Exam</option>
            <option value="practice">Practice</option>
            <option value="past_paper">Past Paper</option>
            <option value="rtp">RTP</option>
            <option value="mtp">MTP</option>
          </select>
        </div>

        <div className="form-group" style={{ minWidth: 150 }}>
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={filters.is_published}
            onChange={(e) => handleFilterChange('is_published', e.target.value)}
          >
            <option value="">All Papers</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
        </div>

        {(filters.subject || filters.attempt_type || filters.is_published) && (
          <button
            className="btn btn-secondary btn-sm"
            style={{ alignSelf: 'flex-end', marginBottom: 0 }}
            onClick={() => setFilters({ subject: '', attempt_type: '', is_published: '' })}
          >
            Clear
          </button>
        )}
      </div>

      <div className="table-wrapper" style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '0 1rem' }}>
        <table className="admin-table" style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'auto' }}>
          <colgroup>
            <col style={{ width: '25%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <th style={{ textAlign: 'left', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TITLE / SUBJECT</th>
              <th style={{ textAlign: 'center', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TYPE</th>
              <th style={{ textAlign: 'center', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MARKS / TIME</th>
              <th style={{ textAlign: 'center', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PRICE</th>
              <th style={{ textAlign: 'center', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS</th>
              <th style={{ textAlign: 'center', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SUBS</th>
              <th style={{ textAlign: 'center', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {papers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                  No papers found.
                </td>
              </tr>
            ) : (
              papers.map(paper => (
                <tr key={paper.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {/* TITLE / SUBJECT */}
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#111827' }}>{paper.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.1rem' }}>{paper.subject_name || paper.subject || '—'}</div>
                  </td>

                  {/* TYPE */}
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      ...(paper.attempt_type === 'past_paper' ? { color: '#9a3412', backgroundColor: '#fff7ed' } :
                         paper.attempt_type === 'mock' ? { color: '#1e40af', backgroundColor: '#eff6ff' } :
                         { color: '#166534', backgroundColor: '#f0fdf4' })
                    }}>
                      {(paper.attempt_type || 'mock').replace('_', ' ')}
                    </span>
                  </td>

                  {/* MARKS / TIME */}
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{paper.total_marks} marks</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{paper.duration_minutes} min</div>
                  </td>

                  {/* PRICE */}
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                    ₹{paper.price || 0}
                  </td>

                  {/* STATUS */}
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      ...(paper.is_published 
                        ? { backgroundColor: '#d1fae5', color: '#065f46' } 
                        : { border: '1px solid #fcd34d', color: '#92400e', backgroundColor: '#fffbeb' })
                    }}>
                      {paper.is_published ? 'LIVE' : 'DRAFT'}
                    </span>
                  </td>

                  {/* SUBS */}
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 600, color: '#374151' }}>
                    {paper.submission_count || 0}
                  </td>

                  {/* ACTIONS */}
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', width: '200px', marginLeft: 'auto' }}>
                      {/* Top Left: Unpublish / Publish */}
                      <button
                        onClick={() => handleTogglePublished(paper.id, paper.is_published)}
                        disabled={publishingId === paper.id}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.35rem 0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: paper.is_published ? '1px solid #d1d5db' : 'none',
                          backgroundColor: paper.is_published ? '#fff' : '#065f46',
                          color: paper.is_published ? '#374151' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {publishingId === paper.id ? '...' : (paper.is_published ? 'Unpublish' : 'Publish')}
                      </button>

                      {/* Top Right: Stats */}
                      <button
                        onClick={() => openStatsModal(paper.id)}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.35rem 0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: '1px solid #bfdbfe',
                          backgroundColor: '#eff6ff',
                          color: '#1e40af',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        Stats
                      </button>

                      {/* Bottom Left: Edit */}
                      <Link
                        to={`/admin/papers/${paper.id}`}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.35rem 0.5rem',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          textAlign: 'center',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#fff',
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        Edit
                      </Link>

                      {/* Bottom Right: Delete */}
                      <button
                        onClick={() => handleDeletePaper(paper.id, paper.title)}
                        disabled={deletingId === paper.id}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.35rem 0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: '1px solid #fecdd3',
                          backgroundColor: '#fff',
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                      >
                        {deletingId === paper.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {statsModal.open && (
        <div className="modal-overlay" onClick={closeStatsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.2rem' }}>Paper Statistics</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Submission and score summary</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={closeStatsModal}>✕</button>
            </div>

            {statsModal.data ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem' }}>
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                  </div>
                  <div>
                    <div className="stat-value" style={{ fontSize: '1.5rem' }}>{statsModal.data.submission_count || 0}</div>
                    <div className="stat-label">Submissions</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                  </div>
                  <div>
                    <div className="stat-value" style={{ fontSize: '1.5rem' }}>{statsModal.data.avg_score ? statsModal.data.avg_score.toFixed(1) + '%' : 'N/A'}</div>
                    <div className="stat-label">Avg Score</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon amber">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                  </div>
                  <div>
                    <div className="stat-value" style={{ fontSize: '1.5rem' }}>{statsModal.data.highest_score || 'N/A'}</div>
                    <div className="stat-label">Highest Score</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon red">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
                  </div>
                  <div>
                    <div className="stat-value" style={{ fontSize: '1.5rem' }}>{statsModal.data.lowest_score || 'N/A'}</div>
                    <div className="stat-label">Lowest Score</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="spinner"></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
