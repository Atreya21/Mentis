import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt';
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
    localStorage.removeItem('token');
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
        <div className="App min-h-screen flex flex-col bg-slate-950">
          <Navigation />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
              <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/resend-verification" element={<ResendVerificationPage />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/resources" element={user ? <ResourceHub /> : <Navigate to="/login" />} />
              <Route path="/funamatics" element={user ? <Funamatics /> : <Navigate to="/login" />} />
              <Route path="/curiofacts" element={user ? <Curiofacts /> : <Navigate to="/login" />} />
              <Route path="/matrix" element={user ? <Matrix /> : <Navigate to="/login" />} />
              <Route path="/connect" element={user ? <ConnectPage /> : <Navigate to="/login" />} />
              <Route path="/reels" element={user ? <ReelsPage /> : <Navigate to="/login" />} />
              <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/admin" element={(user?.role === 'admin' || user?.role === 'master_admin') ? <AdminDashboard /> : <Navigate to="/" />} />
            </Routes>
          </div>
          <ConditionalFooter />
          <Toaster position="top-right" />
          <PWAUpdatePrompt />
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;