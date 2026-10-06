import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '@/App';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles, User, Award, Edit, Video, Mail, Check, X, Clock, LogOut, Compass, Bookmark, Eye, Star, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const [myResources, setMyResources] = useState([]);
  const [pendingResources, setPendingResources] = useState([]);
  const [pendingReels, setPendingReels] = useState([]);
  const [pendingCuriofacts, setPendingCuriofacts] = useState([]);
  const [emailRequests, setEmailRequests] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [selectedWallpaper, setSelectedWallpaper] = useState(
    user?.hero_wallpaper || 'image'
  );

  useEffect(() => {
    if (user?.hero_wallpaper) {
      setSelectedWallpaper(user.hero_wallpaper);
    }
  }, [user?.id, user?.hero_wallpaper]);

  const WALLPAPER_ITEMS = [
    { id: 'image', name: 'Foundation Showcase Image', category: 'Default Visual', formula: 'Mentis Hero Showcase' },
    { id: 'icosahedron', name: 'Golden-Ratio Icosahedron', category: 'Sacred Polyhedra', formula: 'x² + y² + z² = Φ' },
    { id: 'tesseract', name: '4D Hypercube (Tesseract)', category: 'Higher Dimensions', formula: 'x₄² + y₄² + z₄² + w₄² = 1' },
    { id: 'dodecahedron', name: 'Stellated Dodecahedron', category: 'Sacred Polyhedra', formula: 'V_stell = V_face + λ n̂' },
    { id: 'clifford_torus', name: '4D Clifford Flat Torus', category: 'Higher Dimensions', formula: 'X² + Y² = 1/2' },
    { id: 'mobius', name: 'Möbius Ribbon Manifold', category: 'Topology', formula: 'x(u,v) Non-orientable' },
    { id: 'klein', name: 'Klein Bottle (Figure-8)', category: 'Topology', formula: 'r(u,v) Figure-8 Immersion' },
    { id: 'trefoil', name: 'Toroidal Trefoil Knot T(2,3)', category: 'Knot Theory', formula: 'x = sin t + 2sin 2t' },
    { id: 'hopf', name: 'Hopf Fibration (S³ → S²)', category: 'Topology', formula: 'π(z₀, z₁) Interlocking' },
    { id: 'calabi_yau', name: 'Calabi-Yau 6D Slice', category: 'Complex Geometry', formula: 'z₁⁵ + z₂⁵ = 1' },
    { id: 'riemann_zeta', name: 'Riemann Zeta Critical Helix', category: 'Analytic Number Theory', formula: 'ζ(1/2 + it)' },
    { id: 'sunflower_sphere', name: 'Fibonacci Phyllotaxis Sphere', category: 'Sacred Polyhedra', formula: 'θ_i = i · 2.39996 rad' },
    { id: 'buckyball', name: 'Fullerene C60 Buckyball', category: 'Polyhedral Geometry', formula: 'Truncated Icosahedron' },
    { id: 'lorenz', name: 'Lorenz Strange Attractor', category: 'Chaos Theory', formula: 'dx/dt = σ(y - x)' },
    { id: 'quantum_orbital', name: 'Hydrogen d-Orbital (ψ₃,₂,₀)', category: 'Quantum Mechanics', formula: 'Quadrupole Lobe Density' }
  ];

  const handleSaveWallpaper = async (wallpaperId) => {
    setSelectedWallpaper(wallpaperId);
    if (user?.id) {
      localStorage.setItem(`mentis_hero_wallpaper_${user.id}`, wallpaperId);
      if (setUser) {
        setUser((prev) => (prev ? { ...prev, hero_wallpaper: wallpaperId } : prev));
      }
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await axios.put(
            `${API}/users/me/hero-wallpaper`,
            { hero_wallpaper: wallpaperId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (err) {
        console.warn('Backend cloud wallpaper sync notice:', err?.response?.status || err.message);
      }
      toast.success('Hero Wallpaper updated for your account!');
    }
  };

  // Function to refresh user data from backend
  const refreshUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const res = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && setUser) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Failed to refresh user data');
    }
  };

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      loadData();
      
      // Refresh user data every 5 seconds to get updated Mentis Score
      const refreshInterval = setInterval(() => {
        refreshUserData();
      }, 5000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [user?.id]); // Only re-run when user id changes, not on every user update

  const loadData = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const resourcesRes = await axios.get(`${API}/resources`, { headers });
      const userResources = resourcesRes.data.filter(function(r) { return r.submitted_by === user.id; });
      setMyResources(userResources);
    } catch (err) {
      console.error('Failed to fetch resources');
    }

    try {
      const pendingRes = await axios.get(`${API}/users/me/pending`, { headers });
      setPendingResources(pendingRes.data.pending_resources || []);
      setPendingReels(pendingRes.data.pending_reels || []);
      setPendingCuriofacts(pendingRes.data.pending_curiofacts || []);
    } catch (err) {
      console.error('Failed to fetch pending items');
    }

    try {
      const emailRes = await axios.get(`${API}/email-requests`, { headers });
      setEmailRequests(emailRes.data || []);
    } catch (err) {
      console.error('Failed to fetch email requests');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`${API}/users/me`, 
        { name: editName, email: editEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Profile updated!');
      setUser(res.data.user);
      setEditDialogOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update');
    }
  };

  const respondToEmailRequest = async (requestId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/email-requests/${requestId}?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Response sent');
      loadData();
    } catch (err) {
      toast.error('Failed to respond');
    }
  };

  const totalPending = pendingResources.length + pendingReels.length + pendingCuriofacts.length;
  const approvedCount = myResources.filter(function(r) { return r.status === 'approved'; }).length;
  const pendingEmailRequests = emailRequests.filter(function(r) { return r.status === 'pending'; });

  return (
    <div className="min-h-screen pt-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-5xl font-bold text-white mb-4">
              Welcome, {user?.name}!
            </h1>
            <p className="text-lg text-slate-400">Manage your account and contributions</p>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="rounded-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-fit"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Profile Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-orange-400" />
                Profile
              </CardTitle>
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" data-testid="edit-profile-btn">
                    <Edit className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label className="text-slate-300">Name</Label>
                      <Input
                        value={editName}
                        onChange={function(e) { setEditName(e.target.value); }}
                        className="mt-2 bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Email</Label>
                      <Input
                        type="email"
                        value={editEmail}
                        onChange={function(e) { setEditEmail(e.target.value); }}
                        className="mt-2 bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <Button onClick={handleUpdateProfile} className="w-full bg-gradient-to-r from-orange-500 to-pink-500">
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-slate-500">Name</p>
                  <p className="font-medium text-white">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium text-white">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Role</p>
                  <p className="font-medium capitalize text-white">
                    {user?.role === 'master_admin' ? 'Master Admin' : user?.role}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mentis Score Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Award className="w-5 h-5 text-yellow-400" />
                Mentis Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gradient">{user?.mentis_score || 0}</p>
              <p className="text-sm text-slate-400 mt-2">
                +5 Resources • +3 VEX • +1 Curiofacts
              </p>
            </CardContent>
          </Card>

          {/* Pending Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="w-5 h-5 text-yellow-400" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-400">{totalPending}</p>
              <p className="text-sm text-slate-400 mt-2">Awaiting approval</p>
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-orange-400" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Member since</p>
              <p className="font-medium text-white">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Account Hero Wallpaper & 3D Visual Preferences Section */}
        <Card className="bg-slate-900/80 border-slate-700/80 mb-10 overflow-hidden shadow-xl backdrop-blur-md">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2.5 text-white text-xl">
                  <Bookmark className="w-5 h-5 text-orange-400" />
                  <span>Account Hero Wallpaper &amp; Visual Preferences</span>
                </CardTitle>
                <p className="text-sm text-slate-400 mt-1">
                  Choose your permanent default hero visual. This visual will constantly display across your account on the homepage.
                </p>
              </div>
              <Link to="/">
                <Button size="sm" variant="outline" className="rounded-full border-orange-500/40 text-orange-300 hover:text-white hover:bg-orange-500/20 text-xs">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  View Live on Homepage
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {WALLPAPER_ITEMS.map((item) => {
                const isActive = selectedWallpaper === item.id;
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSaveWallpaper(item.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-gradient-to-br from-orange-500/20 to-pink-500/15 border-orange-500/60 shadow-lg shadow-orange-500/15'
                        : 'bg-slate-950/70 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono uppercase text-slate-400 truncate">
                          {item.category}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            <Check className="w-2.5 h-2.5" /> ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-white font-heading truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono text-orange-400/80 truncate mt-0.5">
                        {item.formula}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {isActive ? 'Current View' : 'Click to Set'}
                      </span>
                      {isActive ? (
                        <Star className="w-3 h-3 text-orange-400 fill-current" />
                      ) : (
                        <Bookmark className="w-3 h-3 text-slate-600 hover:text-orange-400" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Email Requests Section */}
        {pendingEmailRequests.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Mail className="w-5 h-5 text-blue-400" />
                Email Requests ({pendingEmailRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingEmailRequests.map(function(request) {
                  return (
                    <div key={request.id} className="flex items-center justify-between bg-slate-900/50 p-4 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{request.requester?.name || 'Unknown User'}</p>
                        <p className="text-sm text-slate-400">wants to see your email</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={function() { respondToEmailRequest(request.id, 'approved'); }}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={function() { respondToEmailRequest(request.id, 'rejected'); }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Submissions Section */}
        {totalPending > 0 && (
          <div className="mb-12">
            <h2 className="font-heading text-3xl font-semibold text-white mb-6">Pending Submissions</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Pending Resources */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <BookOpen className="w-5 h-5 text-orange-400" />
                    Resources ({pendingResources.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingResources.length === 0 ? (
                    <p className="text-slate-400 text-sm">No pending resources</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingResources.map(function(item) {
                        return (
                          <div key={item.id} className="bg-slate-900/50 p-3 rounded-lg">
                            <Badge className="bg-yellow-500/20 text-yellow-400 mb-2">Pending</Badge>
                            <p className="text-white font-medium text-sm">{item.title}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending VEX */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <Video className="w-5 h-5 text-pink-400" />
                    VEX ({pendingReels.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingReels.length === 0 ? (
                    <p className="text-slate-400 text-sm">No pending VEX</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingReels.map(function(item) {
                        return (
                          <div key={item.id} className="bg-slate-900/50 p-3 rounded-lg">
                            <Badge className="bg-yellow-500/20 text-yellow-400 mb-2">Pending</Badge>
                            <p className="text-white font-medium text-sm line-clamp-2">{item.caption}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Curiofacts */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Curiofacts ({pendingCuriofacts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingCuriofacts.length === 0 ? (
                    <p className="text-slate-400 text-sm">No pending curiofacts</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingCuriofacts.map(function(item) {
                        return (
                          <div key={item.id} className="bg-slate-900/50 p-3 rounded-lg">
                            <Badge className="bg-yellow-500/20 text-yellow-400 mb-2">Pending</Badge>
                            <p className="text-white font-medium text-sm">{item.title}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Approved Resources */}
        <div>
          <h2 className="font-heading text-3xl font-semibold text-white mb-6">Your Approved Resources</h2>
          {approvedCount > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myResources.filter(function(r) { return r.status === 'approved'; }).map(function(resource) {
                return (
                  <div key={resource.id} className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl" data-testid="user-resource-card">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium px-3 py-1 bg-slate-700 text-slate-300 rounded-full">
                        {resource.content_type}
                      </span>
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                        Approved
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-white mb-2">{resource.title}</h3>
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{resource.description}</p>
                    <span className="text-xs text-slate-500 font-medium">{resource.topic}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No approved resources yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
