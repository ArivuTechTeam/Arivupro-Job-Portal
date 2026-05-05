import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const EXAM_TYPES  = ['CA', 'CS', 'CMA'];
const EXAM_LEVELS = ['Foundation', 'Intermediate', 'Final', 'Executive', 'Professional'];

// ─── helpers ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, muted }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: '#f8fafc', border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.9rem',
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </div>
        <div style={{
          fontSize: '0.875rem', fontWeight: 600,
          color: muted ? '#94a3b8' : '#0f172a', marginTop: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {value || <span style={{ color: '#cbd5e1', fontWeight: 400 }}>Not set</span>}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        background: 'linear-gradient(135deg,#fafafa,#f8fafc)',
      }}>
        <span style={{ fontSize: '1rem' }}>{icon}</span>
        <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', margin: 0 }}>
          {title}
        </h3>
      </div>
      <div style={{ padding: '0.25rem 1.25rem 0.75rem' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function Profile() {
  const { user, updateProfile, isAdmin } = useAuth();

  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [success, setSuccess]   = useState('');
  const [error,   setError]     = useState('');
  const [stats,   setStats]     = useState(null);

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '',
    exam_type: '', exam_level: '', institute: '',
    registration_number: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        first_name:          user.first_name || '',
        last_name:           user.last_name  || '',
        phone:               user.phone      || '',
        exam_type:           user.exam_type  || '',
        exam_level:          user.exam_level || '',
        institute:           user.institute  || '',
        registration_number: user.registration_number || '',
      });
    }
  }, [user]);

  useEffect(() => {
    authAPI.getDashboardStats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await updateProfile(form);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data ? JSON.stringify(e.response.data) : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (
    (user?.first_name?.[0] || '') + (user?.last_name?.[0] || '') ||
    user?.username?.[0] || 'U'
  ).toUpperCase();

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username;

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN',
        { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const roleColor  = isAdmin ? { bg: '#eef2ff', color: '#4f46e5', border: '#c7d2fe' }
                             : { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };

  return (
    <div className="page">

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%)',
        borderRadius: 20, padding: '2rem 2.25rem', marginBottom: '1.75rem',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(67,56,202,0.3)',
      }}>
        {/* bg circles */}
        <div style={{ position:'absolute', top:-60, right:-40, width:200, height:200,
          borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ position:'absolute', bottom:-40, right:200, width:130, height:130,
          borderRadius:'50%', background:'rgba(255,255,255,0.03)' }} />

        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.5rem',
          flexWrap:'wrap', position:'relative' }}>

          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: 20, flexShrink: 0,
            background: isAdmin
              ? 'linear-gradient(135deg,#6366f1,#4f46e5)'
              : 'linear-gradient(135deg,#10b981,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 900, color: '#fff',
            boxShadow: '0 8px 28px rgba(0,0,0,0.3)',
            border: '3px solid rgba(255,255,255,0.2)',
          }}>
            {initials}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem',
              flexWrap:'wrap', marginBottom:'0.375rem' }}>
              <h1 style={{ color:'#fff', fontSize:'1.6rem', fontWeight:900,
                margin:0, lineHeight:1.2 }}>
                {displayName}
              </h1>
              <span style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 20, padding: '3px 12px',
                fontSize: '0.68rem', fontWeight: 700, color: '#c7d2fe',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {user?.role || 'student'}
                {user?.exam_type ? ` · ${user.exam_type}` : ''}
              </span>
            </div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.875rem', marginBottom:'0.75rem' }}>
              {user?.email}
            </div>
            <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
              {[
                { label: 'Member since', value: joinDate },
                { label: 'Username',     value: `@${user?.username}` },
                { label: 'Status',       value: '● Active' },
              ].map(item => (
                <div key={item.label} style={{
                  background:'rgba(255,255,255,0.1)',
                  border:'1px solid rgba(255,255,255,0.15)',
                  borderRadius:10, padding:'5px 12px',
                }}>
                  <div style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.45)',
                    textTransform:'uppercase', letterSpacing:'0.08em' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize:'0.78rem', color:'#fff', fontWeight:700, marginTop:1 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit button */}
          <button onClick={() => { setEditing(e => !e); setError(''); setSuccess(''); }}
            style={{
              padding:'0.55rem 1.375rem', borderRadius:10,
              background: editing ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.12)',
              border: `1px solid ${editing ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.22)'}`,
              color: editing ? '#fca5a5' : '#fff',
              fontWeight:700, fontSize:'0.82rem', cursor:'pointer',
              transition:'all 0.15s', flexShrink:0,
            }}>
            {editing ? '✕ Cancel' : '✎ Edit Profile'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div style={{
          background:'#dcfce7', color:'#166534', border:'1px solid #bbf7d0',
          borderLeft:'4px solid #16a34a', borderRadius:12,
          padding:'0.875rem 1.25rem', marginBottom:'1.25rem',
          fontSize:'0.875rem', fontWeight:600,
        }}>✓ {success}</div>
      )}
      {error && (
        <div style={{
          background:'#fee2e2', color:'#991b1b', border:'1px solid #fecaca',
          borderLeft:'4px solid #dc2626', borderRadius:12,
          padding:'0.875rem 1.25rem', marginBottom:'1.25rem', fontSize:'0.875rem',
        }}>⚠ {error}</div>
      )}

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      {stats && !isAdmin && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',
          gap:'1rem', marginBottom:'1.75rem' }}>
          {[
            { icon:'📤', label:'Submissions',   value: stats.total_submissions   || 0, color:'#4f46e5', bg:'#eef2ff' },
            { icon:'✅', label:'Evaluated',      value: stats.evaluated_submissions || 0, color:'#16a34a', bg:'#f0fdf4' },
            { icon:'📊', label:'Avg Score',      value: stats.average_score ? `${Math.round(stats.average_score)}%` : '—', color:'#d97706', bg:'#fffbeb' },
            { icon:'🔥', label:'Streak',         value: stats.improvement_streak  || 0, color:'#dc2626', bg:'#fef2f2' },
          ].map(s => (
            <div key={s.label} style={{
              background:'#fff', borderRadius:14, padding:'1rem 1.125rem',
              border:'1px solid #e2e8f0', boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
              display:'flex', alignItems:'center', gap:'0.75rem',
            }}>
              <div style={{
                width:40, height:40, borderRadius:10, background:s.bg,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1.1rem', flexShrink:0,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:'1.4rem', fontWeight:900, color:s.color, lineHeight:1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Two-column content ─────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>

        {/* Personal Info */}
        <SectionCard title="Personal Information" icon="👤">
          {editing ? (
            <div style={{ paddingTop:'0.75rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <div>
                  <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b',
                    textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
                    First Name
                  </label>
                  <input className="form-input" value={form.first_name}
                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    placeholder="First name" />
                </div>
                <div>
                  <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b',
                    textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
                    Last Name
                  </label>
                  <input className="form-input" value={form.last_name}
                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    placeholder="Last name" />
                </div>
              </div>
              <div>
                <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b',
                  textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
                  Phone Number
                </label>
                <input className="form-input" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 9876543210" />
              </div>
            </div>
          ) : (
            <>
              <InfoRow icon="👤" label="Full Name"     value={displayName} />
              <InfoRow icon="📧" label="Email"         value={user?.email} />
              <InfoRow icon="📱" label="Phone"         value={user?.phone} />
              <InfoRow icon="🔑" label="Username"      value={`@${user?.username}`} />
              <InfoRow icon="📅" label="Member Since"  value={joinDate} />
            </>
          )}
        </SectionCard>

        {/* Exam Details */}
        <SectionCard title="Exam Details" icon="🎓">
          {editing ? (
            <div style={{ paddingTop:'0.75rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <div>
                  <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b',
                    textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
                    Exam Type
                  </label>
                  <select className="form-input" value={form.exam_type}
                    onChange={e => setForm(f => ({ ...f, exam_type: e.target.value }))}>
                    <option value="">— Select —</option>
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b',
                    textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
                    Exam Level
                  </label>
                  <select className="form-input" value={form.exam_level}
                    onChange={e => setForm(f => ({ ...f, exam_level: e.target.value }))}>
                    <option value="">— Select —</option>
                    {EXAM_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b',
                  textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
                  Institute / College
                </label>
                <input className="form-input" value={form.institute}
                  onChange={e => setForm(f => ({ ...f, institute: e.target.value }))}
                  placeholder="e.g. ICAI Regional Office" />
              </div>
              <div>
                <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b',
                  textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
                  Registration Number
                </label>
                <input className="form-input" value={form.registration_number}
                  onChange={e => setForm(f => ({ ...f, registration_number: e.target.value }))}
                  placeholder="e.g. CAF/123456/2024" />
              </div>
            </div>
          ) : (
            <>
              <InfoRow icon="📚" label="Exam Type"          value={user?.exam_type} />
              <InfoRow icon="🏆" label="Exam Level"         value={user?.exam_level} />
              <InfoRow icon="🏫" label="Institute"          value={user?.institute} />
              <InfoRow icon="🪪" label="Registration No."   value={user?.registration_number} />
              <InfoRow icon="🛡️" label="Role"               value={user?.role} />
            </>
          )}
        </SectionCard>

        {/* Account Security */}
        <SectionCard title="Account" icon="🔐">
          <InfoRow icon="✉️" label="Email"        value={user?.email} />
          <InfoRow icon="🔑" label="Username"     value={`@${user?.username}`} />
          <InfoRow icon="🟢" label="Status"       value="Active" />
          <InfoRow icon="🛡️" label="Role"         value={user?.role} />
          <div style={{ paddingTop:'0.875rem' }}>
            <div style={{
              background:'#fffbeb', border:'1px solid #fde68a',
              borderRadius:10, padding:'0.75rem 1rem',
              fontSize:'0.78rem', color:'#92400e', fontWeight:500,
              display:'flex', alignItems:'center', gap:'0.5rem',
            }}>
              <span>🔒</span>
              To change your password, please contact support or use the forgot password flow.
            </div>
          </div>
        </SectionCard>

        {/* Quick links */}
        <SectionCard title="Quick Links" icon="⚡">
          {[
            { icon:'📤', label:'Upload Answer Script',  to:'/upload',      color:'#4f46e5', bg:'#eef2ff' },
            { icon:'📄', label:'Browse Exam Papers',    to:'/papers',      color:'#2563eb', bg:'#eff6ff' },
            { icon:'📊', label:'My Evaluations',        to:'/evaluations', color:'#059669', bg:'#f0fdf4' },
            { icon:'📖', label:'Mistake Library',       to:'/mistakes',    color:'#dc2626', bg:'#fef2f2' },
            { icon:'📈', label:'My Progress',           to:'/progress',    color:'#d97706', bg:'#fffbeb' },
            { icon:'🤖', label:'Study AI',              to:'/study-ai',    color:'#7c3aed', bg:'#f5f3ff' },
          ].map(link => (
            <a key={link.to} href={link.to} style={{
              display:'flex', alignItems:'center', gap:'0.75rem',
              padding:'0.6rem 0', borderBottom:'1px solid #f8fafc',
              textDecoration:'none', transition:'all 0.12s',
            }}
              onMouseEnter={e => e.currentTarget.style.paddingLeft = '4px'}
              onMouseLeave={e => e.currentTarget.style.paddingLeft = '0'}
            >
              <div style={{
                width:32, height:32, borderRadius:8, background:link.bg,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'0.85rem', flexShrink:0,
              }}>{link.icon}</div>
              <span style={{ fontSize:'0.83rem', fontWeight:600, color:'#1e293b' }}>
                {link.label}
              </span>
              <span style={{ marginLeft:'auto', color:'#cbd5e1', fontSize:'0.75rem' }}>→</span>
            </a>
          ))}
        </SectionCard>
      </div>

      {/* Save button */}
      {editing && (
        <div style={{
          marginTop:'1.5rem', display:'flex', justifyContent:'flex-end',
          gap:'0.75rem', padding:'1.25rem', background:'#fff',
          borderRadius:14, border:'1px solid #e2e8f0',
          boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <button onClick={() => { setEditing(false); setError(''); }}
            style={{
              padding:'0.625rem 1.5rem', borderRadius:10,
              background:'#f8fafc', border:'1px solid #e2e8f0',
              color:'#64748b', fontWeight:600, fontSize:'0.875rem', cursor:'pointer',
            }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{
              padding:'0.625rem 2rem', borderRadius:10,
              background: saving ? '#94a3b8' : 'linear-gradient(135deg,#4f46e5,#6366f1)',
              border:'none', color:'#fff', fontWeight:700, fontSize:'0.875rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
              transition:'all 0.15s',
            }}>
            {saving ? '⏳ Saving...' : '✓ Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
