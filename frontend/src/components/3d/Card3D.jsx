import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Card3D
 * An ultra-luxurious, tactile 3D Tilt Card component with morphing zoom physics.
 * Features:
 * - Real-time cursor perspective tilt (rotateX, rotateY)
 * - Dynamic morphing zoom-in on hover (scale: 1.035) & tactile zoom-out on click (scale: 0.96)
 * - Dynamic specular light sheen / glare reflection that follows cursor position
 * - Multi-layer 3D depth translation (translateZ on child contents)
 * - Subtle animated glowing border & glassmorphism
 */
const Card3D = ({
  children,
  className = '',
  glare = true,
  tiltMax = 12, // Max tilt angle in degrees
  depth = 32,   // Pop-out Z depth in pixels for inner elements
  borderColor = 'from-orange-500/40 via-pink-500/40 to-cyan-500/40',
  glowOnHover = true,
  onClick,
  ...props
}) => {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position values normalized (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics for buttery-smooth damping and no jitter
  const mouseX = useSpring(x, { stiffness: 240, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 240, damping: 20 });

  // Map mouse coordinates to 3D rotation angles
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [tiltMax, -tiltMax]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-tiltMax, tiltMax]);

  // Glare position percentage (0% to 100%)
  const glareX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;

    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      style={{ perspective: 1200 }}
      className={`relative inline-block w-full ${className}`}
      {...props}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        whileHover={{ scale: 1.032, y: -4 }}
        whileTap={{ scale: 0.965 }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        transition={{
          scale: { type: 'spring', stiffness: 350, damping: 22 },
          y: { type: 'spring', stiffness: 350, damping: 22 }
        }}
        className={`relative w-full rounded-2xl transition-shadow duration-500 overflow-hidden cursor-pointer ${
          glowOnHover && isHovered
            ? 'shadow-[0_24px_60px_rgba(249,115,22,0.22),0_12px_24px_rgba(236,72,153,0.15)]'
            : 'shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
        }`}
      >
        {/* Animated Gradient Border Beam */}
        <div
          className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${borderColor} transition-opacity duration-300 pointer-events-none ${
            isHovered ? 'opacity-100 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'opacity-40'
          }`}
          style={{ transform: 'translateZ(0px)' }}
        />

        {/* Card Body Container with Physical Glass Refraction */}
        <div
          className="relative rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-white/10 p-1 h-full flex flex-col"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Subtle Glass Top-Edge Highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          {/* Children with 3D Depth Layer */}
          <div
            className="relative z-10 w-full h-full"
            style={{
              transform: isHovered ? `translateZ(${depth}px)` : 'translateZ(0px)',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.28s cubic-bezier(0.2, 0, 0, 1)'
            }}
          >
            {children}
          </div>

          {/* Specular Light Reflection / Glare Layer */}
          {glare && (
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-2xl z-20 transition-opacity duration-300"
              style={{
                opacity: isHovered ? 0.45 : 0,
                background: `radial-gradient(circle 300px at ${glareX} ${glareY}, rgba(255, 255, 255, 0.28), rgba(249, 115, 22, 0.12) 40%, transparent 80%)`,
                mixBlendMode: 'screen',
                transform: 'translateZ(2px)'
              }}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Card3D;
