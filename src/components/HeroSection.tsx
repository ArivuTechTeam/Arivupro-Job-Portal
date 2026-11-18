import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onSearch?: (query: string, location: string) => void;
  onCompanyClick?: (companyName: string) => void;
}

const CATEGORIES = [
  'Articleship',
  'Big 4 Firms',
  'FP&A / Finance',
  'Taxation',
  'Fresher',
  'Internship',
  'Remote',
  'Investment Banking',
  'MNC / GCC',
  'Compliance / CS',
];

const LOCATIONS = [
  'Bangalore', 'Mumbai', 'Hyderabad', 'Delhi NCR', 'Chennai', 'Pune', 'Remote',
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onSearch, onCompanyClick }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(query, location);
  };

  return (
    <div>
      {/* ── HERO ── */}
      <section className="hero-section" style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '56px 24px 48px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 46px)',
            fontWeight: 800, color: '#0f2419',
            letterSpacing: '-0.03em', lineHeight: 1.1,
            marginBottom: 12,
          }}>
            CA articleships, audit roles, and finance jobs across India
          </h1>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 36 }}>
            For CA, ACCA, CFA, CS, CMA &amp; B.Com students. Updated daily from ICAI, Big 4 career sites, and 12 job boards.
          </p>

          {/* ── SEARCH BAR ── */}
          <form onSubmit={handleSearch} className="hero-search-form" style={{
            display: 'flex', alignItems: 'center',
            background: '#fff', border: '1.5px solid #e5e7eb',
            borderRadius: 14, padding: '6px 6px 6px 20px',
            boxShadow: '0 4px 24px rgba(15,36,25,0.08)',
            gap: 0, maxWidth: 760, margin: '0 auto 32px',
          }}>
            {/* Skills input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <Search size={18} color="#9ca3af" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Enter skills / qualifications / companies"
                style={{
                  border: 'none', outline: 'none', fontSize: 14,
                  fontFamily: 'Manrope, sans-serif', color: '#0f2419',
                  background: 'transparent', width: '100%',
                }}
              />
            </div>

            {/* Divider — hidden on mobile */}
            <div className="hero-search-divider" style={{ width: 1, height: 28, background: '#e5e7eb', flexShrink: 0, margin: '0 12px' }} />

            {/* Location select — hidden on mobile */}
            <div className="hero-search-location" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
              <MapPin size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
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
                <option value="">Enter location</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Search button */}
            <button type="submit" className="btn-primary hero-search-btn" style={{
              borderRadius: 10, padding: '10px 28px',
              fontSize: 14, flexShrink: 0, marginLeft: 6,
            }}>
              Search
            </button>
          </form>

          {/* Quick links */}
          <div style={{ fontSize: 13, color: '#9ca3af' }}>
            Try:{' '}
            {['CA Articleship', 'ACCA Jobs', 'Big 4 Audit', 'FP&A Analyst', 'US CPA'].map((tag, i) => (
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

      {/* ── CATEGORY CHIPS ── */}
      <section style={{ background: '#fafafa', borderBottom: '1px solid #e5e7eb', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { if (onSearch) onSearch(cat, ''); }}
                className="hero-category-chip"
                style={{
                  padding: '8px 16px', borderRadius: 8,
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


      <style>{`
        .hero-category-chip:hover { border-color: #1a7a4a !important; color: #1a7a4a !important; background: #f0faf4 !important; }
        @media (max-width: 640px) {
          .hero-section { padding: 32px 16px 28px !important; }
          .hero-search-form {
            flex-direction: column !important;
            padding: 12px 14px !important;
            border-radius: 12px !important;
            gap: 10px !important;
            align-items: stretch !important;
          }
          .hero-search-divider { display: none !important; }
          .hero-search-location { display: none !important; }
          .hero-search-btn { width: 100% !important; margin-left: 0 !important; border-radius: 8px !important; padding: 12px !important; }
        }
      `}</style>

      {/* ── SIGN UP PROMPT (guests only) ── */}
      <section style={{ background: '#0f2419', padding: '40px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Track your applications. Get notified on new CA articleship openings.
          </div>
          <div style={{ fontSize: 14, color: '#6b9e82', marginBottom: 24 }}>
            Free for students. No spam.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-accent" style={{ fontSize: 15, padding: '12px 32px' }} onClick={onGetStarted}>
              Create account
            </button>
            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 32px', borderRadius: 8,
                border: '2px solid rgba(255,255,255,0.3)', background: 'transparent',
                color: '#fff', fontSize: 15, fontWeight: 700,
                fontFamily: 'Manrope, sans-serif', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={onGetStarted}
            >
              Sign in
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
