import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/App';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Gamepad2, Sparkles, User } from 'lucide-react';
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
    <div className="min-h-screen pt-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="mb-12">
          <h1 className="font-heading text-5xl font-bold text-slate-900 mb-4">
            Welcome, {user?.name}!
          </h1>
          <p className="text-lg text-slate-600">Manage your account and contributions</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-slate-500">Name</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Role</p>
                  <p className="font-medium capitalize">{user?.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{myResources.length}</p>
              <p className="text-sm text-slate-600 mt-2">Submitted resources</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Member since</p>
              <p className="font-medium">
                {new Date(user?.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="font-heading text-3xl font-semibold text-slate-900 mb-6">
            Your Submitted Resources
          </h2>
          {myResources.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myResources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-white border border-slate-100 p-6 rounded-xl"
                  data-testid="user-resource-card"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                      {resource.content_type}
                    </span>
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${
                        resource.status === 'approved'
                          ? 'bg-green-100 text-green-600'
                          : resource.status === 'rejected'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-yellow-100 text-yellow-600'
                      }`}
                    >
                      {resource.status}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {resource.description}
                  </p>
                  <span className="text-xs text-slate-500 font-medium">{resource.topic}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">You haven't submitted any resources yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;