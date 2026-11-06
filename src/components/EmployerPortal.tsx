import React, { useState, useEffect } from 'react';
import { Building2, PlusCircle, CheckCircle2, ShieldCheck, Clock, Users, ArrowRight, Filter, Sparkles, Send, AlertTriangle, FileText, Calendar, ExternalLink } from 'lucide-react';
import { JobListing, JobApplication, RegisteredCompany, QualificationType } from '../types/index.ts';
import { QUALIFICATIONS_METADATA } from '../data/qualificationConstants.ts';

interface EmployerPortalProps {
  companies: RegisteredCompany[];
  applications: JobApplication[];
  onJobCreated: (newJob: Partial<JobListing>) => Promise<any>;
  onCompanyRegistered: (companyData: any) => Promise<any>;
  onUpdateApplicationStatus: (appId: string, status: string, notes?: string) => Promise<any>;
}

export const EmployerPortal: React.FC<EmployerPortalProps> = ({
  companies,
  applications,
  onJobCreated,
  onCompanyRegistered,
  onUpdateApplicationStatus
}) => {
  const [activeTab, setActiveTab] = useState<'ats' | 'postJob' | 'verification'>('ats');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || 'comp-deloitte');

  // New Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(companies[0]?.name || 'Deloitte India (Offshore Delivery)');
  const [location, setLocation] = useState('Bangalore, Karnataka');
  const [city, setCity] = useState('Bangalore');
  const [workplaceType, setWorkplaceType] = useState<'Hybrid' | 'Onsite' | 'Remote'>('Hybrid');
  const [jobType, setJobType] = useState<'Full-Time' | 'Articleship / Industrial Training' | 'Contract'>('Full-Time');
  const [experienceLevel, setExperienceLevel] = useState<'0-1 yr (Fresher)' | 'Articleship / 0 yrs' | '1-3 yrs' | '3-5 yrs' | '5+ yrs'>('0-1 yr (Fresher)');
  const [minExpYears, setMinExpYears] = useState(0);
  const [salaryText, setSalaryText] = useState('₹8.0 - ₹11.0 LPA');
  const [department, setDepartment] = useState<'Audit & Assurance' | 'Taxation' | 'FP&A & Corporate Finance' | 'Investment Banking & M&A' | 'Global Accounting (US GAAP/IFRS)' | 'Risk & Compliance' | 'Articleship Desk'>('Audit & Assurance');
  const [industry, setIndustry] = useState('Big 4 Advisory & Professional Services');
  const [selectedQualifications, setSelectedQualifications] = useState<QualificationType[]>(['ACCA', 'US_CPA']);
  const [mandatorySkillsText, setMandatorySkillsText] = useState('US GAAP, IFRS, Financial Audit, Advanced Excel');
  const [description, setDescription] = useState('');
  const [isArivuproExclusive, setIsArivuproExclusive] = useState(true);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [jobSuccessMessage, setJobSuccessMessage] = useState<string | null>(null);

  // Company Registration Form State
  const [regName, setRegName] = useState('');
  const [regLegalName, setRegLegalName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regIndustry, setRegIndustry] = useState('Global Capability Center (GCC) / Finance');
  const [regGstin, setRegGstin] = useState('');
  const [regWebsite, setRegWebsite] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Selected Candidate Modal
  const [selectedAppForAction, setSelectedAppForAction] = useState<JobApplication | null>(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [newStatusChoice, setNewStatusChoice] = useState('');

  const currentCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];

  // Filter applications for this company
  const companyApps = applications.filter((app) =>
    app.company.toLowerCase().includes(currentCompany?.name?.toLowerCase() || '') ||
    (currentCompany?.name?.toLowerCase() || '').includes(app.company.toLowerCase())
  );

  const handleToggleQual = (q: QualificationType) => {
    if (selectedQualifications.includes(q)) {
      setSelectedQualifications(selectedQualifications.filter((item) => item !== q));
    } else {
      setSelectedQualifications([...selectedQualifications, q]);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !salaryText) return;

    setIsSubmittingJob(true);
    setJobSuccessMessage(null);

    const mandatorySkills = mandatorySkillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await onJobCreated({
        title: jobTitle,
        company: selectedCompany,
        location,
        city,
        workplaceType,
        jobType,
        experienceLevel,
        minExperienceYears: minExpYears,
        salaryText,
        department,
        qualifications: selectedQualifications,
        mandatorySkills,
        goodToHaveSkills: ['ERP', 'PowerBI', 'Financial Modeling'],
        description: description || `Opportunity at ${selectedCompany} for ArivuPro students specializing in ${department}.`,
        keyResponsibilities: [
          'Direct client engagement and technical deliverable execution',
          'Application of relevant accounting and regulatory standards (Ind AS / US GAAP / IFRS)',
          'Participation in audit committees and management update reviews'
        ],
        arivuproExclusive: isArivuproExclusive,
        isUrgent: true
      });

      setJobSuccessMessage('Opening successfully published and indexed into student portal!');
      setJobTitle('');
      setDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regName || !regEmail || !regGstin) {
      setRegError('Please provide company name, official corporate email, and GSTIN/CIN.');
      return;
    }

    try {
      const res = await onCompanyRegistered({
        name: regName,
        legalName: regLegalName || regName,
        workEmail: regEmail,
        industry: regIndustry,
        cinOrGstin: regGstin,
        website: regWebsite,
        contactPerson: regContact
      });

      setRegSuccess(res.message);
      setRegName('');
      setRegEmail('');
      setRegGstin('');
    } catch (err: any) {
      setRegError(err.message || 'Verification failed');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedAppForAction || !newStatusChoice) return;
    await onUpdateApplicationStatus(selectedAppForAction.id, newStatusChoice, statusUpdateNote);
    setSelectedAppForAction(null);
    setStatusUpdateNote('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Company Switcher */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display">
              Employer Hiring Hub & Applicant Tracking System (ATS)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming ArivuPro student candidates, post verified job requisitions, and synchronize hiring stages with campus CRM.
          </p>
        </div>

        {/* Company Active Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Active Employer:</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value);
              const comp = companies.find((c) => c.id === e.target.value);
              if (comp) setSelectedCompany(comp.name);
            }}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.verificationStatus})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center border-b border-slate-200 gap-6 text-xs font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('ats')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'ats'
              ? 'border-amber-500 text-slate-900 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-slate-700" />
          <span>Candidate Applications Tracker ({companyApps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('postJob')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'postJob'
              ? 'border-amber-500 text-slate-900 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-slate-700" />
          <span>Post New Finance Opening</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'verification'
              ? 'border-amber-500 text-slate-900 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Company Verification & MoU Register</span>
        </button>
      </div>

      {/* TAB 1: ATS / APPLICATION TRACKER FOR EMPLOYER */}
      {activeTab === 'ats' && (
        <div className="space-y-6">
          
          {/* Company verification badge status */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-900 font-mono">
                {currentCompany?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{currentCompany?.name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    currentCompany?.verificationStatus === 'MoU Partner'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : currentCompany?.verificationStatus === 'Verified'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {currentCompany?.verificationStatus}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  GSTIN / CIN: <span className="font-mono text-slate-700">{currentCompany?.cinOrGstin}</span> · Contact: {currentCompany?.contactPerson}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-semibold text-slate-900 font-mono">{companyApps.length}</span> candidates in pipeline
            </div>
          </div>

          {/* Candidates Table ranked by AI Match Score */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  AI-Ranked Candidates (Ranked by ArivuPro Experience & Certification Fit)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Sorted by Fit Score & Certification match
              </span>
            </div>

            {companyApps.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="font-semibold text-slate-700">No applications received yet for this company profile.</div>
                <div>Post an opening or switch company profile to review active candidates.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Candidate & Roll No</th>
                      <th className="py-3 px-4">Course Track</th>
                      <th className="py-3 px-4">Target Role</th>
                      <th className="py-3 px-4">AI Fit Score</th>
                      <th className="py-3 px-4">Current ATS Stage</th>
                      <th className="py-3 px-4">CRM Lead</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {companyApps
                      .sort((a, b) => b.aiMatchScore - a.aiMatchScore)
                      .map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{app.studentName}</div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {app.studentRoll}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {app.studentCourse}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {app.jobTitle}
                          </td>
                          <td className="py-3 px-4">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 tabular-nums">
                              <span>{app.aiMatchScore}%</span>
                              <span className="text-[10px]">({app.matchGrade})</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                            {app.crmLeadId}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedAppForAction(app);
                                setNewStatusChoice(app.status);
                              }}
                              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-[11px] transition-colors"
                            >
                              Manage Stage
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal for Managing Candidate Stage */}
          {selectedAppForAction && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Advance Candidate Stage: {selectedAppForAction.studentName}
                  </h4>
                  <button
                    onClick={() => setSelectedAppForAction(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Update ATS Hiring Stage:
                    </label>
                    <select
                      value={newStatusChoice}
                      onChange={(e) => setNewStatusChoice(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 font-medium"
                    >
                      <option value="Applied">Applied</option>
                      <option value="ArivuPro Review">ArivuPro Placement Review</option>
                      <option value="Recruiter Screen">Recruiter Screened</option>
                      <option value="Technical Round">Technical Interview Round</option>
                      <option value="Partner Interview">Partner / Director Round</option>
                      <option value="Offer Released">Offer Released</option>
                      <option value="Placed">Joined / Placed</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Interview Notes / Feedback:
                    </label>
                    <textarea
                      rows={3}
                      value={statusUpdateNote}
                      onChange={(e) => setStatusUpdateNote(e.target.value)}
                      placeholder="Add interviewer remarks or schedule details..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedAppForAction(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    className="px-4 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded"
                  >
                    Save & Sync with CRM
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: POST NEW JOB */}
      {activeTab === 'postJob' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h3 className="text-base font-bold text-slate-900">
              Create Curated Finance Role Requisition
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify certifications, ArivuPro skills, and salary bracket. Verified posts are broadcasted directly to qualified student batches.
            </p>
          </div>

          {jobSuccessMessage && (
            <div className="mb-5 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{jobSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateJob} className="space-y-5 text-xs">
            
            {/* Row 1: Role Title & Employer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Job Role Title *
                </label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Associate - US Statutory Audit (IFRS / US GAAP)"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Hiring Organization / Employer
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Department, Industry, Opportunity Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Finance Practice Area *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                >
                  <option value="Audit & Assurance">Audit & Assurance</option>
                  <option value="Taxation">Corporate & Cross-Border Tax</option>
                  <option value="FP&A & Corporate Finance">FP&A & Corporate Finance</option>
                  <option value="Investment Banking & M&A">Investment Banking & M&A</option>
                  <option value="Global Accounting (US GAAP/IFRS)">Global Accounting (US GAAP/IFRS)</option>
                  <option value="Risk & Compliance">Risk & Compliance</option>
                  <option value="Articleship Desk">Articleship Desk (CA / CMA / CS)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Industry Segment
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Job Classification
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                >
                  <option value="Full-Time">Full-Time Professional</option>
                  <option value="Articleship / Industrial Training">CA/CMA Articleship Trainee</option>
                  <option value="Contract">Fixed-Term Contract</option>
                </select>
              </div>
            </div>

            {/* Row 3: Required Certifications Multi-select */}
            <div>
              <label className="block font-semibold text-slate-900 mb-1.5">
                Eligible Professional Certifications (Select all that apply) *
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(QUALIFICATIONS_METADATA).map((codeKey) => {
                  const q = codeKey as QualificationType;
                  const isSelected = selectedQualifications.includes(q);
                  return (
                    <button
                      type="button"
                      key={q}
                      onClick={() => handleToggleQual(q)}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-amber-100 text-amber-950 border-amber-300 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {QUALIFICATIONS_METADATA[q]?.shortName || q}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Compensation & Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Salary / Compensation Range *
                </label>
                <input
                  type="text"
                  required
                  value={salaryText}
                  onChange={(e) => setSalaryText(e.target.value)}
                  placeholder="e.g. ₹8.5 - ₹12.0 LPA or ₹25,000 / mo"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Location (City)
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bangalore, Mumbai"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Workplace Arrangement
                </label>
                <select
                  value={workplaceType}
                  onChange={(e) => setWorkplaceType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                >
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            {/* Row 5: Mandatory Skills */}
            <div>
              <label className="block font-semibold text-slate-900 mb-1">
                Mandatory Technical Skills (Comma separated)
              </label>
              <input
                type="text"
                value={mandatorySkillsText}
                onChange={(e) => setMandatorySkillsText(e.target.value)}
                placeholder="e.g. Ind AS 115, US GAAP, Financial Modeling, SAP FICO, Tally"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
              />
            </div>

            {/* Row 6: Description */}
            <div>
              <label className="block font-semibold text-slate-900 mb-1">
                Detailed Role Overview & Scope of Work
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Outline team mandate, client profile, and growth opportunities..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
              />
            </div>

            {/* ArivuPro Exclusive checkbox */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded flex items-center gap-2">
              <input
                type="checkbox"
                id="exclusiveCheck"
                checked={isArivuproExclusive}
                onChange={(e) => setIsArivuproExclusive(e.target.checked)}
                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="exclusiveCheck" className="text-xs text-amber-950 font-semibold cursor-pointer">
                Publish as ArivuPro Priority Campus Drive (Exclusive pre-scheduled interviews for enrolled students)
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmittingJob}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingJob ? 'Publishing...' : 'Publish Requisition'}</span>
            </button>

          </form>
        </div>
      )}

      {/* TAB 3: COMPANY VERIFICATION REGISTER */}
      {activeTab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Register new company form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Company Onboarding & Verification Request
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                To prevent fraudulent postings, corporate domain emails (@deloitte.com, @pwc.com) and valid CIN/GSTIN identifiers are validated.
              </p>
            </div>

            {regError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {regError}
              </div>
            )}
            {regSuccess && (
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {regSuccess}
              </div>
            )}

            <form onSubmit={handleRegisterCompany} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company Display Name *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. EY Global Delivery Services"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Official Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="campus.recruitment@ey.com (No @gmail)"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">GSTIN / Corporate CIN *</label>
                <input
                  type="text"
                  required
                  value={regGstin}
                  onChange={(e) => setRegGstin(e.target.value)}
                  placeholder="e.g. 29AAACD4981E1Z8 (15 characters)"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Industry Sector</label>
                <input
                  type="text"
                  value={regIndustry}
                  onChange={(e) => setRegIndustry(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Talent Acquisition Lead</label>
                <input
                  type="text"
                  value={regContact}
                  onChange={(e) => setRegContact(e.target.value)}
                  placeholder="Name and Designation"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs transition-colors"
              >
                Submit for Verification
              </button>
            </form>
          </div>

          {/* List of Verified Employers */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Verified Corporate Partners & MoU Register
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {companies.length} Registered Entities
              </span>
            </div>

            <div className="space-y-3">
              {companies.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{c.name}</span>
                        {c.verificationStatus === 'MoU Partner' && (
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {c.industry} · {c.workEmail}
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      c.verificationStatus === 'MoU Partner'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {c.verificationStatus}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">Verification Memo: </span>
                    <span>{c.verificationNotes}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>CIN/GSTIN: <span className="font-mono text-slate-700">{c.cinOrGstin}</span></span>
                    <span>Registered: {c.registeredDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
