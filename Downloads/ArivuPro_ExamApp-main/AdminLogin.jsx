import { useState, useRef, useEffect } from 'react';
import {
  Lock, Mail, Eye, EyeOff, ShieldCheck, KeyRound, ArrowRight, AlertCircle,
  CheckCircle2, GraduationCap, Sparkles, Activity, Users, BarChart3, ScrollText
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// PALETTE (matches Student Feedback Dashboard)
// ──────────────────────────────────────────────────────────────────────────────
const palette = {
  brand: "#26895A",
  brandDark: "#1B6543",
  brandLight: "#E6F1EB",
  accent: "#C8956D",
  ink: "#1A2421",
  inkSoft: "#2A3431",
  paper: "#FAFAF5",
  paperDeep: "#F2F1E8",
  red: "#B84D3F",
  amber: "#C99B3F"
};

// ──────────────────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────────────────
export default function AdminLogin() {
  const [step, setStep] = useState("credentials"); // credentials | otp | success
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpRefs = useRef([]);

  const handleCredentialsSubmit = (e) => {
    e?.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Both fields are required.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }, 900);
  };

  const handleOtpChange = (i, v) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...otp];
    next[i] = v.slice(-1);
    setOtp(next);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const data = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (data.length) {
      const next = [...otp];
      data.forEach((d, idx) => { next[idx] = d; });
      setOtp(next);
      otpRefs.current[Math.min(data.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  const handleOtpSubmit = (e) => {
    e?.preventDefault();
    setError("");
    if (otp.some(d => d === "")) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Simulated: accept any 6-digit code, reject 000000
      if (otp.join("") === "000000") {
        setError("Invalid code. Please try again.");
      } else {
        setStep("success");
      }
    }, 900);
  };

  return (
    <div className="min-h-screen flex" style={{ background: palette.paper, color: palette.ink }}>
      {/* Font + global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        body { font-family: 'Instrument Sans', system-ui, sans-serif; margin: 0; }
        .display { font-family: 'Fraunces', serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .grain {
          background-image:
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0);
          background-size: 24px 24px;
        }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .field:focus-within {
          border-color: ${palette.brand};
          box-shadow: 0 0 0 3px ${palette.brandLight};
        }
        input[type="text"], input[type="email"], input[type="password"] {
          background: transparent;
          outline: none;
          border: none;
          width: 100%;
        }
        .ot-box {
          width: 100%;
          height: 56px;
          text-align: center;
          font-family: 'Fraunces', serif;
          font-size: 22px;
          background: white;
          border: 1px solid #D6D3CE;
          border-radius: 2px;
          outline: none;
          transition: all 0.15s;
          color: ${palette.ink};
        }
        .ot-box:focus {
          border-color: ${palette.brand};
          box-shadow: 0 0 0 3px ${palette.brandLight};
        }
      `}</style>

      {/* ─────────────── LEFT PANEL — BRAND / EDITORIAL ─────────────── */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col p-12 relative overflow-hidden"
        style={{ background: palette.ink, color: palette.paper }}
      >
        <div className="absolute inset-0 grain pointer-events-none" />
        {/* Soft gradient glow */}
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${palette.brand}30 0%, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${palette.accent}20 0%, transparent 70%)` }}
        />

        {/* Top — Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ background: palette.brand }}>
            <GraduationCap size={18} color="white" strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-sm font-medium tracking-wide" style={{ color: palette.paper }}>ARIVUPRO ACADEMY</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400">ICAI Paper Evaluator</div>
          </div>
        </div>

        {/* Editorial classification stripe */}
        <div className="relative mt-12 mb-4 z-10 flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-stone-500">
          <span className="w-8 h-px bg-stone-600" />
          <span>Restricted</span>
          <span>·</span>
          <span>Vol. III</span>
          <span>·</span>
          <span style={{ color: palette.brand }}>2026</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-md">
          <h1 className="display text-5xl font-light leading-[1.05] tracking-tight mb-5" style={{ color: palette.paper }}>
            The control room
            <span className="block italic" style={{ color: palette.brand }}>for examiner-grade evaluation.</span>
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            Configure evaluation rules, manage faculty assignments, set caps and pricing, and oversee every paper that flows through the system — all from one console.
          </p>
        </div>

        {/* Capability list */}
        <div className="relative z-10 mt-12 space-y-4">
          {[
            { icon: ScrollText, title: "Evaluation Rules", sub: "ICAI standards, marking weights, model answers" },
            { icon: Users, title: "Faculty Assignment", sub: "Route advanced reviews & balance workload" },
            { icon: BarChart3, title: "Performance Analytics", sub: "Segment by batch, course, attempt — export at will" }
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-sm" style={{ background: `${palette.brand}25`, color: palette.brand }}>
                  <Icon size={14} strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: palette.paper }}>{c.title}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{c.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom — security notice */}
        <div className="relative z-10 mt-auto pt-12 flex items-end justify-between text-[10px] text-stone-500">
          <div className="max-w-[260px] leading-relaxed">
            <ShieldCheck size={12} className="inline -mt-0.5 mr-1" style={{ color: palette.brand }} />
            Activity on this console is monitored. Unauthorized access is prohibited under your employment agreement.
          </div>
          <div className="mono text-right">
            <div>v3.7.2</div>
            <div className="text-stone-600">build 2026.04.29</div>
          </div>
        </div>
      </div>

      {/* ─────────────── RIGHT PANEL — FORM ─────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-5 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ background: palette.brand }}>
              <GraduationCap size={15} color="white" strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-xs font-medium" style={{ color: palette.brand }}>ARIVUPRO</div>
              <div className="text-[9px] uppercase tracking-widest text-stone-500">Admin Console</div>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-stone-500">Restricted</div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-[0.2em] text-stone-500">
                <span>Admin Sign-in</span>
                <span className="w-1 h-1 rounded-full" style={{ background: palette.brand }} />
                <span style={{ color: palette.brand }}>
                  {step === "credentials" ? "Step 1 of 2" : step === "otp" ? "Step 2 of 2" : "Authenticated"}
                </span>
              </div>

              <h2 className="display text-3xl font-light tracking-tight" style={{ color: palette.ink }}>
                {step === "credentials" && "Welcome back."}
                {step === "otp" && "One last check."}
                {step === "success" && "You're in."}
              </h2>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                {step === "credentials" && "Sign in with your administrator credentials to access the console."}
                {step === "otp" && (
                  <>We sent a 6-digit code to <span style={{ color: palette.ink }}>{email}</span>. Enter it below to continue.</>
                )}
                {step === "success" && "Redirecting you to the admin console..."}
              </p>
            </div>

            {/* ───────── CREDENTIALS STEP ───────── */}
            {step === "credentials" && (
              <form onSubmit={handleCredentialsSubmit} className="fade-in space-y-4">
                {/* Email */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.18em] text-stone-500 font-medium block mb-1.5">
                    Work Email
                  </label>
                  <div className="field flex items-center gap-2 px-3.5 py-3 bg-white border border-stone-300 rounded-sm transition-all">
                    <Mail size={15} strokeWidth={1.6} className="text-stone-400 flex-shrink-0" />
                    <input
                      type="email"
                      placeholder="admin@arivupro.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      className="text-sm"
                      style={{ color: palette.ink }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] uppercase tracking-[0.18em] text-stone-500 font-medium">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-[11px] hover:underline"
                      style={{ color: palette.brand }}
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="field flex items-center gap-2 px-3.5 py-3 bg-white border border-stone-300 rounded-sm transition-all">
                    <Lock size={15} strokeWidth={1.6} className="text-stone-400 flex-shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-sm"
                      style={{ color: palette.ink }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-stone-400 hover:text-stone-700 transition-colors flex-shrink-0"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Trust device */}
                <label className="flex items-center gap-2.5 cursor-pointer pt-1 group">
                  <div
                    className="w-4 h-4 rounded-sm border flex items-center justify-center transition-all flex-shrink-0"
                    style={{
                      background: trustDevice ? palette.brand : 'white',
                      borderColor: trustDevice ? palette.brand : '#D6D3CE'
                    }}
                  >
                    {trustDevice && <CheckCircle2 size={11} color="white" strokeWidth={3} />}
                  </div>
                  <input
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    className="hidden"
                  />
                  <span className="text-xs text-stone-600 group-hover:text-stone-800 transition-colors">
                    Trust this device for 30 days
                  </span>
                </label>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-sm" style={{ background: '#FCEDEA', color: palette.red }}>
                    <AlertCircle size={14} strokeWidth={1.8} className="flex-shrink-0 mt-0.5" />
                    <span className="text-xs leading-relaxed">{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 text-sm font-medium text-white rounded-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90"
                  style={{ background: palette.ink }}
                >
                  {loading ? (
                    <>
                      <Spinner />
                      Verifying credentials...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={15} strokeWidth={1.8} />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-stone-200" />
                  <span className="text-[10px] uppercase tracking-widest text-stone-400">or</span>
                  <div className="flex-1 h-px bg-stone-200" />
                </div>

                {/* SSO */}
                <button
                  type="button"
                  className="w-full px-4 py-3 text-sm font-medium border border-stone-300 rounded-sm transition-all flex items-center justify-center gap-2.5 hover:bg-stone-50"
                  style={{ color: palette.ink }}
                >
                  <GoogleIcon />
                  Continue with Google Workspace
                </button>
              </form>
            )}

            {/* ───────── OTP STEP ───────── */}
            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="fade-in space-y-5">
                <div className="flex items-center gap-2.5 p-3 rounded-sm" style={{ background: palette.brandLight, color: palette.brandDark }}>
                  <KeyRound size={14} strokeWidth={1.8} className="flex-shrink-0" />
                  <span className="text-xs leading-relaxed">
                    A 6-digit verification code has been sent to your email and authenticator app.
                  </span>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.18em] text-stone-500 font-medium block mb-2.5">
                    Verification Code
                  </label>
                  <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={el => otpRefs.current[i] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="ot-box"
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-sm" style={{ background: '#FCEDEA', color: palette.red }}>
                    <AlertCircle size={14} strokeWidth={1.8} className="flex-shrink-0 mt-0.5" />
                    <span className="text-xs leading-relaxed">{error}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => { setStep("credentials"); setError(""); setOtp(["", "", "", "", "", ""]); }}
                    className="text-stone-500 hover:text-stone-800 transition-colors"
                  >
                    ← Back
                  </button>
                  <button type="button" className="hover:underline" style={{ color: palette.brand }}>
                    Resend code
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 text-sm font-medium text-white rounded-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90"
                  style={{ background: palette.brand }}
                >
                  {loading ? (
                    <>
                      <Spinner />
                      Verifying code...
                    </>
                  ) : (
                    <>
                      Verify & Sign In
                      <ShieldCheck size={15} strokeWidth={1.8} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ───────── SUCCESS STEP ───────── */}
            {step === "success" && (
              <div className="fade-in flex flex-col items-center text-center py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: palette.brandLight }}>
                  <CheckCircle2 size={28} strokeWidth={1.6} style={{ color: palette.brand }} />
                </div>
                <div className="display text-2xl mb-2">Welcome, Admin.</div>
                <div className="text-sm text-stone-500 mb-6">Last sign-in: 28 Apr 2026, 09:41 IST · Bengaluru</div>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Spinner small />
                  Loading console...
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-stone-200">
              <div className="flex items-center justify-between text-[10px] text-stone-500">
                <div className="flex items-center gap-2">
                  <Activity size={11} strokeWidth={1.6} />
                  All systems operational
                </div>
                <div className="flex items-center gap-3">
                  <a href="#" className="hover:text-stone-800 transition-colors">Help</a>
                  <span className="w-px h-3 bg-stone-300" />
                  <a href="#" className="hover:text-stone-800 transition-colors">Privacy</a>
                  <span className="w-px h-3 bg-stone-300" />
                  <a href="#" className="hover:text-stone-800 transition-colors">Terms</a>
                </div>
              </div>
              <div className="text-[10px] text-stone-400 mt-3">
                Not an admin? <a href="#" style={{ color: palette.brand }} className="hover:underline">Sign in as Student</a> or <a href="#" style={{ color: palette.brand }} className="hover:underline">Faculty</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SMALL HELPERS
// ──────────────────────────────────────────────────────────────────────────────
const Spinner = ({ small }) => (
  <svg
    className="animate-spin"
    width={small ? 12 : 14}
    height={small ? 12 : 14}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18a10.99 10.99 0 0 0 0 9.86l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a10.99 10.99 0 0 0-9.82 6.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);
