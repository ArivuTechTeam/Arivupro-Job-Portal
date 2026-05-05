import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Settings, 
  Bell, 
  RefreshCw, 
  Plus, 
  FileText, 
  Book, 
  GraduationCap, 
  Inbox, 
  Clock, 
  AlertTriangle,
  MailQuestion,
  BarChart3,
  CheckCircle2,
  Users,
  Circle,
  MessageSquare
} from 'lucide-react';
import './AdminPanel.css';
import { examsAPI, evaluationsAPI, submissionsAPI } from '../../services/api';

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, color, gradStart, gradEnd, sub, badge, badgeColor, badgeBg, to }) {
  const inner = (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '1.375rem 1.5rem',
      border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      position: 'relative', overflow: 'hidden',
      transition: 'box-shadow 0.2s, transform 0.2s',
      cursor: to ? 'pointer' : 'default',
      textDecoration: 'none', display: 'block',
    }}
      onMouseEnter={e => { if (to) { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* gradient accent blob */}
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 96, height: 96, borderRadius: '50%',
        background: `linear-gradient(135deg,${gradStart},${gradEnd})`,
        opacity: 0.12,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg,${gradStart},${gradEnd})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', boxShadow: `0 4px 12px ${gradStart}50`,
        }}>{icon}</div>
        {badge != null && (
          <span style={{
            background: badgeBg, color: badgeColor,
            borderRadius: 999, padding: '2px 10px',
            fontSize: '0.68rem', fontWeight: 700,
          }}>{badge}</span>
        )}
      </div>
      <div style={{ fontSize: '2.1rem', fontWeight: 900, color, lineHeight: 1, marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b',
        textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>{sub}</div>
      )}
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

// ─── Action Card ──────────────────────────────────────────────────────────────
function ActionCard({ to, icon, title, desc, color, bg, border }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      padding: '0.875rem 1rem', borderRadius: 12,
      background: bg, border: `1px solid ${border}`,
      textDecoration: 'none', transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.borderColor = color; Array.from(e.currentTarget.querySelectorAll('[data-text]')).forEach(el => el.style.color = '#fff'); }}
      onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = border; Array.from(e.currentTarget.querySelectorAll('[data-text]')).forEach(el => el.style.color = ''); }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: color + '18', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '1.1rem',
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div data-text style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0f172a',
          transition: 'color 0.15s' }}>{title}</div>
        {desc && <div data-text style={{ fontSize: '0.7rem', color: '#94a3b8',
          transition: 'color 0.15s', marginTop: 1 }}>{desc}</div>}
      </div>
      <span style={{ color, fontSize: '0.8rem', flexShrink: 0 }}>→</span>
    </Link>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    evaluated:  { bg: '#dcfce7', color: '#16a34a', label: 'Evaluated' },
    completed:  { bg: '#dbeafe', color: '#2563eb', label: 'Completed' },
    approved:   { bg: '#d1fae5', color: '#059669', label: 'Approved'  },
    pending:    { bg: '#fef3c7', color: '#d97706', label: 'Pending'   },
    processing: { bg: '#ede9fe', color: '#7c3aed', label: 'Processing'},
    failed:     { bg: '#fee2e2', color: '#dc2626', label: 'Failed'    },
    review:     { bg: '#e0f2fe', color: '#0284c7', label: 'Review'    },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 999,
      padding: '3px 10px', fontSize: '0.68rem', fontWeight: 700,
      whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

