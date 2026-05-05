import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, 
  GraduationCap, 
  ShieldCheck, 
  FileEdit, 
  Users,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  Edit
} from 'lucide-react';
import { adminAPI, authAPI } from '../../services/api';
import './AdminPanel.css';

const EMPTY_FORM = {
  username: '', email: '', first_name: '', last_name: '',
  role: 'student', exam_type: '', exam_level: '', phone: '',
  institute: '', registration_number: '', is_active: true, password: '',
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search / filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null); // null = add mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Permission fix
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [usersRes, statsRes] = await Promise.all([
        adminAPI.getUsers({ search: searchTerm, role: roleFilter }),
        adminAPI.getStats(),
      ]);
      setUsers(usersRes.data.results ?? usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (err.response?.status === 403 || detail.toLowerCase().includes('permission')) {
        setIsPermissionError(true);
        setError('');
      } else {
        setError(detail || 'Failed to load users. Make sure you are logged in as admin.');
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter]);

  const handlePromoteMe = async () => {
    try {
      setPromoting(true);
      await authAPI.promoteMe();
      setIsPermissionError(false);
      setSuccess('✓ Your account has been promoted to Admin! Reloading...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Promotion failed. Please restart the Django server and try again.');
    } finally {
      setPromoting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openAddModal() {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  }

  function openEditModal(user) {
    setEditUser(user);
    setForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      exam_type: user.exam_type || '',
      exam_level: user.exam_level || '',
      phone: user.phone || '',
      institute: user.institute || '',
      registration_number: user.registration_number || '',
      is_active: user.is_active,
      password: '',
    });
    setFormError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditUser(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editUser) {
        await adminAPI.updateUser(editUser.id, payload);
        setSuccess('User updated successfully.');
      } else {
        if (!payload.password) {
          setFormError('Password is required for new users.');
          setSaving(false);
          return;
        }
        await adminAPI.createUser(payload);
        setSuccess('User created successfully.');
      }
      closeModal();
      fetchData();
    } catch (err) {
      if (err.response?.status === 403) {
        setFormError('Permission denied. Click "Fix Admin Access" banner to promote your account first.');
        setIsPermissionError(true);
        closeModal();
      } else {
        const data = err.response?.data;
        if (data && typeof data === 'object') {
          const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`);
          setFormError(msgs.join('  |  '));
        } else {
          setFormError('Save failed. Please check your inputs.');
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminAPI.deleteUser(deleteTarget.id);
      setSuccess(`User "${deleteTarget.username}" deleted.`);
      setDeleteTarget(null);
      fetchData();
    } catch {
      setError('Delete failed.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const roleBadge = (role) => {
    const map = { admin: '#166534', student: '#1e40af', evaluator: '#92400e' };
    const bg = { admin: '#dcfce7', student: '#dbeafe', evaluator: '#fef3c7' };
    return (
      <span style={{
        background: bg[role] || '#f3f4f6', color: map[role] || '#374151',
        padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
        textTransform: 'capitalize',
      }}>
        {role}
      </span>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p className="subtitle">Manage students, admins, and evaluators</p>
        </div>
        <button className="btn btn-success" onClick={openAddModal}>
          + Add New User
        </button>
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

      {/* Permission fix banner */}
      {isPermissionError && (
        <div style={{
          background: 'linear-gradient(135deg,#fff7ed,#fffbeb)',
          border: '1px solid #fed7aa', borderLeft: '4px solid #f97316',
          borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg,#f97316,#ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Lock size={20} color="#fff" /></div>
            <div>
              <p style={{ fontWeight: 700, color: '#9a3412', margin: '0 0 3px', fontSize: '0.9rem' }}>
                Admin Permission Required
              </p>
              <p style={{ color: '#c2410c', fontSize: '0.78rem', margin: 0 }}>
                Your account role is <strong>not admin</strong> yet. Click the button to promote your account instantly.
              </p>
            </div>
          </div>
          <button
            onClick={handlePromoteMe}
            disabled={promoting}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: 10,
              background: promoting ? '#94a3b8' : 'linear-gradient(135deg,#f97316,#ea580c)',
              border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
              cursor: promoting ? 'not-allowed' : 'pointer',
              boxShadow: promoting ? 'none' : '0 4px 12px rgba(249,115,22,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            {promoting ? '⏳ Promoting...' : '🚀 Fix Admin Access'}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon blue"><GraduationCap size={24} /></div>
          <div>
            <div className="stat-value">{stats ? stats.students : '—'}</div>
            <div className="stat-label">STUDENTS</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><ShieldCheck size={24} /></div>
          <div>
            <div className="stat-value">{stats ? stats.admins : '—'}</div>
            <div className="stat-label">ADMINS</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><FileEdit size={24} /></div>
          <div>
            <div className="stat-value">{stats ? stats.evaluators : '—'}</div>
            <div className="stat-label">EVALUATORS</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f3f4f6', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{stats ? stats.total : '—'}</div>
            <div className="stat-label">TOTAL</div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            style={{ flex: 2, minWidth: 220 }}
            type="text"
            placeholder="Search by username, email, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="form-input"
            style={{ flex: 1, minWidth: 140 }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
            <option value="evaluator">Evaluator</option>
          </select>
          <button className="btn btn-secondary" onClick={fetchData}>Refresh</button>
        </div>
      </div>

      {/* User Table */}
      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>Loading users...</p>
        ) : users.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>No users found.</p>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Username', 'Name', 'Email', 'Role', 'Exam', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{user.username}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-light)' }}>{user.full_name || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>{user.email}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{roleBadge(user.role)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>{user.exam_type || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ color: user.is_active ? '#166534' : '#991b1b', fontWeight: 500, fontSize: '0.8rem' }}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-light)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 12px', fontSize: '0.8rem', marginRight: '0.5rem' }}
                        onClick={() => openEditModal(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn"
                        style={{ padding: '4px 12px', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer' }}
                        onClick={() => setDeleteTarget(user)}
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: '2rem',
            width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editUser ? 'Edit User' : 'Add New User'}</h2>
            {formError && <div className="error-message">{formError}</div>}
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input className="form-input" required value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" value={form.first_name}
                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" value={form.last_name}
                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="form-input" value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                    <option value="evaluator">Evaluator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Type</label>
                  <select className="form-input" value={form.exam_type}
                    onChange={e => setForm(f => ({ ...f, exam_type: e.target.value }))}>
                    <option value="">—</option>
                    <option value="CA">CA</option>
                    <option value="CS">CS</option>
                    <option value="CMA">CMA</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Level</label>
                  <input className="form-input" value={form.exam_level}
                    onChange={e => setForm(f => ({ ...f, exam_level: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Institute</label>
                  <input className="form-input" value={form.institute}
                    onChange={e => setForm(f => ({ ...f, institute: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Number</label>
                  <input className="form-input" value={form.registration_number}
                    onChange={e => setForm(f => ({ ...f, registration_number: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.is_active ? 'active' : 'inactive'}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'active' }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input className="form-input" type="password" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? 'Saving...' : editUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: '2rem',
            width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Delete User</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-light)' }}>
              Are you sure you want to delete <strong>{deleteTarget.username}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                className="btn"
                style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '0.5rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
