import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, evaluationsAPI, analyticsAPI, examsAPI } from '../services/api';
import {
  TrendingUp,
  Upload,
  BarChart3,
  Trophy,
  Calendar,
  FileText,
  Inbox,
  GraduationCap,
  Target,
  Flame,
  Clock,
  ChevronRight,
  Eye,
  Download,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

const MEDIA_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace('/api', '');

// ─── placeholder so CountdownBox reference compiles (removed from render) ─────
function CountdownBox({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 10, padding: '0.4rem 0.7rem', minWidth: 52,
        fontSize: '1.6rem', fontWeight: 900, color: '#fff', lineHeight: 1,
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.55)', marginTop: 4,
        textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
    </div>
  );
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
function LineChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height: 120, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <TrendingUp size={48} color="#cbd5e1" opacity={0.3} />
        <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
          Attempt more papers to see your trend
        </span>
      </div>
    );
  }
  const W = 480, H = 110;
  const scores = data.map(d => d.score || 0);
  const max = Math.max(...scores, 100);
  const pts  = scores.map((s, i) => [
    (i / (scores.length - 1)) * W,
    H - (s / max) * (H - 8) - 4,
  ]);
  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L${W},${H} L0,${H}Z`;

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        {/* Y labels */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          height: H, paddingBottom: 0, fontSize: '0.6rem', color: '#cbd5e1', flexShrink: 0 }}>
          {[100, 75, 50, 25, 0].map(v => <span key={v}>{v}%</span>)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none" style={{ overflow: 'visible', display: 'block' }}>
            <defs>
              <linearGradient id="lgArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#2E8857" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#2E8857" stopOpacity="0"    />
              </linearGradient>
            </defs>
            {[0, 25, 50, 75, 100].map(v => {
              const y = H - (v / 100) * (H - 8) - 4;
              return <line key={v} x1={0} y1={y} x2={W} y2={y}
                stroke="#f1f5f9" strokeWidth="1" />;
            })}
            <path d={areaPath} fill="url(#lgArea)" />
            <path d={linePath} fill="none" stroke="#2E8857" strokeWidth="2.5"
              strokeLinejoin="round" strokeLinecap="round" />
            {pts.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={4}
                fill="#2E8857" stroke="#fff" strokeWidth="2" />
            ))}
          </svg>
          {/* X labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            {data.map((d, i) => (
              <span key={i} style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                {d.date
                  ? new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  : `#${i + 1}`}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Heatmap ─────────────────────────────────────────────────────────
