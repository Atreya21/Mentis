import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Network, Users, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Matrix = () => {
  const [stats, setStats] = useState({ total_members: 0, total_colleges: 0 });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college: '',
    interests: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/matrix/stats`);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/matrix/register`, formData);
      toast.success('Successfully joined the Matrix! Welcome to the community.');
      setFormData({ name: '', email: '', college: '', interests: '' });
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-8"
          >
            <div className="w-24 h-24 bg-black border-2 border-green-500 rounded-2xl flex items-center justify-center matrix-glow">
              <Network className="w-12 h-12 text-green-500" />
            </div>
          </motion.div>
          
          <h1 className="font-mono text-5xl md:text-7xl font-bold text-green-500 mb-6 matrix-glow uppercase tracking-wider">
            Enter the Matrix
          </h1>
          <p className="font-mono text-lg md:text-xl text-green-400 max-w-2xl mx-auto">
            Join our global community of mathematics enthusiasts
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-black border-2 border-green-900 rounded-2xl p-8 text-center stat-pulse"
            data-testid="matrix-stats-members"
          >
            <Users className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <div className="font-mono text-6xl font-bold text-green-500 mb-2 matrix-glow">
              {stats.total_members}
            </div>
            <p className="font-mono text-lg text-green-400 uppercase tracking-widest">Active Members</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-black border-2 border-green-900 rounded-2xl p-8 text-center stat-pulse"
            data-testid="matrix-stats-colleges"
          >
            <Building2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <div className="font-mono text-6xl font-bold text-green-500 mb-2 matrix-glow">
              {stats.total_colleges}
            </div>
            <p className="font-mono text-lg text-green-400 uppercase tracking-widest">Partner Colleges</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-2xl mx-auto bg-black border-2 border-green-900 rounded-2xl p-8 md:p-12"
        >
          <h2 className="font-mono text-3xl font-bold text-green-500 mb-8 text-center uppercase tracking-wider">
            Join the Network
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="font-mono text-green-400 uppercase tracking-wider">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-2 bg-black border-green-900 text-green-500 font-mono focus:border-green-500 focus:ring-green-500"
                data-testid="matrix-name-input"
              />
            </div>

            <div>
              <Label htmlFor="email" className="font-mono text-green-400 uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-2 bg-black border-green-900 text-green-500 font-mono focus:border-green-500 focus:ring-green-500"
                data-testid="matrix-email-input"
              />
            </div>

            <div>
              <Label htmlFor="college" className="font-mono text-green-400 uppercase tracking-wider">College/University</Label>
              <Input
                id="college"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                required
                className="mt-2 bg-black border-green-900 text-green-500 font-mono focus:border-green-500 focus:ring-green-500"
                data-testid="matrix-college-input"
              />
            </div>

            <div>
              <Label htmlFor="interests" className="font-mono text-green-400 uppercase tracking-wider">Mathematical Interests</Label>
              <Textarea
                id="interests"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                required
                rows={4}
                className="mt-2 bg-black border-green-900 text-green-500 font-mono focus:border-green-500 focus:ring-green-500"
                placeholder="Tell us about your interests in mathematics..."
                data-testid="matrix-interests-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-black border-2 border-green-500 text-green-500 hover:bg-green-900/20 font-mono uppercase tracking-widest rounded-lg"
              disabled={loading}
              data-testid="matrix-submit-btn"
            >
              {loading ? 'Connecting...' : 'Join Matrix'}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-green-900 text-center">
            <p className="font-mono text-sm text-green-400">
              App launching soon. Stay connected for updates.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Matrix;