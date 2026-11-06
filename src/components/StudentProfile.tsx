import React, { useState } from 'react';
import { X, Edit2, Upload, Plus, CheckCircle2 } from 'lucide-react';
import { StudentProfile as StudentProfileType } from '../types/index.ts';

interface StudentProfileProps {
  student: StudentProfileType;
  onUpdate: (updated: StudentProfileType) => void;
  onClose?: () => void;
}

const QUALIFICATION_OPTIONS = ['CA', 'CA_INTER', 'ACCA', 'ACCA_AFFILIATE', 'US_CPA', 'US_CMA', 'CMA_INDIA', 'CS', 'CFA', 'FINANCIAL_MODELING', 'BCOM_MCOM_MBA'];

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ student, onUpdate, onClose }) => {
  const [form, setForm] = useState<StudentProfileType>({ ...student });
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [saved, setSaved] = useState(false);

  const completionFields = [
    !!form.name, !!form.email, !!form.phone, !!form.aboutBio,
    form.keySkills.length > 0, !!form.resumeFileName,
    form.qualificationsCompleted.length > 0, form.preferredLocations.length > 0,
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
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(15,36,25,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '24px 16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className="animate-fade-up"
        style={{
          background: '#fff',
          borderRadius: 14,
          maxWidth: 720,
          width: '100%',
          boxShadow: '0 24px 64px rgba(15,36,25,0.2)',
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
              {form.resumeFileName ? (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 9,
                    background: '#f0faf4', border: '1px solid #d7f4ea',
                  }}
                >
                  <span style={{ fontSize: 20 }}>📄</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a7a4a', flex: 1 }}>
                    {form.resumeFileName}
                  </span>
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
                      if (file) set('resumeFileName', file.name);
                    }}
                  />
                </label>
              )}
            </div>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label style={labelSt}>{label}</label>
      <input
        type={type}
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
