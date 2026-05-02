import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { submissionsAPI, evaluationsAPI } from '../services/api';

export function EvaluationReport() {
  const { submissionId } = useParams();

  const [report, setReport] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch report
        const { data: reportData } = await submissionsAPI.getReport(submissionId);
        setReport(reportData);

        // Fetch ranking if paper is available
        if (reportData?.exam_paper?.id) {
          try {
            const { data: rankingData } = await evaluationsAPI.getRanking(reportData.exam_paper.id);
            setRanking(rankingData);
          } catch (err) {
            console.warn('Could not fetch ranking:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load evaluation report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) {
      fetchReportData();
    }
  }, [submissionId]);

  // Helper: Get score color class
  const getScoreClass = (score, total = 100) => {
    const percentage = (score / total) * 100;
    if (percentage >= 70) return 'score-excellent';
    if (percentage >= 50) return 'score-good';
    if (percentage >= 35) return 'score-average';
    return 'score-poor';
  };

  // Helper: Get progress bar color
  const getProgressBarColor = (score, total = 100) => {
    const percentage = (score / total) * 100;
    if (percentage >= 70) return 'green';
    if (percentage >= 50) return 'blue';
    if (percentage >= 35) return 'amber';
    return 'red';
  };

  // Helper: Toggle question expansion
  const toggleQuestionExpanded = (questionId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Helper: Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Evaluation Report</h1>
        </div>
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #fecaca',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Error Loading Report</div>
          <div style={{ fontSize: '0.875rem' }}>{error}</div>
        </div>
        <Link to="/submissions" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Back to Submissions
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Evaluation Report</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ color: '#64748b' }}>No evaluation data available.</p>
          <Link to="/submissions" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: '1rem' }}>
            Back to Submissions
          </Link>
        </div>
      </div>
    );
  }

  const totalScore = report.total_score || 0;
  const totalMarks = report.total_marks || 100;
  const percentage = (totalScore / totalMarks) * 100;
  const presentationScore = report.presentation_score || 0;
  const improvementPotential = Math.ceil(totalScore * 1.2);

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>📊 Evaluation Report</h1>
          <p className="subtitle">Detailed analysis of your answer script evaluation</p>
        </div>
        <div>
          <Link to="/submissions" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            ← Back to Submissions
          </Link>
        </div>
      </div>

      {/* 1. Header Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
              {report.exam_paper?.title || 'Exam Paper'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              <strong>Subject:</strong> {report.exam_paper?.subject || 'N/A'}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              <strong>Evaluation Date:</strong> {formatDate(report.evaluation_date)}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              <strong>Submission Date:</strong> {formatDate(report.submission_date)}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
              Status
            </div>
            <span className={`badge badge-green`} style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}>
              ✓ Evaluated
            </span>
          </div>
        </div>
      </div>

      {/* 2. Summary Section with Score Display */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">📈 Score Summary</h3>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Total Score */}
          <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
              Total Score
            </div>
            <div className="score-display">
              <span className={`score-value ${getScoreClass(totalScore, totalMarks)}`}>{totalScore}</span>
              <span className="score-total">/ {totalMarks}</span>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
              {percentage.toFixed(1)}%
            </div>
          </div>

          {/* Presentation Score */}
          <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
              Presentation Score
            </div>
            <div className="score-display">
              <span className="score-value" style={{ color: '#059669' }}>
                {presentationScore}
              </span>
              <span className="score-total">/ 20</span>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
              {((presentationScore / 20) * 100).toFixed(0)}%
            </div>
          </div>

          {/* Improvement Potential */}
          <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
              Improvement Potential
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', marginBottom: '0.25rem' }}>
              Target: 80+
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Potential: {improvementPotential}/100
            </div>
          </div>

          {/* Rank Info */}
          {ranking && (
            <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Your Rank
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', marginBottom: '0.25rem' }}>
                #{ranking.rank || 'N/A'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                of {ranking.total_students || 'N/A'} students
              </div>
            </div>
          )}
        </div>

        {/* Overall Progress Bar */}
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#1e293b' }}>
            Overall Performance
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${getProgressBarColor(totalScore, totalMarks)}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 3. ICAI Presentation Score */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">🎨 ICAI Presentation Score Breakdown</h3>
        </div>

        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {/* Format */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Format</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                {report.presentation_format || 0}/5
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill green"
                style={{ width: `${Math.min((report.presentation_format || 0) * 20, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Headings */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Headings & Structure</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                {report.presentation_headings || 0}/5
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill green"
                style={{ width: `${Math.min((report.presentation_headings || 0) * 20, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Working Notes */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Working Notes Clarity</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                {report.presentation_working_notes || 0}/5
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill green"
                style={{ width: `${Math.min((report.presentation_working_notes || 0) * 20, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Neatness */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Neatness & Legibility</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                {report.presentation_neatness || 0}/5
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill green"
                style={{ width: `${Math.min((report.presentation_neatness || 0) * 20, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Total Presentation */}
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#dcfce7',
              borderRadius: '0.5rem',
              borderLeft: '3px solid #059669',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>Total Presentation Score</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
                {presentationScore}/20
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Question-wise Analysis */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">❓ Question-wise Analysis</h3>
        </div>

        <div className="table-wrapper">
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  Q.No
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  Marks Obtained
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  Performance
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  Feedback
                </th>
              </tr>
            </thead>
            <tbody>
              {report.questions && report.questions.length > 0 ? (
                report.questions.map((question, index) => {
                  const questionScore = question.marks_obtained || 0;
                  const questionTotal = question.marks_possible || 1;
                  const questionPercentage = (questionScore / questionTotal) * 100;
                  const isExpanded = expandedQuestions[question.id];

                  return (
                    <React.Fragment key={question.id}>
                      <tr
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onClick={() => toggleQuestionExpanded(question.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f1f5f9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8fafc';
                        }}
                      >
                        <td style={{ padding: '0.75rem', color: '#1e293b', fontWeight: 500 }}>
                          Q{question.question_number || index + 1}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem' }}>
                          {question.question_type || 'Essay'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>
                          {questionScore}/{questionTotal}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <div className="progress-bar" style={{ width: '100px', margin: '0 auto' }}>
                            <div
                              className={`progress-fill ${getProgressBarColor(questionScore, questionTotal)}`}
                              style={{ width: `${Math.min(questionPercentage, 100)}%` }}
                            ></div>
                          </div>
                          <div
                            style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}
                          >
                            {questionPercentage.toFixed(0)}%
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              fontWeight: 500,
                              fontSize: '0.875rem',
                            }}
                          >
                            {isExpanded ? '▼' : '▶'} Details
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Feedback */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td colSpan="5" style={{ padding: '1rem' }}>
                            <div style={{ paddingLeft: '1rem' }}>
                              <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                                  📝 Concept Mastery
                                </h4>
                                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                  {question.feedback_concept || 'Good understanding of the concept demonstrated.'}
                                </p>
                              </div>

                              <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                                  📋 Format & Presentation
                                </h4>
                                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                  {question.feedback_format || 'Answer format could be improved for better clarity.'}
                                </p>
                              </div>

                              <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                                  🔢 Calculation Accuracy
                                </h4>
                                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                  {question.feedback_calculation || 'Calculations are accurate and well-documented.'}
                                </p>
                              </div>

                              {question.feedback_suggestion && (
                                <div style={{
                                  padding: '0.75rem',
                                  backgroundColor: '#dbeafe',
                                  borderRadius: '0.375rem',
                                  borderLeft: '3px solid #3b82f6',
                                }}>
                                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e40af' }}>
                                    💡 Suggestion for Improvement
                                  </h4>
                                  <p style={{ color: '#1e40af', fontSize: '0.875rem' }}>
                                    {question.feedback_suggestion}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                    No question-wise data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Mistake Breakdown */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">🚨 Mistake Breakdown</h3>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Conceptual Errors */}
          <div className="mistake-card conceptual">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#dc2626' }}>
                🧠 Conceptual Errors
              </h4>
              <span style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}>
                {report.mistake_conceptual_count || 0}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
              {report.mistake_conceptual_description || 'Review fundamental concepts related to this topic.'}
            </p>
            {report.mistake_conceptual_marks !== undefined && (
              <p style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 500 }}>
                Marks Lost: {report.mistake_conceptual_marks}
              </p>
            )}
          </div>

          {/* Presentation Errors */}
          <div className="mistake-card presentation">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f97316' }}>
                📝 Presentation Errors
              </h4>
              <span style={{
                background: '#ffedd5',
                color: '#92400e',
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}>
                {report.mistake_presentation_count || 0}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
              {report.mistake_presentation_description || 'Work on formatting, headings, and overall presentation.'}
            </p>
            {report.mistake_presentation_marks !== undefined && (
              <p style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 500 }}>
                Marks Lost: {report.mistake_presentation_marks}
              </p>
            )}
          </div>

          {/* Calculation Errors */}
          <div className="mistake-card calculation">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#eab308' }}>
                🔢 Calculation Errors
              </h4>
              <span style={{
                background: '#fef08a',
                color: '#713f12',
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}>
                {report.mistake_calculation_count || 0}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
              {report.mistake_calculation_description || 'Double-check your arithmetic and numerical computations.'}
            </p>
            {report.mistake_calculation_marks !== undefined && (
              <p style={{ fontSize: '0.8rem', color: '#713f12', fontWeight: 500 }}>
                Marks Lost: {report.mistake_calculation_marks}
              </p>
            )}
          </div>

          {/* Step Loss */}
          <div className="mistake-card step_loss">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#8b5cf6' }}>
                📐 Step Loss & Logic
              </h4>
              <span style={{
                background: '#ede9fe',
                color: '#6b21a8',
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}>
                {report.mistake_step_loss_count || 0}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
              {report.mistake_step_loss_description || 'Ensure all solution steps are clearly shown and logically connected.'}
            </p>
            {report.mistake_step_loss_marks !== undefined && (
              <p style={{ fontSize: '0.8rem', color: '#6b21a8', fontWeight: 500 }}>
                Marks Lost: {report.mistake_step_loss_marks}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 6. Strengths */}
      {report.strengths && report.strengths.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">✨ Your Strengths</h3>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {report.strengths.map((strength, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: '#dcfce7',
                  borderRadius: '0.375rem',
                  borderLeft: '3px solid #059669',
                }}
              >
                <span style={{ color: '#059669', fontSize: '1.25rem' }}>✓</span>
                <p style={{ color: '#15803d', fontSize: '0.875rem' }}>{strength}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Areas to Improve */}
      {report.areas_to_improve && report.areas_to_improve.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">🎯 Areas to Improve</h3>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {report.areas_to_improve.map((area, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: '#dbeafe',
                  borderRadius: '0.375rem',
                  borderLeft: '3px solid #3b82f6',
                }}
              >
                <span style={{ color: '#3b82f6', fontWeight: 600, minWidth: '1.5rem' }}>
                  {index + 1}.
                </span>
                <p style={{ color: '#1e40af', fontSize: '0.875rem' }}>{area}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Personalized Action Plan */}
      {report.action_plan && report.action_plan.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">📋 Personalized Action Plan</h3>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {report.action_plan.map((action, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.375rem',
                  borderLeft: '3px solid #059669',
                }}
              >
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                  Step {index + 1}: {action.title || 'Action'}
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {action.description || action}
                </p>
                {action.timeline && (
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                    <strong>Timeline:</strong> {action.timeline}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. AI Suggestions */}
      {report.suggestions && report.suggestions.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">💡 AI-Powered Suggestions</h3>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {report.suggestions.map((suggestion, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: '#fef3c7',
                  borderRadius: '0.375rem',
                  borderLeft: '3px solid #f59e0b',
                }}
              >
                <span style={{ color: '#f59e0b', fontSize: '1.25rem' }}>💡</span>
                <p style={{ color: '#92400e', fontSize: '0.875rem' }}>{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. Improvement Potential */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">📈 Improvement Potential</h3>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          {/* Scores Comparison */}
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                  Current Score
                </span>
                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>
                  {totalScore}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${getProgressBarColor(totalScore, totalMarks)}`}
                  style={{ width: `${Math.min((totalScore / totalMarks) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                  Potential Score
                </span>
                <span style={{ fontWeight: 700, color: '#059669', fontSize: '1rem' }}>
                  {improvementPotential}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill green"
                  style={{ width: `${Math.min((improvementPotential / totalMarks) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Gap Analysis */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#dcfce7',
              borderRadius: '0.5rem',
              borderLeft: '3px solid #059669',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>
              🔍 Gap Analysis
            </h4>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                <strong>Improvement Opportunity:</strong>
              </p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
                +{improvementPotential - totalScore} marks
              </p>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Focus on the areas highlighted above to bridge the gap between your current and potential performance.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        <Link to="/submissions" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
          ← Back to Submissions
        </Link>
        <Link to="/upload" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          📤 Upload Another Answer
        </Link>
      </div>
    </div>
  );
}

export default EvaluationReport;
