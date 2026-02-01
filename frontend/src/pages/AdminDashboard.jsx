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

// Utility function to convert Google Drive URLs to direct/viewable URLs
const convertGoogleDriveUrl = (url, forceDownload = false) => {
  if (!url) return url;
  
  // Google Drive file link patterns
  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // Pattern 2: https://drive.google.com/open?id=FILE_ID
  // Pattern 3: https://drive.google.com/uc?id=FILE_ID
  
  let fileId = null;
  
  // Extract file ID from various Google Drive URL formats
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?export=view&id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?export=download&id=([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      fileId = match[1];
      break;
    }
  }
  
  // If we found a Google Drive file ID, convert to appropriate URL
  if (fileId) {
    // For downloads (PDFs, documents), use export=download
    // For images/viewing, use export=view
    const exportType = forceDownload ? 'download' : 'view';
    return `https://drive.google.com/uc?export=${exportType}&id=${fileId}`;
  }
  
  // Return original URL if not a Google Drive link
  return url;
};

// Alias for backward compatibility
const convertToDirectImageUrl = (url) => convertGoogleDriveUrl(url, false);

const AdminDashboard = () => {
  const [pendingResources, setPendingResources] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [allGames, setAllGames] = useState([]);
  const [allFacts, setAllFacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [matrixMembers, setMatrixMembers] = useState([]);
  const [resetTokens, setResetTokens] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ hero_image_url: '' });
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
    fetchSiteSettings();
    fetchResetTokens();
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

  const fetchSiteSettings = async () => {
    try {
      const res = await axios.get(`${API}/site-settings`);
      setSiteSettings(res.data);
    } catch (err) {
      toast.error('Failed to fetch site settings');
    }
  };

  const fetchResetTokens = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/password-reset-tokens`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResetTokens(res.data);
    } catch (err) {
      console.error('Failed to fetch reset tokens');
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
      // Convert Google Drive URLs for thumbnail
      const processedGameForm = {
        ...gameForm,
        thumbnail: convertGoogleDriveUrl(gameForm.thumbnail, false)
      };
      await axios.post(`${API}/games`, processedGameForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Game created successfully!');
      setGameDialogOpen(false);
      setGameForm({ title: '', description: '', url: '', thumbnail: '', difficulty: 'easy' });
      fetchStats();
      fetchAllGames();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create game');
    }
  };

  const handleCreateFact = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Convert Google Drive URLs for image
      const processedFactForm = {
        ...factForm,
        image_url: convertGoogleDriveUrl(factForm.image_url, false)
      };
      await axios.post(`${API}/curiofacts`, processedFactForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Curiofact published successfully!');
      setFactDialogOpen(false);
      setFactForm({ title: '', content: '', image_url: '' });
      fetchStats();
      fetchAllFacts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to publish curiofact');
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Convert Google Drive URLs for resources (PDFs, docs, etc.)
      const processedResourceForm = {
        ...resourceForm,
        url: convertGoogleDriveUrl(resourceForm.url, true) // forceDownload for documents
      };
      await axios.post(`${API}/admin/create-resource`, processedResourceForm, {
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

  const handleUpdateHeroImage = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Convert Google Drive URLs to direct image URLs
      const directImageUrl = convertToDirectImageUrl(siteSettings.hero_image_url);
      await axios.patch(`${API}/admin/site-settings`, 
        { hero_image_url: directImageUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state with the converted URL
      setSiteSettings({ ...siteSettings, hero_image_url: directImageUrl });
      toast.success('Hero image updated successfully!');
      fetchSiteSettings();
    } catch (err) {
      toast.error('Failed to update hero image');
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-10 h-10 text-orange-500" />
            <h1 className="font-heading text-5xl font-bold text-white">Admin Control Panel</h1>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white">{stats.users}</div>
                  <div className="text-sm text-slate-400">Users</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <BookOpen className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white">{stats.resources}</div>
                  <div className="text-sm text-slate-400">Resources</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Gamepad2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white">{stats.games}</div>
                  <div className="text-sm text-slate-400">Games</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white">{stats.facts}</div>
                  <div className="text-sm text-slate-400">Curiofacts</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white">{stats.matrixMembers}</div>
                  <div className="text-sm text-slate-400">Matrix</div>
                </div>
              </CardContent>
            </Card>
          </div>

        <Tabs defaultValue="pending" className="space-y-8">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="pending" data-testid="admin-tab-pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="users" data-testid="admin-tab-users">User Management</TabsTrigger>
            <TabsTrigger value="content" data-testid="admin-tab-content">Manage Content</TabsTrigger>
            <TabsTrigger value="upload" data-testid="admin-tab-upload">Upload New</TabsTrigger>
            <TabsTrigger value="settings" data-testid="admin-tab-settings">Site Settings</TabsTrigger>
            <TabsTrigger value="matrix" data-testid="admin-tab-matrix">Matrix Members</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Pending Resource Approvals</CardTitle>
                <CardDescription className="text-slate-400">Review and approve community submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingResources.length > 0 ? (
                  <div className="space-y-4">
                    {pendingResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="border border-slate-700 rounded-lg p-6 bg-slate-900/50"
                        data-testid="pending-resource-card"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-heading text-xl font-semibold text-white mb-2">
                              {resource.title}
                            </h3>
                            <p className="text-slate-400 mb-3">{resource.description}</p>
                            <div className="flex gap-4 text-sm text-slate-500 mb-2">
                              <span>Type: <span className="text-orange-400">{resource.content_type}</span></span>
                              <span>Topic: <span className="text-orange-400">{resource.topic}</span></span>
                            </div>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-orange-400 hover:text-orange-300 inline-block"
                            >
                              View Resource →
                            </a>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm\"
                              className="bg-green-600 hover:bg-green-700"
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

          {/* User Management Tab */}
          <TabsContent value="users">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Registered Users</CardTitle>
                    <CardDescription className="text-slate-400">View all users and promote to admin</CardDescription>
                  </div>
                  <Button
                    onClick={handleExportUsers}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="export-users-btn"
                  >
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Name</TableHead>
                        <TableHead className="text-slate-300">Email</TableHead>
                        <TableHead className="text-slate-300">Role</TableHead>
                        <TableHead className="text-slate-300">Joined</TableHead>
                        <TableHead className="text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((user) => (
                        <TableRow key={user.id} className="border-slate-700" data-testid="user-row">
                          <TableCell className="text-white font-medium">{user.name}</TableCell>
                          <TableCell className="text-slate-400">{user.email}</TableCell>
                          <TableCell>
                            <Badge className={user.role === 'admin' ? 'bg-orange-500' : 'bg-slate-600'}>
                              {user.role === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {user.role !== 'admin' && (
                              <Button
                                size="sm"
                                onClick={() => handlePromoteToAdmin(user.id)}
                                className="bg-orange-600 hover:bg-orange-700"
                                data-testid="promote-admin-btn"
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                Promote
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Content Tab */}
          <TabsContent value="content" className="space-y-6">{/* Existing Resources */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Manage Resources</CardTitle>
                <CardDescription className="text-slate-400">View and delete approved resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allResources.map((resource) => (
                    <div key={resource.id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg" data-testid="resource-manage-card">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className="bg-slate-600">{resource.content_type}</Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteResource(resource.id)}
                          data-testid="delete-resource-btn"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <h4 className="font-semibold text-white text-sm mb-1">{resource.title}</h4>
                      <p className="text-xs text-slate-400 mb-2 line-clamp-2">{resource.description}</p>
                      <p className="text-xs text-slate-500">{resource.topic}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Existing Games */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Manage Games</CardTitle>
                <CardDescription className="text-slate-400">View and delete games</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allGames.map((game) => (
                    <div key={game.id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg" data-testid="game-manage-card">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={game.difficulty === 'easy' ? 'bg-green-600' : game.difficulty === 'medium' ? 'bg-orange-600' : 'bg-red-600'}>
                          {game.difficulty}
                        </Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteGame(game.id)}
                          data-testid="delete-game-btn"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <h4 className="font-semibold text-white text-sm mb-1">{game.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{game.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Existing Curiofacts */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Manage Curiofacts</CardTitle>
                <CardDescription className="text-slate-400">View and delete curiofacts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allFacts.map((fact) => (
                    <div key={fact.id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg" data-testid="fact-manage-card">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-2">{fact.title}</h4>
                          <p className="text-sm text-slate-400 line-clamp-3">{fact.content}</p>
                          <p className="text-xs text-slate-500 mt-2">{new Date(fact.published_at).toLocaleDateString()}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteFact(fact.id)}
                          data-testid="delete-fact-btn"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload New Content Tab */}
          <TabsContent value="upload" className="space-y-6">
            {/* Add New Game */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-orange-400" />
                  Add New Game
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Add a new math game to the Funamatics section
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateGame} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Game Title *</Label>
                      <Input
                        value={gameForm.title}
                        onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="e.g., Math Puzzle Challenge"
                        required
                        data-testid="game-title-input"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Difficulty *</Label>
                      <Select value={gameForm.difficulty} onValueChange={(value) => setGameForm({ ...gameForm, difficulty: value })}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Description *</Label>
                    <Textarea
                      value={gameForm.description}
                      onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="Describe what makes this game fun and educational..."
                      rows={3}
                      required
                      data-testid="game-description-input"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Game URL *</Label>
                      <Input
                        type="url"
                        value={gameForm.url}
                        onChange={(e) => setGameForm({ ...gameForm, url: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="https://example.com/game"
                        required
                        data-testid="game-url-input"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Thumbnail URL <span className="text-orange-400 text-xs">(Google Drive supported)</span></Label>
                      <Input
                        type="url"
                        value={gameForm.thumbnail}
                        onChange={(e) => setGameForm({ ...gameForm, thumbnail: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="https://drive.google.com/file/d/... or direct image URL"
                        data-testid="game-thumbnail-input"
                      />
                    </div>
                  </div>
                  {gameForm.thumbnail && (
                    <div>
                      <Label className="text-slate-300 mb-2 block">Thumbnail Preview:</Label>
                      <img src={convertGoogleDriveUrl(gameForm.thumbnail)} alt="Preview" className="max-w-xs h-32 object-cover rounded-lg border border-slate-700" onError={(e) => e.target.style.display='none'} />
                    </div>
                  )}
                  <Button type="submit" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" data-testid="submit-game-btn">
                    <Plus className="w-4 h-4 mr-2" /> Add Game
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Add New Curiofact */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  Add New Curiofact
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Share an interesting mathematical fact with the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateFact} className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Fact Title *</Label>
                    <Input
                      value={factForm.title}
                      onChange={(e) => setFactForm({ ...factForm, title: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="e.g., The Mystery of Pi"
                      required
                      data-testid="fact-title-input"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Content *</Label>
                    <Textarea
                      value={factForm.content}
                      onChange={(e) => setFactForm({ ...factForm, content: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="Write your fascinating math fact here..."
                      rows={4}
                      required
                      data-testid="fact-content-input"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Image URL <span className="text-orange-400 text-xs">(Google Drive supported)</span></Label>
                    <Input
                      type="url"
                      value={factForm.image_url}
                      onChange={(e) => setFactForm({ ...factForm, image_url: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="https://drive.google.com/file/d/... or direct image URL"
                      data-testid="fact-image-input"
                    />
                  </div>
                  {factForm.image_url && (
                    <div>
                      <Label className="text-slate-300 mb-2 block">Image Preview:</Label>
                      <img src={convertGoogleDriveUrl(factForm.image_url)} alt="Preview" className="max-w-xs h-32 object-cover rounded-lg border border-slate-700" onError={(e) => e.target.style.display='none'} />
                    </div>
                  )}
                  <Button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600" data-testid="submit-fact-btn">
                    <Plus className="w-4 h-4 mr-2" /> Publish Curiofact
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Add New Resource */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-400" />
                  Add New Resource
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Add educational resources directly (auto-approved)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateResource} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Resource Title *</Label>
                      <Input
                        value={resourceForm.title}
                        onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="e.g., Calculus Fundamentals"
                        required
                        data-testid="resource-title-input"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Topic *</Label>
                      <Input
                        value={resourceForm.topic}
                        onChange={(e) => setResourceForm({ ...resourceForm, topic: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="e.g., Calculus, Algebra, Geometry"
                        required
                        data-testid="resource-topic-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Description *</Label>
                    <Textarea
                      value={resourceForm.description}
                      onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="Describe what this resource covers..."
                      rows={3}
                      required
                      data-testid="resource-description-input"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Content Type *</Label>
                      <Select value={resourceForm.content_type} onValueChange={(value) => setResourceForm({ ...resourceForm, content_type: value })}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notes">Notes</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="playlist">Playlist</SelectItem>
                          <SelectItem value="book">Book</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Resource URL * <span className="text-orange-400 text-xs">(Google Drive PDFs supported)</span></Label>
                      <Input
                        type="url"
                        value={resourceForm.url}
                        onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="https://drive.google.com/file/d/... or direct URL"
                        required
                        data-testid="resource-url-input"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    💡 Tip: For Google Drive files, make sure sharing is set to &quot;Anyone with the link can view&quot;
                  </p>
                  <Button type="submit" className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600" data-testid="submit-resource-btn">
                    <Plus className="w-4 h-4 mr-2" /> Add Resource
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Site Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Site Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Customize your website appearance and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateHeroImage} className="space-y-6">
                  <div>
                    <Label htmlFor="hero-image" className="text-slate-300 text-lg font-semibold mb-2 block">
                      Home Page Hero Image
                    </Label>
                    <p className="text-sm text-slate-400 mb-4">
                      Upload your image to an image hosting service and paste the URL below. <span className="text-orange-400">Google Drive links are automatically converted!</span>
                    </p>
                    <Input
                      id="hero-image"
                      type="url"
                      value={siteSettings.hero_image_url}
                      onChange={(e) => setSiteSettings({ ...siteSettings, hero_image_url: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view or direct image URL"
                      data-testid="hero-image-input"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      💡 Tip: For best results, use an image with dimensions around 800x600 pixels
                    </p>
                  </div>

                  {siteSettings.hero_image_url && (
                    <div>
                      <Label className="text-slate-300 mb-2 block">Preview:</Label>
                      <div className="border-2 border-slate-700 rounded-lg p-4 bg-slate-900">
                        <img
                          src={siteSettings.hero_image_url}
                          alt="Hero preview"
                          className="max-w-md h-auto rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                      data-testid="save-hero-image-btn"
                    >
                      Save Changes
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => fetchSiteSettings()}
                      className="border-slate-700 hover:bg-slate-800"
                    >
                      Reset
                    </Button>
                  </div>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-700">
                  <h3 className="text-white font-semibold text-lg mb-4">How to Upload Your Logo/Image:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-slate-400 text-sm">
                    <li>Upload your image to a free hosting service like:
                      <ul className="list-disc list-inside ml-6 mt-1 text-slate-500">
                        <li><a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">Imgur.com</a> (recommended)</li>
                        <li><a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">Cloudinary.com</a></li>
                        <li>Google Drive (set to public and use direct link)</li>
                      </ul>
                    </li>
                    <li>Copy the direct image URL (should end with .jpg, .png, .webp, etc.)</li>
                    <li>Paste the URL in the field above</li>
                    <li>Preview the image and click "Save Changes"</li>
                    <li>Visit your homepage to see the updated image</li>
                  </ol>
                </div>

                {/* Password Reset Tokens Section */}
                {resetTokens.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-slate-700">
                    <h3 className="text-white font-semibold text-lg mb-4">Recent Password Reset Requests</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Users who requested password reset. Share the reset link with them manually.
                    </p>
                    <div className="space-y-3">
                      {resetTokens.map((tokenData) => (
                        <div key={tokenData.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-white font-medium">{tokenData.email}</p>
                              <p className="text-xs text-slate-500">
                                Requested: {new Date(tokenData.created_at).toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-500">
                                Expires: {new Date(tokenData.expires_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-slate-500 mb-1">Reset Link:</p>
                            <code className="text-xs text-orange-400 break-all block bg-slate-950 p-2 rounded">
                              {window.location.origin}/reset-password?token={tokenData.token}
                            </code>
                            <Button
                              size="sm"
                              className="mt-2 bg-slate-700 hover:bg-slate-600"
                              onClick={() => {
                                const link = `${window.location.origin}/reset-password?token=${tokenData.token}`;
                                navigator.clipboard.writeText(link);
                                toast.success('Reset link copied!');
                              }}
                            >
                              Copy Link
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matrix Members Tab */}
          <TabsContent value="matrix">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Matrix Community Members</CardTitle>
                    <CardDescription className="text-slate-400">View all community registrations</CardDescription>
                  </div>
                  <Button
                    onClick={handleExportMatrix}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="export-matrix-btn"
                  >
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Name</TableHead>
                        <TableHead className="text-slate-300">Email</TableHead>
                        <TableHead className="text-slate-300">College</TableHead>
                        <TableHead className="text-slate-300">Interests</TableHead>
                        <TableHead className="text-slate-300">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matrixMembers.map((member) => (
                        <TableRow key={member.id} className="border-slate-700" data-testid="matrix-member-row">
                          <TableCell className="text-white font-medium">{member.name}</TableCell>
                          <TableCell className="text-slate-400">{member.email}</TableCell>
                          <TableCell className="text-slate-400">{member.college}</TableCell>
                          <TableCell className="text-slate-400 max-w-xs truncate">{member.interests}</TableCell>
                          <TableCell className="text-slate-400">
                            {new Date(member.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
