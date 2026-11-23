import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, LogOut, User, ArrowLeft } from 'lucide-react';

export type NavTab =
  | 'dashboard'
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
  | 'admin-students'
  | 'admin-jobs'
  | 'admin-companies'
  | 'admin-recruiters'
  | 'recruiter-jobs'
  | 'recruiter-applicants'
  | 'recruiter-post'
  | 'synced-jobs'
  | 'admin-profile';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onBack: () => void;
  canGoBack: boolean;
  userRole: 'guest' | 'student' | 'recruiter' | 'admin';
  userName?: string;
  onSignIn: (mode?: 'login' | 'signup') => void;
  onSignOut: () => void;
  onForEmployers: () => void;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab, onTabChange, onBack, canGoBack, userRole, userName, onSignIn, onSignOut, onForEmployers,
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

  // Close mobile menu on tab change
  useEffect(() => { setMobileOpen(false); }, [currentTab]);

  const studentTabs: { id: NavTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'articleship', label: 'Articleship' },
    { id: 'internships', label: 'Internships' },
    { id: 'companies', label: 'Companies' },
    { id: 'applications', label: 'My Applications' },
    { id: 'ai-match', label: 'Job Match' },
    { id: 'profile', label: 'My Profile' },
  ];

  const recruiterTabs: { id: NavTab; label: string }[] = [];

  const adminTabs: { id: NavTab; label: string }[] = [
    { id: 'admin-dashboard', label: 'Dashboard' },
    { id: 'crm', label: 'Placement CRM' },
    { id: 'scraper', label: 'Scraper' },
  ];

  const tabs =
    userRole === 'recruiter' ? recruiterTabs
    : userRole === 'admin' ? adminTabs
    : userRole === 'guest' ? studentTabs.slice(1, 5)   // Jobs, Articleship, Internships, Companies
    : studentTabs;

  const initials = userName ? getInitials(userName) : '';

  return (
    <header className="ap-slide-down" style={{
      position: 'sticky', top: 0, zIndex: 50, background: '#fff',
      boxShadow: scrolled ? '0 2px 16px rgba(15,36,25,0.08)' : '0 1px 0 #e5e7eb',
      transition: 'box-shadow 0.2s ease',
    }}>
      {/* Top bar */}
      <div style={{
        maxWidth: 1180, margin: '0 auto', padding: '0 16px',
        height: 60, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
      }}>
        {/* Left — back button + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button
            onClick={onBack}
            aria-label="Go back within ArivuPro"
            title="Back"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: 9,
              border: '1px solid #e5e7eb', background: canGoBack ? '#fff' : '#f9fafb',
              color: canGoBack ? '#0f2419' : '#9ca3af',
              cursor: canGoBack ? 'pointer' : 'default', padding: 0, flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => onTabChange('jobs')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
          >
            <img
              src="/logo-white.png"
              alt="ArivuPro Academy"
              style={{ height: 40, width: 'auto', background: '#1b5234', borderRadius: 10, padding: '6px 14px' }}
            />
          </button>
        </div>

        {/* Right — user controls */}
        <div className="nav-desktop-right" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {userRole === 'guest' ? (
            <>
              <button
                onClick={() => onSignIn('login')}
                style={{
                  padding: '7px 18px', borderRadius: 8,
                  border: '1.5px solid #1a7a4a', background: 'transparent',
                  color: '#1a7a4a', fontSize: 13, fontWeight: 700,
                  fontFamily: 'Manrope, sans-serif', cursor: 'pointer',
                }}
              >Sign in</button>
              <button className="btn-primary" onClick={() => onSignIn('signup')} style={{ padding: '7px 18px', fontSize: 13 }}>
                Create account
              </button>
              <button
                onClick={onForEmployers}
                style={{
                  fontSize: 13, fontWeight: 600, color: '#6b7280',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '7px 4px', fontFamily: 'Manrope, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                Post a job
              </button>
            </>
          ) : (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#f0faf4', border: '1px solid #d7f4ea',
                  borderRadius: 10, padding: '5px 12px 5px 5px',
                  cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#1a7a4a',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 11, flexShrink: 0,
                }}>
                  {initials}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f2419', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userName}
                </span>
                <ChevronDown size={14} color="#6b7280" />
              </button>
              {dropdownOpen && (
                <div className="ap-scale-in" style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(15,36,25,0.12)', minWidth: 160, overflow: 'hidden', zIndex: 100,
                }}>
                  <button onClick={() => { onTabChange('profile'); setDropdownOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, color: '#0f2419', textAlign: 'left' }}>
                    <User size={15} color="#6b7280" /> My Profile
                  </button>
                  <div style={{ height: 1, background: '#f3f4f6' }} />
                  <button onClick={() => { onSignOut(); setDropdownOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, color: '#dc2626', textAlign: 'left' }}>
                    <LogOut size={15} color="#dc2626" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hamburger — shown on mobile */}
        <button
          className="nav-hamburger"
          style={{ display: 'none', padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} color="#0f2419" /> : <Menu size={22} color="#0f2419" />}
        </button>
      </div>

      {/* Tab nav row — hidden on mobile (use drawer), hidden for admin */}
      {userRole !== 'admin' && (
        <div className="nav-tabs-row" style={{ borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #e5e7eb', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 16px', display: 'flex', gap: 2, alignItems: 'center' }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`tab-link${currentTab === tab.id ? ' active' : ''}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="ap-fade-up" style={{ background: '#fff', borderBottom: '2px solid #e5e7eb', padding: '8px 16px 20px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { onTabChange(tab.id); setMobileOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '12px 14px', borderRadius: 10,
                background: currentTab === tab.id ? '#f0faf4' : 'none',
                border: 'none', fontFamily: 'Manrope, sans-serif',
                fontSize: 15, fontWeight: currentTab === tab.id ? 700 : 500,
                color: currentTab === tab.id ? '#1a7a4a' : '#374151',
                cursor: 'pointer', marginBottom: 2,
              }}
            >
              {tab.label}
            </button>
          ))}
          {userRole === 'guest' && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  style={{ flex: 1, padding: '11px 16px', borderRadius: 8, border: '1.5px solid #1a7a4a', background: 'transparent', color: '#1a7a4a', fontSize: 14, fontWeight: 700, fontFamily: 'Manrope, sans-serif', cursor: 'pointer' }}
                  onClick={() => { onSignIn('login'); setMobileOpen(false); }}
                >Sign in</button>
                <button className="btn-primary" style={{ flex: 1, fontSize: 14, padding: '11px 16px' }} onClick={() => { onSignIn('signup'); setMobileOpen(false); }}>
                  Create account
                </button>
              </div>
              <button onClick={() => { onForEmployers(); setMobileOpen(false); }} style={{ width: '100%', textAlign: 'center', padding: '10px', fontSize: 14, fontWeight: 600, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>
                Post a job
              </button>
            </div>
          )}
          {userRole !== 'guest' && (
            <div style={{ marginTop: 12, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
              <button onClick={() => { onSignOut(); setMobileOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                <LogOut size={16} color="#dc2626" /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .nav-desktop-right { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-tabs-row { display: none !important; }
        }
      `}</style>
    </header>
  );
};
