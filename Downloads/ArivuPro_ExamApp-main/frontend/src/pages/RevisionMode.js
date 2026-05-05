import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, AlertTriangle, RefreshCw, BookOpen,
  Clock, Flame, X, Upload, RotateCcw,
} from 'lucide-react';
import { analyticsAPI } from '../services/api';

const PRIORITY_META = {
  high:   { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5', dot: '#ef4444', label: 'High' },
  medium: { bg: '#fef3c7', color: '#d97706', border: '#fcd34d', dot: '#f59e0b', label: 'Medium' },
  low:    { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd', dot: '#3b82f6', label: 'Low'  },
};

function PriorityBadge({ priority }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.medium;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      borderRadius: 20, padding: '2px 9px', fontSize: '0.68rem', fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot }} />
      {m.label} Priority
    </span>
  );
}

export default function RevisionMode() {
  const [items,        setItems]        = useState([]);
  const [resolved,     setResolved]     = useState(new Set());
  const [filter,       setFilter]       = useState('all');  // all | high | medium | low | pending
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [saving,       setSaving]       = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const { data } = await analyticsAPI.getRevisionData();
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setItems(list);
      // Pre-mark already-resolved items from backend
      const resolvedIds = list.filter(i => i.is_resolved).map(i => i.id);
      setResolved(new Set(resolvedIds));
    } catch {
      setError('Failed to load revision items. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleToggle = async (item) => {
    const newResolved = new Set(resolved);
    const wasResolved = resolved.has(item.id);
    if (wasResolved) {
      newResolved.delete(item.id);
    } else {
      newResolved.add(item.id);
    }
    setResolved(newResolved);
    try {
      setSaving(item.id);
      await analyticsAPI.resolveRevisionItems([item.id]);
    } catch {
      // revert optimistic update on failure
      setResolved(resolved);
    } finally {
      setSaving(null);
    }
  };

  const counts = {
    all:     items.length,
    high:    items.filter(i => i.priority === 'high').length,
    medium:  items.filter(i => i.priority === 'medium').length,
    low:     items.filter(i => i.priority === 'low').length,
    pending: items.filter(i => !resolved.has(i.id)).length,
    done:    items.filter(i => resolved.has(i.id)).length,
  };

  const filtered = items.filter(i => {
    if (filter === 'pending') return !resolved.has(i.id);
    if (filter === 'done')    return resolved.has(i.id);
    if (filter === 'high')    return i.priority === 'high';
    if (filter === 'medium')  return i.priority === 'medium';
    if (filter === 'low')     return i.priority === 'low';
    return true;
  });

  const progressPct = counts.all > 0 ? Math.round((counts.done / counts.all) * 100) : 0;

  return (
    <div className="page">

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg,#0a1f14 0%,#124D2A 60%,#2E8857 100%)',
        borderRadius: 18, padding: '1.5rem 2rem', marginBottom: '1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', margin: '0 0 4px' }}>
            Revision Mode
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', margin: 0 }}>
            Focus on what matters most — clear every item before your exam
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          {[
            { label: 'To Review', value: counts.pending, color: '#fde68a' },
            { label: 'Done',      value: counts.done,    color: '#86efac' },
            { label: 'Total',     value: counts.all,     color: '#a5b4fc' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 9, padding: '0.375rem 0.875rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
            </div>
          ))}
          <button onClick={fetchItems} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 9, padding: '0.45rem 0.75rem', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center',
          }}><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* Progress bar */}
      {counts.all > 0 && (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
          padding: '1.125rem 1.375rem', marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
              Revision Progress
            </span>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: progressPct >= 80 ? '#16a34a' : progressPct >= 40 ? '#d97706' : '#dc2626' }}>
              {progressPct}%
            </span>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: 999, height: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              background: progressPct >= 80
                ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                : progressPct >= 40
                  ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                  : 'linear-gradient(90deg,#f87171,#dc2626)',
              width: `${progressPct}%`, transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{counts.done} completed</span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{counts.pending} remaining</span>
          </div>
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {[
          { id: 'all',     label: 'All',        count: counts.all     },
          { id: 'pending', label: 'To Review',  count: counts.pending, color: '#d97706' },
          { id: 'high',    label: 'High',       count: counts.high,    color: '#dc2626' },
          { id: 'medium',  label: 'Medium',     count: counts.medium,  color: '#d97706' },
          { id: 'low',     label: 'Low',        count: counts.low,     color: '#2563eb' },
          { id: 'done',    label: 'Completed',  count: counts.done,    color: '#16a34a' },
        ].map(f => {
          const active = filter === f.id;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              flexShrink: 0, padding: '5px 14px', borderRadius: 20,
              border: active ? 'none' : '1.5px solid #e2e8f0',
              background: active ? (f.color || '#2E8857') : '#fff',
              color: active ? '#fff' : '#64748b',
              fontWeight: active ? 700 : 500, fontSize: '0.78rem', cursor: 'pointer',
            }}>
              {f.label}
              {f.count > 0 && (
                <span style={{
                  marginLeft: 5,
                  background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: active ? '#fff' : '#94a3b8',
                  borderRadius: 999, padding: '0 6px', fontSize: '0.68rem', fontWeight: 700,
                }}>{f.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Items */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
          padding: '4rem', textAlign: 'center',
        }}>
          {counts.all === 0 ? (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.25rem',
                background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BookOpen size={28} color="#2E8857" />
              </div>
              <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                No revision items yet
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Revision items are generated from your evaluation mistakes. Upload and evaluate answer scripts to populate this list.
              </p>
              <Link to="/upload" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '0.625rem 1.5rem', borderRadius: 10,
                background: 'linear-gradient(135deg,#2E8857,#16a34a)',
                color: '#fff', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
              }}>
                <Upload size={16} /> Upload Answer Script
              </Link>
            </>
          ) : (
            <>
              <CheckCircle2 size={44} color="#22c55e" style={{ marginBottom: 12, opacity: 0.7 }} />
              <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                {filter === 'done' ? 'No completed items yet' : 'All caught up!'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                {filter === 'pending' ? "You've cleared all revision items. Keep it up!" : 'Try a different filter.'}
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {filtered.map(item => {
            const isResolved = resolved.has(item.id);
            const pm = PRIORITY_META[item.priority] || PRIORITY_META.medium;
            return (
              <div key={item.id} style={{
                background: isResolved ? '#f8fafc' : '#fff',
                border: `1.5px solid ${isResolved ? '#e2e8f0' : pm.border}`,
                borderRadius: 14, padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                transition: 'all 0.2s',
                opacity: isResolved ? 0.65 : 1,
              }}>
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(item)}
                  disabled={saving === item.id}
                  style={{
                    width: 24, height: 24, borderRadius: 8, flexShrink: 0, marginTop: 2,
                    border: `2px solid ${isResolved ? '#2E8857' : pm.color}`,
                    background: isResolved ? '#2E8857' : '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  {isResolved && <CheckCircle2 size={14} color="#fff" />}
                  {saving === item.id && <RotateCcw size={12} color={pm.color} style={{ animation: 'spin 0.7s linear infinite' }} />}
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                    <PriorityBadge priority={item.priority} />
                    {item.occurrence_count > 1 && (
                      <span style={{
                        background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
                        borderRadius: 20, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700,
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                      }}>
                        <Flame size={10} /> Appeared {item.occurrence_count}×
                      </span>
                    )}
                    {item.subject_name && (
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{item.subject_name}</span>
                    )}
                  </div>

                  <p style={{
                    fontWeight: 700, fontSize: '0.875rem', color: isResolved ? '#94a3b8' : '#0f172a',
                    margin: '0 0 0.375rem', lineHeight: 1.55,
                    textDecoration: isResolved ? 'line-through' : 'none',
                  }}>
                    {item.title}
                  </p>

                  {item.description && !isResolved && (
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 0.375rem', lineHeight: 1.55 }}>
                      {item.description}
                    </p>
                  )}

                  {item.chapter && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>
                      <BookOpen size={10} /> {item.chapter}
                    </div>
                  )}
                </div>

                {/* Right: occurrence count */}
                {!isResolved && item.occurrence_count >= 1 && (
                  <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 42 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: pm.color }}>{item.occurrence_count}</div>
                    <div style={{ fontSize: '0.58rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>times</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      {filtered.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>
          Check off items as you revise them — progress is saved automatically
        </p>
      )}
    </div>
  );
}
