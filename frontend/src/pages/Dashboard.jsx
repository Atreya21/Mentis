import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/App';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles, User, Award, Edit, Video, Mail, Check, X, Clock, LogOut } from 'lucide-react';
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

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      loadData();
    }
  }, [user]);

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
              <p className="text-3xl font-bold text-gradient">{user?.total_resources || approvedCount}</p>
              <p className="text-sm text-slate-400 mt-2">Approved contributions</p>
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

              {/* Pending Reels */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <Video className="w-5 h-5 text-pink-400" />
                    Reels ({pendingReels.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingReels.length === 0 ? (
                    <p className="text-slate-400 text-sm">No pending reels</p>
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
