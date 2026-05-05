import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Palette (matches AdminLogin / Student Feedback Dashboard)
const P = {
  brand: "#26895A",
  brandDark: "#1B6543",
  brandLight: "#E6F1EB",
  accent: "#C8956D",
  ink: "#1A2421",
  inkSoft: "#2A3431",
  paper: "#FAFAF5",
  paperDeep: "#F2F1E8",
  red: "#B84D3F",
};

// Inline SVG icons (no emoji, no external deps)
const Icons = {
  GraduationCap: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 4 3 6 3s6-2 6-3v-5"/>
    </svg>
  ),
  Mail: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Lock: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Eye: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
    </svg>
  ),
  FileText: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  Activity: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
};

const Spinner = () => (
  <svg className="ap-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.username || !formData.password) {
      setError('Both fields are required.');
      return;
    }
    setLoading(true);
    try {
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Unable to connect to the server. Please ensure the backend is running.');
      } else {
        setError(
          err.response.data?.detail ||
          err.response.data?.non_field_errors?.[0] ||
          'Login failed. Please check your credentials.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: P.paper, color: P.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .ap-login * { font-family: 'Instrument Sans', system-ui, sans-serif; }
        .ap-display { font-family: 'Fraunces', serif; }
        .ap-mono { font-family: 'JetBrains Mono', monospace; }
        .ap-grain { background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0); background-size: 24px 24px; }
        .ap-fade { animation: apFadeIn 0.4s ease-out; }
        @keyframes apFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes apSpin { to { transform: rotate(360deg); } }
        .ap-spin { animation: apSpin 0.7s linear infinite; }
        .ap-field { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: white; border: 1px solid #D6D3CE; border-radius: 2px; transition: all 0.15s; }
        .ap-field:focus-within { border-color: ${P.brand}; box-shadow: 0 0 0 3px ${P.brandLight}; }
        .ap-field input { background: transparent; outline: none; border: none; width: 100%; font-size: 14px; color: ${P.ink}; font-family: 'Instrument Sans', system-ui, sans-serif; }
        .ap-field input::placeholder { color: #a8a29e; }
        .ap-btn { width: 100%; padding: 12px 16px; font-size: 14px; font-weight: 500; color: white; border: none; border-radius: 2px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Instrument Sans', system-ui, sans-serif; }
        .ap-btn:hover { opacity: 0.9; }
        .ap-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .ap-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: #78716c; font-weight: 500; display: block; margin-bottom: 6px; }
        @media (max-width: 1023px) { .ap-left-panel { display: none !important; } }
      `}</style>

      {/* Left panel — Brand / Editorial */}
      <div className="ap-left-panel ap-login" style={{
        width: '44%', display: 'flex', flexDirection: 'column', padding: '48px',
        background: P.ink, color: P.paper, position: 'relative', overflow: 'hidden'
      }}>
        <div className="ap-grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -160, left: -160, width: 500, height: 500, borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', background: `radial-gradient(circle, ${P.brand}30 0%, transparent 70%)` }} />
        <div style={{ position: 'absolute', bottom: -160, right: -160, width: 400, height: 400, borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', background: `radial-gradient(circle, ${P.accent}20 0%, transparent 70%)` }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.brand }}>
            <Icons.GraduationCap />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '0.05em', color: P.paper }}>ARIVUPRO ACADEMY</div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#78716c' }}>Student Portal</div>
          </div>
        </div>

        {/* Classification */}
        <div style={{ position: 'relative', zIndex: 10, marginTop: 48, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#78716c' }}>
          <span style={{ width: 32, height: 1, background: '#57534e' }} />
          <span>CA / CS / CMA</span>
          <span style={{ color: P.brand }}>2026</span>
        </div>

        {/* Hero copy */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 400 }}>
          <h1 className="ap-display" style={{ fontSize: '2.75rem', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.01em', color: P.paper, margin: '0 0 20px' }}>
            Your scores,{' '}
            <span style={{ display: 'block', fontStyle: 'italic', color: P.brand }}>intelligently improved.</span>
          </h1>
          <p style={{ color: '#78716c', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Upload your answer scripts, get instant AI-powered evaluation with detailed question-wise feedback, and track your improvement journey toward exam success.
          </p>
        </div>

        {/* Capability list */}
        <div style={{ position: 'relative', zIndex: 10, marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { Icon: Icons.FileText, title: "Script Evaluation", sub: "Upload answer scripts and get graded instantly" },
            { Icon: Icons.Sparkles, title: "AI-Powered Feedback", sub: "Question-by-question analysis with marking scheme" },
            { Icon: Icons.TrendingUp, title: "Performance Tracking", sub: "Monitor progress across papers and subjects" },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flexShrink: 0, marginTop: 2, padding: 6, borderRadius: 2, background: `${P.brand}25`, color: P.brand }}>
                <c.Icon />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: P.paper }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#78716c', marginTop: 2 }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ position: 'relative', zIndex: 10, marginTop: 'auto', paddingTop: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', fontSize: 10, color: '#78716c' }}>
          <div style={{ maxWidth: 260, lineHeight: 1.6 }}>
            Powered by ArivuPro AI evaluation engine. Your data is encrypted and secure.
          </div>
          <div className="ap-mono" style={{ textAlign: 'right' }}>
            <div>v3.7.2</div>
            <div style={{ color: '#57534e' }}>build 2026.05.04</div>
          </div>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="ap-login" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile header */}
        <div style={{ display: 'none', padding: '20px 24px', borderBottom: '1px solid #e7e5e4', alignItems: 'center', justifyContent: 'space-between' }} className="ap-mobile-hdr">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.brand }}>
              <Icons.GraduationCap />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: P.brand }}>ARIVUPRO</div>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#78716c' }}>Student Portal</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 24px' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#78716c' }}>
                <span>Student Sign-in</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: P.brand }} />
              </div>
              <h2 className="ap-display" style={{ fontSize: '1.875rem', fontWeight: 300, letterSpacing: '-0.01em', color: P.ink, margin: 0 }}>
                Welcome back.
              </h2>
              <p style={{ fontSize: 14, color: '#78716c', marginTop: 8, lineHeight: 1.6 }}>
                Sign in with your credentials to access your dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="ap-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Username */}
              <div>
                <label className="ap-label">Username</label>
                <div className="ap-field">
                  <Icons.Mail />
                  <input type="text" name="username" placeholder="Enter your username" value={formData.username} onChange={handleChange} autoFocus disabled={loading} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="ap-label">Password</label>
                <div className="ap-field">
                  <Icons.Lock />
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: 0, flexShrink: 0, display: 'flex', transition: 'color 0.15s' }}>
                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 2, background: '#FCEDEA', color: P.red }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}><Icons.AlertCircle /></span>
                  <span style={{ fontSize: 12, lineHeight: 1.5 }}>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading} className="ap-btn" style={{ background: P.ink }}>
                {loading ? (<><Spinner /> Signing in...</>) : (<>Continue <Icons.Arrow /></>)}
              </button>
            </form>

            {/* Register link */}
            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#78716c' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: P.brand, textDecoration: 'none', fontWeight: 600 }}>
                Create one
              </Link>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e7e5e4' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#78716c' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icons.Activity />
                  All systems operational
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ cursor: 'pointer' }}>Help</span>
                  <span style={{ width: 1, height: 12, background: '#d6d3d1' }} />
                  <span style={{ cursor: 'pointer' }}>Privacy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
