/**
 * Statistics - Uses existing /api/exams/ endpoints for analytics
 */

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Edit3, 
  Book, 
  ClipboardList, 
  TrendingUp, 
  Trophy, 
  TrendingDown, 
  Target 
} from 'lucide-react';
import { examsAPI, evaluationsAPI } from '../../services/api';
import './AdminPanel.css';

export default function Statistics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [papersRes, subjectsRes, submissionsRes, evaluationsRes] = await Promise.allSettled([
        examsAPI.getPapers(),
        examsAPI.getSubjects(),
        submissionsFetch(),
        evaluationsAPI.list(),
      ]);

      const papers = extractData(papersRes);
      const subjects = extractData(subjectsRes);
      const submissions = extractData(submissionsRes);
      const evaluations = extractData(evaluationsRes);

      // Calculate statistics
      const completedEvals = evaluations.filter(e => e.status === 'completed' || e.status === 'approved');
      const pendingEvals = evaluations.filter(e => e.status === 'pending');
      const publishedPapers = papers.filter(p => p.is_published);

      // Score distribution
      const scores = completedEvals
        .map(e => e.percentage)
        .filter(s => s != null);
      const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
      const highestScore = scores.length ? Math.max(...scores).toFixed(1) : 'N/A';
      const lowestScore = scores.length ? Math.min(...scores).toFixed(1) : 'N/A';

      // Submissions by status
      const pendingSubs = submissions.filter(s => s.status === 'pending').length;
      const evaluatedSubs = submissions.filter(s => s.status === 'evaluated').length;

      setData({
        totalPapers: papers.length,
        publishedPapers: publishedPapers.length,
        draftPapers: papers.length - publishedPapers.length,
        totalSubjects: subjects.length,
        totalSubmissions: submissions.length,
        pendingSubmissions: pendingSubs,
        evaluatedSubmissions: evaluatedSubs,
        totalEvaluations: evaluations.length,
        completedEvaluations: completedEvals.length,
        pendingEvaluations: pendingEvals.length,
        avgScore,
        highestScore,
        lowestScore,
        totalScores: scores.length,
      });
    } catch (err) {
      setError('Failed to load statistics.');
      console.error('Stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>System Statistics</h1>
            <p className="subtitle">Analytics and reports</p>
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
          <h1>System Statistics</h1>
          <p className="subtitle">Detailed analytics and reports</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchStatistics} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {data && (
        <>
          {/* Papers Overview */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={18} /> Papers Overview</h3>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue"><FileText size={20} /></div>
                <div>
                  <div className="stat-value">{data.totalPapers}</div>
                  <div className="stat-label">Total Papers</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green"><CheckCircle2 size={20} /></div>
                <div>
                  <div className="stat-value">{data.publishedPapers}</div>
                  <div className="stat-label">Published</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon amber"><Edit3 size={20} /></div>
                <div>
                  <div className="stat-value">{data.draftPapers}</div>
                  <div className="stat-label">Drafts</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue"><Book size={20} /></div>
                <div>
                  <div className="stat-value">{data.totalSubjects}</div>
                  <div className="stat-label">Subjects</div>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions & Evaluations */}
          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ClipboardList size={18} /> Submissions</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--border-light)', borderRadius: 'var(--radius)' }}>
                  <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text)' }}>{data.totalSubmissions}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--border-light)', borderRadius: 'var(--radius)' }}>
                  <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Pending</span>
                  <span className="badge badge-amber">{data.pendingSubmissions}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--border-light)', borderRadius: 'var(--radius)' }}>
                  <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Evaluated</span>
                  <span className="badge badge-green">{data.evaluatedSubmissions}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={18} /> Evaluations</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--border-light)', borderRadius: 'var(--radius)' }}>
                  <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text)' }}>{data.totalEvaluations}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--border-light)', borderRadius: 'var(--radius)' }}>
                  <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Completed</span>
                  <span className="badge badge-green">{data.completedEvaluations}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--border-light)', borderRadius: 'var(--radius)' }}>
                  <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Pending Review</span>
                  <span className="badge badge-amber">{data.pendingEvaluations}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Score Analytics */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18} /> Score Analytics</h3>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon green"><TrendingUp size={20} /></div>
                <div>
                  <div className="stat-value">{data.avgScore}{data.avgScore !== 'N/A' ? '%' : ''}</div>
                  <div className="stat-label">Average Score</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue"><Trophy size={20} /></div>
                <div>
                  <div className="stat-value">{data.highestScore}{data.highestScore !== 'N/A' ? '%' : ''}</div>
                  <div className="stat-label">Highest Score</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon red"><TrendingDown size={20} /></div>
                <div>
                  <div className="stat-value">{data.lowestScore}{data.lowestScore !== 'N/A' ? '%' : ''}</div>
                  <div className="stat-label">Lowest Score</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon amber"><Target size={20} /></div>
                <div>
                  <div className="stat-value">{data.totalScores}</div>
                  <div className="stat-label">Total Scored</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function extractData(result) {
  if (result.status === 'fulfilled') {
    const d = result.value.data;
    return d?.results || d || [];
  }
  return [];
}

async function submissionsFetch() {
  const { default: api } = await import('../../services/api');
  return api.get('/exams/submissions/');
}
