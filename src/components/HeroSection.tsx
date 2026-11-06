import React, { useState } from 'react';
import { Search, MapPin, ChevronRight } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onSearch?: (query: string, location: string) => void;
}

const CATEGORIES = [
  { icon: '📄', label: 'Articleship' },
  { icon: '🏦', label: 'Big 4 Firms' },
  { icon: '📊', label: 'FP&A / Finance' },
  { icon: '🧾', label: 'Taxation' },
  { icon: '🎓', label: 'Fresher' },
  { icon: '💼', label: 'Internship' },
  { icon: '🌐', label: 'Remote' },
  { icon: '📈', label: 'Investment Banking' },
  { icon: '🏢', label: 'MNC / GCC' },
  { icon: '⚖️', label: 'Compliance / CS' },
];

const LOCATIONS = [
  'Bangalore', 'Mumbai', 'Hyderabad', 'Delhi NCR', 'Chennai', 'Pune', 'Remote',
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onSearch }) => {
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
        padding: '56px 24px 48px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#f0faf4', border: '1px solid #d7f4ea',
            borderRadius: 999, padding: '5px 14px', marginBottom: 24,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1a7a4a', display: 'inline-block' }} className="animate-pulse-dot" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a7a4a' }}>
              673 live finance jobs · Updated 5 mins ago
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 46px)',
            fontWeight: 800, color: '#0f2419',
            letterSpacing: '-0.03em', lineHeight: 1.1,
            marginBottom: 12,
          }}>
            Find your dream finance career now
          </h1>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 36 }}>
            Exclusive placements for CA, ACCA, CFA, CS, CMA &amp; B.Com students
          </p>

          {/* ── SEARCH BAR ── */}
          <form onSubmit={handleSearch} style={{
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

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: '#e5e7eb', flexShrink: 0, margin: '0 12px' }} />

            {/* Location select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
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
            <button type="submit" className="btn-primary" style={{
              borderRadius: 10, padding: '10px 28px',
              fontSize: 14, flexShrink: 0, marginLeft: 6,
            }}>
              Search
            </button>
          </form>

          {/* Quick links */}
          <div style={{ fontSize: 13, color: '#9ca3af' }}>
            Popular:{' '}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                onClick={() => { if (onSearch) onSearch(cat.label, ''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 10,
                  border: '1px solid #e5e7eb', background: '#fff',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: '#374151', fontFamily: 'Manrope, sans-serif',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a7a4a';
                  (e.currentTarget as HTMLButtonElement).style.color = '#1a7a4a';
                  (e.currentTarget as HTMLButtonElement).style.background = '#f0faf4';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
                  (e.currentTarget as HTMLButtonElement).style.color = '#374151';
                  (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                }}
              >
                <span style={{ fontSize: 16 }}>{cat.icon}</span>
                {cat.label}
                <ChevronRight size={13} color="#9ca3af" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP COMPANIES ── */}
      <section style={{ background: '#fff', padding: '40px 24px 48px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', textAlign: 'center', marginBottom: 28, letterSpacing: '-0.02em' }}>
            Top companies hiring now
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { name: 'Deloitte India', type: 'Big 4 · Audit', jobs: 3, badge: 'MoU Partner', logo: 'D' },
              { name: 'Goldman Sachs', type: 'Investment Banking', jobs: 1, badge: 'MoU Partner', logo: 'GS' },
              { name: 'BDO India LLP', type: 'Articleship', jobs: 2, badge: 'Verified', logo: 'BDO' },
              { name: 'PwC AC', type: 'Big 4 · Tax', jobs: 2, badge: 'Verified', logo: 'PwC' },
              { name: 'Avendus', type: 'IB · M&A', jobs: 1, badge: 'Verified', logo: 'AV' },
              { name: 'Grant Thornton', type: 'Compliance', jobs: 2, badge: 'Verified', logo: 'GT' },
            ].map(co => (
              <div
                key={co.name}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 10,
                  padding: '16px', borderRadius: 12, border: '1px solid #e5e7eb',
                  background: '#fff', cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#1a7a4a';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(26,122,74,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: '#f0faf4', border: '1px solid #d7f4ea',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 12, color: '#1a7a4a',
                }}>
                  {co.logo}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2419' }}>{co.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{co.type}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#1a7a4a', fontWeight: 700 }}>{co.jobs} open roles</span>
                  <span className={co.badge === 'MoU Partner' ? 'badge badge-yellow' : 'badge badge-green'} style={{ fontSize: '0.6rem' }}>
                    {co.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section style={{ background: '#f0faf4', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center' }}>
          {[
            { number: '1,200+', label: 'Students Placed' },
            { number: '85+', label: 'Verified Companies' },
            { number: '673', label: 'Live Jobs Today' },
            { number: '₹9.8L', label: 'Avg CTC Placed' },
            { number: '4', label: 'Job Types' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1a7a4a', letterSpacing: '-0.03em' }}>{stat.number}</div>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SIGN UP PROMPT (guests only) ── */}
      <section style={{ background: '#0f2419', padding: '40px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Create your free account to apply
          </div>
          <div style={{ fontSize: 14, color: '#6b9e82', marginBottom: 24 }}>
            Save jobs, track applications, get AI match scores — all in one place
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-accent" style={{ fontSize: 15, padding: '12px 32px' }} onClick={onGetStarted}>
              Register free →
            </button>
            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 32px', borderRadius: 999,
                border: '2px solid rgba(255,255,255,0.3)', background: 'transparent',
                color: '#fff', fontSize: 15, fontWeight: 700,
                fontFamily: 'Manrope, sans-serif', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={onGetStarted}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
