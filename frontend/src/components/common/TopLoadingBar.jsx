import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * TopLoadingBar
 * A lightning-fast, sleek laser beam progress indicator that activates
 * across the top of the viewport during page navigations.
 */
const TopLoadingBar = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Start progress beam immediately on location change
    setActive(true);
    setProgress(35);

    const timer1 = setTimeout(() => {
      setProgress(75);
    }, 120);

    const timer2 = setTimeout(() => {
      setProgress(100);
    }, 280);

    const timer3 = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 550);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [location.pathname]);

  if (!active && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-orange-500 via-pink-500 to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(249,115,22,0.8),0_0_24px_rgba(236,72,153,0.6)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: 'width, opacity',
          transitionDuration: progress === 100 ? '250ms, 250ms' : '180ms, 0ms'
        }}
      />
    </div>
  );
};

export default TopLoadingBar;
