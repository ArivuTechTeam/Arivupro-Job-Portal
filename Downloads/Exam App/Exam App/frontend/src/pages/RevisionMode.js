import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../services/api';
import '../styles/pages.css';

const RevisionMode = () => {
  const [revisionData, setRevisionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolvedItems, setResolvedItems] = useState(new Set());

  useEffect(() => {
    fetchRevisionData();
  }, []);

  const fetchRevisionData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await analyticsAPI.getRevisionData();
      setRevisionData(data);
    } catch (err) {
      setError(err.message || 'Failed to load revision data');
      console.error('Error loading revision data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveItem = async (itemId) => {
    try {
      await analyticsAPI.resolveRevisionItems([itemId]);
      setResolvedItems((prev) => new Set(prev).add(itemId));
    } catch (err) {
      console.error('Error resolving item:', err);
    }
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      high: 'badge-red',
      medium: 'badge-amber',
      low: 'badge-blue',
    };
    return colors[priority] || 'badge-blue';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      high: 'High Priority',
      medium: 'Medium Priority',
      low: 'Low Priority',
    };
    return labels[priority] || priority;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Revision Mode</h1>
          <p>Focus on what matters most before your exam</p>
        </div>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!revisionData) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Revision Mode</h1>
          <p>Focus on what matters most before your exam</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="empty-state">
          <p>No revision data available yet.</p>
          <p>Complete some practice papers to get personalized revision recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Revision Mode</h1>
        <p>Focus on what matters most before your exam</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{revisionData.totalItems || 0}</div>
          <div className="stat-label">Items to Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-value">{revisionData.resolvedCount || 0}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-value">{revisionData.highPriorityCount || 0}</div>
          <div className="stat-label">High Priority</div>
        </div>
      </div>

      {/* High Priority Items */}
      {revisionData.highPriorityItems && revisionData.highPriorityItems.length > 0 && (
        <section className="revision-section">
          <h2>High Priority Items</h2>
          <p className="section-description">
            These recurring mistakes need your immediate attention before the exam.
          </p>
          <div className="revision-items-list">
            {revisionData.highPriorityItems.map((item) => (
              <div
                key={item.id}
                className={`revision-item ${resolvedItems.has(item.id) ? 'resolved' : ''}`}
              >
                <div className="revision-item-header">
                  <div className="item-title-section">
                    <input
                      type="checkbox"
                      checked={resolvedItems.has(item.id)}
                      onChange={() => handleResolveItem(item.id)}
                      className="item-checkbox"
                      aria-label="Mark as resolved"
                    />
                    <h3 className="revision-item-title">{item.title}</h3>
                  </div>
                  <span className={`badge ${getPriorityBadgeColor(item.priority)}`}>
                    {getPriorityLabel(item.priority)}
                  </span>
                </div>

                <div className="revision-item-body">
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}

                  <div className="item-meta">
                    {item.occurrenceCount && (
                      <span className="meta-badge">
                        Appeared {item.occurrenceCount} time{item.occurrenceCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {item.marksLost && (
                      <span className="meta-badge">
                        {item.marksLost} marks at risk
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Weak Chapters */}
      {revisionData.weakChapters && revisionData.weakChapters.length > 0 && (
        <section className="revision-section">
          <h2>Weak Chapters</h2>
          <p className="section-description">
            Chapters where you're losing the most marks. Focus your revision here.
          </p>
          <div className="weak-chapters-list">
            {revisionData.weakChapters.map((chapter) => (
              <div key={chapter.id} className="weak-chapter-card">
                <div className="chapter-header">
                  <h3>{chapter.name}</h3>
                  <span className="marks-badge">{chapter.marksLost} marks lost</span>
                </div>

                <div className="progress-bar-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min((chapter.marksLost / chapter.totalMarks) * 100, 100)}%`,
                        backgroundColor: chapter.marksLost > chapter.totalMarks * 0.5
                          ? '#ef4444'
                          : chapter.marksLost > chapter.totalMarks * 0.25
                          ? '#f59e0b'
                          : '#10b981',
                      }}
                    ></div>
                  </div>
                </div>

                <div className="chapter-stats">
                  <span>Performance: {((1 - chapter.marksLost / chapter.totalMarks) * 100).toFixed(0)}%</span>
                  <span>{chapter.questionsMissed} questions missed</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Mistakes to Review */}
      {revisionData.topMistakesToReview && revisionData.topMistakesToReview.length > 0 && (
        <section className="revision-section">
          <h2>Top Mistakes to Review</h2>
          <p className="section-description">
            The most common mistakes you've made. Reviewing these will boost your score.
          </p>
          <div className="revision-items-list">
            {revisionData.topMistakesToReview.map((item) => (
              <div
                key={item.id}
                className={`revision-item ${resolvedItems.has(item.id) ? 'resolved' : ''}`}
              >
                <div className="revision-item-header">
                  <div className="item-title-section">
                    <input
                      type="checkbox"
                      checked={resolvedItems.has(item.id)}
                      onChange={() => handleResolveItem(item.id)}
                      className="item-checkbox"
                      aria-label="Mark as resolved"
                    />
                    <h3 className="revision-item-title">{item.title}</h3>
                  </div>
                </div>

                <div className="revision-item-body">
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}

                  <div className="item-meta">
                    {item.occurrenceCount && (
                      <span className="meta-badge">
                        Appeared {item.occurrenceCount} time{item.occurrenceCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {item.marksLost && (
                      <span className="meta-badge">
                        {item.marksLost} marks lost
                      </span>
                    )}
                    {item.category && (
                      <span className="meta-badge">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {(!revisionData.highPriorityItems || revisionData.highPriorityItems.length === 0) &&
        (!revisionData.weakChapters || revisionData.weakChapters.length === 0) &&
        (!revisionData.topMistakesToReview || revisionData.topMistakesToReview.length === 0) && (
        <div className="empty-state">
          <p>All caught up! No items need revision right now.</p>
          <p>Keep practicing to maintain your progress.</p>
        </div>
      )}
    </div>
  );
};

export default RevisionMode;
