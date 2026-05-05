import React, { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../styles/ScriptCorrector.css';

// ── Storage keys (staff local paper bank) ──────────────────────────────────
const LS_PAPERS = 'sc_papers';
const LS_SUBS   = 'sc_subs';
const LS_QUOTA  = 'sc_quota';
const FREE_LIMIT = 2;
const MAX_SCRIPT_SIZE = 3 * 1024 * 1024; // 3 MB

// ── Utilities ─────────────────────────────────────────────────────────────
function lsGet(key, fb) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fb; } catch { return fb; }
}
function lsSet(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { alert('Browser storage full — cannot save.'); }
}
function toB64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(',')[1]);
    r.onerror = () => rej(new Error('File read failed'));
    r.readAsDataURL(file);
  });
}
function fmtSz(b) {
  if (b < 1024) return b + 'B';
  if (b < 1048576) return Math.round(b / 1024) + 'KB';
  return (b / 1048576).toFixed(1) + 'MB';
}
function calcGrade(pct) {
  if (pct >= 85) return 'A+'; if (pct >= 75) return 'A'; if (pct >= 65) return 'B+';
  if (pct >= 55) return 'B';  if (pct >= 45) return 'C'; if (pct >= 35) return 'D';
  return 'F';
}
function relTime(ts) {
  const d = Date.now() - ts;
  if (d < 60000)    return 'Just now';
  if (d < 3600000)  return Math.round(d / 60000) + 'm ago';
  if (d < 86400000) return Math.round(d / 3600000) + 'h ago';
  return Math.round(d / 86400000) + 'd ago';
}

// Convert absolute backend URL to relative (goes through CRA proxy in dev)
function toRelPath(url) {
  if (!url) return null;
  try { const u = new URL(url); return u.pathname; } catch { return url; }
}

// Validate student script file — returns error string or null if valid
function validateScriptFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const isPdf  = file.type === 'application/pdf' || ext === 'pdf';
  const isDocx = file.type.includes('wordprocessingml') || ext === 'docx';
  if (!isPdf && !isDocx) {
    return 'Only PDF and DOCX files are accepted. Please convert your file and try again.';
  }
  if (file.size > MAX_SCRIPT_SIZE) {
    return `File too large (${fmtSz(file.size)}). Maximum size is 3MB. Compress at ilovepdf.com if needed.`;
  }
  return null;
}

// ── OpenRouter — staff (uses localStorage paper objects with .qp / .ans) ──
async function callGradingAPI(apiKey, paper, studentName, studentId, files) {
  const prompt =
    `You are a professional examiner for ${paper.subject}. ` +
    `PAPER: ${paper.name} | TOTAL MARKS: ${paper.totalMarks} | ` +
    `STUDENT: ${studentName}${studentId ? ' (ID: ' + studentId + ')' : ''}\n\n` +
    `Grade each question strictly against the marking scheme. Award partial credit where ` +
    `partial understanding is shown. Reference what the student actually wrote in feedback.\n\n` +
    `Return ONLY valid JSON (no markdown, no backticks):\n` +
    `{"questions":[{"qNo":1,"questionSummary":"5-word summary","marksAwarded":0,"maxMarks":0,` +
    `"feedback":"2-3 specific sentences","strengths":["one strength"],"improvements":["one gap"]}],` +
    `"totalMarks":0,"maxMarks":${paper.totalMarks},"percentage":0,"grade":"A",` +
    `"overallFeedback":"2-3 holistic sentences"}`;

  const content = [{ type: 'text', text: prompt }];
  if (paper.qp.dtype === 'pdf') {
    content.push({ type: 'file', file: { filename: 'qp.pdf', file_data: 'data:application/pdf;base64,' + paper.qp.data } });
  } else {
    content.push({ type: 'text', text: '═══ QUESTION PAPER ═══\n' + paper.qp.data });
  }
  if (paper.ans.dtype === 'pdf') {
    content.push({ type: 'file', file: { filename: 'answers.pdf', file_data: 'data:application/pdf;base64,' + paper.ans.data } });
  } else {
    content.push({ type: 'text', text: '═══ SUGGESTED ANSWERS ═══\n' + paper.ans.data });
  }
  content.push({ type: 'text', text: '═══ STUDENT ANSWER SCRIPT ═══' });
  for (let i = 0; i < files.length; i++) {
    const b64 = await toB64(files[i]);
    if (files[i].type === 'application/pdf') {
      content.push({ type: 'file', file: { filename: `script-${i + 1}.pdf`, file_data: 'data:application/pdf;base64,' + b64 } });
    } else {
      content.push({ type: 'image_url', image_url: { url: `data:${files[i].type};base64,${b64}` } });
    }
  }
  return _callOpenRouter(apiKey, content, paper.totalMarks);
}

