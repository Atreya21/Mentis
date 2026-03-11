import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/App';
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
import { Check, X, Plus, Shield, Users, BookOpen, Sparkles, Gamepad2, Crown, Trash2, ShieldOff, Info, Play, Save, Edit, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Import refactored admin components
import {
  PendingApprovalsTab,
  UserManagementTab,
  PendingVEXTab,
  PendingCuriofactsTab,
  UserReportsTab,
  AdminStatsOverview,
  convertGoogleDriveUrl,
  convertToDirectImageUrl
} from '@/components/admin';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [pendingResources, setPendingResources] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [allGames, setAllGames] = useState([]);
  const [allFacts, setAllFacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [matrixMembers, setMatrixMembers] = useState([]);
  const [resetTokens, setResetTokens] = useState([]);
  const [pendingReels, setPendingReels] = useState([]);
  const [pendingCuriofacts, setPendingCuriofacts] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ hero_image_url: '' });
  const [aboutContent, setAboutContent] = useState({
    tagline: '',
    community_info: '',
    foundation_info: '',
    vision: '',
    mission: '',
    values: '',
    instructions: '',
    logo_url: ''
  });
  const [tutorials, setTutorials] = useState([]);
  const [tutorialForm, setTutorialForm] = useState({ title: '', description: '', video_url: '', order: 0 });
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', order: 0 });
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [editingMatrixMember, setEditingMatrixMember] = useState(null);
  const [matrixEditDialogOpen, setMatrixEditDialogOpen] = useState(false);
  const [matrixEditForm, setMatrixEditForm] = useState({ name: '', email: '', college: '', interests: '' });
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
    fetchPendingReels();
    fetchPendingCuriofacts();
    fetchUserReports();
    fetchAboutContent();
    fetchTutorials();
    fetchFaqs();
  }, []);

  const fetchPendingCuriofacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/curiofacts/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingCuriofacts(res.data);
    } catch (err) {
      console.error('Failed to fetch pending curiofacts');
    }
  };

  const handleCuriofactApproval = async (submissionId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/admin/curiofacts/${submissionId}?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Curiofact ${status}`);
      fetchPendingCuriofacts();
      fetchAllFacts();
    } catch (err) {
      toast.error('Failed to update curiofact status');
    }
  };

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

  const fetchPendingReels = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/reels/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingReels(res.data);
    } catch (err) {
      console.error('Failed to fetch pending reels');
    }
  };

  const fetchUserReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserReports(res.data);
    } catch (err) {
      console.error('Failed to fetch user reports');
    }
  };

  const handleReelApproval = async (reelId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/admin/reels/${reelId}?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Reel ${status}`);
      fetchPendingReels();
    } catch (err) {
      toast.error('Failed to update reel status');
    }
  };

  const handleDeleteReel = async (reelId) => {
    if (!window.confirm('Are you sure you want to delete this reel?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/reels/${reelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Reel deleted');
      fetchPendingReels();
    } catch (err) {
      toast.error('Failed to delete reel');
    }
  };

  const handleReportStatus = async (reportId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/admin/reports/${reportId}?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Report marked as ${status}`);
      fetchUserReports();
    } catch (err) {
      toast.error('Failed to update report status');
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

  const fetchAboutContent = async () => {
    try {
      const res = await axios.get(`${API}/about-us`);
      if (res.data) {
        setAboutContent({
          tagline: res.data.tagline || '',
          community_info: res.data.community_info || '',
          foundation_info: res.data.foundation_info || '',
          vision: res.data.vision || '',
          mission: res.data.mission || '',
          values: res.data.values || '',
          instructions: res.data.instructions || '',
          logo_url: res.data.logo_url || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch about content');
    }
  };

  const fetchTutorials = async () => {
    try {
      const res = await axios.get(`${API}/tutorials`);
      setTutorials(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tutorials');
    }
  };

  const handleSaveAboutContent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/master-admin/about-us`, aboutContent, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('About Us content updated successfully!');
      fetchAboutContent();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update About Us content');
    }
  };

  const handleAddTutorial = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/master-admin/tutorials`, tutorialForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Tutorial added successfully!');
      setTutorialDialogOpen(false);
      setTutorialForm({ title: '', description: '', video_url: '', order: 0 });
      fetchTutorials();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add tutorial');
    }
  };

  const handleDeleteTutorial = async (tutorialId) => {
    if (!confirm('Are you sure you want to delete this tutorial?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/master-admin/tutorials/${tutorialId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Tutorial deleted successfully!');
      fetchTutorials();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete tutorial');
    }
  };

  // FAQ Functions
  const fetchFaqs = async () => {
    try {
      const res = await axios.get(`${API}/faqs`);
      setFaqs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch FAQs');
    }
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/master-admin/faqs`, faqForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('FAQ added successfully!');
      setFaqDialogOpen(false);
      setFaqForm({ question: '', answer: '', order: 0 });
      fetchFaqs();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add FAQ');
    }
  };

  const handleUpdateFaq = async (e) => {
    e.preventDefault();
    if (!editingFaq) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/master-admin/faqs/${editingFaq.id}`, faqForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('FAQ updated successfully!');
      setEditingFaq(null);
      setFaqForm({ question: '', answer: '', order: 0 });
      fetchFaqs();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update FAQ');
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/master-admin/faqs/${faqId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('FAQ deleted successfully!');
      fetchFaqs();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete FAQ');
    }
  };

  const openEditFaq = (faq) => {
    setEditingFaq(faq);
    setFaqForm({ question: faq.question, answer: faq.answer, order: faq.order || 0 });
  };

  // Matrix Member Edit Functions (Master Admin)
  const openEditMatrixMember = (member) => {
    setEditingMatrixMember(member);
    setMatrixEditForm({
      name: member.name,
      email: member.email,
      college: member.college,
      interests: member.interests
    });
    setMatrixEditDialogOpen(true);
  };

  const handleUpdateMatrixMember = async (e) => {
    e.preventDefault();
    if (!editingMatrixMember) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/master-admin/matrix-members/${editingMatrixMember.id}`, matrixEditForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Matrix member updated successfully!');
      setMatrixEditDialogOpen(false);
      setEditingMatrixMember(null);
      setMatrixEditForm({ name: '', email: '', college: '', interests: '' });
      fetchMatrixMembers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update Matrix member');
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

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/delete-user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchAllUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleDeleteMatrixMember = async (memberId, memberEmail) => {
    if (!window.confirm(`Are you sure you want to remove "${memberEmail}" from Matrix?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/delete-matrix-member/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Matrix member removed successfully');
      fetchMatrixMembers();
      fetchStats();
    } catch (err) {
      toast.error('Failed to remove matrix member');
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

  const handleDemoteAdmin = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to demote ${userEmail} from admin?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/master-admin/demote/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${userEmail} has been demoted to regular user`);
      fetchAllUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to demote admin');
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
          <AdminStatsOverview stats={stats} />

        <Tabs defaultValue="pending" className="space-y-8">
          <TabsList className="bg-slate-800 border border-slate-700 h-auto flex flex-wrap gap-1 p-2 justify-start w-full">
            <TabsTrigger value="pending" data-testid="admin-tab-pending" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap">Pending Approvals</TabsTrigger>
            <TabsTrigger value="users" data-testid="admin-tab-users" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap">User Management</TabsTrigger>
            <TabsTrigger value="content" data-testid="admin-tab-content" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap">Manage Content</TabsTrigger>
            <TabsTrigger value="upload" data-testid="admin-tab-upload" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap">Upload New</TabsTrigger>
            <TabsTrigger value="reels" data-testid="admin-tab-reels" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap">Pending VEX</TabsTrigger>
            <TabsTrigger value="curiofacts-pending" data-testid="admin-tab-curiofacts" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap">Pending Curiofacts</TabsTrigger>
            <TabsTrigger value="reports" data-testid="admin-tab-reports" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap">User Reports</TabsTrigger>
            <TabsTrigger value="settings" data-testid="admin-tab-settings" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap">Site Settings</TabsTrigger>
            {currentUser?.role === 'master_admin' && (
              <TabsTrigger value="about-us" data-testid="admin-tab-about-us" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap">About Us</TabsTrigger>
            )}
            <TabsTrigger value="matrix" data-testid="admin-tab-matrix" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 whitespace-nowrap">Matrix Members</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <PendingApprovalsTab 
              pendingResources={pendingResources} 
              handleApproval={handleApproval} 
            />
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <UserManagementTab 
              allUsers={allUsers}
              currentUser={currentUser}
              handleExportUsers={handleExportUsers}
              handlePromoteToAdmin={handlePromoteToAdmin}
              handleDemoteAdmin={handleDemoteAdmin}
              handleDeleteUser={handleDeleteUser}
            />
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
                    <li>Preview the image and click &quot;Save Changes&quot;</li>
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

          {/* About Us Management Tab (Master Admin Only) */}
          {currentUser?.role === 'master_admin' && (
          <TabsContent value="about-us">
            <div className="space-y-6">
              {/* About Us Content Management */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Info className="w-6 h-6 text-orange-400" />
                    <div>
                      <CardTitle className="text-white">About Us Content</CardTitle>
                      <CardDescription className="text-slate-400">Manage the content displayed on the About Us page</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveAboutContent} className="space-y-6">
                    {/* Logo Image URL */}
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                      <Label htmlFor="logo_url" className="text-slate-300 text-lg font-semibold">Logo Image</Label>
                      <p className="text-sm text-slate-400 mb-3">This logo will appear in the top-left corner of all pages</p>
                      <Input
                        id="logo_url"
                        value={aboutContent.logo_url}
                        onChange={(e) => setAboutContent({ ...aboutContent, logo_url: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="https://example.com/logo.png or Google Drive link"
                        data-testid="about-logo-input"
                      />
                      {aboutContent.logo_url && (
                        <div className="mt-3 flex items-center gap-4">
                          <span className="text-sm text-slate-400">Preview:</span>
                          <img 
                            src={aboutContent.logo_url} 
                            alt="Logo Preview" 
                            className="w-12 h-12 rounded-lg object-cover border border-slate-600"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/48?text=Invalid'; }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="tagline" className="text-slate-300">Tagline</Label>
                      <Input
                        id="tagline"
                        value={aboutContent.tagline}
                        onChange={(e) => setAboutContent({ ...aboutContent, tagline: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white mt-1"
                        placeholder="Empowering the mathematics community..."
                        data-testid="about-tagline-input"
                      />
                    </div>

                    <div>
                      <Label htmlFor="community_info" className="text-slate-300">Community Information</Label>
                      <Textarea
                        id="community_info"
                        value={aboutContent.community_info}
                        onChange={(e) => setAboutContent({ ...aboutContent, community_info: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white mt-1 min-h-[150px]"
                        placeholder="Tell visitors about your community..."
                        data-testid="about-community-info-input"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="vision" className="text-slate-300">Vision</Label>
                        <Textarea
                          id="vision"
                          value={aboutContent.vision}
                          onChange={(e) => setAboutContent({ ...aboutContent, vision: e.target.value })}
                          className="bg-slate-900 border-slate-700 text-white mt-1 min-h-[100px]"
                          placeholder="Your vision statement..."
                          data-testid="about-vision-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mission" className="text-slate-300">Mission</Label>
                        <Textarea
                          id="mission"
                          value={aboutContent.mission}
                          onChange={(e) => setAboutContent({ ...aboutContent, mission: e.target.value })}
                          className="bg-slate-900 border-slate-700 text-white mt-1 min-h-[100px]"
                          placeholder="Your mission statement..."
                          data-testid="about-mission-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="values" className="text-slate-300">Values</Label>
                        <Textarea
                          id="values"
                          value={aboutContent.values}
                          onChange={(e) => setAboutContent({ ...aboutContent, values: e.target.value })}
                          className="bg-slate-900 border-slate-700 text-white mt-1 min-h-[100px]"
                          placeholder="Your core values..."
                          data-testid="about-values-input"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="foundation_info" className="text-slate-300">Foundation Information (Optional)</Label>
                      <Textarea
                        id="foundation_info"
                        value={aboutContent.foundation_info}
                        onChange={(e) => setAboutContent({ ...aboutContent, foundation_info: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white mt-1 min-h-[100px]"
                        placeholder="Additional details about your foundation..."
                        data-testid="about-foundation-input"
                      />
                    </div>

                    <div>
                      <Label htmlFor="instructions" className="text-slate-300">How to Use Instructions (Optional)</Label>
                      <Textarea
                        id="instructions"
                        value={aboutContent.instructions}
                        onChange={(e) => setAboutContent({ ...aboutContent, instructions: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white mt-1 min-h-[150px]"
                        placeholder="Custom instructions on how to use the platform (leave empty for default)"
                        data-testid="about-instructions-input"
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                        data-testid="save-about-content-btn"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save About Content
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={fetchAboutContent}
                        className="border-slate-700 hover:bg-slate-800"
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Tutorial Videos Management */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Play className="w-6 h-6 text-red-400" />
                      <div>
                        <CardTitle className="text-white">Tutorial Videos</CardTitle>
                        <CardDescription className="text-slate-400">Manage tutorial videos displayed on the About Us page</CardDescription>
                      </div>
                    </div>
                    <Dialog open={tutorialDialogOpen} onOpenChange={setTutorialDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" data-testid="add-tutorial-btn">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Tutorial
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add Tutorial Video</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddTutorial} className="space-y-4">
                          <div>
                            <Label htmlFor="tutorial-title" className="text-slate-300">Title</Label>
                            <Input
                              id="tutorial-title"
                              value={tutorialForm.title}
                              onChange={(e) => setTutorialForm({ ...tutorialForm, title: e.target.value })}
                              className="bg-slate-900 border-slate-700 text-white"
                              placeholder="Getting Started with Mentis"
                              required
                              data-testid="tutorial-title-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="tutorial-desc" className="text-slate-300">Description (Optional)</Label>
                            <Textarea
                              id="tutorial-desc"
                              value={tutorialForm.description}
                              onChange={(e) => setTutorialForm({ ...tutorialForm, description: e.target.value })}
                              className="bg-slate-900 border-slate-700 text-white"
                              placeholder="A quick guide on how to navigate..."
                              data-testid="tutorial-desc-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="tutorial-url" className="text-slate-300">YouTube Video URL</Label>
                            <Input
                              id="tutorial-url"
                              value={tutorialForm.video_url}
                              onChange={(e) => setTutorialForm({ ...tutorialForm, video_url: e.target.value })}
                              className="bg-slate-900 border-slate-700 text-white"
                              placeholder="https://www.youtube.com/watch?v=..."
                              required
                              data-testid="tutorial-url-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="tutorial-order" className="text-slate-300">Display Order</Label>
                            <Input
                              id="tutorial-order"
                              type="number"
                              value={tutorialForm.order}
                              onChange={(e) => setTutorialForm({ ...tutorialForm, order: parseInt(e.target.value) || 0 })}
                              className="bg-slate-900 border-slate-700 text-white"
                              placeholder="0"
                              data-testid="tutorial-order-input"
                            />
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                            data-testid="submit-tutorial-btn"
                          >
                            Add Tutorial
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {tutorials.length === 0 ? (
                    <div className="text-center py-12">
                      <Play className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">No tutorials added yet</p>
                      <p className="text-slate-500 text-sm mt-2">Click &quot;Add Tutorial&quot; to create your first tutorial video</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tutorials.map((tutorial) => (
                        <div key={tutorial.id} className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700 group">
                          <div className="aspect-video bg-black">
                            <iframe
                              src={`https://www.youtube.com/embed/${tutorial.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)?.[1] || ''}`}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={tutorial.title}
                            />
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-white font-medium flex-1">{tutorial.title}</h4>
                              <Badge variant="outline" className="text-slate-400 border-slate-600 ml-2">
                                #{tutorial.order || 0}
                              </Badge>
                            </div>
                            {tutorial.description && (
                              <p className="text-slate-400 text-sm line-clamp-2 mb-3">{tutorial.description}</p>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTutorial(tutorial.id)}
                              className="w-full bg-red-600/80 hover:bg-red-600"
                              data-testid="delete-tutorial-btn"
                            >
                              <Trash2 className="w-3 h-3 mr-2" />
                              Delete Tutorial
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* FAQ Management Section */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-6 h-6 text-amber-400" />
                      <div>
                        <CardTitle className="text-white">FAQ Management</CardTitle>
                        <CardDescription className="text-slate-400">Manage frequently asked questions for the About Us page</CardDescription>
                      </div>
                    </div>
                    <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="bg-amber-600 hover:bg-amber-700"
                          onClick={() => {
                            setEditingFaq(null);
                            setFaqForm({ question: '', answer: '', order: 0 });
                          }}
                          data-testid="add-faq-btn"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add FAQ
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add New FAQ</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddFaq} className="space-y-4">
                          <div>
                            <Label className="text-slate-300">Question</Label>
                            <Input
                              value={faqForm.question}
                              onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                              className="bg-slate-900 border-slate-700 text-white mt-1"
                              placeholder="Enter the question..."
                              required
                              data-testid="faq-question-input"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300">Answer</Label>
                            <Textarea
                              value={faqForm.answer}
                              onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                              className="bg-slate-900 border-slate-700 text-white mt-1 min-h-[120px]"
                              placeholder="Enter the answer..."
                              required
                              data-testid="faq-answer-input"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300">Display Order</Label>
                            <Input
                              type="number"
                              value={faqForm.order}
                              onChange={(e) => setFaqForm({ ...faqForm, order: parseInt(e.target.value) || 0 })}
                              className="bg-slate-900 border-slate-700 text-white mt-1"
                              placeholder="0"
                              data-testid="faq-order-input"
                            />
                          </div>
                          <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                            Add FAQ
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {faqs.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
                      <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No FAQs added yet. Add your first FAQ!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {faqs.map((faq, index) => (
                        <div key={faq.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                          {editingFaq?.id === faq.id ? (
                            <form onSubmit={handleUpdateFaq} className="space-y-3">
                              <Input
                                value={faqForm.question}
                                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                                className="bg-slate-800 border-slate-600 text-white"
                                placeholder="Question"
                                required
                              />
                              <Textarea
                                value={faqForm.answer}
                                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                                className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
                                placeholder="Answer"
                                required
                              />
                              <Input
                                type="number"
                                value={faqForm.order}
                                onChange={(e) => setFaqForm({ ...faqForm, order: parseInt(e.target.value) || 0 })}
                                className="bg-slate-800 border-slate-600 text-white w-24"
                                placeholder="Order"
                              />
                              <div className="flex gap-2">
                                <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                                  <Save className="w-3 h-3 mr-2" />
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingFaq(null);
                                    setFaqForm({ question: '', answer: '', order: 0 });
                                  }}
                                  className="border-slate-600"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-amber-400 border-amber-500/50 text-xs">
                                      #{faq.order || index + 1}
                                    </Badge>
                                  </div>
                                  <h4 className="text-white font-semibold">{faq.question}</h4>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditFaq(faq)}
                                    className="border-slate-600 hover:bg-slate-700"
                                    data-testid={`edit-faq-${index}`}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteFaq(faq.id)}
                                    className="bg-red-600/80 hover:bg-red-600"
                                    data-testid={`delete-faq-${index}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-slate-400 text-sm whitespace-pre-wrap">{faq.answer}</p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          )}

          {/* Matrix Members Tab */}
          <TabsContent value="matrix">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Matrix Community Members</CardTitle>
                    <CardDescription className="text-slate-400">View and manage community registrations</CardDescription>
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
                        <TableHead className="text-slate-300">Organization</TableHead>
                        <TableHead className="text-slate-300">Interests</TableHead>
                        <TableHead className="text-slate-300">Joined</TableHead>
                        <TableHead className="text-slate-300">Actions</TableHead>
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
                          <TableCell>
                            <div className="flex gap-2">
                              {currentUser?.role === 'master_admin' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditMatrixMember(member)}
                                  className="border-slate-600 hover:bg-slate-700"
                                  data-testid="edit-matrix-member-btn"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteMatrixMember(member.id, member.email)}
                                className="bg-red-600 hover:bg-red-700"
                                data-testid="delete-matrix-member-btn"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending VEX Tab */}
          <TabsContent value="reels">
            <PendingVEXTab 
              pendingReels={pendingReels}
              handleReelApproval={handleReelApproval}
            />
          </TabsContent>

          {/* Pending Curiofacts Tab */}
          <TabsContent value="curiofacts-pending">
            <PendingCuriofactsTab 
              pendingCuriofacts={pendingCuriofacts}
              handleCuriofactApproval={handleCuriofactApproval}
            />
          </TabsContent>

          {/* User Reports Tab */}
          <TabsContent value="reports">
            <UserReportsTab 
              userReports={userReports}
              handleReportStatus={handleReportStatus}
            />
          </TabsContent>
        </Tabs>

        {/* Matrix Member Edit Dialog */}
        <Dialog open={matrixEditDialogOpen} onOpenChange={setMatrixEditDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Matrix Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateMatrixMember} className="space-y-4">
              <div>
                <Label className="text-slate-300">Name</Label>
                <Input
                  value={matrixEditForm.name}
                  onChange={(e) => setMatrixEditForm({ ...matrixEditForm, name: e.target.value.toUpperCase() })}
                  className="bg-slate-900 border-slate-700 text-white mt-1 uppercase"
                  placeholder="Member name"
                  required
                  data-testid="matrix-edit-name"
                />
              </div>
              <div>
                <Label className="text-slate-300">Email</Label>
                <Input
                  type="email"
                  value={matrixEditForm.email}
                  onChange={(e) => setMatrixEditForm({ ...matrixEditForm, email: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white mt-1"
                  placeholder="member@email.com"
                  required
                  data-testid="matrix-edit-email"
                />
              </div>
              <div>
                <Label className="text-slate-300">Organization</Label>
                <Input
                  value={matrixEditForm.college}
                  onChange={(e) => setMatrixEditForm({ ...matrixEditForm, college: e.target.value.toUpperCase() })}
                  className="bg-slate-900 border-slate-700 text-white mt-1 uppercase"
                  placeholder="Organization name"
                  required
                  data-testid="matrix-edit-college"
                />
              </div>
              <div>
                <Label className="text-slate-300">Interests</Label>
                <Textarea
                  value={matrixEditForm.interests}
                  onChange={(e) => setMatrixEditForm({ ...matrixEditForm, interests: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white mt-1 min-h-[100px]"
                  placeholder="Mathematical interests..."
                  required
                  data-testid="matrix-edit-interests"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMatrixEditDialogOpen(false)}
                  className="border-slate-600 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
