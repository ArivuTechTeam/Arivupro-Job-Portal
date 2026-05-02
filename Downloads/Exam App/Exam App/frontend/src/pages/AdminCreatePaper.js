import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examsAPI } from '../services/api';
import './AdminPages.css';

export default function AdminCreatePaper() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paperId, setPaperId] = useState(null);
  const [subjects, setSubjects] = useState([]);

  // Step 1: Paper Details
  const [paperDetails, setPaperDetails] = useState({
    title: '',
    subject: '',
    attempt_type: 'mock',
    exam_session: '',
    total_marks: '',
    duration_minutes: '',
    question_paper_file: null,
    suggested_answer_file: null,
  });

  // Step 2: Add Questions
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    question_number: '',
    question_text: '',
    question_type: 'theory',
    marks: '',
    chapter: '',
    is_compulsory: false,
    or_group: '',
  });

  // Step 3: Add Marking Scheme
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [markingSteps, setMarkingSteps] = useState({});
  const [newMarkingStep, setNewMarkingStep] = useState({
    step_number: '',
    description: '',
    marks: '',
    step_type: 'concept',
    ideal_answer_text: '',
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const data = await examsAPI.getSubjects();
      setSubjects(Array.isArray(data) ? data : data.data || []);
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

  const handleCreatePaper = async () => {
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

      if (paperDetails.question_paper_file) {
        formData.append('question_paper_file', paperDetails.question_paper_file);
      }
      if (paperDetails.suggested_answer_file) {
        formData.append('suggested_answer_file', paperDetails.suggested_answer_file);
      }

      const response = await examsAPI.createPaper(formData);
      const newPaperId = response.data?.id || response.id;
      setPaperId(newPaperId);
      setCurrentStep(2);
      setSuccess(false);
    } catch (err) {
      setError('Failed to create paper: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question_number || !newQuestion.question_text || !newQuestion.marks) {
      setError('Question number, text, and marks are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const questionData = {
        paper_id: paperId,
        question_number: parseInt(newQuestion.question_number),
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type,
        marks: parseInt(newQuestion.marks),
        chapter: newQuestion.chapter || null,
        is_compulsory: newQuestion.is_compulsory,
        or_group: newQuestion.or_group || null,
      };

      const response = await examsAPI.addQuestion(paperId, questionData);
      const addedQuestion = response.data || response;

      setQuestions(prev => [...prev, addedQuestion]);
      setNewQuestion({
        question_number: '',
        question_text: '',
        question_type: 'theory',
        marks: '',
        chapter: '',
        is_compulsory: false,
        or_group: '',
      });
    } catch (err) {
      setError('Failed to add question: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMarkingStep = async () => {
    if (!newMarkingStep.step_number || !newMarkingStep.description || !newMarkingStep.marks) {
      setError('Step number, description, and marks are required');
      return;
    }

    if (!selectedQuestionId) {
      setError('Please select a question');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const stepData = {
        step_number: parseInt(newMarkingStep.step_number),
        description: newMarkingStep.description,
        marks: parseInt(newMarkingStep.marks),
        step_type: newMarkingStep.step_type,
        ideal_answer_text: newMarkingStep.ideal_answer_text || null,
      };

      const response = await examsAPI.addMarkingStep(selectedQuestionId, stepData);

      setMarkingSteps(prev => ({
        ...prev,
        [selectedQuestionId]: [
          ...(prev[selectedQuestionId] || []),
          response.data || response,
        ],
      }));

      setNewMarkingStep({
        step_number: '',
        description: '',
        marks: '',
        step_type: 'concept',
        ideal_answer_text: '',
      });
    } catch (err) {
      setError('Failed to add marking step: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePaper = () => {
    setSuccess(true);
  };

  const handleViewPaper = () => {
    navigate(`/admin/papers/${paperId}`);
  };

  const renderFileInput = (field, label) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div
        className="dropzone"
        onClick={() => document.getElementById(field)?.click()}
      >
        <div className="dropzone-icon">📄</div>
        <div className="dropzone-text">
          {paperDetails[field]
            ? paperDetails[field].name
            : `Click to upload or drag ${label.toLowerCase()}`}
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
        <h1>Create Question Paper</h1>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          Step {currentStep} of 3
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">
          <div style={{ marginBottom: '1rem' }}>Paper created successfully!</div>
          <button onClick={handleViewPaper} className="btn btn-primary">
            View Paper
          </button>
        </div>
      )}

      {/* Step 1: Paper Details */}
      {currentStep === 1 && !success && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Step 1: Paper Details</h3>
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

            <div className="grid-2">
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
            </div>

            {renderFileInput('question_paper_file', 'Question Paper (PDF)')}
            {renderFileInput('suggested_answer_file', 'Suggested Answers (PDF, Optional)')}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleCreatePaper}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Paper'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Add Questions */}
      {currentStep === 2 && paperId && !success && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Step 2: Add Questions</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Question Number *</label>
              <input
                type="number"
                className="form-input"
                value={newQuestion.question_number}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question_number: e.target.value }))}
                placeholder="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Question Text *</label>
              <textarea
                className="form-textarea"
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Enter the full question text"
                rows="4"
              />
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Question Type *</label>
                <select
                  className="form-select"
                  value={newQuestion.question_type}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, question_type: e.target.value }))}
                >
                  <option value="practical">Practical</option>
                  <option value="theory">Theory</option>
                  <option value="case_study">Case Study</option>
                  <option value="mcq">MCQ</option>
                  <option value="short_note">Short Note</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Marks *</label>
                <input
                  type="number"
                  className="form-input"
                  value={newQuestion.marks}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, marks: e.target.value }))}
                  placeholder="5"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Chapter/Section</label>
                <input
                  type="text"
                  className="form-input"
                  value={newQuestion.chapter}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, chapter: e.target.value }))}
                  placeholder="e.g., Chapter 5"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={newQuestion.is_compulsory}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, is_compulsory: e.target.checked }))}
                  />
                  {' '}Compulsory
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Or Group</label>
                <input
                  type="text"
                  className="form-input"
                  value={newQuestion.or_group}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, or_group: e.target.value }))}
                  placeholder="e.g., Group A"
                />
              </div>
            </div>

            <button
              className="btn btn-success"
              onClick={handleAddQuestion}
              disabled={loading}
              style={{ marginTop: '1rem' }}
            >
              {loading ? 'Adding...' : '+ Add Question'}
            </button>

            {questions.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Added Questions ({questions.length})</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      style={{
                        padding: '1rem',
                        borderLeft: '4px solid #007bff',
                        marginBottom: '0.5rem',
                        backgroundColor: '#f9f9f9',
                      }}
                    >
                      <div style={{ fontWeight: '500' }}>
                        Q{q.question_number}: {q.question_text.substring(0, 50)}...
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                        {q.question_type} | {q.marks} marks
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'space-between' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentStep(1)}
              >
                ← Previous Step
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setCurrentStep(3)}
              >
                Next Step →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Add Marking Scheme */}
      {currentStep === 3 && paperId && questions.length > 0 && !success && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Step 3: Add Marking Scheme</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Select Question *</label>
              <select
                className="form-select"
                value={selectedQuestionId || ''}
                onChange={(e) => setSelectedQuestionId(parseInt(e.target.value))}
              >
                <option value="">Select a question</option>
                {questions.map(q => (
                  <option key={q.id} value={q.id}>
                    Q{q.question_number}: {q.question_text.substring(0, 50)}...
                  </option>
                ))}
              </select>
            </div>

            {selectedQuestionId && (
              <>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Step Number *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newMarkingStep.step_number}
                      onChange={(e) => setNewMarkingStep(prev => ({ ...prev, step_number: e.target.value }))}
                      placeholder="1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Step Type *</label>
                    <select
                      className="form-select"
                      value={newMarkingStep.step_type}
                      onChange={(e) => setNewMarkingStep(prev => ({ ...prev, step_type: e.target.value }))}
                    >
                      <option value="concept">Concept</option>
                      <option value="working">Working</option>
                      <option value="format">Format</option>
                      <option value="calculation">Calculation</option>
                      <option value="conclusion">Conclusion</option>
                      <option value="keyword">Keyword</option>
                      <option value="section_heading">Section Heading</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-textarea"
                    value={newMarkingStep.description}
                    onChange={(e) => setNewMarkingStep(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What should be checked"
                    rows="3"
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Marks *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newMarkingStep.marks}
                      onChange={(e) => setNewMarkingStep(prev => ({ ...prev, marks: e.target.value }))}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ideal Answer Text (Optional)</label>
                  <textarea
                    className="form-textarea"
                    value={newMarkingStep.ideal_answer_text}
                    onChange={(e) => setNewMarkingStep(prev => ({ ...prev, ideal_answer_text: e.target.value }))}
                    placeholder="The expected answer"
                    rows="3"
                  />
                </div>

                <button
                  className="btn btn-success"
                  onClick={handleAddMarkingStep}
                  disabled={loading}
                  style={{ marginTop: '1rem' }}
                >
                  {loading ? 'Adding...' : '+ Add Marking Step'}
                </button>

                {markingSteps[selectedQuestionId] && markingSteps[selectedQuestionId].length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>
                      Marking Steps for Q{questions.find(q => q.id === selectedQuestionId)?.question_number}
                    </h4>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {markingSteps[selectedQuestionId].map((step, idx) => (
                        <div
                          key={step.id || idx}
                          style={{
                            padding: '1rem',
                            borderLeft: '4px solid #28a745',
                            marginBottom: '0.5rem',
                            backgroundColor: '#f9f9f9',
                          }}
                        >
                          <div style={{ fontWeight: '500' }}>
                            Step {step.step_number} ({step.step_type}) - {step.marks} marks
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#333', marginTop: '0.25rem' }}>
                            {step.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'space-between' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentStep(2)}
              >
                ← Previous Step
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleCompletePaper}
              >
                Complete Paper ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {!paperId && currentStep === 1 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Fill in the paper details above to get started
        </div>
      )}
    </div>
  );
}
