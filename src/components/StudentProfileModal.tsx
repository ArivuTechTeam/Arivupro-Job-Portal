import React, { useState } from 'react';
import { X, UserCheck, ShieldCheck, CheckCircle2, GraduationCap, FileText, Briefcase, Sparkles } from 'lucide-react';
import { StudentProfile, QualificationType } from '../types/index.ts';
import { QUALIFICATIONS_METADATA } from '../data/qualificationConstants.ts';

interface StudentProfileModalProps {
  student: StudentProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (updated: StudentProfile) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose,
  onUpdateProfile
}) => {
  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [studentId, setStudentId] = useState(student.arivuproStudentId);
  const [cohort, setCohort] = useState(student.enrollmentCohort);
  const [currentLevel, setCurrentLevel] = useState(student.currentLevel);
  const [articleshipMonths, setArticleshipMonths] = useState(student.articleshipCompletedMonths);
  const [selectedQuals, setSelectedQuals] = useState<QualificationType[]>(student.qualificationsCompleted);
  const [skillsText, setSkillsText] = useState(student.keySkills.join(', '));
  const [expectedCtc, setExpectedCtc] = useState(student.expectedSalaryLPA);
  const [aboutBio, setAboutBio] = useState(student.aboutBio);

  if (!isOpen) return null;

  const handleToggleQual = (q: QualificationType) => {
    if (selectedQuals.includes(q)) {
      setSelectedQuals(selectedQuals.filter((item) => item !== q));
    } else {
      setSelectedQuals([...selectedQuals, q]);
    }
  };

  const handleApplyPersona = (preset: 'acca_cpa' | 'ca_inter' | 'ca_final' | 'us_cma') => {
    if (preset === 'acca_cpa') {
      setName('Rohan Venkatesh');
      setEmail('rohan.v@arivupro.student.in');
      setStudentId('ARV-2024-ACCA-882');
      setCohort('ACCA Strategic Professional (Batch 2024-BLR)');
      setCurrentLevel('ACCA 11/13 Papers Cleared & US CPA 2/4 Passed');
      setSelectedQuals(['ACCA', 'US_CPA', 'CA_INTER', 'FINANCIAL_MODELING', 'BCOM_MCOM_MBA']);
      setArticleshipMonths(18);
      setSkillsText('IFRS, US GAAP, Statutory Audit, Financial Modeling, Ind AS, Advanced Excel, SAP FICO');
      setExpectedCtc('8.5 - 11 LPA');
      setAboutBio('Passionate finance scholar at ArivuPro Academy with strong foundation in IFRS and US GAAP. Completed 18 months of intensive audit articleship.');
    } else if (preset === 'ca_inter') {
      setName('Sneha Iyer');
      setEmail('sneha.iyer@arivupro.student.in');
      setStudentId('ARV-2025-CAINT-412');
      setCohort('CA Intermediate (Both Groups Cleared)');
      setCurrentLevel('Seeking 2-Year Mandatory Articleship');
      setSelectedQuals(['CA_INTER', 'BCOM_MCOM_MBA']);
      setArticleshipMonths(0);
      setSkillsText('Ind AS, Tax Audit, Vouching, TallyPrime, Advanced Excel, Form 3CD, TDS Reconciliation');
      setExpectedCtc('₹22,000 - ₹35,000 / month Stipend');
      setAboutBio('ArivuPro CA Intermediate student cleared both groups in first attempt. Eager to join a leading audit firm for comprehensive statutory and tax audit articleship.');
    } else if (preset === 'ca_final') {
      setName('Vikramaditya Rao');
      setEmail('vikram.rao@arivupro.alumni.in');
      setStudentId('ARV-2023-CAFIN-109');
      setCohort('Chartered Accountant (Final Cleared - Nov 2025)');
      setCurrentLevel('Qualified Chartered Accountant');
      setSelectedQuals(['CA', 'CA_INTER', 'CFA', 'FINANCIAL_MODELING']);
      setArticleshipMonths(36);
      setSkillsText('Financial Modeling, Ind AS, DCF Valuation, CARO 2020, Transfer Pricing, M&A');
      setExpectedCtc('14.0 - 20.0 LPA');
      setAboutBio('Chartered Accountant with 3 years Big 4 audit articleship experience. Completed ArivuPro financial modeling and CFA Level 1.');
    } else if (preset === 'us_cma') {
      setName('Ananya Sen');
      setEmail('ananya.sen@arivupro.student.in');
      setStudentId('ARV-2024-CMA-671');
      setCohort('US CMA & CMA India Dual Track');
      setCurrentLevel('US CMA Both Parts Cleared');
      setSelectedQuals(['US_CMA', 'CMA_INDIA', 'BCOM_MCOM_MBA']);
      setArticleshipMonths(12);
      setSkillsText('Standard Costing, Variance Analysis, SAP CO Module, Activity Based Costing, Budgeting');
      setExpectedCtc('8.0 - 11.5 LPA');
      setAboutBio('Management accountant trained at ArivuPro specializing in corporate costing, variance analysis, and plant gross margin optimization.');
    }
  };

  const handleSave = () => {
    const updated: StudentProfile = {
      ...student,
      name,
      email,
      arivuproStudentId: studentId,
      enrollmentCohort: cohort,
      currentLevel,
      qualificationsCompleted: selectedQuals,
      articleshipCompletedMonths: Number(articleshipMonths) || 0,
      keySkills: skillsText.split(',').map((s) => s.trim()).filter(Boolean),
      expectedSalaryLPA: expectedCtc,
      aboutBio
    };

    onUpdateProfile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 text-amber-700 flex items-center justify-center font-bold text-sm">
              {name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">{name}</h3>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>ArivuPro Verified Student</span>
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {studentId} · {cohort}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Personas (quick switch for demonstration) */}
        <div className="p-4 bg-amber-50/70 border-b border-amber-200/80 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Test Different ArivuPro Student Cohorts & Watch AI Matches Adapt:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleApplyPersona('acca_cpa')}
              className="p-2 rounded bg-white border border-amber-200 hover:border-amber-400 text-left transition-colors"
            >
              <div className="font-bold text-slate-900 truncate">Rohan (ACCA + CPA)</div>
              <div className="text-[10px] text-slate-500">Big 4 Audit & US Tax</div>
            </button>

            <button
              onClick={() => handleApplyPersona('ca_inter')}
              className="p-2 rounded bg-white border border-amber-200 hover:border-amber-400 text-left transition-colors"
            >
              <div className="font-bold text-slate-900 truncate">Sneha (CA Inter)</div>
              <div className="text-[10px] text-slate-500">Articleship Seeker</div>
            </button>

            <button
              onClick={() => handleApplyPersona('ca_final')}
              className="p-2 rounded bg-white border border-amber-200 hover:border-amber-400 text-left transition-colors"
            >
              <div className="font-bold text-slate-900 truncate">Vikram (CA Final)</div>
              <div className="text-[10px] text-slate-500">IB & M&A Valuation</div>
            </button>

            <button
              onClick={() => handleApplyPersona('us_cma')}
              className="p-2 rounded bg-white border border-amber-200 hover:border-amber-400 text-left transition-colors"
            >
              <div className="font-bold text-slate-900 truncate">Ananya (US CMA)</div>
              <div className="text-[10px] text-slate-500">Plant Costing & FP&A</div>
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-900 mb-1">Full Student Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-900 mb-1">ArivuPro Student Roll / ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-900 mb-1">Current ArivuPro Cohort</label>
              <input
                type="text"
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-900 mb-1">Articleship Completed (Months)</label>
              <input
                type="number"
                value={articleshipMonths}
                onChange={(e) => setArticleshipMonths(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono"
              />
            </div>
          </div>

          {/* Cleared Qualifications Tags */}
          <div>
            <label className="block font-semibold text-slate-900 mb-1.5">
              Completed Qualifications & Papers Cleared
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(QUALIFICATIONS_METADATA).map((codeKey) => {
                const q = codeKey as QualificationType;
                const isSelected = selectedQuals.includes(q);
                return (
                  <button
                    type="button"
                    key={q}
                    onClick={() => handleToggleQual(q)}
                    className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold flex items-center gap-1'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    <span>{QUALIFICATIONS_METADATA[q]?.shortName || q}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Skills */}
          <div>
            <label className="block font-semibold text-slate-900 mb-1">
              Key Practical Skills (Taught at ArivuPro)
            </label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="e.g. IFRS 15, US GAAP, Statutory Audit, Financial Modeling"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
            />
          </div>

          {/* Expected CTC & About */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-900 mb-1">Expected Salary / Stipend</label>
              <input
                type="text"
                value={expectedCtc}
                onChange={(e) => setExpectedCtc(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-900 mb-1">Verified Resume Document</label>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-600 flex items-center justify-between">
                <span className="truncate">{student.resumeFileName || 'ArivuPro_Student_CV.pdf'}</span>
                <span className="font-mono text-[10px] text-emerald-700 font-bold">Uploaded</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-900 mb-1">Career Bio / Summary</label>
            <textarea
              rows={2}
              value={aboutBio}
              onChange={(e) => setAboutBio(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors shadow-sm"
          >
            Save Profile & Update Matching
          </button>
        </div>

      </div>
    </div>
  );
};
