import React, { useState, useEffect, useCallback } from 'react';
import { examsAPI } from '../../services/api';
import './AdminPanel.css';

const EMPTY_FORM = {
  name: '', code: '', exam_type: 'CA',
  exam_level: 'Foundation', description: '', is_active: true,
};

const EXAM_TYPES = [
  { value: 'CA',      label: 'CA — Chartered Accountant (ICAI)' },
  { value: 'CS',      label: 'CS — Company Secretary (ICSI)' },
  { value: 'CMA',     label: 'CMA India — Cost & Management Accountant (ICMAI)' },
  { value: 'ACCA',    label: 'ACCA — Assoc. of Chartered Certified Accountants (UK)' },
  { value: 'CMA_USA', label: 'CMA USA — Certified Management Accountant (IMA)' },
  { value: 'CIA',     label: 'CIA — Certified Internal Auditor (IIA)' },
  { value: 'CPA_US',  label: 'CPA US — Certified Public Accountant (AICPA)' },
  { value: 'FRM',     label: 'CEP / FRM — Financial Risk Manager (GARP)' },
];

const EXAM_LEVELS = ['Foundation', 'Intermediate', 'Final', 'Executive', 'Professional'];

const TYPE_COLORS = {
  CA: '#dbeafe', CS: '#dcfce7', CMA: '#fef3c7',
  ACCA: '#e0f2fe', CMA_USA: '#eff6ff', CIA: '#fff1f2', CPA_US: '#f5f3ff', FRM: '#fffbeb',
};
const TYPE_TEXT = {
  CA: '#1e40af', CS: '#166534', CMA: '#92400e',
  ACCA: '#0369a1', CMA_USA: '#1e3a8a', CIA: '#be123c', CPA_US: '#6d28d9', FRM: '#92400e',
};