// ─── Mini sparkline (CSS bars) ────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ background: '#f1f5f9', borderRadius: 999, height: 6, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color,
        borderRadius: 999, transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_papers: 0, published_papers: 0,
    total_subjects: 0, total_submissions: 0,
    pending_evaluations: 0, approved_evaluations: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [refreshed, setRefreshed] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [papersRes, subjectsRes, submissionsRes, evaluationsRes] = await Promise.allSettled([
        examsAPI.getPapers(),
        examsAPI.getSubjects(),
        submissionsAPI.list(),   // direct call — no dynamic import needed
        evaluationsAPI.list(),
      ]);

      const papers      = extract(papersRes);
      const subjects    = extract(subjectsRes);
      const submissions = extract(submissionsRes);
      const evaluations = extract(evaluationsRes);

      const uniqueCourses = new Set(
        papers.map(p => (p.course_name || '').trim()).filter(Boolean)
      ).size;
      setStats({
        total_papers:         papers.length,
        published_papers:     papers.filter(p => p.is_published).length,
        total_subjects:       subjects.length,
        total_submissions:    submissions.length,
        pending_evaluations:  evaluations.filter(e => e.status === 'completed').length, // 'completed' = AI done, admin review needed
        approved_evaluations: evaluations.filter(e => e.status === 'approved').length,
        total_courses:        uniqueCourses,
      });
      setRecentSubmissions(submissions.slice(0, 6));
      setRefreshed(new Date());
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30 seconds — no manual Refresh needed
  useEffect(() => {
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const maxSub = Math.max(stats.total_submissions, 1);

  if (loading) return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page">

      {/* ══════════ HERO HEADER ══════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%)',
        borderRadius: 20, padding: '1.75rem 2rem', marginBottom: '1.5rem',
        boxShadow: '0 12px 40px rgba(15,23,42,0.3)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        {/* decorative circles */}
        <div style={{ position:'absolute', top:-60, right:-40, width:200, height:200,
          borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ position:'absolute', bottom:-50, right:200, width:130, height:130,
          borderRadius:'50%', background:'rgba(255,255,255,0.03)' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{
              background: 'rgba(255,255,255,0.12)', color: '#c7d2fe',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 20, padding: '3px 14px',
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}><Settings size={12} /> Admin Panel</span>
            {stats.pending_evaluations > 0 && (
              <span style={{
                background: 'rgba(239,68,68,0.2)', color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 20, padding: '3px 12px',
                fontSize: '0.7rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                <Bell size={12} /> {stats.pending_evaluations} pending review
              </span>
            )}
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.9rem', fontWeight: 900,
            margin: '0 0 0.3rem', lineHeight: 1.15 }}>
            {greeting},{' '}
            <span style={{ background: 'linear-gradient(90deg,#a5b4fc,#818cf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Admin!
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', margin: 0 }}>
            ArivuPro Score Improvement System · Overview
          </p>
          {refreshed && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', margin: '0.4rem 0 0' }}>
              Last refreshed: {refreshed.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', position: 'relative' }}>
          <Link to="/admin/papers/new" style={{
            padding: '0.55rem 1.375rem', borderRadius: 10,
            background: 'linear-gradient(135deg,#22c55e,#16a34a)',
            color: '#fff', fontWeight: 700, fontSize: '0.8rem',
            textDecoration: 'none', boxShadow: '0 4px 14px rgba(34,197,94,0.4)',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}><Plus size={16} /> New Paper</Link>
          <button onClick={fetchData} style={{
            padding: '0.55rem 1.25rem', borderRadius: 10,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}><RefreshCw size={16} /> Refresh</button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.875rem 1.25rem',
          borderRadius: 12, marginBottom: '1.5rem', border: '1px solid #fecaca',
          borderLeft: '4px solid #dc2626', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* ══════════ METRICS ROW ══════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))',
        gap: '1rem', marginBottom: '1.5rem' }}>

        <MetricCard icon={<FileText size={20} />} label="Question Papers" value={stats.total_papers}
          color="#2563eb" gradStart="#3b82f6" gradEnd="#2563eb"
          sub={`${stats.published_papers} published`}
          badge={stats.published_papers > 0 ? `${stats.published_papers} live` : null}
          badgeColor="#2563eb" badgeBg="#dbeafe"
          to="/admin/papers"
        />
        <MetricCard icon={<Book size={20} />} label="Subjects" value={stats.total_subjects}
          color="#7c3aed" gradStart="#8b5cf6" gradEnd="#7c3aed"
          sub="Active subjects"
          to="/admin/subjects"
        />
        <MetricCard icon={<GraduationCap size={20} />} label="Courses" value={stats.total_courses ?? 0}
          color="#0891b2" gradStart="#06b6d4" gradEnd="#0891b2"
          sub="Available courses"
          to="/admin/courses"
        />
        <MetricCard icon={<Inbox size={20} />} label="Submissions" value={stats.total_submissions}
          color="#d97706" gradStart="#f59e0b" gradEnd="#d97706"
          sub="Total received"
          badge={stats.total_submissions > 0 ? 'Active' : null}
          badgeColor="#d97706" badgeBg="#fef3c7"
          to="/admin/submissions"
        />
        <MetricCard icon={<Clock size={20} />} label="Pending Review" value={stats.pending_evaluations}
          color={stats.pending_evaluations > 0 ? '#dc2626' : '#16a34a'}
          gradStart={stats.pending_evaluations > 0 ? '#ef4444' : '#22c55e'}
          gradEnd={stats.pending_evaluations > 0 ? '#dc2626' : '#16a34a'}
          sub={`${stats.approved_evaluations} approved`}
          badge={stats.pending_evaluations > 0 ? 'Action needed' : 'All clear'}
          badgeColor={stats.pending_evaluations > 0 ? '#dc2626' : '#16a34a'}
          badgeBg={stats.pending_evaluations > 0 ? '#fee2e2' : '#dcfce7'}
          to="/admin/evaluations"
        />
      </div>

      {/* ══════════ PENDING ALERT ════════════════════════════════════════════ */}
      {stats.pending_evaluations > 0 && (
        <div style={{
          background: 'linear-gradient(135deg,#fff7ed,#fffbeb)',
          border: '1px solid #fed7aa', borderLeft: '4px solid #f97316',
          borderRadius: 14, padding: '1.125rem 1.5rem', marginBottom: '1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg,#f97316,#ea580c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(249,115,22,0.4)' }}>
                <Bell size={20} color="#fff" />
              </div>
            <div>
              <p style={{ fontWeight: 700, color: '#9a3412', margin: '0 0 2px', fontSize: '0.9rem' }}>
                {stats.pending_evaluations} Evaluation{stats.pending_evaluations !== 1 ? 's' : ''} Awaiting Review
              </p>
              <p style={{ color: '#c2410c', fontSize: '0.75rem', margin: 0 }}>
                Students are waiting for feedback. Review and approve AI evaluations.
              </p>
            </div>
          </div>
          <Link to="/admin/evaluations" style={{
            padding: '0.5rem 1.375rem', borderRadius: 10,
            background: 'linear-gradient(135deg,#f97316,#ea580c)',
            color: '#fff', fontWeight: 700, fontSize: '0.8rem',
            textDecoration: 'none', boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
            whiteSpace: 'nowrap',
          }}>
            Review Now →
          </Link>
        </div>
      )}

      {/* ══════════ MAIN 2-COL LAYOUT ════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px',
        gap: '1.5rem', alignItems: 'start' }}>

        {/* ── LEFT ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Recent Submissions */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 2px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Inbox size={18} /> Recent Submissions
                </h3>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>
                  Latest student answer scripts
                </p>
              </div>
              <Link to="/admin/submissions" style={{ fontSize: '0.78rem', fontWeight: 700,
                color: '#4f46e5', textDecoration: 'none' }}>
                View All →
              </Link>
            </div>

            {recentSubmissions.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', opacity: 0.35 }}>
                  <MailQuestion size={48} />
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                  No submissions yet
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Student', 'Paper', 'Status', 'Submitted'].map(h => (
                        <th key={h} style={{ padding: '0.625rem 1.25rem', textAlign: 'left',
                          fontSize: '0.68rem', color: '#64748b', fontWeight: 700,
                          borderBottom: '1px solid #e2e8f0',
                          textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentSubmissions.map(sub => {
                      const name = String(sub.student_name || sub.student?.username || sub.student?.full_name || (typeof sub.student === 'string' ? sub.student : '') || 'Student');
                      const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '0.75rem 1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', fontWeight: 800, color: '#fff',
                              }}>{initials}</div>
                              <span style={{ fontWeight: 600, color: '#1e293b' }}>{name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1.25rem', color: '#475569',
                            maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sub.exam_paper_title || sub.exam_paper?.title || sub.exam_paper || 'N/A'}
                          </td>
                          <td style={{ padding: '0.75rem 1.25rem' }}>
                            <StatusBadge status={sub.status} />
                          </td>
                          <td style={{ padding: '0.75rem 1.25rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                            {sub.created_at
                              ? new Date(sub.created_at).toLocaleDateString('en-IN',
                                  { day: 'numeric', month: 'short', year: '2-digit' })
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* System Overview bars */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: '0.95rem' }}>
                📊 System Overview
              </h3>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Papers Published',    value: stats.published_papers,     total: Math.max(stats.total_papers, 1),       color: '#3b82f6', pct: stats.total_papers > 0 ? Math.round(stats.published_papers / stats.total_papers * 100) : 0 },
                { label: 'Evaluations Approved',value: stats.approved_evaluations, total: Math.max(stats.pending_evaluations + stats.approved_evaluations, 1), color: '#16a34a', pct: (stats.pending_evaluations + stats.approved_evaluations) > 0 ? Math.round(stats.approved_evaluations / (stats.pending_evaluations + stats.approved_evaluations) * 100) : 0 },
                { label: 'Courses Available',   value: stats.total_courses ?? 0,   total: Math.max(stats.total_courses ?? 1, 1), color: '#7c3aed', pct: 100 },
                { label: 'Total Submissions',   value: stats.total_submissions,    total: Math.max(stats.total_submissions, 1),   color: '#d97706', pct: 100 },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    marginBottom: '0.375rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                      {row.label}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: row.color }}>
                      {row.value} <span style={{ color: '#94a3b8', fontWeight: 400 }}>· {row.pct}%</span>
                    </span>
                  </div>
                  <MiniBar value={row.value} max={row.total} color={row.color} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

          {/* Quick Actions */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: '0.9rem' }}>
                ⚡ Quick Actions
              </h3>
            </div>
            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <ActionCard to="/admin/papers/new"   icon={<Plus size={18} />} title="Create New Paper"     desc="Upload question paper PDF"     color="#4f46e5" bg="#eef2ff" border="#c7d2fe" />
              <ActionCard to="/admin/papers"        icon={<FileText size={18} />} title="Manage Papers"        desc="Publish, edit, delete"         color="#2563eb" bg="#eff6ff" border="#bfdbfe" />
              <ActionCard to="/admin/submissions"   icon={<Inbox size={18} />} title="Answer Scripts"       desc="View student submissions"      color="#0891b2" bg="#ecfeff" border="#a5f3fc" />
              <ActionCard to="/admin/evaluations"   icon={<CheckCircle2 size={18} />} title="Evaluations"           desc="Review & approve AI scores"    color="#16a34a" bg="#f0fdf4" border="#bbf7d0" />
              <ActionCard to="/admin/subjects"      icon={<Book size={18} />} title="Subjects"             desc="Manage exam subjects"          color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" />
              <ActionCard to="/admin/users"         icon={<Users size={18} />} title="Users"                desc="Manage students & admins"      color="#d97706" bg="#fffbeb" border="#fde68a" />
              <ActionCard to="/admin/stats"         icon={<BarChart3 size={18} />} title="Statistics"           desc="Advanced analytics"            color="#dc2626" bg="#fef2f2" border="#fecaca" />
            </div>
          </div>

          {/* Paper breakdown */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: '0.9rem' }}>
                📋 Paper Status
              </h3>
            </div>
            <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { label: 'Published', value: stats.published_papers, color: '#16a34a', bg: '#f0fdf4', icon: <Circle size={14} fill="#16a34a" /> },
                { label: 'Draft',     value: stats.total_papers - stats.published_papers, color: '#d97706', bg: '#fffbeb', icon: <Circle size={14} fill="#d97706" /> },
                { label: 'Subjects',  value: stats.total_subjects,   color: '#2563eb', bg: '#eff6ff', icon: <Book size={14} /> },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '0.625rem 0.875rem',
                  background: row.bg, borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>{row.icon}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                      {row.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: row.color }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function extract(res) {
  if (res.status !== 'fulfilled') return [];
  const d = res.value?.data;
  return Array.isArray(d) ? d : (d?.results || []);
}

