import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/App';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Gamepad2, Sparkles, User, Award } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [myResources, setMyResources] = useState([]);

  useEffect(() => {
    fetchMyResources();
  }, []);

  const fetchMyResources = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filtered = res.data.filter(r => r.submitted_by === user.id);
      setMyResources(filtered);
    } catch (err) {
      toast.error('Failed to fetch your resources');
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="mb-12">
          <h1 className="font-heading text-5xl font-bold text-white mb-4">
            Welcome, {user?.name}!
          </h1>
          <p className="text-lg text-slate-400">Manage your account and contributions</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-orange-400" />
                Profile
              </CardTitle>
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
                  <p className="font-medium capitalize text-white">{user?.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Award className="w-5 h-5 text-yellow-400" />
                Mentis Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gradient">{myResources.length}</p>
              <p className="text-sm text-slate-400 mt-2">Resources contributed</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BookOpen className="w-5 h-5 text-orange-400" />
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{myResources.length}</p>
              <p className="text-sm text-slate-400 mt-2">Submitted resources</p>
            </CardContent>
          </Card>

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
                {new Date(user?.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="font-heading text-3xl font-semibold text-white mb-6">
            Your Submitted Resources
          </h2>
          {myResources.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myResources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl"
                  data-testid="user-resource-card"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium px-3 py-1 bg-slate-700 text-slate-300 rounded-full">
                      {resource.content_type}
                    </span>
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${
                        resource.status === 'approved'
                          ? 'bg-green-500/20 text-green-400'
                          : resource.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {resource.status}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-white mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                    {resource.description}
                  </p>
                  <span className="text-xs text-slate-500 font-medium">{resource.topic}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">You haven&apos;t submitted any resources yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;