/**
 * Admin Dashboard - Overview with key metrics
 * Uses existing API endpoints: /api/exams/papers/, /api/exams/submissions/, /api/exams/evaluations/, /api/exams/subjects/
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examsAPI, evaluationsAPI } from '../../services/api';

import { 
  RefreshCcw, 
  FileText, 
  Book, 
  ClipboardList, 
  Clock, 
  Zap, 
  Plus, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

import '../styles/AdminPanel.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_papers: 0,
    total_subjects: 0,
    total_submissions: 0,
    pending_evaluations: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [papersRes, subjectsRes, submissionsRes, evaluationsRes] = await Promise.allSettled([
        examsAPI.getPapers(),
        examsAPI.getSubjects(),
        submissionsFetch(),
        evaluationsAPI.list(),
      ]);

      const papers = papersRes.status === 'fulfilled' ? (papersRes.value.data?.results || papersRes.value.data || []) : [];
      const subjects = subjectsRes.status === 'fulfilled' ? (subjectsRes.value.data?.results || subjectsRes.value.data || []) : [];
      const submissions = submissionsRes.status === 'fulfilled' ? (submissionsRes.value.data?.results || submissionsRes.value.data || []) : [];
      const evaluations = evaluationsRes.status === 'fulfilled' ? (evaluationsRes.value.data?.results || evaluationsRes.value.data || []) : [];

      const pendingEvals = Array.isArray(evaluations) ? evaluations.filter(e => e.status === 'pending' || e.status === 'completed').length : 0;

      setStats({
        total_papers: Array.isArray(papers) ? papers.length : 0,
        total_subjects: Array.isArray(subjects) ? subjects.length : 0,
        total_submissions: Array.isArray(submissions) ? submissions.length : 0,
        pending_evaluations: pendingEvals,
      });

      // Recent submissions
      if (Array.isArray(submissions)) {
        setRecentSubmissions(submissions.slice(0, 5));
      }
    } catch (err) {
      setError('Failed to load dashboard data.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="subtitle">System Overview</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="subtitle">System overview & key metrics</p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={fetchDashboardData}>
          <Icons.Refresh /> Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><Icons.FileText /></div>
          <div>
            <div className="stat-value">{stats.total_papers}</div>
            <div className="stat-label">Question Papers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue"><Icons.Book /></div>
          <div>
            <div className="stat-value">{stats.total_subjects}</div>
            <div className="stat-label">Subjects</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber"><Icons.ClipboardList /></div>
          <div>
            <div className="stat-value">{stats.total_submissions}</div>
            <div className="stat-label">Total Submissions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red"><Icons.Clock /></div>
          <div>
            <div className="stat-value">{stats.pending_evaluations}</div>
            <div className="stat-label">Pending Reviews</div>
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid-2">
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Icons.Zap /> Quick Actions</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <div className="quick-actions-grid">
              <Link to="/admin/papers/new" className="qa-tile green">
                <div className="qa-icon"><Icons.Plus /></div>
                <span>Create New Paper</span>
              </Link>
              <Link to="/admin/evaluations" className="qa-tile blue">
                <div className="qa-icon"><Icons.CheckCircle /></div>
                <span>Review Evaluations</span>
              </Link>
              <Link to="/admin/papers" className="qa-tile amber">
                <div className="qa-icon"><Icons.FileText /></div>
                <span>Manage Papers</span>
              </Link>
              <Link to="/admin/subjects" className="qa-tile purple">
                <div className="qa-icon"><Icons.Book /></div>
                <span>Manage Subjects</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.ClipboardList /> Recent Submissions</h3>
          </div>
          {recentSubmissions.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem 0' }}>
              No submissions yet
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Paper</th>
                    <th>Student</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 500 }}>{sub.exam_paper?.title || sub.exam_paper || 'N/A'}</td>
                      <td>{sub.student?.username || sub.student || 'N/A'}</td>
                      <td>
                        <span className={`badge ${
                          sub.status === 'evaluated' ? 'badge-green' :
                          sub.status === 'pending' ? 'badge-amber' : 'badge-blue'
                        }`}>
                          {sub.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Faculty Evaluation Requests */}
      {(() => {
        let facReqs = [];
        let facResps = [];
        try { facReqs = JSON.parse(localStorage.getItem('fac_eval_requests') || '[]'); } catch {}
        try { facResps = JSON.parse(localStorage.getItem('fac_eval_responses') || '[]'); } catch {}
        const pendingFac = facReqs.filter(r => !facResps.find(resp => resp.requestId === r.id)).length;
        if (facReqs.length > 0) {
          return (
            <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid #7c3aed' }}>
              <div className="card-header">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.ClipboardList /> Faculty Evaluation Requests</h3>
                {pendingFac > 0 && <span className="badge badge-amber">{pendingFac} pending</span>}
              </div>
              <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
                {pendingFac > 0
                  ? <>Students have requested <strong>{pendingFac}</strong> faculty evaluation{pendingFac !== 1 ? 's' : ''}.</>
                  : 'All faculty evaluation requests have been responded to.'}
              </p>
              <Link to="/admin/faculty-requests" className="btn btn-primary btn-sm" style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
                {pendingFac > 0 ? 'Review Requests →' : 'View All Requests'}
              </Link>
            </div>
          );
        }
        return null;
      })()}

      {/* Pending Evaluations Alert */}
      {stats.pending_evaluations > 0 && (
        <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.AlertTriangle /> Evaluations Pending Review</h3>
          </div>
          <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
            You have <strong>{stats.pending_evaluations}</strong> evaluations awaiting your review.
          </p>
          <Link to="/admin/evaluations" className="btn btn-primary btn-sm">
            Review Now →
          </Link>
        </div>
      )}
    </div>
  );
}

// Helper: fetch submissions using the existing API
async function submissionsFetch() {
  const { default: api } = await import('../../services/api');
  return api.get('/exams/submissions/');
}