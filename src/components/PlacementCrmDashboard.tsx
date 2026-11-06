import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle2, TrendingUp, Building2, Award, Users, ArrowUpRight, BarChart3, ShieldCheck } from 'lucide-react';
import { CrmPipelineMetrics } from '../types/index.ts';

interface PlacementCrmDashboardProps {
  onSyncAll: () => Promise<any>;
}

export const PlacementCrmDashboard: React.FC<PlacementCrmDashboardProps> = ({ onSyncAll }) => {
  const [metrics, setMetrics] = useState<CrmPipelineMetrics | null>(null);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const fetchCrmData = () => {
    fetch('/api/crm/stats')
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data.metrics);
        setBenchmarks(data.courseWiseSalaryBenchmarks || []);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchCrmData();
  }, []);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await onSyncAll();
      setSyncFeedback(res.message);
      fetchCrmData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const careerTracks = [
    {
      title: 'Statutory & External Audit',
      primaryCourses: 'CA (Inter/Final), ACCA, US CPA',
      keyEmployers: 'Deloitte, PwC, EY, KPMG, BDO, Grant Thornton',
      avgPackage: '₹8.0 - ₹12.5 LPA',
      articleshipApplicable: 'Yes (ICAI Articleship & Industrial Training)',
      description: 'Execution of substantive testing, analytical procedures, ICFR audit, and financial reporting under Ind AS & US GAAP.'
    },
    {
      title: 'US Corporate Taxation (SALT & Federal)',
      primaryCourses: 'US CPA, ACCA, CA',
      keyEmployers: 'PwC Acceleration Center, EY GDS, Deloitte USI, RSM',
      avgPackage: '₹9.0 - ₹14.0 LPA',
      articleshipApplicable: 'Direct Corporate Placement',
      description: 'Preparation and review of Form 1120/1065, state apportionment schedules, foreign reporting (FBAR/5471).'
    },
    {
      title: 'FP&A & Corporate Finance',
      primaryCourses: 'US CMA, CMA India, CA, CFA',
      keyEmployers: 'Schneider Electric, Amazon, Goldman Sachs, Google GCC',
      avgPackage: '₹10.0 - ₹16.0 LPA',
      articleshipApplicable: 'Industrial Training & Management Trainee',
      description: 'Rolling forecasts, annual operating budgets (AOP), variance analysis, gross margin walk, and board deck preparation.'
    },
    {
      title: 'Investment Banking & M&A Advisory',
      primaryCourses: 'CA (Rankholders), CFA (L2/L3), Financial Modeling',
      keyEmployers: 'Avendus, Edelweiss, JM Financial, Nomura, Morgan Stanley',
      avgPackage: '₹16.0 - ₹24.0 LPA',
      articleshipApplicable: 'Off-cycle Analyst / Analyst I',
      description: 'Building dynamic DCF/LBO models, confidential information memorandums (CIM), pitchbooks, and buyer list generation.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner & Sync Trigger */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Database className="w-4 h-4 text-amber-400" />
            <span>ArivuPro Institutional CRM Integration</span>
            <span aria-hidden="true">·</span>
            <span>LeadSquared & Zoho Placement Portal</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white font-display">
            Placement Cell Pipeline & CRM Synchronization
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Direct real-time webhook connector syncing student applications, interview rounds, counselor verifications, and corporate offer letters between the portal and ArivuPro’s central placement database.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Pushing to CRM...' : 'Trigger Full CRM Push'}</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-700 font-bold">Webhook 200 OK</span>
        </div>
      )}

      {/* 4 KPI Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <div className="text-slate-500 text-xs font-medium">Total Active Applicants</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {metrics.totalArivuProApplicants}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Across CA, ACCA, US CPA</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <div className="text-slate-500 text-xs font-medium">Active Interview Panels</div>
            <div className="text-2xl font-bold font-mono text-blue-600 mt-1 tabular-nums">
              {metrics.activeInterviews}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Technical & Partner rounds</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <div className="text-slate-500 text-xs font-medium">Big 4 & GCC Share</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-1 tabular-nums">
              {metrics.big4PlacementsCount}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Deloitte, EY, PwC, KPMG</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <div className="text-slate-500 text-xs font-medium">Highest Offered CTC</div>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1 tabular-nums">
              ₹{metrics.highestPackageLPA} LPA
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Investment Banking Analyst</div>
          </div>
        </div>
      )}

      {/* Salary & Qualification Benchmarking (Competitive analysis vs Quintedge & Indian Portals) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              ArivuPro Course-Wise Salary & Big 4 Placement Benchmarks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified starting package metrics for freshers & articles across Bangalore, Mumbai, and Delhi NCR.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">FY 2025-26 Cohorts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Professional Course</th>
                <th className="py-2.5 px-3">Fresher Average CTC</th>
                <th className="py-2.5 px-3">Top Offers Bracket</th>
                <th className="py-2.5 px-3">Big 4 & Top-10 Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {benchmarks.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {row.course}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800 tabular-nums">
                    ₹{row.fresherAvgLPA} LPA
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700 tabular-nums">
                    ₹{row.topOffersLPA} LPA
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {row.big4Share}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* High-Finance Career Paths Explorer (Quintedge benchmark) */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 font-display">
          Finance & Accounting Career Trajectories at ArivuPro
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {careerTracks.map((track, i) => (
            <div
              key={i}
              className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <h4 className="font-bold text-slate-900 text-sm">{track.title}</h4>
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded tabular-nums">
                  {track.avgPackage}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {track.description}
              </p>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] space-y-1">
                <div>
                  <span className="font-semibold text-slate-800">Primary Eligibility: </span>
                  <span className="text-slate-700">{track.primaryCourses}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Key Employers: </span>
                  <span className="text-slate-700">{track.keyEmployers}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
