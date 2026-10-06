import React from 'react';
import { motion } from 'framer-motion';

/**
 * FloatingMathBadges
 * Holographic 3D floating badges featuring iconic mathematical equations & constants.
 * Delivers an authentic mathematical wonder and research-grade intellectual aesthetic.
 */
const FloatingMathBadges = ({ className = '' }) => {
  const badges = [
    {
      formula: 'e^{iπ} + 1 = 0',
      label: "Euler's Identity",
      gradient: 'from-orange-500/20 to-pink-500/20',
      border: 'border-orange-500/40',
      textGlow: 'text-orange-300',
      pos: 'top-[8%] -left-6 sm:-left-12',
      delay: 0,
      duration: 5.5,
      yRange: [-8, 8],
      xRange: [-4, 4]
    },
    {
      formula: '∫_{-∞}^{∞} e^{-x²} dx = √π',
      label: 'Gaussian Integral',
      gradient: 'from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-500/40',
      textGlow: 'text-cyan-300',
      pos: 'top-[45%] -right-4 sm:-right-10',
      delay: 1.2,
      duration: 6.2,
      yRange: [8, -8],
      xRange: [4, -4]
    },
    {
      formula: 'Φ = (1 + √5) / 2',
      label: 'Golden Ratio',
      gradient: 'from-pink-500/20 to-purple-500/20',
      border: 'border-pink-500/40',
      textGlow: 'text-pink-300',
      pos: 'bottom-[12%] -left-4 sm:-left-8',
      delay: 2.1,
      duration: 5.8,
      yRange: [-10, 6],
      xRange: [-3, 5]
    },
    {
      formula: '∑ 1/n² = π² / 6',
      label: 'Basel Problem',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/40',
      textGlow: 'text-emerald-300',
      pos: '-bottom-6 right-[15%]',
      delay: 1.8,
      duration: 6.8,
      yRange: [6, -10],
      xRange: [-5, 3]
    }
  ];

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-visible z-20 ${className}`}>
      {badges.map((b, index) => (
        <motion.div
          key={index}
          className={`absolute ${b.pos} hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl backdrop-blur-md bg-slate-900/80 border ${b.border} shadow-lg shadow-black/40`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: b.yRange,
            x: b.xRange,
            rotateZ: [-1, 1.5, -1]
          }}
          transition={{
            opacity: { duration: 0.8, delay: b.delay * 0.3 },
            scale: { duration: 0.8, delay: b.delay * 0.3 },
            y: {
              repeat: Infinity,
              repeatType: 'mirror',
              duration: b.duration,
              ease: 'easeInOut'
            },
            x: {
              repeat: Infinity,
              repeatType: 'mirror',
              duration: b.duration * 1.3,
              ease: 'easeInOut'
            },
            rotateZ: {
              repeat: Infinity,
              repeatType: 'mirror',
              duration: b.duration * 1.1,
              ease: 'easeInOut'
            }
          }}
        >
          {/* Glowing pulse indicator dot */}
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${b.border.replace('border-', 'bg-')}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${b.border.replace('border-', 'bg-')}`} />
          </span>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold leading-none">
              {b.label}
            </span>
            <span className={`font-mono text-xs sm:text-sm font-bold ${b.textGlow} tracking-wide mt-0.5`}>
              {b.formula}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingMathBadges;
