import React, { useState } from 'react';
import { CheckCircle2, Clock, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface RecruiterSignupProps {
  onComplete: (data: { fullName: string; email: string }) => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: 'Your Details',
  2: 'Company Info',
  3: 'Submitted',
};

export const RecruiterSignup: React.FC<RecruiterSignupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Step 1 — personal
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 — company
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [cin, setCin] = useState('');
  const [gstin, setGstin] = useState('');
  const [linkedinPage, setLinkedinPage] = useState('');

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/recruiters/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          phone: phone || null,
          company_name: companyName,
          company_website: companyWebsite || null,
          company_domain: companyDomain || null,
          office_address: officeAddress || null,
          city: city || null,
          state: state || null,
          cin: cin || null,
          gstin: gstin || null,
          linkedin_page: linkedinPage || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Registration failed. Please try again.'); setLoading(false); return; }
      setStep(3);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 20px' }}>
      {/* Progress stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
        {([1, 2, 3] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13, fontFamily: 'Manrope, sans-serif',
                  background: step > s ? '#1a7a4a' : step === s ? '#0f2419' : '#e5e7eb',
                  color: step >= s ? '#fff' : '#9ca3af',
                  transition: 'all 0.2s ease',
                }}
              >
                {step > s ? <CheckCircle2 size={16} /> : s}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'Manrope, sans-serif', color: step >= s ? '#0f2419' : '#9ca3af', whiteSpace: 'nowrap' }}>
                {STEP_LABELS[s]}
              </div>
            </div>
            {i < 2 && (
              <div style={{ flex: 1, height: 2, background: step > s ? '#1a7a4a' : '#e5e7eb', marginBottom: 20, transition: 'background 0.2s ease' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="card" style={{ padding: 28 }}>

        {/* ── Step 1: Personal Details ── */}
        {step === 1 && (
          <form onSubmit={handleStep1}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', marginBottom: 20, letterSpacing: '-0.02em' }}>
              Your Details
            </div>
            {error && <ErrorBanner>{error}</ErrorBanner>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Full Name">
                <input type="text" className="input-field" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Priya Sharma" required />
              </Field>
              <Field label="Work Email">
                <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} placeholder="priya@yourcompany.com" required />
              </Field>
              <Field label="Password">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input-field"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Field label="Phone (optional)">
                <input type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={onCancel} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                Next <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        {/* ── Step 2: Company Details ── */}
        {step === 2 && (
          <form onSubmit={handleStep2}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', marginBottom: 20, letterSpacing: '-0.02em' }}>
              Company Details
            </div>
            {error && <ErrorBanner>{error}</ErrorBanner>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Company Name">
                <input type="text" className="input-field" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Deloitte India" required />
              </Field>
              <Field label="Company Website">
                <input type="text" className="input-field" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="https://deloitte.com" />
              </Field>
              <Field label="Company Domain (email domain)">
                <input type="text" className="input-field" value={companyDomain} onChange={e => setCompanyDomain(e.target.value)} placeholder="deloitte.com" />
              </Field>
              <Field label="Office Address">
                <input type="text" className="input-field" value={officeAddress} onChange={e => setOfficeAddress(e.target.value)} placeholder="12, MG Road, Bengaluru" />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="City">
                  <input type="text" className="input-field" value={city} onChange={e => setCity(e.target.value)} placeholder="Bengaluru" />
                </Field>
                <Field label="State">
                  <input type="text" className="input-field" value={state} onChange={e => setState(e.target.value)} placeholder="Karnataka" />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="CIN (optional)">
                  <input type="text" className="input-field" value={cin} onChange={e => setCin(e.target.value)} placeholder="L17110KA2000..." />
                </Field>
                <Field label="GSTIN (optional)">
                  <input type="text" className="input-field" value={gstin} onChange={e => setGstin(e.target.value)} placeholder="29AABCT..." />
                </Field>
              </div>
              <Field label="LinkedIn Company Page (optional)">
                <input type="text" className="input-field" value={linkedinPage} onChange={e => setLinkedinPage(e.target.value)} placeholder="linkedin.com/company/deloitte" />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setStep(1)} className="btn-ghost" style={{ flex: 1 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Submitting…' : <>Submit for Verification <ArrowRight size={14} /></>}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: Submitted ── */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Clock size={30} color="#b45309" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Registration Submitted!
            </div>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, marginBottom: 20 }}>
              We've received your registration for <strong>{companyName}</strong>. Our team has been notified and will verify your account within 1–2 business days.
            </p>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, textAlign: 'left', marginBottom: 24, fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: '#0f2419', marginBottom: 8 }}>What happens next?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: '#374151' }}>
                <div style={{ display: 'flex', gap: 8 }}><span style={{ color: '#1a7a4a', fontWeight: 700 }}>1.</span> ArivuPro team reviews your company details</div>
                <div style={{ display: 'flex', gap: 8 }}><span style={{ color: '#1a7a4a', fontWeight: 700 }}>2.</span> You'll receive an approval email at <strong>{email}</strong></div>
                <div style={{ display: 'flex', gap: 8 }}><span style={{ color: '#1a7a4a', fontWeight: 700 }}>3.</span> Login with your credentials to post jobs</div>
              </div>
            </div>
            <button
              onClick={() => onComplete({ fullName, email })}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Got it, I'll wait for approval →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: 5, fontFamily: 'Manrope, sans-serif' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
      {children}
    </div>
  );
}
