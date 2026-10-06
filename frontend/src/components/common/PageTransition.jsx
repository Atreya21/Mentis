import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * PageTransition
 * Wraps page routes with a modern, cinematic entry and exit transition.
 * Uses hardware-accelerated transforms (opacity, subtle scale, Y-axis translation, blur filter)
 * with a tailored cubic-bezier spring curve.
 */
const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.992,
    filter: 'blur(3px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    filter: 'blur(2px)',
    transition: {
      duration: 0.22,
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
      className="w-full flex-grow flex flex-col"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
