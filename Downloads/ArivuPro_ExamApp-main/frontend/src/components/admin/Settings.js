import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminPanel.css';

/* ── small helpers ── */
function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: checked ? '#4f46e5' : '#cbd5e1',
        position: 'relative', transition: 'background 0.25s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', transition: 'left 0.25s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function InfoRow({ label, value, badge }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.8rem 1rem',
      borderBottom: '1px solid #f1f5f9',
    }}>
      <span style={{ fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>{label}</span>
      {badge
        ? <span style={{
            background: '#dcfce7', color: '#15803d', borderRadius: 20,
            padding: '2px 12px', fontSize: '0.75rem', fontWeight: 700,
          }}>{value}</span>
        : <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{value}</span>
      }
    </div>
  );
}

function Section({ icon, title, children, accent = '#4f46e5' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      overflow: 'hidden', marginBottom: '1.5rem',
      border: '1px solid #f1f5f9',
    }}>
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        background: 'linear-gradient(90deg,#fafafe,#fff)',
      }}>
        <span style={{
          width: 32, height: 32, borderRadius: 8,
          background: accent + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem',
        }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
      </div>
      <div style={{ padding: '0.25rem 0' }}>{children}</div>
    </div>
  );
}

function SettingRow({ icon, label, description, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '0.9rem 1.25rem',
      borderBottom: '1px solid #f8fafc',
    }}>
      <div style={{ fontSize: '1.2rem', width: 28, textAlign: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{label}</p>
        {description && <p style={{ margin: '2px 0 0', fontSize: '0.775rem', color: '#94a3b8' }}>{description}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

// ─── Railway DB Status Card ────────────────────────────────────────────────────
function DatabaseStatus() {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '1.5rem',
    }}>
      <div style={{
        padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(90deg,#fafafe,#fff)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#ede9fe',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
          }}>🐘</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              Railway PostgreSQL
            </h3>
            <p style={{ margin: '1px 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>
              Managed via DATABASE_URL on Railway
            </p>
          </div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
          background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
          Active
        </span>
      </div>
      <div style={{ padding: '1.25rem' }}>
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '0.875rem 1rem', fontSize: '0.78rem',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem',
        }}>
          {[
            { label: 'Provider',    val: 'Railway' },
            { label: 'Engine',      val: 'PostgreSQL 15' },
            { label: 'Connection',  val: 'DATABASE_URL (env var)' },
            { label: 'Migrations',  val: 'Auto on deploy' },
            { label: 'Notifications', val: 'Django REST API' },
            { label: 'Auth',        val: 'JWT (SimpleJWT)' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.label}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#1e293b', fontWeight: 600 }}>
                {row.val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════ */
const STORAGE_KEY = 'arivupro_settings';

const DEFAULTS = {
  emailNotifications: true,
  autoEvaluation: true,
  maintenanceMode: false,
  debugMode: false,
  studentRegistration: true,
  showRankings: true,
  aiModel: 'gpt-4o',
  maxFileSize: '50',
  sessionTimeout: '60',
  platformName: 'ArivuPro ExamApp',
  supportEmail: 'support@arivupro.com',
};

export default function Settings() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [copyDone, setCopyDone] = useState('');


  // Hard block — students should never reach this page even if URL is typed directly
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults?')) {
      setSettings(DEFAULTS);
      localStorage.removeItem(STORAGE_KEY);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyDone(key);
      setTimeout(() => setCopyDone(''), 1500);
    });
  };

  const tabs = [
    { id: 'general',       label: 'General',        icon: '⚙️' },
    { id: 'evaluation',    label: 'Evaluation',      icon: '🤖' },
    { id: 'notifications', label: 'Notifications',   icon: '🔔' },
    { id: 'security',      label: 'Security',        icon: '🔒' },
    { id: 'system',        label: 'System Info',     icon: '📊' },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚙️ Settings
          </h1>
          <p className="subtitle">Platform configuration and preferences</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleReset}
            style={{
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              borderRadius: 10, padding: '0.55rem 1.1rem',
              fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600,
              color: '#64748b',
            }}
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            style={{
              background: saved
                ? 'linear-gradient(135deg,#16a34a,#22c55e)'
                : 'linear-gradient(135deg,#4f46e5,#6366f1)',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '0.55rem 1.4rem', fontSize: '0.85rem',
              cursor: 'pointer', fontWeight: 700,
              boxShadow: '0 3px 10px rgba(79,70,229,0.3)',
              transition: 'background 0.3s',
            }}
          >
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: '0.25rem', background: '#f1f5f9',
        borderRadius: 12, padding: '0.25rem',
        marginBottom: '1.5rem', overflowX: 'auto',
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              background: activeTab === t.id ? '#fff' : 'transparent',
              border: 'none', borderRadius: 9, padding: '0.5rem 1rem',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              color: activeTab === t.id ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === t.id ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── General Tab ── */}
      {activeTab === 'general' && (
        <>
          <Section icon="🏷️" title="Platform Identity" accent="#4f46e5">
            <SettingRow icon="🏫" label="Platform Name" description="Shown in emails and reports">
              <input
                value={settings.platformName}
                onChange={e => set('platformName', e.target.value)}
                style={{
                  border: '1.5px solid #e2e8f0', borderRadius: 8,
                  padding: '0.45rem 0.75rem', fontSize: '0.85rem',
                  width: 200, outline: 'none',
                }}
              />
            </SettingRow>
            <SettingRow icon="📧" label="Support Email" description="Contact email for students">
              <input
                type="email"
                value={settings.supportEmail}
                onChange={e => set('supportEmail', e.target.value)}
                style={{
                  border: '1.5px solid #e2e8f0', borderRadius: 8,
                  padding: '0.45rem 0.75rem', fontSize: '0.85rem',
                  width: 200, outline: 'none',
                }}
              />
            </SettingRow>
          </Section>

          <Section icon="👥" title="Student Access" accent="#0ea5e9">
            <SettingRow icon="📝" label="Student Registration" description="Allow new students to sign up">
              <Toggle checked={settings.studentRegistration} onChange={v => set('studentRegistration', v)} />
            </SettingRow>
            <SettingRow icon="🏆" label="Show Rankings" description="Students can see class rankings">
              <Toggle checked={settings.showRankings} onChange={v => set('showRankings', v)} />
            </SettingRow>
          </Section>

          <Section icon="🔗" title="Quick Links" accent="#8b5cf6">
            <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.75rem' }}>
              {[
                { icon: '🛡️', label: 'Django Admin',  href: '/admin/' },
                { icon: '👥', label: 'User Admin',    href: '/admin/accounts/user/' },
                { icon: '📄', label: 'Paper Admin',   href: '/admin/exams/exampaper/' },
                { icon: '📚', label: 'Subject Admin', href: '/admin/exams/subject/' },
                { icon: '✅', label: 'Evaluations',   href: '/admin/evaluations' },
                { icon: '📊', label: 'Statistics',    href: '/admin/stats' },
              ].map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith('/admin/accounts') || l.href.startsWith('/admin/exams') || l.href === '/admin/' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: '#f8fafc', border: '1.5px solid #e2e8f0',
                    borderRadius: 10, padding: '0.65rem 0.9rem',
                    textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
                    color: '#374151', transition: 'all 0.18s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; e.currentTarget.style.background = '#eef2ff'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = '#f8fafc'; }}
                >
                  <span>{l.icon}</span> {l.label}
                </a>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ── Evaluation Tab ── */}
      {activeTab === 'evaluation' && (
        <>
          <Section icon="🤖" title="AI Configuration" accent="#7c3aed">
            <SettingRow icon="⚡" label="Auto Evaluation" description="Automatically evaluate on submission">
              <Toggle checked={settings.autoEvaluation} onChange={v => set('autoEvaluation', v)} />
            </SettingRow>
            <SettingRow icon="🧠" label="AI Model" description="Model used for answer evaluation">
              <select
                value={settings.aiModel}
                onChange={e => set('aiModel', e.target.value)}
                style={{
                  border: '1.5px solid #e2e8f0', borderRadius: 8,
                  padding: '0.45rem 0.75rem', fontSize: '0.85rem',
                  background: '#fff', cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="gpt-4o">GPT-4o (Recommended)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Faster)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </SettingRow>
            <SettingRow icon="📁" label="Max File Size (MB)" description="Maximum upload size per script">
              <select
                value={settings.maxFileSize}
                onChange={e => set('maxFileSize', e.target.value)}
                style={{
                  border: '1.5px solid #e2e8f0', borderRadius: 8,
                  padding: '0.45rem 0.75rem', fontSize: '0.85rem',
                  background: '#fff', cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="10">10 MB</option>
                <option value="20">20 MB</option>
                <option value="50">50 MB</option>
                <option value="100">100 MB</option>
              </select>
            </SettingRow>
          </Section>

          {/* OpenAI Key config hint */}
          <Section icon="🔑" title="OpenAI API Key" accent="#f59e0b">
            <div style={{ padding: '1.25rem' }}>
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 10, padding: '1rem', marginBottom: '1rem',
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '1.2rem' }}>💡</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#92400e' }}>
                    Configure in backend/.env
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#78350f' }}>
                    Set <code style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: 4 }}>OPENAI_API_KEY=sk-...</code> in your <code style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: 4 }}>backend/.env</code> file and restart the server for AI evaluation to use the live model.
                  </p>
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#f8fafc', border: '1.5px solid #e2e8f0',
                borderRadius: 10, padding: '0.6rem 1rem',
              }}>
                <code style={{ flex: 1, fontSize: '0.82rem', color: '#475569', userSelect: 'all' }}>
                  OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
                </code>
                <button
                  onClick={() => copyToClipboard('OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx', 'key')}
                  style={{
                    background: copyDone === 'key' ? '#dcfce7' : '#e0e7ff',
                    border: 'none', borderRadius: 6, padding: '4px 10px',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    color: copyDone === 'key' ? '#15803d' : '#4338ca',
                  }}
                >
                  {copyDone === 'key' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* ── Notifications Tab ── */}
      {activeTab === 'notifications' && (
        <Section icon="🔔" title="Notification Preferences" accent="#0ea5e9">
          <SettingRow icon="📧" label="Email Notifications" description="Send evaluation results via email">
            <Toggle checked={settings.emailNotifications} onChange={v => set('emailNotifications', v)} />
          </SettingRow>
          <SettingRow icon="✅" label="Evaluation Complete Alert" description="Notify admin when AI finishes">
            <Toggle checked={settings.autoEvaluation} onChange={v => set('autoEvaluation', v)} />
          </SettingRow>
          <SettingRow icon="👥" label="New User Signup Alert" description="Email when a new student registers">
            <Toggle checked={settings.studentRegistration} onChange={v => set('studentRegistration', v)} />
          </SettingRow>
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
              Email delivery requires SMTP configuration in <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>backend/.env</code>
            </p>
          </div>
        </Section>
      )}

      {/* ── Security Tab ── */}
      {activeTab === 'security' && (
        <>
          <Section icon="🔒" title="Access Control" accent="#dc2626">
            <SettingRow icon="🚧" label="Maintenance Mode" description="Block all student access temporarily">
              <Toggle checked={settings.maintenanceMode} onChange={v => set('maintenanceMode', v)} />
            </SettingRow>
            <SettingRow icon="⏱" label="Session Timeout (min)" description="Auto-logout after inactivity">
              <select
                value={settings.sessionTimeout}
                onChange={e => set('sessionTimeout', e.target.value)}
                style={{
                  border: '1.5px solid #e2e8f0', borderRadius: 8,
                  padding: '0.45rem 0.75rem', fontSize: '0.85rem',
                  background: '#fff', cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="120">2 hours</option>
                <option value="480">8 hours</option>
              </select>
            </SettingRow>
            <SettingRow icon="🐛" label="Debug Mode" description="Enable verbose error messages">
              <Toggle checked={settings.debugMode} onChange={v => set('debugMode', v)} />
            </SettingRow>
          </Section>

          {settings.maintenanceMode && (
            <div style={{
              background: '#fef2f2', border: '2px solid #fca5a5',
              borderRadius: 12, padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '1.5rem',
            }}>
              <span style={{ fontSize: '1.4rem' }}>⚠️</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#991b1b', fontSize: '0.9rem' }}>
                  Maintenance Mode is ON
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#b91c1c' }}>
                  Students cannot log in or access the platform. Save to apply.
                </p>
              </div>
            </div>
          )}

        </>
      )}

      {/* ── System Info Tab ── */}
      {activeTab === 'system' && (
        <>
          <DatabaseStatus />
          <Section icon="📊" title="Platform Information" accent="#0ea5e9">
            {[
              { label: 'Platform',     value: 'ArivuPro ExamApp' },
              { label: 'Version',      value: '1.0.0' },
              { label: 'Backend',      value: 'Django 4.2 + DRF' },
              { label: 'Frontend',     value: 'React 18' },
              { label: 'Database',     value: 'Railway PostgreSQL', badge: true },
              { label: 'AI Evaluator', value: '● Active', badge: true },
              { label: 'Auth',         value: 'JWT (SimpleJWT)' },
              { label: 'Exam Types',   value: 'CA · CS · CMA' },
            ].map(r => <InfoRow key={r.label} {...r} />)}
          </Section>

          <Section icon="📦" title="Storage & Limits" accent="#f59e0b">
            {[
              { label: 'Answer Scripts Folder', value: 'media/answer_scripts/' },
              { label: 'Question Papers',       value: 'media/question_papers/' },
              { label: 'Suggested Answers',     value: 'media/suggested_answers/' },
              { label: 'Max Upload Size',       value: `${settings.maxFileSize} MB` },
              { label: 'Accepted Formats',      value: 'PDF · JPG · PNG · WEBP' },
            ].map(r => <InfoRow key={r.label} {...r} />)}
          </Section>

          <Section icon="🔗" title="API Endpoints" accent="#6366f1">
            <div style={{ padding: '0.5rem 0' }}>
              {[
                { method: 'POST', path: '/api/auth/login/',             label: 'Login' },
                { method: 'GET',  path: '/api/exams/papers/',           label: 'Exam Papers' },
                { method: 'POST', path: '/api/exams/submissions/',      label: 'Submit Script' },
                { method: 'GET',  path: '/api/exams/submissions/{id}/report/', label: 'Get Report' },
                { method: 'GET',  path: '/api/exams/evaluations/',      label: 'Evaluations' },
                { method: 'GET',  path: '/api/admin/stats/',            label: 'Admin Stats' },
              ].map(ep => (
                <div key={ep.path} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.65rem 1.25rem', borderBottom: '1px solid #f8fafc',
                }}>
                  <span style={{
                    background: ep.method === 'GET' ? '#dbeafe' : '#dcfce7',
                    color: ep.method === 'GET' ? '#1d4ed8' : '#15803d',
                    borderRadius: 6, padding: '2px 8px',
                    fontSize: '0.7rem', fontWeight: 800,
                    letterSpacing: '0.04em', flexShrink: 0,
                  }}>{ep.method}</span>
                  <code style={{ flex: 1, fontSize: '0.78rem', color: '#475569' }}>{ep.path}</code>
                  <button
                    onClick={() => copyToClipboard(ep.path, ep.path)}
                    style={{
                      background: copyDone === ep.path ? '#dcfce7' : '#f1f5f9',
                      border: 'none', borderRadius: 5, padding: '3px 8px',
                      fontSize: '0.7rem', cursor: 'pointer', color: '#64748b', fontWeight: 600,
                    }}
                  >
                    {copyDone === ep.path ? '✓' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* Save bar */}
      <div style={{
        position: 'sticky', bottom: '1rem',
        display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: 12,
        boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
        border: '1px solid #f1f5f9',
      }}>
        <button
          onClick={handleReset}
          style={{
            background: '#f8fafc', border: '1.5px solid #e2e8f0',
            borderRadius: 10, padding: '0.55rem 1.1rem',
            fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, color: '#64748b',
          }}
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          style={{
            background: saved
              ? 'linear-gradient(135deg,#16a34a,#22c55e)'
              : 'linear-gradient(135deg,#4f46e5,#6366f1)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '0.55rem 1.6rem', fontSize: '0.875rem',
            cursor: 'pointer', fontWeight: 700,
            boxShadow: '0 3px 12px rgba(79,70,229,0.35)',
            transition: 'background 0.3s',
          }}
        >
          {saved ? '✓ Settings Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
