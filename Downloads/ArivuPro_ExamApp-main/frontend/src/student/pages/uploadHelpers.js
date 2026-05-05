/**
 * Upload & AI Feedback — shared utilities, API calls, sub-components
 */
import React, { useState, useRef } from 'react';

// ── Constants ────────────────────────────────────────────────────────────
export const LS_QUOTA = 'sc_quota';
export const LS_FAC_REQUESTS = 'fac_eval_requests';
export const LS_FAC_RESPONSES = 'fac_eval_responses';
export const FREE_LIMIT = 2;
export const MAX_SCRIPT_SIZE = 3 * 1024 * 1024;

const Icons = {
  Bot: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="7" rx="2"/><path d="M12 7V3"/><path d="M9 3h6"/><path d="M9 13v.01"/><path d="M15 13v.01"/><path d="M10 17h4"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  MessageSquare: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Alert: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  X: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ── Utilities ────────────────────────────────────────────────────────────
export function lsGet(key, fb) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fb; } catch { return fb; }
}
export function lsSet(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { alert('Browser storage full.'); }
}
export function fmtSz(b) {
  if (b < 1024) return b + 'B';
  if (b < 1048576) return Math.round(b / 1024) + 'KB';
  return (b / 1048576).toFixed(1) + 'MB';
}
export function calcGrade(pct) {
  if (pct >= 85) return 'A+'; if (pct >= 75) return 'A'; if (pct >= 65) return 'B+';
  if (pct >= 55) return 'B';  if (pct >= 45) return 'C'; if (pct >= 35) return 'D';
  return 'F';
}
export function validateScriptFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const isPdf  = file.type === 'application/pdf' || ext === 'pdf';
  const isDocx = file.type.includes('wordprocessingml') || ext === 'docx';
  if (!isPdf && !isDocx) return 'Only PDF and DOCX files are accepted.';
  if (file.size > MAX_SCRIPT_SIZE) return `File too large (${fmtSz(file.size)}). Maximum is 3MB.`;
  return null;
}

// ── Backend evaluation result mapper ────────────────────────────────────
// Converts Django backend EvaluationSerializer format to the ResultCard format.
export function mapBackendEvaluation(ev, paper, studentName) {
  const rawTotal = parseFloat(ev.total_marks_obtained) || 0;
  const rawMax   = parseFloat(ev.total_marks_possible) || 0;
  const rawPct   = ev.percentage != null && !isNaN(parseFloat(ev.percentage))
    ? parseFloat(ev.percentage)
    : (rawMax > 0 ? (rawTotal / rawMax) * 100 : 0);
  const pct   = Math.round(rawPct * 10) / 10;
  const grade = calcGrade(pct);

  const questions = (ev.question_evaluations || []).map((qe, i) => ({
    qNo: qe.question_number || (i + 1),
    questionSummary: (qe.question_text || `Question ${i + 1}`).slice(0, 70),
    marksAwarded: parseFloat(qe.marks_obtained) || 0,
    maxMarks: parseFloat(qe.marks_possible) || 0,
    feedback: qe.feedback || '',
    strengths: [],
    improvements: Array.isArray(qe.missing_points) ? qe.missing_points : [],
  }));

  return {
    totalMarks: rawTotal,
    maxMarks: rawMax,
    percentage: pct,
    grade,
    overallFeedback: ev.overall_feedback || '',
    questions,
    strengths: Array.isArray(ev.strengths) ? ev.strengths : [],
    improvements: Array.isArray(ev.areas_to_improve) ? ev.areas_to_improve : [],
    paperName: paper?.title || ev.exam_paper_title || '',
    paperSubject: paper?.subject_name || ev.subject_name || '',
    studentName: studentName || ev.student_name || '',
  };
}

