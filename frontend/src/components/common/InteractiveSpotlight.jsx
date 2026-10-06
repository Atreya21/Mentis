import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * InteractiveSpotlight
 * A continuous, GPU-accelerated ambient cursor spotlight that glides seamlessly across
 * the viewport, casting a warm mathematical glow onto glass cards and dark surfaces.
 */
const InteractiveSpotlight = () => {
  const [enabled, setEnabled] = useState(false);

  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  // Smooth inertial spring damping for cinematic feel
  const springX = useSpring(mouseX, { stiffness: 180, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 180, damping: 25 });

  useEffect(() => {
    // Only enable on desktop pointer devices
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    setEnabled(true);

    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  if (!enabled) return null;

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-700 overflow-hidden"
      style={{
        background: `radial-gradient(circle 520px at ${springX}px ${springY}px, rgba(249, 115, 22, 0.05), rgba(236, 72, 153, 0.03) 45%, transparent 80%)`,
      }}
    />
  );
};

export default InteractiveSpotlight;
