import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout } = useAuth();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const successMsg = location.state?.message || '';

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
      if (userData?.role === 'admin' || userData?.role === 'evaluator') {
        // Admin used the student login — clear the student token and redirect them
        // to the Admin Portal so each session stays in its own storage scope.
        logout();
        navigate('/admin', { replace: true, state: { message: 'Admin account detected — please log in via the Admin Portal.' } });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f9ff 0%,#e0e7ff 50%,#faf5ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 24, boxShadow: '0 8px 40px rgba(79,70,229,0.12)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#312e81 0%,#4f46e5 60%,#6d28d9 100%)', padding: '2rem 2rem 1.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>Welcome Back</h2>
          <p style={{ margin: '0.3rem 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>
            ArivuPro — Student Portal
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          {successMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 500 }}>
              ✓ {successMsg}
            </div>
          )}

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem', fontSize: '0.85rem', border: '1px solid #fecaca' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                Username <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem' }}>👤</span>
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  required
                  disabled={loading}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.72rem 0.85rem 0.72rem 2.2rem', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem' }}>🔒</span>
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.72rem 2.5rem 0.72rem 2.2rem', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem' }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.85rem', background: loading ? '#94a3b8' : 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(79,70,229,0.35)', transition: 'all 0.2s' }}
            >
              {loading ? 'Logging in...' : 'Login →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'none' }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
