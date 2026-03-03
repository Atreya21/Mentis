import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield, MessageCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/messages/unread/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count');
    }
  }, [user]);

  useEffect(() => {
    fetchLogo();
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for unread messages every 30 seconds when user is logged in
    if (user) {
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  // Refresh unread count when navigating away from Mathmate
  useEffect(() => {
    if (location.pathname !== '/connect' && user) {
      fetchUnreadCount();
    }
  }, [location.pathname, user, fetchUnreadCount]);

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
    { name: 'Curiofacts', path: '/curiofacts' },
    { name: 'Matrix', path: '/matrix' },
    { name: 'Reels', path: '/reels', requiresAuth: true },
    { name: 'Mathmate', path: '/connect', requiresAuth: true, hasNotification: true },
    { name: 'About us', path: '/about' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3">
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt="Mentis Logo" 
                className="w-10 h-10 rounded-lg object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <span className="font-heading text-3xl font-bold text-gradient shine-effect">
              Mentis
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              // Hide auth-required links for non-logged-in users
              (!link.requiresAuth || user) && (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative font-body text-sm font-medium transition-all hover:text-orange-400 hover:scale-105 ${
                    location.pathname === link.path ? 'text-orange-500' : 'text-slate-300'
                  }`}
                  data-testid={link.hasNotification ? 'mathmate-nav-link' : undefined}
                >
                  <span className="flex items-center gap-1">
                    {link.name}
                    {/* Notification bubble for Mathmate */}
                    {link.hasNotification && unreadCount > 0 && (
                      <span 
                        className="absolute -top-2 -right-4 min-w-[20px] h-5 flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full px-1.5 animate-pulse shadow-lg shadow-red-500/50"
                        data-testid="mathmate-notification-badge"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </span>
                </Link>
              )
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" className="rounded-full border-slate-700 hover:bg-slate-800" data-testid="dashboard-btn">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                {(user.role === 'admin' || user.role === 'master_admin') && (
                  <Link to="/admin">
                    <Button size="sm" className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" data-testid="admin-dashboard-btn">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="rounded-full hover:bg-slate-800"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="rounded-full border-slate-700 hover:bg-slate-800" data-testid="login-nav-btn">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" data-testid="signup-nav-btn">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
