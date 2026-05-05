import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, RefreshCw, BookOpen, X,
  Brain, Calculator, FileText, Layers, RepeatIcon, Search,
} from 'lucide-react';
import { analyticsAPI } from '../services/api';

// ── Category metadata ──────────────────────────────────────────────────────
const CAT_META = {
  conceptual:   { label: 'Conceptual',   bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd', icon: <Brain size={13} /> },
  presentation: { label: 'Presentation', bg: '#dcfce7', color: '#166534', border: '#86efac', icon: <FileText size={13} /> },
  calculation:  { label: 'Calculation',  bg: '#fef3c7', color: '#92400e', border: '#fcd34d', icon: <Calculator size={13} /> },
  step_loss:    { label: 'Step Loss',    bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', icon: <Layers size={13} /> },
  keyword:      { label: 'Keyword',      bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', icon: <BookOpen size={13} /> },
  format:       { label: 'Format',       bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', icon: <FileText size={13} /> },
};
const SEV_META = {
  minor:    { bg: '#f0fdf4', color: '#15803d' },
  moderate: { bg: '#fffbeb', color: '#d97706' },
  major:    { bg: '#fef2f2', color: '#dc2626' },
};

function CatBadge({ category }) {
  const m = CAT_META[category] || { label: category || 'Other', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', icon: null };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      borderRadius: 20, padding: '2px 9px', fontSize: '0.68rem', fontWeight: 700,
    }}>{m.icon} {m.label}</span>
  );
}

export default function MistakeLibrary() {
  const [mistakes,   setMistakes]   = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [tab,        setTab]        = useState('all');   // all | recurring
  const [catFilter,  setCat]        = useState('all');
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const [sumRes, mistRes] = await Promise.allSettled([
        analyticsAPI.getMistakeSummary(),
        tab === 'recurring'
          ? analyticsAPI.getRecurringMistakes()
          : analyticsAPI.getMistakes(catFilter !== 'all' ? { category: catFilter } : {}),
      ]);
      if (sumRes.status === 'fulfilled') {
        const d = sumRes.value.data;
        setSummary(d);
      }
      if (mistRes.status === 'fulfilled') {
        const raw = mistRes.value.data;
        setMistakes(Array.isArray(raw) ? raw : raw?.results ?? []);
      }
    } catch (e) {
      setError('Failed to load mistake library. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [tab, catFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = mistakes.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.description || '').toLowerCase().includes(q) ||
           (m.suggestion  || '').toLowerCase().includes(q);
  });

  // Build summary stats from data if API doesn't return them
  const totalMistakes   = summary?.total_count   ?? mistakes.length;
  const totalMarksLost  = summary?.total_marks_lost ?? mistakes.reduce((s, m) => s + (m.marks_lost || 0), 0);
  const recurringCount  = mistakes.filter(m => m.is_recurring).length;

  return (
    <div className="page" style={{ overflowX: 'hidden' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg,#0a1f14 0%,#124D2A 60%,#2E8857 100%)',
        borderRadius: 18, padding: '1.5rem 2rem', marginBottom: '1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', margin: '0 0 4px' }}>
            Mistake Library
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', margin: 0 }}>
            Every error is a lesson — review and improve
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          {[
            { label: 'Mistakes',  value: totalMistakes,  color: '#fca5a5' },
            { label: 'Marks Lost',value: totalMarksLost, color: '#fde68a' },
            { label: 'Recurring', value: recurringCount, color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 9, padding: '0.375rem 0.875rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
            </div>
          ))}
          <button onClick={fetchData} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 9, padding: '0.45rem 0.75rem', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center',
          }}><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* Category summary cards */}
      {summary?.categories?.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
          gap: '0.75rem', marginBottom: '1.25rem',
        }}>
          {summary.categories.map(c => {
            const m = CAT_META[c.category] || { label: c.category, bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
            return (
              <div key={c.category} style={{
                background: m.bg, border: `1px solid ${m.border}`, borderRadius: 12,
                padding: '0.875rem 1rem', cursor: 'pointer',
                outline: catFilter === c.category ? `2px solid ${m.color}` : 'none',
              }} onClick={() => { setCat(prev => prev === c.category ? 'all' : c.category); setTab('all'); }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: m.color }}>{c.count}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: m.color, marginBottom: 2 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '0.65rem', color: m.color, opacity: 0.7 }}>
                  {c.marks_lost ?? c.total_marks_lost ?? 0} marks lost
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5', borderLeft: '4px solid #dc2626',
          borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#991b1b',
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', padding: 0 }}><X size={14} /></button>
        </div>
      )}

      {/* Tab + search bar */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
        padding: '0.625rem 0.875rem', marginBottom: '1.25rem',
        display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap',
      }}>
        {[
          { id: 'all',       label: 'All Mistakes' },
          { id: 'recurring', label: 'Recurring', icon: <RepeatIcon size={12} /> },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setCat('all'); }} style={{
            flexShrink: 0, padding: '5px 14px', borderRadius: 20,
            border: tab === t.id ? 'none' : '1.5px solid #e2e8f0',
            background: tab === t.id ? '#2E8857' : '#fff',
            color: tab === t.id ? '#fff' : '#64748b',
            fontWeight: tab === t.id ? 700 : 500, fontSize: '0.78rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>{t.icon}{t.label}</button>
        ))}
        {Object.keys(CAT_META).map(cat => {
          const m = CAT_META[cat];
          const active = catFilter === cat;
          return (
            <button key={cat} onClick={() => { setCat(active ? 'all' : cat); setTab('all'); }} style={{
              flexShrink: 0, padding: '4px 12px', borderRadius: 20,
              border: `1.5px solid ${active ? m.color : '#e2e8f0'}`,
              background: active ? m.bg : '#fff',
              color: active ? m.color : '#64748b',
              fontWeight: active ? 700 : 400, fontSize: '0.72rem', cursor: 'pointer',
            }}>{m.label}</button>
          );
        })}
        <div style={{ width: 1, height: 20, background: '#e2e8f0', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 140 }}>
          <Search size={13} color="#94a3b8" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search mistakes…"
            style={{ border: 'none', outline: 'none', fontSize: '0.8rem', fontFamily: 'inherit', flex: 1 }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}><X size={12} /></button>}
        </div>
        <span style={{ fontSize: '0.68rem', color: '#94a3b8', flexShrink: 0 }}>{filtered.length} found</span>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
          padding: '4rem', textAlign: 'center', color: '#94a3b8',
        }}>
          <BookOpen size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>
            {search ? `No mistakes matching "${search}"` : tab === 'recurring' ? 'No recurring mistakes' : 'No mistakes recorded yet'}
          </p>
          <p style={{ fontSize: '0.82rem' }}>
            {!search && 'Complete evaluations to see your mistakes here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(m => {
            const sev = SEV_META[m.severity] || SEV_META.moderate;
            return (
              <div key={m.id} style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
                padding: '1.125rem 1.375rem',
                borderLeft: `4px solid ${(CAT_META[m.category] || {}).color || '#94a3b8'}`,
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
                  <CatBadge category={m.category} />
                  {m.severity && (
                    <span style={{
                      background: sev.bg, color: sev.color,
                      borderRadius: 20, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700,
                    }}>{m.severity}</span>
                  )}
                  {m.is_recurring && (
                    <span style={{
                      background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
                      borderRadius: 20, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700,
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                    }}><RepeatIcon size={10} /> Recurring</span>
                  )}
                  <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: '0.9rem', color: '#dc2626' }}>
                    −{m.marks_lost ?? 0}m
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', margin: '0 0 0.5rem', lineHeight: 1.55 }}>
                  {m.description}
                </p>

                {/* Suggestion */}
                {m.suggestion && (
                  <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
                    padding: '0.5rem 0.875rem', marginTop: '0.5rem',
                    fontSize: '0.78rem', color: '#166534', lineHeight: 1.55,
                  }}>
                    <strong>How to improve: </strong>{m.suggestion}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
