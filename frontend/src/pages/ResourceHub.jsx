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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { BookOpen, Plus, Filter, Search, User, Heart, MessageCircle, Send, X } from 'lucide-react';

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
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState({});
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
      const res = await axios.get(`${API}/resources?status=${filter}`);
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
                    className="relative z-10 text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-orange-500/10"
                    data-testid="resource-view-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(resource.url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    View →
                  </a>
                </div>
                
                {/* Like and Comment Section */}
                {user && (
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(resource.id)}
                      className={`flex items-center gap-2 ${likes[resource.id]?.userLiked ? 'text-pink-500' : 'text-slate-400'} hover:text-pink-400`}
                      data-testid="like-resource-btn"
                    >
                      <Heart className={`w-4 h-4 ${likes[resource.id]?.userLiked ? 'fill-current' : ''}`} />
                      <span>{likes[resource.id]?.count || 0}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openComments(resource)}
                      className="flex items-center gap-2 text-slate-400 hover:text-orange-400"
                      data-testid="comment-resource-btn"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Comments</span>
                    </Button>
                  </div>
                )}
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
      </div>
    </div>
  );
};

export default ResourceHub;