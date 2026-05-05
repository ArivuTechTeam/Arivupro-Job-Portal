/**
 * Subject Management - Uses existing /api/exams/subjects/ endpoint
 */

import React, { useState, useEffect } from 'react';
import { examsAPI } from '../../services/api';
import '../styles/AdminPanel.css';

const Icons = {
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    exam_type: 'CA',
    exam_level: 'Foundation',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const { data } = await examsAPI.getSubjects();
      setSubjects(data?.results || data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load subjects.');
      console.error('Subject fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // POST to /api/exams/subjects/ (admin-only endpoint)
      const { default: api } = await import('../../services/api');
      await api.post('/exams/subjects/', formData);
      setSuccessMsg('Subject created successfully!');
      setShowForm(false);
      setFormData({ name: '', code: '', exam_type: 'CA', exam_level: 'Foundation', description: '' });
      fetchSubjects();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data;
      if (typeof errorMsg === 'object') {
        const firstError = Object.values(errorMsg)[0];
        setError(Array.isArray(firstError) ? firstError[0] : JSON.stringify(firstError));
      } else {
        setError('Failed to create subject.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Subject Management</h1>
            <p className="subtitle">Manage exam subjects</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Subject Management</h1>
          <p className="subtitle">{subjects.length > 0 ? `${subjects.length} subject${subjects.length !== 1 ? 's' : ''} total` : 'Manage exam subjects'}</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : <><Icons.Plus /> Add Subject</>}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}

      {/* Create Subject Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
          <div className="card-header">
            <h3 className="card-title">Create New Subject</h3>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Subject Name *</label>
                <input
                  className="form-input"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Accounting"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subject Code *</label>
                <input
                  className="form-input"
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g., ACC101"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Exam Type</label>
                <select className="form-select" name="exam_type" value={formData.exam_type} onChange={handleChange}>
                  <option value="CA">CA - Chartered Accountant</option>
                  <option value="CS">CS - Company Secretary</option>
                  <option value="CMA">CMA - Cost Management Accountant</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Exam Level</label>
                <select className="form-select" name="exam_level" value={formData.exam_level} onChange={handleChange}>
                  <option value="Foundation">Foundation</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Final">Final</option>
                  <option value="Executive">Executive</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the subject..."
                rows={3}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Subject'}
            </button>
          </form>
        </div>
      )}

      {/* Subjects Table */}
      <div className="table-wrapper">
        <table className="admin-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            <col style={{ width: '12%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Exam Type</th>
              <th>Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {subjects.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
                  No subjects found. Create your first subject above.
                </td>
              </tr>
            ) : (
              subjects.map(subject => (
                <tr key={subject.id}>
                  <td style={{ fontWeight: 600 }}>{subject.code || '—'}</td>
                  <td>{subject.name}</td>
                  <td>
                    <span className="badge badge-blue">{subject.exam_type || '—'}</span>
                  </td>
                  <td>{subject.exam_level || '—'}</td>
                  <td>
                    <span className={`badge ${subject.is_active !== false ? 'badge-green' : 'badge-red'}`}>
                      {subject.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
