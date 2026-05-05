import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  ClipboardList, 
  Target, 
  Book, 
  GraduationCap, 
  Bot, 
  BookOpen, 
  Edit, 
  TrendingUp, 
  Users, 
  Inbox, 
  Plus, 
  CheckCircle2, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  User, 
  Bell, 
  Info, 
  XCircle, 
  Mail, 
  ChevronDown, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

// ─── Nav definitions ──────────────────────────────────────────────────────────
const studentNav = [
  { path: '/dashboard',   label: 'Dashboard',       icon: <LayoutDashboard size={18} />,  color: '#2E8857', bg: '#D7F4EA' },
  { section: 'EXAMS' },
  { path: '/papers',      label: 'Exam Papers',     icon: <FileText size={18} />, color: '#3578b5', bg: 'rgba(53,120,181,0.12)' },
  { path: '/submissions', label: 'My Submissions',  icon: <ClipboardList size={18} />, color: '#245a41', bg: '#D7F4EA' },
  { section: 'ANALYSIS' },
  { path: '/mistakes',    label: 'Mistake Library', icon: <BookOpen size={18} />, color: '#F95E64', bg: 'rgba(249,94,100,0.1)' },
  { path: '/revision',    label: 'Revision Mode',   icon: <Edit size={18} />, color: '#2E8857', bg: '#D7F4EA' },
  { path: '/progress',    label: 'My Progress',     icon: <TrendingUp size={18} />, color: '#2E8857', bg: '#D7F4EA' },
];

