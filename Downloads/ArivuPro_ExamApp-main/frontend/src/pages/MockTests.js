import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MOCK_TESTS, PURCHASED_TEST_IDS,
  EXAM_FILTER_OPTIONS, LEVEL_FILTER_OPTIONS, EXAM_COLORS,
} from '../data/mockTestsData';

// ── helpers ───────────────────────────────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>
      {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
      <span style={{ color: '#64748b', marginLeft: 4 }}>{rating}</span>
    </span>
  );
}

function TagBadge({ tag }) {
  const map = {
    Free:     { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
    Premium:  { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
    Popular:  { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
    'May 2026':{ bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
    'Nov 2026':{ bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
    'June 2026':{ bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
    'Dec 2026':{ bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
    'IMA':    { bg: '#eff6ff', text: '#1e3a8a', border: '#93c5fd' },
    'ACCA UK':{ bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
    Series:   { bg: '#f5f3ff', text: '#6d28d9', border: '#c4b5fd' },
  };
  const s = map[tag] || { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
  return (
    <span style={{
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 20, padding: '2px 9px', fontSize: '0.68rem', fontWeight: 600,
    }}>{tag}</span>
  );
}

// ── Single test card ──────────────────────────────────────────────────────────
function TestCard({ test, isPurchased, onPurchase }) {
  const navigate = useNavigate();
  const ec = EXAM_COLORS[test.exam] || EXAM_COLORS['CA'];
  const free = test.price === 0;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 14,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.2s, transform 0.2s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top colour stripe */}
      <div style={{ height: 4, background: ec.dot }} />

      <div style={{ padding: '1.125rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{
              background: ec.bg, color: ec.text, border: `1px solid ${ec.border}`,
              borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700,
            }}>{test.exam}</span>
            {test.tags.slice(0, 2).map(t => <TagBadge key={t} tag={t} />)}
          </div>
          {isPurchased && (
            <span style={{
              background: '#dcfce7', color: '#166534', border: '1px solid #86efac',
              borderRadius: 20, padding: '2px 10px', fontSize: '0.68rem', fontWeight: 700,
              flexShrink: 0,
            }}>✓ Purchased</span>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontWeight: 700, fontSize: '0.95rem', color: '#0f172a',
          lineHeight: 1.45, margin: 0,
        }}>
          {test.title}
        </h3>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { icon: '🎓', val: test.level },
            { icon: '📖', val: test.subject },
            { icon: '📄', val: `${test.pages} Pages` },
          ].map(m => (
            <span key={m.val} style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span>{m.icon}</span>{m.val}
            </span>
          ))}
        </div>

        {/* Marks & duration */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{
            background: '#f8fafc', borderRadius: 8, padding: '0.375rem 0.75rem',
            display: 'flex', gap: 6, alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>⭐ Marks</span>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>{test.marks}</span>
          </div>
          <div style={{
            background: '#f8fafc', borderRadius: 8, padding: '0.375rem 0.75rem',
            display: 'flex', gap: 6, alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>⏱ Duration</span>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>{test.duration} min</span>
          </div>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6,
          margin: 0, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {test.description}
        </p>

        {/* Rating & students */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <StarRating rating={test.rating} />
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {test.students.toLocaleString()} students
          </span>
        </div>

        {/* Credits note */}
        <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
          Includes {test.credits} evaluation credit — upload your sheet and get instant feedback
        </p>
      </div>

      {/* Footer action */}
      <div style={{
        padding: '0.875rem 1.25rem',
        borderTop: '1px solid #f1f5f9',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#fafafa',
      }}>
        {/* Price */}
        <div>
          {free ? (
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#16a34a' }}>FREE</span>
          ) : isPurchased ? (
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#16a34a' }}>
              ₹{test.price} <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#64748b' }}>paid</span>
            </span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>₹</span>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e293b' }}>{test.price}</span>
            </div>
          )}
        </div>

        {/* Button */}
        {isPurchased || free ? (
          <button
            onClick={() => navigate(`/exam/${test.exam === 'CA' ? 'ca-intermediate' : test.exam.toLowerCase().replace(' ', '-')}`)}
            style={{
              padding: '0.5rem 1.25rem', background: '#16a34a',
              border: 'none', borderRadius: 8, color: '#fff',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            }}
          >
            Go to Test →
          </button>
        ) : (
          <button
            onClick={() => onPurchase(test)}
            style={{
              padding: '0.5rem 1.25rem', background: '#2563eb',
              border: 'none', borderRadius: 8, color: '#fff',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            }}
          >
            Get Test ₹{test.price}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Purchase modal ────────────────────────────────────────────────────────────
function PurchaseModal({ test, onClose, onConfirm }) {
  if (!test) return null;
  const ec = EXAM_COLORS[test.exam] || EXAM_COLORS['CA'];
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '2rem',
        maxWidth: 440, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: ec.bg, border: `2px solid ${ec.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', margin: '0 auto 0.875rem',
          }}>📄</div>
          <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.375rem' }}>
            Purchase Test
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            You are about to purchase:
          </p>
        </div>

        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 10, padding: '1rem', marginBottom: '1.25rem',
        }}>
          <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
            {test.title}
          </p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
            <span>🎓 {test.level}</span>
            <span>📖 {test.subject}</span>
            <span>⭐ {test.marks} marks</span>
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#eff6ff', borderRadius: 10, padding: '0.875rem 1rem', marginBottom: '1.5rem',
        }}>
          <span style={{ color: '#374151', fontWeight: 600, fontSize: '0.9rem' }}>Total Amount</span>
          <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#2563eb' }}>₹{test.price}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '0.7rem', borderRadius: 8,
            background: '#f1f5f9', border: '1px solid #e2e8f0',
            color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
          }}>Cancel</button>
          <button onClick={() => onConfirm(test)} style={{
            flex: 2, padding: '0.7rem', borderRadius: 8,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
          }}>
            Pay ₹{test.price} & Unlock Test
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.875rem' }}>
          🔒 Secure payment · Instant access after payment
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MockTests() {
  const [examFilter, setExam]       = useState('');
  const [levelFilter, setLevel]     = useState('');
  const [subjectFilter, setSubject] = useState('');
  const [search, setSearch]         = useState('');
  const [purchased, setPurchased]   = useState(new Set(PURCHASED_TEST_IDS));
  const [buyTarget, setBuyTarget]   = useState(null);
  const [toast, setToast]           = useState('');

  const allSubjects = useMemo(() => {
    const s = new Set(MOCK_TESTS.map(t => t.subject));
    return ['', ...s];
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_TESTS.filter(t => {
      const mExam    = !examFilter    || t.exam === examFilter;
      const mLevel   = !levelFilter   || t.level === levelFilter;
      const mSubject = !subjectFilter || t.subject === subjectFilter;
      const mSearch  = !q || t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
      return mExam && mLevel && mSubject && mSearch;
    });
  }, [examFilter, levelFilter, subjectFilter, search]);

  function handleConfirmPurchase(test) {
    setPurchased(prev => new Set([...prev, test.id]));
    setBuyTarget(null);
    setToast(`✅ "${test.title}" unlocked successfully!`);
    setTimeout(() => setToast(''), 3500);
  }

  const freeCount = filtered.filter(t => t.price === 0).length;
  const purchasedCount = filtered.filter(t => purchased.has(t.id) && t.price > 0).length;

  return (
    <div className="page">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 2000,
          background: '#16a34a', color: '#fff', borderRadius: 10,
          padding: '0.875rem 1.25rem', fontWeight: 600, fontSize: '0.875rem',
          boxShadow: '0 8px 24px rgba(22,163,74,0.35)',
          animation: 'slideIn 0.3s ease',
        }}>
          {toast}
        </div>
      )}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }`}</style>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Mock Tests</h1>
          <p className="subtitle">Browse and purchase mock tests for CA, CMA & CS exams</p>
        </div>
        <Link to="/dashboard" style={{
          padding: '0.5rem 1.25rem', background: '#f1f5f9',
          border: '1px solid #e2e8f0', borderRadius: 8,
          color: '#475569', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
        }}>
          ← Dashboard
        </Link>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '0.875rem', marginBottom: '1.5rem',
      }}>
        {[
          { icon: '📚', label: 'Total Tests', value: MOCK_TESTS.length, color: '#2563eb', bg: '#eff6ff' },
          { icon: '🆓', label: 'Free Tests', value: MOCK_TESTS.filter(t=>t.price===0).length, color: '#16a34a', bg: '#f0fdf4' },
          { icon: '🔓', label: 'Purchased', value: purchased.size, color: '#7c3aed', bg: '#f5f3ff' },
          { icon: '📋', label: 'Showing', value: filtered.length, color: '#d97706', bg: '#fffbeb' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 10,
            padding: '0.75rem 1rem',
            display: 'flex', alignItems: 'center', gap: '0.625rem',
          }}>
            <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-input" style={{ flex: 1, minWidth: 150 }}
            value={examFilter} onChange={e => setExam(e.target.value)}>
            {EXAM_FILTER_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select className="form-input" style={{ flex: 1, minWidth: 150 }}
            value={levelFilter} onChange={e => setLevel(e.target.value)}>
            <option value="">All Levels</option>
            {['Foundation', 'Intermediate', 'Final', 'Executive', 'Professional'].map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select className="form-input" style={{ flex: 1, minWidth: 160 }}
            value={subjectFilter} onChange={e => setSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {allSubjects.filter(Boolean).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            className="form-input"
            style={{ flex: 2, minWidth: 200 }}
            placeholder="🔍 Search tests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {(examFilter || levelFilter || subjectFilter || search) && (
            <button className="btn btn-secondary"
              onClick={() => { setExam(''); setLevel(''); setSubject(''); setSearch(''); }}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b', display: 'flex', gap: '1rem' }}>
        <span><strong style={{ color: '#1e293b' }}>{filtered.length}</strong> tests found</span>
        {freeCount > 0 && <span>· <strong style={{ color: '#16a34a' }}>{freeCount}</strong> free</span>}
        {purchasedCount > 0 && <span>· <strong style={{ color: '#7c3aed' }}>{purchasedCount}</strong> purchased</span>}
      </div>

      {/* Test grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>No tests found</h3>
          <p style={{ color: '#64748b' }}>Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}>
          {filtered.map(test => (
            <TestCard
              key={test.id}
              test={test}
              isPurchased={purchased.has(test.id)}
              onPurchase={t => setBuyTarget(t)}
            />
          ))}
        </div>
      )}

      {/* Purchase modal */}
      <PurchaseModal
        test={buyTarget}
        onClose={() => setBuyTarget(null)}
        onConfirm={handleConfirmPurchase}
      />
    </div>
  );
}
