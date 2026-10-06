import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { BookOpen, Plus, Filter, Search, User, Heart, MessageCircle, Send, X, Bookmark, Share2 } from 'lucide-react';
import ShareToChat from '@/components/ShareToChat';
import Card3D from '@/components/3d/Card3D';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Utility function to convert Google Drive URLs to direct/viewable URLs
const convertGoogleDriveUrl = (url, forceDownload = false) => {
  if (!url) return url;
  
  let fileId = null;
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/thumbnail\?.*id=([a-zA-Z0-9_-]+)/,
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      fileId = match[1];
      break;
    }
  }
  
  if (fileId) {
    if (forceDownload) {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    } else {
      // Use lh3.googleusercontent.com for better image embedding
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  
  return url;
};

const ResourceHub = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState({});
  const [savedResources, setSavedResources] = useState([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [viewResourceModalOpen, setViewResourceModalOpen] = useState(false);
  const [viewResource, setViewResource] = useState(null);
  const [shareToChatOpen, setShareToChatOpen] = useState(false);
  const [shareContent, setShareContent] = useState(null);
  const [filterOptions, setFilterOptions] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({
    content_type: '',
    education_level: [],
    math_domain: [],
    difficulty: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'notes',
    url: '',
    topic: '',
    education_level: [],
    math_domain: [],
    difficulty: '',
    language: 'english',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  // Filter resources based on saved filter only (server handles other filters)
  const filteredResources = useMemo(() => {
    let filtered = resources;
    
    // Filter by saved only
    if (showSavedOnly) {
      filtered = filtered.filter(r => savedResources.includes(r.id));
    }
    
    return filtered;
  }, [resources, showSavedOnly, savedResources]);

  useEffect(() => {
    fetchResources();
    fetchSavedResources();
    fetchFilterOptions();
  }, [filter]);

  // Refetch when filters change
  useEffect(() => {
    fetchResources();
  }, [selectedFilters, searchQuery]);

  const fetchFilterOptions = async () => {
    try {
      const res = await axios.get(`${API}/filter-options`);
      setFilterOptions(res.data);
    } catch (err) {
      console.error('Failed to fetch filter options');
    }
  };

  // Handle deep link - check for view parameter
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && resources.length > 0) {
      const resource = resources.find(r => r.id === viewId);
      if (resource) {
        setViewResource(resource);
        setViewResourceModalOpen(true);
        // Clear the URL parameter
        setSearchParams({});
      } else {
        // Try to fetch the resource directly
        fetchSingleResource(viewId);
      }
    }
  }, [searchParams, resources]);

  const fetchSingleResource = async (resourceId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/resources/${resourceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setViewResource(res.data);
      setViewResourceModalOpen(true);
      setSearchParams({});
    } catch (err) {
      toast.error('Resource not found or not available');
      setSearchParams({});
    }
  };

  // Fetch saved resources
  const fetchSavedResources = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API}/saved-resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedResources(res.data.map(r => r.resource_id));
    } catch (err) {
      console.error('Failed to fetch saved resources');
    }
  };

  // Save/Unsave resource
  const handleSaveResource = async (resourceId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/resources/${resourceId}/save`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.saved) {
        setSavedResources([...savedResources, resourceId]);
        toast.success('Resource saved!');
      } else {
        setSavedResources(savedResources.filter(id => id !== resourceId));
        toast.success('Resource removed from saved');
      }
    } catch (err) {
      toast.error('Failed to save resource');
    }
  };

  // Share resource with promotional message
  const handleShareResource = (resource) => {
    const shareUrl = `${window.location.origin}/resources?view=${resource.id}`;
    const shareText = `📚 Check out "${resource.title}" on Mentis!\n\n${resource.description?.substring(0, 100)}...\n\n🔗 ${shareUrl}\n\n━━━━━━━━━━━━━━━━━\n✨ MENTIS - Where Minds Meet Mathematics ✨\n🎯 Join the premier platform for mathematics enthusiasts!\n📖 Resources • 🎮 Games • 🎬 VEX • 💬 Connect\n🌐 ${window.location.origin}\n━━━━━━━━━━━━━━━━━`;
    
    if (navigator.share) {
      navigator.share({
        title: `${resource.title} - Mentis`,
        text: shareText,
        url: shareUrl
      }).catch(() => {
        // Fallback to copy
        navigator.clipboard.writeText(shareText);
        toast.success('Link copied to clipboard with promotional message!');
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Link copied to clipboard with promotional message!');
    }
  };

  const handleShareToChat = (resource) => {
    const shareUrl = `${window.location.origin}/resources?view=${resource.id}`;
    setShareContent({
      type: 'Resource',
      title: resource.title,
      url: shareUrl,
      id: resource.id
    });
    setShareToChatOpen(true);
  };

  // Fetch likes for all resources
  const fetchLikes = async (resourceList) => {
    const token = localStorage.getItem('token');
    const likesData = {};
    
    for (const resource of resourceList) {
      try {
        const res = await axios.get(`${API}/resources/${resource.id}/likes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        likesData[resource.id] = {
          count: res.data.count,
          likes: res.data.likes,
          userLiked: res.data.likes.some(l => l.user_id === user?.id)
        };
      } catch (err) {
        likesData[resource.id] = { count: 0, likes: [], userLiked: false };
      }
    }
    setLikes(likesData);
  };

  const fetchResources = async () => {
    try {
      const params = new URLSearchParams();
      params.append('status', filter);
      
      // Add search query
      if (searchQuery) params.append('search', searchQuery);
      
      // Add filter parameters
      if (selectedFilters.content_type) params.append('content_type', selectedFilters.content_type);
      if (selectedFilters.education_level?.length) params.append('education_level', selectedFilters.education_level.join(','));
      if (selectedFilters.math_domain?.length) params.append('math_domain', selectedFilters.math_domain.join(','));
      if (selectedFilters.difficulty) params.append('difficulty', selectedFilters.difficulty);
      
      const res = await axios.get(`${API}/resources?${params.toString()}`);
      setResources(res.data);
      if (user) {
        fetchLikes(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch resources');
    }
  };

  const handleLike = async (resourceId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/resources/${resourceId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setLikes(prev => ({
        ...prev,
        [resourceId]: {
          ...prev[resourceId],
          count: res.data.liked ? (prev[resourceId]?.count || 0) + 1 : Math.max(0, (prev[resourceId]?.count || 0) - 1),
          userLiked: res.data.liked
        }
      }));
    } catch (err) {
      toast.error('Failed to like resource');
    }
  };

  const openComments = async (resource) => {
    setSelectedResource(resource);
    setCommentDialogOpen(true);
    
    try {
      const res = await axios.get(`${API}/resources/${resource.id}/comments`);
      setComments(res.data);
    } catch (err) {
      toast.error('Failed to load comments');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/resources/${selectedResource.id}/comment`, 
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success('Comment added');
      setNewComment('');
      
      // Refresh comments
      const res = await axios.get(`${API}/resources/${selectedResource.id}/comments`);
      setComments(res.data);
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Comment deleted');
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit resources');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // Convert Google Drive URLs for resources
      const processedFormData = {
        ...formData,
        url: convertGoogleDriveUrl(formData.url, true)
      };
      await axios.post(`${API}/resources`, processedFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Resource submitted for approval!');
      setDialogOpen(false);
      setFormData({ 
        title: '', 
        description: '', 
        content_type: 'notes', 
        url: '', 
        topic: '',
        education_level: [],
        math_domain: [],
        difficulty: '',
        language: 'english',
        tags: []
      });
      setTagInput('');
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit resource');
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-white mb-4">
              Resource Hub
            </h1>
            <p className="text-lg text-slate-400">
              Curated mathematical resources from our community
            </p>
          </motion.div>

          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shine-effect" data-testid="submit-resource-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl text-white">Submit a Resource</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title" className="text-slate-300">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="mt-2 bg-slate-900 border-slate-700 text-white"
                      data-testid="resource-title-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-slate-300">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      className="mt-2 bg-slate-900 border-slate-700 text-white"
                      rows={3}
                      data-testid="resource-description-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="content_type" className="text-slate-300">Type</Label>
                      <Select
                        value={formData.content_type}
                        onValueChange={(value) => setFormData({ ...formData, content_type: value })}
                      >
                        <SelectTrigger className="mt-2 bg-slate-900 border-slate-700 text-white" data-testid="resource-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          <SelectItem value="notes">Notes</SelectItem>
                          <SelectItem value="playlist">Playlist</SelectItem>
                          <SelectItem value="book">Book</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="ppts">PPTs</SelectItem>
                          <SelectItem value="others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="topic" className="text-slate-300">Topic</Label>
                      <Input
                        id="topic"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        required
                        className="mt-2 bg-slate-900 border-slate-700 text-white"
                        placeholder="e.g., Calculus"
                        data-testid="resource-topic-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="url" className="text-slate-300">URL <span className="text-orange-400 text-xs">(Google Drive links supported)</span></Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      required
                      className="mt-2 bg-slate-900 border-slate-700 text-white"
                      placeholder="https://drive.google.com/file/d/... or direct URL"
                      data-testid="resource-url-input"
                    />
                    <p className="text-xs text-slate-500 mt-1">For Google Drive, set sharing to &quot;Anyone with the link&quot;</p>
                  </div>
                  <Button type="submit" className="w-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" data-testid="resource-submit-btn">
                    Submit
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search Bar and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search resources by title, topic, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="resource-search-input"
              />
            </div>
            
            {/* Content Type Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedFilters.content_type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilters({ ...selectedFilters, content_type: '' })}
                className={!selectedFilters.content_type 
                  ? "bg-orange-500 hover:bg-orange-600" 
                  : "border-slate-600 text-slate-300 hover:bg-slate-700"}
              >
                All Types
              </Button>
              {['notes', 'playlist', 'book', 'article', 'ppts', 'others'].map(type => (
                <Button
                  key={type}
                  variant={selectedFilters.content_type === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilters({ ...selectedFilters, content_type: type })}
                  className={selectedFilters.content_type === type 
                    ? "bg-orange-500 hover:bg-orange-600" 
                    : "border-slate-600 text-slate-300 hover:bg-slate-700"}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Category Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Education Level */}
            {filterOptions.education_level && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Education Level</Label>
                <div className="flex flex-wrap gap-1">
                  {filterOptions.education_level.slice(0, 5).map(opt => (
                    <Badge
                      key={opt.value}
                      className={`cursor-pointer text-xs ${
                        selectedFilters.education_level?.includes(opt.value)
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      onClick={() => {
                        const current = selectedFilters.education_level || [];
                        setSelectedFilters({
                          ...selectedFilters,
                          education_level: current.includes(opt.value)
                            ? current.filter(v => v !== opt.value)
                            : [...current, opt.value]
                        });
                      }}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Math Domain */}
            {filterOptions.math_domain && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Math Domain</Label>
                <div className="flex flex-wrap gap-1">
                  {filterOptions.math_domain.slice(0, 6).map(opt => (
                    <Badge
                      key={opt.value}
                      className={`cursor-pointer text-xs ${
                        selectedFilters.math_domain?.includes(opt.value)
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      onClick={() => {
                        const current = selectedFilters.math_domain || [];
                        setSelectedFilters({
                          ...selectedFilters,
                          math_domain: current.includes(opt.value)
                            ? current.filter(v => v !== opt.value)
                            : [...current, opt.value]
                        });
                      }}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty */}
            {filterOptions.difficulty && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Difficulty</Label>
                <div className="flex flex-wrap gap-1">
                  {filterOptions.difficulty.map(opt => (
                    <Badge
                      key={opt.value}
                      className={`cursor-pointer text-xs ${
                        selectedFilters.difficulty === opt.value
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      onClick={() => {
                        setSelectedFilters({
                          ...selectedFilters,
                          difficulty: selectedFilters.difficulty === opt.value ? '' : opt.value
                        });
                      }}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {(selectedFilters.content_type || selectedFilters.education_level?.length > 0 || selectedFilters.math_domain?.length > 0 || selectedFilters.difficulty || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFilters({ content_type: '', education_level: [], math_domain: [], difficulty: '' });
                  setSearchQuery('');
                }}
                className="text-orange-400 hover:text-orange-300 self-end"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="approved" data-testid="filter-approved">All Resources</TabsTrigger>
            </TabsList>
          </Tabs>
          {user && (
            <Button
              variant={showSavedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={showSavedOnly ? "bg-yellow-500 hover:bg-yellow-600" : "border-slate-700"}
              data-testid="saved-filter-btn"
            >
              <Bookmark className={`w-4 h-4 mr-2 ${showSavedOnly ? 'fill-current' : ''}`} />
              Saved Resources
            </Button>
          )}
        </div>

        <TooltipProvider delayDuration={100}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full"
              >
                <Card3D
                  tiltMax={8}
                  depth={18}
                  borderColor="from-slate-700/60 via-slate-600/40 to-slate-700/60"
                  className="h-full"
                  data-testid="resource-card"
                >
                  <div className="p-6 flex flex-col justify-between h-full rounded-2xl">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700/60 shadow-sm">
                          <BookOpen className="w-6 h-6 text-orange-400" />
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 bg-orange-500/15 text-orange-400 rounded-full border border-orange-500/30 uppercase tracking-wider">
                          {resource.content_type}
                        </span>
                      </div>
                      <h3 className="font-heading text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                        {resource.title}
                      </h3>
                      <div className="relative z-10" style={{ pointerEvents: 'auto' }}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p 
                              className="text-sm text-slate-400 mb-3 line-clamp-2 cursor-help hover:text-slate-300 transition-colors leading-relaxed"
                            >
                              {resource.description}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top" 
                            className="max-w-md bg-slate-800 border-slate-600 text-slate-200 p-4 shadow-xl z-[100]"
                            sideOffset={5}
                          >
                            <p className="text-sm leading-relaxed">{resource.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-500 font-medium">Uploaded by {resource.uploader_name || 'Unknown'}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">{resource.topic}</span>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative z-10 text-xs sm:text-sm text-orange-400 hover:text-orange-300 font-semibold transition-colors px-3 py-1 rounded-lg hover:bg-orange-500/10 flex items-center gap-1"
                          data-testid="resource-view-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(resource.url, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <span>Open Resource</span>
                          <span>→</span>
                        </a>
                      </div>
                      
                      {/* Like, Comment, Save, Share Section */}
                      {user && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800 relative z-20">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(resource.id); }}
                            className={`flex items-center gap-1.5 border-slate-700 hover:border-pink-500 ${likes[resource.id]?.userLiked ? 'text-pink-500 bg-pink-500/10' : 'text-slate-400'} hover:text-pink-400 hover:bg-pink-500/10 cursor-pointer`}
                            data-testid="like-resource-btn"
                          >
                            <Heart className={`w-3.5 h-3.5 ${likes[resource.id]?.userLiked ? 'fill-current' : ''}`} />
                            <span className="text-xs">{likes[resource.id]?.count || 0}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openComments(resource); }}
                            className="flex items-center gap-1.5 text-slate-400 border-slate-700 hover:text-orange-400 hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer"
                            data-testid="comment-resource-btn"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-xs">Comment</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveResource(resource.id); }}
                            className={`flex items-center gap-1.5 border-slate-700 hover:border-yellow-500 ${savedResources.includes(resource.id) ? 'text-yellow-500 bg-yellow-500/10' : 'text-slate-400'} hover:text-yellow-400 hover:bg-yellow-500/10 cursor-pointer`}
                            data-testid="save-resource-btn"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${savedResources.includes(resource.id) ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareResource(resource); }}
                            className="flex items-center gap-1.5 text-slate-400 border-slate-700 hover:text-green-400 hover:border-green-500 hover:bg-green-500/10 cursor-pointer"
                            data-testid="share-resource-btn"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareToChat(resource); }}
                            className="flex items-center gap-1.5 text-slate-400 border-slate-700 hover:text-orange-400 hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer"
                            data-testid="share-to-chat-btn"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card3D>
              </motion.div>
            ))}
          </div>
        </TooltipProvider>

        {/* Comments Dialog */}
        <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
          <DialogContent className="max-w-lg bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Comments - {selectedResource?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <ScrollArea className="h-[300px] pr-4">
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                              {comment.user_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{comment.user_name}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {(comment.user_id === user?.id || user?.role === 'admin' || user?.role === 'master_admin') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-slate-400 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400">No comments yet</p>
                  </div>
                )}
              </ScrollArea>

              {/* Add Comment */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  className="bg-slate-900 border-slate-700 text-white"
                  data-testid="comment-input"
                />
                <Button
                  onClick={handleAddComment}
                  className="bg-gradient-to-r from-orange-500 to-pink-500"
                  data-testid="submit-comment-btn"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Resource Modal (for deep links) */}
        <Dialog open={viewResourceModalOpen} onOpenChange={(open) => {
          setViewResourceModalOpen(open);
          if (!open) setViewResource(null);
        }}>
          <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl text-white">
                {viewResource?.title}
              </DialogTitle>
            </DialogHeader>
            {viewResource && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                    {viewResource.topic}
                  </span>
                  <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">
                    {viewResource.content_type}
                  </span>
                </div>
                <p className="text-slate-300 whitespace-pre-wrap">{viewResource.description}</p>
                {viewResource.uploader_name && (
                  <p className="text-slate-400 text-sm">
                    Uploaded by: <span className="text-white">{viewResource.uploader_name}</span>
                  </p>
                )}
                <div className="flex gap-3 pt-4">
                  <a 
                    href={viewResource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Open Resource
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    onClick={() => handleShareResource(viewResource)}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {filteredResources.length === 0 && searchQuery && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No resources found for &quot;{searchQuery}&quot;</p>
            <p className="text-slate-500 text-sm mt-2">Try a different search term</p>
          </div>
        )}

        {filteredResources.length === 0 && !searchQuery && resources.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No resources available yet</p>
          </div>
        )}

        {/* Share to Chat Dialog */}
        <ShareToChat
          isOpen={shareToChatOpen}
          onClose={() => setShareToChatOpen(false)}
          contentType={shareContent?.type}
          contentTitle={shareContent?.title}
          contentUrl={shareContent?.url}
          contentId={shareContent?.id}
        />
      </div>
    </div>
  );
};

export default ResourceHub;