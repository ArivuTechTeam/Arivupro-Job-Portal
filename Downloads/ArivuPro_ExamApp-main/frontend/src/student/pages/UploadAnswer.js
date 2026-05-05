/**
 * Upload & AI Feedback — Unified flow
 * Select paper → Upload script → AI evaluation (via backend) → View feedback → Request faculty evaluation
 */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { examsAPI, API_HOST } from '../../services/api';
import api from '../../services/api';
import '../styles/ScriptCorrector.css';
import {
  LS_QUOTA, LS_FAC_REQUESTS, LS_FAC_RESPONSES, FREE_LIMIT,
  lsGet, lsSet, validateScriptFile, mapBackendEvaluation,
  downloadFeedbackPDF, ResultCard, FileDropzone,
} from './uploadHelpers';

const Icons = {
  Upload: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Star: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  CheckCircle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#26895A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  Bot: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="7" rx="2"/><path d="M12 7V3"/><path d="M9 3h6"/><path d="M9 13v.01"/><path d="M15 13v.01"/><path d="M10 17h4"/></svg>,
  ClipboardList: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  Printer: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>,
  FileText: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>,
  Graduation: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" /><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" /></svg>,
};

const EXAM_TYPE_CONFIG = {
  CA:  { label: 'CA',  color: '#1B6543', bg: '#E6F1EB', border: '#D1E7DD' },
  CS:  { label: 'CS',  color: '#92400E', bg: '#FEF3C7', border: '#FDE68A' },
  CMA: { label: 'CMA', color: '#991B1B', bg: '#FEE2E2', border: '#FECACA' },
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Poll the backend for evaluation result with a timeout
async function pollForEvaluation(subId, onStep) {
  const steps = [
    'Fetching paper marking scheme…',
    'Reading your answer script…',
    'Analysing each question against the marking scheme…',
    'Scoring and computing partial credit…',
    'Writing personalised feedback…',
    'Almost done — wrapping up…',
  ];
  let si = 0;
  onStep(steps[0]);

  const maxAttempts = 24; // 24 × 5s = 2 minutes
  const intervalMs = 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await api.get(`/exams/submissions/${subId}/evaluation/`);
      const ev = res.data;
      if (ev && ev.status === 'completed') {
        return ev;
      }
    } catch (err) {
      // 404 = evaluation not ready yet — keep polling
      if (err.response?.status !== 404) {
        throw new Error(err.response?.data?.detail || 'Evaluation request failed.');
      }
    }

    if (attempt < maxAttempts - 1) {
      await sleep(intervalMs);
      onStep(steps[Math.min(si + 1, steps.length - 1)]);
      si = Math.min(si + 1, steps.length - 1);
    }
  }

  // Timeout — try forcing evaluation via POST
  onStep('Requesting evaluation from server…');
  try {
    const res = await api.post(`/exams/submissions/${subId}/evaluate/`, {}, { timeout: 120000 });
    if (res.data && res.data.status === 'completed') {
      return res.data;
    }
  } catch (err) {
    throw new Error(err.response?.data?.detail || 'AI evaluation timed out. Please try again.');
  }

  throw new Error('AI evaluation timed out after 2 minutes. Please try again.');
}

