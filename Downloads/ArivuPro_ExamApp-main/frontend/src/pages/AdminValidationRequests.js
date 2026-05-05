import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck, Clock, CheckCircle2, Mail, Phone,
  FileText, ExternalLink, RefreshCw, Filter, User,
  Edit2, GraduationCap,
} from 'lucide-react';
import { validationAPI } from '../services/api';

const STATUS_COLORS = {
  pending:  { bg: '#fef3c7', color: '#d97706', border: '#fde68a', label: 'Pending' },
  reviewed: { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0', label: 'Reviewed' },
};

function Badge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700,
    }}>{c.label}</span>
  );
}

export default function AdminValidationRequests() {
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [expanded, setExpanded]     = useState(null);
  const [editMode, setEditMode]     = useState({});    // { [id]: true }
  const [formMap, setFormMap]       = useState({});    // { [id]: { faculty_name, admin_remarks } }
  const [submitting, setSubmitting] = useState(null);

  const getForm = (req) => formMap[req.id] || {
    faculty_name:  req.faculty_name  || '',
    admin_remarks: req.admin_remarks || '',
  };
  const setForm = (id, patch) =>
    setFormMap(prev => ({ ...prev, [id]: { ...getForm({ id, ...patch }), ...patch } }));

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await validationAPI.list(params);
      setRequests(Array.isArray(data) ? data : data?.results || []);
    } catch (e) {
      console.error('Failed to load validation requests:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleMarkReviewed = async (req) => {
    const form = getForm(req);
    try {
      setSubmitting(req.id);
      await validationAPI.markReviewed(req.id, form.faculty_name, form.admin_remarks);
      await fetchRequests();
      setEditMode(prev => ({ ...prev, [req.id]: false }));
    } catch (e) {
      console.error('Failed to mark reviewed:', e);
    } finally {
      setSubmitting(null);
    }
  };

  const handleUpdateReview = async (req) => {
    const form = getForm(req);
    try {
      setSubmitting(req.id);
      await validationAPI.updateReview(req.id, form.faculty_name, form.admin_remarks);
      await fetchRequests();
      setEditMode(prev => ({ ...prev, [req.id]: false }));
    } catch (e) {
      console.error('Failed to update review:', e);
    } finally {
      setSubmitting(null);
    }
  };

  const pending  = requests.filter(r => r.status === 'pending').length;
  const reviewed = requests.filter(r => r.status === 'reviewed').length;

  return (
    <div className="page">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)',
        borderRadius: 20, padding: '1.75rem 2rem', marginBottom: '1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: 4 }}>
            <UserCheck size={20} color="#a5b4fc" />
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.2rem', margin: 0 }}>
              Faculty Validation Queue
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: 0 }}>
            Review AI evaluations requested by students for manual validation
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {[
            { label: 'Pending',  count: pending,  color: '#fde68a' },
            { label: 'Reviewed', count: reviewed, color: '#86efac' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 10, padding: '0.5rem 1rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        marginBottom: '1.25rem', flexWrap: 'wrap',
      }}>
        <Filter size={14} color="#64748b" />
        {['all', 'pending', 'reviewed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.35rem 1rem', borderRadius: 20, border: 'none',
              background: filter === f ? '#4f46e5' : '#f1f5f9',
              color: filter === f ? '#fff' : '#64748b',
              fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >{f}</button>
        ))}
        <button onClick={fetchRequests} style={{
          marginLeft: 'auto', padding: '0.35rem 0.75rem', borderRadius: 8,
          border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: '0.78rem',
        }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          <div className="spinner" />
        </div>
      ) : requests.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
          padding: '3rem', textAlign: 'center', color: '#94a3b8',
        }}>
          <UserCheck size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>No validation requests</p>
          <p style={{ fontSize: '0.8rem' }}>Students who request faculty review will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {requests.map(req => (
            <div key={req.id} style={{
              background: '#fff', border: `1.5px solid ${expanded === req.id ? '#6366f1' : '#e2e8f0'}`,
              borderRadius: 14,
              boxShadow: expanded === req.id ? '0 0 0 3px #eef2ff' : 'none',
              transition: 'all 0.15s',
            }}>
              {/* Row */}
              <div
                style={{
                  padding: '1rem 1.25rem', display: 'flex',
                  alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                  cursor: 'pointer',
                }}
                onClick={() => setExpanded(expanded === req.id ? null : req.id)}
              >
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 900, color: '#fff',
                }}>
                  {(req.student_name || req.student_username || '?')[0].toUpperCase()}
                </div>

                {/* Student info */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                    {req.student_name || req.student_username}
                  </div>
                  <div style={{ display: 'flex', gap: '0.875rem', marginTop: 3, flexWrap: 'wrap' }}>
                    {req.student_email && (
                      <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Mail size={11} /> {req.student_email}
                      </span>
                    )}
                    {req.student_phone && (
                      <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Phone size={11} /> {req.student_phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Paper & Score */}
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1e293b' }}>
                    {req.paper_title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                    {req.subject_name}
                  </div>
                  {req.ai_score && (
                    <div style={{
                      display: 'inline-block', marginTop: 4,
                      background: '#f1f5f9', borderRadius: 6, padding: '1px 8px',
                      fontSize: '0.7rem', fontWeight: 700, color: '#475569',
                    }}>AI: {req.ai_score}</div>
                  )}
                </div>

                {/* Date + Status */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <Badge status={req.status} />
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                    <Clock size={11} />
                    {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === req.id && (
                <div style={{
                  borderTop: '1px solid #f1f5f9', padding: '1.25rem',
                  background: '#fafafa', borderRadius: '0 0 12px 12px',
                }}>
                  {/* Student note */}
                  {req.note && (
                    <div style={{
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      padding: '0.875rem 1rem', marginBottom: '1rem',
                    }}>
                      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                        Student's Note
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: 1.6 }}>
                        {req.note}
                      </p>
                    </div>
                  )}

                  {/* Quick links */}
                  <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {req.answer_script_url && (
                      <a
                        href={req.answer_script_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '0.45rem 1rem', borderRadius: 8,
                          background: '#eff6ff', border: '1px solid #bfdbfe',
                          color: '#2563eb', fontWeight: 600, fontSize: '0.78rem',
                          textDecoration: 'none',
                        }}
                      >
                        <FileText size={13} /> View Answer Sheet <ExternalLink size={11} />
                      </a>
                    )}
                    <a
                      href={`/report/${req.submission_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '0.45rem 1rem', borderRadius: 8,
                        background: '#f5f3ff', border: '1px solid #ddd6fe',
                        color: '#7c3aed', fontWeight: 600, fontSize: '0.78rem',
                        textDecoration: 'none',
                      }}
                    >
                      <User size={13} /> View Full Report <ExternalLink size={11} />
                    </a>
                  </div>

                  {/* Review form — shown for pending OR when edit mode is on */}
                  {(req.status === 'pending' || editMode[req.id]) ? (
                    <div>
                      {/* Faculty Name */}
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                        <GraduationCap size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Faculty Name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Prof. Anita Sharma"
                        value={getForm(req).faculty_name}
                        onChange={e => setForm(req.id, { ...getForm(req), faculty_name: e.target.value })}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          border: '1px solid #e2e8f0', borderRadius: 8,
                          padding: '0.45rem 0.75rem', fontSize: '0.82rem',
                          fontFamily: 'inherit', marginBottom: '0.75rem', outline: 'none',
                        }}
                      />

                      {/* Remarks */}
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                        Remarks / Feedback <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Add feedback or notes for this validation..."
                        value={getForm(req).admin_remarks}
                        onChange={e => setForm(req.id, { ...getForm(req), admin_remarks: e.target.value })}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          border: '1px solid #e2e8f0', borderRadius: 8,
                          padding: '0.5rem 0.75rem', fontSize: '0.82rem',
                          fontFamily: 'inherit', resize: 'vertical',
                          marginBottom: '0.75rem', outline: 'none',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '0.625rem' }}>
                        <button
                          onClick={() => req.status === 'pending' ? handleMarkReviewed(req) : handleUpdateReview(req)}
                          disabled={submitting === req.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '0.55rem 1.25rem', borderRadius: 9, border: 'none',
                            background: submitting === req.id
                              ? '#e0e7ff'
                              : 'linear-gradient(135deg,#22c55e,#16a34a)',
                            color: submitting === req.id ? '#6366f1' : '#fff',
                            fontWeight: 700, fontSize: '0.82rem',
                            cursor: submitting === req.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <CheckCircle2 size={14} />
                          {submitting === req.id ? 'Saving…' : req.status === 'pending' ? 'Mark as Reviewed' : 'Save Changes'}
                        </button>
                        {editMode[req.id] && (
                          <button
                            onClick={() => setEditMode(prev => ({ ...prev, [req.id]: false }))}
                            style={{
                              padding: '0.55rem 1rem', borderRadius: 9,
                              border: '1px solid #e2e8f0', background: '#f8fafc',
                              color: '#64748b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Reviewed state — show details + Edit button */
                    <div style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0',
                      borderRadius: 10, padding: '0.875rem 1rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: 8 }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                          Reviewed
                        </p>
                        <button
                          onClick={() => {
                            setForm(req.id, { faculty_name: req.faculty_name || '', admin_remarks: req.admin_remarks || '' });
                            setEditMode(prev => ({ ...prev, [req.id]: true }));
                          }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', borderRadius: 6,
                            border: '1px solid #bbf7d0', background: '#fff',
                            color: '#16a34a', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer',
                          }}
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                      </div>
                      {req.faculty_name && (
                        <p style={{ fontSize: '0.8rem', color: '#166534', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <GraduationCap size={13} /> <strong>{req.faculty_name}</strong>
                        </p>
                      )}
                      <p style={{ fontSize: '0.8rem', color: '#166534', margin: 0, lineHeight: 1.6 }}>
                        {req.admin_remarks || 'No remarks added.'}
                      </p>
                      {req.reviewed_at && (
                        <p style={{ fontSize: '0.68rem', color: '#4ade80', margin: '6px 0 0' }}>
                          {new Date(req.reviewed_at).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