const adminNav = [
  { path: '/admin/dashboard',   label: 'Dashboard',       icon: <LayoutDashboard size={18} />,  color: '#2E8857', bg: '#D7F4EA' },
  { section: 'SYSTEM' },
  { path: '/admin/users',       label: 'Users',           icon: <Users size={18} />, color: '#245a41', bg: '#D7F4EA' },
  { path: '/admin/courses',     label: 'Courses',         icon: <GraduationCap size={18} />, color: '#3578b5', bg: 'rgba(53,120,181,0.12)' },
  { path: '/admin/subjects',    label: 'Subjects',        icon: <Book size={18} />, color: '#2E8857', bg: '#D7F4EA' },
  { section: 'MANAGE' },
  { path: '/admin/submissions', label: 'Student Submissions', icon: <Inbox size={18} />, color: '#2E8857', bg: '#D7F4EA' },
  { path: '/admin/papers',      label: 'Question Papers', icon: <FileText size={18} />, color: '#c49a00', bg: 'rgba(254,222,109,0.2)' },
  { path: '/admin/papers/new',  label: 'Create Paper',    icon: <Plus size={18} />, color: '#2E8857', bg: '#D7F4EA' },
  { path: '/admin/validations', label: 'Validation Queue', icon: <UserCheck size={18} />, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  { section: 'ANALYTICS' },
  { path: '/admin/stats',       label: 'Statistics',      icon: <BarChart3 size={18} />, color: '#F95E64', bg: 'rgba(249,94,100,0.1)' },
  { path: '/admin/settings',    label: 'Settings',        icon: <Settings size={18} />, color: '#4C4C4C', bg: '#EFEFEF' },
];

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const location  = useLocation();
  const navItems  = isAdmin ? adminNav : studentNav;
  const { theme, themeName, toggleTheme } = useTheme();

  const [collapsed, setCollapsed]         = useState(false);
  const [profileOpen, setProfileOpen]     = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const profileRef                         = useRef(null);
  const notifRef                           = useRef(null);

  const isDark = themeName === 'dark';

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current  && !notifRef.current.contains(e.target))   setNotifOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Poll notifications from Django REST API every 30s
  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/auth/notifications/');
        setNotifications(Array.isArray(data) ? data : (data.results || []));
      } catch {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const initials = (
    (user?.first_name?.[0] || '') + (user?.last_name?.[0] || '') ||
    user?.username?.[0] || 'U'
  ).toUpperCase();

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username || 'User';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f2' }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <aside style={{
        width: collapsed ? 72 : 260,
        background: 'linear-gradient(180deg, #0a1f14 0%, #122b1d 60%, #0a1f14 100%)',
        position: 'fixed', height: '100vh', zIndex: 100,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>

        {/* Logo */}
        <div style={{
          padding: collapsed ? '1.5rem 0' : '1.5rem 1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexShrink: 0,
        }}>
          {!collapsed && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'linear-gradient(135deg,#2E8857,#245a41)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', boxShadow: '0 4px 12px rgba(46,136,87,0.5)',
                }}><GraduationCap size={18} color="#fff" /></div>
                <div>
                  <div style={{
                    fontSize: '1.1rem', fontWeight: 900, color: '#fff',
                    letterSpacing: '-0.02em', lineHeight: 1,
                  }}>ArivuPro</div>
                  <div style={{
                    fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    marginTop: 2, fontWeight: 600,
                  }}>Score Improvement</div>
                </div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#2E8857,#245a41)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem',
            }}><GraduationCap size={20} color="#fff" /></div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, width: 28, height: 28, cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div style={{ padding: '0.75rem 1.25rem 0.25rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: isAdmin
                ? 'linear-gradient(135deg,rgba(46,136,87,0.3),rgba(36,90,65,0.2))'
                : 'linear-gradient(135deg,rgba(46,136,87,0.2),rgba(36,90,65,0.15))',
              border: '1px solid rgba(46,136,87,0.35)',
              borderRadius: 20, padding: '3px 12px',
              fontSize: '0.65rem', fontWeight: 700,
              color: '#9FFFCB',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>{isAdmin ? <Settings size={12} /> : <User size={12} />}</span>
              {isAdmin ? 'Admin Panel' : 'Student Panel'}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav style={{
          flex: 1, overflowY: 'auto', padding: '0.5rem 0',
          scrollbarWidth: 'none',
        }}>
          <ul style={{ listStyle: 'none', padding: collapsed ? '0 0.5rem' : '0 0.75rem', margin: 0 }}>
            {navItems.map((item, i) => {
              if (item.section) {
                if (collapsed) return null;
                return (
                  <li key={i}>
                    <div style={{
                      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em',
                      color: 'rgba(255,255,255,0.2)', padding: '1.25rem 0.75rem 0.4rem',
                      textTransform: 'uppercase',
                    }}>
                      {item.section}
                    </div>
                  </li>
                );
              }

              const isActive = location.pathname === item.path ||
                (item.path !== '/admin/dashboard' && item.path !== '/dashboard' &&
                  location.pathname.startsWith(item.path));

              return (
                <li key={item.path} style={{ marginBottom: 2 }}>
                  <Link to={item.path} style={{
                    display: 'flex', alignItems: 'center',
                    gap: collapsed ? 0 : '0.75rem',
                    padding: collapsed ? '0.7rem' : '0.6rem 0.875rem',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 10, textDecoration: 'none',
                    transition: 'all 0.18s ease',
                    position: 'relative',
                    background: isActive
                      ? 'rgba(255,255,255,0.09)'
                      : 'transparent',
                    border: isActive
                      ? '1px solid rgba(255,255,255,0.08)'
                      : '1px solid transparent',
                  }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                    title={collapsed ? item.label : ''}
                  >
                    {/* Active left bar */}
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: 0, top: '20%', height: '60%',
                        width: 3, borderRadius: 999,
                        background: `linear-gradient(180deg,${item.color},${item.color}88)`,
                        boxShadow: `0 0 8px ${item.color}`,
                      }} />
                    )}

                    {/* Icon pill */}
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: isActive ? item.bg : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem',
                      transition: 'all 0.18s',
                      boxShadow: isActive ? `0 2px 8px ${item.color}30` : 'none',
                    }}>
                      {item.icon}
                    </div>

                    {!collapsed && (
                      <span style={{
                        fontSize: '0.825rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                        transition: 'color 0.18s',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User block */}
        <div style={{
          padding: collapsed ? '1rem 0.5rem' : '1rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)',
          flexShrink: 0,
        }}>
          {collapsed ? (
            <button onClick={logout} title="Sign Out" style={{
              width: '100%', padding: '0.6rem', borderRadius: 10,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5', cursor: 'pointer', fontSize: '0.9rem',
              transition: 'all 0.2s',
            }}>
              <LogOut size={18} />
            </button>
          ) : (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.75rem', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: '0.625rem',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: isAdmin
                    ? 'linear-gradient(135deg,#245a41,#0a1f14)'
                    : 'linear-gradient(135deg,#2E8857,#245a41)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 800, color: '#fff',
                  boxShadow: '0 4px 12px rgba(46,136,87,0.4)',
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}>
                    {displayName}
                  </div>
                  <div style={{
                    fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)',
                    marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {user?.email || user?.role}
                  </div>
                </div>
                {/* Online dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#22c55e', flexShrink: 0,
                  boxShadow: '0 0 6px #22c55e',
                }} />
              </div>

              <button onClick={logout} style={{
                width: '100%', padding: '0.5rem', borderRadius: 9,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                transition: 'all 0.18s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#fca5a5'; }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ══ MAIN ═════════════════════════════════════════════════════════════ */}
      <main style={{
        flex: 1,
        marginLeft: collapsed ? 72 : 260,
        transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
        minHeight: '100vh',
        background: '#f0f4f2',
      }}>
        {/* Top bar */}
        <div style={{
          height: 56, background: theme.topbarBg,
          borderBottom: `1px solid ${theme.topbarBorder}`,
          display: 'flex', alignItems: 'center',
          padding: '0 1.5rem', gap: '1rem',
          position: 'sticky', top: 0, zIndex: 50,
          boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.04)',
          transition: 'background 0.3s, border-color 0.3s',
        }}>
          {/* Breadcrumb */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: theme.textMuted, fontWeight: 500 }}>
              {isAdmin ? 'Admin' : 'Student'}
            </span>
            <span style={{ color: theme.divider, fontSize: '0.7rem' }}>/</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.textPrimary }}>
              {[...adminNav, ...studentNav].find(n => n.path === location.pathname)?.label || 'Page'}
            </span>
          </div>

          {/* ── Theme Toggle ─────────────────────────────────────────── */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            style={{
              width: 38, height: 38, borderRadius: 10,
              border: `1px solid ${theme.topbarBorder}`,
              background: isDark
                ? 'linear-gradient(135deg,#1c2128,#21262d)'
                : 'linear-gradient(135deg,#fef9c3,#fde68a)',
              cursor: 'pointer', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.25s',
              boxShadow: isDark
                ? '0 0 12px rgba(99,102,241,0.2)'
                : '0 0 12px rgba(251,191,36,0.3)',
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Notification Bell */}
          {true && (
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setNotifOpen(o => !o)} style={{
                width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0',
                background: notifOpen ? '#f1f5f9' : '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', fontSize: '1rem', transition: 'all 0.15s',
              }}>
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span style={{
                    position: 'absolute', top: -3, right: -3,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                    color: '#fff', fontSize: '0.6rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff',
                  }}>
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: 320, background: '#fff', borderRadius: 16,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0',
                  zIndex: 200, overflow: 'hidden',
                  animation: 'dropdownIn 0.18s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  <div style={{
                    padding: '0.875rem 1.125rem', borderBottom: '1px solid #f1f5f9',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(90deg,#fafafe,#fff)',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                      <Bell size={16} /> Notifications
                    </span>
                    {notifications.length > 0 && (
                      <span style={{
                        background: '#D7F4EA', color: '#2E8857', borderRadius: 20,
                        padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700,
                      }}>{notifications.length} unread</span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', opacity: 0.3 }}><Bell size={32} /></div>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                        No new notifications
                      </p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {notifications.map(n => (
                        <div key={n.id} style={{
                          padding: '0.75rem 1.125rem', borderBottom: '1px solid #f8fafc',
                          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                          cursor: 'pointer', transition: 'background 0.1s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          onClick={async () => { try { await api.patch(`/auth/notifications/${n.id}/read/`); } catch {} setNotifications(prev => prev.filter(x => x.id !== n.id)); }}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            background: n.type === 'success' ? '#f0fdf4'
                              : n.type === 'error' ? '#fef2f2' : '#eef2ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.9rem',
                          }}>
                            {n.type === 'success' ? <CheckCircle2 size={16} color="#2E8857" /> : n.type === 'error' ? <XCircle size={16} color="#F95E64" /> : <Info size={16} color="#3578b5" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>
                              {n.message}
                            </p>
                            {n.created_at && (
                              <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: '#94a3b8' }}>
                                {new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#2E8857', fontWeight: 700, flexShrink: 0 }}>
                            Mark read
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right: profile dropdown */}
          <div ref={profileRef} style={{ position: 'relative' }}>

            {/* Trigger button */}
            <button
              onClick={() => setProfileOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: profileOpen ? '#f1f5f9' : 'transparent',
                border: `1px solid ${profileOpen ? '#e2e8f0' : 'transparent'}`,
                borderRadius: 12, padding: '4px 10px 4px 6px',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!profileOpen) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}}
              onMouseLeave={e => { if (!profileOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}}
            >
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: isAdmin
                  ? 'linear-gradient(135deg,#245a41,#0a1f14)'
                  : 'linear-gradient(135deg,#2E8857,#245a41)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: 800, color: '#fff',
                boxShadow: '0 2px 8px rgba(46,136,87,0.35)',
              }}>
                {initials}
              </div>
              {/* Chevron */}
              <span style={{
                fontSize: '0.65rem', color: '#94a3b8',
                transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                marginLeft: 2,
              }}><ChevronDown size={14} /></span>
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                width: 240,
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
                zIndex: 200,
                overflow: 'hidden',
                animation: 'dropdownIn 0.18s cubic-bezier(0.4,0,0.2,1)',
              }}>
                {/* User info */}
                <div style={{
                  padding: '1rem 1.125rem 0.875rem',
                  borderBottom: '1px solid #f1f5f9',
                  background: 'linear-gradient(135deg,#fafafa,#f8fafc)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                      background: isAdmin
                        ? 'linear-gradient(135deg,#245a41,#0a1f14)'
                        : 'linear-gradient(135deg,#2E8857,#245a41)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 800, color: '#fff',
                      boxShadow: '0 4px 14px rgba(46,136,87,0.4)',
                    }}>
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700, fontSize: '0.9rem', color: '#0f172a',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {displayName}
                      </div>
                      <div style={{
                        fontSize: '0.72rem', color: '#94a3b8', marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {user?.email || ''}
                      </div>
                    </div>
                  </div>
                  {/* Role badge */}
                  <div style={{ marginTop: '0.625rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      background: '#D7F4EA',
                      color: '#2E8857',
                      border: '1px solid #7AE582',
                      borderRadius: 20, padding: '2px 10px',
                      fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      <span>{isAdmin ? <Settings size={12} /> : <User size={12} />}</span>
                      {user?.role || 'student'}
                      {user?.exam_type ? ` · ${user.exam_type}` : ''}
                    </span>
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: '0.375rem 0' }}>
                  {[
                    { to: isAdmin ? '/admin/dashboard' : '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard',  color: '#2E8857' },
                    { to: '/papers', icon: <FileText size={16} />, label: 'Exam Papers',   color: '#2563eb' },
                  ].filter(m => !m.hide).map(m => (
                    <Link key={m.to} to={m.to}
                      onClick={() => setProfileOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.6rem 1rem', textDecoration: 'none',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: m.color + '15',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.85rem',
                      }}>{m.icon}</div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                        {m.label}
                      </span>
                    </Link>
                  ))}

                  {/* Divider */}
                  <div style={{ height: 1, background: '#f1f5f9', margin: '0.25rem 0' }} />

                  {/* My Profile */}
                  <Link to="/profile"
                    onClick={() => setProfileOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.6rem 1rem', textDecoration: 'none', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: '#f5f3ff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.85rem',
                    }}><User size={16} /></div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                      My Profile
                    </span>
                  </Link>

                  {/* Contact Us */}
                  <a href="mailto:support@arivupro.com"
                    onClick={() => setProfileOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.6rem 1rem', textDecoration: 'none', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: '#ecfeff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.85rem',
                    }}><Mail size={16} /></div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                      Contact Us
                    </span>
                  </a>

                  {/* Divider */}
                  <div style={{ height: 1, background: '#f1f5f9', margin: '0.25rem 0' }} />

                  {/* Sign Out */}
                  <button
                    onClick={() => { setProfileOpen(false); logout(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.6rem 1rem', width: '100%',
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', transition: 'background 0.12s', borderRadius: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: '#fee2e2', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.85rem',
                    }}><LogOut size={16} /></div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#dc2626' }}>
                      Sign Out
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <div style={{
          padding: '1.75rem 2rem',
          background: theme.pageBg,
          minHeight: 'calc(100vh - 56px)',
          transition: 'background 0.3s',
          color: theme.textPrimary,
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}
