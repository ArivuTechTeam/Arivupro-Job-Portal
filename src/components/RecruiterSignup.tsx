import React, { useState } from 'react';
import { CheckCircle2, Clock, ArrowRight, ArrowLeft } from 'lucide-react';

interface RecruiterSignupProps {
  onComplete: (data: RecruiterSignupData) => void;
  onCancel: () => void;
}

interface RecruiterSignupData {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  website: string;
  cin: string;
  gstin: string;
  linkedin: string;
  verificationStatus: 'mca_verified' | 'gst_verified' | 'pending_review';
}

type Step = 1 | 2 | 3;

function getEmailDomain(email: string): string {
  return email.includes('@') ? email.split('@')[1] : '';
}

function getWebsiteDomain(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^www\./, '').replace(/\/.*$/, '');
  }
}

const STEP_LABELS: Record<Step, string> = {
  1: 'Account',
  2: 'Company Details',
  3: 'Verification',
};

export const RecruiterSignup: React.FC<RecruiterSignupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [cin, setCin] = useState('');
  const [gstin, setGstin] = useState('');
  const [linkedin, setLinkedin] = useState('');

  // Derived
  const domainMatch =
    email && website
      ? getEmailDomain(email) === getWebsiteDomain(website)
      : null;

  const verificationStatus: RecruiterSignupData['verificationStatus'] =
    cin ? 'mca_verified' : gstin ? 'gst_verified' : 'pending_review';

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleFinish = () => {
    onComplete({
      fullName,
      email,
      password,
      companyName,
      website,
      cin,
      gstin,
      linkedin,
      verificationStatus,
    });
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '40px auto',
        padding: '0 20px',
      }}
    >
      {/* Progress stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
        {([1, 2, 3] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  fontFamily: 'Manrope, sans-serif',
                  background: step > s ? '#1a7a4a' : step === s ? '#0f2419' : '#e5e7eb',
                  color: step >= s ? '#fff' : '#9ca3af',
                  transition: 'all 0.2s ease',
                }}
              >
                {step > s ? <CheckCircle2 size={16} /> : s}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'Manrope, sans-serif',
                  color: step >= s ? '#0f2419' : '#9ca3af',
                  whiteSpace: 'nowrap',
                }}
              >
                {STEP_LABELS[s]}
              </div>
            </div>
            {i < 2 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: step > s ? '#1a7a4a' : '#e5e7eb',
                  marginBottom: 20,
                  transition: 'background 0.2s ease',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div
        className="card"
        style={{ padding: 28 }}
      >
        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleStep1}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', marginBottom: 20, letterSpacing: '-0.02em' }}>
              Create Your Account
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelSt}>Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Priya Sharma"
                  required
                />
              </div>
              <div>
                <label style={labelSt}>Work Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@yourcompany.com"
                  required
                />
              </div>
              <div>
                <label style={labelSt}>Password</label>
                <input
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={onCancel} className="btn-ghost" style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                Next <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleStep2}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', marginBottom: 20, letterSpacing: '-0.02em' }}>
              Company Details
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelSt}>Company Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Deloitte India"
                  required
                />
              </div>
              <div>
                <label style={labelSt}>Company Website</label>
                <input
                  type="text"
                  className="input-field"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="deloitte.com"
                  required
                />
                {domainMatch === false && email && website && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#b45309',
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: 7,
                      padding: '8px 12px',
                    }}
                  >
                    ⚠ Email domain ({getEmailDomain(email)}) doesn't match website domain ({getWebsiteDomain(website)}).
                    Your account will require manual verification.
                  </div>
                )}
                {domainMatch === true && (
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: '#1a7a4a' }}>
                    ✓ Domain email match confirmed
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelSt}>CIN (optional)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    placeholder="L17110KA2000..."
                  />
                </div>
                <div>
                  <label style={labelSt}>GSTIN (optional)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="29AABCT..."
                  />
                </div>
              </div>
              <div>
                <label style={labelSt}>LinkedIn Page (optional)</label>
                <input
                  type="text"
                  className="input-field"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="linkedin.com/company/deloitte"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setStep(1)} className="btn-ghost" style={{ flex: 1 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                Submit for Verification <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Verification status */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: verificationStatus === 'pending_review' ? '#fffbeb' : '#d7f4ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              {verificationStatus === 'pending_review' ? (
                <Clock size={30} color="#b45309" />
              ) : (
                <CheckCircle2 size={30} color="#1a7a4a" />
              )}
            </div>

            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', marginBottom: 8, letterSpacing: '-0.02em' }}>
              {verificationStatus === 'mca_verified'
                ? 'MCA Verified ✓'
                : verificationStatus === 'gst_verified'
                ? 'GST Verified ✓'
                : 'Under Review'}
            </div>

            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, marginBottom: 20 }}>
              {verificationStatus === 'pending_review'
                ? `Your company ${companyName} is under manual review. Our team will verify via domain email match and company records within 1–2 business days.`
                : `${companyName} has been successfully verified. You can now post jobs and access the recruiter dashboard.`}
            </p>

            {/* Summary card */}
            <div
              style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '16px',
                textAlign: 'left',
                marginBottom: 24,
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f2419', marginBottom: 8 }}>Registration Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, color: '#374151' }}>
                <div><span style={{ fontWeight: 600, color: '#6b7280' }}>Name: </span>{fullName}</div>
                <div><span style={{ fontWeight: 600, color: '#6b7280' }}>Company: </span>{companyName}</div>
                <div><span style={{ fontWeight: 600, color: '#6b7280' }}>Email: </span>{email}</div>
                <div><span style={{ fontWeight: 600, color: '#6b7280' }}>Verification: </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        verificationStatus === 'pending_review'
                          ? '#b45309'
                          : '#1a7a4a',
                    }}
                  >
                    {verificationStatus === 'mca_verified'
                      ? 'MCA CIN Verified'
                      : verificationStatus === 'gst_verified'
                      ? 'GSTIN Verified'
                      : 'Pending Manual Review'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {verificationStatus === 'pending_review' ? 'Got it' : 'Go to Dashboard'} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const labelSt: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 5,
  fontFamily: 'Manrope, sans-serif',
};
