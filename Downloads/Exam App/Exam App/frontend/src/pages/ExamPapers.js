import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { examsAPI } from '../services/api';

export function ExamPapers() {
  const { user } = useAuth();

  const [papers, setPapers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({
    subject: '',
    attempt_type: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ATTEMPT_TYPES = [
    { value: 'mock', label: 'Mock Test' },
    { value: 'practice', label: 'Practice Paper' },
    { value: 'past_paper', label: 'Past Paper' },
    { value: 'rtp', label: 'RTP' },
    { value: 'mtp', label: 'MTP' },
  ];

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await examsAPI.getSubjects();
        setSubjects(data.results || data || []);
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    };

    fetchSubjects();
  }, []);

  // Fetch papers when filters change
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {};
        if (filters.subject) {
          params.subject = filters.subject;
        }
        if (filters.attempt_type) {
          params.attempt_type = filters.attempt_type;
        }

        const { data } = await examsAPI.getPapers(params);
        setPapers(data.results || data || []);
      } catch (err) {
        console.error('Error fetching papers:', err);
        setError('Failed to load exam papers. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [filters]);

  const handleSubjectChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      subject: e.target.value,
    }));
  };

  const handleAttemptTypeChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      attempt_type: e.target.value,
    }));
  };

  const clearFilters = () => {
    setFilters({ subject: '', attempt_type: '' });
  };

  const getAttemptTypeBadgeClass = (attemptType) => {
    const typeMap = {
      mock: 'badge-blue',
      practice: 'badge-green',
      past_paper: 'badge-amber',
      rtp: 'badge-red',
      mtp: 'badge-red',
    };
    return typeMap[attemptType] || 'badge-blue';
  };

  const getAttemptTypeLabel = (attemptType) => {
    const type = ATTEMPT_TYPES.find((t) => t.value === attemptType);
    return type ? type.label : attemptType;
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Available Exam Papers</h1>
          <p className="subtitle">Select and practice from our comprehensive exam paper collection</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #fecaca',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'flex-end' }}>
            {/* Subject Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                Subject
              </label>
              <select
                value={filters.subject}
                onChange={handleSubjectChange}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff',
                  color: '#1e293b',
                }}
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name || subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Attempt Type Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                Attempt Type
              </label>
              <select
                value={filters.attempt_type}
                onChange={handleAttemptTypeChange}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff',
                  color: '#1e293b',
                }}
              >
                <option value="">All Types</option>
                {ATTEMPT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div>
              <button
                onClick={clearFilters}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f1f5f9';
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <div className="spinner"></div>
        </div>
      )}

      {/* Papers Grid */}
      {!loading && papers.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {papers.map((paper) => (
            <div key={paper.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header">
                <h3 className="card-title">{paper.title || 'Exam Paper'}</h3>
              </div>

              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Subject and Type */}
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {paper.subject && (
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: '#e0e7ff',
                        color: '#3730a3',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      {typeof paper.subject === 'object' ? paper.subject.name : paper.subject}
                    </span>
                  )}
                  {paper.attempt_type && (
                    <span className={`badge ${getAttemptTypeBadgeClass(paper.attempt_type)}`}>
                      {getAttemptTypeLabel(paper.attempt_type)}
                    </span>
                  )}
                </div>

                {/* Paper Details */}
                <div style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                    {paper.total_marks && (
                      <div>
                        <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>Total Marks</p>
                        <p style={{ fontWeight: 600, color: '#1e293b', fontSize: '1rem' }}>
                          {paper.total_marks}
                        </p>
                      </div>
                    )}
                    {paper.duration && (
                      <div>
                        <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>Duration</p>
                        <p style={{ fontWeight: 600, color: '#1e293b', fontSize: '1rem' }}>
                          {paper.duration} mins
                        </p>
                      </div>
                    )}
                  </div>

                  {paper.exam_session && (
                    <div>
                      <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>Exam Session</p>
                      <p style={{ fontWeight: 500, color: '#1e293b' }}>{paper.exam_session}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {paper.description && (
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem', lineHeight: '1.5' }}>
                    {paper.description.substring(0, 100)}
                    {paper.description.length > 100 ? '...' : ''}
                  </p>
                )}

                {/* Upload Answer Button */}
                <Link
                  to={`/upload?paper=${paper.id}`}
                  className="btn btn-primary"
                  style={{ marginTop: 'auto', textAlign: 'center', textDecoration: 'none' }}
                >
                  📤 Upload Answer Script
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && papers.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>No Papers Found</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            {filters.subject || filters.attempt_type
              ? 'Try adjusting your filters to find more papers.'
              : 'Check back soon for more exam papers.'}
          </p>
          {(filters.subject || filters.attempt_type) && (
            <button
              onClick={clearFilters}
              className="btn btn-primary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Results Summary */}
      {!loading && papers.length > 0 && (
        <div style={{ marginTop: '1.5rem', color: '#64748b', fontSize: '0.875rem', textAlign: 'center' }}>
          Showing {papers.length} exam paper{papers.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default ExamPapers;