export default function UploadAnswer() {
  const { user } = useAuth();
  const location = useLocation();
  const userId = String(user?.id || user?.username || 'u');

  // Quota
  const [quota, setQuotaRaw] = useState(() => lsGet(LS_QUOTA, {}));
  const saveQuota = v => { setQuotaRaw(v); lsSet(LS_QUOTA, v); };
  const quotaUsed = () => quota[userId] || 0;
  const quotaRemaining = () => Math.max(0, FREE_LIMIT - quotaUsed());

  // Phase: browse | loading_detail | upload | uploading | uploaded | ai_running | result
  const [phase, setPhase] = useState('browse');
  const [papers, setPapers] = useState([]);
  const [papersLoading, setPapersLoading] = useState(false);
  const [papersErr, setPapersErr] = useState('');
  const [selPaper, setSelPaper] = useState(null);
  const [scriptFiles, setScriptFiles] = useState([]);
  const [fileErr, setFileErr] = useState('');
  const [uploadPct, setUploadPct] = useState(0);
  const [subId, setSubId] = useState(null);
  const [aiRunMsg, setAiRunMsg] = useState('');
  const [aiErr, setAiErr] = useState('');
  const [result, setResult] = useState(null);

  // Faculty request state
  const [facRequested, setFacRequested] = useState(false);
  const [facResponse, setFacResponse] = useState(null);

  // Fetch published papers
  useEffect(() => {
    setPapersLoading(true);
    setPapersErr('');
    examsAPI.getPapers({ is_published: true })
      .then(res => {
        const d = res.data;
        const list = Array.isArray(d) ? d : (d.results || []);
        setPapers(list);

        // Auto-select if passed in navigation state
        if (location.state?.paperId) {
          const found = list.find(p => p.id === location.state.paperId);
          if (found) {
            handleSelectPaper(found);
          } else {
            // If not in published list yet, try fetching directly
            setPhase('loading_detail');
            examsAPI.getPaper(location.state.paperId)
              .then(pRes => handleSelectPaper(pRes.data))
              .catch(() => setPhase('browse'));
          }
        }
      })
      .catch(() => setPapersErr('Unable to load papers. Please refresh.'))
      .finally(() => setPapersLoading(false));
  }, [location.state]);

  // Check for existing faculty response when result is shown
  useEffect(() => {
    if (phase === 'result' && selPaper) {
      const requests = lsGet(LS_FAC_REQUESTS, []);
      const existing = requests.find(r => r.paperId === selPaper.id && r.userId === userId);
      if (existing) {
        setFacRequested(true);
        const responses = lsGet(LS_FAC_RESPONSES, []);
        const resp = responses.find(r => r.requestId === existing.id);
        if (resp) setFacResponse(resp);
      }
    }
  }, [phase, selPaper, userId]);

  // ── Handlers ──
  const handleSelectPaper = async (paper) => {
    setPhase('loading_detail');
    setPapersErr('');
    try {
      const res = await examsAPI.getPaper(paper.id);
      setSelPaper(res.data);
      setScriptFiles([]); setFileErr(''); setUploadPct(0);
      setSubId(null); setAiErr(''); setResult(null);
      setFacRequested(false); setFacResponse(null);
      setPhase('upload');
    } catch {
      setPapersErr('Failed to load paper details.');
      setPhase('browse');
    }
  };

  const handleFilesAdd = (files) => {
    setFileErr('');
    const toAdd = [];
    for (const file of files) {
      const err = validateScriptFile(file);
      if (err) { setFileErr(err); return; }
      toAdd.push(file);
    }
    setScriptFiles(prev => [...prev, ...toAdd].slice(0, 5));
  };

  const handleUpload = async () => {
    if (!scriptFiles.length) return setFileErr('Please select your answer script file first.');
    setFileErr(''); setUploadPct(0); setPhase('uploading');
    const fd = new FormData();
    fd.append('exam_paper', selPaper.id);
    fd.append('answer_script_file', scriptFiles[0]);
    if (scriptFiles.length > 1) fd.append('additional_pages', scriptFiles[1]);
    try {
      const res = await api.post('/exams/submissions/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => { if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100)); },
      });
      setSubId(res.data.id); setUploadPct(100); setPhase('uploaded');
    } catch (err) {
      const d = err.response?.data;
      setFileErr(typeof d === 'string' ? d : d?.detail || d?.answer_script_file?.[0] || d?.exam_paper?.[0] || 'Upload failed.');
      setPhase('upload');
    }
  };

  const runAI = async () => {
    if (!subId) return setAiErr('No submission found. Please upload your script first.');
    setAiErr('');
    setPhase('ai_running');

    try {
      const ev = await pollForEvaluation(subId, setAiRunMsg);
      const mapped = mapBackendEvaluation(ev, selPaper, user?.first_name || user?.username || 'Student');
      const newQ = { ...quota, [userId]: (quota[userId] || 0) + 1 };
      saveQuota(newQ);
      setResult(mapped);
      setPhase('result');
    } catch (err) {
      setAiErr('Error: ' + err.message);
      setPhase('uploaded');
    } finally {
      setAiRunMsg('');
    }
  };

  const startOver = () => {
    setPhase('browse'); setSelPaper(null); setScriptFiles([]); setFileErr('');
    setUploadPct(0); setSubId(null); setAiErr(''); setResult(null);
    setFacRequested(false); setFacResponse(null);
  };

  const handleFacultyRequest = () => {
    if (!result || !selPaper) return;
    const request = {
      id: Date.now().toString(),
      userId,
      studentName: user?.first_name || user?.username || 'Student',
      paperId: selPaper.id,
      paperName: selPaper.title,
      paperSubject: selPaper.subject_name,
      subId,
      aiResult: result,
      submittedAt: Date.now(),
      status: 'pending',
    };
    const existing = lsGet(LS_FAC_REQUESTS, []);
    existing.push(request);
    lsSet(LS_FAC_REQUESTS, existing);
    setFacRequested(true);
  };

  const remaining = quotaRemaining();
  const used = quotaUsed();

  // Step indicator
  const PHASE_ORDER = { browse: 0, loading_detail: 0, upload: 1, uploading: 1, uploaded: 2, ai_running: 2, result: 3 };
  const stepIdx = PHASE_ORDER[phase] ?? 0;

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_HOST}${url}`;
  };

  const currentTheme = selPaper ? (EXAM_TYPE_CONFIG[selPaper.exam_type] || EXAM_TYPE_CONFIG.CA) : null;

  return (
    <div className="page">
      <div className="page-header" style={currentTheme ? { 
        background: `linear-gradient(to right, ${currentTheme.bg}, #fff)`,
        borderLeft: `5px solid ${currentTheme.color}`
      } : {}}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {selPaper ? <Icons.Graduation style={{ color: currentTheme.color }} /> : <Icons.Upload />} 
            {selPaper ? selPaper.title : 'Upload & AI Feedback'}
          </h1>
          <p className="subtitle">
            {selPaper ? `${selPaper.subject_name} • ${selPaper.exam_session || 'Practice Paper'}` : 'Select a paper, upload your answers, and get detailed AI feedback'}
          </p>
        </div>
        {phase !== 'browse' && phase !== 'result' && phase !== 'loading_detail' && (
          <button className="btn btn-secondary" onClick={startOver}>← Back to Papers</button>
        )}
      </div>

      {/* Free quota banner */}
      {phase === 'browse' && remaining > 0 && (
        <div className="sc-free-banner">
          <div className="sc-free-left">
            <div className="sc-free-icon" style={{ color: 'var(--accent)' }}><Icons.Star /></div>
            <div>
              <div className="sc-free-label">Free Plan</div>
              <div className="sc-free-title">{remaining} of {FREE_LIMIT} free evaluation{remaining !== 1 ? 's' : ''} remaining</div>
            </div>
          </div>
          <div className="sc-free-slots">
            {Array.from({ length: FREE_LIMIT }, (_, i) => (
              <span key={i} className={`sc-slot-dot ${i < used ? 'sc-slot-used' : 'sc-slot-avail'}`} />
            ))}
            <span className="sc-slots-txt">{remaining} left</span>
          </div>
        </div>
      )}

      {/* Quota exhausted */}
      {phase === 'browse' && remaining <= 0 && (
        <div className="sc-limit-wall">
          <div className="sc-limit-icon" style={{ color: 'var(--accent)' }}><Icons.Star /></div>
          <div className="sc-limit-title">Free Evaluations Used Up</div>
          <div className="sc-limit-sub">You've used all free AI evaluations. Contact your admin to reset your quota or upgrade to Pro.</div>
          <div className="sc-unlock-box">
            <div className="sc-unlock-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}><Icons.Lock /> Unlock with Pro Plan</div>
            <div className="sc-unlock-feat"><Icons.Check /> Unlimited script evaluations</div>
            <div className="sc-unlock-feat"><Icons.Check /> Priority faculty validation</div>
            <div className="sc-unlock-feat"><Icons.Check /> Detailed performance analytics</div>
            <div className="sc-unlock-feat"><Icons.Check /> Full submission history</div>
          </div>
          <button className="btn btn-secondary" style={{ background: '#fff', color: 'var(--secondary)', fontWeight: 700 }}
            onClick={() => alert('Please contact your ArivuPro admin to reset your quota.\n\nYour user ID: ' + userId)}>
            Contact Admin to Upgrade
          </button>
        </div>
      )}

      {/* Step indicator */}
      {phase !== 'browse' && phase !== 'result' && (
        <div className="sc-stepper">
          {['Select Paper', 'Upload Script', 'AI Analysis'].map((label, i) => {
            const cls = i < stepIdx ? 'done' : i === stepIdx ? 'active' : '';
            const stepColor = i <= stepIdx ? (currentTheme?.color || 'var(--primary)') : 'var(--border)';
            return (
              <React.Fragment key={i}>
                {i > 0 && <div className={`sc-step-sep ${i <= stepIdx ? 'sc-step-sep-done' : ''}`} />}
                <div className={`sc-step ${cls}`} style={{ color: i <= stepIdx ? (currentTheme?.color || 'var(--primary)') : 'var(--text-light)' }}>
                  <div className="sc-step-num" style={{ borderColor: stepColor, color: i < stepIdx ? '#fff' : stepColor, background: i < stepIdx ? stepColor : 'transparent' }}>{i < stepIdx ? <Icons.Check /> : i + 1}</div>
                  <span>{label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* PHASE: browse */}
      {phase === 'browse' && remaining > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Available Papers</h3>
            {papersLoading && <span className="sc-stxt" style={{ fontSize: '0.8rem' }}>Loading...</span>}
          </div>
          {papersErr && <div className="sc-alert sc-alert-e" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icons.Alert /> {papersErr}</div>}
          {!papersLoading && !papersErr && papers.length === 0 && (
            <div className="sc-empty">
              <div className="sc-empty-icon" style={{ color: 'var(--text-lighter)' }}><Icons.FileText /></div>
              <div className="sc-empty-msg">No papers available yet — check back with your admin</div>
            </div>
          )}
          {papers.map(paper => (
            <div key={paper.id} className="sc-paper-row">
              <div className="sc-paper-row-info">
                <div className="sc-paper-row-title">{paper.title}</div>
                <div className="sc-paper-row-meta">
                  {[paper.subject_name, paper.exam_session, paper.attempt_type ? paper.attempt_type.replace(/_/g, ' ') : null, paper.total_marks + ' marks', paper.duration_minutes ? paper.duration_minutes + ' min' : null].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="sc-paper-row-actions">
                {paper.question_paper_file && (
                  <button 
                    onClick={() => window.open(getFullUrl(paper.question_paper_file), '_blank')}
                    className="btn btn-secondary btn-sm"
                  >
                    ⬇ View Paper
                  </button>
                )}
                <button 
                  className="btn btn-primary btn-sm" 
                  style={{ background: EXAM_TYPE_CONFIG[paper.exam_type]?.color || 'var(--primary)', borderColor: EXAM_TYPE_CONFIG[paper.exam_type]?.color || 'var(--primary)' }} 
                  onClick={() => handleSelectPaper(paper)}
                >
                  Get Test →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PHASE: loading_detail */}
      {phase === 'loading_detail' && (
        <div className="sc-empty" style={{ padding: '3rem' }}>
          <div className="sc-spin" style={{ margin: '0 auto 1rem', width: 28, height: 28, border: '3px solid #bfdbfe', borderTopColor: 'var(--secondary)' }} />
          <div className="sc-empty-msg">Loading paper details...</div>
        </div>
      )}

      {/* PHASE: upload / uploading */}
      {(phase === 'upload' || phase === 'uploading') && selPaper && (
        <div>
          <div className="sc-paper-detail-bar">
            <div>
              <div className="sc-paper-detail-title">{selPaper.title}</div>
              <div className="sc-paper-detail-meta">{selPaper.subject_name} · {selPaper.total_marks} marks{selPaper.duration_minutes ? ` · ${selPaper.duration_minutes} min` : ''}</div>
            </div>
            {selPaper.question_paper_file && (
              <button 
                onClick={() => window.open(getFullUrl(selPaper.question_paper_file), '_blank')}
                className="btn btn-secondary btn-sm" 
                style={{ display: 'flex', gap: '0.5rem' }}
              >
                <Icons.Download /> View Question Paper
              </button>
            )}
          </div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Upload Your Answer Script</h3></div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Upload your completed answer script. <strong>PDF or DOCX only</strong> — maximum <strong>3MB</strong> per file. You can add up to 5 files.
            </p>
            <FileDropzone files={scriptFiles} onAdd={handleFilesAdd} onRemove={i => { setScriptFiles(prev => prev.filter((_, j) => j !== i)); setFileErr(''); }} accept="pdf_docx" hint="PDF or DOCX only · Max 3MB per file · Compress at ilovepdf.com if needed" />
            {phase === 'uploading' && (
              <div className="sc-upload-progress">
                <div className="sc-progress-track"><div className="sc-progress-fill" style={{ width: uploadPct + '%' }} /></div>
                <div className="sc-progress-label">Uploading... {uploadPct}%</div>
              </div>
            )}
            {fileErr && <div className="sc-alert sc-alert-e" style={{ marginTop: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icons.Alert /> {fileErr}</div>}
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem', marginTop: '1rem', display: 'flex', gap: '0.5rem', background: currentTheme?.color || 'var(--primary)', borderColor: currentTheme?.color || 'var(--primary)' }} 
              onClick={handleUpload} 
              disabled={!scriptFiles.length || phase === 'uploading'}
            >
              {phase === 'uploading' ? 'Uploading...' : <><Icons.Upload /> Upload Answer Script</>}
            </button>
          </div>
        </div>
      )}

      {/* PHASE: uploaded */}
      {phase === 'uploaded' && selPaper && (
        <div>
          <div className="sc-paper-detail-bar" style={{ marginBottom: '1.25rem' }}>
            <div>
              <div className="sc-paper-detail-title">{selPaper.title}</div>
              <div className="sc-paper-detail-meta">{selPaper.subject_name} · {selPaper.total_marks} marks</div>
            </div>
          </div>
          <div className="sc-upload-success">
            <div className="sc-upload-success-icon"><Icons.CheckCircle /></div>
            <div>
              <div className="sc-upload-success-title">Script Uploaded Successfully</div>
              <div className="sc-upload-success-sub">Your answer script has been received and saved.{subId && ` Submission ID: ${subId}`}</div>
            </div>
          </div>
          {aiErr && <div className="sc-alert sc-alert-e" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icons.Alert /> {aiErr}</div>}
          {remaining <= 0 ? (
            <div className="sc-alert sc-alert-e">You have no AI evaluations remaining. Contact your admin to reset your quota.</div>
          ) : (
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem', display: 'flex', gap: '0.5rem', background: currentTheme?.color || 'var(--primary)', borderColor: currentTheme?.color || 'var(--primary)' }} 
              onClick={runAI}
            >
              <Icons.Bot /> Get AI Feedback ({remaining} evaluation{remaining !== 1 ? 's' : ''} remaining)
            </button>
          )}
        </div>
      )}

      {/* PHASE: ai_running */}
      {phase === 'ai_running' && (
        <div className="card sc-ai-running-card">
          <div className="sc-ai-icon" style={{ color: 'var(--primary)' }}><Icons.Bot /></div>
          <h2 className="sc-ai-title">Analysing your script...</h2>
          <div className="sc-stbar" style={{ justifyContent: 'center', marginBottom: 0 }}>
            <div className="sc-spin" />
            <div className="sc-stxt">{aiRunMsg}</div>
          </div>
          <p className="sc-ai-sub">This usually takes 30–60 seconds. Please don't close the page.</p>
        </div>
      )}

      {/* PHASE: result */}
      {phase === 'result' && result && (
        <>
          <ResultCard result={result} type="preliminary" />

          {/* Action buttons */}
          <div className="sc-no-print" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }} onClick={() => downloadFeedbackPDF(result, selPaper, user?.first_name || user?.username || 'Student')}><Icons.Download /> Download Feedback PDF</button>
            <button className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem' }} onClick={() => window.print()}><Icons.Printer /> Print</button>
            <button className="btn btn-secondary" onClick={startOver}>Submit Another Script</button>
          </div>

          {/* Request Faculty Evaluation */}
          <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--primary-light)', border: '2px solid var(--primary)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icons.ClipboardList /> Request Faculty Evaluation</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Want a human expert to review your script? Your answer script and AI feedback will be sent to faculty for detailed evaluation.
            </p>
            {facRequested ? (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}><Icons.CheckCircle /></span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '0.875rem' }}>Request Submitted</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Your script has been sent to faculty for evaluation. You'll see their response here once submitted.</div>
                </div>
              </div>
            ) : (
              <button className="btn btn-primary" style={{ background: 'var(--text)', borderColor: 'var(--text)', padding: '0.75rem 1.5rem', fontSize: '0.95rem', display: 'flex', gap: '0.5rem' }} onClick={handleFacultyRequest}>
                <Icons.ClipboardList /> Request Faculty Evaluation
              </button>
            )}

            {/* Faculty response (if available) */}
            {facResponse && (
              <div style={{ marginTop: '1rem', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Icons.ClipboardList /> Faculty Response</div>
                {facResponse.grade && <div style={{ fontSize: '0.875rem', marginBottom: '0.375rem' }}><strong>Grade:</strong> {facResponse.grade}</div>}
                {facResponse.remarks && <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', lineHeight: 1.65 }}>{facResponse.remarks}</div>}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-lighter)', marginTop: '0.5rem' }}>
                  — {facResponse.facultyName || 'Faculty'} · {new Date(facResponse.submittedAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export { UploadAnswer };
