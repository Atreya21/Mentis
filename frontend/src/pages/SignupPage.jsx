import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/api/auth/signup`, { name, email, password });
      setSignupComplete(true);
      toast.success('Account created! Please check your email to verify.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (signupComplete) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="w-full max-w-md px-6">
          <motion.div 
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="font-heading text-2xl font-bold text-white mb-4">Check Your Email!</h1>
            <p className="text-slate-400 mb-6">
              We've sent a verification link to <span className="text-orange-400 font-medium">{email}</span>. 
              Please click the link to verify your account.
            </p>
            <div className="space-y-3">
              <p className="text-slate-500 text-sm">
                Didn't receive the email? Check your spam folder or
              </p>
              <Button
                onClick={() => navigate('/resend-verification')}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <Mail className="w-4 h-4 mr-2" />
                Resend Verification Email
              </Button>
            </div>
            <p className="text-slate-400 mt-6 text-sm">
              Already verified?{' '}
              <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium">
                Login here
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md px-6">
        <motion.div 
          className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-bold text-white mb-2">Join Mentis</h1>
            <p className="text-slate-400">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-slate-300">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 rounded-lg bg-slate-900 border-slate-700 text-white focus:border-orange-500"
                data-testid="signup-name-input"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 rounded-lg bg-slate-900 border-slate-700 text-white focus:border-orange-500"
                data-testid="signup-email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-2 rounded-lg bg-slate-900 border-slate-700 text-white focus:border-orange-500"
                data-testid="signup-password-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full h-12 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shine-effect"
              disabled={loading}
              data-testid="signup-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>

          <p className="text-center text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium">
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
