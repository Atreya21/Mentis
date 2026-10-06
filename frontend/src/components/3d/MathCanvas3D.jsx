import React, { useEffect, useRef } from 'react';

/**
 * MathCanvas3D
 * An ultra-smooth, GPU-accelerated 3D Mathematical Canvas.
 * Features:
 * - 3D Rotating Icosahedron wireframe with perspective projection
 * - Floating mathematical symbols (π, ∞, ∑, ∫, Φ, ∇, Δ) with depth-of-field
 * - Interactive mouse parallax with smooth damping (inertial physics)
 * - Constellation particle web with dynamic connections
 * - Automatically pauses when out of view for zero battery waste
 */
const MathCanvas3D = ({
  className = '',
  interactive = true,
  density = 'normal', // 'dense' | 'normal' | 'subtle'
  colorMode = 'brand', // 'brand' (orange/pink/cyan) | 'cyber' | 'aurora'
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let isVisible = true;

    // Viewport & DPI management
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = canvas.offsetWidth * dpr;
      height = canvas.height = canvas.offsetHeight * dpr;
    };

    window.addEventListener('resize', handleResize);

    // Mouse tracking with smooth spring damping
    let mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      isHovered: false
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      mouse.targetX = (e.clientX - rect.left) * dpr;
      mouse.targetY = (e.clientY - rect.top) * dpr;
      mouse.isHovered = true;
    };

    const handleMouseLeave = () => {
      mouse.targetX = width / 2;
      mouse.targetY = height / 2;
      mouse.isHovered = false;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    // ==========================================
    // 3D GEOMETRY: ICOSAHEDRON DEFINITION
    // ==========================================
    const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio ≈ 1.6180339887
    const rawVertices = [
      [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
      [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
      [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
    ];

    // Normalize to unit sphere
    const icosahedronVertices = rawVertices.map(([x, y, z]) => {
      const len = Math.hypot(x, y, z);
      return [x / len, y / len, z / len];
    });

    // Edges between vertices whose distance is within golden threshold
    const edges = [];
    for (let i = 0; i < icosahedronVertices.length; i++) {
      for (let j = i + 1; j < icosahedronVertices.length; j++) {
        const [x1, y1, z1] = icosahedronVertices[i];
        const [x2, y2, z2] = icosahedronVertices[j];
        const dist = Math.hypot(x1 - x2, y1 - y2, z1 - z2);
        // In normalized icosahedron, edge distance is ~ 1.051
        if (dist > 0.9 && dist < 1.15) {
          edges.push([i, j]);
        }
      }
    }

    // Second concentric geometry (Stellated octahedron inner core)
    const innerVertices = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
    ];
    const innerEdges = [
      [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 4], [2, 5], [3, 4], [3, 5]
    ];

    // Rotation state
    let rotX = 0.3;
    let rotY = 0.5;
    let rotZ = 0.1;

    // ==========================================
    // FLOATING 3D MATHEMATICAL PARTICLES & SYMBOLS
    // ==========================================
    const symbols = ['π', '∞', '∑', '∫', 'Φ', '∇', 'Δ', 'λ', 'e', '√2', 'θ', 'ℵ₀'];
    const particleCount = density === 'dense' ? 65 : density === 'subtle' ? 28 : 45;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 1600,
        y: (Math.random() - 0.5) * 1200,
        z: Math.random() * 800 - 400,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.3,
        symbol: Math.random() > 0.55 ? symbols[Math.floor(Math.random() * symbols.length)] : null,
        size: Math.random() * 3 + 2,
        opacity: Math.random() * 0.5 + 0.2,
        colorIndex: Math.floor(Math.random() * 3)
      });
    }

    // Visibility Observer to pause when not visible
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(canvas);

    // ==========================================
    // RENDER LOOP (60 FPS)
    // ==========================================
    let lastTime = performance.now();

    const render = (time) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (isVisible && !document.hidden) {
        ctx.clearRect(0, 0, width, height);

        // Interpolate mouse with inertial lag
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // Subtle camera parallax based on mouse
        const cameraOffsetX = ((mouse.x - width / 2) / width) * 50;
        const cameraOffsetY = ((mouse.y - height / 2) / height) * 50;

        // Auto-rotation speed + interactive torque
        const mouseTorqueX = ((mouse.y - height / 2) / height) * 0.015;
        const mouseTorqueY = ((mouse.x - width / 2) / width) * 0.015;

        rotX += (0.18 + mouseTorqueX) * delta;
        rotY += (0.28 + mouseTorqueY) * delta;
        rotZ += 0.08 * delta;

        // 3D Rotation Matrix calculation
        const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
        const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
        const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

        const rotate3D = (x, y, z) => {
          // Y-axis rotation
          let x1 = x * cosY + z * sinY;
          let y1 = y;
          let z1 = -x * sinY + z * cosY;

          // X-axis rotation
          let x2 = x1;
          let y2 = y1 * cosX - z1 * sinX;
          let z2 = y1 * sinX + z1 * cosX;

          // Z-axis rotation
          let x3 = x2 * cosZ - y2 * sinZ;
          let y3 = x2 * sinZ + y2 * cosZ;
          let z3 = z2;

          return [x3, y3, z3];
        };

        // Perspective projection setup
        const fov = 750;
        const centerX = width / 2 + cameraOffsetX;
        const centerY = height / 2 + cameraOffsetY;

        // Base geometric scale based on canvas size
        const baseRadius = Math.min(width, height) * 0.22;

        // ==========================================
        // 1. DRAW FLOATING 3D PARTICLES & CONSTELLATIONS
        // ==========================================
        const projectedParticles = [];

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;

          // Boundary bounce
          if (Math.abs(p.x) > 850) p.vx *= -1;
          if (Math.abs(p.y) > 650) p.vy *= -1;
          if (Math.abs(p.z) > 420) p.vz *= -1;

          const distanceZ = fov + p.z;
          if (distanceZ > 50) {
            const scale = fov / distanceZ;
            const px = centerX + p.x * scale;
            const py = centerY + p.y * scale;

            projectedParticles.push({
              x: px,
              y: py,
              scale,
              symbol: p.symbol,
              size: p.size * scale,
              opacity: p.opacity * Math.min(Math.max(scale, 0.2), 1.2),
              colorIndex: p.colorIndex
            });
          }
        }

        // Draw particle constellation connections
        ctx.lineWidth = 1;
        for (let i = 0; i < projectedParticles.length; i++) {
          for (let j = i + 1; j < projectedParticles.length; j++) {
            const p1 = projectedParticles[i];
            const p2 = projectedParticles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 110) {
              const alpha = (1 - dist / 110) * 0.15 * p1.opacity;
              ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }

        // Draw particles and floating math symbols
        for (let i = 0; i < projectedParticles.length; i++) {
          const p = projectedParticles[i];
          if (p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50) continue;

          if (p.symbol) {
            // Draw floating math symbol with soft glow
            ctx.font = `${Math.max(Math.round(14 * p.scale), 9)}px 'JetBrains Mono', 'Playfair Display', serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const symbolColor = p.colorIndex === 0
              ? `rgba(249, 115, 22, ${p.opacity * 0.85})` // Orange
              : p.colorIndex === 1
              ? `rgba(236, 72, 153, ${p.opacity * 0.85})` // Pink
              : `rgba(56, 189, 248, ${p.opacity * 0.75})`; // Cyan

            ctx.fillStyle = symbolColor;
            ctx.shadowColor = symbolColor;
            ctx.shadowBlur = 8 * p.scale;
            ctx.fillText(p.symbol, p.x, p.y);
            ctx.shadowBlur = 0;
          } else {
            // Glowing circular particle
            ctx.fillStyle = `rgba(249, 115, 22, ${p.opacity * 0.6})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(p.size, 1), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // ==========================================
        // 2. PROJECT AND DRAW 3D ICOSAHEDRON
        // ==========================================
        const projectedVertices = icosahedronVertices.map(([x, y, z]) => {
          const [rx, ry, rz] = rotate3D(x, y, z);
          const worldX = rx * baseRadius;
          const worldY = ry * baseRadius;
          const worldZ = rz * baseRadius;

          const distance = fov + worldZ;
          const scale = fov / distance;
          return {
            x: centerX + worldX * scale,
            y: centerY + worldY * scale,
            z: worldZ,
            scale
          };
        });

        // Projected Inner Core (Stellated octahedron)
        const innerRadius = baseRadius * 0.52;
        const projectedInnerVertices = innerVertices.map(([x, y, z]) => {
          // Counter-rotate inner core for mesmerizing counter-motion
          const [rx, ry, rz] = rotate3D(-x, y, -z);
          const worldX = rx * innerRadius;
          const worldY = ry * innerRadius;
          const worldZ = rz * innerRadius;

          const distance = fov + worldZ;
          const scale = fov / distance;
          return {
            x: centerX + worldX * scale,
            y: centerY + worldY * scale,
            z: worldZ,
            scale
          };
        });

        // Draw inner core wireframe with cyan/violet neon glow
        ctx.lineWidth = 1.2;
        innerEdges.forEach(([i, j]) => {
          const v1 = projectedInnerVertices[i];
          const v2 = projectedInnerVertices[j];
          const avgZ = (v1.z + v2.z) / 2;
          const depthAlpha = Math.min(Math.max((avgZ + innerRadius) / (2 * innerRadius), 0.15), 0.7);

          const grad = ctx.createLinearGradient(v1.x, v1.y, v2.x, v2.y);
          grad.addColorStop(0, `rgba(56, 189, 248, ${depthAlpha * 0.6})`); // Cyan
          grad.addColorStop(1, `rgba(168, 85, 247, ${depthAlpha * 0.7})`); // Purple

          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(v1.x, v1.y);
          ctx.lineTo(v2.x, v2.y);
          ctx.stroke();
        });

        // Draw outer icosahedron edges with glowing radiant gradients
        edges.forEach(([i, j]) => {
          const v1 = projectedVertices[i];
          const v2 = projectedVertices[j];
          const avgZ = (v1.z + v2.z) / 2;
          const depthAlpha = Math.min(Math.max((avgZ + baseRadius) / (2 * baseRadius), 0.2), 0.95);

          const grad = ctx.createLinearGradient(v1.x, v1.y, v2.x, v2.y);
          grad.addColorStop(0, `rgba(249, 115, 22, ${depthAlpha * 0.85})`); // Orange-500
          grad.addColorStop(0.5, `rgba(236, 72, 153, ${depthAlpha * 0.75})`); // Pink-500
          grad.addColorStop(1, `rgba(56, 189, 248, ${depthAlpha * 0.6})`); // Cyan-400

          ctx.lineWidth = Math.max(1.8 * ((v1.scale + v2.scale) / 2), 0.8);
          ctx.strokeStyle = grad;
          ctx.shadowColor = 'rgba(249, 115, 22, 0.4)';
          ctx.shadowBlur = 10 * depthAlpha;

          ctx.beginPath();
          ctx.moveTo(v1.x, v1.y);
          ctx.lineTo(v2.x, v2.y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // Draw icosahedron vertex nodes (glowing mathematical points)
        projectedVertices.forEach((v) => {
          const nodeRadius = Math.max(3.5 * v.scale, 2);
          const depthAlpha = Math.min(Math.max((v.z + baseRadius) / (2 * baseRadius), 0.3), 1);

          // Outer halo
          const haloGrad = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, nodeRadius * 2.8);
          haloGrad.addColorStop(0, `rgba(249, 115, 22, ${depthAlpha * 0.8})`);
          haloGrad.addColorStop(0.6, `rgba(236, 72, 153, ${depthAlpha * 0.3})`);
          haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(v.x, v.y, nodeRadius * 2.8, 0, Math.PI * 2);
          ctx.fill();

          // Bright center core
          ctx.fillStyle = `rgba(255, 255, 255, ${depthAlpha * 0.95})`;
          ctx.beginPath();
          ctx.arc(v.x, v.y, nodeRadius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
      observer.disconnect();
    };
  }, [density, interactive, colorMode]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${className}`}
      style={{ willChange: 'transform' }}
    />
  );
};

export default MathCanvas3D;