// ── Download feedback as PDF ─────────────────────────────────────────────
export function downloadFeedbackPDF(result, paper, studentName) {
  const date  = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const pct   = result.percentage || Math.round((result.totalMarks / result.maxMarks) * 100);
  const grade = result.grade || calcGrade(pct);
  const title = paper?.title || result.paperName || 'Exam Paper';
  const subj  = paper?.subject_name || result.paperSubject || '';

  const qsHtml = (result.questions || []).map((q, i) => `
    <div class="q-block">
      <div class="q-head">
        <div class="q-label">Q${q.qNo || i + 1}: ${q.questionSummary || 'Question ' + (i + 1)}</div>
        <div class="q-marks">${q.marksAwarded} / ${q.maxMarks || '?'} marks</div>
      </div>
      <p class="fb">${q.feedback || ''}</p>
      ${(q.strengths || []).length ? `<div class="tags-row"><label>Strengths</label>${(q.strengths || []).map(s => `<span class="tag tag-s">${s}</span>`).join('')}</div>` : ''}
      ${(q.improvements || []).length ? `<div class="tags-row"><label>Areas to Improve</label>${(q.improvements || []).map(s => `<span class="tag tag-i">${s}</span>`).join('')}</div>` : ''}
    </div>`).join('');

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>AI Feedback – ${studentName}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111;background:#fff;padding:32px}.hdr{background:linear-gradient(135deg,#166534,#38986c);color:#fff;border-radius:10px;padding:22px 26px;margin-bottom:24px}.hdr h1{font-size:18px;margin-bottom:3px}.hdr p{font-size:11px;opacity:.75;margin-bottom:14px}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px}.meta-item label{font-size:10px;text-transform:uppercase;opacity:.65;display:block;margin-bottom:2px}.meta-item div{font-weight:700}.prog{background:rgba(255,255,255,.2);border-radius:4px;height:5px;margin-top:14px}.prog-fill{height:100%;background:#fff;border-radius:4px}h2{font-size:15px;color:#166534;margin:0 0 12px}.q-block{border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:10px}.q-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:12px}.q-label{font-weight:700;font-size:13px}.q-marks{background:#f0fdf4;color:#166534;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:700;flex-shrink:0}.fb{font-size:13px;line-height:1.65;color:#374151}.tags-row{margin-top:8px}.tags-row label{font-size:10px;text-transform:uppercase;color:#6b7280;font-weight:600;display:block;margin-bottom:4px}.tag{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:500;margin:2px 4px 2px 0}.tag-s{background:#dcfce7;color:#166534}.tag-i{background:#fef9c3;color:#854d0e}.overall{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-top:16px}.overall h3{font-size:13px;color:#166534;margin-bottom:6px;font-weight:700}.overall p{font-size:13px;line-height:1.65;color:#374151}.footer{text-align:center;color:#9ca3af;font-size:10px;margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb}@page{margin:16mm}@media print{body{padding:0}.hdr{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
</head><body>
<div class="hdr"><h1>AI Script Evaluation Report</h1><p>ArivuPro &bull; ${date}</p>
<div class="meta"><div class="meta-item"><label>Student</label><div>${studentName}</div></div><div class="meta-item"><label>Paper</label><div>${title}</div></div>${subj ? `<div class="meta-item"><label>Subject</label><div>${subj}</div></div>` : ''}<div class="meta-item"><label>Score</label><div>${result.totalMarks} / ${result.maxMarks} (${pct}%)</div></div><div class="meta-item"><label>Grade</label><div>${grade}</div></div></div>
<div class="prog"><div class="prog-fill" style="width:${Math.min(pct,100)}%"></div></div></div>
<h2>Question-by-Question Breakdown</h2>${qsHtml}
${result.overallFeedback ? `<div class="overall"><h3>Overall AI Feedback</h3><p>${result.overallFeedback}</p></div>` : ''}
<div class="footer">Generated by ArivuPro AI Script Corrector &bull; ${date}</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `ArivuPro-Feedback-${(studentName || 'Student').replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── ResultCard Component ─────────────────────────────────────────────────
export function ResultCard({ result, type }) {
  const [open, setOpen] = useState({});
  const rawPct = result.percentage != null && !isNaN(result.percentage)
    ? result.percentage
    : (result.maxMarks > 0 ? (result.totalMarks / result.maxMarks) * 100 : 0);
  const pct   = isNaN(rawPct) ? 0 : Math.round(rawPct * 10) / 10;
  const grade = result.grade || calcGrade(pct);
  const hdrCls = pct >= 70 ? 'sc-rhdr-green' : pct >= 50 ? 'sc-rhdr-amber' : 'sc-rhdr-red';
  const qCls = (m, mx) => {
    if (!mx) return 'sc-qs-low';
    const r = m / mx;
    return r >= 1 ? 'sc-qs-full' : r >= 0.5 ? 'sc-qs-part' : 'sc-qs-low';
  };

  return (
    <div>
      <div className={`sc-rhdr ${hdrCls}`}>
        {result.paperName && <div className="sc-rhdr-title">{result.paperName}</div>}
        {(result.paperSubject || result.studentName) && (
          <div className="sc-rhdr-meta">{[result.paperSubject, result.studentName].filter(Boolean).join(' • ')}</div>
        )}
        <div className="sc-status-chip" style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
          {type === 'preliminary' ? <><Icons.Bot /> AI Preliminary Score</> : type === 'validated' ? <><Icons.Check /> Faculty Validated</> : <><Icons.Clock /> Pending</>}
        </div>
        <div className="sc-score-row">
          <span className="sc-score-num">{result.totalMarks}</span>
          <span className="sc-score-denom">/ {result.maxMarks > 0 ? result.maxMarks : '—'}</span>
          <span className="sc-score-pct">{result.maxMarks > 0 ? pct + '%' : '—'}</span>
          <span className="sc-score-grade">Grade {result.maxMarks > 0 ? grade : '—'}</span>
        </div>
        <div className="sc-prog">
          <div className="sc-prog-fill" style={{ width: Math.min(pct, 100) + '%' }} />
        </div>
      </div>

      {/* Overall AI feedback */}
      {result.overallFeedback && (
        <div className="sc-ofb" style={{ marginBottom: '1rem' }}>
          <div className="sc-ofb-title" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icons.MessageSquare /> {type === 'validated' ? 'Faculty' : 'AI'} Feedback</div>
          <p className="sc-ofb-text">{result.overallFeedback}</p>
        </div>
      )}

      {/* Strengths & Improvements (top-level) */}
      {((result.strengths || []).length > 0 || (result.improvements || []).length > 0) && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header"><h3 className="card-title">Overall Analysis</h3></div>
          {(result.strengths || []).length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '0.375rem' }}>Strengths</div>
              <div className="sc-tags">{result.strengths.map((s, j) => <span key={j} className="sc-tag sc-tag-s">{s}</span>)}</div>
            </div>
          )}
          {(result.improvements || []).length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '0.375rem' }}>Areas to Improve</div>
              <div className="sc-tags">{result.improvements.map((s, j) => <span key={j} className="sc-tag sc-tag-i">{s}</span>)}</div>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <h3 className="card-title">Question Breakdown</h3>
        </div>
        {(result.questions || []).length === 0 && (
          <p style={{ color: 'var(--text-light)', padding: '1rem 0', textAlign: 'center', fontSize: '0.875rem' }}>No per-question breakdown available.</p>
        )}
        {(result.questions || []).map((q, i) => {
          const strs = Array.isArray(q.strengths) ? q.strengths : (q.strengths ? [q.strengths] : []);
          const imps = Array.isArray(q.improvements) ? q.improvements : (q.improvements ? [q.improvements] : []);
          return (
            <div key={i} className="sc-qcard">
              <div className="sc-qcard-hdr" onClick={() => setOpen(p => ({ ...p, [i]: !p[i] }))}>
                <span className="sc-qcard-label">Q{q.qNo || i + 1}: {q.questionSummary || `Question ${i + 1}`}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <span className={`sc-qs ${qCls(q.marksAwarded, q.maxMarks)}`}>{q.marksAwarded} / {q.maxMarks || '?'}</span>
                  <span className="sc-chev">{open[i] ? '▲' : '▼'}</span>
                </div>
              </div>
              {open[i] && (
                <div className="sc-qcard-body">
                  {q.feedback && (<div className="sc-fb-item"><div className="sc-fb-label">Feedback</div><div className="sc-fb-text">{q.feedback}</div></div>)}
                  {strs.length > 0 && (<div className="sc-fb-item"><div className="sc-fb-label">Strengths</div><div className="sc-tags">{strs.map((s, j) => <span key={j} className="sc-tag sc-tag-s">{s}</span>)}</div></div>)}
                  {imps.length > 0 && (<div className="sc-fb-item"><div className="sc-fb-label">Areas to Improve</div><div className="sc-tags">{imps.map((s, j) => <span key={j} className="sc-tag sc-tag-i">{s}</span>)}</div></div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── FileDropzone Component ───────────────────────────────────────────────
export function FileDropzone({ files, onAdd, onRemove, hint, accept }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();
  return (
    <>
      <div
        className={`sc-uzone ${drag ? 'drag' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); onAdd(Array.from(e.dataTransfer.files)); }}
      >
        <div className="sc-uzone-icon">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 3v11M6 8l5-5 5 5" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 16v1a2 2 0 002 2h12a2 2 0 002-2v-1" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="sc-uzone-title">Click or drag &amp; drop</div>
        <div className="sc-uzone-sub">{accept || 'PDF, JPG, PNG, WEBP · Multiple pages supported'}</div>
        {hint && <div className="sc-tip" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}><Icons.Alert /> {hint}</div>}
      </div>
      <input
        ref={inputRef} type="file"
        accept={accept ? '.pdf,.docx' : '.pdf,.jpg,.jpeg,.png,.webp'} multiple style={{ display: 'none' }}
        onChange={e => { onAdd(Array.from(e.target.files)); e.target.value = ''; }}
      />
      {files.length > 0 && (
        <div className="sc-flist">
          {files.map((f, i) => {
            const isPdf = f.type === 'application/pdf' || f.name.endsWith('.pdf');
            const isDocx = f.name.endsWith('.docx');
            const badge = isPdf ? 'sc-fi-pdf' : isDocx ? 'sc-fi-docx' : 'sc-fi-img';
            const label = isPdf ? 'PDF' : isDocx ? 'DOCX' : 'IMG';
            return (
              <div key={i} className="sc-fi-row">
                <span className={`sc-fi-badge ${badge}`}>{label}</span>
                <span className="sc-fi-name">{f.name}</span>
                <span className="sc-fi-sz">{fmtSz(f.size)}</span>
                <button className="btn btn-sm btn-secondary" style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem', display: 'flex' }} onClick={() => onRemove(i)}><Icons.X /></button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
