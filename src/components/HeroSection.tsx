import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';
import * as THREE from 'three';

interface HeroSectionProps {
  onGetStarted: () => void;
  onSearch?: (query: string, location: string) => void;
  onCompanyClick?: (companyName: string) => void;
}

const CATEGORIES = [
  'CA Articleship',
  'CMA Articleship',
  'CS Training',
  'Big 4 Firms',
  'FP&A / Finance',
  'Taxation',
  'Internship',
  'Remote',
  'Investment Banking',
  'Compliance / CS',
];

const LOCATIONS = [
  'Bengaluru', 'Mumbai', 'Delhi NCR', 'Chennai', 'Hyderabad',
  'Pune', 'Gurugram', 'Ahmedabad', 'Jaipur', 'Remote',
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onSearch, onCompanyClick: _onCompanyClick }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.z = 20;

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    // Brand colors
    const COLORS = [0x1a7a4a, 0x2ea567, 0xfede6d, 0xb8dfc8, 0x0f2419];

    // ── Particle field — small dots drifting upward ──
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    const colorArr = new Float32Array(particleCount * 3);
    const velocities: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      velocities.push(0.008 + Math.random() * 0.012); // upward speed
      const c = new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)]);
      colorArr[i * 3]     = c.r;
      colorArr[i * 3 + 1] = c.g;
      colorArr[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
    const mat = new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, opacity: 0.55, sizeAttenuation: true });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // ── Floating rings — representing career milestones ──
    const rings: { mesh: THREE.Mesh; vy: number; vr: number }[] = [];
    const ringGeo = new THREE.TorusGeometry(0.5, 0.06, 8, 32);
    for (let i = 0; i < 8; i++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: COLORS[i % COLORS.length],
        transparent: true,
        opacity: 0.18 + Math.random() * 0.14,
        wireframe: false,
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 5 - 3
      );
      mesh.scale.setScalar(0.6 + Math.random() * 1.2);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(mesh);
      rings.push({ mesh, vy: 0.006 + Math.random() * 0.008, vr: (Math.random() - 0.5) * 0.008 });
    }

    // ── Small floating triangles — finance chart arrows ──
    const tris: { mesh: THREE.Mesh; vy: number }[] = [];
    const triGeo = new THREE.ConeGeometry(0.22, 0.4, 3);
    for (let i = 0; i < 12; i++) {
      const triMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x1a7a4a : 0xfede6d,
        transparent: true,
        opacity: 0.20 + Math.random() * 0.15,
      });
      const mesh = new THREE.Mesh(triGeo, triMat);
      mesh.position.set(
        (Math.random() - 0.5) * 54,
        (Math.random() - 0.5) * 28,
        (Math.random() - 0.5) * 4 - 2
      );
      mesh.rotation.z = i % 2 === 0 ? 0 : Math.PI; // up or down arrow
      scene.add(mesh);
      tris.push({ mesh, vy: 0.005 + Math.random() * 0.01 });
    }

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // drift particles upward, wrap at top
      const pos = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 1] += velocities[i];
        if (pos[i * 3 + 1] > 15) pos[i * 3 + 1] = -15;
      }
      geo.attributes.position.needsUpdate = true;

      // drift rings
      rings.forEach(({ mesh, vy, vr }) => {
        mesh.position.y += vy;
        mesh.rotation.x += vr;
        mesh.rotation.y += vr * 0.7;
        if (mesh.position.y > 16) mesh.position.y = -16;
      });

      // drift triangles
      tris.forEach(({ mesh, vy }) => {
        mesh.position.y += vy;
        if (mesh.position.y > 16) mesh.position.y = -16;
      });

      // gentle whole-scene sway
      particles.rotation.z += 0.0003;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      ringGeo.dispose();
      triGeo.dispose();
    };
  }, []);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(query, location);
  };

  return (
    <div>
      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(135deg, #e8f5ee 0%, #f0faf4 30%, #fdf8ee 70%, #fef3e2 100%)',
        borderBottom: '1px solid #e5e7eb',
        padding: '64px 24px 56px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 480,
      }}>

        {/* ── Three.js animated canvas background ── */}
        <canvas ref={canvasRef} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── SVG background scene — dotted path + flag ── */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 1400 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* dotted curved journey path */}
          <path d="M 80 420 Q 300 480 500 360 Q 650 280 700 300 Q 760 320 900 260 Q 1050 200 1200 140 Q 1300 110 1380 80"
            fill="none" stroke="#1a7a4a" strokeWidth="2.5" strokeDasharray="6 10" strokeLinecap="round" opacity="0.35" />
          {/* path waypoint dots */}
          {[[140,445],[360,400],[580,330],[700,300],[900,260],[1100,185],[1240,135]].map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r={i===0||i===6?7:5} fill={i===0||i===6?'#1a7a4a':'#b8dfc8'} stroke="#fff" strokeWidth="2" opacity="0.8" />
          ))}
          {/* goal flag at end of path */}
          <rect x="1232" y="82" width="4" height="52" fill="#1a7a4a" rx="2" opacity="0.7" />
          <path d="M1236 82 L1268 93 L1236 104 Z" fill="#f59e0b" opacity="0.9" />
          {/* green checkmark circle on flag */}
          <circle cx="1232" cy="140" r="10" fill="#1a7a4a" opacity="0.8" />
          <path d="M1227 140 L1230 143 L1237 136" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* ── Left floating job card illustration ── */}
        <div style={{
          position: 'absolute', left: '3%', top: '8%',
          background: '#fff', borderRadius: 14, padding: '14px 16px',
          boxShadow: '0 8px 32px rgba(15,36,25,0.10)',
          width: 190, pointerEvents: 'none',
        }} className="hero-float-card hero-float-card-a">
          {/* checkmark badge */}
          <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#1a7a4a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 11 11"><path d="M2 5.5 L4.5 8 L9 3" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f0faf4', border: '1px solid #d7f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#1a7a4a', flexShrink: 0 }}>CA</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#0f2419', fontFamily: 'Manrope,sans-serif', lineHeight: 1.2 }}>CA Articleship</div>
              <div style={{ fontSize: 9, color: '#9ca3af', fontFamily: 'Manrope,sans-serif' }}>Big 4 Firm · Mumbai</div>
            </div>
          </div>
          <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, marginBottom: 5 }}><div style={{ height: '100%', width: '75%', background: '#d7f4ea', borderRadius: 3 }} /></div>
          <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3, width: '55%' }} />
        </div>

        {/* ── Right floating job card illustration ── */}
        <div style={{
          position: 'absolute', right: '3%', top: '6%',
          background: '#fff', borderRadius: 14, padding: '14px 16px',
          boxShadow: '0 8px 32px rgba(15,36,25,0.10)',
          width: 200, pointerEvents: 'none',
        }} className="hero-float-card hero-float-card-b">
          <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#1a7a4a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 11 11"><path d="M2 5.5 L4.5 8 L9 3" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#c2410c', flexShrink: 0 }}>CMA</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#0f2419', fontFamily: 'Manrope,sans-serif', lineHeight: 1.2 }}>Finance Analyst</div>
              <div style={{ fontSize: 9, color: '#9ca3af', fontFamily: 'Manrope,sans-serif' }}>MNC · Bengaluru</div>
            </div>
          </div>
          <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, marginBottom: 5 }}><div style={{ height: '100%', width: '60%', background: '#fde68a', borderRadius: 3 }} /></div>
          <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3, width: '45%' }} />
        </div>

        {/* ── Bottom-left mini card ── */}
        <div style={{
          position: 'absolute', left: '6%', bottom: '14%',
          background: '#fff', borderRadius: 10, padding: '10px 12px',
          boxShadow: '0 4px 16px rgba(15,36,25,0.08)',
          width: 150, pointerEvents: 'none',
        }} className="hero-float-card hero-float-card-c">
          <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, marginBottom: 5, width: '80%' }}><div style={{ height: '100%', width: '90%', background: '#bfdbfe', borderRadius: 3 }} /></div>
          <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3, width: '55%', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#f0faf4', color: '#1a7a4a', fontFamily: 'Manrope,sans-serif' }}>CS</div>
            <div style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#fef3c7', color: '#b45309', fontFamily: 'Manrope,sans-serif' }}>Delhi</div>
          </div>
        </div>

        {/* ── Bottom-right mini card ── */}
        <div style={{
          position: 'absolute', right: '8%', bottom: '10%',
          background: '#0f2419', borderRadius: 10, padding: '10px 14px',
          boxShadow: '0 4px 16px rgba(15,36,25,0.15)',
          width: 160, pointerEvents: 'none',
        }} className="hero-float-card hero-float-card-d">
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: 'Manrope,sans-serif', marginBottom: 4 }}>New today</div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 3, marginBottom: 5 }}><div style={{ height: '100%', width: '70%', background: '#4ade80', borderRadius: 3 }} /></div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, width: '50%' }} />
        </div>

        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Eyebrow */}
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#1a7a4a', background: '#f0faf4', border: '1px solid #d7f4ea', borderRadius: 20, padding: '4px 12px' }}>
            Trusted by 10,000+ finance students
          </span>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#0f2419', margin: '16px 0 0', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Launch Your<br />
            <span style={{ color: '#1a7a4a' }}>Finance Career</span>
          </h1>

          <p style={{ fontSize: 15, color: '#6b7280', margin: '14px 0 4px', fontWeight: 500 }}>
            CA Articleship · CS Training · CMA · ACCA · CFA · Finance Jobs
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 28px' }}>
            Apply directly to verified firms — no middlemen, no fees.
          </p>

          {/* ── SEARCH BAR ── */}
          <form onSubmit={handleSearch} className="hero-search-form" style={{
            display: 'flex', alignItems: 'center',
            background: '#fff', border: '1.5px solid #e5e7eb',
            borderRadius: 10, padding: '6px 6px 6px 18px',
            boxShadow: '0 2px 12px rgba(15,36,25,0.06)',
            gap: 0, maxWidth: 680, margin: '0 auto 40px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <Search size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Job title, qualification, firm name..."
                style={{
                  border: 'none', outline: 'none', fontSize: 14,
                  fontFamily: 'Manrope, sans-serif', color: '#0f2419',
                  background: 'transparent', width: '100%',
                }}
              />
            </div>
            <div className="hero-search-divider" style={{ width: 1, height: 26, background: '#e5e7eb', flexShrink: 0, margin: '0 10px' }} />
            <div className="hero-search-location" style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 130 }}>
              <MapPin size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                style={{
                  border: 'none', outline: 'none', fontSize: 14,
                  fontFamily: 'Manrope, sans-serif', color: location ? '#0f2419' : '#9ca3af',
                  background: 'transparent', cursor: 'pointer',
                  width: '100%', padding: '2px 0',
                }}
              >
                <option value="">All cities</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <button type="submit" style={{
              borderRadius: 7, padding: '9px 22px', marginLeft: 6,
              background: '#0f2419', color: '#fff',
              fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif', flexShrink: 0,
              transition: 'background 0.15s',
            }}
              className="hero-search-btn"
            >
              Search
            </button>
          </form>

          {/* Quick searches */}
          <div style={{ fontSize: 13, color: '#9ca3af' }}>
            Popular:{' '}
            {['CA Articleship', 'Big 4', 'CMA Training', 'CS Articleship', 'Remote'].map((tag, i) => (
              <React.Fragment key={tag}>
                {i > 0 && <span style={{ margin: '0 4px' }}>·</span>}
                <button
                  onClick={() => { if (onSearch) onSearch(tag, ''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a7a4a', fontWeight: 600, fontSize: 13, fontFamily: 'Manrope, sans-serif', padding: 0 }}
                >
                  {tag}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes float-a {
            0%   { transform: rotate(-3deg) translateY(0px); }
            50%  { transform: rotate(-3deg) translateY(-12px); }
            100% { transform: rotate(-3deg) translateY(0px); }
          }
          @keyframes float-b {
            0%   { transform: rotate(2.5deg) translateY(0px); }
            50%  { transform: rotate(2.5deg) translateY(-16px); }
            100% { transform: rotate(2.5deg) translateY(0px); }
          }
          @keyframes float-c {
            0%   { transform: rotate(1.5deg) translateY(0px) translateX(0px); }
            33%  { transform: rotate(1.5deg) translateY(-8px) translateX(4px); }
            66%  { transform: rotate(1.5deg) translateY(-14px) translateX(-3px); }
            100% { transform: rotate(1.5deg) translateY(0px) translateX(0px); }
          }
          @keyframes float-d {
            0%   { transform: rotate(-2deg) translateY(0px); }
            50%  { transform: rotate(-2deg) translateY(-10px); }
            100% { transform: rotate(-2deg) translateY(0px); }
          }
          .hero-float-card-a { animation: float-a 5.5s ease-in-out infinite; }
          .hero-float-card-b { animation: float-b 6.8s ease-in-out infinite; }
          .hero-float-card-c { animation: float-c 7.5s ease-in-out infinite; }
          .hero-float-card-d { animation: float-d 5.0s ease-in-out infinite; }
          @media (max-width: 900px) {
            .hero-float-card { display: none !important; }
          }
        `}</style>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{ background: '#f8faf9', borderBottom: '1px solid #e5e7eb', padding: '20px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', alignItems: 'center' }}>
          {[
            { value: '780+', label: 'Active Jobs' },
            { value: '15+', label: 'Job Sources' },
            { value: '10+', label: 'Cities' },
            { value: 'Free', label: 'Always' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2419', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
          <div style={{ fontSize: 12, color: '#9ca3af', borderLeft: '1px solid #e5e7eb', paddingLeft: 32 }}>
            Updated daily from ICAI, Big 4 career sites &amp; 12+ job boards
          </div>
        </div>
      </section>

      {/* ── CATEGORY CHIPS ── */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { if (onSearch) onSearch(cat, ''); }}
                className="hero-category-chip"
                style={{
                  padding: '7px 16px', borderRadius: 6,
                  border: '1px solid #e5e7eb', background: '#fff',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: '#374151', fontFamily: 'Manrope, sans-serif',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FOR GUESTS ── */}
      <section style={{ background: '#0f2419', padding: '36px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            Your next opportunity is<br />one click away.
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 28px' }}>
            Join thousands of CA, CMA, CS and ACCA students already on ArivuPro.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              style={{
                padding: '11px 28px', borderRadius: 7, background: '#fede6d',
                color: '#0f2419', fontSize: 14, fontWeight: 700,
                border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                transition: 'opacity 0.15s',
              }}
              onClick={onGetStarted}
            >
              Create account
            </button>
            <button
              style={{
                padding: '11px 28px', borderRadius: 7,
                border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent',
                color: '#fff', fontSize: 14, fontWeight: 700,
                fontFamily: 'Manrope, sans-serif', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onClick={onGetStarted}
            >
              Sign in
            </button>
          </div>
        </div>
      </section>

      <style>{`
        .hero-search-btn:hover { background: #1a7a4a !important; }
        .hero-category-chip:hover { border-color: #1a7a4a !important; color: #1a7a4a !important; background: #f0faf4 !important; }
        @media (max-width: 640px) {
          .hero-search-form {
            flex-direction: column !important;
            padding: 12px 14px !important;
            border-radius: 10px !important;
            gap: 10px !important;
            align-items: stretch !important;
          }
          .hero-search-divider { display: none !important; }
          .hero-search-location { display: none !important; }
          .hero-search-btn { width: 100% !important; margin-left: 0 !important; padding: 11px !important; }
        }
      `}</style>
    </div>
  );
};
