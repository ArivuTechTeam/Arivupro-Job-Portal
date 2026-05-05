import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const P = {
  brand: "#26895A", brandDark: "#1B6543", brandLight: "#E6F1EB",
  accent: "#C8956D", ink: "#1A2421", paper: "#FAFAF5", red: "#B84D3F",
};

const EXAM_LEVELS = {
  CA: ['Foundation', 'Intermediate', 'Final'],
  CS: ['Foundation', 'Executive', 'Professional'],
  CMA: ['Foundation', 'Intermediate', 'Final'],
};

// Inline SVG icons
const Icons = {
  GraduationCap: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 4 3 6 3s6-2 6-3v-5"/>
    </svg>
  ),
  User: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
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
  CheckCircle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.brand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Phone: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Building: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
    </svg>
  ),
  Hash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>
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

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', password_confirm: '', role: 'student',
    exam_type: 'CA', exam_level: 'Foundation',
    phone: '', institute: '', registration_number: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'exam_type') updated.exam_level = EXAM_LEVELS[value][0];
      return updated;
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.'); return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.'); return;
    }
    setLoading(true);
    try {
      const submitData = {
        username: formData.username, email: formData.email,
        first_name: formData.first_name, last_name: formData.last_name,
        password: formData.password, password_confirm: formData.password_confirm,
        role: formData.role,
      };
      if (formData.role === 'student') {
        submitData.exam_type = formData.exam_type;
        submitData.exam_level = formData.exam_level;
        submitData.phone = formData.phone;
        submitData.institute = formData.institute;
        submitData.registration_number = formData.registration_number;
      }
      await register(submitData);
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      if (!err.response) {
        setError('Unable to connect to the server.');
      } else {
        const d = err.response.data;
        if (d && typeof d === 'object') {
          const first = Object.values(d)[0];
          setError(Array.isArray(first) ? first[0] : String(first));
        } else {
          setError(typeof d === 'string' ? d : 'Registration failed.');
        }
      }
    } finally { setLoading(false); }
  };

  const isStudent = formData.role === 'student';
  const examLevels = EXAM_LEVELS[formData.exam_type];

  const Field = ({ icon: Icon, children, ...rest }) => (
    <div className="ap-field">{Icon && <Icon />}{children}</div>
  );

  const Select = ({ value, onChange, name, options, disabled }) => (
    <select value={value} onChange={onChange} name={name} disabled={disabled} style={{
      width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #D6D3CE',
      borderRadius: 2, background: 'white', color: P.ink, outline: 'none',
      fontFamily: "'Instrument Sans', system-ui, sans-serif",
      transition: 'all 0.15s', cursor: 'pointer',
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: P.paper, color: P.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .ap-reg * { font-family: 'Instrument Sans', system-ui, sans-serif; }
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
        select:focus { border-color: ${P.brand}; box-shadow: 0 0 0 3px ${P.brandLight}; }
        @media (max-width: 1023px) { .ap-left-panel { display: none !important; } }
      `}</style>

      {/* Left panel */}
      <div className="ap-left-panel ap-reg" style={{
        width: '44%', display: 'flex', flexDirection: 'column', padding: '48px',
        background: P.ink, color: P.paper, position: 'relative', overflow: 'hidden'
      }}>
        <div className="ap-grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -160, left: -160, width: 500, height: 500, borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', background: `radial-gradient(circle, ${P.brand}30 0%, transparent 70%)` }} />
        <div style={{ position: 'absolute', bottom: -160, right: -160, width: 400, height: 400, borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', background: `radial-gradient(circle, ${P.accent}20 0%, transparent 70%)` }} />

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.brand }}>
            <Icons.GraduationCap />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '0.05em', color: P.paper }}>ARIVUPRO ACADEMY</div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#78716c' }}>Student Portal</div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 10, marginTop: 48, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#78716c' }}>
          <span style={{ width: 32, height: 1, background: '#57534e' }} />
          <span>New Registration</span>
          <span style={{ color: P.brand }}>2026</span>
        </div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 400 }}>
          <h1 className="ap-display" style={{ fontSize: '2.75rem', fontWeight: 300, lineHeight: 1.05, color: P.paper, margin: '0 0 20px' }}>
            Begin your{' '}
            <span style={{ display: 'block', fontStyle: 'italic', color: P.brand }}>journey to excellence.</span>
          </h1>
          <p style={{ color: '#78716c', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            Create your ArivuPro account to access AI-powered answer script evaluation, personalized feedback, and comprehensive performance tracking.
          </p>
        </div>

        {/* Benefits */}
        <div style={{ position: 'relative', zIndex: 10, marginTop: 48, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            "Instant AI evaluation of answer scripts",
            "Question-wise marking with ICAI standards",
            "Detailed feedback and improvement suggestions",
            "Track progress across multiple attempts",
          ].map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icons.CheckCircle />
              <span style={{ fontSize: 13, color: '#a8a29e' }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 10, marginTop: 'auto', paddingTop: 48, fontSize: 10, color: '#78716c' }}>
          Already registered? <Link to="/login" style={{ color: P.brand, textDecoration: 'none' }}>Sign in here</Link>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="ap-reg" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
          <div style={{ width: '100%', maxWidth: 440 }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#78716c' }}>
                <span>Create Account</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: P.brand }} />
              </div>
              <h2 className="ap-display" style={{ fontSize: '1.875rem', fontWeight: 300, color: P.ink, margin: 0 }}>
                Let's get started.
              </h2>
              <p style={{ fontSize: 14, color: '#78716c', marginTop: 8, lineHeight: 1.6 }}>
                Fill in your details to create your student account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="ap-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Names */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="ap-label">First Name</label>
                  <Field icon={Icons.User}><input type="text" name="first_name" placeholder="First name" value={formData.first_name} onChange={handleChange} required disabled={loading} /></Field>
                </div>
                <div>
                  <label className="ap-label">Last Name</label>
                  <Field icon={Icons.User}><input type="text" name="last_name" placeholder="Last name" value={formData.last_name} onChange={handleChange} required disabled={loading} /></Field>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="ap-label">Username</label>
                <Field icon={Icons.User}><input type="text" name="username" placeholder="Choose a username" value={formData.username} onChange={handleChange} required disabled={loading} /></Field>
              </div>

              {/* Email */}
              <div>
                <label className="ap-label">Email</label>
                <Field icon={Icons.Mail}><input type="email" name="email" placeholder="your@email.com" value={formData.email} onChange={handleChange} required disabled={loading} /></Field>
              </div>

              {/* Passwords */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="ap-label">Password</label>
                  <div className="ap-field">
                    <Icons.Lock />
                    <input type={showPassword ? "text" : "password"} name="password" placeholder="Min 8 characters" value={formData.password} onChange={handleChange} required disabled={loading} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: 0, flexShrink: 0, display: 'flex' }}>
                      {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="ap-label">Confirm Password</label>
                  <Field icon={Icons.Lock}><input type="password" name="password_confirm" placeholder="Confirm" value={formData.password_confirm} onChange={handleChange} required disabled={loading} /></Field>
                </div>
              </div>

              {/* Exam Type + Level */}
              {isStudent && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="ap-label">Exam Type</label>
                      <Select name="exam_type" value={formData.exam_type} onChange={handleChange} disabled={loading} options={[
                        { value: 'CA', label: 'Chartered Accountant (CA)' },
                        { value: 'CS', label: 'Company Secretary (CS)' },
                        { value: 'CMA', label: 'Cost Management (CMA)' },
                      ]} />
                    </div>
                    <div>
                      <label className="ap-label">Exam Level</label>
                      <Select name="exam_level" value={formData.exam_level} onChange={handleChange} disabled={loading}
                        options={examLevels.map(l => ({ value: l, label: l }))} />
                    </div>
                  </div>

                  {/* Phone + Institute */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="ap-label">Phone (Optional)</label>
                      <Field icon={Icons.Phone}><input type="tel" name="phone" placeholder="Phone number" value={formData.phone} onChange={handleChange} disabled={loading} /></Field>
                    </div>
                    <div>
                      <label className="ap-label">Reg. Number (Optional)</label>
                      <Field icon={Icons.Hash}><input type="text" name="registration_number" placeholder="Reg number" value={formData.registration_number} onChange={handleChange} disabled={loading} /></Field>
                    </div>
                  </div>

                  <div>
                    <label className="ap-label">Institute (Optional)</label>
                    <Field icon={Icons.Building}><input type="text" name="institute" placeholder="Your institute or college" value={formData.institute} onChange={handleChange} disabled={loading} /></Field>
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 2, background: '#FCEDEA', color: P.red }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}><Icons.AlertCircle /></span>
                  <span style={{ fontSize: 12, lineHeight: 1.5 }}>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading} className="ap-btn" style={{ background: P.brand, marginTop: 4 }}>
                {loading ? (<><Spinner /> Creating account...</>) : (<>Create Account <Icons.Arrow /></>)}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#78716c' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: P.brand, textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
            </div>

            <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e7e5e4' }}>
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

export default Register;
