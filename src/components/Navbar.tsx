import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, LogOut, User } from 'lucide-react';

export type NavTab =
  | 'jobs'
  | 'articleship'
  | 'internships'
  | 'companies'
  | 'applications'
  | 'ai-match'
  | 'profile'
  | 'crm'
  | 'scraper'
  | 'admin-dashboard'
  | 'db-schema'
  | 'tech-stack'
  | 'recruiter-jobs'
  | 'recruiter-applicants'
  | 'recruiter-post';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userRole: 'guest' | 'student' | 'recruiter' | 'admin';
  userName?: string;
  onSignIn: (mode?: 'login' | 'signup') => void;
  onSignOut: () => void;
  onForEmployers: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  userRole,
  userName,
  onSignIn,
  onSignOut,
  onForEmployers,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const studentTabs: { id: NavTab; label: string }[] = [
    { id: 'jobs', label: 'Jobs' },
    { id: 'articleship', label: 'Articleship' },
    { id: 'internships', label: 'Internships' },
    { id: 'companies', label: 'Companies' },
    { id: 'applications', label: 'My Applications' },
    { id: 'ai-match', label: '✨ AI Match' },
    { id: 'profile', label: 'My Profile' },
  ];

  const recruiterTabs: { id: NavTab; label: string }[] = [];

  const adminTabs: { id: NavTab; label: string }[] = [
    { id: 'admin-dashboard', label: 'Dashboard' },
    { id: 'crm', label: 'Placement CRM' },
    { id: 'scraper', label: 'Scraper' },
    { id: 'db-schema', label: 'DB Schema' },
    { id: 'tech-stack', label: 'Tech Stack' },
  ];

  const tabs =
    userRole === 'recruiter'
      ? recruiterTabs
      : userRole === 'admin'
      ? adminTabs
      : userRole === 'guest'
      ? studentTabs.slice(0, 4)   // guests: Jobs, Articleship, Internships, Companies
      : studentTabs;               // logged-in students: all 7 tabs

  const initials = userName ? getInitials(userName) : '';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#fff',
        boxShadow: scrolled ? '0 2px 16px rgba(15,36,25,0.08)' : '0 1px 0 #e5e7eb',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '0 20px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Logo */}
        <button
          onClick={() => { onTabChange('jobs'); setMobileOpen(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#1a7a4a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 18,
              color: '#fede6d',
              flexShrink: 0,
            }}
          >
            A
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0f2419', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              ArivuPro
            </div>
            <div style={{ fontWeight: 600, fontSize: 11, color: '#1a7a4a', lineHeight: 1 }}>
              Finance Careers
            </div>
          </div>
        </button>

        {/* Desktop right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {userRole === 'guest' ? (
            <>
              {/* Login — outline pill */}
              <button
                onClick={() => onSignIn('login')}
                style={{
                  padding: '8px 20px', borderRadius: 999,
                  border: '1.5px solid #1a7a4a', background: 'transparent',
                  color: '#1a7a4a', fontSize: 13, fontWeight: 700,
                  fontFamily: 'Manrope, sans-serif', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f0faf4'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                Login
              </button>

              {/* Register — solid pill */}
              <button className="btn-primary" onClick={() => onSignIn('signup')} style={{ padding: '8px 20px', fontSize: 13 }}>
                Register
              </button>

              {/* For Employers */}
              <button
                onClick={onForEmployers}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 13, fontWeight: 600, color: '#6b7280',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 4px', fontFamily: 'Manrope, sans-serif',
                  whiteSpace: 'nowrap', transition: 'color 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#1a7a4a'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
              >
                For Employers
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginTop: 1 }}>
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          ) : (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#f0faf4',
                  border: '1px solid #d7f4ea',
                  borderRadius: 999,
                  padding: '6px 12px 6px 6px',
                  cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: '#1a7a4a',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f2419', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userName}
                </span>
                <ChevronDown size={14} color="#6b7280" />
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(15,36,25,0.12)',
                    minWidth: 180,
                    overflow: 'hidden',
                    zIndex: 100,
                  }}
                >
                  <button
                    onClick={() => { onTabChange('applications'); setDropdownOpen(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0f2419',
                      textAlign: 'left',
                    }}
                  >
                    <User size={15} color="#6b7280" />
                    My Profile
                  </button>
                  <div style={{ height: 1, background: '#f3f4f6' }} />
                  <button
                    onClick={() => { onSignOut(); setDropdownOpen(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#dc2626',
                      textAlign: 'left',
                    }}
                  >
                    <LogOut size={15} color="#dc2626" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hamburger */}
          <button
            className="btn-ghost"
            style={{ display: 'none', padding: '8px' }}
            id="hamburger-btn"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Tab nav row */}
      <div
        style={{
          borderTop: '1px solid #f3f4f6',
          borderBottom: '1px solid #e5e7eb',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            gap: 2,
            alignItems: 'center',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { onTabChange(tab.id); setMobileOpen(false); }}
              className={`tab-link${currentTab === tab.id ? ' active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #e5e7eb',
            padding: '8px 20px 16px',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { onTabChange(tab.id); setMobileOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 9,
                background: currentTab === tab.id ? '#f0faf4' : 'none',
                border: 'none',
                fontFamily: 'Manrope, sans-serif',
                fontSize: 14,
                fontWeight: currentTab === tab.id ? 700 : 500,
                color: currentTab === tab.id ? '#1a7a4a' : '#374151',
                cursor: 'pointer',
                marginBottom: 2,
              }}
            >
              {tab.label}
            </button>
          ))}
          {userRole === 'guest' && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                style={{ flex: 1, padding: '9px 16px', borderRadius: 999, border: '1.5px solid #1a7a4a', background: 'transparent', color: '#1a7a4a', fontSize: 13, fontWeight: 700, fontFamily: 'Manrope, sans-serif', cursor: 'pointer' }}
                onClick={() => { onSignIn('login'); setMobileOpen(false); }}
              >
                Login
              </button>
              <button className="btn-primary" style={{ flex: 1, fontSize: 13, padding: '9px 16px' }} onClick={() => { onSignIn('signup'); setMobileOpen(false); }}>
                Register
              </button>
              <button onClick={() => { onForEmployers(); setMobileOpen(false); }} style={{ width: '100%', textAlign: 'center', padding: '9px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>
                For Employers →
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          #hamburger-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
};
