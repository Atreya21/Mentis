import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Checks if the user is running inside the native Capacitor app or an installed PWA.
 */
export const isRunningInApp = () => {
  if (typeof window === 'undefined') return false;

  // 1. Capacitor native shell (Android / iOS)
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch (e) {}

  if (document.body && document.body.classList.contains('capacitor')) {
    return true;
  }

  // 2. Standalone PWA mode (Desktop / iOS / Android)
  const isStandalone = 
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');

  return !!isStandalone;
};

/**
 * Hook to reactively know if running in app mode
 */
export const useIsApp = () => {
  const [isApp, setIsApp] = useState(isRunningInApp);

  useEffect(() => {
    setIsApp(isRunningInApp());

    if (window.matchMedia) {
      const mql = window.matchMedia('(display-mode: standalone)');
      const handleChange = (e) => setIsApp(e.matches || isRunningInApp());
      try {
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
      } catch (e) {
        mql.addListener(handleChange);
        return () => mql.removeListener(handleChange);
      }
    }
  }, []);

  return isApp;
};
