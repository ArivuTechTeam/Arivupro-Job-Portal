/**
 * Statistics - Uses existing /api/exams/ endpoints for analytics
 */

import React, { useState, useEffect } from 'react';
import { examsAPI, evaluationsAPI } from '../../services/api';
import '../styles/AdminPanel.css';

const Icons = {
  Refresh: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>,
  FileText: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>,
  Book: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
  ClipboardList: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>,
  CheckCircle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Edit3: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  BarChart2: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  TrendingUp: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  TrendingDown: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>,
  Award: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  Target: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
};

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
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={fetchStatistics}>
          <Icons.Refresh /> Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {data && (
        <>
          {/* Papers Overview */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.FileText /> Papers Overview</h3>
            </div>
            <div style={{ padding: '1rem' }}>
            <div className="stats-grid" style={{ marginBottom: 0 }}>
              <div className="stat-card">
                <div className="stat-icon blue"><Icons.FileText /></div>
                <div>
                  <div className="stat-value">{data.totalPapers}</div>
                  <div className="stat-label">Total Papers</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green"><Icons.CheckCircle /></div>
                <div>
                  <div className="stat-value">{data.publishedPapers}</div>
                  <div className="stat-label">Published</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon amber"><Icons.Edit3 /></div>
                <div>
                  <div className="stat-value">{data.draftPapers}</div>
                  <div className="stat-label">Drafts</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue"><Icons.Book /></div>
                <div>
                  <div className="stat-value">{data.totalSubjects}</div>
                  <div className="stat-label">Subjects</div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Submissions & Evaluations */}
          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.ClipboardList /> Submissions</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text2)', fontWeight: 500 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text1)' }}>{data.totalSubmissions}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text2)', fontWeight: 500 }}>Pending</span>
                  <span className="badge badge-amber">{data.pendingSubmissions}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text2)', fontWeight: 500 }}>Evaluated</span>
                  <span className="badge badge-green">{data.evaluatedSubmissions}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.CheckCircle /> Evaluations</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text2)', fontWeight: 500 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text1)' }}>{data.totalEvaluations}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text2)', fontWeight: 500 }}>Completed</span>
                  <span className="badge badge-green">{data.completedEvaluations}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text2)', fontWeight: 500 }}>Pending Review</span>
                  <span className="badge badge-amber">{data.pendingEvaluations}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Score Analytics */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.BarChart2 /> Score Analytics</h3>
            </div>
            <div style={{ padding: '1rem' }}>
            <div className="stats-grid" style={{ marginBottom: 0 }}>
              <div className="stat-card">
                <div className="stat-icon green"><Icons.TrendingUp /></div>
                <div>
                  <div className="stat-value">{data.avgScore}{data.avgScore !== 'N/A' ? '%' : ''}</div>
                  <div className="stat-label">Average Score</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue"><Icons.Award /></div>
                <div>
                  <div className="stat-value">{data.highestScore}{data.highestScore !== 'N/A' ? '%' : ''}</div>
                  <div className="stat-label">Highest Score</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon red"><Icons.TrendingDown /></div>
                <div>
                  <div className="stat-value">{data.lowestScore}{data.lowestScore !== 'N/A' ? '%' : ''}</div>
                  <div className="stat-label">Lowest Score</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon amber"><Icons.Target /></div>
                <div>
                  <div className="stat-value">{data.totalScores}</div>
                  <div className="stat-label">Total Scored</div>
                </div>
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
