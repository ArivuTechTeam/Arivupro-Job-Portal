import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import '../styles/AdminPanel.css';

const Icons = {
  Users: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  UserPlus: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  GraduationCap: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  Edit3: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  Shield: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Info: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  AlertTriangle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

const ROLES = ['student', 'teacher', 'admin'];

const ROLE_BADGE = {
  student: 'badge-blue',
  teacher: 'badge-amber',
  admin:   'badge-green',
};

const emptyForm = { username: '', email: '', first_name: '', last_name: '', role: 'student', password: '' };

export default function UserManagement() {
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [apiError,  setApiError]  = useState(null);   // null = backend available
  const [search,    setSearch]    = useState('');

  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(emptyForm);
  const [formErr,   setFormErr]   = useState('');
  const [formBusy,  setFormBusy]  = useState(false);
  const [formOk,    setFormOk]    = useState('');

  const [delId,     setDelId]     = useState(null);
  const [delBusy,   setDelBusy]   = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const { data } = await adminAPI.getUsers();
      setUsers(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      if (err.response?.status === 404) {
        setApiError('no_endpoint');
      } else {
        setApiError(err.response?.data?.detail || 'Failed to load users.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) || u.last_name?.toLowerCase().includes(q);
  });

  const counts = { student: 0, teacher: 0, admin: 0 };
  users.forEach(u => { if (counts[u.role] !== undefined) counts[u.role]++; });

  const openAdd = () => { setForm(emptyForm); setFormErr(''); setFormOk(''); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setFormErr(''); setFormOk(''); };

  const handleSubmit = async e => {
    e.preventDefault();
    setFormErr(''); setFormOk('');
    if (!form.username.trim()) return setFormErr('Username is required.');
    if (!form.password.trim()) return setFormErr('Password is required.');
    if (form.password.length < 8) return setFormErr('Password must be at least 8 characters.');
    setFormBusy(true);
    try {
      await adminAPI.createUser(form);
      setFormOk(`User "${form.username}" created successfully.`);
      setForm(emptyForm);
      fetchUsers();
      setTimeout(closeForm, 1500);
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === 'object') {
        const first = Object.entries(d)[0];
        setFormErr(first ? `${first[0]}: ${Array.isArray(first[1]) ? first[1][0] : first[1]}` : 'Failed to create user.');
      } else {
        setFormErr(typeof d === 'string' ? d : 'Failed to create user.');
      }
    } finally {
      setFormBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!delId) return;
    setDelBusy(true);
    try {
      await adminAPI.deleteUser(delId);
      setUsers(prev => prev.filter(u => u.id !== delId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setDelBusy(false);
      setDelId(null);
    }
  };

  if (apiError === 'no_endpoint') {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>User Management</h1>
            <p className="subtitle">Manage students and administrators</p>
          </div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem', color: 'var(--primary)' }}><Icons.Info /></span>
            <div>
              <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Backend endpoint not configured</p>
              <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                The <code>/api/admin/users/</code> endpoint is not available yet. Use the Django Admin panel to manage users.
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Quick Access</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <a href="/admin/accounts/user/" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Icons.Users /> Manage All Users
            </a>
            <a href="/admin/accounts/user/add/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Icons.UserPlus /> Add New User
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p className="subtitle">Manage students and administrators</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>
      </div>

      {apiError && apiError !== 'no_endpoint' && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>{apiError}</div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon blue"><Icons.GraduationCap /></div>
          <div>
            <div className="stat-value">{loading ? '—' : counts.student}</div>
            <div className="stat-label">Students</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Icons.Edit3 /></div>
          <div>
            <div className="stat-value">{loading ? '—' : counts.teacher}</div>
            <div className="stat-label">Teachers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Icons.Shield /></div>
          <div>
            <div className="stat-value">{loading ? '—' : counts.admin}</div>
            <div className="stat-label">Admins</div>
          </div>
        </div>
      </div>

      {/* Add User Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div className="card-header">
            <h3 className="card-title">Add New User</h3>
            <button className="btn btn-secondary btn-sm" onClick={closeForm}>Close</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid-2" style={{ marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Username *</label>
                <input className="form-input" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="johndoe" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">First Name</label>
                <input className="form-input" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} placeholder="John" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Last Name</label>
                <input className="form-input" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Doe" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Role *</label>
                <select className="form-input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 8 characters" />
              </div>
            </div>
            {formErr && <div className="error-message" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.AlertTriangle /> {formErr}</div>}
            {formOk  && <div className="success-message" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.Check /> {formOk}</div>}
            <button className="btn btn-primary" type="submit" disabled={formBusy}>
              {formBusy ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {/* User Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Users</h3>
          <input
            className="form-input"
            style={{ maxWidth: 260, marginLeft: 'auto' }}
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>Loading users...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
            {search ? 'No users match your search.' : 'No users found.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '18%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '26%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '10%' }} />
              </colgroup>
              <thead>
                <tr>
                  {['Username', 'Name', 'Email', 'Role', 'Status', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</td>
                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}</td>
                    <td style={{ color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email || '—'}</td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[u.role] || 'badge-blue'}`}>
                        {u.role || 'student'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active !== false ? 'badge-green' : 'badge-red'}`}>
                        {u.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(249,94,100,0.25)' }}
                        onClick={() => setDelId(u.id)}
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

      {/* Delete Confirm Modal */}
      {delId && (
        <div className="modal-overlay" onClick={() => setDelId(null)}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '0.75rem' }}>Delete User</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.25rem' }}>
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDelId(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={delBusy}
              >
                {delBusy ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
