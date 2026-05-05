import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../../services/api';
import '../../shared/styles/pages.css';

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

      const { data: summaryArr } = await analyticsAPI.getMistakeSummary();
      // Backend returns array of {category, count, total_marks_lost}
      const totalCount = Array.isArray(summaryArr) ? summaryArr.reduce((s, c) => s + (c.count || 0), 0) : 0;
      const totalMarksLost = Array.isArray(summaryArr) ? summaryArr.reduce((s, c) => s + (c.total_marks_lost || 0), 0) : 0;
      setSummary({ categories: Array.isArray(summaryArr) ? summaryArr : [], totalCount, totalMarksLost });

      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      let mistakesRes;
      if (activeTab === 'recurring') {
        mistakesRes = await analyticsAPI.getRecurringMistakes();
      } else {
        mistakesRes = await analyticsAPI.getMistakes(params);
      }
      const raw = mistakesRes.data;
      setMistakes(Array.isArray(raw) ? raw : (raw?.results || []));
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
                    {parseFloat(cat.total_marks_lost || 0).toFixed(1)} marks lost
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
                  {mistake.is_recurring && (
                    <span className="badge badge-red">Recurring</span>
                  )}
                </div>
                <div className="mistake-marks">
                  <span className="marks-lost">{mistake.marks_lost} marks</span>
                </div>
              </div>

              <div className="mistake-card-body">
                <h3 className="mistake-description">{mistake.description}</h3>

                <div className="mistake-meta">
                  {mistake.paper_title && (
                    <span className="meta-item">
                      <strong>Paper:</strong> {mistake.paper_title}
                    </span>
                  )}
                  {mistake.question_number && (
                    <span className="meta-item">
                      <strong>Question:</strong> {mistake.question_number}
                    </span>
                  )}
                </div>

                {mistake.suggestion && (
                  <div className="mistake-suggestion">
                    <strong>How to improve:</strong>
                    <p>{mistake.suggestion}</p>
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
