import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AmbientCanvasProps {
  density?: 'low' | 'medium';
  style?: React.CSSProperties;
}

// Shared lightweight Three.js ambient background — fewer particles than Hero
export function AmbientCanvas({ density = 'low', style }: AmbientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 20;

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const COLORS = [0x1a7a4a, 0x2ea567, 0xfede6d, 0xb8dfc8];
    const count = density === 'medium' ? 60 : 35;

    const positions = new Float32Array(count * 3);
    const colorArr = new Float32Array(count * 3);
    const velocities: number[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      velocities.push(0.006 + Math.random() * 0.009);
      const c = new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)]);
      colorArr[i * 3]     = c.r;
      colorArr[i * 3 + 1] = c.g;
      colorArr[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.18, vertexColors: true,
      transparent: true, opacity: 0.35, sizeAttenuation: true,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    // 3–4 tiny slow-drifting rings
    const rings: THREE.Mesh[] = [];
    const ringGeo = new THREE.TorusGeometry(0.4, 0.05, 6, 24);
    const ringCount = density === 'medium' ? 4 : 2;
    for (let i = 0; i < ringCount; i++) {
      const rm = new THREE.MeshBasicMaterial({
        color: COLORS[i % COLORS.length], transparent: true,
        opacity: 0.10 + Math.random() * 0.08,
      });
      const mesh = new THREE.Mesh(ringGeo, rm);
      mesh.position.set(
        (Math.random() - 0.5) * 44,
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 4 - 4,
      );
      mesh.scale.setScalar(0.5 + Math.random() * 1.0);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(mesh);
      rings.push(mesh);
    }

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const pos = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += velocities[i];
        if (pos[i * 3 + 1] > 15) pos[i * 3 + 1] = -15;
      }
      geo.attributes.position.needsUpdate = true;
      rings.forEach((m, i) => {
        m.position.y += 0.004 + i * 0.001;
        m.rotation.x += 0.004;
        if (m.position.y > 14) m.position.y = -14;
      });
      pts.rotation.z += 0.0002;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      ringGeo.dispose();
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
        ...style,
      }}
    />
  );
}
