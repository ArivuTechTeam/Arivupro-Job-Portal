import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examsAPI } from '../services/api';
import './AdminPages.css';

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

  useEffect(() => {
    fetchPapers();
    fetchSubjects();
  }, [filters]);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.subject) queryParams.append('subject', filters.subject);
      if (filters.attempt_type) queryParams.append('attempt_type', filters.attempt_type);
      if (filters.is_published !== '') queryParams.append('is_published', filters.is_published);

      const response = await examsAPI.getPapers(
        queryParams.toString() ? `?${queryParams}` : ''
      );
      setPapers(Array.isArray(response) ? response : response.data || []);
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
      const data = await examsAPI.getSubjects();
      setSubjects(Array.isArray(data) ? data : data.data || []);
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
        <h1>Manage Question Papers</h1>
        <Link to="/admin/papers/new" className="btn btn-primary btn-lg">
          + Create New Paper
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Filters</h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
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

          <div className="form-group">
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

          <div className="form-group">
            <label className="form-label">Published Status</label>
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
        </div>
      </div>

      <div className="table-wrapper" style={{ marginTop: '2rem' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>Type</th>
              <th>Marks</th>
              <th>Duration</th>
              <th>Published</th>
              <th>Submissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {papers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  No papers found
                </td>
              </tr>
            ) : (
              papers.map(paper => (
                <tr key={paper.id}>
                  <td style={{ fontWeight: '500' }}>{paper.title}</td>
                  <td>{paper.subject}</td>
                  <td>
                    <span className={`badge ${getTypeColor(paper.attempt_type)}`}>
                      {paper.attempt_type || 'N/A'}
                    </span>
                  </td>
                  <td>{paper.total_marks}</td>
                  <td>{paper.duration_minutes} mins</td>
                  <td>
                    <span className={`badge ${paper.is_published ? 'badge-green' : 'badge-amber'}`}>
                      {paper.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{paper.submission_count || 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        className={`btn btn-sm ${paper.is_published ? 'btn-secondary' : 'btn-success'}`}
                        onClick={() => handleTogglePublished(paper.id, paper.is_published)}
                        disabled={publishingId === paper.id}
                      >
                        {publishingId === paper.id ? 'Updating...' : (paper.is_published ? 'Unpublish' : 'Publish')}
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openStatsModal(paper.id)}
                      >
                        Stats
                      </button>
                      <Link
                        to={`/admin/papers/${paper.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        Edit
                      </Link>
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
              <h2 style={{ margin: 0 }}>Paper Statistics</h2>
              <button
                className="btn btn-secondary btn-sm"
                onClick={closeStatsModal}
              >
                ×
              </button>
            </div>

            {statsModal.data ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="stat-card">
                  <div className="stat-label">Total Submissions</div>
                  <div className="stat-value">{statsModal.data.submission_count || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Average Score</div>
                  <div className="stat-value">
                    {statsModal.data.avg_score ? statsModal.data.avg_score.toFixed(2) : 'N/A'}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Highest Score</div>
                  <div className="stat-value">{statsModal.data.highest_score || 'N/A'}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Lowest Score</div>
                  <div className="stat-value">{statsModal.data.lowest_score || 'N/A'}</div>
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
