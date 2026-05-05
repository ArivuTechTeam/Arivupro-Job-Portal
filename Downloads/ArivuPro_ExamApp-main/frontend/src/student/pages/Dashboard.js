import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, evaluationsAPI, analyticsAPI } from '../../services/api';

const Icons = {
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>,
  CheckCircle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  TrendingUp: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  Flame: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Upload: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Award: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  Star: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

export function Dashboard() {
  const { user, isAdmin } = useAuth();

  const [stats, setStats] = useState({
    total_submissions: 0,
    evaluated_submissions: 0,
    average_score: 0,
    improvement_streak: 0,
  });

  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard stats, evaluations, and gamification in parallel
        const [statsRes, evalRes, gamRes] = await Promise.allSettled([
          authAPI.getDashboardStats(),
          evaluationsAPI.getHistory(),
          analyticsAPI.getGamification(),
        ]);

        if (statsRes.status === 'fulfilled') {
          const d = statsRes.value.data;
          setStats({
            total_submissions: d.total_submissions || 0,
            evaluated_submissions: d.evaluated_count || 0,
            average_score: d.avg_percentage || 0,
            improvement_streak: d.improvement_streak || 0,
          });
        }

        if (evalRes.status === 'fulfilled') {
          const d = evalRes.value.data;
          setRecentEvaluations(Array.isArray(d) ? d.slice(0, 5) : (d.results || []).slice(0, 5));
        }

        if (gamRes.status === 'fulfilled') {
          const d = gamRes.value.data;
          setGamification(d);
          if (d.journey && Array.isArray(d.journey)) {
            setScoreHistory(d.journey);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getRoleSubtitle = () => {
    if (isAdmin) {
      return 'Administrator Dashboard';
    }
    return 'Your Exam Performance Overview';
  };

  const getStatIcon = (type) => {
    switch (type) {
      case 'submissions': return <Icons.FileText />;
      case 'evaluated': return <Icons.CheckCircle />;
      case 'score': return <Icons.TrendingUp />;
      case 'streak': return <Icons.Flame />;
      default: return null;
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-poor';
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p className="subtitle">{getRoleSubtitle()}</p>
          </div>
        </div>
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
          <h1>Dashboard</h1>
          <p className="subtitle">{getRoleSubtitle()}</p>
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

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">{getStatIcon('submissions')}</div>
          <div style={{ flex: 1 }}>
            <div className="stat-value">{stats.total_submissions || 0}</div>
            <div className="stat-label">Total Submissions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">{getStatIcon('evaluated')}</div>
          <div style={{ flex: 1 }}>
            <div className="stat-value">{stats.evaluated_submissions || 0}</div>
            <div className="stat-label">Evaluated</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">{getStatIcon('score')}</div>
          <div style={{ flex: 1 }}>
            <div className={`stat-value ${getScoreClass(stats.average_score)}`}>
              {stats.average_score ? `${Math.round(stats.average_score)}%` : 'N/A'}
            </div>
            <div className="stat-label">Average Score</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">{getStatIcon('streak')}</div>
          <div style={{ flex: 1 }}>
            <div className="stat-value">{stats.improvement_streak || 0}</div>
            <div className="stat-label">Improvement Streak</div>
          </div>
        </div>
      </div>

      {/* Admin Pending Evaluations */}
      {isAdmin && stats.pending_evaluations > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div className="card-header">
            <h3 className="card-title">Pending Review</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <p style={{ marginBottom: '1rem', color: '#475569' }}>
              You have <strong>{stats.pending_evaluations}</strong> evaluations pending approval.
            </p>
            <Link to="/admin/evaluations" className="btn btn-primary btn-sm">
              Review Pending Evaluations
            </Link>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/upload" className="btn btn-primary" style={{ background: 'var(--text)', color: 'var(--bg-card)' }}>
              <Icons.Upload /> Upload Answer Script
            </Link>
          </div>
        </div>

        {/* Score Trend */}
        {scoreHistory && scoreHistory.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Score Trend</h3>
            </div>
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '120px' }}>
                {scoreHistory.map((entry, idx) => {
                  const maxScore = Math.max(...scoreHistory.map(e => e.score || 0), 100);
                  const percentage = ((entry.score || 0) / maxScore) * 100;
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        height: `${Math.max(percentage, 5)}%`,
                        background: getScoreClass(entry.score),
                        borderRadius: '0.25rem',
                        position: 'relative',
                        minHeight: '20px',
                        backgroundColor: entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#3b82f6' : entry.score >= 40 ? '#f59e0b' : '#ef4444',
                      }}
                      title={`${entry.date || `Attempt ${idx + 1}`}: ${entry.score || 0}%`}
                    ></div>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'center' }}>
                Last {scoreHistory.length} attempts
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Evaluations */}
      {recentEvaluations.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Evaluations</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>
                    Paper
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>
                    Score
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentEvaluations.map((evaluation) => (
                  <tr key={evaluation.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem', color: '#1e293b' }}>
                      {evaluation.exam_paper_title || 'Paper'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={getScoreClass(parseFloat(evaluation.percentage) || 0)}>
                        {evaluation.percentage != null ? `${parseFloat(evaluation.percentage).toFixed(1)}%` : 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        className={`badge ${
                          evaluation.status === 'approved'
                            ? 'badge-green'
                            : evaluation.status === 'pending'
                            ? 'badge-amber'
                            : 'badge-blue'
                        }`}
                      >
                        {evaluation.status || 'pending'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(evaluation.created_at || evaluation.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gamification Section */}
      {gamification && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.Award /> Your Journey</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            {gamification.journey_text && (
              <p style={{ color: '#475569', marginBottom: '1rem', lineHeight: '1.6' }}>
                {gamification.journey_text}
              </p>
            )}

            {gamification.achievements && gamification.achievements.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>
                  Achievements
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
                  {gamification.achievements.map((achievement, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem',
                        background: '#f0f9ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '0.5rem',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', justifyContent: 'center' }}>
                        <Icons.Star />
                      </div>
                      <p style={{ color: '#1e40af', fontWeight: 500 }}>{achievement.name || 'Achievement'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
