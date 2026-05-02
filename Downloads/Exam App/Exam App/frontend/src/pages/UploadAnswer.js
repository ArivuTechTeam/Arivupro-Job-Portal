import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { examsAPI, submissionsAPI } from '../services/api';

export function UploadAnswer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form state
  const [selectedPaperId, setSelectedPaperId] = useState(
    searchParams.get('paper') || ''
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTimedAttempt, setIsTimedAttempt] = useState(false);
  const [timeTaken, setTimeTaken] = useState('');
  const [notes, setNotes] = useState('');

  // Data state
  const [papers, setPapers] = useState([]);
  const [selectedPaperDetails, setSelectedPaperDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const ACCEPTED_FORMATS = ['application/pdf', 'image/jpeg', 'image/png'];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  // Fetch papers on mount
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await examsAPI.getPapers({ is_published: true });
        setPapers(data.results || data || []);
      } catch (err) {
        console.error('Error fetching papers:', err);
        setError('Failed to load exam papers. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, []);

  // Update selected paper details when selection changes
  useEffect(() => {
    if (selectedPaperId) {
      const paper = papers.find((p) => p.id === parseInt(selectedPaperId));
      setSelectedPaperDetails(paper || null);
    } else {
      setSelectedPaperDetails(null);
    }
  }, [selectedPaperId, papers]);

  const handlePaperChange = (e) => {
    setSelectedPaperId(e.target.value);
    setError(null);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('active');
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('active');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('active');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      validateAndSetFile(file);
    }
  }, []);

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setError(null);

    // Check file type
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      setError('Please upload a PDF, JPG, or PNG file');
      setSelectedFile(null);
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 50MB');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedPaperId) {
      setError('Please select an exam paper');
      return;
    }

    if (!selectedFile) {
      setError('Please upload an answer script');
      return;
    }

    if (isTimedAttempt && !timeTaken) {
      setError('Please enter the time taken for the timed attempt');
      return;
    }

    if (isTimedAttempt && (isNaN(timeTaken) || timeTaken <= 0)) {
      setError('Please enter a valid time in minutes');
      return;
    }

    try {
      setSubmitting(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('exam_paper', selectedPaperId);
      formData.append('answer_script', selectedFile);

      if (isTimedAttempt) {
        formData.append('is_timed_attempt', true);
        formData.append('time_taken_minutes', parseInt(timeTaken));
      }

      if (notes.trim()) {
        formData.append('notes', notes);
      }

      const { data } = await submissionsAPI.create(formData);

      setSuccess(true);
      // Reset form
      setSelectedFile(null);
      setNotes('');
      setTimeTaken('');
      setIsTimedAttempt(false);

      // Redirect to submissions page after 2 seconds
      setTimeout(() => {
        navigate('/submissions');
      }, 2000);
    } catch (err) {
      console.error('Error uploading submission:', err);
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Failed to upload answer script. Please try again.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="page">
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
          <h1>Upload Answer Script</h1>
          <p className="subtitle">Submit your exam answer script for review and evaluation</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div
          style={{
            background: '#dcfce7',
            color: '#166534',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #bbf7d0',
          }}
        >
          <strong>Success!</strong> Your answer script has been uploaded successfully. Redirecting to submissions...
        </div>
      )}

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
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Form Container */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          {/* Step 1: Select Exam Paper */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h2 className="card-title">Step 1: Select Exam Paper</h2>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Exam Paper *</label>
                <select
                  value={selectedPaperId}
                  onChange={handlePaperChange}
                  className="form-select"
                  style={{ marginBottom: '1rem' }}
                >
                  <option value="">-- Select an exam paper --</option>
                  {papers.map((paper) => (
                    <option key={paper.id} value={paper.id}>
                      {paper.title || `Paper ${paper.id}`}
                      {paper.subject ? ` - ${typeof paper.subject === 'object' ? paper.subject.name : paper.subject}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paper Details */}
              {selectedPaperDetails && (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <h3 style={{ marginBottom: '0.75rem', color: '#1e293b', fontSize: '1rem', fontWeight: 600 }}>
                    {selectedPaperDetails.title}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                    {selectedPaperDetails.subject && (
                      <div>
                        <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>Subject</p>
                        <p style={{ fontWeight: 500, color: '#1e293b' }}>
                          {typeof selectedPaperDetails.subject === 'object'
                            ? selectedPaperDetails.subject.name
                            : selectedPaperDetails.subject}
                        </p>
                      </div>
                    )}
                    {selectedPaperDetails.total_marks && (
                      <div>
                        <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>Total Marks</p>
                        <p style={{ fontWeight: 500, color: '#1e293b' }}>{selectedPaperDetails.total_marks}</p>
                      </div>
                    )}
                    {selectedPaperDetails.duration && (
                      <div>
                        <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>Duration</p>
                        <p style={{ fontWeight: 500, color: '#1e293b' }}>{selectedPaperDetails.duration} minutes</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Upload Answer Script */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h2 className="card-title">Step 2: Upload Answer Script</h2>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Answer Script File *</label>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                  Accepted formats: PDF, JPG, PNG (Max 50MB)
                </p>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="dropzone"
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '0.5rem',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: '#f8fafc',
                    marginBottom: '1rem',
                  }}
                >
                  <div className="dropzone-icon" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    📄
                  </div>
                  <div className="dropzone-text">
                    <p style={{ fontWeight: 500, color: '#1e293b', marginBottom: '0.25rem' }}>
                      Drag and drop your answer script here
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>or click to browse files</p>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    onChange={handleFileInputChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      top: 0,
                      left: 0,
                      opacity: 0,
                      cursor: 'pointer',
                    }}
                  />
                </div>

                {/* File Preview */}
                {selectedFile && (
                  <div
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #86efac',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>✓</span>
                      <div>
                        <p style={{ fontWeight: 500, color: '#166534', margin: 0 }}>{selectedFile.name}</p>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                          {getFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        padding: '0.5rem',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Optional Fields */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h2 className="card-title">Step 3: Additional Information (Optional)</h2>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {/* Timed Attempt */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isTimedAttempt}
                    onChange={(e) => setIsTimedAttempt(e.target.checked)}
                    style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500, color: '#1e293b' }}>This is a timed attempt</span>
                </label>
              </div>

              {/* Time Taken */}
              {isTimedAttempt && (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Time Taken (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={timeTaken}
                    onChange={(e) => setTimeTaken(e.target.value)}
                    placeholder="e.g., 180"
                    className="form-input"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about your attempt (optional)"
                  className="form-textarea"
                  rows="4"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button
              type="submit"
              disabled={submitting || !selectedPaperId || !selectedFile}
              className="btn btn-primary btn-lg"
              style={{
                opacity: submitting || !selectedPaperId || !selectedFile ? 0.6 : 1,
                cursor: submitting || !selectedPaperId || !selectedFile ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ marginRight: '0.5rem' }}></span>
                  Uploading...
                </>
              ) : (
                '📤 Submit Answer Script'
              )}
            </button>

            <Link to="/exam-papers" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadAnswer;
