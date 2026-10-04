import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '@/App';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  Play, Plus, Heart, MessageCircle, Share2, Send, Bookmark,
  User, Calendar, ExternalLink, Video, AlertTriangle, Search, X
} from 'lucide-react';
import ShareToChat from '@/components/ShareToChat';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReelsPage = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewReelModalOpen, setViewReelModalOpen] = useState(false);
  const [viewReel, setViewReel] = useState(null);
  const [shareToChatOpen, setShareToChatOpen] = useState(false);
  const [shareContent, setShareContent] = useState(null);
  const [savedReels, setSavedReels] = useState([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [formData, setFormData] = useState({
    video_url: '',
    caption: '',
    education_level: [],
    math_domain: [],
    difficulty: '',
    language: 'english',
    tags: []
  });
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({
    education_level: [],
    math_domain: [],
    difficulty: ''
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchReels();
    fetchSavedReels();
    fetchFilterOptions();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchReels();
  }, [selectedFilters, searchQuery]);

  const fetchFilterOptions = async () => {
    try {
      const res = await axios.get(`${API}/filter-options`);
      setFilterOptions(res.data);
    } catch (err) {
      console.error('Failed to fetch filter options');
    }
  };

  // Handle deep link
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && reels.length > 0) {
      const reel = reels.find(r => r.id === viewId);
      if (reel) {
        setViewReel(reel);
        setViewReelModalOpen(true);
        setSearchParams({});
      } else {
        fetchSingleReel(viewId);
      }
    }
  }, [searchParams, reels]);

  const fetchSingleReel = async (reelId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/reels/${reelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setViewReel(res.data);
      setViewReelModalOpen(true);
      setSearchParams({});
    } catch (err) {
      toast.error('VEX not found or not available');
      setSearchParams({});
    }
  };

  const fetchReels = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedFilters.education_level?.length) params.append('education_level', selectedFilters.education_level.join(','));
      if (selectedFilters.math_domain?.length) params.append('math_domain', selectedFilters.math_domain.join(','));
      if (selectedFilters.difficulty) params.append('difficulty', selectedFilters.difficulty);
      
      const res = await axios.get(`${API}/reels?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReels(res.data);
    } catch (err) {
      toast.error('Failed to fetch VEX');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedReels = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/saved-reels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedReels(res.data.map(s => s.reel_id));
    } catch (err) {
      console.error('Failed to fetch saved VEX');
    }
  };

  const handleSaveReel = async (reelId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/reels/${reelId}/save`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.saved) {
        setSavedReels([...savedReels, reelId]);
        toast.success('VEX saved!');
      } else {
        setSavedReels(savedReels.filter(id => id !== reelId));
        toast.success('VEX unsaved');
      }
    } catch (err) {
      toast.error('Failed to save VEX');
    }
  };

  const filteredReels = showSavedOnly 
    ? reels.filter(r => savedReels.includes(r.id))
    : reels;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/reels`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('VEX submitted for approval!');
      setDialogOpen(false);
      setFormData({ video_url: '', caption: '' });
      fetchReels();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit VEX');
    }
  };

  const handleLike = async (reelId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/reels/${reelId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state
      setReels(reels.map(r => {
        if (r.id === reelId) {
          return {
            ...r,
            user_liked: res.data.liked,
            like_count: res.data.liked ? (r.like_count || 0) + 1 : Math.max(0, (r.like_count || 0) - 1)
          };
        }
        return r;
      }));
    } catch (err) {
      toast.error('Failed to like VEX');
    }
  };

  const handleShareReel = (reel) => {
    const shareUrl = `${window.location.origin}/reels?view=${reel.id}`;
    const shareText = `🎬 Check out this educational VEX on Mentis!\n\n"${reel.caption.substring(0, 100)}..."\n\n🔗 ${shareUrl}\n\n━━━━━━━━━━━━━━━━━\n✨ MENTIS - Where Minds Meet Mathematics ✨\n🎯 Join the premier platform for mathematics enthusiasts!\n📖 Resources • 🎮 Games • 🎬 VEX • 💬 Connect\n🌐 ${window.location.origin}\n━━━━━━━━━━━━━━━━━`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Mentis VEX',
        text: shareText,
        url: shareUrl
      }).catch(() => {
        navigator.clipboard.writeText(shareText);
        toast.success('Link copied to clipboard with promotional message!');
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Link copied to clipboard with promotional message!');
    }
  };

  const handleShareToChat = (reel) => {
    const shareUrl = `${window.location.origin}/reels?view=${reel.id}`;
    setShareContent({
      type: 'Reel',
      title: reel.caption.substring(0, 50) + (reel.caption.length > 50 ? '...' : ''),
      url: shareUrl,
      id: reel.id
    });
    setShareToChatOpen(true);
  };

  const getEmbedUrl = (reel) => {
    return reel.video_url;
  };

  return (
    <TooltipProvider>
    <div className="min-h-screen pt-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-heading text-5xl md:text-6xl font-bold text-white">
                VEX
              </h1>
            </div>
            <p className="text-lg text-slate-400">
              Educational short videos from our community
            </p>
          </motion.div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                data-testid="upload-reel-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload VEX
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl text-white">Upload a Reel</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-medium">Important Note</p>
                      <p className="text-sm text-yellow-400/80 mt-1">
                        Videos must be educational and under 2 minutes. If uploading content from another creator, 
                        you must acknowledge them in the caption.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="video_url" className="text-slate-300">
                    Video URL <span className="text-pink-400 text-xs">(YouTube, Instagram, Google Drive supported)</span>
                  </Label>
                  <Input
                    id="video_url"
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    required
                    className="mt-2 bg-slate-900 border-slate-700 text-white"
                    placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..."
                    data-testid="reel-url-input"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Supported: YouTube, YouTube Shorts, Instagram Reels, Google Drive videos
                  </p>
                </div>

                <div>
                  <Label htmlFor="caption" className="text-slate-300">Caption</Label>
                  <Textarea
                    id="caption"
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    required
                    className="mt-2 bg-slate-900 border-slate-700 text-white"
                    rows={3}
                    placeholder="Describe what this video teaches... If sharing another creator's content, please credit them here."
                    data-testid="reel-caption-input"
                  />
                </div>

                {/* Categorization */}
                <div className="border-t border-slate-700 pt-4">
                  <Label className="text-slate-400 text-xs mb-2 block">Categorization (helps users find your content)</Label>
                  
                  {/* Education Level */}
                  {filterOptions.education_level && (
                    <div className="mb-3">
                      <Label className="text-slate-400 text-xs mb-1 block">Education Level</Label>
                      <div className="flex flex-wrap gap-1">
                        {filterOptions.education_level.slice(0, 5).map(opt => (
                          <Badge
                            key={opt.value}
                            className={`cursor-pointer text-xs ${
                              formData.education_level.includes(opt.value)
                                ? 'bg-pink-500 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                            onClick={() => {
                              const current = formData.education_level;
                              setFormData({
                                ...formData,
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
                    <div className="mb-3">
                      <Label className="text-slate-400 text-xs mb-1 block">Math Domain</Label>
                      <div className="flex flex-wrap gap-1">
                        {filterOptions.math_domain.slice(0, 6).map(opt => (
                          <Badge
                            key={opt.value}
                            className={`cursor-pointer text-xs ${
                              formData.math_domain.includes(opt.value)
                                ? 'bg-pink-500 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                            onClick={() => {
                              const current = formData.math_domain;
                              setFormData({
                                ...formData,
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

                  {/* Tags */}
                  <div>
                    <Label className="text-slate-400 text-xs mb-1 block">Tags</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
                              setFormData({ ...formData, tags: [...formData.tags, tagInput.trim().toLowerCase()] });
                              setTagInput('');
                            }
                          }
                        }}
                        className="bg-slate-900 border-slate-700 text-white text-sm flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
                            setFormData({ ...formData, tags: [...formData.tags, tagInput.trim().toLowerCase()] });
                            setTagInput('');
                          }
                        }}
                        size="sm"
                        className="bg-pink-500 hover:bg-pink-600"
                      >
                        Add
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.map(tag => (
                          <Badge
                            key={tag}
                            className="bg-pink-500/20 text-pink-400 flex items-center gap-1 cursor-pointer text-xs"
                            onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })}
                          >
                            #{tag}
                            <X className="w-3 h-3" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  data-testid="submit-reel-btn"
                >
                  Submit for Review
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Saved Filter Toggle */}
          <Button
            variant={showSavedOnly ? "default" : "outline"}
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`rounded-full ${showSavedOnly ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'border-slate-700 hover:bg-slate-800'}`}
            data-testid="show-saved-reels-btn"
          >
            <Bookmark className={`w-4 h-4 mr-2 ${showSavedOnly ? 'fill-current' : ''}`} />
            {showSavedOnly ? 'Showing Saved' : 'Show Saved'}
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search videos by caption or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          
          {/* Filters */}
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
                          ? 'bg-pink-500 text-white hover:bg-pink-600'
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
                          ? 'bg-pink-500 text-white hover:bg-pink-600'
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

            {/* Clear Filters */}
            {(selectedFilters.education_level?.length > 0 || selectedFilters.math_domain?.length > 0 || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFilters({ education_level: [], math_domain: [], difficulty: '' });
                  setSearchQuery('');
                }}
                className="text-pink-400 hover:text-pink-300 self-end"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading reels...</p>
          </div>
        ) : filteredReels.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredReels.map((reel, index) => (
                <motion.div
                  key={reel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-pink-500/50 transition-colors"
                  data-testid="reel-card"
                >
                  {/* Video Embed - 16:9 aspect ratio for all video types */}
                  <div className="bg-black aspect-video">
                    {reel.video_type === 'youtube' ? (
                      <iframe
                        src={getEmbedUrl(reel)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : reel.video_type === 'instagram' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <a 
                          href={reel.original_url || reel.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-pink-400 hover:text-pink-300 flex flex-col items-center gap-2"
                        >
                          <ExternalLink className="w-8 h-8" />
                          <span>View on Instagram</span>
                        </a>
                      </div>
                    ) : reel.video_type === 'googledrive' ? (
                      <iframe
                        src={getEmbedUrl(reel)}
                        className="w-full h-full"
                        allow="autoplay"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <a 
                          href={reel.original_url || reel.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-pink-400 hover:text-pink-300 flex flex-col items-center gap-2"
                        >
                          <Play className="w-12 h-12" />
                          <span>Watch Video</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Reel Info - Separate box below video */}
                  <div className="p-4 bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {reel.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{reel.user_name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(reel.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-slate-300 text-sm mb-4 line-clamp-3 cursor-help">
                          {reel.caption}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm bg-slate-900 border-slate-700 text-slate-200 p-3">
                        <p className="text-sm">{reel.caption}</p>
                      </TooltipContent>
                    </Tooltip>

                    <div className="flex items-center gap-3 relative z-20">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(reel.id); }}
                        className={`flex items-center gap-2 border-slate-600 hover:border-pink-500 ${reel.user_liked ? 'text-pink-500 bg-pink-500/10' : 'text-slate-400'} hover:text-pink-400 hover:bg-pink-500/10 cursor-pointer`}
                        data-testid="like-reel-btn"
                      >
                        <Heart className={`w-5 h-5 ${reel.user_liked ? 'fill-current' : ''}`} />
                        <span>{reel.like_count || 0}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveReel(reel.id); }}
                        className={`flex items-center gap-2 border-slate-600 hover:border-yellow-500 ${savedReels.includes(reel.id) ? 'text-yellow-500 bg-yellow-500/10' : 'text-slate-400'} hover:text-yellow-400 hover:bg-yellow-500/10 cursor-pointer`}
                        data-testid="save-reel-btn"
                      >
                        <Bookmark className={`w-4 h-4 ${savedReels.includes(reel.id) ? 'fill-current' : ''}`} />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareReel(reel); }}
                        className="flex items-center gap-2 text-slate-400 border-slate-600 hover:text-green-400 hover:border-green-500 hover:bg-green-500/10 cursor-pointer"
                        data-testid="share-reel-btn"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareToChat(reel); }}
                        className="flex items-center gap-2 text-slate-400 border-slate-600 hover:text-orange-400 hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer"
                        data-testid="share-reel-to-chat-btn"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      
                      <Badge variant="outline" className="text-slate-400 border-slate-600">
                        {reel.video_type}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border-2 border-dashed border-slate-700 max-w-lg mx-auto">
              <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="font-heading text-2xl font-semibold text-white mb-2">
                {showSavedOnly ? 'No Saved VEX' : 'No VEX Yet'}
              </h3>
              <p className="text-slate-400 mb-6">
                {showSavedOnly ? 'Save some VEX to see them here!' : 'Be the first to share an educational short video with the community!'}
              </p>
              {!showSavedOnly && (
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload First Reel
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* View Reel Modal (for deep links) */}
    <Dialog open={viewReelModalOpen} onOpenChange={(open) => {
      setViewReelModalOpen(open);
      if (!open) setViewReel(null);
    }}>
      <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-white">
            Educational Reel
          </DialogTitle>
        </DialogHeader>
        {viewReel && (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              {viewReel.video_type === 'youtube' || viewReel.video_url.includes('youtube.com') || viewReel.video_url.includes('youtu.be') ? (
                <iframe
                  src={viewReel.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : viewReel.video_type === 'googledrive' || viewReel.video_url.includes('drive.google.com') ? (
                <iframe
                  src={viewReel.video_url}
                  className="w-full h-full"
                  allow="autoplay"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <a 
                    href={viewReel.original_url || viewReel.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:text-pink-300 flex items-center gap-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Open Video
                  </a>
                </div>
              )}
            </div>
            <p className="text-slate-300">{viewReel.caption}</p>
            {viewReel.user_name && (
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                {viewReel.user_name}
              </p>
            )}
            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Button
                variant="outline"
                onClick={() => handleShareReel(viewReel)}
                className="flex-1 border-slate-600 hover:bg-slate-700"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                onClick={() => setViewReelModalOpen(false)}
                className="bg-gradient-to-r from-pink-500 to-purple-600"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Share to Chat Dialog */}
    <ShareToChat
      isOpen={shareToChatOpen}
      onClose={() => setShareToChatOpen(false)}
      contentType={shareContent?.type}
      contentTitle={shareContent?.title}
      contentUrl={shareContent?.url}
      contentId={shareContent?.id}
    />
    </TooltipProvider>
  );
};

export default ReelsPage;
