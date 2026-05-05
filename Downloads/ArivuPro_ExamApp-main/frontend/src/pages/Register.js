import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faAt, faEnvelope, faLock, faEye, faEyeSlash,
  faMobile, faBuilding, faPencil, faHashtag,
  faPaperPlane, faCheck, faTriangleExclamation,
  faMagnifyingGlass, faXmark, faGraduationCap,
} from '@fortawesome/free-solid-svg-icons';

const INSTITUTES = [
  'ICAI - Ahmedabad', 'ICAI - Bangalore', 'ICAI - Chennai', 'ICAI - Delhi',
  'ICAI - Hyderabad', 'ICAI - Kolkata', 'ICAI - Mumbai', 'ICAI - Pune',
  'ICAI - Jaipur', 'ICAI - Lucknow', 'ICAI - Nagpur', 'ICAI - Bhopal',
  'ICAI - Chandigarh', 'ICAI - Kochi', 'ICAI - Coimbatore', 'ICAI - Indore',
  'ICAI - Patna', 'ICAI - Surat', 'ICAI - Vadodara', 'ICAI - Visakhapatnam',
  'ICSI - Bangalore', 'ICSI - Chennai', 'ICSI - Delhi', 'ICSI - Mumbai', 'ICSI - Kolkata',
  'ICSI - Hyderabad', 'ICSI - Pune', 'ICSI - Ahmedabad', 'ICSI - Jaipur',
  'ICAI-CMA - Bangalore', 'ICAI-CMA - Chennai', 'ICAI-CMA - Delhi', 'ICAI-CMA - Mumbai',
  'ICAI-CMA - Kolkata', 'ICAI-CMA - Hyderabad', 'ICAI-CMA - Pune',
  'J.K. Shah Classes', 'Anand CA Institute', 'Aldine CA Institute',
  'Vidya Sagar Career Institute', 'CACLUB India', 'Siddharth Agarwal Classes',
  'Navkar Institute', 'IPCC Classes - Kolkata', 'EduPristine',
  'CA Wizard', 'Finapp CA Institute', 'NorthStar CA Academy',
  'MCC CA Academy - Chennai', 'NIFM - National Institute of Financial Markets',
  'VSI Jaipur - CA Foundation', 'VG Learning Destination', 'Unacademy CA',
  'Neeraj Arora CA Classes', 'ICAI Virtual Classes', 'My CA Guru',
  'Shri Ram College of Commerce (SRCC) - Delhi',
  'Narsee Monjee College - Mumbai',
  'Symbiosis College of Arts & Commerce - Pune',
  'Christ University - Bangalore',
  'Loyola College - Chennai',
  "St. Xavier's College - Kolkata",
  'Lady Shri Ram College - Delhi',
  'Presidency College - Chennai',
  'K.J. Somaiya College of Arts & Commerce - Mumbai',
  'Fergusson College - Pune',
  'Government Commerce College - Ahmedabad',
  'Madras Christian College - Chennai',
  'Jai Hind College - Mumbai',
  "St. Stephen's College - Delhi",
  'Hansraj College - Delhi', 'Miranda House - Delhi',
  'Calcutta University - Commerce Department',
  'Osmania University - Hyderabad', 'Pune University - Commerce',
  'Other',
];

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
const STRENGTH_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

const FA_STYLE = { color: '#94a3b8', fontSize: '0.85rem' };

