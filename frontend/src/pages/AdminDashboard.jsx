import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, Plus, Shield, Users, BookOpen, Sparkles, Gamepad2, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [pendingResources, setPendingResources] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [allGames, setAllGames] = useState([]);
  const [allFacts, setAllFacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [matrixMembers, setMatrixMembers] = useState([]);
  const [stats, setStats] = useState({ users: 0, resources: 0, games: 0, facts: 0, matrixMembers: 0 });
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [factDialogOpen, setFactDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  
  const [gameForm, setGameForm] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    difficulty: 'easy'
  });
  
  const [factForm, setFactForm] = useState({
    title: '',
    content: '',
    image_url: ''
  });

  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    content_type: 'notes',
    url: '',
    topic: ''
  });

  useEffect(() => {
    fetchPendingResources();
    fetchAllResources();
    fetchAllGames();
    fetchAllFacts();
    fetchAllUsers();
    fetchMatrixMembers();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [usersRes, resourcesRes, gamesRes, factsRes, matrixRes] = await Promise.all([
        axios.get(`${API}/admin/users`, { headers }),
        axios.get(`${API}/resources`, { headers }),
        axios.get(`${API}/games`, { headers }),
        axios.get(`${API}/curiofacts`, { headers }),
        axios.get(`${API}/matrix/stats`)
      ]);

      setStats({
        users: usersRes.data.length,
        resources: resourcesRes.data.filter(r => r.status === 'approved').length,
        games: gamesRes.data.length,
        facts: factsRes.data.length,
        matrixMembers: matrixRes.data.total_members
      });
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchPendingResources = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/resources?status=pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingResources(res.data);
    } catch (err) {
      toast.error('Failed to fetch pending resources');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(res.data);
    } catch (err) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchMatrixMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/matrix-members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatrixMembers(res.data);
    } catch (err) {
      toast.error('Failed to fetch Matrix members');
    }
  };

  const fetchAllResources = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllResources(res.data.filter(r => r.status === 'approved'));
    } catch (err) {
      toast.error('Failed to fetch resources');
    }
  };

  const fetchAllGames = async () => {
    try {
      const res = await axios.get(`${API}/games`);
      setAllGames(res.data);
    } catch (err) {
      toast.error('Failed to fetch games');
    }
  };

  const fetchAllFacts = async () => {
    try {
      const res = await axios.get(`${API}/curiofacts`);
      setAllFacts(res.data);
    } catch (err) {
      toast.error('Failed to fetch curiofacts');
    }
  };

  const handleApproval = async (resourceId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API}/resources/${resourceId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Resource ${status}!`);
      fetchPendingResources();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed');
    }
  };

  const handlePromoteToAdmin = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API}/admin/promote-user/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('User promoted to admin successfully!');
      fetchAllUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to promote user');
    }
  };

  const handleCreateGame = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/games`, gameForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Game created successfully!');
      setGameDialogOpen(false);
      setGameForm({ title: '', description: '', url: '', thumbnail: '', difficulty: 'easy' });
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create game');
    }
  };

  const handleCreateFact = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/curiofacts`, factForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Curiofact published successfully!');
      setFactDialogOpen(false);
      setFactForm({ title: '', content: '', image_url: '' });
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to publish curiofact');
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/create-resource`, resourceForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Resource created and approved!');
      setResourceDialogOpen(false);
      setResourceForm({ title: '', description: '', content_type: 'notes', url: '', topic: '' });
      fetchStats();
      fetchAllResources();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create resource');
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/delete-resource/${resourceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Resource deleted successfully');
      fetchAllResources();
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/delete-game/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Game deleted successfully');
      fetchAllGames();
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete game');
    }
  };

  const handleDeleteFact = async (factId) => {
    if (!window.confirm('Are you sure you want to delete this curiofact?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/delete-curiofact/${factId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Curiofact deleted successfully');
      fetchAllFacts();
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete curiofact');
    }
  };

  const handleExportUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/export-users-csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mentis_users.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Users exported successfully!');
    } catch (err) {
      toast.error('Failed to export users');
    }
  };

  const handleExportMatrix = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/export-matrix-csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mentis_matrix_members.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Matrix members exported successfully!');
    } catch (err) {
      toast.error('Failed to export matrix members');
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <h1 className="font-heading text-5xl font-bold text-slate-900 mb-12">
          Admin Dashboard
        </h1>

        <Tabs defaultValue="resources" className="space-y-8">
          <TabsList>
            <TabsTrigger value="resources" data-testid="admin-tab-resources">Pending Resources</TabsTrigger>
            <TabsTrigger value="games" data-testid="admin-tab-games">Manage Games</TabsTrigger>
            <TabsTrigger value="facts" data-testid="admin-tab-facts">Manage Curiofacts</TabsTrigger>
          </TabsList>

          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>Pending Resource Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingResources.length > 0 ? (
                  <div className="space-y-4">
                    {pendingResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="border border-slate-200 rounded-lg p-6 bg-white"
                        data-testid="pending-resource-card"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-heading text-xl font-semibold text-slate-900 mb-2">
                              {resource.title}
                            </h3>
                            <p className="text-slate-600 mb-3">{resource.description}</p>
                            <div className="flex gap-4 text-sm text-slate-500">
                              <span>Type: {resource.content_type}</span>
                              <span>Topic: {resource.topic}</span>
                            </div>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-orange-500 hover:text-orange-600 mt-2 inline-block"
                            >
                              View Resource →
                            </a>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleApproval(resource.id, 'approved')}
                              data-testid="approve-resource-btn"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproval(resource.id, 'rejected')}
                              data-testid="reject-resource-btn"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">No pending resources</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Game Management</CardTitle>
                  <Dialog open={gameDialogOpen} onOpenChange={setGameDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-orange-500 hover:bg-orange-600" data-testid="add-game-btn">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Game
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-heading text-2xl">Add New Game</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateGame} className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="game-title">Title</Label>
                          <Input
                            id="game-title"
                            value={gameForm.title}
                            onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                            required
                            className="mt-2"
                            data-testid="game-title-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="game-description">Description</Label>
                          <Textarea
                            id="game-description"
                            value={gameForm.description}
                            onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                            required
                            className="mt-2"
                            rows={3}
                            data-testid="game-description-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="game-url">Game URL</Label>
                          <Input
                            id="game-url"
                            type="url"
                            value={gameForm.url}
                            onChange={(e) => setGameForm({ ...gameForm, url: e.target.value })}
                            required
                            className="mt-2"
                            data-testid="game-url-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="game-thumbnail">Thumbnail URL (optional)</Label>
                          <Input
                            id="game-thumbnail"
                            type="url"
                            value={gameForm.thumbnail}
                            onChange={(e) => setGameForm({ ...gameForm, thumbnail: e.target.value })}
                            className="mt-2"
                            data-testid="game-thumbnail-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="game-difficulty">Difficulty</Label>
                          <Select
                            value={gameForm.difficulty}
                            onValueChange={(value) => setGameForm({ ...gameForm, difficulty: value })}
                          >
                            <SelectTrigger className="mt-2" data-testid="game-difficulty-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" data-testid="game-submit-btn">
                          Create Game
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Add games for the Funamatics section</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facts">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Curiofacts Management</CardTitle>
                  <Dialog open={factDialogOpen} onOpenChange={setFactDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-orange-500 hover:bg-orange-600" data-testid="add-fact-btn">
                        <Plus className="w-4 h-4 mr-2" />
                        Publish Fact
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="font-heading text-2xl">Publish Curiofact</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateFact} className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="fact-title">Title</Label>
                          <Input
                            id="fact-title"
                            value={factForm.title}
                            onChange={(e) => setFactForm({ ...factForm, title: e.target.value })}
                            required
                            className="mt-2"
                            data-testid="fact-title-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fact-content">Content</Label>
                          <Textarea
                            id="fact-content"
                            value={factForm.content}
                            onChange={(e) => setFactForm({ ...factForm, content: e.target.value })}
                            required
                            className="mt-2"
                            rows={6}
                            data-testid="fact-content-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fact-image">Image URL (optional)</Label>
                          <Input
                            id="fact-image"
                            type="url"
                            value={factForm.image_url}
                            onChange={(e) => setFactForm({ ...factForm, image_url: e.target.value })}
                            className="mt-2"
                            data-testid="fact-image-input"
                          />
                        </div>
                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" data-testid="fact-submit-btn">
                          Publish Curiofact
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Publish weekly mathematical facts and updates</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;