// ── OpenRouter — student (uses backend paper detail with questions/marking_steps) ──
async function callGradingAPIBackend(apiKey, paperDetail, studentName, studentId, scriptFiles) {
  const questions = paperDetail.questions || [];

  let markingText = '';
  if (questions.length > 0) {
    markingText = '\n\nMARKING SCHEME:\n' + questions.map(q => {
      const steps = q.marking_steps || [];
      let s = `Q${q.question_number} [${q.marks} marks]: ${q.question_text}`;
      if (steps.length > 0) {
        s += '\n' + steps.map(st =>
          `  • Step ${st.step_number}: ${st.description}${st.ideal_answer_text ? ' — ' + st.ideal_answer_text : ''} [${st.marks}m]`
        ).join('\n');
      }
      return s;
    }).join('\n\n');
  }

  const prompt =
    `You are a professional examiner for ${paperDetail.subject_name || 'this subject'}. ` +
    `PAPER: ${paperDetail.title} | SESSION: ${paperDetail.exam_session || 'N/A'} | ` +
    `TOTAL MARKS: ${paperDetail.total_marks} | ` +
    `STUDENT: ${studentName}${studentId ? ' (ID: ' + studentId + ')' : ''}` +
    markingText +
    `\n\nGrade every answer strictly against the marking scheme above. Award partial credit ` +
    `where partial understanding is shown. Reference what the student actually wrote.\n\n` +
    `Return ONLY valid JSON (no markdown, no backticks):\n` +
    `{"questions":[{"qNo":1,"questionSummary":"5-word summary","marksAwarded":0,"maxMarks":0,` +
    `"feedback":"2-3 specific sentences","strengths":["one strength"],"improvements":["one gap"]}],` +
    `"totalMarks":0,"maxMarks":${paperDetail.total_marks},"percentage":0,"grade":"A",` +
    `"overallFeedback":"2-3 holistic sentences"}`;

  const content = [{ type: 'text', text: prompt }];

  // Attach question paper PDF via proxy (best-effort)
  if (paperDetail.question_paper_file) {
    try {
      const resp = await fetch(toRelPath(paperDetail.question_paper_file));
      if (resp.ok) {
        const blob = await resp.blob();
        const b64 = await toB64(new File([blob], 'qp.pdf', { type: blob.type }));
        content.push({ type: 'file', file: { filename: 'question_paper.pdf', file_data: 'data:application/pdf;base64,' + b64 } });
      }
    } catch { /* continue without QP file */ }
  }

  // Attach suggested answers PDF via proxy (best-effort)
  if (paperDetail.suggested_answer_file) {
    try {
      const resp = await fetch(toRelPath(paperDetail.suggested_answer_file));
      if (resp.ok) {
        const blob = await resp.blob();
        const b64 = await toB64(new File([blob], 'answers.pdf', { type: blob.type }));
        content.push({ type: 'file', file: { filename: 'suggested_answers.pdf', file_data: 'data:application/pdf;base64,' + b64 } });
      }
    } catch { /* continue without answer file */ }
  }

  // Attach student script files
  content.push({ type: 'text', text: '═══ STUDENT ANSWER SCRIPT ═══' });
  for (let i = 0; i < scriptFiles.length; i++) {
    const file = scriptFiles[i];
    const ext  = file.name.split('.').pop().toLowerCase();
    if (file.type === 'application/pdf' || ext === 'pdf') {
      const b64 = await toB64(file);
      content.push({ type: 'file', file: { filename: `script-${i + 1}.pdf`, file_data: 'data:application/pdf;base64,' + b64 } });
    } else {
      // DOCX — extract text with mammoth
      const mammoth = window.mammoth;
      if (!mammoth) throw new Error('DOCX processing unavailable. Please convert your file to PDF and retry.');
      const ab  = await file.arrayBuffer();
      const res = await mammoth.extractRawText({ arrayBuffer: ab });
      content.push({ type: 'text', text: `Student Script (page ${i + 1}):\n${res.value}` });
    }
  }

  return _callOpenRouter(apiKey, content, paperDetail.total_marks);
}

// ── Shared OpenRouter fetch ─────────────────────────────────────────────────
async function _callOpenRouter(apiKey, content, maxMarks) {
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
      'HTTP-Referer': 'https://arivupro.com',
      'X-OpenRouter-Title': 'ArivuPro Script Corrector',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    const msg = (e.error && e.error.message) || 'API error ' + resp.status;
    if (resp.status === 401) throw new Error('Invalid API key. Please contact your administrator.');
    if (resp.status === 402) throw new Error('OpenRouter credits exhausted. Top up at openrouter.ai/credits');
    if (resp.status === 429) throw new Error('Rate limit reached. Please wait a moment.');
    throw new Error(msg);
  }

  const data = await resp.json();
  if (data.error) throw new Error(data.error.message || 'OpenRouter error');
  if (!data.choices || !data.choices.length) throw new Error('No response from model. Try again.');

  let txt = data.choices[0].message?.content;
  if (!txt) throw new Error('Empty response from model.');
  if (Array.isArray(txt)) txt = txt.map(b => b.text || '').join('');

  const m = txt.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/);
  if (!m) throw new Error('AI did not return valid JSON. Response: ' + txt.slice(0, 200));
  return JSON.parse(m[0]);
}

