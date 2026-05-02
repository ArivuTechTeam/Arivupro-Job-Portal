/**
 * Main Layout with Sidebar Navigation
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const studentNav = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/papers', label: 'Exam Papers', icon: '📝' },
  { path: '/upload', label: 'Upload Answer', icon: '📤' },
  { path: '/submissions', label: 'My Submissions', icon: '📋' },
  { section: 'Analysis' },
  { path: '/mistakes', label: 'Mistake Library', icon: '📕' },
  { path: '/revision', label: 'Revision Mode', icon: '🔄' },
  { path: '/progress', label: 'Progress & Stats', icon: '📈' },
];

const adminNav = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { section: 'Manage' },
  { path: '/admin/papers', label: 'Question Papers', icon: '📄' },
  { path: '/admin/papers/new', label: 'Create Paper', icon: '➕' },
  { path: '/admin/evaluations', label: 'Evaluations', icon: '✅' },
  { section: 'Student View' },
  { path: '/papers', label: 'Exam Papers', icon: '📝' },
  { path: '/submissions', label: 'All Submissions', icon: '📋' },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navItems = isAdmin ? adminNav : studentNav;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>ArivuPro</h1>
          <p className="tagline">Score Improvement System</p>
        </div>

        <nav>
          <ul className="sidebar-nav">
            {navItems.map((item, i) => {
              if (item.section) {
                return (
                  <li key={i}>
                    <div className="sidebar-section-title">{item.section}</div>
                  </li>
                );
              }
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={location.pathname === item.path ? 'active' : ''}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
            {user?.first_name || user?.username}
            <span className="badge" style={{
              marginLeft: '0.5rem', fontSize: '0.65rem',
              background: isAdmin ? '#fef3c7' : '#dbeafe',
              color: isAdmin ? '#92400e' : '#1e40af',
            }}>
              {user?.role}
            </span>
          </div>
          {user?.exam_type && (
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
              {user.exam_type} - {user.exam_level}
            </div>
          )}
          <button
            onClick={logout}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)',
              padding: '0.375rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem',
              width: '100%',
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
