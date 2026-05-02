import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { evaluationsAPI, submissionsAPI } from '../services/api';
import './AdminPages.css';

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
      setEvaluations(Array.isArray(response) ? response : response.data || []);
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
        status: 'approved',
        remarks: approveModal.remarks,
      };

      if (approveModal.marksOverride) {
        approveData.marks_override = parseFloat(approveModal.marksOverride);
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
        <h1>Manage Evaluations</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-tabs" style={{ marginBottom: '2rem' }}>
        {getFilterTab('all', 'All')}
        {getFilterTab('pending', 'Pending Review')}
        {getFilterTab('ai_evaluated', 'AI Evaluated')}
        {getFilterTab('approved', 'Approved')}
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Paper</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  No evaluations found
                </td>
              </tr>
            ) : (
              evaluations.map(evaluation => (
                <tr key={evaluation.id}>
                  <td style={{ fontWeight: '500' }}>
                    {evaluation.student_name || evaluation.student?.name || 'Unknown'}
                  </td>
                  <td>
                    {evaluation.paper_title || evaluation.paper?.title || 'Unknown Paper'}
                  </td>
                  <td style={{ fontWeight: '500' }}>
                    {evaluation.marks !== undefined && evaluation.marks !== null
                      ? `${evaluation.marks}/${evaluation.total_marks || '?'}`
                      : 'N/A'}
                  </td>
                  <td>
                    {evaluation.marks !== undefined && evaluation.total_marks
                      ? `${calculatePercentage(evaluation.marks, evaluation.total_marks)}%`
                      : 'N/A'}
                  </td>
                  <td>
                    <span
                      className={`badge ${getEvaluationTypeBadge(evaluation.is_ai_evaluated)}`}
                    >
                      {evaluation.is_ai_evaluated ? 'AI' : 'Manual'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeColor(evaluation.status)}`}>
                      {evaluation.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.9rem' }}>
                    {evaluation.created_at
                      ? new Date(evaluation.created_at).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {evaluation.status !== 'approved' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() =>
                            openApproveModal(evaluation.id, evaluation.marks || 0)
                          }
                          disabled={approvingId === evaluation.id}
                        >
                          {approvingId === evaluation.id ? '...' : 'Approve'}
                        </button>
                      )}
                      <Link
                        to={`/report/${evaluation.submission_id || evaluation.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        Report
                      </Link>
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
              <h2 style={{ margin: 0 }}>Approve Evaluation</h2>
              <button
                className="btn btn-secondary btn-sm"
                onClick={closeApproveModal}
              >
                ×
              </button>
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
    </div>
  );
}
