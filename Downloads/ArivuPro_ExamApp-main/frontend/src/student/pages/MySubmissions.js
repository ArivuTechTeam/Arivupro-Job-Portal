import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { submissionsAPI } from '../../services/api';

const Icons = {
  Upload: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  ClipboardList: () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>,
  BarChart: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
};

export function MySubmissions() {
  // Filter state
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const STATUS_OPTIONS = [
    { value: 'all', label: 'All Submissions' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'evaluated', label: 'Evaluated' },
    { value: 'completed', label: 'Completed' },
  ];

  // Fetch submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);
        setPage(1);

        const params = { page: 1 };
        if (selectedStatus !== 'all') {
          params.status = selectedStatus;
        }

        const { data } = await submissionsAPI.list(params);
        setSubmissions(data.results || data || []);
        setHasMore(!!data.next);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError('Failed to load your submissions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [selectedStatus]);

  // Load more submissions
  const handleLoadMore = async () => {
    try {
      setLoadingMore(true);

      const params = { page: page + 1 };
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const { data } = await submissionsAPI.list(params);
      setSubmissions((prev) => [...prev, ...(data.results || data || [])]);
      setHasMore(!!data.next);
      setPage(page + 1);
    } catch (err) {
      console.error('Error loading more submissions:', err);
      setError('Failed to load more submissions.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'badge-amber',
      processing: 'badge-blue',
      evaluated: 'badge-green',
      completed: 'badge-green',
    };
    return statusMap[status] || 'badge-blue';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Pending',
      processing: 'Processing',
      evaluated: 'Evaluated',
      completed: 'Completed',
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canViewReport = (status) => {
    return status === 'evaluated' || status === 'completed';
  };

  if (loading) {
    return (
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>My Submissions</h1>
          <p className="subtitle">Track and review your submitted answer scripts</p>
        </div>
        <div>
          <Link to="/upload" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Icons.Upload /> Upload New Answer
          </Link>
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
            Filter by Status
          </label>
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '0.5rem 0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              backgroundColor: '#fff',
              color: '#1e293b',
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {submissions.length > 0 ? (
        <>
          <div className="table-wrapper">
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                  }}>
                    Paper Title
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                  }}>
                    Subject
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                  }}>
                    Date Submitted
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                  }}>
                    Time Taken
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                  }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, index) => (
                  <tr
                    key={submission.id}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8fafc';
                    }}
                  >
                    <td style={{ padding: '1rem', color: '#1e293b' }}>
                      {canViewReport(submission.status) ? (
                        <Link
                          to={`/report/${submission.id}`}
                          style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
                        >
                          {submission.exam_paper_title || submission.exam_paper?.title || 'Exam Paper'}
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 500 }}>
                          {submission.exam_paper_title || submission.exam_paper?.title || 'Exam Paper'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>
                      {submission.subject_name || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span className={`badge ${getStatusBadgeClass(submission.status)}`}>
                        {getStatusLabel(submission.status)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>
                      {formatDate(submission.created_at)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                      {submission.time_taken_minutes ? `${submission.time_taken_minutes} min` : 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {canViewReport(submission.status) ? (
                        <Link
                          to={`/report/${submission.id}`}
                          className="btn btn-sm"
                          style={{
                            textDecoration: 'none',
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#3b82f6',
                            color: '#fff',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            display: 'inline-block',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Icons.BarChart /> View Report
                          </div>
                        </Link>
                      ) : (
                        <span style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: '#e2e8f0',
                          color: '#64748b',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          display: 'inline-block',
                        }}>
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  opacity: loadingMore ? 0.6 : 1,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loadingMore) e.target.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  if (!loadingMore) e.target.style.backgroundColor = '#3b82f6';
                }}
              >
                {loadingMore ? (
                  <>
                    <span className="spinner" style={{ marginRight: '0.5rem' }}></span>
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}

          {/* Results Summary */}
          <div style={{ marginTop: '1.5rem', color: '#64748b', fontSize: '0.875rem', textAlign: 'center' }}>
            Showing {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ marginBottom: '1rem', color: 'var(--text-light)' }}><Icons.ClipboardList /></div>
          <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>No Submissions Found</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            {selectedStatus !== 'all'
              ? 'No submissions match the selected status. Try adjusting your filters.'
              : "You haven't submitted any answer scripts yet. Start by uploading your first answer script!"}
          </p>
          <Link to="/upload" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
            <Icons.Upload /> Upload Answer Script
          </Link>
        </div>
      )}
    </div>
  );
}

export default MySubmissions;
