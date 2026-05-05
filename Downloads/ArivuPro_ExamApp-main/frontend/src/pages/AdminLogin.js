import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, logout } = useAuth(); // admin context (inside AdminAuthWrapper)

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  // Message forwarded from student login when an admin used the wrong portal
  const infoMsg = location.state?.message || '';

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(formData.username, formData.password);
      if (!userData || (userData.role !== 'admin' && userData.role !== 'evaluator')) {
        // Non-admin credentials — clear the stored admin token and show a clear error
        logout();
        setError('This portal is for admins only. Students should use the Student Login.');
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid username or password.');
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          'Login failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo / branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', marginBottom: '1rem', fontSize: '1.75rem' }}>
            🛡️
          </div>
          <h1 style={{ margin: 0, color: '#fff', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Admin Portal</h1>
          <p style={{ margin: '0.4rem 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            ArivuPro — Restricted Access
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '2rem', backdropFilter: 'blur(12px)' }}>

          {infoMsg && (
            <div style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fde68a', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              ℹ {infoMsg}
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.4rem' }}>
                Admin Username
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem' }}>👤</span>
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter admin username"
                  required
                  disabled={loading}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '0.75rem 0.85rem 0.75rem 2.2rem',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    borderRadius: 10, fontSize: '0.875rem', outline: 'none',
                    fontFamily: 'inherit', color: '#fff',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.4rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem' }}>🔒</span>
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                  disabled={loading}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '0.75rem 2.5rem 0.75rem 2.2rem',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    borderRadius: 10, fontSize: '0.875rem', outline: 'none',
                    fontFamily: 'inherit', color: '#fff',
                  }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.875rem',
                background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontWeight: 700, fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }}>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </span>
                  Signing in...
                </>
              ) : 'Sign In to Admin Dashboard →'}
            </button>
          </form>

          {/* Security notice */}
          <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              This is a restricted area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>

        {/* Back to student login */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
          Not an admin?{' '}
          <Link to="/login" style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, textDecoration: 'none' }} >
            Student Login
          </Link>
        </p>
      </div>
    </div>
  );
}
