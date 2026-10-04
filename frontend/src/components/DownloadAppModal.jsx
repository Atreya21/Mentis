import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Smartphone, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink,
  Share,
  PlusSquare,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const DIRECT_APK_URL = `${BACKEND_URL}/api/download/app`;
const GITHUB_RELEASE_URL = 'https://github.com/Atreya21/Mentis/releases/download/v1.0.0/Mentis.apk';

const DownloadAppModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('android');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);
    if (isAppleDevice) {
      setActiveTab('pwa');
    }

    // Capture PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden z-10 my-8"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-pink-500 p-0.5 shadow-lg shadow-orange-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Smartphone className="w-7 h-7 text-orange-400" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-white">
                  Mentis Mobile App
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                The premier mathematics community in your pocket
              </p>
            </div>
          </div>

          {/* Live Sync Feature Pill */}
          <div className="bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 border border-orange-500/20 rounded-xl p-3.5 mb-6 flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5 animate-spin-slow" />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-white">Automatic Live Sync: </span>
              <span className="text-slate-300">
                Any changes, updates, or new resources added to the website will automatically reflect in your app instantly — zero reinstall required!
              </span>
            </div>
          </div>

          {/* Platform Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800 mb-6">
            <button
              onClick={() => setActiveTab('android')}
              className={`py-2.5 px-4 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'android'
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android (.APK)</span>
            </button>
            <button
              onClick={() => setActiveTab('pwa')}
              className={`py-2.5 px-4 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'pwa'
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Web App (iOS & All)</span>
            </button>
          </div>

          {/* TAB 1: Android APK */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <a
                href={DIRECT_APK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button 
                  size="lg" 
                  className="w-full h-13 sm:h-14 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 group transition-all"
                >
                  <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Download Mentis.apk (Direct)</span>
                </Button>
              </a>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Direct package file • Size: ~5 MB</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified & Safe
                </span>
              </div>

              {/* 3 Step Installation Guide */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
                  How to install APK on Android:
                </h4>
                <div className="text-xs text-slate-400 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-orange-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">1</span>
                    <span>Click <strong>Download Mentis.apk</strong>. If Chrome warns <em>"File might be harmful"</em>, tap <strong>Download anyway</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-orange-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">2</span>
                    <span>Open the downloaded file from your notifications tray or <em>Downloads</em> folder.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-orange-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">3</span>
                    <span>Tap <strong>Install</strong> (if prompted, toggle <em>"Allow from this source"</em> in Android Settings).</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PWA Web App for iOS and All Devices */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              {isInstallable ? (
                <Button 
                  onClick={handleInstallPWA}
                  size="lg" 
                  className="w-full h-13 sm:h-14 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 group"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Install App on this Device</span>
                </Button>
              ) : (
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
                  <div className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-orange-400" />
                    <span>{isIOS ? 'How to install on iPhone & iPad:' : 'How to install as Web App:'}</span>
                  </div>
                  {isIOS ? (
                    <ol className="space-y-2.5 text-slate-400 pl-1">
                      <li className="flex items-start gap-2">
                        <Share className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>1. Open this website in <strong>Safari</strong> and tap the <strong>Share</strong> button (the box with an upward arrow) at the bottom.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <PlusSquare className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                        <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>3. Tap <strong>Add</strong> in the top-right corner. Mentis will appear right on your home screen!</span>
                      </li>
                    </ol>
                  ) : (
                    <div className="space-y-2">
                      <p>Tap your browser's menu (three dots in Chrome or Edge) and select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.</p>
                      <p className="text-slate-400">It runs in full-screen standalone mode with native performance and instant live updates.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Share / Copy website link */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="w-full border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs h-10 rounded-xl flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Website Link for Phone'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Footer Highlights */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Official Mentis Mathematics App</span>
            <a 
              href="https://github.com/Atreya21/Mentis/releases" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-orange-400 flex items-center gap-1 transition-colors"
            >
              <span>GitHub Releases</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DownloadAppModal;
