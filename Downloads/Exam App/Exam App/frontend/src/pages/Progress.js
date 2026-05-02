import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../services/api';
import '../styles/pages.css';

const Progress = () => {
  const [overview, setOverview] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [weakAreas, setWeakAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [{ data: overviewData }, { data: gamificationData }, { data: weakAreasData }] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getGamification(),
        analyticsAPI.getWeakAreas(),
      ]);

      setOverview(overviewData);
      setGamification(gamificationData);
      setWeakAreas(weakAreasData || []);
    } catch (err) {
      setError(err.message || 'Failed to load progress data');
      console.error('Error loading progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLevelLabel = (level) => {
    const labels = {
      beginner: 'Beginner',
      improving: 'Improving',
      proficient: 'Proficient',
      advanced: 'Advanced',
      exam_ready: 'Exam Ready',
    };
    return labels[level] || level;
  };

  const getLevelColor = (level) => {
    const colors = {
      beginner: '#3b82f6',
      improving: '#f59e0b',
      proficient: '#10b981',
      advanced: '#8b5cf6',
      exam_ready: '#dc2626',
    };
    return colors[level] || '#6b7280';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getPerformanceLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Progress & Achievements</h1>
        </div>
        <div className="spinner"></div>
      </div>
    );
  }

  const scoreJourney = gamification?.journey || [];
  const achievements = gamification?.achievements || [];
  const improvementStreak = gamification?.improvementStreak || 0;
  const level = overview?.level || 'beginner';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Progress & Achievements</h1>
        <p>Your exam readiness journey</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Overview Stats */}
      {overview && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-value">{overview.totalAttempts || 0}</div>
            <div className="stat-label">Practice Attempts</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{overview.overallAverage || 0}%</div>
            <div className="stat-label">Overall Average</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-value">{overview.subjectsStudied || 0}</div>
            <div className="stat-label">Subjects Studied</div>
          </div>
        </div>
      )}

      {/* Level Indicator */}
      <section className="progress-section">
        <h2>Your Current Level</h2>
        <div className="level-card">
          <div className="level-badge" style={{ backgroundColor: getLevelColor(level) }}>
            {getLevelLabel(level).toUpperCase()}
          </div>
          <p className="level-description">
            {level === 'exam_ready' && "You're prepared for the exam! Keep practicing to maintain this level."}
            {level === 'advanced' && "You're doing great! Focus on weak areas to reach exam ready status."}
            {level === 'proficient' && "Good progress! Continue practicing to improve further."}
            {level === 'improving' && "You're on the right track. Keep practicing consistently."}
            {level === 'beginner' && "Start with basics and gradually increase difficulty."}
          </p>
        </div>
      </section>

      {/* Score Journey */}
      {scoreJourney.length > 0 && (
        <section className="progress-section">
          <h2>Score Journey</h2>
          <p className="section-description">
            Your performance across recent attempts
          </p>
          <div className="score-journey-container">
            <div className="journey-chart">
              {scoreJourney.map((attempt, index) => {
                const maxScore = 100;
                const percentage = (attempt.score / maxScore) * 100;
                const color = getScoreColor(attempt.score);

                return (
                  <div key={index} className="journey-item">
                    <div className="journey-bar-wrapper">
                      <div
                        className="journey-bar"
                        style={{
                          height: `${Math.max(percentage, 10)}%`,
                          backgroundColor: color,
                        }}
                        title={`Attempt ${index + 1}: ${attempt.score}/${maxScore}`}
                      ></div>
                    </div>
                    <div className="journey-label">
                      <div className="journey-score">{attempt.score}</div>
                      <div className="journey-performance">
                        {getPerformanceLabel(attempt.score)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Score Summary */}
            {scoreJourney.length >= 2 && (
              <div className="score-summary">
                <p className="summary-text">
                  Your journey: {scoreJourney[0].score} → {scoreJourney[Math.floor(scoreJourney.length / 2)].score} → {scoreJourney[scoreJourney.length - 1].score}
                </p>
                {scoreJourney[scoreJourney.length - 1].score > scoreJourney[0].score && (
                  <p className="improvement-text">
                    Great improvement! You've gained {scoreJourney[scoreJourney.length - 1].score - scoreJourney[0].score} points.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Improvement Streak */}
      {improvementStreak > 0 && (
        <section className="progress-section">
          <div className="streak-card">
            <div className="streak-icon">🔥</div>
            <div className="streak-content">
              <h3>Improvement Streak</h3>
              <p>{improvementStreak} consecutive attempts with improvement</p>
            </div>
          </div>
        </section>
      )}

      {/* Weak Areas */}
      {weakAreas.length > 0 && (
        <section className="progress-section">
          <h2>Areas to Improve</h2>
          <p className="section-description">
            Focus on these areas to boost your overall score
          </p>
          <div className="weak-areas-grid">
            {weakAreas.map((area) => {
              const accuracy = area.correctCount ? (area.correctCount / (area.correctCount + area.incorrectCount)) * 100 : 0;
              const color = getScoreColor(accuracy);

              return (
                <div key={area.id} className="weak-area-card">
                  <h3>{area.name}</h3>
                  <div className="area-stats">
                    <div className="stat">
                      <span className="stat-label">Accuracy</span>
                      <span className="stat-value" style={{ color }}>
                        {accuracy.toFixed(0)}%
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Attempts</span>
                      <span className="stat-value">
                        {(area.correctCount || 0) + (area.incorrectCount || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${accuracy}%`,
                        backgroundColor: color,
                      }}
                    ></div>
                  </div>

                  <p className="area-recommendation">
                    {accuracy >= 80 && 'Great work! Keep reinforcing this topic.'}
                    {accuracy >= 60 && accuracy < 80 && 'Good progress. Review key concepts.'}
                    {accuracy >= 40 && accuracy < 60 && 'Focus on this area. Practice more questions.'}
                    {accuracy < 40 && 'Priority area. Spend more time on this topic.'}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <section className="progress-section">
          <h2>Achievements</h2>
          <p className="section-description">
            Badges you've earned through your progress
          </p>
          <div className="achievements-grid">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="achievement-badge">
                <div className="achievement-icon">{achievement.icon || '⭐'}</div>
                <h4>{achievement.title}</h4>
                <p>{achievement.description}</p>
                {achievement.unlockedAt && (
                  <span className="achievement-date">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State for Achievements */}
      {achievements.length === 0 && (
        <section className="progress-section">
          <div className="empty-state">
            <p>No achievements unlocked yet.</p>
            <p>Keep practicing to earn badges!</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Progress;
