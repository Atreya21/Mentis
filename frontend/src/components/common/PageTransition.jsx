import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * PageTransition
 * Wraps page routes with a cinematic morphing zoom-in / zoom-out transition.
 * Uses GPU-accelerated 3D transforms (scale zoom, elevation shift, spatial blur filter)
 * with organic cubic-bezier spring curves.
 */
const pageVariants = {
  initial: {
    opacity: 0,
    y: 18,
    scale: 0.94,
    filter: 'blur(8px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.42,
      ease: [0.16, 1, 0.3, 1], // Spring-like morphing deceleration
    },
  },
  exit: {
    opacity: 0,
    y: -14,
    scale: 1.04, // Dramatic morphing zoom-out through the lens
    filter: 'blur(6px)',
    transition: {
      duration: 0.26,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

const PageTransition = ({ children }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full flex-grow flex flex-col will-change-[transform,opacity,filter]"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
