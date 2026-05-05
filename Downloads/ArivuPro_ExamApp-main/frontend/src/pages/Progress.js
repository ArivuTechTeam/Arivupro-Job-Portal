import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, authAPI } from '../services/api';

// ─── Level config ─────────────────────────────────────────────────────────────
const LEVELS = [
  { key: 'beginner',   label: 'Beginner',   icon: '🌱', color: '#64748b', pct: 20,  grad: 'linear-gradient(135deg,#94a3b8,#64748b)' },
  { key: 'improving',  label: 'Improving',  icon: '📈', color: '#f59e0b', pct: 40,  grad: 'linear-gradient(135deg,#fbbf24,#f59e0b)' },
  { key: 'proficient', label: 'Proficient', icon: '⚡', color: '#2563eb', pct: 60,  grad: 'linear-gradient(135deg,#60a5fa,#2563eb)' },
  { key: 'advanced',   label: 'Advanced',   icon: '🚀', color: '#7c3aed', pct: 80,  grad: 'linear-gradient(135deg,#a78bfa,#7c3aed)' },
  { key: 'exam_ready', label: 'Exam Ready', icon: '🏆', color: '#16a34a', pct: 100, grad: 'linear-gradient(135deg,#4ade80,#16a34a)' },
];

const LEVEL_TIPS = {
  beginner:   'Start with basics and gradually increase difficulty.',
  improving:  "You're on the right track. Keep practicing consistently.",
  proficient: 'Good progress! Continue practicing to improve further.',
  advanced:   "You're doing great! Focus on weak areas to reach Exam Ready.",
  exam_ready: "You're prepared! Keep practicing to maintain this level.",
};

// ─── Score color helper ────────────────────────────────────────────────────────
const scoreColor = s => s >= 80 ? '#16a34a' : s >= 60 ? '#2563eb' : s >= 40 ? '#f59e0b' : '#dc2626';
const scoreLabel = s => s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Needs Work';

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
function ScoreChart({ journey }) {
  if (!journey?.length) return null;
  const W = 600, H = 140;
  const scores = journey.map(j => j.score || 0);
  const max    = Math.max(...scores, 100);
  const pts    = scores.map((s, i) => [
    scores.length === 1 ? W / 2 : (i / (scores.length - 1)) * W,
    H - 10 - (s / max) * (H - 20),
  ]);
  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length-1][0]},${H} L${pts[0][0]},${H}Z`;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          height: H, fontSize: '0.6rem', color: '#cbd5e1', flexShrink: 0, paddingBottom: 0 }}>
          {[100, 75, 50, 25, 0].map(v => <span key={v}>{v}%</span>)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              <linearGradient id="pgArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0,25,50,75,100].map(v => {
              const y = H - 10 - (v/100)*(H-20);
              return <line key={v} x1={0} y1={y} x2={W} y2={y}
                stroke="#f1f5f9" strokeWidth="1" />;
            })}
            <path d={areaPath} fill="url(#pgArea)" />
            <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5"
              strokeLinejoin="round" strokeLinecap="round" />
            {pts.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={5}
                fill={scoreColor(scores[i])} stroke="#fff" strokeWidth="2" />
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {journey.map((j, i) => (
              <div key={i} style={{ textAlign: 'center', minWidth: 0 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: scoreColor(j.score || 0) }}>
                  {j.score || 0}%
                </div>
                <div style={{ fontSize: '0.58rem', color: '#94a3b8' }}>
                  {j.date ? new Date(j.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : `#${i+1}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Circular progress ────────────────────────────────────────────────────────
