import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { signInAdmin } from '../../lib/supabase/auth';
import type { AuthUser } from '../../lib/supabase/auth';

interface Props {
  onLogin: (user: AuthUser) => void;
}

export default function AdminLogin({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { user, error: authError } = await signInAdmin(email.trim(), password);
    if (authError || !user) {
      setError(authError ?? 'Login failed. Try again.');
      setLoading(false);
      return;
    }
    onLogin(user);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0faf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', fontFamily: 'Manrope, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <img
              src="https://www.arivupro.com/wp-content/uploads/2026/03/ArivuPro-Logo-1-e1786698803352.webp"
              alt="ArivuPro"
              style={{ height: 44, width: 'auto' }}
            />
          </div>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0, fontWeight: 500 }}>Finance Career Portal — Admin</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1.5px solid #d7f4ea', borderRadius: 18, padding: 36, boxShadow: '0 8px 40px rgba(26,122,74,0.08)' }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Sign in to Admin Panel</h1>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Restricted to ArivuPro administrators</p>
          </div>

          {error && (
            <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px' }}>
              <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: '#dc2626', fontSize: 13, margin: 0, fontWeight: 600 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#9ca3af" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="admin@arivupro.com"
                  style={{
                    width: '100%', paddingLeft: 38, paddingRight: 14, height: 44,
                    border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14,
                    fontFamily: 'Manrope, sans-serif', color: '#0f2419', outline: 'none',
                    background: '#fff', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1a7a4a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,122,74,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#9ca3af" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••"
                  style={{
                    width: '100%', paddingLeft: 38, paddingRight: 44, height: 44,
                    border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14,
                    fontFamily: 'Manrope, sans-serif', color: '#0f2419', outline: 'none',
                    background: '#fff', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1a7a4a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,122,74,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2, display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                width: '100%', height: 46, borderRadius: 10, border: 'none', cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                background: loading || !email || !password ? '#d7f4ea' : '#1a7a4a',
                color: loading || !email || !password ? '#6b9e82' : '#fff',
                fontSize: 15, fontWeight: 700, fontFamily: 'Manrope, sans-serif',
                transition: 'all 0.2s', marginTop: 4,
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 20 }}>
          ArivuPro Finance Career Portal · Admin Access Only
        </p>
      </div>
    </div>
  );
}