export default function SubjectManagement() {
  const [subjects, setSubjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  // Modal
  const [showModal, setShowModal]     = useState(false);
  const [editSubject, setEditSubject] = useState(null); // null = add mode
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState('');
  const [saving, setSaving]           = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // Search / filter
  const [search, setSearch]     = useState('');
  const [typeFilter, setType]   = useState('');

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await examsAPI.getSubjects({ search, exam_type: typeFilter });
      setSubjects(data?.results ?? data ?? []);
      setError('');
    } catch {
      setError('Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  // Auto-refresh every 15 seconds so count stays live
  useEffect(() => {
    const id = setInterval(fetchSubjects, 15_000);
    return () => clearInterval(id);
  }, [fetchSubjects]);

  // ── Modal helpers ─────────────────────────────────────────────────────────

  function openAdd() {
    setEditSubject(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  }

  function openEdit(subject) {
    setEditSubject(subject);
    setForm({
      name:        subject.name,
      code:        subject.code || '',
      exam_type:   subject.exam_type || 'CA',
      exam_level:  subject.exam_level || 'Foundation',
      description: subject.description || '',
      is_active:   subject.is_active !== false,
    });
    setFormError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditSubject(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  // ── Save (create or update) ───────────────────────────────────────────────

  async function handleSave(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editSubject) {
        await examsAPI.updateSubject(editSubject.id, form);
        setSuccess(`Subject "${form.name}" updated successfully.`);
      } else {
        await examsAPI.createSubject(form);
        setSuccess(`Subject "${form.name}" created successfully.`);
      }
      closeModal();
      fetchSubjects();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join('  |  ');
        setFormError(msgs);
      } else {
        setFormError('Save failed. Please check your inputs.');
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await examsAPI.deleteSubject(deleteTarget.id);
      setSuccess(`Subject "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      fetchSubjects();
    } catch {
      setError('Delete failed. Subject may have linked exam papers.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  // ── Quick toggle active status ────────────────────────────────────────────

  async function toggleActive(subject) {
    try {
      await examsAPI.updateSubject(subject.id, { is_active: !subject.is_active });
      setSuccess(`Subject "${subject.name}" ${!subject.is_active ? 'activated' : 'deactivated'}.`);
      fetchSubjects();
    } catch {
      setError('Status update failed.');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  const filtered = subjects.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
    const matchType   = !typeFilter || s.exam_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Subject Management</h1>
          <p className="subtitle">Manage subjects and chapters</p>
        </div>
        <button className="btn btn-success" onClick={openAdd}>+ Add Subject</button>
      </div>

      {success && (
        <div className="success-message" onClick={() => setSuccess('')} style={{ cursor: 'pointer' }}>
          {success}
        </div>
      )}
      {error && (
        <div className="error-message" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
          {error}
        </div>
      )}

      {/* Search / filter bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            style={{ flex: 2, minWidth: 200 }}
            placeholder="Search by name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="form-input"
            style={{ flex: 1, minWidth: 200 }}
            value={typeFilter}
            onChange={e => setType(e.target.value)}
          >
            <option value="">All Exam Types</option>
            {EXAM_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.value} — {t.label.split('—')[0].trim()}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={fetchSubjects}>Refresh</button>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Subjects ({filtered.length})</h3>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>Loading subjects...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
            No subjects found. Click "+ Add Subject" to create one.
          </p>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['CODE', 'NAME', 'EXAM TYPE', 'LEVEL', 'DESCRIPTION', 'STATUS', 'ACTIONS'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(subject => (
                  <tr key={subject.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.9rem' }}>
                      {subject.code || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{subject.name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        background: TYPE_COLORS[subject.exam_type] || '#f3f4f6',
                        color: TYPE_TEXT[subject.exam_type] || '#374151',
                        padding: '3px 10px', borderRadius: 12,
                        fontSize: '0.75rem', fontWeight: 600,
                      }}>
                        {subject.exam_type || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                      {subject.exam_level || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-light)', fontSize: '0.8rem', maxWidth: 200 }}>
                      <span title={subject.description} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {subject.description || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button
                        onClick={() => toggleActive(subject)}
                        title="Click to toggle"
                        style={{
                          background: subject.is_active !== false ? '#dcfce7' : '#fee2e2',
                          color:      subject.is_active !== false ? '#166534' : '#991b1b',
                          border: 'none', borderRadius: 12, padding: '3px 12px',
                          fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {subject.is_active !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 14px', fontSize: '0.8rem', marginRight: '0.5rem' }}
                        onClick={() => openEdit(subject)}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          padding: '4px 14px', fontSize: '0.8rem',
                          background: '#fee2e2', color: '#991b1b',
                          border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500,
                        }}
                        onClick={() => setDeleteTarget(subject)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: '2rem',
            width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>
              {editSubject ? `Edit Subject — ${editSubject.code}` : 'Add New Subject'}
            </h2>

            {formError && <div className="error-message">{formError}</div>}

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Subject Name *</label>
                  <input className="form-input" required value={form.name}
                    placeholder="e.g., Financial Accounting"
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject Code *</label>
                  <input className="form-input" required value={form.code}
                    placeholder="e.g., CA101"
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Type</label>
                  <select className="form-input" value={form.exam_type}
                    onChange={e => setForm(f => ({ ...f, exam_type: e.target.value }))}>
                    {EXAM_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Level</label>
                  <select className="form-input" value={form.exam_level}
                    onChange={e => setForm(f => ({ ...f, exam_level: e.target.value }))}>
                    {EXAM_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={3} value={form.description}
                    placeholder="Brief description of the subject..."
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.is_active ? 'active' : 'inactive'}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'active' }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? 'Saving...' : editSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: '2rem',
            width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Delete Subject</h3>
            <p style={{ marginBottom: '0.5rem', color: 'var(--text-light)' }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.code})?
            </p>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#dc2626' }}>
              This will also delete all linked chapters and exam papers. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                disabled={deleting}
                style={{
                  background: '#dc2626', color: '#fff', border: 'none',
                  borderRadius: 'var(--radius)', padding: '0.5rem 1.5rem',
                  cursor: 'pointer', fontWeight: 600, opacity: deleting ? 0.7 : 1,
                }}
                onClick={handleDelete}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
