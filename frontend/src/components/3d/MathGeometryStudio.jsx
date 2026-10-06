import React, { useRef, useEffect, useState, useMemo, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCw,
  Sparkles,
  Eye,
  Compass,
  ChevronDown,
  Check,
  Layers,
  Zap,
  Activity,
  Orbit,
  Box,
  Cpu,
  Bookmark,
  Star
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';

/**
 * 14 Mathematical Geometry Models Metadata & Specifications
 */
const GEOMETRY_MODELS = [
  // Category 1: Sacred Polyhedra & Higher Dimensions
  {
    id: 'icosahedron',
    name: 'Golden-Ratio Icosahedron',
    category: 'Sacred Polyhedra',
    code: 'SYS//SACRED-01',
    formula: 'x² + y² + z² = Φ',
    info: '12 golden-ratio vertices with dual counter-rotating inner core in Euclidean 3-space.',
    icon: Box,
    accent: 'orange'
  },
  {
    id: 'tesseract',
    name: '4D Hypercube (Tesseract)',
    category: 'Higher Dimensions',
    code: 'SYS//DIM4-02',
    formula: 'x₄² + y₄² + z₄² + w₄² = 1',
    info: '16 vertices in 4D space rotating simultaneously across XW and YZ planes with stereographic projection.',
    icon: Layers,
    accent: 'pink'
  },
  {
    id: 'dodecahedron',
    name: 'Stellated Dodecahedron',
    category: 'Sacred Polyhedra',
    code: 'SYS//SACRED-03',
    formula: 'V_stell = V_face + λ n̂_face',
    info: 'Hyperbolic star polyhedron featuring 20 base nodes and 12 stellated apex beacons.',
    icon: Sparkles,
    accent: 'cyan'
  },
  {
    id: 'clifford_torus',
    name: '4D Clifford Flat Torus',
    category: 'Higher Dimensions',
    code: 'SYS//DIM4-04',
    formula: 'X² + Y² = 1/2, Z² + W² = 1/2',
    info: 'Flat torus in S³ projected stereographically into orthogonal Villarceau circles.',
    icon: Orbit,
    accent: 'emerald'
  },

  // Category 2: Topology & Non-Orientable Manifolds
  {
    id: 'mobius',
    name: 'Möbius Ribbon Manifold',
    category: 'Topology',
    code: 'SYS//TOPO-05',
    formula: 'x(u,v) = (1 + v/2 cos u/2) cos u',
    info: 'Non-orientable two-dimensional manifold with a single continuous edge boundary.',
    icon: Orbit,
    accent: 'cyan'
  },
  {
    id: 'klein',
    name: 'Klein Bottle (Figure-8)',
    category: 'Topology',
    code: 'SYS//TOPO-06',
    formula: 'r(u,v) = a + cos(u/2)sin v - sin(u/2)sin 2v',
    info: 'One-sided closed non-orientable surface with self-intersecting throat and zero net volume.',
    icon: Orbit,
    accent: 'pink'
  },
  {
    id: 'trefoil',
    name: 'Toroidal Trefoil Knot T(2,3)',
    category: 'Knot Theory',
    code: 'SYS//KNOT-07',
    formula: 'x = sin t + 2 sin 2t, y = cos t - 2 cos 2t',
    info: 'Simplest non-trivial mathematical knot wound 2 times longitudinally and 3 times meridionally.',
    icon: Orbit,
    accent: 'orange'
  },
  {
    id: 'hopf',
    name: 'Hopf Fibration (S³ → S²)',
    category: 'Topology',
    code: 'SYS//TOPO-08',
    formula: 'π(z₀, z₁) = (2z₀z̄₁, |z₀|² - |z₁|²)',
    info: 'Continuous mapping fibrating the 3-sphere into nested families of interlocking circular fibers.',
    icon: Layers,
    accent: 'cyan'
  },

  // Category 3: Complex Analysis & Geometry
  {
    id: 'calabi_yau',
    name: 'Calabi-Yau 6D Cross-Section',
    category: 'Complex Geometry',
    code: 'SYS//STRING-09',
    formula: 'z₁⁵ + z₂⁵ = 1 ⊂ ℂℙ²',
    info: 'Harmonic 2D projection of 6-dimensional compactified Calabi-Yau superstring manifold.',
    icon: Cpu,
    accent: 'pink'
  },
  {
    id: 'riemann_zeta',
    name: 'Riemann Zeta Critical Helix',
    category: 'Analytic Number Theory',
    code: 'SYS//NUMTH-10',
    formula: 'ζ(1/2 + it) = Σ n^(-1/2 - it)',
    info: '3D complex trajectory tracing the critical strip with marked non-trivial zero nodes.',
    icon: Activity,
    accent: 'orange'
  },
  {
    id: 'sunflower_sphere',
    name: 'Fibonacci Phyllotaxis Sphere',
    category: 'Sacred Polyhedra',
    code: 'SYS//SACRED-11',
    formula: 'θ_i = i · 2.39996 rad (Golden Angle)',
    info: '100 spherical nodes distributed by the Golden Angle along intersecting Fermat spirals.',
    icon: Sparkles,
    accent: 'cyan'
  },
  {
    id: 'buckyball',
    name: 'Fullerene C60 Buckyball',
    category: 'Polyhedral Geometry',
    code: 'SYS//POLY-12',
    formula: 'I_h Symmetry: 12 Pentagons + 20 Hexagons',
    info: 'Truncated icosahedron with 60 atomic vertices and 90 geodesic carbon bonds.',
    icon: Box,
    accent: 'emerald'
  },

  // Category 4: Chaos Theory & Quantum Mechanics
  {
    id: 'lorenz',
    name: 'Lorenz Strange Attractor',
    category: 'Chaos Theory',
    code: 'SYS//CHAOS-13',
    formula: 'dx/dt = σ(y - x), dz/dt = xy - βz',
    info: 'Deterministic chaos differential orbits tracing the infinite butterfly fractal manifold.',
    icon: Zap,
    accent: 'orange'
  },
  {
    id: 'quantum_orbital',
    name: 'Hydrogen d-Orbital (ψ₃,₂,₀)',
    category: 'Quantum Mechanics',
    code: 'SYS//QUANT-14',
    formula: 'ψ₃,₂,₀ ∝ r² e^(-r/3) (3cos²θ - 1)',
    info: 'Quadrupole probability density lobes with central nodal torus and quantum wave packets.',
    icon: Activity,
    accent: 'pink'
  }
];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * MathGeometryStudio
 * A professional, GPU-accelerated interactive 3D Mathematical Geometry Studio
 * with 14 parametric models, vertex morphing transitions with zoom breathing,
 * persistent Hero Wallpaper account settings, and retrofuturistic synthwave effects.
 */
const MathGeometryStudio = ({ className = '', heroImage = null }) => {
  const { user, setUser } = useContext(AuthContext) || {};
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Helper to determine active wallpaper strictly for the current account
  const getUserWallpaper = () => {
    if (user?.id) {
      return (
        user.hero_wallpaper && user.hero_wallpaper !== 'image'
          ? user.hero_wallpaper
          : (localStorage.getItem(`mentis_hero_wallpaper_${user.id}`) || 'image')
      );
    }
    return 'image';
  };

  // Persistent hero wallpaper preference: bound to current user's profile
  const [currentWallpaper, setCurrentWallpaper] = useState(getUserWallpaper);

  // Default viewMode and activeMode initialized from user's persistent wallpaper
  const [viewMode, setViewMode] = useState(() => {
    const saved = getUserWallpaper();
    return saved === 'image' ? 'image' : '3d';
  });

  const [activeMode, setActiveMode] = useState(() => {
    const saved = getUserWallpaper();
    return saved !== 'image' && GEOMETRY_MODELS.some((m) => m.id === saved)
      ? saved
      : 'icosahedron';
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [telemetry, setTelemetry] = useState({ rotX: '15°', rotY: '24°', points: 12, fps: 60 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [enableRetroGrid, setEnableRetroGrid] = useState(true);

  // Synchronize strictly with the currently authenticated user's account preference
  useEffect(() => {
    if (user?.id) {
      // User is authenticated: apply THIS account's saved wallpaper
      const userWallpaper =
        user.hero_wallpaper && user.hero_wallpaper !== 'image'
          ? user.hero_wallpaper
          : (localStorage.getItem(`mentis_hero_wallpaper_${user.id}`) || 'image');

      setCurrentWallpaper(userWallpaper);
      if (userWallpaper === 'image') {
        setViewMode('image');
      } else if (GEOMETRY_MODELS.some((m) => m.id === userWallpaper)) {
        setViewMode('3d');
        setActiveMode(userWallpaper);
      }
    } else {
      // Logged out / Guest: reset strictly to default Foundation Showcase Image
      setCurrentWallpaper('image');
      setViewMode('image');
    }
  }, [user?.id, user?.hero_wallpaper]);

  // References for animation state
  const stateRef = useRef({
    rotX: 0.22,
    rotY: 0.42,
    rotZ: 0.1,
    rot4D_XW: 0.0,
    rot4D_YZ: 0.0,
    zoom: 1.0,
    velX: 0.002,
    velY: 0.0035,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    ripples: []
  });

  // Morphing state reference with dynamic zoom breathing
  const morphRef = useRef({
    active: false,
    startTime: 0,
    duration: 540,
    fromPts: [],
    targetPts: []
  });

  // Lorenz chaos state
  const lorenzRef = useRef({
    particles: Array.from({ length: 65 }, () => ({
      x: (Math.random() - 0.5) * 5,
      y: (Math.random() - 0.5) * 5,
      z: 20 + (Math.random() - 0.5) * 5,
      history: []
    }))
  });

  // Quantum orbital particles state
  const quantumRef = useRef({
    particles: Array.from({ length: 80 }, () => ({
      lobe: Math.floor(Math.random() * 5),
      theta: Math.random() * Math.PI * 2,
      r: 0.2 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.03
    }))
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const currentModelMeta = useMemo(() => {
    return GEOMETRY_MODELS.find((m) => m.id === activeMode) || GEOMETRY_MODELS[0];
  }, [activeMode]);

  // Check if current visual is the active wallpaper
  const isCurrentWallpaper =
    (viewMode === 'image' && currentWallpaper === 'image') ||
    (viewMode === '3d' && currentWallpaper === activeMode);

  // Set persistent wallpaper for the current user's profile
  const handleSetWallpaper = async (targetVisual) => {
    const visual = targetVisual || (viewMode === 'image' ? 'image' : activeMode);
    setCurrentWallpaper(visual);

    const visualName =
      visual === 'image'
        ? 'Showcase Image'
        : (GEOMETRY_MODELS.find((m) => m.id === visual)?.name || '3D Model');

    if (user?.id) {
      // 1. Save user-specific local backup immediately
      localStorage.setItem(`mentis_hero_wallpaper_${user.id}`, visual);
      // 2. Reactively update AuthContext so all views immediately reflect it
      if (setUser) {
        setUser((prev) => (prev ? { ...prev, hero_wallpaper: visual } : prev));
      }
      // 3. Persist to MongoDB backend for THIS user account in background
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await axios.put(
            `${API}/users/me/hero-wallpaper`,
            { hero_wallpaper: visual },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (err) {
        console.warn('Backend cloud wallpaper sync notice:', err?.response?.status || err.message);
      }
      toast.success(`"${visualName}" set as your account Hero Wallpaper!`, {
        description: 'This wallpaper is saved to your account and will display whenever you log in.'
      });
    } else {
      toast.info(`"${visualName}" previewed!`, {
        description: 'Log in or sign up to permanently save this hero wallpaper to your account.'
      });
    }
  };

  // Handler to switch model and trigger morphing
  const handleSelectModel = (modelId) => {
    if (modelId === activeMode && viewMode === '3d') {
      setIsDropdownOpen(false);
      return;
    }

    // Trigger morphing transition
    morphRef.current = {
      active: true,
      startTime: performance.now(),
      duration: 540,
      fromPts: morphRef.current.currentSamplePts || [],
      targetPts: []
    };

    setActiveMode(modelId);
    setIsDropdownOpen(false);
    if (viewMode !== '3d') setViewMode('3d');
  };

  // ==========================================
  // 3D GEOMETRY COMPUTATIONS & RENDER ENGINE
  // ==========================================
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
    // PRE-COMPUTED MODEL GEOMETRIES
    // ==========================================

    // 1. Icosahedron & Dual Core
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

    // 2. 4D Hypercube (Tesseract)
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
        let diff = 0;
        for (let k = 0; k < 4; k++) {
          if (tesseract4D[i][k] !== tesseract4D[j][k]) diff++;
        }
        if (diff === 1) tesseractEdges.push([i, j]);
      }
    }

    // 3. Stellated Dodecahedron
    const doddBase = [
      [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1],
      [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1],
      [0, -1 / PHI, -PHI], [0, -1 / PHI, PHI], [0, 1 / PHI, -PHI], [0, 1 / PHI, PHI],
      [-1 / PHI, -PHI, 0], [-1 / PHI, PHI, 0], [1 / PHI, -PHI, 0], [1 / PHI, PHI, 0],
      [-PHI, 0, -1 / PHI], [-PHI, 0, 1 / PHI], [PHI, 0, -1 / PHI], [PHI, 0, 1 / PHI]
    ].map(([x, y, z]) => {
      const len = Math.hypot(x, y, z);
      return [x / len, y / len, z / len];
    });
    const stellSpikes = [
      [0, 1, PHI], [0, 1, -PHI], [0, -1, PHI], [0, -1, -PHI],
      [1, PHI, 0], [1, -PHI, 0], [-1, PHI, 0], [-1, -PHI, 0],
      [PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, 1], [-PHI, 0, -1]
    ].map(([x, y, z]) => {
      const len = Math.hypot(x, y, z);
      return [(x / len) * 1.55, (y / len) * 1.55, (z / len) * 1.55];
    });

    // 4. Clifford Flat Torus
    const cliffordPoints = [];
    const cliffordEdges = [];
    const cStepsU = 16;
    const cStepsV = 16;
    for (let i = 0; i < cStepsU; i++) {
      const u = (i / cStepsU) * Math.PI * 2;
      for (let j = 0; j < cStepsV; j++) {
        const v = (j / cStepsV) * Math.PI * 2;
        cliffordPoints.push([
          Math.cos(u) * 0.7071,
          Math.sin(u) * 0.7071,
          Math.cos(v) * 0.7071,
          Math.sin(v) * 0.7071
        ]);
        const idx = i * cStepsV + j;
        const nextU = ((i + 1) % cStepsU) * cStepsV + j;
        const nextV = i * cStepsV + ((j + 1) % cStepsV);
        cliffordEdges.push([idx, nextU]);
        cliffordEdges.push([idx, nextV]);
      }
    }

    // 5. Möbius Ribbon
    const mobiusPoints = [];
    const mobiusEdges = [];
    const uSegments = 32;
    const vSegments = 4;
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

    // 6. Klein Bottle (Figure-8 Immersion)
    const kleinPoints = [];
    const kleinEdges = [];
    const kStepsU = 28;
    const kStepsV = 14;
    for (let i = 0; i <= kStepsU; i++) {
      const u = (i / kStepsU) * Math.PI * 2;
      for (let j = 0; j <= kStepsV; j++) {
        const v = (j / kStepsV) * Math.PI * 2;
        const r = 1.6 + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v);
        const x = r * Math.cos(u) * 0.55;
        const y = r * Math.sin(u) * 0.55;
        const z = (Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v)) * 0.7;
        kleinPoints.push([x, y, z]);
      }
    }
    for (let i = 0; i < kStepsU; i++) {
      for (let j = 0; j < kStepsV; j++) {
        const idx = i * (kStepsV + 1) + j;
        kleinEdges.push([idx, idx + 1]);
        kleinEdges.push([idx, ((i + 1) * (kStepsV + 1) + j) % kleinPoints.length]);
      }
    }

    // 7. Toroidal Trefoil Knot T(2,3)
    const trefoilPoints = [];
    const trefoilEdges = [];
    const tSteps = 80;
    for (let i = 0; i < tSteps; i++) {
      const t = (i / tSteps) * Math.PI * 2;
      const x = (Math.sin(t) + 2 * Math.sin(2 * t)) * 0.38;
      const y = (Math.cos(t) - 2 * Math.cos(2 * t)) * 0.38;
      const z = -Math.sin(3 * t) * 0.38;
      trefoilPoints.push([x, y, z]);
      trefoilEdges.push([i, (i + 1) % tSteps]);
    }

    // 8. Hopf Fibration
    const hopfPoints = [];
    const hopfEdges = [];
    const numRings = 14;
    const ringSegments = 32;
    for (let rIdx = 0; rIdx < numRings; rIdx++) {
      const alpha = (rIdx / numRings) * Math.PI;
      const beta = ((rIdx % 2) * Math.PI) / 4;
      const startIdx = hopfPoints.length;
      for (let s = 0; s < ringSegments; s++) {
        const theta = (s / ringSegments) * Math.PI * 2;
        const rx = Math.cos(theta) * 0.95;
        const ry = Math.sin(theta) * 0.95;
        const x = rx * Math.cos(alpha) - ry * Math.sin(alpha) * Math.cos(beta);
        const y = ry * Math.sin(beta) * 1.1;
        const z = rx * Math.sin(alpha) + ry * Math.cos(alpha) * Math.cos(beta);
        hopfPoints.push([x, y, z]);
        if (s > 0) hopfEdges.push([startIdx + s - 1, startIdx + s]);
      }
      hopfEdges.push([startIdx + ringSegments - 1, startIdx]);
    }

    // 9. Calabi-Yau 6D Cross-Section
    const cyPoints = [];
    const cyEdges = [];
    const cyU = 20;
    const cyV = 24;
    for (let i = 0; i <= cyU; i++) {
      const u = (i / cyU) * Math.PI;
      for (let j = 0; j <= cyV; j++) {
        const v = (j / cyV) * Math.PI * 2;
        const r = 1.0 + 0.28 * Math.cos(5 * v) + 0.18 * Math.sin(5 * u);
        const x = r * Math.sin(u) * Math.cos(v) * 0.85;
        const y = r * Math.sin(u) * Math.sin(v) * 0.85;
        const z = (r * Math.cos(u) + 0.24 * Math.cos(5 * v) * Math.sin(3 * u)) * 0.85;
        cyPoints.push([x, y, z]);
      }
    }
    for (let i = 0; i < cyU; i++) {
      for (let j = 0; j < cyV; j++) {
        const idx = i * (cyV + 1) + j;
        cyEdges.push([idx, idx + 1]);
        cyEdges.push([idx, ((i + 1) * (cyV + 1) + j) % cyPoints.length]);
      }
    }

    // 10. Riemann Zeta Critical Helix
    const zetaPoints = [];
    const zetaEdges = [];
    const zSteps = 100;
    for (let i = 0; i < zSteps; i++) {
      const t = 10 + (i / zSteps) * 28;
      const x = (t - 24) * 0.08;
      let re = 0;
      let im = 0;
      for (let n = 1; n <= 8; n++) {
        const phase = t * Math.log(n);
        const invSqrtN = 1 / Math.sqrt(n);
        re += invSqrtN * Math.cos(phase);
        im -= invSqrtN * Math.sin(phase);
      }
      zetaPoints.push([x, re * 0.22, im * 0.22]);
      if (i > 0) zetaEdges.push([i - 1, i]);
    }

    // 11. Fibonacci Sunflower Phyllotaxis Sphere
    const sunPoints = [];
    const sunEdges = [];
    const sunN = 90;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < sunN; i++) {
      const y = 1 - (i / (sunN - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      sunPoints.push([x * 1.05, y * 1.05, z * 1.05]);
      if (i >= 8) sunEdges.push([i - 8, i]);
      if (i >= 13) sunEdges.push([i - 13, i]);
    }

    // 12. Fullerene C60 Buckyball
    const buckyRaw = [];
    const bphi = PHI;
    const p1 = [0, 1, 3 * bphi];
    const p2 = [2, 1 + 2 * bphi, bphi];
    const p3 = [1, 2 + bphi, 2 * bphi];
    const genPerm = ([a, b, c]) => {
      const signs = [-1, 1];
      for (const sa of signs) {
        for (const sb of signs) {
          for (const sc of signs) {
            buckyRaw.push([a * sa, b * sb, c * sc]);
            buckyRaw.push([b * sa, c * sb, a * sc]);
            buckyRaw.push([c * sa, a * sb, b * sc]);
          }
        }
      }
    };
    genPerm(p1);
    genPerm(p2);
    genPerm(p3);
    const buckyMap = new Map();
    buckyRaw.forEach(([x, y, z]) => {
      const len = Math.hypot(x, y, z);
      const key = `${Math.round((x / len) * 100)},${Math.round((y / len) * 100)},${Math.round((z / len) * 100)}`;
      if (!buckyMap.has(key)) {
        buckyMap.set(key, [x / len, y / len, z / len]);
      }
    });
    const buckyPoints = Array.from(buckyMap.values()).slice(0, 60);
    const buckyEdges = [];
    for (let i = 0; i < buckyPoints.length; i++) {
      for (let j = i + 1; j < buckyPoints.length; j++) {
        const [x1, y1, z1] = buckyPoints[i];
        const [x2, y2, z2] = buckyPoints[j];
        if (Math.hypot(x1 - x2, y1 - y2, z1 - z2) < 0.48) {
          buckyEdges.push([i, j]);
        }
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    // ==========================================
    // RENDER LOOP & PROJECTION
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

        // Apply inertial decay
        if (!state.isDragging) {
          state.rotX += state.velX;
          state.rotY += state.velY;
          state.rot4D_XW += 0.012;
          state.rot4D_YZ += 0.016;
          state.velX *= 0.96;
          state.velY *= 0.96;
          if (Math.abs(state.velX) < 0.001) state.velX = 0.002;
          if (Math.abs(state.velY) < 0.002) state.velY = 0.0035;
        }

        const cx = width / 2;
        const cy = height / 2;
        const fov = 650;

        // Dynamic morphing camera breathing zoom wave
        const morph = morphRef.current;
        let isCurrentlyMorphing = false;
        let morphFactor = 1.0;

        if (morph.active) {
          const elapsed = now - morph.startTime;
          morphFactor = Math.min(elapsed / morph.duration, 1.0);
          isCurrentlyMorphing = morphFactor < 1.0;
          if (morphFactor >= 1.0) morph.active = false;
        }

        const morphEase =
          morphFactor < 0.5
            ? 4 * morphFactor * morphFactor * morphFactor
            : 1 - Math.pow(-2 * morphFactor + 2, 3) / 2;

        const zoomBreathingWave = isCurrentlyMorphing
          ? Math.sin(morphEase * Math.PI) * 0.12
          : 0;

        const scaleBase =
          Math.min(width, height) * 0.28 * state.zoom * (1 + zoomBreathingWave);

        // 3D Rotation Matrix helper
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

        // Draw Retrofuturistic Synthwave Ground Grid
        if (enableRetroGrid) {
          const horizonY = height * 0.78;
          const gridSpeed = (now * 0.04) % 32;

          const numRays = 16;
          for (let i = -numRays; i <= numRays; i++) {
            const bottomX = cx + i * (width / (numRays * 1.5));
            ctx.beginPath();
            ctx.moveTo(cx, horizonY);
            ctx.lineTo(bottomX, height);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.1 + (1 - Math.abs(i) / numRays) * 0.22})`;
            ctx.stroke();
          }

          for (let z = 1; z <= 7; z++) {
            const rawZ = (z * 28 + gridSpeed) % 210;
            const depth = rawZ / 210;
            const y = horizonY + Math.pow(depth, 1.8) * (height - horizonY);
            const alpha = depth * 0.35;
            ctx.strokeStyle = `rgba(236, 72, 153, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }
        }

        // Active model geometry routing
        let currentTargetPoints = [];
        let currentEdges = [];
        let modelTheme = 'orange';

        if (activeMode === 'icosahedron') {
          currentTargetPoints = icoVertices;
          currentEdges = icoEdges;
          modelTheme = 'orange';
        } else if (activeMode === 'tesseract') {
          const cosXW = Math.cos(state.rot4D_XW), sinXW = Math.sin(state.rot4D_XW);
          const cosYZ = Math.cos(state.rot4D_YZ), sinYZ = Math.sin(state.rot4D_YZ);
          currentTargetPoints = tesseract4D.map(([x, y, z, w]) => {
            const rx = x * cosXW - w * sinXW;
            const rw = x * sinXW + w * cosXW;
            const ry = y * cosYZ - z * sinYZ;
            const rz = y * sinYZ + z * cosYZ;
            const dist4D = 2.4;
            const wProj = 1 / (dist4D - rw);
            return [rx * wProj * 1.5, ry * wProj * 1.5, rz * wProj * 1.5];
          });
          currentEdges = tesseractEdges;
          modelTheme = 'pink';
        } else if (activeMode === 'dodecahedron') {
          currentTargetPoints = [...doddBase, ...stellSpikes];
          currentEdges = [];
          for (let i = 0; i < doddBase.length; i++) {
            for (let j = 0; j < stellSpikes.length; j++) {
              if (
                Math.hypot(
                  doddBase[i][0] - stellSpikes[j][0],
                  doddBase[i][1] - stellSpikes[j][1],
                  doddBase[i][2] - stellSpikes[j][2]
                ) < 1.3
              ) {
                currentEdges.push([i, doddBase.length + j]);
              }
            }
          }
          modelTheme = 'cyan';
        } else if (activeMode === 'clifford_torus') {
          const cosXW = Math.cos(state.rot4D_XW), sinXW = Math.sin(state.rot4D_XW);
          currentTargetPoints = cliffordPoints.map(([x, y, z, w]) => {
            const rx = x * cosXW - w * sinXW;
            const rw = x * sinXW + w * cosXW;
            const dist4D = 2.2;
            const wProj = 1 / (dist4D - rw);
            return [rx * wProj * 1.8, y * wProj * 1.8, z * wProj * 1.8];
          });
          currentEdges = cliffordEdges;
          modelTheme = 'emerald';
        } else if (activeMode === 'mobius') {
          currentTargetPoints = mobiusPoints;
          currentEdges = mobiusEdges;
          modelTheme = 'cyan';
        } else if (activeMode === 'klein') {
          currentTargetPoints = kleinPoints;
          currentEdges = kleinEdges;
          modelTheme = 'pink';
        } else if (activeMode === 'trefoil') {
          currentTargetPoints = trefoilPoints;
          currentEdges = trefoilEdges;
          modelTheme = 'orange';
        } else if (activeMode === 'hopf') {
          currentTargetPoints = hopfPoints;
          currentEdges = hopfEdges;
          modelTheme = 'cyan';
        } else if (activeMode === 'calabi_yau') {
          currentTargetPoints = cyPoints;
          currentEdges = cyEdges;
          modelTheme = 'pink';
        } else if (activeMode === 'riemann_zeta') {
          currentTargetPoints = zetaPoints;
          currentEdges = zetaEdges;
          modelTheme = 'orange';
        } else if (activeMode === 'sunflower_sphere') {
          currentTargetPoints = sunPoints;
          currentEdges = sunEdges;
          modelTheme = 'cyan';
        } else if (activeMode === 'buckyball') {
          currentTargetPoints = buckyPoints;
          currentEdges = buckyEdges;
          modelTheme = 'emerald';
        }

        morphRef.current.currentSamplePts = currentTargetPoints.slice(0, 60);

        // ==========================================
        // RENDER STANDARD WIREFRAME OR MORPHING
        // ==========================================
        if (activeMode !== 'lorenz' && activeMode !== 'quantum_orbital') {
          const projectedPts = currentTargetPoints.map(([tx, ty, tz], idx) => {
            let finalX = tx;
            let finalY = ty;
            let finalZ = tz;

            if (isCurrentlyMorphing && morph.fromPts && morph.fromPts.length > 0) {
              const srcPt = morph.fromPts[idx % morph.fromPts.length];
              finalX = srcPt[0] + (tx - srcPt[0]) * morphEase;
              finalY = srcPt[1] + (ty - srcPt[1]) * morphEase;
              finalZ = srcPt[2] + (tz - srcPt[2]) * morphEase;
            }

            return project3D(finalX, finalY, finalZ);
          });

          // Draw Edges
          ctx.lineWidth = activeMode === 'buckyball' || activeMode === 'tesseract' ? 1.6 : 1.2;

          currentEdges.forEach(([i, j]) => {
            const p1 = projectedPts[i];
            const p2 = projectedPts[j];
            if (!p1 || !p2) return;

            const avgZ = (p1.z + p2.z) / 2;
            const alpha = Math.min(Math.max((avgZ + 1.2) / 2.4, 0.15), 0.95);

            let strokeStyle;
            if (modelTheme === 'orange') {
              strokeStyle = `rgba(249, 115, 22, ${alpha})`;
            } else if (modelTheme === 'pink') {
              strokeStyle = `rgba(236, 72, 153, ${alpha})`;
            } else if (modelTheme === 'cyan') {
              strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            } else {
              strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            }

            ctx.strokeStyle = strokeStyle;
            if (activeMode === 'icosahedron' || activeMode === 'tesseract') {
              ctx.shadowColor = modelTheme === 'orange' ? '#f97316' : '#ec4899';
              ctx.shadowBlur = 6 * alpha;
            }
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.shadowBlur = 0;
          });

          // Draw Vertex Nodes
          projectedPts.forEach((p, idx) => {
            const isHighlight = idx % 5 === 0;
            const rad = Math.max((isHighlight ? 3.2 : 2.0) * p.scale, 1.4);

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = modelTheme === 'cyan' ? '#38bdf8' : '#f97316';
            ctx.shadowBlur = isHighlight ? 8 : 4;
            ctx.beginPath();
            ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          });

          // Trefoil knot orbiting quantum beads
          if (activeMode === 'trefoil') {
            for (let b = 0; b < 6; b++) {
              const beadIndex = Math.floor((now * 0.04 + b * (tSteps / 6)) % tSteps);
              const bp = projectedPts[beadIndex];
              if (bp) {
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#f97316';
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.arc(bp.x, bp.y, 4.5 * bp.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
              }
            }
          }

          // Riemann Zeta critical zeros highlights
          if (activeMode === 'riemann_zeta') {
            [15, 39, 54, 73].forEach((zeroIdx) => {
              const zp = projectedPts[zeroIdx];
              if (zp) {
                const pulse = 1 + Math.sin(now * 0.008 + zeroIdx) * 0.3;
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 1.5;
                ctx.shadowColor = '#f59e0b';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(zp.x, zp.y, 6 * zp.scale * pulse, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
              }
            });
          }
        }

        // Lorenz Attractor
        else if (activeMode === 'lorenz') {
          const lorenz = lorenzRef.current;
          const dt = 0.012;
          const sigma = 10;
          const rho = 28;
          const beta = 8 / 3;

          ctx.lineWidth = 1.4;

          lorenz.particles.forEach((p, idx) => {
            const dx = sigma * (p.y - p.x);
            const dy = p.x * (rho - p.z) - p.y;
            const dz = p.x * p.y - beta * p.z;

            p.x += dx * dt;
            p.y += dy * dt;
            p.z += dz * dt;

            const nx = p.x * 0.045;
            const ny = p.y * 0.045;
            const nz = (p.z - 25) * 0.045;

            const proj = project3D(nx, ny, nz);
            p.history.push({ x: proj.x, y: proj.y, z: proj.z });
            if (p.history.length > 22) p.history.shift();

            if (p.history.length > 2) {
              ctx.beginPath();
              ctx.moveTo(p.history[0].x, p.history[0].y);
              for (let k = 1; k < p.history.length; k++) {
                ctx.lineTo(p.history[k].x, p.history[k].y);
              }

              ctx.strokeStyle =
                idx % 2 === 0 ? 'rgba(249, 115, 22, 0.8)' : 'rgba(236, 72, 153, 0.8)';
              ctx.shadowColor = 'rgba(236, 72, 153, 0.6)';
              ctx.shadowBlur = 6;
              ctx.stroke();
              ctx.shadowBlur = 0;
            }

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        // Quantum Hydrogen d-Orbital
        else if (activeMode === 'quantum_orbital') {
          const quantum = quantumRef.current;

          for (let lobe = 0; lobe < 4; lobe++) {
            const angle = (lobe * Math.PI) / 2;
            const lobeDirX = Math.cos(angle);
            const lobeDirY = Math.sin(angle);
            const lobePts = [];

            for (let s = 0; s <= 16; s++) {
              const u = (s / 16) * Math.PI * 2;
              const r = 0.85 * Math.sin((s / 16) * Math.PI);
              const lx = (lobeDirX * 0.65 + Math.cos(u) * 0.28) * r;
              const ly = (lobeDirY * 0.65 + Math.sin(u) * 0.28) * r;
              const lz = Math.cos((s / 16) * Math.PI) * 0.5;
              lobePts.push(project3D(lx, ly, lz));
            }

            ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(lobePts[0].x, lobePts[0].y);
            for (let k = 1; k < lobePts.length; k++) {
              ctx.lineTo(lobePts[k].x, lobePts[k].y);
            }
            ctx.stroke();
          }

          ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let s = 0; s <= 24; s++) {
            const u = (s / 24) * Math.PI * 2;
            const p = project3D(Math.cos(u) * 0.45, Math.sin(u) * 0.45, 0);
            if (s === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();

          quantum.particles.forEach((qp) => {
            qp.phase += qp.speed;
            let px = 0, py = 0, pz = 0;

            if (qp.lobe < 4) {
              const baseAngle = (qp.lobe * Math.PI) / 2;
              const dist = qp.r * Math.abs(Math.sin(qp.phase));
              px = Math.cos(baseAngle) * dist + Math.sin(qp.phase * 3) * 0.12;
              py = Math.sin(baseAngle) * dist + Math.cos(qp.phase * 3) * 0.12;
              pz = Math.cos(qp.phase * 2) * 0.35 * qp.r;
            } else {
              const r = 0.45 + Math.sin(qp.phase) * 0.08;
              px = Math.cos(qp.phase) * r;
              py = Math.sin(qp.phase) * r;
              pz = Math.sin(qp.phase * 4) * 0.1;
            }

            const pproj = project3D(px, py, pz);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = qp.lobe < 4 ? '#ec4899' : '#38bdf8';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(pproj.x, pproj.y, 2.2 * pproj.scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          });
        }

        // Click ripples
        state.ripples.forEach((rip, rIdx) => {
          rip.radius += 5;
          rip.alpha *= 0.94;

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
  }, [activeMode, viewMode, enableRetroGrid]);

  // Orbit controls
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
      radius: 6,
      alpha: 0.85
    });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0015;
    stateRef.current.zoom = Math.min(Math.max(stateRef.current.zoom + zoomDelta, 0.65), 1.95);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-950/95 border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl ${className}`}
    >
      {/* Retrofuturistic Corner Reticles */}
      <div className="absolute top-2 left-2 z-30 pointer-events-none text-slate-600 font-mono text-[9px] select-none flex items-center gap-1">
        <span className="text-orange-500 font-bold">[+]</span>
        <span className="hidden sm:inline">SYS//MATRIX.01</span>
      </div>
      <div className="absolute top-2 right-2 z-30 pointer-events-none text-slate-600 font-mono text-[9px] select-none flex items-center gap-1">
        <span className="hidden sm:inline">{currentModelMeta.code}</span>
        <span className="text-cyan-400 font-bold">[+]</span>
      </div>

      {/* Top Header & Model Dropdown Bar */}
      <div className="flex items-center justify-between px-2.5 sm:px-4 py-2 sm:py-2.5 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md z-30 relative gap-2 min-w-0">
        {/* Left: View Mode Indicator & Quick Model Dropdown Trigger */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1" ref={dropdownRef}>
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>

          {/* Model Selector Dropdown Button */}
          <div className="relative min-w-0 max-w-[150px] sm:max-w-[185px]">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-700/80 text-xs font-mono font-medium text-slate-200 hover:text-white transition-all shadow-sm group active:scale-95"
              data-testid="geometry-model-dropdown-btn"
              title={viewMode === 'image' ? 'Showcase Image' : currentModelMeta.name}
            >
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <currentModelMeta.icon className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="truncate">
                  {viewMode === 'image' ? 'Showcase Image' : currentModelMeta.name}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-orange-400' : ''
                }`}
              />
            </button>

            {/* Custom Retrofuturistic Dropdown Menu with Spring Zoom */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.94 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 top-full mt-2 w-72 sm:w-80 max-h-[400px] overflow-y-auto rounded-xl bg-slate-950/95 border border-slate-700/90 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl z-50 p-2 scrollbar-thin scrollbar-thumb-slate-700 select-none origin-top-left"
                  style={{ backdropFilter: 'blur(24px)' }}
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800/80 flex items-center justify-between mb-1.5">
                    <span>Select Mathematical Model</span>
                    <span className="text-orange-400 font-bold">14 Active Labs</span>
                  </div>

                  {/* Option for Default Showcase Image */}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('image');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between gap-2 mb-1 group ${
                      viewMode === 'image'
                        ? 'bg-gradient-to-r from-orange-500/25 to-pink-500/20 text-white border border-orange-500/40 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Eye className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate">Foundation Showcase Image</div>
                        <div className="text-[10px] text-slate-400">Default Mentis Hero Visual</div>
                      </div>
                    </div>
                    {currentWallpaper === 'image' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5" /> Wallpaper
                      </span>
                    )}
                  </button>

                  <div className="space-y-1">
                    {GEOMETRY_MODELS.map((model) => {
                      const isSelected = viewMode === '3d' && model.id === activeMode;
                      const isModelWallpaper = currentWallpaper === model.id;
                      const Icon = model.icon;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => handleSelectModel(model.id)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono transition-all flex items-start justify-between gap-2 group ${
                            isSelected
                              ? 'bg-gradient-to-r from-orange-500/25 to-pink-500/20 text-white border border-orange-500/40 shadow-sm'
                              : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <Icon
                              className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                                isSelected
                                  ? 'text-orange-400'
                                  : 'text-slate-500 group-hover:text-cyan-400'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                                <span>{model.name}</span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                                {model.formula}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                            {isModelWallpaper && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5" /> Wallpaper
                              </span>
                            )}
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-orange-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center & Right: Wallpaper Preference Button & View Mode Toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Hero Wallpaper Set / Active Indicator */}
          {isCurrentWallpaper ? (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-semibold shadow-sm flex-shrink-0"
              title="Currently set as your persistent account hero wallpaper"
            >
              <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="hidden sm:inline">Active Wallpaper</span>
              <span className="sm:hidden">Active</span>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSetWallpaper()}
              className="text-xs h-7 px-2 sm:px-2.5 rounded-lg border border-orange-500/30 hover:border-orange-500/60 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 hover:text-white transition-all shadow-sm flex items-center gap-1 active:scale-95 flex-shrink-0"
              title="Save this visual as your default account hero wallpaper"
            >
              <Bookmark className="w-3 h-3 text-orange-400 flex-shrink-0" />
              <span className="hidden sm:inline">Set as Wallpaper</span>
              <span className="sm:hidden">Wallpaper</span>
            </Button>
          )}

          {/* Switcher between Showcase Image & 3D Lab */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewMode(viewMode === '3d' ? 'image' : '3d')}
            className={`text-xs h-7 px-2 sm:px-2.5 rounded-lg border transition-all active:scale-95 flex-shrink-0 flex items-center gap-1 ${
              viewMode === '3d'
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                : 'border-orange-500/40 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20'
            }`}
            data-testid="toggle-studio-view-btn"
            title={viewMode === '3d' ? 'Switch to Showcase Image' : 'Switch to 3D Lab'}
          >
            {viewMode === '3d' ? (
              <>
                <Eye className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="hidden md:inline">Image</span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                <span className="hidden md:inline">3D Lab</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Studio Viewport with Morphing Zoom Transition */}
      <div className="relative h-[380px] sm:h-[420px] lg:h-[460px] w-full overflow-hidden select-none">
        {/* Retrofuturistic CRT Scanline Overlay Effect */}
        <div
          className="absolute inset-0 pointer-events-none z-20 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)',
            backgroundSize: '100% 4px'
          }}
        />

        <AnimatePresence mode="wait">
          {viewMode === '3d' ? (
            <motion.div
              key="3d-studio"
              initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full"
            >
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

              {/* Orbit / Zoom Hint */}
              <div className="absolute top-3 left-4 pointer-events-none z-20 flex flex-col gap-1">
                <div className="text-[10px] sm:text-[11px] font-mono text-orange-400 font-semibold tracking-wide flex items-center gap-1.5 bg-slate-950/75 px-2.5 py-1 rounded-md border border-slate-800/90 backdrop-blur-md shadow-md">
                  <RotateCw
                    className="w-3 h-3 animate-spin text-orange-400"
                    style={{ animationDuration: '6s' }}
                  />
                  <span>Drag to Orbit in 3D • Scroll to Zoom</span>
                </div>
              </div>

              {/* Live Telemetry HUD */}
              <div className="absolute top-3 right-4 pointer-events-none z-20 hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/75 px-2.5 py-1 rounded-md border border-slate-800/90 backdrop-blur-md shadow-md">
                <span className="text-emerald-400 font-bold">{telemetry.fps} FPS</span>
                <span>•</span>
                <span>θ: {telemetry.rotX}</span>
                <span>•</span>
                <span>φ: {telemetry.rotY}</span>
              </div>

              {/* Sleek Minimal Formula Telemetry at Bottom */}
              <div className="absolute bottom-3 inset-x-0 pointer-events-none z-20 flex justify-center px-4">
                <div className="px-3 py-1 rounded-full bg-slate-950/75 backdrop-blur-md border border-slate-800/80 text-center shadow-lg flex items-center gap-2 max-w-md">
                  <currentModelMeta.icon className="w-3 h-3 text-orange-400 flex-shrink-0" />
                  <span className="text-[11px] font-mono text-orange-400 font-semibold truncate">
                    {currentModelMeta.formula}
                  </span>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                    {currentModelMeta.info}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Default View: Hero Showcase Image with Clean Unobstructed Canvas */
            <motion.div
              key="image-showcase"
              initial={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full group"
            >
              <img
                src={
                  heroImage ||
                  'https://images.unsplash.com/photo-1741298167028-1e781b6b3bbe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG1hdGhlbWF0aWNzJTIwZ2VvbWV0cnklMjBhcnR8ZW58MHx8fHwxNzY5OTM2NzAyfDA&ixlib=rb-4.1.0&q=85'
                }
                alt="Mentis Mathematics Foundation Hero Showcase"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Cinematic Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40 pointer-events-none" />

              {/* Top Interactive Badge */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-white text-xs font-medium shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Interactive Math Universe</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MathGeometryStudio;
