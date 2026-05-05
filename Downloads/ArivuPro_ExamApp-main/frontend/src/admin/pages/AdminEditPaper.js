import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI, examsAPI } from '../../services/api';
import '../styles/AdminPages.css';

const Icons = {
  FileText: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
};

export default function AdminEditPaper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paperId, setPaperId] = useState(id);
  const [subjects, setSubjects] = useState([]);

  // Step 1: Paper Details
  const [paperDetails, setPaperDetails] = useState({
    title: '',
    subject: '',
    attempt_type: 'mock',
    exam_session: '',
    total_marks: '',
    duration_minutes: '',
    price: '0',
    question_paper_file: null,
    suggested_answer_file: null,
    is_published: false,
  });

  // No Step 2 and 3 state needed anymore as requested

  useEffect(() => {
    fetchSubjects();
    if (paperId) {
      loadPaperData();
    }
  }, [paperId]);

  const loadPaperData = async () => {
    try {
      setLoading(true);
      const paperRes = await examsAPI.getPaper(paperId);
      const paperData = paperRes.data || paperRes;

      setPaperDetails({
        title: paperData.title,
        subject: paperData.subject?.id || paperData.subject,
        attempt_type: paperData.attempt_type,
        exam_session: paperData.exam_session || '',
        total_marks: paperData.total_marks,
        duration_minutes: paperData.duration_minutes,
        price: paperData.price || '0',
        question_paper_file: null,
        suggested_answer_file: null,
        is_published: paperData.is_published,
      });

      const qsRes = await examsAPI.getPaperQuestions(paperId);
      const qsData = qsRes.data || qsRes;
      setQuestions(Array.isArray(qsData) ? qsData : qsData.results || []);

      // Load marking steps for questions if they are included, 
      // or we might need another API endpoint. For simplicity, we skip pre-loading steps 
      // unless they are already in the questions response.
      
    } catch (err) {
      console.error('Failed to load paper:', err);
      setError('Failed to load paper details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await examsAPI.getSubjects();
      const data = response.data;
      setSubjects(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const handlePaperDetailChange = (field, value) => {
    setPaperDetails(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (field, file) => {
    setPaperDetails(prev => ({
      ...prev,
      [field]: file,
    }));
  };

  const validatePaperDetails = () => {
    if (!paperDetails.title.trim()) {
      setError('Paper title is required');
      return false;
    }
    if (!paperDetails.subject) {
      setError('Subject is required');
      return false;
    }
    if (!paperDetails.total_marks) {
      setError('Total marks is required');
      return false;
    }
    if (!paperDetails.duration_minutes) {
      setError('Duration is required');
      return false;
    }
    return true;
  };

  const handleUpdatePaper = async () => {
    if (!validatePaperDetails()) return;

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('title', paperDetails.title);
      formData.append('subject', paperDetails.subject);
      formData.append('attempt_type', paperDetails.attempt_type);
      formData.append('exam_session', paperDetails.exam_session);
      formData.append('total_marks', paperDetails.total_marks);
      formData.append('duration_minutes', paperDetails.duration_minutes);
      formData.append('price', paperDetails.price || '0');

      if (paperDetails.question_paper_file) {
        formData.append('question_paper_file', paperDetails.question_paper_file);
      }
      if (paperDetails.suggested_answer_file) {
        formData.append('suggested_answer_file', paperDetails.suggested_answer_file);
      }
      formData.append('is_published', paperDetails.is_published);

      await examsAPI.updatePaper(paperId, formData);
      setSuccess(true);
      setError(null);
    } catch (err) {
      setError('Failed to update paper: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPaper = () => {
    navigate(`/admin/papers`);
  };

  const renderFileInput = (field, label) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div
        className="dropzone"
        onClick={() => document.getElementById(field)?.click()}
      >
        <div className="dropzone-icon" style={{ display: 'flex', justifyContent: 'center' }}><Icons.FileText /></div>
        <div className="dropzone-text">
          {paperDetails[field]
            ? paperDetails[field].name
            : `Click to upload new ${label.toLowerCase()} (leaves existing if empty)`}
        </div>
      </div>
      <input
        id={field}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(field, e.target.files?.[0])}
      />
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Edit Question Paper</h1>
          <p className="subtitle">Update paper details, questions, and marking scheme</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/papers')}>← Back to Papers</button>
      </div>

      {/* Step Indicator Removed as requested */}

      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ width: '64px', height: '64px', background: '#dcfce7', color: '#166534', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
            <Icons.Check />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.75rem', fontFamily: 'Fraunces, serif' }}>Paper Updated Successfully!</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Changes have been saved and {paperDetails.is_published ? 'the paper is visible to students' : 'the paper is hidden (draft)'}.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/admin/papers')} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}>
              Back to All Papers
            </button>
          </div>
        </div>
      )}
      {/* Paper Details */}
      {currentStep === 1 && !success && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Paper Details</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Paper Title *</label>
              <input
                type="text"
                className="form-input"
                value={paperDetails.title}
                onChange={(e) => handlePaperDetailChange('title', e.target.value)}
                placeholder="e.g., Physics Mock Exam 2024"
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <select
                  className="form-select"
                  value={paperDetails.subject}
                  onChange={(e) => handlePaperDetailChange('subject', e.target.value)}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id || subject} value={subject.id || subject}>
                      {typeof subject === 'object' ? subject.name : subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Attempt Type *</label>
                <select
                  className="form-select"
                  value={paperDetails.attempt_type}
                  onChange={(e) => handlePaperDetailChange('attempt_type', e.target.value)}
                >
                  <option value="mock">Mock Exam</option>
                  <option value="practice">Practice</option>
                  <option value="past_paper">Past Paper</option>
                  <option value="rtp">RTP</option>
                  <option value="mtp">MTP</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Exam Session</label>
              <input
                type="text"
                className="form-input"
                value={paperDetails.exam_session}
                onChange={(e) => handlePaperDetailChange('exam_session', e.target.value)}
                placeholder="e.g., Jan 2024, Feb 2024"
              />
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Total Marks *</label>
                <input
                  type="number"
                  className="form-input"
                  value={paperDetails.total_marks}
                  onChange={(e) => handlePaperDetailChange('total_marks', e.target.value)}
                  placeholder="100"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Duration (minutes) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={paperDetails.duration_minutes}
                  onChange={(e) => handlePaperDetailChange('duration_minutes', e.target.value)}
                  placeholder="180"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={paperDetails.price}
                  onChange={(e) => handlePaperDetailChange('price', e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {renderFileInput('question_paper_file', 'Question Paper (PDF)')}
            {renderFileInput('suggested_answer_file', 'Suggested Answers (PDF, Optional)')}

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={paperDetails.is_published}
                  onChange={(e) => handlePaperDetailChange('is_published', e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                Publish Paper (Visible to Students)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleUpdatePaper}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Paper'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
