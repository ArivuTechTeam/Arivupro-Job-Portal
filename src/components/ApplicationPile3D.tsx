import React, { useEffect, useRef } from 'react';
import { JobApplication } from '../types/index.ts';

interface Props {
  applications: JobApplication[];
  onBrowseJobs: () => void;
}

export const ApplicationPile3D: React.FC<Props> = ({ applications, onBrowseJobs }) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (applications.length === 0) return;

    const el = host; // narrowed non-null reference for use inside closures
    let renderer: any;
    let raf = 0;
    let visible = true;

    const cleanup = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    (async () => {
      let THREE: any;
      try {
        THREE = await import('three');
      } catch {
        return;
      }

      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        el.style.display = 'none';
        return;
      }

      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);

      scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe6e1, 1.7));
      const sun = new THREE.DirectionalLight(0xffffff, 1.5);
      sun.position.set(-3, 9, 5);
      sun.castShadow = true;
      sun.shadow.mapSize.set(innerWidth < 640 ? 512 : 1024, innerWidth < 640 ? 512 : 1024);
      Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 });
      scene.add(sun);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        new THREE.ShadowMaterial({ opacity: 0.12 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const MAX = 20;
      const pile = applications.slice(0, MAX).reverse(); // oldest at bottom, newest on top
      const T = 0.11, STEP = 0.135;
      const geo = new THREE.BoxGeometry(2.6, T, 1.8);
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const matIn = new THREE.MeshStandardMaterial({ color: '#1a7a4a', roughness: 0.7 });
      const matEx = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 });
      const edgeIn = new THREE.LineBasicMaterial({ color: 0x0f4d2e });
      const edgeEx = new THREE.LineBasicMaterial({ color: 0x9fb3a8 });

      const group = new THREE.Group();
      group.position.set(-0.3, 0, 0); // slight left offset so shadow doesn't clip right edge
      scene.add(group);

      const cards = pile.map((a, i) => {
        const m = new THREE.Mesh(geo, a.kind === 'internal' ? matIn : matEx);
        m.add(new THREE.LineSegments(edgeGeo, a.kind === 'internal' ? edgeIn : edgeEx));
        m.position.set(Math.sin(i * 2.3) * 0.12, T / 2 + i * STEP, Math.cos(i * 1.7) * 0.1);
        m.rotation.y = Math.sin(i * 1.3) * 0.12;
        m.castShadow = true;
        m.receiveShadow = true;
        group.add(m);
        return m;
      });

      const topY = T / 2 + (pile.length - 1) * STEP;
      const newest = cards[cards.length - 1];
      const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const t0 = performance.now();
      let tx = 0;

      const handlePointerMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 0.25;
      };
      const handlePointerLeave = () => { tx = 0; };
      el.parentElement?.addEventListener('pointermove', handlePointerMove);
      el.parentElement?.addEventListener('pointerleave', handlePointerLeave);

      function draw(t: number) {
        if (newest) {
          const k = still ? 1 : Math.min(1, (t - t0) / 700);
          const ease = 1 - Math.pow(1 - k, 3);
          newest.position.y = topY + (1 - ease) * 1.4;
        }
        group.rotation.y += (tx - group.rotation.y) * 0.08;
        renderer.render(scene, cam);
      }

      function resize() {
        const w = el.clientWidth, h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        // Fixed camera position — isometric-ish angle, centered on the pile mid-height
        const midY = topY / 2;
        cam.position.set(4, midY + 3.5, 6);
        cam.lookAt(0, midY, 0);
        // halfH is fixed so the pile always looks the same regardless of card count
        const halfH = 2.4;
        const halfW = halfH * w / h;
        Object.assign(cam, { left: -halfW, right: halfW, top: halfH, bottom: -halfH, zoom: 1 });
        cam.updateProjectionMatrix();
        draw(performance.now());
      }

      function loop(t: number) {
        draw(t);
        raf = visible && !still ? requestAnimationFrame(loop) : 0;
      }

      const io = new IntersectionObserver(([en]) => {
        visible = en.isIntersecting;
        if (visible && !raf && !still) raf = requestAnimationFrame(loop);
      });
      io.observe(el);

      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      // Store cleanup refs on the closure so the effect cleanup can reach them
      (cleanup as any)._full = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        el.parentElement?.removeEventListener('pointermove', handlePointerMove);
        el.parentElement?.removeEventListener('pointerleave', handlePointerLeave);
        geo.dispose();
        edgeGeo.dispose();
        matIn.dispose();
        matEx.dispose();
        edgeIn.dispose();
        edgeEx.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      if ((cleanup as any)._full) (cleanup as any)._full();
      else cleanup();
    };
  }, [applications]);

  if (applications.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '32px 20px', background: '#f7f9f8', height: '100%', minHeight: 180 }}>
        <div style={{ fontSize: 13, color: '#5f6b65', textAlign: 'center' }}>Apply to your first job and it will show up here.</div>
        <button
          onClick={onBrowseJobs}
          style={{ height: 36, padding: '0 14px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: '1px solid #1a7a4a', background: '#1a7a4a', color: '#fff', fontFamily: 'Manrope, sans-serif' }}
        >
          Browse jobs
        </button>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      style={{ position: 'relative', width: '100%', aspectRatio: '1.25 / 1', minHeight: 180, background: '#f7f9f8' }}
      className="pile3d-host"
    />
  );
};

export default ApplicationPile3D;
