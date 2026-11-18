import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onSearch?: (query: string, location: string) => void;
  onCompanyClick?: (companyName: string) => void;
}

const CATEGORIES = [
  'CA Articleship',
  'CMA Articleship',
  'CS Training',
  'Big 4 Firms',
  'FP&A / Finance',
  'Taxation',
  'Internship',
  'Remote',
  'Investment Banking',
  'Compliance / CS',
];

const LOCATIONS = [
  'Bengaluru', 'Mumbai', 'Delhi NCR', 'Chennai', 'Hyderabad',
  'Pune', 'Gurugram', 'Ahmedabad', 'Jaipur', 'Remote',
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onSearch, onCompanyClick: _onCompanyClick }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(query, location);
  };

  return (
    <div>
      {/* ── HERO ── */}
      <section style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '64px 24px 56px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {/* Eyebrow */}
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1a7a4a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Finance Career Portal
          </p>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800, color: '#0f2419',
            letterSpacing: '-0.03em', lineHeight: 1.1,
            marginBottom: 16,
          }}>
            Find your Articleship at India's Top Firms
          </h1>

          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 12, lineHeight: 1.6 }}>
            Verified articleship vacancies for CA, CS, CMA, ACCA, EA, CIA, FRM, CFA, CPA across Tier 1 and Tier 2 firms.
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 40 }}>
            Apply directly — no middlemen, no fees.
          </p>

          {/* ── SEARCH BAR ── */}
          <form onSubmit={handleSearch} className="hero-search-form" style={{
            display: 'flex', alignItems: 'center',
            background: '#fff', border: '1.5px solid #e5e7eb',
            borderRadius: 10, padding: '6px 6px 6px 18px',
            boxShadow: '0 2px 12px rgba(15,36,25,0.06)',
            gap: 0, maxWidth: 680, margin: '0 auto 40px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <Search size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Job title, qualification, firm name..."
                style={{
                  border: 'none', outline: 'none', fontSize: 14,
                  fontFamily: 'Manrope, sans-serif', color: '#0f2419',
                  background: 'transparent', width: '100%',
                }}
              />
            </div>
            <div className="hero-search-divider" style={{ width: 1, height: 26, background: '#e5e7eb', flexShrink: 0, margin: '0 10px' }} />
            <div className="hero-search-location" style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 140 }}>
              <MapPin size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                style={{
                  border: 'none', outline: 'none', fontSize: 14,
                  fontFamily: 'Manrope, sans-serif', color: location ? '#0f2419' : '#9ca3af',
                  background: 'transparent', cursor: 'pointer',
                  appearance: 'none', width: '100%',
                }}
              >
                <option value="">All cities</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <button type="submit" style={{
              borderRadius: 7, padding: '9px 22px', marginLeft: 6,
              background: '#0f2419', color: '#fff',
              fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif', flexShrink: 0,
              transition: 'background 0.15s',
            }}
              className="hero-search-btn"
            >
              Search
            </button>
          </form>

          {/* Quick searches */}
          <div style={{ fontSize: 13, color: '#9ca3af' }}>
            Popular:{' '}
            {['CA Articleship', 'Big 4', 'CMA Training', 'CS Articleship', 'Remote'].map((tag, i) => (
              <React.Fragment key={tag}>
                {i > 0 && <span style={{ margin: '0 4px' }}>·</span>}
                <button
                  onClick={() => { if (onSearch) onSearch(tag, ''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a7a4a', fontWeight: 600, fontSize: 13, fontFamily: 'Manrope, sans-serif', padding: 0 }}
                >
                  {tag}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{ background: '#f8faf9', borderBottom: '1px solid #e5e7eb', padding: '20px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', alignItems: 'center' }}>
          {[
            { number: '38+', label: 'Open vacancies' },
            { number: '2', label: 'Firm tiers' },
            { number: '8+', label: 'Cities covered' },
            { number: '24h', label: 'Listings reviewed' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{stat.number}</div>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
          <div style={{ fontSize: 12, color: '#9ca3af', borderLeft: '1px solid #e5e7eb', paddingLeft: 32 }}>
            Updated daily from ICAI, Big 4 career sites &amp; 12+ job boards
          </div>
        </div>
      </section>

      {/* ── CATEGORY CHIPS ── */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { if (onSearch) onSearch(cat, ''); }}
                className="hero-category-chip"
                style={{
                  padding: '7px 16px', borderRadius: 6,
                  border: '1px solid #e5e7eb', background: '#fff',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: '#374151', fontFamily: 'Manrope, sans-serif',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FOR GUESTS ── */}
      <section style={{ background: '#0f2419', padding: '36px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Track your applications. Get notified on new CA articleship openings.
          </div>
          <div style={{ fontSize: 14, color: '#6b9e82', marginBottom: 24 }}>
            Free for students. No spam.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              style={{
                padding: '11px 28px', borderRadius: 7, background: '#fede6d',
                color: '#0f2419', fontSize: 14, fontWeight: 700,
                border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                transition: 'opacity 0.15s',
              }}
              onClick={onGetStarted}
            >
              Create account
            </button>
            <button
              style={{
                padding: '11px 28px', borderRadius: 7,
                border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent',
                color: '#fff', fontSize: 14, fontWeight: 700,
                fontFamily: 'Manrope, sans-serif', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onClick={onGetStarted}
            >
              Sign in
            </button>
          </div>
        </div>
      </section>

      <style>{`
        .hero-search-btn:hover { background: #1a7a4a !important; }
        .hero-category-chip:hover { border-color: #1a7a4a !important; color: #1a7a4a !important; background: #f0faf4 !important; }
        @media (max-width: 640px) {
          .hero-search-form {
            flex-direction: column !important;
            padding: 12px 14px !important;
            border-radius: 10px !important;
            gap: 10px !important;
            align-items: stretch !important;
          }
          .hero-search-divider { display: none !important; }
          .hero-search-location { display: none !important; }
          .hero-search-btn { width: 100% !important; margin-left: 0 !important; padding: 11px !important; }
        }
      `}</style>
    </div>
  );
};
