/**
 * Faculty Evaluation Requests — Admin page
 * Shows student requests for human review of AI-graded scripts.
 */
import React, { useState, useEffect } from 'react';
import '../styles/AdminPages.css';

const Icons = {
  ClipboardList: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>,
  ClipboardListLarge: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

const LS_FAC_REQUESTS = 'fac_eval_requests';
const LS_FAC_RESPONSES = 'fac_eval_responses';

function lsGet(key, fb) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fb; } catch { return fb; }
}
function lsSet(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* */ }
}
function calcGrade(pct) {
  if (pct >= 85) return 'A+'; if (pct >= 75) return 'A'; if (pct >= 65) return 'B+';
  if (pct >= 55) return 'B';  if (pct >= 45) return 'C'; if (pct >= 35) return 'D';
  return 'F';
}

export default function FacultyEvalRequests() {
  const [requests, setRequests] = useState([]);
  const [responses, setResponses] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedReq, setSelectedReq] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [grade, setGrade] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');
  const [openQuestions, setOpenQuestions] = useState({});

  useEffect(() => {
    setRequests(lsGet(LS_FAC_REQUESTS, []));
    setResponses(lsGet(LS_FAC_RESPONSES, []));
  }, []);

  const getResponse = (reqId) => responses.find(r => r.requestId === reqId);

  const filtered = requests.filter(r => {
    if (activeFilter === 'pending') return !getResponse(r.id);
    if (activeFilter === 'responded') return !!getResponse(r.id);
    return true;
  }).sort((a, b) => b.submittedAt - a.submittedAt);

  const pendingCount = requests.filter(r => !getResponse(r.id)).length;

  const openReview = (req) => {
    setSelectedReq(req);
    const existing = getResponse(req.id);
    setRemarks(existing?.remarks || '');
    setGrade(existing?.grade || '');
    setSubmitMsg('');
    setOpenQuestions({});
  };

  const submitResponse = () => {
    if (!selectedReq) return;
    if (!remarks.trim()) { setSubmitMsg('Please enter your remarks.'); return; }
    const response = {
      id: Date.now().toString(),
      requestId: selectedReq.id,
      facultyName: 'Faculty',
      grade: grade.trim(),
      remarks: remarks.trim(),
      submittedAt: Date.now(),
    };
    const updated = [...responses.filter(r => r.requestId !== selectedReq.id), response];
    setResponses(updated);
    lsSet(LS_FAC_RESPONSES, updated);
    // Update request status
    const updReqs = requests.map(r => r.id === selectedReq.id ? { ...r, status: 'responded' } : r);
    setRequests(updReqs);
    lsSet(LS_FAC_REQUESTS, updReqs);
    setSubmitMsg('Response submitted successfully!');
    setTimeout(() => setSelectedReq(null), 1500);
  };

  const qCls = (m, mx) => {
    if (!mx) return 'sc-qs-low';
    const r = m / mx;
    return r >= 1 ? 'sc-qs-full' : r >= 0.5 ? 'sc-qs-part' : 'sc-qs-low';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Icons.ClipboardList /> Faculty Evaluation Requests</h1>
          <p className="subtitle">Review student scripts and provide expert feedback</p>
        </div>
        {pendingCount > 0 && (
          <span className="badge badge-amber" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}>
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs" style={{ marginBottom: '1.5rem' }}>
        {[
          { key: 'all', label: `All (${requests.length})` },
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'responded', label: `Responded (${requests.length - pendingCount})` },
        ].map(t => (
          <button key={t.key} className={`filter-tab ${activeFilter === t.key ? 'active' : ''}`} onClick={() => setActiveFilter(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Requests table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-lighter)' }}>
          <div style={{ marginBottom: '0.75rem' }}><Icons.ClipboardListLarge /></div>
          <div style={{ fontSize: '0.875rem' }}>
            {activeFilter === 'pending' ? 'No pending requests' : 'No faculty evaluation requests yet'}
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Paper</th>
                <th>AI Score</th>
                <th>Faculty</th>
                <th>Date Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => {
                const resp = getResponse(req.id);
                const pct = req.aiResult ? Math.round((req.aiResult.totalMarks / req.aiResult.maxMarks) * 100) : 0;
                return (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 500 }}>
                      <div>{req.studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-lighter)' }}>{req.studentEmail || 'No Email'}</div>
                    </td>
                    <td>
                      <div>{req.paperName}</div>
                      {req.paperSubject && <div style={{ fontSize: '0.75rem', color: 'var(--text-lighter)' }}>{req.paperSubject}</div>}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {req.aiResult ? `${req.aiResult.totalMarks}/${req.aiResult.maxMarks} (${pct}%)` : 'N/A'}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>{resp?.facultyName || req.assignedFaculty || 'Unassigned'}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                      {new Date(req.submittedAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${resp ? 'badge-green' : 'badge-amber'}`}>
                        {resp ? 'Responded' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => openReview(req)}>
                        {resp ? 'View / Edit' : 'Review'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedReq && (
        <div className="modal-overlay" onClick={() => setSelectedReq(null)}>
          <div className="modal-content" style={{ maxWidth: 780 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Review: {selectedReq.studentName}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                  Student: {selectedReq.studentEmail || 'No Email'} · Paper: {selectedReq.paperName}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                  Assigned Faculty: {getResponse(selectedReq.id)?.facultyName || selectedReq.assignedFaculty || 'Unassigned'}
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedReq(null)}>✕ Close</button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {/* AI Score Summary */}
              {selectedReq.aiResult && (
                <div style={{ background: 'linear-gradient(135deg, #166534, #38986c)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', color: '#fff', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>AI Preliminary Score</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 700 }}>{selectedReq.aiResult.totalMarks}</span>
                    <span style={{ opacity: 0.7 }}>/ {selectedReq.aiResult.maxMarks}</span>
                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius)', fontWeight: 700 }}>
                      {selectedReq.aiResult.percentage || Math.round((selectedReq.aiResult.totalMarks / selectedReq.aiResult.maxMarks) * 100)}%
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius)', fontWeight: 700 }}>
                      Grade {selectedReq.aiResult.grade || calcGrade(selectedReq.aiResult.percentage || 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Question breakdown */}
              {selectedReq.aiResult && (selectedReq.aiResult.questions || []).map((q, i) => (
                <div key={i} style={{ background: 'var(--border-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setOpenQuestions(p => ({ ...p, [i]: !p[i] }))}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Q{q.qNo || i + 1}: {q.questionSummary || `Question ${i + 1}`}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`sc-qs ${qCls(q.marksAwarded, q.maxMarks)}`} style={{ fontWeight: 700, fontSize: '0.8rem', padding: '3px 10px', borderRadius: '20px' }}>
                        {q.marksAwarded} / {q.maxMarks || '?'}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-lighter)' }}>{openQuestions[i] ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {openQuestions[i] && (
                    <div style={{ marginTop: '0.625rem', paddingTop: '0.625rem', borderTop: '1px solid var(--border)' }}>
                      {q.feedback && <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', lineHeight: 1.65, marginBottom: '0.5rem' }}>{q.feedback}</p>}
                      {(q.strengths || []).length > 0 && (
                        <div style={{ marginBottom: '0.375rem' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Strengths</div>
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>{q.strengths.map((s, j) => <span key={j} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: '#dcfce7', color: '#166534' }}>{s}</span>)}</div>
                        </div>
                      )}
                      {(q.improvements || []).length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Areas to Improve</div>
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>{q.improvements.map((s, j) => <span key={j} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: '#fef9c3', color: '#854d0e' }}>{s}</span>)}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Overall AI feedback */}
              {selectedReq.aiResult?.overallFeedback && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius)', padding: '0.875rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.8rem', marginBottom: '0.375rem' }}>AI Overall Feedback</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', lineHeight: 1.65 }}>{selectedReq.aiResult.overallFeedback}</p>
                </div>
              )}

              {/* Faculty input */}
              <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#7c3aed', marginBottom: '0.875rem' }}>Faculty Remarks</h3>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Grade (Optional)</label>
                  <input className="form-input" value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g. A, B+, 78%" style={{ maxWidth: '200px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks *</label>
                  <textarea className="form-textarea" rows="4" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Provide detailed feedback, corrections, and guidance for the student..." />
                </div>
              </div>

              {submitMsg && (
                <div style={{ background: submitMsg.includes('success') ? '#dcfce7' : '#fee2e2', border: '1px solid ' + (submitMsg.includes('success') ? '#86efac' : '#fca5a5'), borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.875rem', color: submitMsg.includes('success') ? '#166534' : '#991b1b', marginTop: '0.75rem' }}>
                  {submitMsg}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedReq(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#7c3aed', borderColor: '#7c3aed', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={submitResponse}>
                <Icons.Check /> Submit Faculty Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
