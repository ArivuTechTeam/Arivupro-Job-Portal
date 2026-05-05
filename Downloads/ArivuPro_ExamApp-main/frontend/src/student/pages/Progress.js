import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';

const Icons = {
  FileText: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>,
  BarChart2: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Book: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
  Flame: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Star: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  TrendingUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
};

const getScoreColor = (score) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

const getLevelLabel = (level) => {
  const labels = { beginner: 'Beginner', improving: 'Improving', proficient: 'Proficient', advanced: 'Advanced', exam_ready: 'Exam Ready' };
  return labels[level] || (level ? level.replace(/_/g, ' ') : 'Beginner');
};

const getLevelColor = (level) => {
  const colors = { beginner: '#3b82f6', improving: '#f59e0b', proficient: '#10b981', advanced: '#8b5cf6', exam_ready: '#dc2626' };
  return colors[level] || '#6b7280';
};

export default function Progress() {
  const [overview, setOverview] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [weakAreas, setWeakAreas] = useState({ weak_chapters: [], mistake_patterns: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [ovRes, gamRes, weakRes] = await Promise.all([
          analyticsAPI.getOverview(),
          analyticsAPI.getGamification(),
          analyticsAPI.getWeakAreas(),
        ]);
        setOverview(ovRes.data);
        setGamification(gamRes.data);
        setWeakAreas(weakRes.data || { weak_chapters: [], mistake_patterns: [] });
      } catch (err) {
        setError('Failed to load progress data. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header"><div><h1>Progress &amp; Analytics</h1><p className="subtitle">Your Score Journey</p></div></div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
      </div>
    );
  }

  const journey = gamification?.journey || [];
  const achievements = gamification?.achievements || [];
  const streak = gamification?.improvement_streak || 0;
  const level = (overview?.subjects || [])[0]?.current_level || 'beginner';
  const totalAttempts = overview?.total_attempts || 0;
  const overallAvg = overview ? parseFloat(overview.overall_avg || 0).toFixed(1) : '0.0';
  const totalSubjects = overview?.total_subjects || 0;
  const weakChapters = weakAreas.weak_chapters || [];
  const mistakePatterns = weakAreas.mistake_patterns || [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Progress &amp; Analytics</h1>
          <p className="subtitle">Your Score Journey &amp; Weak Areas</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #fecaca', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Icons.FileText /></div>
          <div><div className="stat-value">{totalAttempts}</div><div className="stat-label">Total Attempts</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Icons.BarChart2 /></div>
          <div><div className="stat-value">{overallAvg}%</div><div className="stat-label">Overall Average</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Icons.Book /></div>
          <div><div className="stat-value">{totalSubjects}</div><div className="stat-label">Subjects Studied</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><Icons.Flame /></div>
          <div><div className="stat-value">{streak}</div><div className="stat-label">Improvement Streak</div></div>
        </div>
      </div>

      {/* Level indicator */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><h3 className="card-title">Current Level</h3></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
          <span style={{ background: getLevelColor(level), color: '#fff', padding: '0.375rem 1rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.875rem' }}>{getLevelLabel(level)}</span>
          <span style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
            {level === 'exam_ready' && "You're prepared for the exam! Keep practicing."}
            {level === 'advanced' && "Great work! Focus on weak areas to reach exam ready."}
            {level === 'proficient' && "Good progress! Continue practicing to improve."}
            {level === 'improving' && "You're on the right track. Keep practicing consistently."}
            {level === 'beginner' && "Start with basics and gradually increase difficulty."}
          </span>
        </div>
      </div>

      {/* Score Journey */}
      {journey.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.TrendingUp /> Score Journey</h3></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '140px', padding: '0.5rem 0 1rem' }}>
            {journey.map((entry, idx) => {
              const pct = Math.min(entry.score || 0, 100);
              const color = getScoreColor(pct);
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-lighter)' }}>{pct}%</div>
                  <div style={{ width: '100%', height: `${Math.max(pct, 8)}%`, background: color, borderRadius: '4px 4px 0 0', minHeight: '12px' }} title={`${entry.paper || `Attempt ${idx + 1}`}: ${pct}%`} />
                </div>
              );
            })}
          </div>
          {journey.length >= 2 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center', marginTop: '0.5rem' }}>
              {journey[0].score}% → {journey[journey.length - 1].score}% across {journey.length} attempt{journey.length !== 1 ? 's' : ''}
              {journey[journey.length - 1].score > journey[0].score && ` (+${journey[journey.length - 1].score - journey[0].score}pts improvement)`}
            </p>
          )}
        </div>
      )}

      {/* Streak */}
      {streak > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #f97316' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Icons.Flame />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{streak}-Attempt Improvement Streak</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>You've improved in your last {streak} consecutive attempts. Keep it up!</div>
            </div>
          </div>
        </div>
      )}

      {/* Weak Chapters */}
      {weakChapters.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><h3 className="card-title">Weak Chapters — Focus Here</h3></div>
          {weakChapters.map((ch, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: i < weakChapters.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ch.chapter_name || 'General'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{ch.count} mistake{ch.count !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.875rem' }}>-{parseFloat(ch.total_marks_lost || 0).toFixed(1)} marks</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mistake Patterns */}
      {mistakePatterns.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><h3 className="card-title">Mistake Patterns</h3></div>
          {mistakePatterns.map((mp, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: i < mistakePatterns.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
              <div style={{ fontWeight: 500, fontSize: '0.875rem', textTransform: 'capitalize' }}>{(mp.category || 'other').replace(/_/g, ' ')}</div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                <span>{mp.count} occurrence{mp.count !== 1 ? 's' : ''}</span>
                <span style={{ color: '#ef4444' }}>-{parseFloat(mp.total_marks_lost || 0).toFixed(1)} marks</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.Star /> Achievements</h3></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '0.5rem 0' }}>
            {achievements.map((ach, i) => (
              <div key={i} style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 'var(--radius)', padding: '0.5rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icons.Star />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#854d0e' }}>{ach.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalAttempts === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No data yet</h3>
          <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Upload and get AI feedback on exam papers to see your progress here.</p>
        </div>
      )}
    </div>
  );
}
