import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await signup(name, email, password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-bold text-slate-900 mb-2">Join Mentis</h1>
            <p className="text-slate-600">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-slate-700">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 rounded-lg"
                data-testid="signup-name-input"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 rounded-lg"
                data-testid="signup-email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-2 rounded-lg"
                data-testid="signup-password-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full h-12 bg-slate-900 hover:bg-slate-800"
              disabled={loading}
              data-testid="signup-submit-btn"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <p className="text-center text-slate-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 hover:text-orange-600 font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;