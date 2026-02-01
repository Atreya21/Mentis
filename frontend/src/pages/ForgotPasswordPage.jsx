import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSubmitted(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      toast.error('Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/login" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-3xl font-heading">Forgot Password?</CardTitle>
              <CardDescription className="text-slate-400">
                {!submitted 
                  ? "No worries, we'll help you reset it"
                  : "Check your reset link below"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 bg-slate-900 border-slate-700 text-white focus:border-orange-500"
                        placeholder="your.email@example.com"
                        data-testid="forgot-password-email-input"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-full h-12 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                    disabled={loading}
                    data-testid="forgot-password-submit-btn"
                  >
                    {loading ? 'Processing...' : 'Get Reset Link'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white text-center mb-2">
                    Check Your Email
                  </h3>
                  
                  <p className="text-slate-300 text-center mb-4">
                    If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                  </p>

                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                    <p className="text-sm text-slate-400 text-center">
                      📧 Check your inbox (and spam folder) for an email from Mentis with instructions to reset your password.
                    </p>
                  </div>

                  <p className="text-xs text-slate-500 text-center mt-4">
                    Note: The reset link will expire in 1 hour
                  </p>

                  <div className="pt-4">
                    <Button
                      onClick={() => {
                        setSubmitted(false);
                        setEmail('');
                      }}
                      variant="outline"
                      className="w-full border-slate-700 hover:bg-slate-800"
                    >
                      Send Another Link
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                <p className="text-sm text-slate-400">
                  Remember your password?{' '}
                  <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium">
                    Login here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;