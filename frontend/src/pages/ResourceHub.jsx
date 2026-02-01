import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { BookOpen, Plus, Filter, Search, User } from 'lucide-react';

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
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'notes',
    url: '',
    topic: ''
  });

  // Filter resources based on search query
  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return resources;
    const query = searchQuery.toLowerCase();
    return resources.filter(r => 
      r.title?.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query) ||
      r.topic?.toLowerCase().includes(query) ||
      r.uploader_name?.toLowerCase().includes(query)
    );
  }, [resources, searchQuery]);

  useEffect(() => {
    fetchResources();
  }, [filter]);

  const fetchResources = async () => {
    try {
      const res = await axios.get(`${API}/resources?status=${filter}`);
      setResources(res.data);
    } catch (err) {
      toast.error('Failed to fetch resources');
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
      setFormData({ title: '', description: '', content_type: 'notes', url: '', topic: '' });
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

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search resources by title, topic, or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              data-testid="resource-search-input"
            />
          </div>
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-8">
          <TabsList>
            <TabsTrigger value="approved" data-testid="filter-approved">Approved</TabsTrigger>
            {user && <TabsTrigger value="pending" data-testid="filter-pending">Pending</TabsTrigger>}
          </TabsList>
        </Tabs>

        <TooltipProvider>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <motion.div
                key={resource.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl hover-lift card-hover shine-effect group"
                data-testid="resource-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-orange-400" />
                  </div>
                  <span className="text-xs font-medium px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">
                    {resource.content_type}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-semibold text-white mb-2">
                  {resource.title}
                </h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2 cursor-help">
                      {resource.description}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm bg-slate-900 border-slate-700 text-slate-200 p-3">
                    <p className="text-sm">{resource.description}</p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-3 h-3 text-slate-500" />
                  <span className="text-xs text-slate-500">Uploaded by {resource.uploader_name || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">{resource.topic}</span>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors"
                    data-testid="resource-view-link"
                  >
                    View →
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </TooltipProvider>

        {filteredResources.length === 0 && searchQuery && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No resources found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceHub;