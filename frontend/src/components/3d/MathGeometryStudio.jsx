import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Sparkles, Eye, Compass, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * MathGeometryStudio
 * A professional, GPU-accelerated interactive 3D Mathematical Geometry Studio.
 * Features:
 * - 4 Interactive Mathematical Objects:
 *   1. 3D Icosahedron & Dual Core (Golden Ratio geometry)
 *   2. Lorenz Strange Attractor (Live chaos theory simulation)
 *   3. Möbius Ribbon Manifold (Continuous non-orientable topology)
 *   4. 4D Hypercube / Tesseract (4D-to-3D projection)
 * - Click & Drag full 3D orbital control with inertial decay
 * - Mouse wheel zoom with clamp
 * - Click to emit shockwave ripples
 * - Live HUD showing telemetry, Euler angles, and formula details
 */
const MathGeometryStudio = ({ className = '', heroImage = null }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Studio state
  const [activeMode, setActiveMode] = useState('icosahedron'); // 'icosahedron' | 'lorenz' | 'mobius' | 'tesseract'
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'image'
  const [telemetry, setTelemetry] = useState({ rotX: '15°', rotY: '24°', points: 12, fps: 60 });
  const [isInteracting, setIsInteracting] = useState(false);

  // References for animation state
  const stateRef = useRef({
    rotX: 0.2,
    rotY: 0.4,
    rotZ: 0.1,
    rot4D_XW: 0.0,
    rot4D_YZ: 0.0,
    zoom: 1.0,
    velX: 0.002,
    velY: 0.004,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    ripples: []
  });

  // Lorenz state
  const lorenzRef = useRef({
    particles: Array.from({ length: 65 }, () => ({
      x: (Math.random() - 0.5) * 5,
      y: (Math.random() - 0.5) * 5,
      z: 20 + (Math.random() - 0.5) * 5,
      history: []
    }))
  });

  useEffect(() => {
    if (viewMode !== '3d') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId;
    let isVisible = true;
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = (canvas.width = canvas.offsetWidth * dpr);
    let height = (canvas.height = canvas.offsetHeight * dpr);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * dpr;
      height = canvas.height = canvas.offsetHeight * dpr;
    };

    window.addEventListener('resize', handleResize);

    // ==========================================
    // 3D & 4D GEOMETRY DEFINITIONS
    // ==========================================

    // 1. Icosahedron
    const PHI = (1 + Math.sqrt(5)) / 2;
    const rawIco = [
      [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
      [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
      [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
    ];
    const icoVertices = rawIco.map(([x, y, z]) => {
      const len = Math.hypot(x, y, z);
      return [x / len, y / len, z / len];
    });

    const icoEdges = [];
    for (let i = 0; i < icoVertices.length; i++) {
      for (let j = i + 1; j < icoVertices.length; j++) {
        const [x1, y1, z1] = icoVertices[i];
        const [x2, y2, z2] = icoVertices[j];
        if (Math.hypot(x1 - x2, y1 - y2, z1 - z2) < 1.15) {
          icoEdges.push([i, j]);
        }
      }
    }

    // 2. Möbius Strip Vertices & Edges
    const mobiusPoints = [];
    const mobiusEdges = [];
    const uSegments = 32;
    const vSegments = 5;
    for (let i = 0; i <= uSegments; i++) {
      const u = (i / uSegments) * Math.PI * 2;
      for (let j = 0; j <= vSegments; j++) {
        const v = ((j / vSegments) - 0.5) * 0.75;
        const x = (1 + (v / 2) * Math.cos(u / 2)) * Math.cos(u);
        const y = (1 + (v / 2) * Math.cos(u / 2)) * Math.sin(u);
        const z = (v / 2) * Math.sin(u / 2);
        mobiusPoints.push([x, y, z]);
      }
    }
    for (let i = 0; i < uSegments; i++) {
      for (let j = 0; j < vSegments; j++) {
        const idx = i * (vSegments + 1) + j;
        mobiusEdges.push([idx, idx + 1]);
        mobiusEdges.push([idx, (idx + vSegments + 1) % mobiusPoints.length]);
      }
    }

    // 3. 4D Hypercube (Tesseract) - 16 vertices, 32 edges
    const tesseract4D = [];
    for (let i = 0; i < 16; i++) {
      tesseract4D.push([
        (i & 1) ? 1 : -1,
        (i & 2) ? 1 : -1,
        (i & 4) ? 1 : -1,
        (i & 8) ? 1 : -1
      ]);
    }
    const tesseractEdges = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        // Connected if they differ by exactly one coordinate
        let diff = 0;
        for (let k = 0; k < 4; k++) {
          if (tesseract4D[i][k] !== tesseract4D[j][k]) diff++;
        }
        if (diff === 1) tesseractEdges.push([i, j]);
      }
    }

    // Observer for pause when off-screen
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(canvas);

    // ==========================================
    // RENDER LOOP
    // ==========================================
    let lastTime = performance.now();

    const render = (now) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Track FPS
      frameCount++;
      if (now - lastFpsUpdate > 800) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
        setTelemetry((prev) => ({
          ...prev,
          fps: currentFps,
          rotX: `${Math.round(((stateRef.current.rotX % (Math.PI * 2)) * 180) / Math.PI)}°`,
          rotY: `${Math.round(((stateRef.current.rotY % (Math.PI * 2)) * 180) / Math.PI)}°`
        }));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      if (isVisible && !document.hidden) {
        ctx.clearRect(0, 0, width, height);

        const state = stateRef.current;

        // Apply inertial friction when not dragging
        if (!state.isDragging) {
          state.rotX += state.velX;
          state.rotY += state.velY;
          state.rot4D_XW += 0.012;
          state.rot4D_YZ += 0.018;
          state.velX *= 0.96;
          state.velY *= 0.96;
          // Minimum auto-rotation
          if (Math.abs(state.velX) < 0.001) state.velX = 0.002;
          if (Math.abs(state.velY) < 0.002) state.velY = 0.0035;
        }

        const cx = width / 2;
        const cy = height / 2;
        const fov = 650;
        const scaleBase = Math.min(width, height) * 0.28 * state.zoom;

        // 3D Rotation helper
        const cosX = Math.cos(state.rotX), sinX = Math.sin(state.rotX);
        const cosY = Math.cos(state.rotY), sinY = Math.sin(state.rotY);
        const cosZ = Math.cos(state.rotZ), sinZ = Math.sin(state.rotZ);

        const project3D = (x, y, z) => {
          let x1 = x * cosY + z * sinY;
          let y1 = y;
          let z1 = -x * sinY + z * cosY;

          let x2 = x1;
          let y2 = y1 * cosX - z1 * sinX;
          let z2 = y1 * sinX + z1 * cosX;

          let x3 = x2 * cosZ - y2 * sinZ;
          let y3 = x2 * sinZ + y2 * cosZ;
          let z3 = z2;

          const dist = fov + z3 * scaleBase;
          const s = dist > 50 ? fov / dist : 1;
          return {
            x: cx + x3 * scaleBase * s,
            y: cy + y3 * scaleBase * s,
            z: z3,
            scale: s
          };
        };

        // ==========================================
        // DRAW MODE 1: ICOSAHEDRON & DUAL CORE
        // ==========================================
        if (activeMode === 'icosahedron') {
          const pts = icoVertices.map(([x, y, z]) => project3D(x, y, z));

          // Draw Edges with glowing gradient
          ctx.lineWidth = 1.6;
          icoEdges.forEach(([i, j]) => {
            const p1 = pts[i];
            const p2 = pts[j];
            const avgZ = (p1.z + p2.z) / 2;
            const alpha = Math.min(Math.max((avgZ + 1.2) / 2.4, 0.2), 0.95);

            const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            grad.addColorStop(0, `rgba(249, 115, 22, ${alpha})`); // Orange
            grad.addColorStop(0.5, `rgba(236, 72, 153, ${alpha * 0.9})`); // Pink
            grad.addColorStop(1, `rgba(56, 189, 248, ${alpha * 0.7})`); // Cyan

            ctx.strokeStyle = grad;
            ctx.shadowColor = 'rgba(249, 115, 22, 0.4)';
            ctx.shadowBlur = 8 * alpha;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.shadowBlur = 0;
          });

          // Draw Vertices
          pts.forEach((p) => {
            const rad = Math.max(3.5 * p.scale, 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          });
        }

        // ==========================================
        // DRAW MODE 2: LORENZ STRANGE ATTRACTOR
        // ==========================================
        else if (activeMode === 'lorenz') {
          const lorenz = lorenzRef.current;
          const dt = 0.012;
          const sigma = 10;
          const rho = 28;
          const beta = 8 / 3;

          ctx.lineWidth = 1.4;

          lorenz.particles.forEach((p, idx) => {
            // Euler differential step
            const dx = sigma * (p.y - p.x);
            const dy = p.x * (rho - p.z) - p.y;
            const dz = p.x * p.y - beta * p.z;

            p.x += dx * dt;
            p.y += dy * dt;
            p.z += dz * dt;

            // Normalized coordinates centered at attractor center (0, 0, 25)
            const nx = p.x * 0.045;
            const ny = p.y * 0.045;
            const nz = (p.z - 25) * 0.045;

            const proj = project3D(nx, ny, nz);
            p.history.push({ x: proj.x, y: proj.y, z: proj.z });
            if (p.history.length > 22) p.history.shift();

            // Draw glowing trajectory trail
            if (p.history.length > 2) {
              ctx.beginPath();
              ctx.moveTo(p.history[0].x, p.history[0].y);
              for (let k = 1; k < p.history.length; k++) {
                ctx.lineTo(p.history[k].x, p.history[k].y);
              }

              const hue = (idx * 5 + now * 0.05) % 360;
              ctx.strokeStyle = idx % 2 === 0
                ? `rgba(249, 115, 22, 0.75)`
                : `rgba(236, 72, 153, 0.75)`;
              ctx.shadowColor = 'rgba(236, 72, 153, 0.5)';
              ctx.shadowBlur = 6;
              ctx.stroke();
              ctx.shadowBlur = 0;
            }

            // Head particle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        // ==========================================
        // DRAW MODE 3: MÖBIUS STRIP MANIFOLD
        // ==========================================
        else if (activeMode === 'mobius') {
          const pts = mobiusPoints.map(([x, y, z]) => project3D(x * 0.9, y * 0.9, z * 0.9));

          ctx.lineWidth = 1.1;
          mobiusEdges.forEach(([i, j]) => {
            const p1 = pts[i];
            const p2 = pts[j];
            if (!p1 || !p2) return;

            const alpha = Math.min(Math.max((p1.z + 1) / 2, 0.15), 0.85);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`; // Electric cyan
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          });
        }

        // ==========================================
        // DRAW MODE 4: 4D HYPERCUBE (TESSERACT)
        // ==========================================
        else if (activeMode === 'tesseract') {
          // 4D Rotation in XW and YZ planes
          const cosXW = Math.cos(state.rot4D_XW);
          const sinXW = Math.sin(state.rot4D_XW);
          const cosYZ = Math.cos(state.rot4D_YZ);
          const sinYZ = Math.sin(state.rot4D_YZ);

          const pts = tesseract4D.map(([x, y, z, w]) => {
            // Rotate in XW plane
            const rx = x * cosXW - w * sinXW;
            const rw = x * sinXW + w * cosXW;

            // Rotate in YZ plane
            const ry = y * cosYZ - z * sinYZ;
            const rz = y * sinYZ + z * cosYZ;

            // 4D-to-3D Stereographic Perspective Projection
            const dist4D = 2.4;
            const wProj = 1 / (dist4D - rw);
            const x3D = rx * wProj * 1.5;
            const y3D = ry * wProj * 1.5;
            const z3D = rz * wProj * 1.5;

            return project3D(x3D, y3D, z3D);
          });

          // Draw Tesseract Edges
          ctx.lineWidth = 1.5;
          tesseractEdges.forEach(([i, j]) => {
            const p1 = pts[i];
            const p2 = pts[j];
            const avgZ = (p1.z + p2.z) / 2;
            const alpha = Math.min(Math.max((avgZ + 1.2) / 2.4, 0.2), 0.95);

            const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            grad.addColorStop(0, `rgba(249, 115, 22, ${alpha})`);
            grad.addColorStop(1, `rgba(168, 85, 247, ${alpha})`);

            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          });

          // Draw 16 4D Vertices
          pts.forEach((p) => {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(3 * p.scale, 2), 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          });
        }

        // Draw Interactive Click Shockwaves
        state.ripples.forEach((rip, rIdx) => {
          rip.radius += 5;
          rip.alpha *= 0.95;

          ctx.strokeStyle = `rgba(249, 115, 22, ${rip.alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          ctx.stroke();

          if (rip.alpha < 0.02) {
            state.ripples.splice(rIdx, 1);
          }
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [activeMode, viewMode]);

  // ==========================================
  // MOUSE & TOUCH EVENT HANDLERS (FULL 3D ORBIT)
  // ==========================================
  const handleMouseDown = (e) => {
    stateRef.current.isDragging = true;
    stateRef.current.lastMouseX = e.clientX;
    stateRef.current.lastMouseY = e.clientY;
    setIsInteracting(true);
  };

  const handleMouseMove = (e) => {
    if (!stateRef.current.isDragging) return;
    const dx = e.clientX - stateRef.current.lastMouseX;
    const dy = e.clientY - stateRef.current.lastMouseY;

    stateRef.current.rotY += dx * 0.008;
    stateRef.current.rotX += dy * 0.008;
    stateRef.current.velY = dx * 0.004;
    stateRef.current.velX = dy * 0.004;

    stateRef.current.lastMouseX = e.clientX;
    stateRef.current.lastMouseY = e.clientY;
  };

  const handleMouseUp = () => {
    stateRef.current.isDragging = false;
    setTimeout(() => setIsInteracting(false), 800);
  };

  const handleClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const clickX = (e.clientX - rect.left) * dpr;
    const clickY = (e.clientY - rect.top) * dpr;

    stateRef.current.ripples.push({
      x: clickX,
      y: clickY,
      radius: 5,
      alpha: 0.8
    });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0015;
    stateRef.current.zoom = Math.min(Math.max(stateRef.current.zoom + zoomDelta, 0.65), 1.85);
  };

  const modeDescriptions = {
    icosahedron: {
      name: 'Icosahedron & Golden Ratio',
      formula: 'x² + y² + z² = Φ',
      info: '12 golden-ratio vertices with 30 edges in Euclidean 3-space.'
    },
    lorenz: {
      name: 'Lorenz Strange Attractor',
      formula: 'dx/dt = σ(y - x)',
      info: 'Deterministic chaos orbits tracing the infinite butterfly manifold.'
    },
    mobius: {
      name: 'Möbius Loop Topology',
      formula: 'x(u,v) = (1 + v/2 cos u/2) cos u',
      info: 'Non-orientable two-dimensional manifold with a single continuous boundary.'
    },
    tesseract: {
      name: '4D Hypercube (Tesseract)',
      formula: 'x₄² + y₄² + z₄² + w₄² = 1',
      info: '16 vertices rotating in 4D space, projected stereographically.'
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-900/90 border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl ${className}`}
    >
      {/* Top Header / View Switcher */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md z-20 relative">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
          </span>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
            {viewMode === '3d' ? '3D Geometry Studio' : 'Foundation Showcase'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewMode(viewMode === '3d' ? 'image' : '3d')}
            className="text-xs h-7 px-2.5 rounded-lg border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white"
          >
            {viewMode === '3d' ? (
              <>
                <Eye className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                <span>Showcase Image</span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5 mr-1 text-orange-400" />
                <span>3D Studio</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Studio View */}
      <div className="relative h-[380px] sm:h-[420px] lg:h-[460px] w-full overflow-hidden select-none">
        {viewMode === '3d' ? (
          <>
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={handleClick}
              onWheel={handleWheel}
              className={`w-full h-full cursor-grab active:cursor-grabbing transition-transform ${
                isInteracting ? 'scale-[1.01]' : 'scale-100'
              }`}
            />

            {/* Live Interactive Drag Hint */}
            <div className="absolute top-3 left-4 pointer-events-none z-10 flex flex-col gap-1">
              <div className="text-[11px] font-mono text-orange-400 font-semibold tracking-wide flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1 rounded-md border border-slate-800/80 backdrop-blur-sm">
                <RotateCw className="w-3 h-3 animate-spin text-orange-400" style={{ animationDuration: '6s' }} />
                <span>Click &amp; Drag to Orbit in 3D • Scroll to Zoom</span>
              </div>
            </div>

            {/* Live Telemetry HUD */}
            <div className="absolute top-3 right-4 pointer-events-none z-10 hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/70 px-2.5 py-1 rounded-md border border-slate-800/80 backdrop-blur-sm">
              <span>{telemetry.fps} FPS</span>
              <span>•</span>
              <span>θ: {telemetry.rotX}</span>
              <span>•</span>
              <span>φ: {telemetry.rotY}</span>
            </div>

            {/* Active Geometry Formula Overlay */}
            <div className="absolute bottom-16 inset-x-4 pointer-events-none z-10">
              <div className="p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 max-w-md mx-auto text-center shadow-lg">
                <div className="text-xs font-mono font-bold text-white">
                  {modeDescriptions[activeMode].name}
                </div>
                <div className="text-xs font-mono text-orange-400 mt-0.5 font-semibold">
                  {modeDescriptions[activeMode].formula}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  {modeDescriptions[activeMode].info}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Image Showcase View */
          <div className="relative w-full h-full">
            <img
              src={heroImage || 'https://images.unsplash.com/photo-1741298167028-1e781b6b3bbe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG1hdGhlbWF0aWNzJTIwZ2VvbWV0cnklMjBhcnR8ZW58MHx8fHwxNzY5OTM2NzAyfDA&ixlib=rb-4.1.0&q=85'}
              alt="Mentis Showcase"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          </div>
        )}
      </div>

      {/* Geometry Object Selector Bar */}
      {viewMode === '3d' && (
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 backdrop-blur-md flex items-center justify-between gap-1.5 overflow-x-auto z-20 relative">
          <div className="flex items-center gap-1.5 w-full justify-between">
            {[
              { id: 'icosahedron', label: 'Icosahedron' },
              { id: 'lorenz', label: 'Lorenz Chaos' },
              { id: 'mobius', label: 'Möbius Loop' },
              { id: 'tesseract', label: '4D Tesseract' }
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setActiveMode(btn.id)}
                className={`text-xs font-mono py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 flex-1 justify-center whitespace-nowrap ${
                  activeMode === btn.id
                    ? 'bg-gradient-to-r from-orange-500/25 to-pink-500/20 text-white border border-orange-500/40 font-semibold shadow-sm shadow-orange-500/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {activeMode === btn.id && <Sparkles className="w-3 h-3 text-orange-400" />}
                <span>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MathGeometryStudio;