function CircleProgress({ pct, color, size = 64 }) {
  const r  = (size - 8) / 2;
  const c  = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#f1f5f9" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Progress() {
  const [overview,      setOverview]      = useState(null);
  const [gamification,  setGamification]  = useState(null);
  const [weakAreas,     setWeakAreas]     = useState([]);
  const [dashStats,     setDashStats]     = useState(null);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [ovRes, gamRes, weakRes, dashRes] = await Promise.allSettled([
          analyticsAPI.getOverview(),
          analyticsAPI.getGamification(),
          analyticsAPI.getWeakAreas(),
          authAPI.getDashboardStats(),
        ]);
        if (ovRes.status   === 'fulfilled') setOverview(ovRes.value.data      || ovRes.value);
        if (gamRes.status  === 'fulfilled') setGamification(gamRes.value.data || gamRes.value);
        if (weakRes.status === 'fulfilled') setWeakAreas(Array.isArray(weakRes.value.data) ? weakRes.value.data : weakRes.value.data?.results || []);
        if (dashRes.status === 'fulfilled') setDashStats(dashRes.value.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="page" style={{ display:'flex', justifyContent:'center', padding:'5rem' }}>
      <div className="spinner" />
    </div>
  );

  const journey    = gamification?.journey || gamification?.score_history || [];
  const achievements = gamification?.achievements || [];
  const streak     = gamification?.improvementStreak || gamification?.improvement_streak || dashStats?.improvement_streak || 0;
  const levelKey   = overview?.level || 'beginner';
  const levelInfo  = LEVELS.find(l => l.key === levelKey) || LEVELS[0];
  const levelIdx   = LEVELS.findIndex(l => l.key === levelKey);
  const overallAvg = overview?.overallAverage ?? dashStats?.average_score ?? 0;
  const totalAtt   = overview?.totalAttempts  ?? dashStats?.total_submissions ?? 0;
  const subjects   = overview?.subjectsStudied ?? 0;
  const bestScore  = overview?.bestScore ?? dashStats?.best_score ?? 0;

  return (
    <div className="page">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 45%,#4338ca 100%)',
        borderRadius: 20, padding: '2rem 2.25rem', marginBottom: '1.5rem',
        boxShadow: '0 12px 40px rgba(67,56,202,0.3)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1.5rem',
      }}>
        <div style={{ position:'absolute', top:-60, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.5rem' }}>
            <span style={{
              background:'rgba(255,255,255,0.12)', color:'#c7d2fe',
              border:'1px solid rgba(255,255,255,0.2)',
              borderRadius:20, padding:'3px 14px',
              fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.05em',
            }}>📈 Progress Tracker</span>
            {streak > 0 && (
              <span style={{
                background:'rgba(251,191,36,0.2)', color:'#fbbf24',
                border:'1px solid rgba(251,191,36,0.3)',
                borderRadius:20, padding:'3px 12px',
                fontSize:'0.7rem', fontWeight:700,
              }}>🔥 {streak} streak</span>
            )}
          </div>
          <h1 style={{ color:'#fff', fontSize:'2rem', fontWeight:900,
            margin:'0 0 0.375rem', lineHeight:1.15 }}>
            Progress &{' '}
            <span style={{ background:'linear-gradient(90deg,#a5b4fc,#818cf8)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Achievements
            </span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.875rem', margin:0 }}>
            Your exam readiness journey · {levelInfo.icon} {levelInfo.label}
          </p>
        </div>

        {/* Level badge */}
        <div style={{
          background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)',
          borderRadius:16, padding:'1.25rem 1.75rem', textAlign:'center',
        }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'0.375rem' }}>{levelInfo.icon}</div>
          <div style={{ fontWeight:900, fontSize:'1rem', color:'#fff' }}>{levelInfo.label}</div>
          <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.45)',
            textTransform:'uppercase', letterSpacing:'0.08em', marginTop:2 }}>
            Current Level
          </div>
        </div>
      </div>

      {/* ══ STATS ROW ════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',
        gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { icon:'📤', label:'Practice Attempts', value: totalAtt,   color:'#4f46e5', bg:'#eef2ff', sub:'total submissions' },
          { icon:'📊', label:'Overall Average',   value: overallAvg ? `${Math.round(overallAvg)}%` : '0%', color: scoreColor(overallAvg), bg:'#fffbeb', sub: overallAvg >= 60 ? '✓ Passing' : 'Keep going' },
          { icon:'🏆', label:'Best Score',         value: bestScore  ? `${Math.round(bestScore)}%`  : '0%', color:'#d97706', bg:'#fffbeb', sub:'personal best' },
          { icon:'📚', label:'Subjects Studied',   value: subjects,  color:'#0891b2', bg:'#ecfeff', sub:'unique subjects' },
          { icon:'🔥', label:'Streak',             value: streak,    color:'#dc2626', bg:'#fef2f2', sub:'consecutive improvement' },
        ].map(s => (
          <div key={s.label} style={{
            background:'#fff', borderRadius:16, padding:'1.125rem 1.25rem',
            border:'1px solid #e2e8f0', boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
            position:'relative', overflow:'hidden',
          }}>
            <div style={{
              position:'absolute', top:-18, right:-18, width:70, height:70,
              borderRadius:'50%', background:s.bg, opacity:0.7,
            }} />
            <div style={{ fontSize:'1.3rem', marginBottom:'0.5rem' }}>{s.icon}</div>
            <div style={{ fontSize:'1.75rem', fontWeight:900, color:s.color, lineHeight:1 }}>
              {s.value}
            </div>
            <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#64748b',
              textTransform:'uppercase', letterSpacing:'0.06em', marginTop:3 }}>
              {s.label}
            </div>
            <div style={{ fontSize:'0.65rem', color:'#94a3b8', marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ══ MAIN GRID ════════════════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'1.5rem', alignItems:'start' }}>

        {/* LEFT */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

          {/* Score Journey Chart */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #f1f5f9',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ fontWeight:700, color:'#0f172a', margin:'0 0 2px', fontSize:'0.95rem' }}>
                  📈 Score Journey
                </h3>
                <p style={{ margin:0, fontSize:'0.7rem', color:'#94a3b8' }}>
                  Performance across all attempts
                </p>
              </div>
              {journey.length > 0 && (
                <span style={{ background:'#eef2ff', color:'#4f46e5', borderRadius:20,
                  padding:'2px 10px', fontSize:'0.68rem', fontWeight:600 }}>
                  {journey.length} attempts
                </span>
              )}
            </div>
            <div style={{ padding:'1.25rem' }}>
              {journey.length >= 2 ? (
                <>
                  <ScoreChart journey={journey} />
                  {journey.length >= 2 && (
                    <div style={{
                      display:'flex', gap:'0.75rem', marginTop:'1rem', flexWrap:'wrap',
                    }}>
                      {[
                        { label:'First', value: journey[0]?.score || 0 },
                        { label:'Latest', value: journey[journey.length-1]?.score || 0 },
                        { label:'Gain', value: `${(journey[journey.length-1]?.score||0) - (journey[0]?.score||0) > 0 ? '+' : ''}${(journey[journey.length-1]?.score||0)-(journey[0]?.score||0)}` },
                      ].map(s => (
                        <div key={s.label} style={{
                          background:'#f8fafc', borderRadius:10, padding:'0.5rem 1rem',
                          border:'1px solid #e2e8f0', textAlign:'center',
                        }}>
                          <div style={{ fontSize:'1rem', fontWeight:800, color:'#1e293b' }}>{s.value}</div>
                          <div style={{ fontSize:'0.65rem', color:'#94a3b8', marginTop:1 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign:'center', padding:'2rem 0' }}>
                  <div style={{ fontSize:'3rem', marginBottom:'0.75rem', opacity:0.25 }}>📊</div>
                  <p style={{ color:'#94a3b8', fontSize:'0.875rem' }}>
                    Complete at least 2 submissions to see your score trend.
                  </p>
                  <Link to="/upload" style={{
                    display:'inline-block', marginTop:'1rem',
                    padding:'0.5rem 1.5rem', borderRadius:10,
                    background:'linear-gradient(135deg,#4f46e5,#6366f1)',
                    color:'#fff', textDecoration:'none', fontWeight:700, fontSize:'0.82rem',
                  }}>Upload Answer →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Weak Areas */}
          {weakAreas.length > 0 && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #f1f5f9' }}>
                <h3 style={{ fontWeight:700, color:'#0f172a', margin:'0 0 2px', fontSize:'0.95rem' }}>
                  🎯 Areas to Improve
                </h3>
                <p style={{ margin:0, fontSize:'0.7rem', color:'#94a3b8' }}>
                  Focus on these to boost your overall score
                </p>
              </div>
              <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
                {weakAreas.slice(0, 5).map((area, i) => {
                  const acc = area.correctCount
                    ? (area.correctCount / (area.correctCount + area.incorrectCount)) * 100 : 0;
                  const clr = scoreColor(acc);
                  return (
                    <div key={area.id || i}>
                      <div style={{ display:'flex', justifyContent:'space-between',
                        alignItems:'center', marginBottom:'0.375rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:clr, flexShrink:0 }} />
                          <span style={{ fontWeight:600, fontSize:'0.83rem', color:'#1e293b' }}>
                            {area.name || area.chapter_name || `Area ${i+1}`}
                          </span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                          <span style={{ fontSize:'0.72rem', color:'#94a3b8' }}>
                            {(area.correctCount||0)+(area.incorrectCount||0)} attempts
                          </span>
                          <span style={{ fontWeight:800, fontSize:'0.9rem', color:clr }}>
                            {acc.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div style={{ background:'#f1f5f9', borderRadius:999, height:7, overflow:'hidden' }}>
                        <div style={{
                          height:'100%', width:`${acc}%`, background:clr,
                          borderRadius:999, transition:'width 0.8s ease',
                        }} />
                      </div>
                      <div style={{ fontSize:'0.68rem', color:'#94a3b8', marginTop:4 }}>
                        {acc >= 80 ? '✓ Great — keep reinforcing'
                          : acc >= 60 ? '↗ Good — review key concepts'
                          : acc >= 40 ? '⚠ Focus here — practice more'
                          : '🔴 Priority — spend more time'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

          {/* Level Progression */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #f1f5f9' }}>
              <h3 style={{ fontWeight:700, color:'#0f172a', margin:0, fontSize:'0.9rem' }}>
                🎓 Level Progression
              </h3>
            </div>
            <div style={{ padding:'1.25rem' }}>
              {LEVELS.map((lv, i) => {
                const isCurrent  = lv.key === levelKey;
                const isUnlocked = i <= levelIdx;
                return (
                  <div key={lv.key} style={{
                    display:'flex', alignItems:'center', gap:'0.875rem',
                    padding:'0.625rem 0.75rem', borderRadius:12, marginBottom:'0.375rem',
                    background: isCurrent ? lv.color + '12' : 'transparent',
                    border: `1px solid ${isCurrent ? lv.color + '30' : 'transparent'}`,
                    transition:'all 0.2s',
                  }}>
                    <div style={{
                      width:36, height:36, borderRadius:10, flexShrink:0,
                      background: isUnlocked ? lv.grad : '#f1f5f9',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'1rem',
                      boxShadow: isUnlocked ? `0 4px 12px ${lv.color}30` : 'none',
                      filter: isUnlocked ? 'none' : 'grayscale(1) opacity(0.4)',
                    }}>
                      {lv.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{
                        fontWeight: isCurrent ? 800 : 600,
                        fontSize:'0.83rem',
                        color: isCurrent ? lv.color : isUnlocked ? '#1e293b' : '#cbd5e1',
                      }}>
                        {lv.label}
                      </div>
                      {isCurrent && (
                        <div style={{ fontSize:'0.65rem', color:'#94a3b8', marginTop:1 }}>
                          Current level
                        </div>
                      )}
                    </div>
                    {isCurrent && (
                      <div style={{
                        background:lv.grad, borderRadius:999, padding:'2px 8px',
                        fontSize:'0.6rem', fontWeight:700, color:'#fff',
                        boxShadow:`0 2px 8px ${lv.color}40`,
                      }}>NOW</div>
                    )}
                    {isUnlocked && !isCurrent && (
                      <span style={{ fontSize:'0.9rem' }}>✓</span>
                    )}
                  </div>
                );
              })}
              <div style={{
                marginTop:'0.875rem', padding:'0.75rem', borderRadius:10,
                background:'#f8fafc', border:'1px solid #e2e8f0',
                fontSize:'0.78rem', color:'#64748b', lineHeight:1.5,
              }}>
                {levelInfo.icon} <strong style={{ color:'#1e293b' }}>{levelInfo.label}:</strong>{' '}
                {LEVEL_TIPS[levelKey]}
              </div>
            </div>
          </div>

          {/* Streak card */}
          {streak > 0 && (
            <div style={{
              background:'linear-gradient(135deg,#7c2d12,#c2410c,#ea580c)',
              borderRadius:16, padding:'1.25rem',
              boxShadow:'0 8px 28px rgba(234,88,12,0.35)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
                <div style={{ fontSize:'2.5rem', lineHeight:1 }}>🔥</div>
                <div>
                  <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.7rem',
                    fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                    Improvement Streak
                  </div>
                  <div style={{ color:'#fff', fontSize:'2rem', fontWeight:900, lineHeight:1.1 }}>
                    {streak} <span style={{ fontSize:'0.85rem', fontWeight:500, opacity:0.7 }}>in a row</span>
                  </div>
                  <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.72rem', marginTop:2 }}>
                    Consecutive attempts with improvement
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Achievements */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #f1f5f9' }}>
              <h3 style={{ fontWeight:700, color:'#0f172a', margin:0, fontSize:'0.9rem' }}>
                🏅 Achievements
              </h3>
            </div>
            {achievements.length === 0 ? (
              <div style={{ padding:'2rem', textAlign:'center' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'0.625rem', opacity:0.3 }}>🏅</div>
                <p style={{ color:'#94a3b8', fontSize:'0.8rem', margin:'0 0 0.875rem' }}>
                  No achievements yet. Keep practicing!
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                  {['First Upload', 'Score 60%+', 'Streak of 3', 'Exam Ready'].map(a => (
                    <div key={a} style={{
                      background:'#f8fafc', border:'1px solid #e2e8f0',
                      borderRadius:10, padding:'0.625rem',
                      textAlign:'center', filter:'grayscale(1) opacity(0.5)',
                    }}>
                      <div style={{ fontSize:'1.25rem', marginBottom:3 }}>🔒</div>
                      <div style={{ fontSize:'0.65rem', color:'#94a3b8', fontWeight:600 }}>{a}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding:'1rem',
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem' }}>
                {achievements.map((a, i) => (
                  <div key={a.id || i} style={{
                    background:'linear-gradient(135deg,#fffbeb,#fef3c7)',
                    border:'1px solid #fde68a', borderRadius:12,
                    padding:'0.875rem', textAlign:'center',
                    transition:'transform 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform='scale(1.03)'}
                    onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                  >
                    <div style={{ fontSize:'1.75rem', marginBottom:'0.375rem' }}>
                      {a.icon || '⭐'}
                    </div>
                    <div style={{ fontWeight:800, fontSize:'0.75rem', color:'#92400e', lineHeight:1.3 }}>
                      {a.title || a.name || 'Achievement'}
                    </div>
                    {a.description && (
                      <div style={{ fontSize:'0.62rem', color:'#b45309', marginTop:3, lineHeight:1.4 }}>
                        {a.description}
                      </div>
                    )}
                    {a.unlockedAt && (
                      <div style={{ fontSize:'0.58rem', color:'#d97706', marginTop:4 }}>
                        {new Date(a.unlockedAt).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTAs */}
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {[
              { to:'/upload',   icon:'📤', label:'Upload Answer',   color:'#4f46e5', bg:'#eef2ff', border:'#c7d2fe' },
              { to:'/mistakes', icon:'📖', label:'Mistake Library', color:'#dc2626', bg:'#fef2f2', border:'#fecaca' },
              { to:'/revision', icon:'✏️', label:'Revision Mode',   color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe' },
            ].map(btn => (
              <Link key={btn.to} to={btn.to} style={{
                display:'flex', alignItems:'center', gap:'0.75rem',
                padding:'0.7rem 1rem', borderRadius:12,
                background:btn.bg, border:`1px solid ${btn.border}`,
                textDecoration:'none', color:btn.color, fontWeight:700, fontSize:'0.82rem',
                transition:'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background=btn.color; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background=btn.bg; e.currentTarget.style.color=btn.color; }}
              >
                <span style={{ fontSize:'1rem' }}>{btn.icon}</span>
                {btn.label}
                <span style={{ marginLeft:'auto', fontSize:'0.75rem', opacity:0.6 }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
