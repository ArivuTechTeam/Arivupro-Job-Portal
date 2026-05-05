import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../../services/api';
import '../../shared/styles/pages.css';

const Icons = {
  ClipboardList: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>,
  CheckCircle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  AlertCircle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

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
      // Normalize backend snake_case fields to what the component expects
      const highPriorityItems = (data.revision_items || []).filter(i => i.priority === 'high');
      const normalized = {
        totalItems: data.total_items || 0,
        resolvedCount: (data.revision_items || []).filter(i => i.is_resolved).length,
        highPriorityCount: highPriorityItems.length,
        highPriorityItems: (data.revision_items || []).map(i => ({
          ...i,
          occurrenceCount: i.occurrence_count,
          marksLost: null,
        })),
        weakChapters: (data.weak_chapters || []).map(c => ({
          id: c.chapter_name,
          name: c.chapter_name,
          marksLost: parseFloat(c.total_lost || 0).toFixed(1),
          totalMarks: Math.max(parseFloat(c.total_lost || 0) * 2, 20),
          questionsMissed: c.count || 0,
        })),
        topMistakesToReview: (data.recurring_mistakes || []).map(m => ({
          id: m.id,
          title: m.description || 'Recurring Mistake',
          description: m.suggestion || '',
          occurrenceCount: null,
          marksLost: m.marks_lost,
          category: m.category,
        })),
      };
      setRevisionData(normalized);
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
          <div className="stat-icon" style={{ display: 'flex', justifyContent: 'center' }}><Icons.ClipboardList /></div>
          <div className="stat-value">{revisionData.totalItems || 0}</div>
          <div className="stat-label">Items to Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ display: 'flex', justifyContent: 'center' }}><Icons.CheckCircle /></div>
          <div className="stat-value">{revisionData.resolvedCount || 0}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ display: 'flex', justifyContent: 'center' }}><Icons.AlertCircle /></div>
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