function InstituteSearch({ value, onChange, disabled }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef(null);

  const filtered = (() => {
    const q = query.toLowerCase();
    if (!q) return INSTITUTES.slice(0, 8);
    const matches = INSTITUTES.filter(i => i !== 'Other' && i.toLowerCase().includes(q));
    if (matches.length < 8) matches.push('Other');
    return matches.slice(0, 9);
  })();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const select = (name) => { setQuery(name === 'Other' ? '' : name); onChange(name); setOpen(false); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <FontAwesomeIcon icon={faMagnifyingGlass} style={FA_STYLE} />
        </span>
        <input
          type="text" value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); setHighlighted(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown')  { setHighlighted(h => Math.min(h + 1, filtered.length - 1)); e.preventDefault(); }
            if (e.key === 'ArrowUp')    { setHighlighted(h => Math.max(h - 1, 0)); e.preventDefault(); }
            if (e.key === 'Enter' && filtered[highlighted]) { select(filtered[highlighted]); e.preventDefault(); }
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Search college / institute..."
          disabled={disabled}
          style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', background: disabled ? '#f8fafc' : '#fff' }}
          onFocusCapture={e => e.target.style.borderColor = '#4f46e5'}
          onBlurCapture={e => e.target.style.borderColor = '#e2e8f0'}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); onChange(''); }}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4, maxHeight: 240, overflowY: 'auto' }}>
          {filtered.map((inst, i) => (
            <div key={inst} onMouseDown={() => select(inst)} onMouseEnter={() => setHighlighted(i)}
              style={{ padding: '0.65rem 1rem', cursor: 'pointer', fontSize: '0.875rem', background: i === highlighted ? '#eef2ff' : 'transparent', color: inst === 'Other' ? (i === highlighted ? '#9333ea' : '#7c3aed') : (i === highlighted ? '#4f46e5' : '#374151'), display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', fontWeight: inst === 'Other' ? 600 : 400, fontStyle: inst === 'Other' ? 'italic' : 'normal' }}>
              <FontAwesomeIcon icon={inst === 'Other' ? faPencil : faBuilding} style={{ fontSize: '0.75rem', flexShrink: 0 }} />
              {inst}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OTPInput({ value, onChange, disabled }) {
  const inputs = useRef([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);
  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = [...digits]; next[i] = '';
      onChange(next.join(''));
      if (i > 0) inputs.current[i - 1]?.focus();
    } else if (/^[0-9]$/.test(e.key)) {
      const next = [...digits]; next[i] = e.key;
      onChange(next.join(''));
      if (i < 5) inputs.current[i + 1]?.focus();
    }
    e.preventDefault();
  };
  return (
    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input key={i} ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onKeyDown={e => handleKey(i, e)} onChange={() => {}} disabled={disabled}
          style={{ width: 48, height: 56, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, border: `2px solid ${d ? '#4f46e5' : '#e2e8f0'}`, borderRadius: 10, outline: 'none', background: d ? '#eef2ff' : '#fff', color: '#1e1b4b', transition: 'all 0.15s' }} />
      ))}
    </div>
  );
}

function StepBar({ step, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2rem' }}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1; const done = step > n; const active = step === n;
        return (
          <React.Fragment key={n}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: done || active ? '#4f46e5' : '#e2e8f0', color: done || active ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: done ? '0.75rem' : '0.85rem', fontWeight: 700, boxShadow: active ? '0 0 0 4px #c7d2fe' : 'none', transition: 'all 0.3s' }}>
              {done ? <FontAwesomeIcon icon={faCheck} /> : n}
            </div>
            {i < total - 1 && (
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: step > n ? '#4f46e5' : '#e2e8f0', transition: 'background 0.3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const STEP_LABELS = ['Personal Info', 'Academic Details', 'Verify Email'];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', password_confirm: '',
    phone: '', institute: '', custom_institute: '', registration_number: '',
  });

  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [otp, setOtp]         = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [devOtp, setDevOtp]   = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  const pwStrength = getStrength(formData.password);
  const isOtherInstitute = formData.institute === 'Other';

  const set = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };
  const handleChange = e => set(e.target.name, e.target.value);

  const validateStep1 = () => {
    const e = {};
    if (!formData.first_name.trim()) e.first_name = 'Required';
    if (!formData.last_name.trim())  e.last_name  = 'Required';
    if (!formData.username.trim())   e.username   = 'Required';
    if (!formData.email.trim())      e.email      = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Enter a valid email';
    if (!formData.password)          e.password   = 'Required';
    else if (formData.password.length < 8) e.password = 'Min 8 characters';
    if (formData.password !== formData.password_confirm) e.password_confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!formData.phone.trim()) e.phone = 'Mobile number is required';
    else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid 10-digit number';
    if (formData.institute === 'Other' && !formData.custom_institute.trim())
      e.custom_institute = 'Please enter your institute name';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const sendOtp = async () => {
    setOtpSending(true);
    setOtpError('');
    try {
      const res = await authAPI.sendOTP(formData.email);
      setOtp('');
      setDevOtp(res.data?.otp || '');
      setResendTimer(30);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setResendTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
      }, 1000);
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const nextStep = async () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 2) {
      setOtpSending(true);
      setOtpError('');
      try {
        const res = await authAPI.sendOTP(formData.email);
        setOtp('');
        setDevOtp(res.data?.otp || '');
        setResendTimer(30);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setResendTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
        }, 1000);
        setStep(s => s + 1);
      } catch (err) {
        setOtpError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
      } finally {
        setOtpSending(false);
      }
      return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { setOtpError('Please enter the 6-digit OTP.'); return; }
    setLoading(true);
    setOtpError('');
    try {
      await authAPI.verifyOTP(formData.email, otp);
    } catch (err) {
      setOtpError(err.response?.data?.error || 'OTP verification failed.');
      setLoading(false);
      return;
    }
    try {
      const finalInstitute = formData.institute === 'Other' ? formData.custom_institute : formData.institute;
      await register({
        username: formData.username, email: formData.email,
        first_name: formData.first_name, last_name: formData.last_name,
        password: formData.password, password_confirm: formData.password_confirm,
        role: 'student',
        phone: formData.phone.replace(/\s/g, ''),
        institute: finalInstitute,
        registration_number: formData.registration_number,
      });
      navigate('/login', { state: { message: 'Account created successfully! Please log in.' } });
    } catch (err) {
      const d = err.response?.data;
      if (typeof d === 'object' && d !== null) {
        const k = Object.keys(d)[0];
        setOtpError(Array.isArray(d[k]) ? d[k][0] : String(d[k]));
      } else {
        setOtpError(d || 'Registration failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f9ff 0%,#e0e7ff 50%,#faf5ff 100%)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 24, boxShadow: '0 8px 40px rgba(79,70,229,0.12)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#312e81 0%,#4f46e5 60%,#6d28d9 100%)', padding: '1.75rem 2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem', color: '#fff' }}>
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>Create Your Account</h2>
          <p style={{ margin: '0.3rem 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '0.83rem' }}>
            ArivuPro — Score Improvement System for CA / CS / CMA
          </p>
        </div>

        <div style={{ padding: '1.75rem 2rem 2rem' }}>
          <StepBar step={step} total={3} />
          <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '1rem', color: '#1e1b4b', marginBottom: '1.5rem', marginTop: '-0.75rem' }}>
            Step {step}: {STEP_LABELS[step - 1]}
          </p>

          {/* Step 1 — Personal Info */}
          {step === 1 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                {[
                  { name: 'first_name', label: 'First Name', placeholder: 'Arjun' },
                  { name: 'last_name',  label: 'Last Name',  placeholder: 'Sharma' },
                ].map(f => (
                  <FieldWrap key={f.name} label={f.label} error={errors[f.name]} required>
                    <InputIcon icon={<FontAwesomeIcon icon={faUser} style={FA_STYLE} />}>
                      <input name={f.name} value={formData[f.name]} onChange={handleChange} placeholder={f.placeholder} style={inputStyle(errors[f.name])} />
                    </InputIcon>
                  </FieldWrap>
                ))}
              </div>

              <FieldWrap label="Username" error={errors.username} required mb>
                <InputIcon icon={<FontAwesomeIcon icon={faAt} style={FA_STYLE} />}>
                  <input name="username" value={formData.username} onChange={handleChange} placeholder="e.g. arjun_sharma" style={inputStyle(errors.username)} />
                </InputIcon>
              </FieldWrap>

              <FieldWrap label="Email Address" error={errors.email} required mb>
                <InputIcon icon={<FontAwesomeIcon icon={faEnvelope} style={FA_STYLE} />}>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" style={inputStyle(errors.email)} />
                </InputIcon>
              </FieldWrap>

              <FieldWrap label="Password" error={errors.password} required mb>
                <InputIcon icon={<FontAwesomeIcon icon={faLock} style={FA_STYLE} />} right={
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
                  </button>
                }>
                  <input name="password" type={showPw ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="Min 8 characters" style={inputStyle(errors.password)} />
                </InputIcon>
                {formData.password && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= pwStrength ? STRENGTH_COLOR[pwStrength] : '#e2e8f0', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '0.72rem', color: STRENGTH_COLOR[pwStrength], margin: '3px 0 0', fontWeight: 600 }}>{STRENGTH_LABEL[pwStrength]}</p>
                  </div>
                )}
              </FieldWrap>

              <FieldWrap label="Confirm Password" error={errors.password_confirm} required mb>
                <InputIcon icon={<FontAwesomeIcon icon={faLock} style={FA_STYLE} />} right={
                  <button type="button" onClick={() => setShowCpw(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={showCpw ? faEyeSlash : faEye} />
                  </button>
                }>
                  <input name="password_confirm" type={showCpw ? 'text' : 'password'} value={formData.password_confirm} onChange={handleChange} placeholder="Re-enter password" style={inputStyle(errors.password_confirm)} />
                </InputIcon>
                {formData.password_confirm && formData.password === formData.password_confirm && (
                  <p style={{ fontSize: '0.72rem', color: '#16a34a', margin: '3px 0 0', fontWeight: 600 }}>
                    <FontAwesomeIcon icon={faCheck} style={{ marginRight: 4 }} /> Passwords match
                  </p>
                )}
              </FieldWrap>

              <button type="button" onClick={nextStep} style={primaryBtn}>
                Continue to Academic Details
              </button>
            </div>
          )}

          {/* Step 2 — Academic Details */}
          {step === 2 && (
            <div>
              <FieldWrap label="Mobile Number" error={errors.phone} required mb>
                <InputIcon icon={<FontAwesomeIcon icon={faMobile} style={FA_STYLE} />}>
                  <input name="phone" type="tel"
                    value={formData.phone}
                    onChange={e => set('phone', e.target.value.replace(/[^\d\s]/g, ''))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    style={inputStyle(errors.phone)}
                  />
                </InputIcon>
                {formData.phone.replace(/\s/g, '').length > 0 && (
                  <p style={{ fontSize: '0.72rem', margin: '3px 0 0', fontWeight: 600, color: /^\d{10}$/.test(formData.phone.replace(/\s/g, '')) ? '#16a34a' : '#94a3b8' }}>
                    {formData.phone.replace(/\s/g, '').length}/10 digits
                  </p>
                )}
              </FieldWrap>

              <FieldWrap label="College / Institute" mb>
                <InstituteSearch value={formData.institute} onChange={v => set('institute', v)} />
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '4px 0 0' }}>
                  Optional — start typing to search from {INSTITUTES.length - 1}+ institutes
                </p>
              </FieldWrap>

              {isOtherInstitute && (
                <FieldWrap label="Institute Name (specify)" error={errors.custom_institute} required mb>
                  <InputIcon icon={<FontAwesomeIcon icon={faPencil} style={FA_STYLE} />}>
                    <input name="custom_institute" value={formData.custom_institute} onChange={handleChange} placeholder="Enter your college or institute name" style={inputStyle(errors.custom_institute)} />
                  </InputIcon>
                </FieldWrap>
              )}

              <FieldWrap label="Registration Number" mb>
                <InputIcon icon={<FontAwesomeIcon icon={faHashtag} style={FA_STYLE} />}>
                  <input name="registration_number" value={formData.registration_number} onChange={handleChange} placeholder="e.g. CAF/2024/123456 (optional)" style={inputStyle()} />
                </InputIcon>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '4px 0 0' }}>Optional</p>
              </FieldWrap>

              {otpError && (
                <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.65rem', textAlign: 'center', color: '#991b1b', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                  <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 6 }} />
                  {otpError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setStep(1)} style={secondaryBtn}>Back</button>
                <button type="button" onClick={nextStep} style={{ ...primaryBtn, flex: 1, marginTop: 0 }} disabled={otpSending}>
                  {otpSending ? <><Spinner /> Sending OTP…</> : 'Continue — Verify Email'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Verify Email */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1.5px solid #86efac', borderRadius: 14, padding: '1.25rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.4rem', color: '#16a34a' }}>
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <p style={{ margin: 0, fontWeight: 700, color: '#15803d', fontSize: '0.95rem' }}>Verification code sent!</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#166534' }}>
                  We sent a 6-digit OTP to <strong>{formData.email}</strong>
                </p>
              </div>

              {devOtp && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '0.75rem', textAlign: 'center', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#92400e' }}>
                  <strong>Dev mode:</strong> OTP is{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.15em', color: '#4f46e5' }}>{devOtp}</span>
                </div>
              )}

              <p style={{ textAlign: 'center', fontWeight: 600, color: '#374151', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Enter the 6-digit code
              </p>

              <OTPInput value={otp} onChange={setOtp} disabled={loading} />

              {otpError && (
                <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.65rem', textAlign: 'center', color: '#991b1b', fontSize: '0.82rem', marginTop: '1rem' }}>
                  <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 6 }} />
                  {otpError}
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '1.25rem' }}>
                {otpSending
                  ? <p style={{ fontSize: '0.8rem', color: '#4f46e5' }}>Sending OTP…</p>
                  : resendTimer > 0
                    ? <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Resend in {resendTimer}s</p>
                    : (
                      <button type="button" onClick={sendOtp} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FontAwesomeIcon icon={faPaperPlane} /> Resend OTP
                      </button>
                    )
                }
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setStep(2)} style={secondaryBtn} disabled={loading}>Back</button>
                <button type="submit" disabled={loading || otp.length < 6}
                  style={{
                    ...primaryBtn, flex: 1, marginTop: 0,
                    background: otp.length === 6 && !loading ? 'linear-gradient(135deg,#16a34a,#22c55e)' : '#e2e8f0',
                    color: otp.length === 6 && !loading ? '#fff' : '#94a3b8',
                    cursor: otp.length === 6 && !loading ? 'pointer' : 'not-allowed',
                    boxShadow: otp.length === 6 ? '0 4px 14px rgba(22,163,74,0.35)' : 'none',
                  }}>
                  {loading
                    ? <><Spinner /> Creating account…</>
                    : <><FontAwesomeIcon icon={faCheck} style={{ marginRight: 6 }} /> Verify &amp; Create Account</>
                  }
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'none' }}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldWrap({ label, error, required, children, mb }) {
  return (
    <div style={{ marginBottom: mb ? '1rem' : 0 }}>
      {label && (
        <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      {children}
      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.72rem', margin: '3px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <FontAwesomeIcon icon={faTriangleExclamation} /> {error}
        </p>
      )}
    </div>
  );
}

function InputIcon({ icon, children, right }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>{icon}</span>
      {React.cloneElement(children, {
        style: { ...children.props.style, paddingLeft: '2.2rem', paddingRight: right ? '2.5rem' : undefined },
      })}
      {right && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>{right}</div>}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', marginRight: 6 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}

function inputStyle(error) {
  return { width: '100%', boxSizing: 'border-box', padding: '0.72rem 0.85rem', border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 10, fontSize: '0.875rem', background: error ? '#fff5f5' : '#fff', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' };
}

const primaryBtn = {
  width: '100%', padding: '0.85rem',
  background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
  color: '#fff', border: 'none', borderRadius: 12,
  fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
  boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
  transition: 'all 0.2s', marginTop: '1.5rem',
};

const secondaryBtn = { padding: '0.85rem 1.25rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', color: '#475569', transition: 'background 0.15s' };
