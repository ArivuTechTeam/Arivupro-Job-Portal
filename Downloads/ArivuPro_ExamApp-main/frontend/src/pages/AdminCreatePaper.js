import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  X, 
  FolderOpen, 
  Folder, 
  AlertCircle, 
  ChevronRight, 
  Check 
} from 'lucide-react';
import { examsAPI } from '../services/api';
import './AdminPages.css';

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function DropZone({ label, sublabel, file, onFile, onRemove, color = '#2563eb', bgColor = '#eff6ff' }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const validate = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { alert('Only PDF files are accepted.'); return; }
    if (f.size > 50 * 1024 * 1024) { alert('File must be under 50 MB.'); return; }
    onFile(f);
  };

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false); };
  const onDrop      = (e) => { e.preventDefault(); setDragging(false); validate(e.dataTransfer.files[0]); };

  if (file) {
    return (
      <div style={{
        border: `2px solid ${color}`, borderRadius: 14, padding: '1.25rem',
        background: bgColor, display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 10,
          background: color, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}><FileText size={24} color="#fff" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.9rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
            PDF · {formatSize(file.size)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button type="button" onClick={() => inputRef.current?.click()} style={{
            background: '#fff', border: `1px solid ${color}`, borderRadius: 8,
            padding: '5px 14px', fontSize: '0.8rem', cursor: 'pointer',
            color: color, fontWeight: 600,
          }}>Replace</button>
          <button type="button" onClick={onRemove} style={{
            background: '#fee2e2', border: 'none', borderRadius: 8,
            padding: '5px 10px', fontSize: '0.85rem', cursor: 'pointer', color: '#dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><X size={14} /></button>
        </div>
        <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
          onChange={e => validate(e.target.files[0])} />
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      style={{
        border: `2px dashed ${dragging ? color : '#cbd5e1'}`,
        borderRadius: 14, padding: '2.25rem 1.5rem',
        textAlign: 'center', cursor: 'pointer',
        background: dragging ? bgColor : '#f8fafc',
        transform: dragging ? 'scale(1.01)' : 'scale(1)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
        {dragging ? <FolderOpen size={48} color={color} /> : <FileText size={48} color="#94a3b8" />}
      </div>
      <p style={{ fontWeight: 700, color: dragging ? color : '#374151', margin: '0 0 0.3rem', fontSize: '0.95rem' }}>
        {dragging ? 'Release to upload' : label}
      </p>
      <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 1.1rem' }}>
        {sublabel}
      </p>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        background: '#fff', border: '1.5px solid #d1d5db',
        borderRadius: 8, padding: '0.45rem 1.1rem',
        fontSize: '0.82rem', fontWeight: 600, color: '#374151',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}> <Folder size={16} /> Browse PDF</div>
      <p style={{ margin: '0.6rem 0 0', fontSize: '0.73rem', color: '#cbd5e1' }}>PDF only · Max 50 MB</p>
      <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
        onChange={e => validate(e.target.files[0])} />
    </div>
  );
}

export default function AdminCreatePaper() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);

  const [paperDetails, setPaperDetails] = useState({
    title: '',
    course_name: '',
    subject: '',
    attempt_type: 'mock',
    exam_session: '',
    total_marks: '',
    duration_minutes: '',
    question_paper_file: null,
    suggested_answer_file: null,
    is_published: false,
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await examsAPI.getSubjects();
      const data = response.data;
      setSubjects(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const handleChange = (field, value) => {
    setPaperDetails(prev => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!paperDetails.title.trim()) { setError('Paper title is required'); return false; }
    if (!paperDetails.subject) { setError('Subject is required'); return false; }
    if (!paperDetails.total_marks) { setError('Total marks is required'); return false; }
    if (!paperDetails.duration_minutes) { setError('Duration is required'); return false; }
    if (!paperDetails.question_paper_file) { setError('Question paper PDF is required'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('title', paperDetails.title);
      formData.append('course_name', paperDetails.course_name);
      formData.append('subject', paperDetails.subject);
      formData.append('attempt_type', paperDetails.attempt_type);
      formData.append('exam_session', paperDetails.exam_session);
      formData.append('total_marks', paperDetails.total_marks);
      formData.append('duration_minutes', paperDetails.duration_minutes);
      formData.append('is_published', paperDetails.is_published);
      formData.append('question_paper_file', paperDetails.question_paper_file);
      if (paperDetails.suggested_answer_file) {
        formData.append('suggested_answer_file', paperDetails.suggested_answer_file);
      }

      await examsAPI.createPaper(formData);
      navigate('/admin/papers');
    } catch (err) {
      setError('Failed to create paper: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    } finally {
      setLoading(false);
    }
  };

  const subjectGroups = subjects.reduce((acc, s) => {
    const type = s.exam_type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(s);
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="page-header">
        <h1>Create Question Paper</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

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
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., CA Final – Financial Reporting Mock Nov 2025"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Course Name <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional — groups papers in Course Management)</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={paperDetails.course_name}
              onChange={(e) => handleChange('course_name', e.target.value)}
              placeholder="e.g., CA Final, CA Intermediate, Class 10 Science"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select
                className="form-select"
                value={paperDetails.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                style={{ border: paperDetails.subject ? '2px solid #16a34a' : undefined }}
              >
                <option value="">— Select Subject —</option>
                {subjects.length === 0 ? (
                  <option disabled>No subjects yet — add via Subject Management</option>
                ) : (
                  Object.entries(subjectGroups).map(([type, list]) => (
                    <optgroup key={type} label={`── ${type} ──────────────`}>
                      {list.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.code ? `[${s.code}] ` : ''}{s.name}
                          {s.exam_level ? ` · ${s.exam_level}` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))
                )}
              </select>
              {subjects.length === 0 && (
                <p style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={14} /> No subjects found.{' '}
                  <a href="/admin/subjects" style={{ color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    Add subjects first <ChevronRight size={14} />
                  </a>
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Attempt Type *</label>
              <select
                className="form-select"
                value={paperDetails.attempt_type}
                onChange={(e) => handleChange('attempt_type', e.target.value)}
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
              onChange={(e) => handleChange('exam_session', e.target.value)}
              placeholder="e.g., May 2025, Nov 2024"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Total Marks *</label>
              <input
                type="number"
                className="form-input"
                value={paperDetails.total_marks}
                onChange={(e) => handleChange('total_marks', e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes) *</label>
              <input
                type="number"
                className="form-input"
                value={paperDetails.duration_minutes}
                onChange={(e) => handleChange('duration_minutes', e.target.value)}
                placeholder="180"
              />
            </div>
          </div>

          {/* Question Paper Upload */}
          <div className="form-group">
            <label className="form-label">Question Paper PDF *</label>
            <DropZone
              label="Drag & drop question paper here"
              sublabel="Upload the official question paper PDF"
              file={paperDetails.question_paper_file}
              onFile={(f) => handleChange('question_paper_file', f)}
              onRemove={() => handleChange('question_paper_file', null)}
              color="#2563eb"
              bgColor="#eff6ff"
            />
          </div>

          {/* Suggested Answers Upload */}
          <div className="form-group">
            <label className="form-label">
              Suggested Answers PDF
              <span style={{ marginLeft: 8, fontWeight: 400, fontSize: '0.78rem', color: '#94a3b8' }}>Optional</span>
            </label>
            <DropZone
              label="Drag & drop suggested answers here"
              sublabel="Upload the official answer key or suggested solutions"
              file={paperDetails.suggested_answer_file}
              onFile={(f) => handleChange('suggested_answer_file', f)}
              onRemove={() => handleChange('suggested_answer_file', null)}
              color="#16a34a"
              bgColor="#f0fdf4"
            />
          </div>

          {/* Publish toggle */}
          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={paperDetails.is_published}
                onChange={(e) => handleChange('is_published', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                Publish immediately
              </span>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                (students can see and download this paper once published)
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/admin/papers')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Creating...' : <><Check size={18} /> Create Paper</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
