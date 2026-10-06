import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt';
import MessagePopupContainer from '@/components/MessagePopupContainer';
import NotificationPermissionBanner from '@/components/NotificationPermissionBanner';
import TopLoadingBar from '@/components/common/TopLoadingBar';
import InteractiveSpotlight from '@/components/common/InteractiveSpotlight';
import PageTransition from '@/components/common/PageTransition';
import pushService from '@/services/PushNotificationService';
import notificationService from '@/services/NotificationService';
import { WebSocketProvider } from '@/context/WebSocketContext';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import ResendVerificationPage from '@/pages/ResendVerificationPage';
import ResourceHub from '@/pages/ResourceHub';
import Funamatics from '@/pages/Funamatics';
import Curiofacts from '@/pages/Curiofacts';
import Matrix from '@/pages/Matrix';
import Dashboard from '@/pages/Dashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import ConnectPage from '@/pages/ConnectPage';
import ReelsPage from '@/pages/ReelsPage';
import AboutUs from '@/pages/AboutUs';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthContext = React.createContext(null);

// Initialize Capacitor plugins
const initCapacitor = async () => {
  if (Capacitor.isNativePlatform()) {
    // Add capacitor class to body for CSS targeting
    document.body.classList.add('capacitor');
    
    try {
      // Configure status bar for dark theme
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0f172a' });
    } catch (e) {
      console.log('StatusBar plugin not available');
    }
    
    try {
      // Configure keyboard behavior
      Keyboard.addListener('keyboardWillShow', () => {
        document.body.classList.add('keyboard-open');
      });
      Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('keyboard-open');
      });
    } catch (e) {
      console.log('Keyboard plugin not available');
    }
  }
};

// Conditional Footer component that only shows on specific pages
const ConditionalFooter = () => {
  const location = useLocation();
  const showFooterPaths = ['/', '/about'];
  
  if (!showFooterPaths.includes(location.pathname)) {
    return null;
  }
  
  return <Footer />;
};

// Animated routes wrapper with route transition animations
const AnimatedRoutes = ({ user }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <PageTransition><LoginPage /></PageTransition>} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <PageTransition><SignupPage /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
        <Route path="/verify-email" element={<PageTransition><VerifyEmailPage /></PageTransition>} />
        <Route path="/resend-verification" element={<PageTransition><ResendVerificationPage /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutUs /></PageTransition>} />
        <Route path="/resources" element={user ? <PageTransition><ResourceHub /></PageTransition> : <Navigate to="/login" />} />
        <Route path="/funamatics" element={user ? <PageTransition><Funamatics /></PageTransition> : <Navigate to="/login" />} />
        <Route path="/curiofacts" element={user ? <PageTransition><Curiofacts /></PageTransition> : <Navigate to="/login" />} />
        <Route path="/matrix" element={user ? <PageTransition><Matrix /></PageTransition> : <Navigate to="/login" />} />
        <Route path="/connect" element={user ? <PageTransition><ConnectPage /></PageTransition> : <Navigate to="/login" />} />
        <Route path="/reels" element={user ? <PageTransition><ReelsPage /></PageTransition> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <PageTransition><Dashboard /></PageTransition> : <Navigate to="/login" />} />
        <Route path="/admin" element={(user?.role === 'admin' || user?.role === 'master_admin') ? <PageTransition><AdminDashboard /></PageTransition> : <Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Capacitor plugins
    initCapacitor();
    
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Automatically initialize and sync push notifications for authenticated user
  useEffect(() => {
    if (user) {
      pushService.init().catch(err => console.warn('Push init error:', err));
      notificationService.init().catch(err => console.warn('Notification init error:', err));
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.access_token);
      setUser(res.data.user);
      toast.success('Welcome back!');
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Login failed';
      
      // Check if it's an email verification error (403)
      if (err.response?.status === 403 && errorMessage.includes('verify')) {
        toast.error('Please verify your email before logging in');
        return 'needs_verification';
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await axios.post(`${API}/auth/signup`, { name, email, password });
      localStorage.setItem('token', res.data.access_token);
      setUser(res.data.user);
      toast.success('Account created successfully!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed');
      return false;
    }
  };

  const logout = () => {
    pushService.unsubscribe().catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-heading">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout }}>
      <BrowserRouter>
        <WebSocketProvider user={user}>
          <div className="App min-h-screen flex flex-col bg-slate-950 relative overflow-x-hidden selection:bg-orange-500/30 selection:text-orange-200">
            <TopLoadingBar />
            <InteractiveSpotlight />
            <Navigation />
            <NotificationPermissionBanner />
            <main className="flex-grow flex flex-col">
              <AnimatedRoutes user={user} />
            </main>
            <ConditionalFooter />
            <Toaster position="top-right" />
            <MessagePopupContainer />
            <PWAUpdatePrompt />
          </div>
        </WebSocketProvider>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;