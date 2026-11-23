import React, { useState } from 'react';
import { X, Edit2, Upload, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { StudentProfile as StudentProfileType, WorkExperience, InternshipExperience, Project, Certification } from '../types/index.ts';
import { supabase } from '../lib/supabase/client';

interface StudentProfileProps {
  student: StudentProfileType;
  onUpdate: (updated: StudentProfileType) => void;
  onClose?: () => void;
  presentation?: 'modal' | 'page';
}

const QUALIFICATION_OPTIONS = ['CA', 'CA_INTER', 'ACCA', 'ACCA_AFFILIATE', 'US_CPA', 'US_CMA', 'CMA_INDIA', 'CS', 'CFA', 'FINANCIAL_MODELING', 'BCOM_MCOM_MBA'];

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ student, onUpdate, onClose, presentation = 'modal' }) => {
  const isPage = presentation === 'page';
  const [form, setForm] = useState<StudentProfileType>({ ...student });
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const completionFields = [
    !!form.name, !!form.email, !!form.phone, !!form.aboutBio,
    form.keySkills.length > 0, !!form.resumeFileName,
    form.qualificationsCompleted.length > 0, form.preferredLocations.length > 0,
    !!form.graduationDegree, !!form.articleshipFirm || form.articleshipCompletedMonths > 0,
  ];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  const set = (key: keyof StudentProfileType, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !form.keySkills.includes(s)) {
      set('keySkills', [...form.keySkills, s]);
    }
    setNewSkill('');
  };

  const removeSkill = (s: string) =>
    set('keySkills', form.keySkills.filter((k) => k !== s));

  const handleResumeUpload = async (file: File) => {
    setUploadingResume(true);
    setUploadError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch('/api/upload-resume', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Upload failed');
      }
      const { url } = await resp.json();
      set('resumeFileName', url || file.name);
    } catch (e: unknown) {
      set('resumeFileName', file.name);
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('Authentication') || msg.includes('Invalid token') || msg.includes('401')) {
        setUploadError('Please verify your email first, then sign out and sign back in to upload.');
      } else {
        setUploadError('Upload failed — resume name saved locally.');
      }
    }
    setUploadingResume(false);
  };

  const handleSave = () => {
    onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setEditingSection(null);
  };

  const toggleQual = (q: string) => {
    const list = form.qualificationsCompleted as string[];
    const updated = list.includes(q) ? list.filter((x) => x !== q) : [...list, q];
    set('qualificationsCompleted', updated as StudentProfileType['qualificationsCompleted']);
  };

  return (
    <div
      style={{
        position: isPage ? 'relative' : 'fixed',
        inset: isPage ? undefined : 0,
        zIndex: isPage ? undefined : 60,
        background: isPage ? 'transparent' : 'rgba(15,36,25,0.45)',
        backdropFilter: isPage ? undefined : 'blur(4px)',
        display: 'flex',
        alignItems: isPage ? 'stretch' : 'flex-start',
        justifyContent: 'center',
        overflowY: isPage ? undefined : 'auto',
        padding: isPage ? '32px 16px 48px' : '24px 16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className="animate-fade-up"
        style={{
          background: '#fff',
          borderRadius: 14,
          maxWidth: isPage ? 860 : 720,
          width: '100%',
          boxShadow: isPage ? '0 8px 28px rgba(15,36,25,0.08)' : '0 24px 64px rgba(15,36,25,0.2)',
          border: isPage ? '1px solid #e5e7eb' : undefined,
          overflow: 'hidden',
        }}
      >
        {/* Profile Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f2419 0%, #1a7a4a 100%)',
            padding: '28px 28px 24px',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#fede6d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 24,
                color: '#0f2419',
                flexShrink: 0,
                border: '3px solid rgba(255,255,255,0.2)',
              }}
            >
              {getInitials(form.name)}
            </div>

            <div style={{ color: '#fff' }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                {form.name}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                {form.arivuproStudentId} · {form.enrollmentCohort}
              </div>
              <span
                className="badge badge-yellow"
                style={{ fontSize: 11, background: 'rgba(254,222,109,0.2)', color: '#fede6d', border: '1px solid rgba(254,222,109,0.4)' }}
              >
                {form.primaryCourse}
              </span>
            </div>
          </div>

          {/* Profile completion bar */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
              <span>Profile Complete</span>
              <span style={{ fontWeight: 700, color: '#fede6d' }}>{completionPct}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 999 }}>
              <div
                style={{
                  height: '100%',
                  width: `${completionPct}%`,
                  background: '#fede6d',
                  borderRadius: 999,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 1. Personal Info */}
          <Section
            title="Personal Information"
            isEditing={editingSection === 'personal'}
            onEdit={() => setEditingSection(editingSection === 'personal' ? null : 'personal')}
          >
            {editingSection === 'personal' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Full Name" value={form.name} onChange={(v) => set('name', v)} />
                <Field label="Email" value={form.email} onChange={(v) => set('email', v)} type="email" />
                <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
                <Field label="Location" value={form.preferredLocations[0] || ''} onChange={(v) => set('preferredLocations', [v, ...form.preferredLocations.slice(1)])} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                <Info label="Name" value={form.name} />
                <Info label="Email" value={form.email} />
                <Info label="Phone" value={form.phone} />
                <Info label="Location" value={form.preferredLocations[0] || '—'} />
              </div>
            )}
          </Section>

          {/* 2. Summary */}
          <Section
            title="Professional Summary"
            isEditing={editingSection === 'summary'}
            onEdit={() => setEditingSection(editingSection === 'summary' ? null : 'summary')}
          >
            {editingSection === 'summary' ? (
              <textarea
                className="input-field"
                rows={4}
                value={form.aboutBio}
                onChange={(e) => set('aboutBio', e.target.value)}
                placeholder="Briefly describe your background, goals, and strengths..."
              />
            ) : (
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65 }}>
                {form.aboutBio || <span style={{ color: '#9ca3af' }}>No summary added yet.</span>}
              </p>
            )}
          </Section>

          {/* 3. Academic Details */}
          <Section
            title="Academic Details"
            isEditing={editingSection === 'academic'}
            onEdit={() => setEditingSection(editingSection === 'academic' ? null : 'academic')}
          >
            {editingSection === 'academic' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={labelSt}>Qualifications Completed</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {QUALIFICATION_OPTIONS.map((q) => {
                      const active = (form.qualificationsCompleted as string[]).includes(q);
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() => toggleQual(q)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: 'Manrope, sans-serif',
                            border: active ? '2px solid #1a7a4a' : '1px solid #e5e7eb',
                            background: active ? '#d7f4ea' : '#fff',
                            color: active ? '#1a7a4a' : '#6b7280',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {active && <CheckCircle2 size={11} />}
                          {q.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Current Level" value={form.currentLevel} onChange={(v) => set('currentLevel', v)} />
                  <Field label="GPA / Score" value={form.gpaOrScore || ''} onChange={(v) => set('gpaOrScore', v)} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Info label="Current Level" value={form.currentLevel} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>Qualifications</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {form.qualificationsCompleted.map((q) => (
                      <span key={q} className="badge badge-green">{q.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* 4. Skills */}
          <Section
            title="Skills"
            isEditing={editingSection === 'skills'}
            onEdit={() => setEditingSection(editingSection === 'skills' ? null : 'skills')}
          >
            {editingSection === 'skills' ? (
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {form.keySkills.map((s) => (
                    <span
                      key={s}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 999,
                        background: '#f0faf4', border: '1px solid #d7f4ea',
                        fontSize: 12, fontWeight: 600, color: '#1a7a4a',
                      }}
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex', lineHeight: 1 }}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input-field"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    placeholder="Add a skill (e.g. IFRS, SAP FICO)"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={addSkill} className="btn-primary" style={{ padding: '8px 14px' }}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {form.keySkills.length > 0
                  ? form.keySkills.map((s) => <span key={s} className="badge badge-mint">{s}</span>)
                  : <span style={{ fontSize: 13, color: '#9ca3af' }}>No skills added.</span>
                }
              </div>
            )}
          </Section>

          {/* 5. Job Preferences */}
          <Section
            title="Job Preferences"
            isEditing={editingSection === 'prefs'}
            onEdit={() => setEditingSection(editingSection === 'prefs' ? null : 'prefs')}
          >
            {editingSection === 'prefs' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Expected Salary (LPA)" value={form.expectedSalaryLPA} onChange={(v) => set('expectedSalaryLPA', v)} />
                <Field label="Preferred Locations (comma-separated)" value={form.preferredLocations.join(', ')} onChange={(v) => set('preferredLocations', v.split(',').map((x) => x.trim()).filter(Boolean))} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Info label="Expected Salary" value={form.expectedSalaryLPA} />
                <Info label="Preferred Locations" value={form.preferredLocations.join(', ')} />
              </div>
            )}
          </Section>

          {/* 6. Documents */}
          <Section
            title="Documents"
            isEditing={editingSection === 'docs'}
            onEdit={() => setEditingSection(editingSection === 'docs' ? null : 'docs')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {uploadingResume ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, background: '#f0faf4', border: '1px solid #d7f4ea' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a7a4a' }}>Uploading…</span>
                </div>
              ) : form.resumeFileName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, background: '#f0faf4', border: '1px solid #d7f4ea' }}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  {form.resumeFileName.startsWith('http') ? (
                    <a
                      href={form.resumeFileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      style={{ fontSize: 13, fontWeight: 600, color: '#1a7a4a', flex: 1, wordBreak: 'break-all', textDecoration: 'underline' }}
                    >
                      View / Download Resume
                    </a>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a7a4a', flex: 1, wordBreak: 'break-all' }}>
                      {form.resumeFileName}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => set('resumeFileName', '')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px', borderRadius: 9,
                    border: '2px dashed #d7f4ea', cursor: 'pointer',
                    justifyContent: 'center', color: '#1a7a4a',
                    fontWeight: 600, fontSize: 13,
                  }}
                >
                  <Upload size={16} />
                  Upload Resume (PDF)
                  <input
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleResumeUpload(file);
                    }}
                  />
                </label>
              )}
              {uploadError && (
                <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 500 }}>{uploadError}</div>
              )}
            </div>
          </Section>

          {/* 7. Exam & Qualification Details */}
          <Section
            title="Exam & Qualification Details"
            isEditing={editingSection === 'exam'}
            onEdit={() => setEditingSection(editingSection === 'exam' ? null : 'exam')}
          >
            {editingSection === 'exam' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={labelSt}>Attempt Count</div>
                  <select className="input-field" value={form.attemptCount || ''} onChange={e => set('attemptCount', e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="first">First attempt</option>
                    <option value="second">Second attempt</option>
                    <option value="multiple">Multiple attempts</option>
                  </select>
                </div>
                <div>
                  <div style={labelSt}>ICITSS Completed</div>
                  <select className="input-field" value={form.icitssCompleted ? 'yes' : 'no'} onChange={e => set('icitssCompleted', e.target.value === 'yes')}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <Field label="LinkedIn URL" value={form.linkedinUrl || ''} onChange={v => set('linkedinUrl', v)} />
                <div>
                  <div style={labelSt}>Joining Availability</div>
                  <select className="input-field" value={form.joiningAvailability || ''} onChange={e => set('joiningAvailability', e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="Immediate">Immediate</option>
                    <option value="1 month">1 month</option>
                    <option value="2 months">2 months</option>
                    <option value="3 months">3 months</option>
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                <Info label="Attempt Count" value={form.attemptCount?.replace('_', ' ') || '—'} />
                <Info label="ICITSS Completed" value={form.icitssCompleted ? 'Yes' : 'No'} />
                <Info label="Joining Availability" value={form.joiningAvailability || '—'} />
                <Info label="LinkedIn" value={form.linkedinUrl || '—'} />
              </div>
            )}
          </Section>

          {/* 8. Education */}
          <Section
            title="Education"
            isEditing={editingSection === 'education'}
            onEdit={() => setEditingSection(editingSection === 'education' ? null : 'education')}
          >
            {editingSection === 'education' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Graduation Degree" value={form.graduationDegree || ''} onChange={v => set('graduationDegree', v)} placeholder="e.g. B.Com" />
                <Field label="College / University" value={form.graduationCollege || ''} onChange={v => set('graduationCollege', v)} />
                <Field label="Graduation Year" value={String(form.graduationYear || '')} onChange={v => set('graduationYear', parseInt(v) || undefined)} type="number" />
                <Field label="Graduation %" value={form.graduationPercent || ''} onChange={v => set('graduationPercent', v)} placeholder="e.g. 78.5" />
                <Field label="12th / HSC %" value={form.twelfthPercent || ''} onChange={v => set('twelfthPercent', v)} placeholder="e.g. 82.0" />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                <Info label="Degree" value={form.graduationDegree || '—'} />
                <Info label="College" value={form.graduationCollege || '—'} />
                <Info label="Year" value={String(form.graduationYear || '—')} />
                <Info label="Graduation %" value={form.graduationPercent || '—'} />
                <Info label="12th %" value={form.twelfthPercent || '—'} />
              </div>
            )}
          </Section>

          {/* 9. Articleship Details */}
          <Section
            title="Articleship / Training"
            isEditing={editingSection === 'articleship'}
            onEdit={() => setEditingSection(editingSection === 'articleship' ? null : 'articleship')}
          >
            {editingSection === 'articleship' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Firm Name" value={form.articleshipFirm || ''} onChange={v => set('articleshipFirm', v)} placeholder="e.g. Deloitte India" />
                <div>
                  <div style={labelSt}>Firm Type</div>
                  <select className="input-field" value={form.articleshipFirmType || ''} onChange={e => set('articleshipFirmType', e.target.value)}>
                    <option value="">— Select —</option>
                    <option>Big 4</option>
                    <option>Mid-tier</option>
                    <option>Small firm</option>
                  </select>
                </div>
                <Field label="Months Completed" value={String(form.articleshipCompletedMonths || 0)} onChange={v => set('articleshipCompletedMonths', parseInt(v) || 0)} type="number" />
                <Field label="Areas (comma-separated)" value={(form.articleshipAreas || []).join(', ')} onChange={v => set('articleshipAreas', v.split(',').map((x: string) => x.trim()).filter(Boolean))} placeholder="Audit, Tax, MCA filings" />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                <Info label="Firm" value={form.articleshipFirm || '—'} />
                <Info label="Type" value={form.articleshipFirmType || '—'} />
                <Info label="Months" value={String(form.articleshipCompletedMonths || 0)} />
                <Info label="Areas" value={(form.articleshipAreas || []).join(', ') || '—'} />
              </div>
            )}
          </Section>

          {/* 10. Work Experience */}
          <Section
            title="Work Experience"
            isEditing={editingSection === 'work'}
            onEdit={() => setEditingSection(editingSection === 'work' ? null : 'work')}
          >
            {editingSection === 'work' ? (
              <div>
                {(form.workExperience || []).map((exp: WorkExperience, i: number) => (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 10, position: 'relative' }}>
                    <button type="button" onClick={() => set('workExperience', (form.workExperience || []).filter((_: WorkExperience, j: number) => j !== i))}
                      style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
                      <Trash2 size={13} />
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Field label="Company" value={exp.company} onChange={v => { const a = [...(form.workExperience || [])]; a[i] = { ...a[i], company: v }; set('workExperience', a); }} />
                      <Field label="Role" value={exp.role} onChange={v => { const a = [...(form.workExperience || [])]; a[i] = { ...a[i], role: v }; set('workExperience', a); }} />
                      <Field label="From (MM/YYYY)" value={exp.startMonth} onChange={v => { const a = [...(form.workExperience || [])]; a[i] = { ...a[i], startMonth: v }; set('workExperience', a); }} />
                      <Field label="To (MM/YYYY or Present)" value={exp.endMonth} onChange={v => { const a = [...(form.workExperience || [])]; a[i] = { ...a[i], endMonth: v }; set('workExperience', a); }} />
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <div style={labelSt}>Description</div>
                      <textarea className="input-field" rows={2} value={exp.description} onChange={e => { const a = [...(form.workExperience || [])]; a[i] = { ...a[i], description: e.target.value }; set('workExperience', a); }} />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => set('workExperience', [...(form.workExperience || []), { company: '', role: '', startMonth: '', endMonth: '', description: '' }])}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px dashed #d7f4ea', background: '#f0faf4', color: '#1a7a4a', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>
                  <Plus size={14} /> Add Experience
                </button>
              </div>
            ) : (
              (form.workExperience || []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(form.workExperience || []).map((exp: WorkExperience, i: number) => (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: 9, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2419' }}>{exp.role} · {exp.company}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{exp.startMonth} – {exp.endMonth}</div>
                      {exp.description && <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>{exp.description}</div>}
                    </div>
                  ))}
                </div>
              ) : <span style={{ fontSize: 13, color: '#9ca3af' }}>No work experience added.</span>
            )}
          </Section>

          {/* 11. Internship Experience */}
          <Section
            title="Internship Experience"
            isEditing={editingSection === 'internship'}
            onEdit={() => setEditingSection(editingSection === 'internship' ? null : 'internship')}
          >
            {editingSection === 'internship' ? (
              <div>
                {(form.internshipExperience || []).map((exp: InternshipExperience, i: number) => (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 10, position: 'relative' }}>
                    <button type="button" onClick={() => set('internshipExperience', (form.internshipExperience || []).filter((_: InternshipExperience, j: number) => j !== i))}
                      style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
                      <Trash2 size={13} />
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Field label="Company" value={exp.company} onChange={v => { const a = [...(form.internshipExperience || [])]; a[i] = { ...a[i], company: v }; set('internshipExperience', a); }} />
                      <Field label="Role" value={exp.role} onChange={v => { const a = [...(form.internshipExperience || [])]; a[i] = { ...a[i], role: v }; set('internshipExperience', a); }} />
                      <Field label="From" value={exp.startMonth} onChange={v => { const a = [...(form.internshipExperience || [])]; a[i] = { ...a[i], startMonth: v }; set('internshipExperience', a); }} />
                      <Field label="To" value={exp.endMonth} onChange={v => { const a = [...(form.internshipExperience || [])]; a[i] = { ...a[i], endMonth: v }; set('internshipExperience', a); }} />
                      <Field label="Stipend (₹/mo)" value={exp.stipend} onChange={v => { const a = [...(form.internshipExperience || [])]; a[i] = { ...a[i], stipend: v }; set('internshipExperience', a); }} />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => set('internshipExperience', [...(form.internshipExperience || []), { company: '', role: '', startMonth: '', endMonth: '', stipend: '', description: '' }])}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px dashed #d7f4ea', background: '#f0faf4', color: '#1a7a4a', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>
                  <Plus size={14} /> Add Internship
                </button>
              </div>
            ) : (
              (form.internshipExperience || []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(form.internshipExperience || []).map((exp: InternshipExperience, i: number) => (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: 9, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2419' }}>{exp.role} · {exp.company}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{exp.startMonth} – {exp.endMonth}{exp.stipend ? ` · ₹${exp.stipend}/mo` : ''}</div>
                    </div>
                  ))}
                </div>
              ) : <span style={{ fontSize: 13, color: '#9ca3af' }}>No internships added.</span>
            )}
          </Section>

          {/* 12. Projects */}
          <Section
            title="Projects"
            isEditing={editingSection === 'projects'}
            onEdit={() => setEditingSection(editingSection === 'projects' ? null : 'projects')}
          >
            {editingSection === 'projects' ? (
              <div>
                {(form.projects || []).map((proj: Project, i: number) => (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 10, position: 'relative' }}>
                    <button type="button" onClick={() => set('projects', (form.projects || []).filter((_: Project, j: number) => j !== i))}
                      style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
                      <Trash2 size={13} />
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Field label="Project Title" value={proj.title} onChange={v => { const a = [...(form.projects || [])]; a[i] = { ...a[i], title: v }; set('projects', a); }} />
                      <Field label="Your Role" value={proj.role} onChange={v => { const a = [...(form.projects || [])]; a[i] = { ...a[i], role: v }; set('projects', a); }} />
                      <Field label="Outcome / Impact" value={proj.outcome} onChange={v => { const a = [...(form.projects || [])]; a[i] = { ...a[i], outcome: v }; set('projects', a); }} />
                      <Field label="URL (optional)" value={proj.url || ''} onChange={v => { const a = [...(form.projects || [])]; a[i] = { ...a[i], url: v }; set('projects', a); }} />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => set('projects', [...(form.projects || []), { title: '', role: '', outcome: '', url: '' }])}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px dashed #d7f4ea', background: '#f0faf4', color: '#1a7a4a', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>
                  <Plus size={14} /> Add Project
                </button>
              </div>
            ) : (
              (form.projects || []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(form.projects || []).map((proj: Project, i: number) => (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: 9, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2419' }}>{proj.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{proj.role} · {proj.outcome}</div>
                    </div>
                  ))}
                </div>
              ) : <span style={{ fontSize: 13, color: '#9ca3af' }}>No projects added.</span>
            )}
          </Section>

          {/* 13. Certifications */}
          <Section
            title="Certifications"
            isEditing={editingSection === 'certs'}
            onEdit={() => setEditingSection(editingSection === 'certs' ? null : 'certs')}
          >
            {editingSection === 'certs' ? (
              <div>
                {(form.certifications || []).map((cert: Certification, i: number) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 32px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                    <Field label="Certification Name" value={cert.name} onChange={v => { const a = [...(form.certifications || [])]; a[i] = { ...a[i], name: v }; set('certifications', a); }} />
                    <Field label="Issuer" value={cert.issuer} onChange={v => { const a = [...(form.certifications || [])]; a[i] = { ...a[i], issuer: v }; set('certifications', a); }} />
                    <Field label="Year" value={cert.year} onChange={v => { const a = [...(form.certifications || [])]; a[i] = { ...a[i], year: v }; set('certifications', a); }} />
                    <button type="button" onClick={() => set('certifications', (form.certifications || []).filter((_: Certification, j: number) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0 0 8px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => set('certifications', [...(form.certifications || []), { name: '', issuer: '', year: '' }])}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px dashed #d7f4ea', background: '#f0faf4', color: '#1a7a4a', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>
                  <Plus size={14} /> Add Certification
                </button>
              </div>
            ) : (
              (form.certifications || []).length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(form.certifications || []).map((cert: Certification, i: number) => (
                    <span key={i} className="badge badge-mint">{cert.name} · {cert.issuer} {cert.year}</span>
                  ))}
                </div>
              ) : <span style={{ fontSize: 13, color: '#9ca3af' }}>No certifications added.</span>
            )}
          </Section>

          {/* Save button */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button onClick={handleSave} className="btn-primary" style={{ gap: 8 }}>
              {saved ? <><CheckCircle2 size={14} /> Saved!</> : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function Section({
  title,
  isEditing,
  onEdit,
  children,
}: {
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: '#fafafa',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2419' }}>{title}</span>
        <button
          type="button"
          onClick={onEdit}
          style={{
            background: isEditing ? '#f0faf4' : 'none',
            border: isEditing ? '1px solid #d7f4ea' : 'none',
            cursor: 'pointer',
            borderRadius: 6,
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: isEditing ? '#1a7a4a' : '#6b7280',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Manrope, sans-serif',
          }}
        >
          <Edit2 size={12} />
          {isEditing ? 'Done' : 'Edit'}
        </button>
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={labelSt}>{label}</label>
      <input
        type={type}
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: '#0f2419', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

const labelSt: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 5,
  fontFamily: 'Manrope, sans-serif',
};
