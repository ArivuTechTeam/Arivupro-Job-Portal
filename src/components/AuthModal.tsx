import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { signInWithGoogle } from '../lib/supabase/auth';

interface AuthModalProps {
  mode: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: { name: string; email: string; role: 'student' | 'admin' | 'recruiter'; course?: string }) => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
  role?: 'student' | 'recruiter';
  onSwitchRole?: (role: 'student' | 'recruiter') => void;
}

const COURSES = [
  { value: 'CA', label: 'CA (Chartered Accountant)' },
  { value: 'ACCA', label: 'ACCA' },
  { value: 'CFA', label: 'CFA' },
  { value: 'CS', label: 'CS (Company Secretary)' },
  { value: 'CMA_INDIA', label: 'CMA India' },
  { value: 'US_CPA', label: 'US CPA' },
  { value: 'US_CMA', label: 'US CMA' },
  { value: 'BCOM', label: 'B.Com' },
  { value: 'MCOM', label: 'M.Com' },
  { value: 'MBA_FINANCE', label: 'MBA (Finance)' },
];


function validate(email: string, pass: string): string | null {
  if (!email) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
  if (!pass) return 'Password is required.';
  if (pass.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onSuccess, onSwitchMode }) => {
  const [step, setStep] = useState<'form' | 'verify'>(mode === 'signup' ? 'form' : 'form');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signup fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [course, setCourse] = useState('');

  // Login fields
  const [lEmail, setLEmail] = useState('');
  const [lPass, setLPass] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = validate(email, pass);
    if (err) { setError(err); return; }
    if (!name.trim()) { setError('Full name is required.'); return; }
    if (!course) { setError('Please select your course.'); return; }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { name: name.trim(), course, role: 'student' } },
    });
    setLoading(false);
    if (signUpError) { setError(signUpError.message); return; }
    setStep('verify');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = validate(lEmail, lPass);
    if (err) { setError(err); return; }

    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: lEmail, password: lPass });
    setLoading(false);
    if (signInError) { setError(signInError.message); return; }
    if (!data.user) { setError('Login failed. Please try again.'); return; }
    const meta = data.user.user_metadata ?? {};
    const role: 'student' | 'admin' | 'recruiter' = meta.role ?? 'student';
    onSuccess({ name: meta.name ?? lEmail, email: data.user.email ?? lEmail, role, course: meta.course });
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setLoading(false);
      setError(googleError);
    }
  };

  const handleVerifyComplete = () => {
    onSuccess({ name: name.trim(), email: email.toLowerCase(), role: 'student', course });
  };

  return (
    <div
      className="ap-fade-in"
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,30,16,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="ap-modal-pop"
        style={{
          background: '#fff', borderRadius: 20, maxWidth: 440, width: '100%',
          maxHeight: '95vh', overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(10,30,16,0.25)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {/* Logo mark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <img src="https://www.arivupro.com/wp-content/uploads/2026/03/ArivuPro-Logo-1-e1786698803352.webp" alt="ArivuPro" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }} />
              <span style={{ fontWeight: 800, fontSize: 14, color: '#0f2419' }}>ArivuPro Finance Careers</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f2419', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {step === 'verify' ? 'Verify your email' : mode === 'login' ? 'Welcome back' : 'Create your account'}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {step === 'verify'
                ? `We sent a link to ${email}`
                : mode === 'login'
                ? 'Sign in to access your placement dashboard'
                : 'Join 1,200+ finance students finding their careers'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', padding: 8, color: '#6b7280', flexShrink: 0, marginLeft: 12 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 28px' }}>

          {/* ── VERIFY STEP ── */}
          {step === 'verify' && (
            <div style={{ textAlign: 'center', paddingTop: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#d7f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle2 size={36} color="#1a7a4a" />
              </div>
              <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, marginBottom: 24 }}>
                Check your inbox at <strong style={{ color: '#0f2419' }}>{email}</strong> and click the verification link to activate your account.
              </div>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 15 }} onClick={handleVerifyComplete}>
                Continue to Dashboard →
              </button>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b7280', marginTop: 14, fontFamily: 'Manrope, sans-serif', display: 'flex', alignItems: 'center', gap: 4, margin: '14px auto 0' }}
                onClick={() => setStep('form')}
              >
                <ArrowLeft size={13} /> Back
              </button>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {step === 'form' && mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <Field label="Email address">
                <input type="email" className="input-field" value={lEmail} onChange={e => { setLEmail(e.target.value); setError(null); }} placeholder="you@example.com" autoFocus required />
              </Field>

              <Field label="Password">
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="input-field" value={lPass} onChange={e => { setLPass(e.target.value); setError(null); }} placeholder="••••••••" required style={{ paddingRight: 42 }} />
                  <EyeToggle show={showPass} onToggle={() => setShowPass(v => !v)} />
                </div>
                <div style={{ textAlign: 'right', marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: '#1a7a4a', cursor: 'pointer', fontWeight: 600 }}>Forgot password?</span>
                </div>
              </Field>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '12px' }} disabled={loading}>
                {loading ? <Spinner /> : 'Sign In →'}
              </button>

              <Divider />

              <GoogleBtn onClick={handleGoogle} loading={loading} />

              <SwitchMode mode="login" onSwitch={() => { onSwitchMode('signup'); setError(null); }} />
            </form>
          )}

          {/* ── SIGNUP FORM ── */}
          {step === 'form' && mode === 'signup' && (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <Field label="Full name">
                <input type="text" className="input-field" value={name} onChange={e => { setName(e.target.value); setError(null); }} placeholder="Rohan Venkatesh" autoFocus required />
              </Field>

              <Field label="Email address">
                <input type="email" className="input-field" value={email} onChange={e => { setEmail(e.target.value); setError(null); }} placeholder="you@example.com" required />
              </Field>

              <Field label="Password">
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="input-field" value={pass} onChange={e => { setPass(e.target.value); setError(null); }} placeholder="Min. 6 characters" required style={{ paddingRight: 42 }} />
                  <EyeToggle show={showPass} onToggle={() => setShowPass(v => !v)} />
                </div>
                {pass.length > 0 && (
                  <PasswordStrength pass={pass} />
                )}
              </Field>

              <Field label="Course / Qualification">
                <select className="input-field" value={course} onChange={e => { setCourse(e.target.value); setError(null); }} required>
                  <option value="">Select your qualification</option>
                  {COURSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '12px', marginTop: 2 }} disabled={loading}>
                {loading ? <Spinner /> : 'Create Account →'}
              </button>

              <Divider />

              <GoogleBtn onClick={handleGoogle} loading={loading} />

              <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 }}>
                By creating an account you agree to our{' '}
                <span style={{ color: '#1a7a4a', cursor: 'pointer', fontWeight: 600 }}>Terms of Service</span>
                {' '}and{' '}
                <span style={{ color: '#1a7a4a', cursor: 'pointer', fontWeight: 600 }}>Privacy Policy</span>
              </div>

              <SwitchMode mode="signup" onSwitch={() => { onSwitchMode('login'); setError(null); }} />
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5, fontFamily: 'Manrope, sans-serif' }}>{label}</label>
      {children}
    </div>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 0 }}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );
}

