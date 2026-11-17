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
        const m = data.metrics || {};
        setMetrics({
          totalArivuProApplicants: m.total_arivupro_applicants ?? 0,
          activeInterviews:        m.active_interviews ?? 0,
          offersReleased:          m.offers_released ?? 0,
          totalPlaced:             m.total_placed ?? 0,
          topDemandedCourse:       m.top_demanded_course ?? '—',
          big4PlacementsCount:     m.big4_placements_count ?? 0,
          avgPackageLPA:           m.avg_package_lpa ?? 0,
          highestPackageLPA:       m.highest_package_lpa ?? 0,
        });
        const raw = data.course_wise_salary_benchmarks || [];
        setBenchmarks(raw.map((r: any) => ({
          course:        r.course,
          fresherAvgLPA: r.fresher_avg_lpa,
          topOffersLPA:  r.top_offers_lpa,
          big4Share:     r.big4_share,
        })));
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

  const card: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e2e8e5',
    borderRadius: 12,
    padding: 24,
  };

  return (
    <div style={{ background: '#f4f7f5', minHeight: '100%', padding: '32px 32px 48px', fontFamily: 'Manrope, sans-serif' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Hero Banner ── */}
        <div style={{
          background: '#1a7a4a',
          borderRadius: 14,
          padding: '28px 32px',
          color: '#fff',
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Database size={13} color="#fff" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                ArivuPro Institutional CRM Integration
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>·</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>LeadSquared & Zoho Placement Portal</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Placement Cell Pipeline & CRM
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
              Real-time webhook syncing student applications, interview rounds, and offer letters with ArivuPro's placement database.
            </p>
          </div>

          <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            style={{
              padding: '11px 20px',
              background: '#fff',
              color: '#1a7a4a',
              border: 'none',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              opacity: isSyncing ? 0.65 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
              alignSelf: 'flex-start',
              fontFamily: 'Manrope, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            <RefreshCw size={15} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
            {isSyncing ? 'Pushing to CRM...' : 'Trigger Full CRM Push'}
          </button>
        </div>

        {/* Sync feedback */}
        {syncFeedback && (
          <div style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={15} color="#059669" />
              <span style={{ fontSize: 13, color: '#065f46', fontWeight: 500 }}>{syncFeedback}</span>
            </div>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#059669', fontWeight: 700 }}>Webhook 200 OK</span>
          </div>
        )}

        {/* ── KPI Cards ── */}
        {metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }} className="crm-kpi-grid">
            {/* Total Applicants */}
            <div style={card}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>Total Active Applicants</div>
              <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'monospace', color: '#0f2419', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {metrics.totalArivuProApplicants}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Across CA, ACCA, US CPA</div>
            </div>

            {/* Active Interviews */}
            <div style={card}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>Active Interview Panels</div>
              <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'monospace', color: '#2563eb', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {metrics.activeInterviews}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Technical & Partner rounds</div>
            </div>

            {/* Big 4 share */}
            <div style={card}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>Big 4 & GCC Share</div>
              <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'monospace', color: '#1a7a4a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {metrics.big4PlacementsCount}%
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Deloitte, EY, PwC, KPMG</div>
            </div>

            {/* Highest CTC */}
            <div style={card}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>Highest Offered CTC</div>
              <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'monospace', color: '#d97706', letterSpacing: '-0.02em', lineHeight: 1 }}>
                ₹{metrics.highestPackageLPA} LPA
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Investment Banking Analyst</div>
            </div>
          </div>
        )}

        {/* ── Salary Benchmarks Table ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f2419', margin: '0 0 4px' }}>
                ArivuPro Course-Wise Salary & Big 4 Placement Benchmarks
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Verified starting package metrics for freshers & articles across Bangalore, Mumbai, and Delhi NCR.
              </p>
            </div>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', flexShrink: 0 }}>FY 2025-26 Cohorts</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8faf9', borderBottom: '1px solid #e2e8e5' }}>
                  {['Professional Course', 'Fresher Average CTC', 'Top Offers Bracket', 'Big 4 & Top-10 Share'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, letterSpacing: '0.03em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {benchmarks.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8faf9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f2419' }}>{row.course}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>₹{row.fresherAvgLPA} LPA</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 800, color: '#1a7a4a' }}>₹{row.topOffersLPA} LPA</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#475569' }}>{row.big4Share}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Career Tracks ── */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f2419', margin: '0 0 14px' }}>
            Finance & Accounting Career Trajectories at ArivuPro
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="crm-tracks-grid">
            {careerTracks.map((track, i) => (
              <div key={i} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0f2419', margin: 0, lineHeight: 1.3 }}>{track.title}</h4>
                  <span style={{
                    fontSize: 12,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#1e293b',
                    background: '#f1f5f9',
                    padding: '3px 10px',
                    borderRadius: 20,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {track.avgPackage}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  {track.description}
                </p>

                {/* Detail chips */}
                <div style={{ background: '#f4f7f5', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color: '#1a7a4a' }}>Courses: </span>
                    <span style={{ color: '#374151' }}>{track.primaryCourses}</span>
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color: '#1a7a4a' }}>Key Employers: </span>
                    <span style={{ color: '#374151' }}>{track.keyEmployers}</span>
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color: '#1a7a4a' }}>Entry Path: </span>
                    <span style={{ color: '#374151' }}>{track.articleshipApplicable}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .crm-kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .crm-tracks-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 540px) {
          .crm-kpi-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
};
