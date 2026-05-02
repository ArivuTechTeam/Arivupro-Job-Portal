import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../services/api';
import '../styles/pages.css';

const MistakeLibrary = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [mistakes, setMistakes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch summary
      const { data: summaryData } = await analyticsAPI.getMistakeSummary();
      setSummary(summaryData);

      // Fetch mistakes based on active tab
      let mistakesData;
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};

      if (activeTab === 'all') {
        const { data } = await analyticsAPI.getMistakes(params);
        mistakesData = data;
      } else if (activeTab === 'recurring') {
        const { data } = await analyticsAPI.getRecurringMistakes();
        mistakesData = data;
      } else if (activeTab === 'category') {
        const { data } = await analyticsAPI.getMistakes(params);
        mistakesData = data;
      }

      setMistakes(Array.isArray(mistakesData) ? mistakesData : []);
    } catch (err) {
      setError(err.message || 'Failed to load mistake library');
      console.error('Error loading mistake library:', err);
    } finally {
      setLoading(false);
    }
  };

  const categoryColors = {
    conceptual: 'badge-blue',
    presentation: 'badge-green',
    calculation: 'badge-amber',
    step_loss: 'badge-red',
  };

  const getCategoryLabel = (category) => {
    const labels = {
      conceptual: 'Conceptual',
      presentation: 'Presentation',
      calculation: 'Calculation',
      step_loss: 'Step Loss',
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Mistake Library</h1>
          <p>Your personal mistake notebook - learn from every error</p>
        </div>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Mistake Library</h1>
        <p>Your personal mistake notebook - learn from every error</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Summary Section */}
      {summary && (
        <div className="summary-section">
          <h2>Your Mistake Summary</h2>
          <div className="grid-2">
            {summary.categories && summary.categories.map((cat) => (
              <div key={cat.category} className="card">
                <div className="card-header">
                  <span className={`badge ${categoryColors[cat.category]}`}>
                    {getCategoryLabel(cat.category)}
                  </span>
                </div>
                <div className="card-content">
                  <div className="stat-value">{cat.count}</div>
                  <div className="stat-label">mistakes</div>
                  <div className="stat-label" style={{ marginTop: '8px', fontSize: '14px' }}>
                    {cat.marksLost} marks lost
                  </div>
                </div>
              </div>
            ))}
            <div className="card">
              <div className="card-header">
                <span className="badge badge-purple">Total</span>
              </div>
              <div className="card-content">
                <div className="stat-value">{summary.totalCount || 0}</div>
                <div className="stat-label">total mistakes</div>
                <div className="stat-label" style={{ marginTop: '8px', fontSize: '14px' }}>
                  {summary.totalMarksLost || 0} marks lost
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Mistakes
        </button>
        <button
          className={`tab ${activeTab === 'recurring' ? 'active' : ''}`}
          onClick={() => setActiveTab('recurring')}
        >
          Recurring
        </button>
        <button
          className={`tab ${activeTab === 'category' ? 'active' : ''}`}
          onClick={() => setActiveTab('category')}
        >
          By Category
        </button>
      </div>

      {/* Filters */}
      {activeTab === 'category' && (
        <div className="filter-section">
          <label htmlFor="category-filter">Filter by Category:</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-select"
          >
            <option value="all">All Categories</option>
            <option value="conceptual">Conceptual</option>
            <option value="presentation">Presentation</option>
            <option value="calculation">Calculation</option>
            <option value="step_loss">Step Loss</option>
          </select>
        </div>
      )}

      {/* Mistakes List */}
      <div className="mistakes-list">
        {mistakes.length === 0 ? (
          <div className="empty-state">
            <p>No mistakes found in {activeTab === 'recurring' ? 'recurring mistakes' : 'your library'}.</p>
            <p>Great job! Keep reviewing to learn more.</p>
          </div>
        ) : (
          mistakes.map((mistake) => (
            <div
              key={mistake.id}
              className={`mistake-card mistake-card-${mistake.category}`}
            >
              <div className="mistake-card-header">
                <div className="mistake-badges">
                  <span className={`badge ${categoryColors[mistake.category]}`}>
                    {getCategoryLabel(mistake.category)}
                  </span>
                  {mistake.isRecurring && (
                    <span className="badge badge-red">Recurring</span>
                  )}
                </div>
                <div className="mistake-marks">
                  <span className="marks-lost">{mistake.marksLost} marks</span>
                </div>
              </div>

              <div className="mistake-card-body">
                <h3 className="mistake-description">{mistake.description}</h3>

                <div className="mistake-meta">
                  <span className="meta-item">
                    <strong>Paper:</strong> {mistake.paperTitle}
                  </span>
                  <span className="meta-item">
                    <strong>Question:</strong> {mistake.questionNumber}
                  </span>
                </div>

                {mistake.suggestion && (
                  <div className="mistake-suggestion">
                    <strong>How to improve:</strong>
                    <p>{mistake.suggestion}</p>
                  </div>
                )}

                {mistake.topicsToCover && mistake.topicsToCover.length > 0 && (
                  <div className="topics-section">
                    <strong>Topics to review:</strong>
                    <div className="topics-list">
                      {mistake.topicsToCover.map((topic, idx) => (
                        <span key={idx} className="topic-tag">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MistakeLibrary;
