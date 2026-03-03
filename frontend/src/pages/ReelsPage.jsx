import React, { useState, useEffect, useContext } from 'react';
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
import { toast } from 'sonner';
import { 
  Play, Plus, Heart, MessageCircle, Share2, 
  User, Calendar, ExternalLink, Video, AlertTriangle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReelsPage = () => {
  const { user } = useContext(AuthContext);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    video_url: '',
    caption: ''
  });

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/reels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReels(res.data);
    } catch (err) {
      toast.error('Failed to fetch reels');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/reels`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Reel submitted for approval!');
      setDialogOpen(false);
      setFormData({ video_url: '', caption: '' });
      fetchReels();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit reel');
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
      toast.error('Failed to like reel');
    }
  };

  const handleShareReel = (reel) => {
    const shareUrl = `${window.location.origin}/reels?view=${reel.id}`;
    const shareText = `🎬 Check out this educational reel on Mentis!\n\n"${reel.caption.substring(0, 100)}..."\n\n🔗 ${shareUrl}\n\n✨ Discover more at Mentis - The premier platform for mathematics enthusiasts!\n${window.location.origin}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Mentis Reel',
        text: shareText,
        url: shareUrl
      }).catch(() => {
        navigator.clipboard.writeText(shareText);
        toast.success('Link copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Link copied to clipboard!');
    }
  };

  const getEmbedUrl = (reel) => {
    return reel.video_url;
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
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-heading text-5xl md:text-6xl font-bold text-white">
                Reels
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
                Upload Reel
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
                    rows={4}
                    placeholder="Describe what this video teaches... If sharing another creator's content, please credit them here."
                    data-testid="reel-caption-input"
                  />
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
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading reels...</p>
          </div>
        ) : reels.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {reels.map((reel, index) => (
                <motion.div
                  key={reel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-pink-500/50 transition-colors"
                  data-testid="reel-card"
                >
                  {/* Video Embed */}
                  <div className="aspect-[9/16] max-h-[400px] bg-black relative">
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

                  {/* Reel Info */}
                  <div className="p-4">
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

                    <p className="text-slate-300 text-sm mb-4 line-clamp-3">
                      {reel.caption}
                    </p>

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
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareReel(reel); }}
                        className="flex items-center gap-2 text-slate-400 border-slate-600 hover:text-green-400 hover:border-green-500 hover:bg-green-500/10 cursor-pointer"
                        data-testid="share-reel-btn"
                      >
                        <Share2 className="w-4 h-4" />
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
                No Reels Yet
              </h3>
              <p className="text-slate-400 mb-6">
                Be the first to share an educational short video with the community!
              </p>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload First Reel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReelsPage;
