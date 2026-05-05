import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  X, 
  Upload, 
  FolderOpen, 
  Folder, 
  Check, 
  Edit3, 
  AlertCircle, 
  Globe, 
  Lock, 
  Loader2,
  ChevronLeft,
  Pencil
} from 'lucide-react';
import { examsAPI } from '../services/api';

// ─── Drop Zone ────────────────────────────────────────────────────────────────
function DropZone({ label, sublabel, file, existingName, onFile, onRemove, color = '#4f46e5', bg = '#eef2ff' }) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef(null);

  const validate = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { alert('Only PDF files are accepted.'); return; }
    if (f.size > 50 * 1024 * 1024)  { alert('File must be under 50 MB.'); return; }
    onFile(f);
  };

  const fmt = (bytes) => bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';

  // File selected
  if (file) {
    return (
      <div style={{
        border: `2px solid ${color}`, borderRadius: 14, padding: '1.125rem 1.25rem',
        background: bg, display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: color, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><FileText size={22} color="#fff" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.875rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
            PDF · {fmt(file.size)} · New upload
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          <button type="button" onClick={() => ref.current?.click()} style={{
            background: '#fff', border: `1px solid ${color}`, borderRadius: 8,
            padding: '4px 12px', fontSize: '0.75rem', cursor: 'pointer', color, fontWeight: 700,
          }}>Replace</button>
          <button type="button" onClick={onRemove} style={{
            background: '#fee2e2', border: 'none', borderRadius: 8,
            padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer', color: '#dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><X size={14} /></button>
        </div>
        <input ref={ref} type="file" accept=".pdf" style={{ display: 'none' }}
          onChange={e => validate(e.target.files[0])} />
      </div>
    );
  }

  // Existing file (from server)
  if (existingName) {
    return (
      <div style={{
        border: `2px solid #e2e8f0`, borderRadius: 14, padding: '1.125rem 1.25rem',
        background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: '#e2e8f0', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><FileText size={22} color="#94a3b8" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#1e293b', fontSize: '0.875rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {existingName.split('/').pop()}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
            Current file · click below to replace
          </p>
        </div>
        <button type="button" onClick={() => ref.current?.click()} style={{
          background: '#fff', border: `1px solid ${color}`, borderRadius: 8,
          padding: '4px 14px', fontSize: '0.75rem', cursor: 'pointer', color, fontWeight: 700, flexShrink: 0,
        }}> <Upload size={14} /> Replace</button>
        <input ref={ref} type="file" accept=".pdf" style={{ display: 'none' }}
          onChange={e => validate(e.target.files[0])} />
      </div>
    );
  }

  // Empty dropzone
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={e => { e.preventDefault(); setDragging(false); }}
      onDrop={e => { e.preventDefault(); setDragging(false); validate(e.dataTransfer.files[0]); }}
      style={{
        border: `2px dashed ${dragging ? color : '#cbd5e1'}`,
        borderRadius: 14, padding: '2rem 1.5rem', textAlign: 'center', cursor: 'pointer',
        background: dragging ? bg : '#f8fafc',
        transform: dragging ? 'scale(1.01)' : 'scale(1)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ marginBottom: '0.625rem', display: 'flex', justifyContent: 'center' }}>
        {dragging ? <FolderOpen size={40} color={color} /> : <FileText size={40} color="#94a3b8" />}
      </div>
      <p style={{ fontWeight: 700, color: dragging ? color : '#374151', margin: '0 0 0.25rem', fontSize: '0.875rem' }}>
        {dragging ? 'Release to upload' : label}
      </p>
      <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 1rem' }}>{sublabel}</p>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        background: '#fff', border: '1.5px solid #d1d5db',
        borderRadius: 8, padding: '0.4rem 1rem',
        fontSize: '0.78rem', fontWeight: 600, color: '#374151',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}> <Folder size={14} /> Browse PDF</div>
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.68rem', color: '#cbd5e1' }}>PDF only · Max 50 MB</p>
      <input ref={ref} type="file" accept=".pdf" style={{ display: 'none' }}
        onChange={e => validate(e.target.files[0])} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminEditPaper() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  const [success,   setSuccess]   = useState(false);
  const [subjects,  setSubjects]  = useState([]);
  const [existing,  setExisting]  = useState({ qFile: '', aFile: '' });

  const [form, setForm] = useState({
    title: '', course_name: '', subject: '', attempt_type: 'mock', exam_session: '',
    total_marks: '', duration_minutes: '', is_published: false,
    question_paper_file: null, suggested_answer_file: null,
  });

  // Load paper + subjects
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [paperRes, subjRes] = await Promise.all([
          examsAPI.getPaper(id),
          examsAPI.getSubjects(),
        ]);
        const d = paperRes.data || paperRes;
        setForm({
          title:               d.title            || '',
          course_name:         d.course_name      || '',
          subject:             d.subject?.id      || d.subject || '',
          attempt_type:        d.attempt_type     || 'mock',
          exam_session:        d.exam_session     || '',
          total_marks:         d.total_marks      || '',
          duration_minutes:    d.duration_minutes || '',
          is_published:        d.is_published     || false,
          question_paper_file:   null,
          suggested_answer_file: null,
        });
        setExisting({
          qFile: d.question_paper_file || '',
          aFile: d.suggested_answer_file || '',
        });
        const sd = subjRes.data;
        setSubjects(Array.isArray(sd) ? sd : sd?.results || []);
      } catch (e) {
        setError('Failed to load paper details. ' + (e.response?.data?.detail || e.message));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const validate = () => {
    if (!form.title.trim())        { setError('Paper title is required.');    return false; }
    if (!form.subject)             { setError('Subject is required.');         return false; }
    if (!form.total_marks)         { setError('Total marks is required.');     return false; }
    if (!form.duration_minutes)    { setError('Duration is required.');        return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true); setError(null);
      const fd = new FormData();
      fd.append('title',            form.title);
      fd.append('course_name',      form.course_name);
      fd.append('subject',          form.subject);
      fd.append('attempt_type',     form.attempt_type);
      fd.append('exam_session',     form.exam_session);
      fd.append('total_marks',      form.total_marks);
      fd.append('duration_minutes', form.duration_minutes);
      fd.append('is_published',     form.is_published);
      if (form.question_paper_file)   fd.append('question_paper_file',   form.question_paper_file);
      if (form.suggested_answer_file) fd.append('suggested_answer_file', form.suggested_answer_file);
      await examsAPI.updatePaper(id, fd);
      setSuccess(true);
    } catch (e) {
      const detail = e.response?.data
        ? JSON.stringify(e.response.data)
        : e.message;
      setError('Failed to save: ' + detail);
    } finally {
      setSaving(false);
    }
  };

  // Group subjects by exam_type
  const subjectGroups = subjects.reduce((acc, s) => {
    const t = s.exam_type || 'Other';
    if (!acc[t]) acc[t] = [];
    acc[t].push(s);
    return acc;
  }, {});

  if (loading) return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
      <div className="spinner" />
    </div>
  );

  if (success) return (
    <div className="page">
      <div style={{
        maxWidth: 480, margin: '3rem auto', textAlign: 'center',
        background: '#fff', borderRadius: 20, padding: '2.5rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1.25rem',
          background: 'linear-gradient(135deg,#22c55e,#16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(34,197,94,0.35)',
        }}><Check size={32} color="#fff" /></div>
        <h2 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Paper Updated!</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
          Your changes have been saved successfully.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={() => setSuccess(false)} style={{
            padding: '0.625rem 1.5rem', borderRadius: 10,
            border: '1px solid #e2e8f0', background: '#f8fafc',
            color: '#475569', fontWeight: 700, cursor: 'pointer',
          }}> <Pencil size={14} /> Edit Again</button>
          <button onClick={() => navigate('/admin/papers')} style={{
            padding: '0.625rem 1.75rem', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
            color: '#fff', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
          }}> <ChevronLeft size={16} /> All Papers</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)',
        borderRadius: 18, padding: '1.5rem 2rem', marginBottom: '1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 8px 28px rgba(67,56,202,0.3)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-50, right:-30, width:160, height:160,
          borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ position:'relative' }}>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.68rem',
            textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 4px' }}>Editing Paper</p>
          <h1 style={{ color:'#fff', fontSize:'1.4rem', fontWeight:900, margin:0, lineHeight:1.2 }}>
            Edit Question Paper
          </h1>
        </div>
        <Link to="/admin/papers" style={{
          padding:'0.5rem 1.25rem', borderRadius:10,
          background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)',
          color:'#fff', fontWeight:600, fontSize:'0.8rem', textDecoration:'none',
          position:'relative',
        }}> <ChevronLeft size={16} /> Back to Papers</Link>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background:'#fee2e2', color:'#991b1b', padding:'0.875rem 1.25rem',
          borderRadius:12, marginBottom:'1.25rem', border:'1px solid #fecaca',
          borderLeft:'4px solid #dc2626', fontSize:'0.875rem',
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <span><AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
        </div>
      )}

      {/* ── Form Card ───────────────────────────────────────────────────────── */}
      <div style={{
        background:'#fff', borderRadius:18, border:'1px solid #e2e8f0',
        boxShadow:'0 2px 8px rgba(0,0,0,0.05)', overflow:'hidden',
      }}>
        {/* Card header */}
        <div style={{
          padding:'1.125rem 1.75rem', borderBottom:'1px solid #f1f5f9',
          background:'linear-gradient(90deg,#fafafe,#fff)',
          display:'flex', alignItems:'center', gap:'0.625rem',
        }}>
          <div style={{
            width:32, height:32, borderRadius:9,
            background:'linear-gradient(135deg,#6366f1,#4f46e5)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}><Edit3 size={16} color="#fff" /></div>
          <h2 style={{ margin:0, fontWeight:800, fontSize:'0.95rem', color:'#0f172a' }}>
            Paper Details
          </h2>
        </div>

        <div style={{ padding:'1.75rem' }}>

          {/* Title */}
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#475569',
              textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
              Paper Title <span style={{ color:'#ef4444' }}>*</span>
            </label>
            <input
              className="form-input"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g., CA Final – Financial Reporting Mock Nov 2025"
              style={{ fontSize:'0.95rem', fontWeight:600 }}
            />
          </div>

          {/* Course Name */}
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#475569',
              textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
              Course Name <span style={{ color:'#94a3b8', fontWeight:400, textTransform:'none' }}>(optional — used to group papers in Course Management)</span>
            </label>
            <input
              className="form-input"
              value={form.course_name}
              onChange={e => set('course_name', e.target.value)}
              placeholder="e.g., CA Final, CA Intermediate, Class 10 Science"
            />
          </div>

          {/* Subject + Type */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#475569',
                textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                Subject <span style={{ color:'#ef4444' }}>*</span>
              </label>
              <select className="form-select" value={form.subject}
                onChange={e => set('subject', e.target.value)}
                style={{ border: form.subject ? '2px solid #16a34a' : undefined }}>
                <option value="">— Select Subject —</option>
                {Object.entries(subjectGroups).map(([type, list]) => (
                  <optgroup key={type} label={`── ${type} ──────────────`}>
                    {list.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.code ? `[${s.code}] ` : ''}{s.name}{s.exam_level ? ` · ${s.exam_level}` : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#475569',
                textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                Attempt Type <span style={{ color:'#ef4444' }}>*</span>
              </label>
              <select className="form-select" value={form.attempt_type}
                onChange={e => set('attempt_type', e.target.value)}>
                <option value="mock">Mock Exam</option>
                <option value="practice">Practice</option>
                <option value="past_paper">Past Paper</option>
                <option value="rtp">RTP</option>
                <option value="mtp">MTP</option>
              </select>
            </div>
          </div>

          {/* Session */}
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#475569',
              textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
              Exam Session
            </label>
            <input className="form-input" value={form.exam_session}
              onChange={e => set('exam_session', e.target.value)}
              placeholder="e.g., May 2025, Nov 2024" />
          </div>

          {/* Marks + Duration */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#475569',
                textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                Total Marks <span style={{ color:'#ef4444' }}>*</span>
              </label>
              <input className="form-input" type="number" value={form.total_marks}
                onChange={e => set('total_marks', e.target.value)} placeholder="100" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#475569',
                textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                Duration (minutes) <span style={{ color:'#ef4444' }}>*</span>
              </label>
              <input className="form-input" type="number" value={form.duration_minutes}
                onChange={e => set('duration_minutes', e.target.value)} placeholder="180" />
            </div>
          </div>

          {/* Question Paper PDF */}
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#475569',
              textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
              Question Paper PDF
            </label>
            <DropZone
              label="Drag & drop to replace question paper"
              sublabel="Upload a new PDF to replace the existing one"
              file={form.question_paper_file}
              existingName={existing.qFile}
              onFile={f => set('question_paper_file', f)}
              onRemove={() => set('question_paper_file', null)}
              color="#4f46e5" bg="#eef2ff"
            />
          </div>

          {/* Suggested Answers PDF */}
          <div style={{ marginBottom:'1.5rem' }}>
            <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#475569',
              textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
              Suggested Answers PDF{' '}
              <span style={{ fontWeight:400, color:'#94a3b8', textTransform:'none', letterSpacing:'0', fontSize:'0.72rem' }}>
                (Optional)
              </span>
            </label>
            <DropZone
              label="Drag & drop to replace suggested answers"
              sublabel="Upload a new PDF to replace the existing one"
              file={form.suggested_answer_file}
              existingName={existing.aFile}
              onFile={f => set('suggested_answer_file', f)}
              onRemove={() => set('suggested_answer_file', null)}
              color="#16a34a" bg="#f0fdf4"
            />
          </div>

          {/* Publish toggle */}
          <div style={{
            display:'flex', alignItems:'center', gap:'0.875rem', padding:'0.875rem 1rem',
            background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, marginBottom:'1.75rem',
          }}>
            <div
              onClick={() => set('is_published', !form.is_published)}
              style={{
                width:44, height:24, borderRadius:12, cursor:'pointer', flexShrink:0,
                background: form.is_published ? '#4f46e5' : '#cbd5e1',
                position:'relative', transition:'background 0.25s',
              }}
            >
              <div style={{
                position:'absolute', top:3, left: form.is_published ? 23 : 3,
                width:18, height:18, borderRadius:'50%', background:'#fff',
                transition:'left 0.25s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
            <div>
              <p style={{ margin:0, fontWeight:700, fontSize:'0.875rem', color:'#1e293b' }}>
                {form.is_published ? <><Globe size={14} /> Published — visible to students</> : <><Lock size={14} /> Draft — not visible to students</>}
              </p>
              <p style={{ margin:'1px 0 0', fontSize:'0.72rem', color:'#94a3b8' }}>
                Toggle to publish or unpublish this paper
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
            <button onClick={() => navigate('/admin/papers')} style={{
              padding:'0.65rem 1.5rem', borderRadius:10,
              border:'1px solid #e2e8f0', background:'#f8fafc',
              color:'#64748b', fontWeight:700, fontSize:'0.875rem', cursor:'pointer',
            }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{
              padding:'0.65rem 2rem', borderRadius:10, border:'none',
              background: saving ? '#94a3b8' : 'linear-gradient(135deg,#4f46e5,#6366f1)',
              color:'#fff', fontWeight:800, fontSize:'0.875rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
              display:'flex', alignItems:'center', gap:'0.5rem',
              transition:'all 0.15s',
            }}>
              {saving ? <><Loader2 size={18} className="spin" /> Saving…</> : <><Check size={18} /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