// ── Download feedback as PDF (print window) ─────────────────────────────────
function downloadFeedbackPDF(result, paper, studentName) {
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
      ${(q.strengths || []).length ? `
        <div class="tags-row">
          <label>Strengths</label>
          ${(q.strengths || []).map(s => `<span class="tag tag-s">${s}</span>`).join('')}
        </div>` : ''}
      ${(q.improvements || []).length ? `
        <div class="tags-row">
          <label>Areas to Improve</label>
          ${(q.improvements || []).map(s => `<span class="tag tag-i">${s}</span>`).join('')}
        </div>` : ''}
    </div>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AI Feedback – ${studentName}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111;background:#fff;padding:32px}
  .hdr{background:linear-gradient(135deg,#166534,#38986c);color:#fff;border-radius:10px;padding:22px 26px;margin-bottom:24px}
  .hdr h1{font-size:18px;margin-bottom:3px}
  .hdr p{font-size:11px;opacity:.75;margin-bottom:14px}
  .meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px}
  .meta-item label{font-size:10px;text-transform:uppercase;opacity:.65;display:block;margin-bottom:2px}
  .meta-item div{font-weight:700}
  .prog{background:rgba(255,255,255,.2);border-radius:4px;height:5px;margin-top:14px}
  .prog-fill{height:100%;background:#fff;border-radius:4px}
  h2{font-size:15px;color:#166534;margin:0 0 12px}
  .q-block{border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:10px}
  .q-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:12px}
  .q-label{font-weight:700;font-size:13px}
  .q-marks{background:#f0fdf4;color:#166534;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:700;flex-shrink:0}
  .fb{font-size:13px;line-height:1.65;color:#374151}
  .tags-row{margin-top:8px}
  .tags-row label{font-size:10px;text-transform:uppercase;color:#6b7280;font-weight:600;display:block;margin-bottom:4px}
  .tag{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:500;margin:2px 4px 2px 0}
  .tag-s{background:#dcfce7;color:#166534}
  .tag-i{background:#fef9c3;color:#854d0e}
  .overall{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-top:16px}
  .overall h3{font-size:13px;color:#166534;margin-bottom:6px;font-weight:700}
  .overall p{font-size:13px;line-height:1.65;color:#374151}
  .footer{text-align:center;color:#9ca3af;font-size:10px;margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb}
  @page{margin:16mm}
  @media print{body{padding:0}.hdr{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="hdr">
  <h1>AI Script Evaluation Report</h1>
  <p>ArivuPro &bull; ${date}</p>
  <div class="meta">
    <div class="meta-item"><label>Student</label><div>${studentName}</div></div>
    <div class="meta-item"><label>Paper</label><div>${title}</div></div>
    ${subj ? `<div class="meta-item"><label>Subject</label><div>${subj}</div></div>` : ''}
    <div class="meta-item"><label>Score</label><div>${result.totalMarks} / ${result.maxMarks} (${pct}%)</div></div>
    <div class="meta-item"><label>Grade</label><div>${grade}</div></div>
  </div>
  <div class="prog"><div class="prog-fill" style="width:${Math.min(pct,100)}%"></div></div>
</div>
<h2>Question-by-Question Breakdown</h2>
${qsHtml}
${result.overallFeedback ? `
<div class="overall">
  <h3>Overall AI Feedback</h3>
  <p>${result.overallFeedback}</p>
</div>` : ''}
<div class="footer">Generated by ArivuPro AI Script Corrector &bull; ${date}</div>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) { alert('Please allow popups to download the feedback PDF.'); return; }
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

// ── ResultCard ────────────────────────────────────────────────────────────
function ResultCard({ result, type }) {
  const [open, setOpen] = useState({});
  const pct   = result.percentage || Math.round((result.totalMarks / result.maxMarks) * 100);
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
        {result.paperName    && <div className="sc-rhdr-title">{result.paperName}</div>}
        {(result.paperSubject || result.studentName) && (
          <div className="sc-rhdr-meta">{[result.paperSubject, result.studentName].filter(Boolean).join(' • ')}</div>
        )}
        <div className="sc-status-chip">
          {type === 'preliminary' ? '🤖 AI Preliminary Score' : type === 'validated' ? '✓ Faculty Validated' : '⏳ Pending'}
        </div>
        <div className="sc-score-row">
          <span className="sc-score-num">{result.totalMarks}</span>
          <span className="sc-score-denom">/ {result.maxMarks}</span>
          <span className="sc-score-pct">{pct}%</span>
          <span className="sc-score-grade">Grade {grade}</span>
        </div>
        <div className="sc-prog">
          <div className="sc-prog-fill" style={{ width: Math.min(pct, 100) + '%' }} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <h3 className="card-title">Question Breakdown</h3>
        </div>
        {(result.questions || []).map((q, i) => {
          const strs = Array.isArray(q.strengths)    ? q.strengths    : (q.strengths    ? [q.strengths]    : []);
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
                  {q.feedback && (
                    <div className="sc-fb-item">
                      <div className="sc-fb-label">Feedback</div>
                      <div className="sc-fb-text">{q.feedback}</div>
                    </div>
                  )}
                  {strs.length > 0 && (
                    <div className="sc-fb-item">
                      <div className="sc-fb-label">Strengths</div>
                      <div className="sc-tags">{strs.map((s, j) => <span key={j} className="sc-tag sc-tag-s">{s}</span>)}</div>
                    </div>
                  )}
                  {imps.length > 0 && (
                    <div className="sc-fb-item">
                      <div className="sc-fb-label">Areas to Improve</div>
                      <div className="sc-tags">{imps.map((s, j) => <span key={j} className="sc-tag sc-tag-i">{s}</span>)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {result.overallFeedback && (
        <div className="sc-ofb">
          <div className="sc-ofb-title">💬 {type === 'validated' ? 'Faculty' : 'AI'} Feedback</div>
          <p className="sc-ofb-text">{result.overallFeedback}</p>
        </div>
      )}
    </div>
  );
}

// ── FileDropzone ──────────────────────────────────────────────────────────
function FileDropzone({ files, onAdd, onRemove, hint, accept }) {
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
        {hint && <div className="sc-tip">⚠ {hint}</div>}
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
                <button className="btn btn-sm btn-secondary" style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }} onClick={() => onRemove(i)}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── DocZone (staff paper form — single file) ──────────────────────────────
function DocZone({ label, which, proc, form, onFile }) {
  const inputRef = useRef();
  const isPdf = form?.ft === 'pdf';
  return (
    <div>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.5rem' }}>{label}</p>
      <div
        className="sc-uzone"
        style={{ padding: '1.25rem 1rem' }}
        onClick={() => inputRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
      >
        <div className="sc-uzone-icon" style={{ background: which === 'qp' ? '#dbeafe' : '#dcfce7', width: 34, height: 34, borderRadius: 8 }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M4 2h9l4 4v12H4V2z" stroke={which === 'qp' ? 'var(--secondary)' : 'var(--primary)'} strokeWidth="1.5" fill="none"/>
            <path d="M13 2v4h4"           stroke={which === 'qp' ? 'var(--secondary)' : 'var(--primary)'} strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
        <div className="sc-uzone-title" style={{ fontSize: '0.8rem' }}>{label}</div>
        <div className="sc-uzone-sub">PDF or DOCX</div>
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = ''; }} />
      {proc === 'loading' && (
        <div className="sc-fprev">
          <div className="sc-fst sc-fst-l">
            <span className="sc-spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #bfdbfe', borderTopColor: 'var(--secondary)', borderRadius: '50%', animation: 'sc-spin 0.7s linear infinite', verticalAlign: 'middle', marginRight: 4 }} />
            Processing...
          </div>
        </div>
      )}
      {proc && proc.ok && form && (
        <div className="sc-fprev">
          <div className="sc-fpr">
            <span className={`sc-fi-badge ${isPdf ? 'sc-fi-pdf' : 'sc-fi-img'}`}>{(form.ft || '').toUpperCase()}</span>
            <span className="sc-fi-name">{form.name}</span>
          </div>
          <div className="sc-fst sc-fst-ok">✓ {proc.label}</div>
        </div>
      )}
      {proc && proc.err && <div className="sc-fst sc-fst-e" style={{ marginTop: '0.375rem', paddingLeft: 0 }}>Error: {proc.err}</div>}
    </div>
  );
}

// ── Main Component (Staff/Admin only) ─────────────────────────────────────
export default function ScriptCorrector() {
  const { user, isAdmin } = useAuth();
  const isStaff = isAdmin || user?.role === 'teacher';
  const userId  = String(user?.id || user?.username || 'u');

  // Redirect non-staff users to the unified Upload & AI Feedback page
  if (!isStaff) return <Navigate to="/upload" replace />;

  // ── Staff persisted data (localStorage)
  const [papers, setPapersRaw] = useState(() => lsGet(LS_PAPERS, []));
  const [subs,   setSubsRaw]   = useState(() => lsGet(LS_SUBS,   []));
  const [quota,  setQuotaRaw]  = useState(() => lsGet(LS_QUOTA,  {}));

  const savePapers = v => { setPapersRaw(v); lsSet(LS_PAPERS, v); };
  const saveSubs   = v => { setSubsRaw(v);   lsSet(LS_SUBS,   v); };
  const saveQuota  = v => { setQuotaRaw(v);  lsSet(LS_QUOTA,  v); };

  const quotaUsed      = () => quota[userId] || 0;
  const quotaRemaining = () => Math.max(0, FREE_LIMIT - quotaUsed());

  // ── Staff tab state
  const [tab, setTab] = useState('queue');

  // ── Staff grade form
  const [gradeSelPaper, setGradeSelPaper] = useState(null);
  const [gradeStudent,  setGradeStudent]  = useState('');
  const [gradeRoll,     setGradeRoll]     = useState('');
  const [gradeFiles,    setGradeFiles]    = useState([]);
  const [gradeLoading,  setGradeLoading]  = useState(false);
  const [gradeStep,     setGradeStep]     = useState('');
  const [gradeError,    setGradeError]    = useState('');
  const [gradeResult,   setGradeResult]   = useState(null);

  // ── Staff paper bank form
  const [showPF,  setShowPF]  = useState(false);
  const [editPId, setEditPId] = useState(null);
  const [pName,   setPName]   = useState('');
  const [pSubj,   setPSubj]   = useState('');
  const [pMarks,  setPMarks]  = useState('');
  const [formQP,  setFormQP]  = useState(null);
  const [formAns, setFormAns] = useState(null);
  const [qpProc,  setQpProc]  = useState(null);
  const [ansProc, setAnsProc] = useState(null);
  const [pfError, setPfError] = useState('');

  // ── Staff review modal
  const [reviewSub,  setReviewSub]  = useState(null);
  const [revMarks,   setRevMarks]   = useState({});
  const [revFB,      setRevFB]      = useState({});
  const [revOverall, setRevOverall] = useState('');

  // ── Staff settings
  const [resetRoll, setResetRoll] = useState('');
  const [resetMsg,  setResetMsg]  = useState(null);

  // ── Staff logic ───────────────────────────────────────────────────────────
  const runStaffGrading = async () => {
    const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY || '';
    setGradeError('');
    if (!apiKey)              return setGradeError('API key not configured. Contact your administrator.');
    if (!gradeSelPaper)       return setGradeError('Please select a paper.');
    if (!gradeStudent.trim()) return setGradeError('Please enter the student name.');
    if (!gradeFiles.length)   return setGradeError('Please upload the student answer script.');

    const paper = papers.find(p => p.id === gradeSelPaper);
    if (!paper) return setGradeError('Paper not found.');

    const steps = ['Reading question paper...', 'Analysing marking scheme...', 'Reading student handwriting...', 'Scoring questions...', 'Writing feedback...'];
    let si = 0;
    setGradeLoading(true); setGradeStep(steps[0]);
    const ticker = setInterval(() => setGradeStep(steps[Math.min(++si, steps.length - 1)]), 5000);
    try {
      const result = await callGradingAPI(apiKey, paper, gradeStudent, gradeRoll, gradeFiles);
      result.studentName  = gradeStudent;
      result.paperName    = paper.name;
      result.paperSubject = paper.subject;
      setGradeResult(result);
      setTab('results');
    } catch (err) {
      setGradeError('Error: ' + err.message);
    } finally {
      clearInterval(ticker); setGradeLoading(false); setGradeStep('');
    }
  };

  const openPaperForm = (id = null) => {
    setEditPId(id); setShowPF(true); setPfError('');
    setQpProc(null); setAnsProc(null);
    if (id) {
      const p = papers.find(x => x.id === id);
      if (p) {
        setPName(p.name); setPSubj(p.subject); setPMarks(String(p.totalMarks));
        setFormQP(p.qp);  setFormAns(p.ans);
        if (p.qp)  setQpProc({ ok: true, label: '(saved)' });
        if (p.ans) setAnsProc({ ok: true, label: '(saved)' });
      }
    } else {
      setPName(''); setPSubj(''); setPMarks(''); setFormQP(null); setFormAns(null);
    }
  };

  const processDoc = async (file, which) => {
    const isPdf  = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isDocx = file.name.endsWith('.docx') || file.type.includes('wordprocessingml');
    if (!isPdf && !isDocx) { setPfError('Please upload a PDF or DOCX file.'); return; }
    const setter = which === 'qp' ? setQpProc : setAnsProc;
    const saver  = which === 'qp' ? setFormQP  : setFormAns;
    setter('loading');
    try {
      let doc;
      if (isPdf) {
        const b64 = await toB64(file);
        doc = { name: file.name, ft: 'pdf', dtype: 'pdf', data: b64 };
        setter({ ok: true, label: '(PDF ready)' });
      } else {
        const mammoth = window.mammoth;
        if (!mammoth) throw new Error('DOCX extraction unavailable. Please upload PDF instead.');
        const ab  = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer: ab });
        doc = { name: file.name, ft: 'docx', dtype: 'docx', data: res.value };
        setter({ ok: true, label: `(~${doc.data.split(/\s+/).length} words)` });
      }
      saver(doc);
    } catch (err) {
      setter({ err: err.message });
    }
  };

  const savePaper = () => {
    setPfError('');
    const name = pName.trim(), subj = pSubj.trim(), marks = parseInt(pMarks) || 0;
    if (!name)    return setPfError('Please enter a paper name.');
    if (!subj)    return setPfError('Please enter a subject / exam.');
    if (!marks)   return setPfError('Please enter total marks.');
    if (!formQP)  return setPfError('Please upload the question paper.');
    if (!formAns) return setPfError('Please upload the suggested answers.');
    const paper = {
      id: editPId || Date.now().toString(),
      name, subject: subj, totalMarks: marks, qp: formQP, ans: formAns,
      created: editPId ? ((papers.find(p => p.id === editPId) || {}).created || Date.now()) : Date.now(),
    };
    savePapers(editPId ? papers.map(p => p.id === editPId ? paper : p) : [...papers, paper]);
    setShowPF(false); setEditPId(null);
  };

  const deletePaper = () => {
    if (!editPId || !window.confirm('Delete this paper? This cannot be undone.')) return;
    savePapers(papers.filter(p => p.id !== editPId));
    setShowPF(false); setEditPId(null);
  };

  const openReview = sub => {
    setReviewSub(sub);
    const qm = {}, qf = {};
    (sub.aiResult.questions || []).forEach((q, i) => { qm[i] = q.marksAwarded; qf[i] = q.feedback || ''; });
    setRevMarks(qm); setRevFB(qf); setRevOverall(sub.aiResult.overallFeedback || '');
  };

  const reviewTotal = () => Object.values(revMarks).reduce((s, m) => s + (parseInt(m) || 0), 0);

  const approveValidation = () => {
    if (!reviewSub) return;
    const maxMarks  = reviewSub.aiResult.maxMarks;
    const questions = (reviewSub.aiResult.questions || []).map((q, i) => ({
      ...q,
      marksAwarded: Math.min(parseInt(revMarks[i]) || 0, q.maxMarks),
      feedback: revFB[i] ?? q.feedback,
    }));
    const total = questions.reduce((s, q) => s + q.marksAwarded, 0);
    const pct   = Math.round((total / maxMarks) * 100);
    const updated = subs.map(s =>
      s.id !== reviewSub.id ? s : {
        ...s,
        status: 'validated',
        finalResult: {
          questions, totalMarks: total, maxMarks,
          percentage: pct, grade: calcGrade(pct),
          overallFeedback: revOverall,
          validatedBy: user?.first_name || user?.username || 'Staff',
          validatedAt: Date.now(),
          studentName: s.studentName, paperName: s.paperName, paperSubject: s.paperSubject,
        },
      }
    );
    saveSubs(updated);
    setReviewSub(null);
  };

  const resetStudentQuota = () => {
    const roll = resetRoll.trim();
    setResetMsg(null);
    if (!roll) return setResetMsg({ type: 'e', text: 'Please enter a user ID or roll number.' });
    const key  = roll.toLowerCase().replace(/\s+/g, '_');
    if (!quota[key] && !quota[roll]) return setResetMsg({ type: 'e', text: `No usage found for "${roll}". Nothing to reset.` });
    const newQ = { ...quota };
    delete newQ[key]; delete newQ[roll];
    saveQuota(newQ);
    setResetRoll('');
    setResetMsg({ type: 's', text: `Quota reset for "${roll}". They can now submit ${FREE_LIMIT} free evaluations again.` });
  };

  // ── Computed
  const pendingQueue = subs.filter(s => s.status === 'pending_validation');

  // ══════════════════════ STAFF / ADMIN VIEW ════════════════════════════════
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>🤖 AI Script Corrector</h1>
          <p className="subtitle">Grade student scripts with AI · Validate results · Manage papers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'queue',    label: <>Validation Queue {pendingQueue.length > 0 && <span className="badge badge-amber" style={{ marginLeft: '0.375rem' }}>{pendingQueue.length}</span>}</> },
          { key: 'grade',    label: 'Grade Script' },
          { key: 'results',  label: 'Results' },
          { key: 'papers',   label: 'Paper Bank' },
          { key: 'settings', label: 'Settings' },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Validation Queue ── */}
      {tab === 'queue' && (
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header">
              <h3 className="card-title">Validation Queue</h3>
              <span className="badge badge-amber">{pendingQueue.length} pending</span>
            </div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
              Student submissions awaiting faculty review and score validation.
            </p>
          </div>
          {pendingQueue.length === 0 ? (
            <div className="sc-empty">
              <div className="sc-empty-icon">✅</div>
              <div className="sc-empty-msg">Queue is empty — no pending validations right now</div>
            </div>
          ) : (
            pendingQueue.map(s => {
              const pct = Math.round((s.aiResult.totalMarks / s.aiResult.maxMarks) * 100);
              return (
                <div key={s.id} className="sc-vq-item">
                  <div className="sc-vq-top">
                    <div>
                      <div className="sc-vq-student">{s.studentName}</div>
                      <div className="sc-vq-roll">{s.studentId}</div>
                      <div className="sc-vq-paper">{s.paperName} · {s.paperSubject}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="sc-vq-score-num">{s.aiResult.totalMarks}/{s.aiResult.maxMarks}</div>
                      <div className="sc-vq-score-lbl">AI Score ({pct}%)</div>
                      <div className="sc-vq-time">{relTime(s.submittedAt)}</div>
                    </div>
                  </div>
                  <button className="btn btn-sm"
                    style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #c4b5fd' }}
                    onClick={() => openReview(s)}>
                    Review &amp; Validate
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Grade Script ── */}
      {tab === 'grade' && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Grade a Student Script</h3></div>
          <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Select a paper, enter student details and upload their answer script.
          </p>
          <div className="sc-section-title">1. Select Paper</div>
          {papers.length === 0 ? (
            <div className="sc-empty" style={{ padding: '1rem 0' }}>
              <div className="sc-empty-msg">No papers — add papers in the Paper Bank tab first</div>
            </div>
          ) : (
            <div className="sc-pgrid">
              {papers.map(p => (
                <div key={p.id} className={`sc-pcard ${gradeSelPaper === p.id ? 'sel' : ''}`} onClick={() => setGradeSelPaper(p.id)}>
                  <div className="sc-pcard-name">{p.name}</div>
                  <div className="sc-pcard-sub">{p.subject}</div>
                  <div className="sc-pcard-marks">{p.totalMarks} marks</div>
                  <div className="sc-pcard-tags">
                    {p.qp  && <span className="sc-ptag">QP</span>}
                    {p.ans && <span className="sc-ptag">ANS</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="sc-divider" />
          <div className="sc-section-title">2. Student Details</div>
          <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Student Name</label>
              <input className="form-input" placeholder="e.g. Priya Sharma" value={gradeStudent} onChange={e => setGradeStudent(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Roll No / Student ID</label>
              <input className="form-input" placeholder="e.g. AP-2024-042" value={gradeRoll} onChange={e => setGradeRoll(e.target.value)} />
            </div>
          </div>
          <div className="sc-divider" />
          <div className="sc-section-title">3. Upload Answer Script</div>
          <FileDropzone
            files={gradeFiles}
            onAdd={f => setGradeFiles(prev => [...prev, ...f].slice(0, 10))}
            onRemove={i => setGradeFiles(prev => prev.filter((_, j) => j !== i))}
            hint="PDF under 3MB for best results · Compress at ilovepdf.com if larger"
          />
          <div className="sc-divider" />
          {gradeError && <div className="sc-alert sc-alert-e">⚠ {gradeError}</div>}
          {gradeLoading && <div className="sc-stbar"><div className="sc-spin" /><div className="sc-stxt">{gradeStep}</div></div>}
          <button className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem' }}
            onClick={runStaffGrading} disabled={gradeLoading}>
            {gradeLoading ? 'Grading...' : '✓ Grade This Script'}
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {tab === 'results' && (
        <div>
          {gradeResult ? (
            <>
              <ResultCard result={gradeResult} type="validated" />
              <div className="sc-no-print" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Export PDF</button>
                <button className="btn btn-secondary" onClick={() => { setGradeResult(null); setTab('grade'); }}>Grade Another</button>
              </div>
            </>
          ) : (
            <div className="sc-empty">
              <div className="sc-empty-icon">📊</div>
              <div className="sc-empty-msg">No results yet — grade a script to see results here</div>
            </div>
          )}
        </div>
      )}

      {/* ── Paper Bank ── */}
      {tab === 'papers' && (
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header">
              <h3 className="card-title">Paper Bank</h3>
              <button className="btn btn-primary btn-sm" onClick={() => openPaperForm()}>+ Add Paper</button>
            </div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
              Manage question papers and suggested answers used for AI grading.
            </p>
          </div>
          {papers.length === 0 ? (
            <div className="sc-empty">
              <div className="sc-empty-icon">📄</div>
              <div className="sc-empty-msg">No papers yet — add your first paper above</div>
            </div>
          ) : (
            <div className="sc-pgrid">
              {papers.map(p => (
                <div key={p.id} className="sc-pcard" onClick={() => openPaperForm(p.id)}>
                  <div className="sc-pcard-name">{p.name}</div>
                  <div className="sc-pcard-sub">{p.subject}</div>
                  <div className="sc-pcard-marks">{p.totalMarks} marks</div>
                  <div className="sc-pcard-tags">
                    {p.qp  && <span className="sc-ptag">QP ({p.qp.ft.toUpperCase()})</span>}
                    {p.ans && <span className="sc-ptag">ANS ({p.ans.ft.toUpperCase()})</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {showPF && (
            <div className="card" style={{ marginTop: '1.25rem' }}>
              <div className="card-header">
                <h3 className="card-title">{editPId ? 'Edit Paper' : 'Upload New Paper'}</h3>
                {editPId && <button className="btn btn-danger btn-sm" onClick={deletePaper}>Delete Paper</button>}
              </div>
              <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Paper Name</label>
                  <input className="form-input" placeholder="e.g. FA Mock 1 – June 2025" value={pName} onChange={e => setPName(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject / Exam</label>
                  <input className="form-input" placeholder="e.g. ACCA F3" value={pSubj} onChange={e => setPSubj(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Total Marks</label>
                  <input className="form-input" type="number" placeholder="100" min="1" value={pMarks} onChange={e => setPMarks(e.target.value)} />
                </div>
              </div>
              <div className="sc-divider" />
              <div className="sc-section-title">Upload Documents</div>
              <div className="sc-upload-pair">
                <DocZone label="Question Paper"    which="qp"  proc={qpProc}  form={formQP}  onFile={f => processDoc(f, 'qp')} />
                <DocZone label="Suggested Answers" which="ans" proc={ansProc} form={formAns} onFile={f => processDoc(f, 'ans')} />
              </div>
              {pfError && <div className="sc-alert sc-alert-e">⚠ {pfError}</div>}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={savePaper}>Save Paper</button>
                <button className="btn btn-secondary" onClick={() => { setShowPF(false); setEditPId(null); }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Settings ── */}
      {tab === 'settings' && (
        <div>
          {isAdmin && (
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <div className="card-header"><h3 className="card-title">Reset Student Free Quota</h3></div>
              <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Allow a student to submit more scripts by resetting their {FREE_LIMIT}-evaluation free limit.
              </p>
              <div className="grid-2" style={{ alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Student User ID / Roll Number</label>
                  <input className="form-input" placeholder="e.g. AP-2024-042 or username" value={resetRoll} onChange={e => setResetRoll(e.target.value)} />
                </div>
                <button className="btn" style={{ background: '#fffbeb', color: 'var(--accent)', border: '1px solid #fde68a', height: 40, alignSelf: 'flex-end' }}
                  onClick={resetStudentQuota}>Reset Quota</button>
              </div>
              {resetMsg && (
                <div className={`sc-alert ${resetMsg.type === 'e' ? 'sc-alert-e' : 'sc-alert-s'}`}>
                  {resetMsg.type === 'e' ? '⚠' : '✓'} {resetMsg.text}
                </div>
              )}
            </div>
          )}
          <div className="card">
            <div className="card-header"><h3 className="card-title">About AI Script Corrector</h3></div>
            {[
              ['AI Model',          'Claude Sonnet 4.5 (via OpenRouter)'],
              ['Student Free Limit', `${FREE_LIMIT} evaluations`],
              ['Data Storage',      'Browser localStorage (staff papers)'],
              ['Staff Papers',      String(papers.length)],
              ['Total Submissions', String(subs.length)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem', background: 'var(--border-light)', borderRadius: 'var(--radius)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-light)' }}>{k}</span>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Review Modal ── */}
      {reviewSub && (
        <div className="modal-overlay" onClick={() => setReviewSub(null)}>
          <div className="modal-content" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Validate: {reviewSub.studentName}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                  {reviewSub.paperName} · AI Score: {reviewSub.aiResult.totalMarks}/{reviewSub.aiResult.maxMarks}
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setReviewSub(null)}>✕ Close</button>
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {(reviewSub.aiResult.questions || []).map((q, i) => (
                <div key={i} className="sc-qedit">
                  <div className="sc-qedit-hdr">
                    <div className="sc-qedit-label">Q{q.qNo || i + 1}: {q.questionSummary || `Question ${i + 1}`}</div>
                    <div className="sc-marks-edit">
                      Marks:
                      <input type="number" min="0" max={q.maxMarks}
                        value={revMarks[i] ?? q.marksAwarded}
                        onChange={e => setRevMarks(p => ({ ...p, [i]: e.target.value }))} />
                      / {q.maxMarks}
                      <span className="sc-ai-mark">(AI: {q.marksAwarded})</span>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Feedback</label>
                    <textarea className="form-textarea" rows="2"
                      value={revFB[i] ?? q.feedback ?? ''}
                      onChange={e => setRevFB(p => ({ ...p, [i]: e.target.value }))} />
                  </div>
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Overall Faculty Feedback</label>
                <textarea className="form-textarea" rows="3" value={revOverall} onChange={e => setRevOverall(e.target.value)} />
              </div>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--border-light)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                New Total: <strong style={{ fontSize: '1.1rem', color: 'var(--text)' }}>{reviewTotal()}</strong>
                <span style={{ color: 'var(--text-light)' }}> / {reviewSub.aiResult.maxMarks}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" onClick={() => setReviewSub(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={approveValidation}>✓ Approve &amp; Validate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
