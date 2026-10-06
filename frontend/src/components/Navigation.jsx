import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '@/App';
import { useWebSocket } from '@/context/WebSocketContext';
import { Button } from '@/components/ui/button';
import { User, Shield, Menu, X, Smartphone } from 'lucide-react';
import DownloadAppModal from '@/components/DownloadAppModal';
import { useIsApp } from '@/utils/appDetector';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Navigation = () => {
  const { user } = useContext(AuthContext);
  const isApp = useIsApp();
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const { unreadCount, fetchUnreadCount } = useWebSocket();

  useEffect(() => {
    fetchLogo();
  }, []);

  // Refresh unread count when navigating away from Mathmate
  useEffect(() => {
    if (location.pathname !== '/connect' && user && fetchUnreadCount) {
      fetchUnreadCount();
    }
  }, [location.pathname, user, fetchUnreadCount]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const fetchLogo = async () => {
    try {
      const res = await axios.get(`${API}/about-us`);
      if (res.data?.logo_url) {
        setLogoUrl(res.data.logo_url);
      }
    } catch (err) {
      console.error('Failed to fetch logo');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Resource Hub', path: '/resources', requiresAuth: true },
    { name: 'Funamatics', path: '/funamatics', requiresAuth: true },
    { name: 'Curiofacts', path: '/curiofacts', requiresAuth: true },
    { name: 'Matrix', path: '/matrix', requiresAuth: true },
    { name: 'VEX', path: '/reels', requiresAuth: true },
    { name: 'Mathmate', path: '/connect', requiresAuth: true, hasNotification: true },
    { name: 'About us', path: '/about' },
  ];

  const filteredLinks = navLinks.filter(link => !link.requiresAuth || user);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Ambient Top Glow Line */}
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 via-pink-500/30 to-transparent" />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 group">
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt="Mentis Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover ring-1 ring-orange-500/30 group-hover:ring-orange-500/70 transition-all shadow-md group-hover:scale-105"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <span className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-gradient shine-effect group-hover:drop-shadow-[0_0_12px_rgba(249,115,22,0.5)] transition-all">
              Mentis
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 bg-slate-900/60 p-1.5 rounded-full border border-slate-800/80 backdrop-blur-md">
            {filteredLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative font-body text-xs xl:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                    isActive 
                      ? 'text-white bg-gradient-to-r from-orange-500/25 to-pink-500/20 border border-orange-500/40 shadow-sm shadow-orange-500/10' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  data-testid={link.hasNotification ? 'mathmate-nav-link' : undefined}
                >
                  <span className="flex items-center gap-1.5">
                    {link.name}
                    {link.hasNotification && unreadCount > 0 && (
                      <span 
                        className="min-w-[18px] h-4 flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse shadow-md shadow-red-500/50"
                        data-testid="mathmate-notification-badge"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth & App Buttons */}
          <div className="hidden sm:flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            {!isApp && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDownloadModal(true)}
                className="rounded-full border-orange-500/40 bg-slate-900/60 hover:bg-orange-500/15 hover:border-orange-400 text-slate-300 hover:text-white text-xs sm:text-sm px-3.5 flex items-center gap-1.5 transition-all shadow-sm"
                data-testid="nav-download-app-btn"
              >
                <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                <span>App</span>
              </Button>
            )}
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" className="rounded-full border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs sm:text-sm px-3.5 sm:px-4" data-testid="dashboard-btn">
                    <User className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
                {(user.role === 'admin' || user.role === 'master_admin') && (
                  <Link to="/admin">
                    <Button size="sm" className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-xs sm:text-sm px-3.5 sm:px-4 shadow-md shadow-orange-500/20" data-testid="admin-dashboard-btn">
                      <Shield className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="rounded-full border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs sm:text-sm px-3.5 sm:px-4" data-testid="login-nav-btn">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-xs sm:text-sm px-4 shadow-md shadow-orange-500/25 transition-all hover:scale-105" data-testid="signup-nav-btn">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900/98 backdrop-blur-md border-t border-slate-800">
          <div className="px-4 py-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Mobile Nav Links */}
            {filteredLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-4 py-3 rounded-lg font-body text-base font-medium transition-all ${
                  location.pathname === link.path 
                    ? 'text-orange-500 bg-orange-500/10' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center justify-between">
                  {link.name}
                  {link.hasNotification && unreadCount > 0 && (
                    <span className="min-w-[24px] h-6 flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full px-2">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </Link>
            ))}

            {/* Mobile App Download Button */}
            {!isApp && (
              <div className="pt-2">
                <button
                  onClick={() => { setMobileMenuOpen(false); setShowDownloadModal(true); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-white hover:bg-orange-500/20 transition-all text-sm font-medium"
                >
                  <span className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-orange-400" />
                    <span>Download Mobile App</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/30 text-orange-300 font-bold">
                    APK / PWA
                  </span>
                </button>
              </div>
            )}

            {/* Mobile Auth Section */}
            <div className="pt-3 mt-3 border-t border-slate-700 space-y-2">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    Dashboard
                  </Link>
                  {(user.role === 'admin' || user.role === 'master_admin') && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="w-5 h-5" />
                      Admin Panel
                    </Link>
                  )}
                </>
              ) : (
                <div className="flex gap-3 px-4">
                  <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-full border-slate-700">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* App Download Modal */}
      <DownloadAppModal 
        isOpen={showDownloadModal} 
        onClose={() => setShowDownloadModal(false)} 
      />
    </nav>
  );
};

export default Navigation;
