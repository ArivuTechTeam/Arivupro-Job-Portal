import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { evaluationsAPI, submissionsAPI } from '../../services/api';
import '../styles/AdminPages.css';

export default function AdminEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [approvingId, setApprovingId] = useState(null);
  const [approveModal, setApproveModal] = useState({
    open: false,
    evaluationId: null,
    marksOverride: '',
    remarks: '',
  });
  const [pdfModal, setPdfModal] = useState({ open: false, url: null, title: '' });

  const filters = {
    all: {},
    pending: { status: 'pending' },
    ai_evaluated: { status: 'completed', is_ai_evaluated: true },
    approved: { status: 'approved' },
  };

  useEffect(() => {
    fetchEvaluations();
  }, [activeFilter]);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const filterCriteria = filters[activeFilter] || {};
      const response = await evaluationsAPI.list(filterCriteria);
      const data = response.data;
      setEvaluations(Array.isArray(data) ? data : data?.results || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch evaluations: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openApproveModal = (evaluationId, currentMarks) => {
    setApproveModal({
      open: true,
      evaluationId,
      marksOverride: currentMarks.toString(),
      remarks: '',
    });
  };

  const closeApproveModal = () => {
    setApproveModal({
      open: false,
      evaluationId: null,
      marksOverride: '',
      remarks: '',
    });
  };

  const handleApprove = async () => {
    if (!approveModal.evaluationId) return;

    try {
      setApprovingId(approveModal.evaluationId);
      const approveData = {
        remarks: approveModal.remarks,
      };

      if (approveModal.marksOverride !== '') {
        approveData.total_marks_obtained = parseFloat(approveModal.marksOverride);
      }

      await evaluationsAPI.approve(approveModal.evaluationId, approveData);
      await fetchEvaluations();
      closeApproveModal();
    } catch (err) {
      setError('Failed to approve evaluation: ' + err.message);
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'pending': 'badge-amber',
      'processing': 'badge-blue',
      'completed': 'badge-green',
      'approved': 'badge-purple',
    };
    return colors[status] || 'badge-blue';
  };

  const getEvaluationTypeBadge = (isAiEvaluated) => {
    return isAiEvaluated ? 'badge-blue' : 'badge-green';
  };

  const calculatePercentage = (marks, totalMarks) => {
    if (!totalMarks) return 0;
    return ((marks / totalMarks) * 100).toFixed(2);
  };

  const getFilterTab = (tabKey, label) => (
    <button
      key={tabKey}
      className={`filter-tab ${activeFilter === tabKey ? 'active' : ''}`}
      onClick={() => setActiveFilter(tabKey)}
    >
      {label}
    </button>
  );

  if (loading && evaluations.length === 0) {
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
          <h1>Manage Evaluations</h1>
          <p className="subtitle">Review AI-generated evaluations and approve scores</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchEvaluations}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-tabs" style={{ marginBottom: '2rem' }}>
        {getFilterTab('all', 'All')}
        {getFilterTab('pending', 'Pending Review')}
        {getFilterTab('ai_evaluated', 'AI Evaluated')}
        {getFilterTab('approved', 'Approved')}
      </div>

      <div className="table-wrapper" style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '0 1rem' }}>
        <table className="admin-table" style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'auto' }}>
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '23%' }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <th style={{ textAlign: 'left', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STUDENT</th>
              <th style={{ textAlign: 'left', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PAPER</th>
              <th style={{ textAlign: 'center', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SCORE / %</th>
              <th style={{ textAlign: 'center', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TYPE</th>
              <th style={{ textAlign: 'center', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS</th>
              <th style={{ textAlign: 'center', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                  No evaluations found for the selected filter.
                </td>
              </tr>
            ) : (
              evaluations.map(evaluation => (
                <tr key={evaluation.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {/* STUDENT */}
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#111827' }}>{evaluation.student_name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.1rem' }}>
                      {evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                  </td>

                  {/* PAPER */}
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {evaluation.exam_paper_title || 'Unknown Paper'}
                    </div>
                  </td>

                  {/* SCORE / % */}
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#111827' }}>
                      {evaluation.total_marks_obtained != null
                        ? `${evaluation.total_marks_obtained} / ${evaluation.total_marks_possible || '?'}`
                        : 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {evaluation.percentage != null
                        ? `${parseFloat(evaluation.percentage).toFixed(1)}%`
                        : '—'}
                    </div>
                  </td>

                  {/* TYPE */}
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor: evaluation.is_ai_evaluated ? '#eff6ff' : '#f0fdf4',
                      color: evaluation.is_ai_evaluated ? '#1e40af' : '#166534',
                      border: `1px solid ${evaluation.is_ai_evaluated ? '#bfdbfe' : '#bbf7d0'}`
                    }}>
                      {evaluation.is_ai_evaluated ? 'AI' : 'Manual'}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      ...(evaluation.status === 'approved' ? { backgroundColor: '#f5f3ff', color: '#5b21b6', border: '1px solid #ddd6fe' } :
                         evaluation.status === 'completed' ? { backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #d1fae5' } :
                         { backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fef3c7' })
                    }}>
                      {(evaluation.status || 'pending').toUpperCase()}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', width: '220px', marginLeft: 'auto' }}>
                      {evaluation.status !== 'approved' ? (
                        <button
                          onClick={() => openApproveModal(evaluation.id, evaluation.total_marks_obtained || 0)}
                          disabled={approvingId === evaluation.id}
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            padding: '0.35rem 0.4rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: '#065f46',
                            color: '#fff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {approvingId === evaluation.id ? '...' : 'Approve'}
                        </button>
                      ) : (
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#f9fafb', color: '#9ca3af', fontSize: '0.725rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          Approved
                        </div>
                      )}

                      {evaluation.submission_file && (
                        <button
                          onClick={() => setPdfModal({
                            open: true,
                            url: evaluation.submission_file,
                            title: `${evaluation.student_name || 'Student'} — Answer Script`,
                          })}
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            padding: '0.35rem 0.4rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#fff',
                            color: '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          View Sheet
                        </button>
                      )}

                      {evaluation.submission_id && (
                        <Link
                          to={`/report/${evaluation.submission_id}`}
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            padding: '0.35rem 0.4rem',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            textAlign: 'center',
                            border: '1px solid #bbf7d0',
                            backgroundColor: '#f0fdf4',
                            color: '#166534',
                            gridColumn: '1 / span 1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          Report
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {approveModal.open && (
        <div className="modal-overlay" onClick={closeApproveModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.2rem' }}>Approve Evaluation</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Override marks if needed and add remarks</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={closeApproveModal}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Marks (Override if needed)</label>
              <input
                type="number"
                className="form-input"
                value={approveModal.marksOverride}
                onChange={(e) =>
                  setApproveModal(prev => ({
                    ...prev,
                    marksOverride: e.target.value,
                  }))
                }
                placeholder="Leave blank to keep current marks"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea
                className="form-textarea"
                value={approveModal.remarks}
                onChange={(e) =>
                  setApproveModal(prev => ({
                    ...prev,
                    remarks: e.target.value,
                  }))
                }
                placeholder="Any additional comments or feedback"
                rows="4"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                className="btn btn-secondary"
                onClick={closeApproveModal}
              >
                Cancel
              </button>
              <button
                className="btn btn-success btn-lg"
                onClick={handleApprove}
                disabled={approvingId === approveModal.evaluationId}
              >
                {approvingId === approveModal.evaluationId ? 'Approving...' : 'Confirm Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {pdfModal.open && (
        <div className="modal-overlay" onClick={() => setPdfModal({ open: false, url: null, title: '' })}>
          <div
            className="modal-content"
            style={{ maxWidth: '92vw', width: 960, maxHeight: '94vh', padding: '1.25rem', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: '0 0 0.15rem', fontSize: '1rem' }}>{pdfModal.title}</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Answer script submitted by student</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <a
                  href={pdfModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  Open in New Tab ↗
                </a>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPdfModal({ open: false, url: null, title: '' })}
                >
                  ✕ Close
                </button>
              </div>
            </div>
            <iframe
              src={pdfModal.url}
              title="Answer Script"
              style={{ flex: 1, minHeight: 0, height: '75vh', width: '100%', border: 'none', borderRadius: 8, background: '#f3f4f6' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
