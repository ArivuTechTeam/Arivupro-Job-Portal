import React, { useState } from 'react';
import { CheckCircle2, Clock, ArrowRight, ArrowLeft, Eye, EyeOff, Building2 } from 'lucide-react';

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

const COMPANY_TYPES = [
  'Big 4 / Mid-tier Audit Firm',
  'CA / CS / CMA Practice Firm',
  'Investment Bank / Boutique IB',
  'Fintech / Payments',
  'BFSI (Bank / NBFC / Insurance)',
  'GCC / BPO / Shared Services',
  'Consulting Firm',
  'Corporate (Listed Company)',
  'Corporate (Unlisted Company)',
  'Recruitment / Staffing',
  'Other',
];

const COMPANY_SIZES = [
  '1–10 employees',
  '11–50 employees',
  '51–200 employees',
  '201–1,000 employees',
  '1,001–5,000 employees',
  '5,001–10,000 employees',
  '10,000+ employees',
];

const HIRING_FOCUS_OPTIONS = [
  'CA Articleship',
  'CA Fresher (Post Qualification)',
  'ACCA / US CPA',
  'CFA / Investment Roles',
  'CS / Secretarial',
  'CMA India / Cost Accounting',
  'Finance Internships',
  'Full-Time Finance Roles',
  'Accounts & Bookkeeping',
  'Tax & GST',
];

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
  const [companyType, setCompanyType] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [aboutCompany, setAboutCompany] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [yearEstablished, setYearEstablished] = useState('');
  const [cin, setCin] = useState('');
  const [gstin, setGstin] = useState('');
  const [linkedinPage, setLinkedinPage] = useState('');
  const [hiringFocus, setHiringFocus] = useState<string[]>([]);

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
          company_type: companyType || null,
          company_size: companySize || null,
          company_website: companyWebsite || null,
          company_domain: companyDomain || null,
          about_company: aboutCompany || null,
          office_address: officeAddress || null,
          city: city || null,
          state: state || null,
          year_established: yearEstablished || null,
          cin: cin || null,
          gstin: gstin || null,
          linkedin_page: linkedinPage || null,
          hiring_focus: hiringFocus.length > 0 ? hiringFocus : null,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Building2 size={20} color="#1a7a4a" />
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', letterSpacing: '-0.02em' }}>Company Details</div>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
              This information helps us verify your company and display your profile to candidates.
            </p>
            {error && <ErrorBanner>{error}</ErrorBanner>}

            {/* Section: Identity */}
            <SectionLabel>Company Identity</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 20 }}>
              <Field label="Company Name *">
                <input type="text" className="input-field" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Deloitte India LLP" required />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Company Type *">
                  <select className="input-field" value={companyType} onChange={e => setCompanyType(e.target.value)} required style={{ cursor: 'pointer' }}>
                    <option value="">Select type</option>
                    {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Company Size *">
                  <select className="input-field" value={companySize} onChange={e => setCompanySize(e.target.value)} required style={{ cursor: 'pointer' }}>
                    <option value="">Select size</option>
                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Website">
                  <input type="text" className="input-field" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="https://deloitte.com" />
                </Field>
                <Field label="Year Established">
                  <input type="text" className="input-field" value={yearEstablished} onChange={e => setYearEstablished(e.target.value)} placeholder="e.g. 2001" maxLength={4} />
                </Field>
              </div>
              <Field label="About Your Company *">
                <textarea
                  className="input-field"
                  value={aboutCompany}
                  onChange={e => setAboutCompany(e.target.value)}
                  placeholder="Briefly describe what your company does, the kind of finance professionals you hire, and what makes working here unique. (2–4 sentences)"
                  required
                  rows={4}
                  style={{ resize: 'vertical', minHeight: 90 }}
                />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{aboutCompany.length}/500 characters</div>
              </Field>
            </div>

            {/* Section: Location */}
            <SectionLabel>Office Location</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 20 }}>
              <Field label="Office Address *">
                <input type="text" className="input-field" value={officeAddress} onChange={e => setOfficeAddress(e.target.value)} placeholder="12, MG Road, Indiranagar" required />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="City *">
                  <input type="text" className="input-field" value={city} onChange={e => setCity(e.target.value)} placeholder="Bengaluru" required />
                </Field>
                <Field label="State *">
                  <input type="text" className="input-field" value={state} onChange={e => setState(e.target.value)} placeholder="Karnataka" required />
                </Field>
              </div>
            </div>

            {/* Section: Hiring Focus */}
            <SectionLabel>What Roles Do You Hire For? *</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {HIRING_FOCUS_OPTIONS.map(opt => {
                const selected = hiringFocus.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHiringFocus(prev => selected ? prev.filter(x => x !== opt) : [...prev, opt])}
                    style={{
                      padding: '6px 13px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', border: '1.5px solid',
                      borderColor: selected ? '#1a7a4a' : '#e5e7eb',
                      background: selected ? '#1a7a4a' : '#fff',
                      color: selected ? '#fff' : '#374151',
                      fontFamily: 'Manrope, sans-serif',
                      transition: 'all 0.12s',
                    }}
                  >
                    {selected ? '✓ ' : ''}{opt}
                  </button>
                );
              })}
            </div>
            {hiringFocus.length === 0 && (
              <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 12, marginTop: -12 }}>Select at least one hiring focus</div>
            )}

            {/* Section: Verification */}
            <SectionLabel>Verification Details (optional but speeds up approval)</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 20 }}>
              <Field label="Email Domain">
                <input type="text" className="input-field" value={companyDomain} onChange={e => setCompanyDomain(e.target.value)} placeholder="deloitte.com" />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>The domain of your work email (e.g. deloitte.com)</div>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="CIN">
                  <input type="text" className="input-field" value={cin} onChange={e => setCin(e.target.value)} placeholder="L17110KA2000..." />
                </Field>
                <Field label="GSTIN">
                  <input type="text" className="input-field" value={gstin} onChange={e => setGstin(e.target.value)} placeholder="29AABCT..." />
                </Field>
              </div>
              <Field label="LinkedIn Company Page">
                <input type="text" className="input-field" value={linkedinPage} onChange={e => setLinkedinPage(e.target.value)} placeholder="linkedin.com/company/deloitte" />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setStep(1)} className="btn-ghost" style={{ flex: 1 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}
                disabled={loading || hiringFocus.length === 0}
              >
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color: '#1a7a4a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 10, fontFamily: 'Manrope, sans-serif', borderBottom: '1.5px solid #d7f4ea', paddingBottom: 5 }}>
      {children}
    </div>
  );
}