function ActivityHeatmap({ evaluations }) {
  const today = new Date();
  const WEEKS = 26;

  const actMap = {};
  (evaluations || []).forEach(ev => {
    const d = ev.created_at?.split('T')[0];
    if (d) actMap[d] = (actMap[d] || 0) + 1;
  });

  const weeks = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - w * 7 - (6 - d));
      week.push(dt);
    }
    weeks.push(week);
  }

  const getColor = (count, future) => {
    if (future) return 'transparent';
    if (!count) return '#f1f5f9';
    if (count === 1) return '#9FFFCB';
    if (count === 2) return '#7AE582';
    return '#2E8857';
  };

  const monthLabels = [];
  weeks.forEach((week, wi) => {
    if (week[0].getDate() <= 7) {
      monthLabels.push({ wi, label: week[0].toLocaleDateString('en', { month: 'short' }) });
    }
  });

  return (
    <div>
      {/* Month row */}
      <div style={{ marginLeft: 20, marginBottom: 4, position: 'relative', height: 14 }}>
        {monthLabels.map(({ wi, label }) => (
          <span key={wi} style={{
            position: 'absolute', left: wi * 13,
            fontSize: '0.6rem', color: '#94a3b8', fontWeight: 500,
          }}>{label}</span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* Day initials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginRight: 3 }}>
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} style={{ height: 11, fontSize: '0.55rem', color: '#cbd5e1',
              lineHeight: '11px', textAlign: 'right', width: 8 }}>
              {i % 2 === 1 ? d : ''}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div style={{ display: 'flex', gap: 1 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {week.map((dt, di) => {
                const key   = dt.toISOString().split('T')[0];
                const count = actMap[key] || 0;
                const future = dt > today;
                return (
                  <div key={di}
                    title={future ? '' : `${key}: ${count} submission${count !== 1 ? 's' : ''}`}
                    style={{
                      width: 11, height: 11, borderRadius: 2,
                      background: getColor(count, future),
                      border: future ? 'none' : '1px solid rgba(0,0,0,0.04)',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3,
        marginTop: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Less</span>
        {['#f1f5f9','#9FFFCB','#7AE582','#2E8857'].map(c => (
          <div key={c} style={{ width: 11, height: 11, borderRadius: 2, background: c }} />
        ))}
        <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>More</span>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, accentBg, pill, pillColor, pillBg }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '1.25rem 1.5rem',
      border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 90, height: 90, borderRadius: '50%', background: accentBg,
        opacity: 0.55,
      }} />
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.625rem' }}>
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
      </div>
      {sub && (
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.3rem' }}>{sub}</div>
      )}
      {pill != null && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          marginTop: '0.5rem', padding: '2px 9px', borderRadius: 999,
          background: pillBg, color: pillColor,
          fontSize: '0.7rem', fontWeight: 700,
        }}>
          {pill}
        </div>
      )}
    </div>
  );
}

// ─── Paper Card ───────────────────────────────────────────────────────────────
function PaperCard({ paper }) {
  const pdfUrl = paper.question_paper_file
    ? (paper.question_paper_file.startsWith('http')
        ? paper.question_paper_file
        : `${MEDIA_BASE}${paper.question_paper_file}`)
    : null;

  const typeStyle = {
    mock:       { bg: '#eff6ff', color: '#2563eb' },
    practice:   { bg: '#f0fdf4', color: '#16a34a' },
    past_paper: { bg: '#fffbeb', color: '#d97706' },
    rtp:        { bg: '#fdf4ff', color: '#9333ea' },
    mtp:        { bg: '#fff1f2', color: '#e11d48' },
  }[paper.attempt_type] || { bg: '#f1f5f9', color: '#475569' };

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '1rem 1.125rem',
      border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', gap: '0.625rem',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          background: typeStyle.bg, color: typeStyle.color,
          borderRadius: 6, padding: '2px 10px',
          fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
        }}>
          {paper.attempt_type || 'PAPER'}
        </span>
        {pdfUrl ? (
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{
              padding: '3px 9px', borderRadius: 6, background: '#eff6ff', color: '#2563eb',
              border: '1px solid #bfdbfe', fontSize: '0.68rem', fontWeight: 700,
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '0.3rem'
            }}>
              <Eye size={12} /> View
            </a>
            <a href={pdfUrl} download style={{
              padding: '3px 9px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a',
              border: '1px solid #bbf7d0', fontSize: '0.68rem', fontWeight: 700,
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '0.3rem'
            }}>
              <Download size={12} /> PDF
            </a>
          </div>
        ) : (
          <span style={{ fontSize: '0.65rem', color: '#cbd5e1', fontStyle: 'italic' }}>No PDF</span>
        )}
      </div>

      <div>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a',
          margin: '0 0 0.2rem', lineHeight: 1.45,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {paper.title}
        </p>
        <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>
          {paper.subject_name || paper.subject_code || '—'}
          {paper.exam_session ? ` · ${paper.exam_session}` : ''}
        </p>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: '0.5rem', borderTop: '1px solid #f8fafc',
        marginTop: 'auto',
      }}>
        <div style={{ display: 'flex', gap: '0.875rem', fontSize: '0.7rem', color: '#64748b' }}>
          <span><FileText size={12} style={{ verticalAlign: 'middle' }} /> {paper.total_marks}m</span>
          <span><Clock size={12} style={{ verticalAlign: 'middle' }} /> {paper.duration_minutes}min</span>
        </div>
        <Link to={`/upload?paper=${paper.id}`} style={{
          padding: '4px 12px', borderRadius: 8,
          background: 'linear-gradient(135deg,#2E8857,#245a41)',
          color: '#fff', fontSize: '0.7rem', fontWeight: 700,
          textDecoration: 'none', boxShadow: '0 2px 8px rgba(46,136,87,0.35)',
        }}>
          Attempt <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickBtn({ to, icon, label, color, bg }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem',
      padding: '0.625rem 0.875rem', borderRadius: 10,
      background: bg, border: `1px solid ${color}18`,
      textDecoration: 'none', color,
      fontWeight: 600, fontSize: '0.8rem',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.color = color; }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      {label}
    </Link>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [stats,        setStats]        = useState({ total_submissions: 0, evaluated_submissions: 0, average_score: 0, improvement_streak: 0 });
  const [recentEvals,  setRecentEvals]  = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [recentPapers, setRecentPapers] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [loading,      setLoading]      = useState(true);

  const fetchAll = useCallback(async (isFirst = false) => {
    try {
      if (isFirst) setLoading(true);
      const [sR, eR, gR, pR] = await Promise.allSettled([
        authAPI.getDashboardStats(),
        evaluationsAPI.getHistory(),
        analyticsAPI.getGamification(),
        examsAPI.getPapers({ is_published: true }),
      ]);
      if (sR.status === 'fulfilled') {
        const d = sR.value.data;
        setStats(d);
        if (Array.isArray(d.score_history)) setScoreHistory(d.score_history);
      }
      if (eR.status === 'fulfilled') {
        const d = eR.value.data;
        setRecentEvals(d.results || d || []);
      }
      if (gR.status === 'fulfilled') setGamification(gR.value.data);
      if (pR.status === 'fulfilled') {
        const d = pR.value.data;
        setRecentPapers((d.results || d || []).slice(0, 6));
      }
    } finally {
      if (isFirst) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(true); }, [fetchAll]);

  // Auto-refresh every 30 seconds — data stays current without manual reload
  useEffect(() => {
    const id = setInterval(() => fetchAll(false), 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  if (loading) return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
      <div className="spinner" />
    </div>
  );

  const firstName  = user?.first_name || user?.username?.split(' ')[0] || 'Student';
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const avgScore   = stats.average_score || 0;
  const bestScore  = recentEvals.length > 0 ? Math.max(...recentEvals.map(e => e.percentage || 0)) : 0;
  const bestTitle  = recentEvals.find(e => (e.percentage || 0) === bestScore)?.exam_paper_title || '—';
  const scoreColor = s => s >= 60 ? '#16a34a' : s >= 40 ? '#d97706' : '#dc2626';

  return (
    <div className="page">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,#0a1f14 0%,#1a3d2a 45%,#2E8857 100%)',
        borderRadius: 20, padding: '2rem 2.25rem', marginBottom: '1.5rem',
        boxShadow: '0 12px 40px rgba(46,136,87,0.3)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position:'absolute', top:-70, right:-50, width:220, height:220,
          borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ position:'absolute', bottom:-50, right:180, width:150, height:150,
          borderRadius:'50%', background:'rgba(255,255,255,0.03)' }} />
        <div style={{ position:'absolute', top:20, right:260, width:60, height:60,
          borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          flexWrap:'wrap', gap:'1.5rem', position:'relative' }}>

          {/* Left — greeting */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.625rem' }}>
              <span style={{
                background:'rgba(255,255,255,0.12)', color:'#c7d2fe',
                border:'1px solid rgba(255,255,255,0.2)',
                borderRadius:20, padding:'3px 14px',
                fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.05em',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                <GraduationCap size={12} /> {user?.exam_type || 'CA'} · {user?.exam_level || 'Student'}
              </span>
              {stats.improvement_streak > 0 && (
                <span style={{
                  background:'rgba(251,191,36,0.2)', color:'#fbbf24',
                  border:'1px solid rgba(251,191,36,0.3)',
                  borderRadius:20, padding:'3px 12px',
                  fontSize:'0.7rem', fontWeight:700,
                }}>
                  <Flame size={12} /> {stats.improvement_streak} streak
                </span>
              )}
            </div>
            <h1 style={{ color:'#fff', fontSize:'2rem', fontWeight:900,
              margin:'0 0 0.375rem', lineHeight:1.15 }}>
              {greeting},{' '}
              <span style={{ background:'linear-gradient(90deg,#a5b4fc,#818cf8)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                {firstName}!
              </span>
            </h1>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.875rem', margin:'0 0 1.25rem' }}>
              {stats.total_submissions > 0
                ? `${stats.total_submissions} submission${stats.total_submissions !== 1 ? 's' : ''} · ${stats.evaluated_submissions || 0} evaluated · Stay consistent!`
                : 'Upload your answer sheet to get started.'}
            </p>
            <div style={{ display:'flex', gap:'0.625rem', flexWrap:'wrap' }}>
              <button onClick={() => navigate('/upload')} style={{
                padding:'0.55rem 1.375rem', borderRadius:10,
                background:'linear-gradient(135deg,#22c55e,#16a34a)',
                border:'none', color:'#fff', fontWeight:700, fontSize:'0.8rem',
                cursor:'pointer', boxShadow:'0 4px 14px rgba(34,197,94,0.4)',
              }}> <Upload size={16} /> Upload Answer</button>
              <button onClick={() => navigate('/papers')} style={{
                padding:'0.55rem 1.375rem', borderRadius:10,
                background:'rgba(255,255,255,0.1)',
                border:'1px solid rgba(255,255,255,0.22)',
                color:'#fff', fontWeight:600, fontSize:'0.8rem', cursor:'pointer',
              }}> <FileText size={16} /> View Papers</button>
            </div>
          </div>

          {/* Right — live stats summary */}
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            {[
              { label:'Submitted',  value: stats.total_submissions || 0,      icon:<Upload size={16} />,      bg:'rgba(255,255,255,0.1)'  },
              { label:'Evaluated',  value: stats.evaluated_submissions || 0,  icon:<CheckCircle2 size={16} />, bg:'rgba(46,136,87,0.3)'    },
              { label:'Avg Score',  value: stats.average_score ? `${Math.round(stats.average_score)}%` : '—', icon:<BarChart3 size={16} />, bg:'rgba(255,255,255,0.1)' },
            ].map(s => (
              <div key={s.label} style={{
                background: s.bg, border:'1px solid rgba(255,255,255,0.18)',
                borderRadius:12, padding:'0.625rem 1rem', textAlign:'center', minWidth:90,
              }}>
                <div style={{ color:'rgba(255,255,255,0.6)', marginBottom:4, display:'flex', justifyContent:'center' }}>{s.icon}</div>
                <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#fff', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.5)', marginTop:3, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STATS ROW
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)',
        gap:'1rem', marginBottom:'1.5rem' }}>

        <StatCard
          icon={<Upload size={24} />} label="Tests Attempted"
          value={stats.total_submissions || 0}
          sub={stats.total_submissions > 0 ? `${stats.evaluated_submissions || 0} evaluated` : 'Start your first attempt'}
          color="#2E8857" accentBg="#D7F4EA"
          pill={stats.total_submissions > 0 ? `+${stats.total_submissions} total` : null}
          pillColor="#2E8857" pillBg="#D7F4EA"
        />
        <StatCard
          icon={<BarChart3 size={24} />} label="Average Score"
          value={avgScore ? `${Math.round(avgScore)}%` : '0%'}
          sub="Across all evaluations"
          color={scoreColor(avgScore)} accentBg={avgScore >= 60 ? '#f0fdf4' : '#fffbeb'}
          pill={avgScore > 0 ? (avgScore >= 60 ? '✓ Passing' : '⚠ Needs work') : null}
          pillColor={avgScore >= 60 ? '#16a34a' : '#d97706'}
          pillBg={avgScore >= 60 ? '#dcfce7' : '#fef3c7'}
        />
        <StatCard
          icon={<Trophy size={24} />} label="Best Score"
          value={bestScore ? `${Math.round(bestScore)}%` : '0%'}
          sub={bestTitle !== '—' ? bestTitle.slice(0, 32) + (bestTitle.length > 32 ? '…' : '') : 'No evaluations yet'}
          color="#d97706" accentBg="#fffbeb"
          pill={bestScore > 0 ? 'Personal best' : null}
          pillColor="#d97706" pillBg="#fef3c7"
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TWO-COLUMN LAYOUT
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 290px',
        gap:'1.5rem', alignItems:'start' }}>

        {/* ── LEFT COLUMN ────────────────────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

          {/* Score Trend + Activity Heatmap */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>

            {/* Score Trend */}
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid #f1f5f9',
                display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ fontWeight:700, color:'#0f172a', margin:0, fontSize:'0.9rem' }}>
                  <TrendingUp size={16} /> Score Trend
                </h3>
                {scoreHistory.length > 0 && (
                  <span style={{ background:'#D7F4EA', color:'#2E8857',
                    borderRadius:20, padding:'2px 10px', fontSize:'0.68rem', fontWeight:600 }}>
                    Last {scoreHistory.length} attempts
                  </span>
                )}
              </div>
              <div style={{ padding:'1.125rem 1.25rem' }}>
                <LineChart data={scoreHistory} />
              </div>
            </div>

            {/* Activity Heatmap */}
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid #f1f5f9',
                display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ fontWeight:700, color:'#0f172a', margin:0, fontSize:'0.9rem' }}>
                  <Calendar size={16} /> Attempt Activity
                </h3>
                <span style={{ background:'#f5f3ff', color:'#7c3aed',
                  borderRadius:20, padding:'2px 10px', fontSize:'0.68rem', fontWeight:600 }}>
                  Last 6 months
                </span>
              </div>
              <div style={{ padding:'1rem 1.25rem 1.25rem' }}>
                <ActivityHeatmap evaluations={recentEvals} />
              </div>
            </div>
          </div>

          {/* Question Papers */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid #f1f5f9',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ fontWeight:700, color:'#0f172a', margin:'0 0 2px', fontSize:'0.9rem' }}>
                  <FileText size={16} /> Question Papers
                </h3>
                <p style={{ margin:0, fontSize:'0.7rem', color:'#94a3b8' }}>
                  Download or attempt published papers
                </p>
              </div>
              <Link to="/papers" style={{ fontSize:'0.78rem', fontWeight:700,
                color:'#2E8857', textDecoration:'none' }}>
                View All <ChevronRight size={14} />
              </Link>
            </div>
            {recentPapers.length === 0 ? (
              <div style={{ padding:'3rem', textAlign:'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom:'0.75rem', opacity:0.4 }}><Inbox size={48} /></div>
                <p style={{ color:'#94a3b8', fontSize:'0.875rem', margin:0 }}>
                  No papers published yet. Check back soon.
                </p>
              </div>
            ) : (
              <div style={{ padding:'1.25rem',
                display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',
                gap:'1rem' }}>
                {recentPapers.map(p => <PaperCard key={p.id} paper={p} />)}
              </div>
            )}
          </div>

          {/* Recent Evaluations */}
          {recentEvals.length > 0 && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid #f1f5f9',
                display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ fontWeight:700, color:'#0f172a', margin:0, fontSize:'0.9rem' }}>
                  <Target size={16} /> Recent Evaluations
                </h3>
                <Link to="/submissions" style={{ fontSize:'0.78rem', fontWeight:700,
                  color:'#2E8857', textDecoration:'none' }}>
                  View All <ChevronRight size={14} />
                </Link>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.83rem' }}>
                  <thead>
                    <tr style={{ background:'#f8fafc' }}>
                      {['Paper', 'Score', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ padding:'0.625rem 1.25rem', textAlign:'left',
                          fontSize:'0.7rem', color:'#64748b', fontWeight:700,
                          borderBottom:'1px solid #e2e8f0', textTransform:'uppercase',
                          letterSpacing:'0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentEvals.slice(0, 5).map(ev => {
                      const pct = ev.percentage || 0;
                      const sc  = scoreColor(pct);
                      return (
                        <tr key={ev.id} style={{ borderBottom:'1px solid #f1f5f9', transition:'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding:'0.75rem 1.25rem', color:'#1e293b', fontWeight:600,
                            maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {ev.exam_paper_title || 'Paper'}
                          </td>
                          <td style={{ padding:'0.75rem 1.25rem' }}>
                            <span style={{ fontWeight:900, fontSize:'1.05rem', color:sc }}>
                              {pct ? `${Math.round(pct)}%` : '—'}
                            </span>
                          </td>
                          <td style={{ padding:'0.75rem 1.25rem' }}>
                            <span style={{
                              borderRadius:999, padding:'2px 10px', fontSize:'0.68rem', fontWeight:700,
                              background: ev.status === 'approved' ? '#dcfce7'
                                : ev.status === 'completed' ? '#dbeafe' : '#fef3c7',
                              color: ev.status === 'approved' ? '#166534'
                                : ev.status === 'completed' ? '#1e40af' : '#92400e',
                            }}>
                              {ev.status || 'pending'}
                            </span>
                          </td>
                          <td style={{ padding:'0.75rem 1.25rem', color:'#94a3b8', fontSize:'0.75rem' }}>
                            {ev.created_at
                              ? new Date(ev.created_at).toLocaleDateString('en-IN',
                                  { day:'numeric', month:'short', year:'2-digit' })
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ──────────────────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.125rem' }}>

          {/* Level / Gamification */}
          {gamification && (
            <div style={{
              background: 'linear-gradient(135deg,#0a1f14,#2E8857)',
              borderRadius:16, padding:'1.125rem 1.25rem',
              boxShadow:'0 4px 16px rgba(67,56,202,0.25)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.875rem' }}>
                <div style={{
                  width:40, height:40, borderRadius:'50%', flexShrink:0,
                  background:'rgba(255,255,255,0.15)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem',
                }}>
                  {gamification.level_icon || <GraduationCap size={24} />}
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:'0.875rem', color:'#fff' }}>
                    {gamification.current_level || 'Beginner'}
                  </div>
                  <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.55)' }}>
                    {gamification.xp || 0} XP earned
                  </div>
                </div>
              </div>
              <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:999, height:6, overflow:'hidden' }}>
                <div style={{
                  height:'100%', borderRadius:999,
                  background:'linear-gradient(90deg,#9FFFCB,#7AE582)',
                  width:`${Math.min((gamification.xp || 0) % 100, 100)}%`,
                  transition:'width 0.6s ease',
                }} />
              </div>
              <div style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.45)',
                marginTop:'0.3rem', textAlign:'right' }}>
                {(gamification.xp || 0) % 100}/100 XP to next level
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid #f1f5f9' }}>
              <h3 style={{ fontWeight:700, color:'#0f172a', margin:0, fontSize:'0.9rem' }}>
                ⚡ Quick Actions
              </h3>
            </div>
            <div style={{ padding:'0.75rem', display:'flex', flexDirection:'column', gap:'0.3rem' }}>
              <QuickBtn to="/upload"   icon="📤" label="Upload Answer"   color="#4f46e5" bg="#eef2ff" />
              <QuickBtn to="/papers"   icon="📄" label="Browse Papers"   color="#0891b2" bg="#ecfeff" />
              <QuickBtn to="/mistakes" icon="📖" label="Mistake Library" color="#dc2626" bg="#fef2f2" />
              <QuickBtn to="/revision" icon="✏️" label="Revision Mode"   color="#7c3aed" bg="#f5f3ff" />
              <QuickBtn to="/progress" icon="📈" label="My Progress"     color="#d97706" bg="#fffbeb" />
            </div>
          </div>

          {/* Achievements */}
          {gamification?.achievements?.length > 0 && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid #f1f5f9' }}>
                <h3 style={{ fontWeight:700, color:'#0f172a', margin:0, fontSize:'0.9rem' }}>
                  🏆 Achievements
                </h3>
              </div>
              <div style={{ padding:'1rem',
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                {gamification.achievements.slice(0, 4).map((a, i) => (
                  <div key={i} style={{
                    background:'#fffbeb', border:'1px solid #fde68a',
                    borderRadius:10, padding:'0.625rem', textAlign:'center',
                  }}>
                    <div style={{ fontSize:'1.25rem' }}>{a.icon || '⭐'}</div>
                    <div style={{ fontSize:'0.62rem', fontWeight:700,
                      color:'#92400e', marginTop:3 }}>
                      {a.name || 'Achievement'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