function PasswordStrength({ pass }: { pass: string }) {
  const strength = pass.length < 6 ? 0 : pass.length < 8 ? 1 : /[A-Z]/.test(pass) && /[0-9]/.test(pass) ? 3 : 2;
  const labels = ['', 'Weak', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#1a7a4a'];
  return (
    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: strength >= i ? colors[strength] : '#e5e7eb', transition: 'background 0.2s' }} />
      ))}
      {strength > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: colors[strength], whiteSpace: 'nowrap' }}>{labels[strength]}</span>}
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>or</span>
      <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
    </div>
  );
}

function GoogleBtn({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label="Continue with Google"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '11px', border: '1px solid #e5e7eb', borderRadius: 9, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Manrope, sans-serif', color: '#374151', transition: 'background 0.15s' }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.9 2.2 30.3 0 24 0 14.8 0 7 5.4 3.2 13.3l7.8 6C13 13.6 18.1 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h12.7c-.6 3-2.3 5.6-4.9 7.4l7.6 5.9c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M11 28.3c-.6-1.6-.9-3.3-.9-5.3s.3-3.7.9-5.3l-7.8-6C1.2 14.8 0 19.3 0 24s1.2 9.2 3.2 12.3l7.8-6z"/><path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.5-5.7l-7.6-5.9c-2.1 1.4-4.8 2.2-7.9 2.2-5.9 0-11-4.1-12.8-9.6l-7.8 6C7 42.6 14.8 48 24 48z"/></svg>
      {loading ? 'Connecting…' : 'Continue with Google'}
    </button>
  );
}

function SwitchMode({ mode, onSwitch }: { mode: 'login' | 'signup'; onSwitch: () => void }) {
  return (
    <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
      {mode === 'login' ? (
        <>Don't have an account? <button type="button" onClick={onSwitch} style={linkBtnStyle}>Sign up free</button></>
      ) : (
        <>Already have an account? <button type="button" onClick={onSwitch} style={linkBtnStyle}>Sign in</button></>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  );
}

const linkBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700,
  color: '#1a7a4a', textDecoration: 'underline', padding: 0,
};
