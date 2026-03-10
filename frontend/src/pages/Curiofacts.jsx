import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Sparkles, Calendar, Heart, MessageCircle, Send, X, Plus, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import ShareToChat from '@/components/ShareToChat';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Curiofacts = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [facts, setFacts] = useState([]);
  const [likes, setLikes] = useState({});
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedFact, setSelectedFact] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitForm, setSubmitForm] = useState({ title: '', content: '', image_url: '' });
  const [viewFactModalOpen, setViewFactModalOpen] = useState(false);
  const [viewFact, setViewFact] = useState(null);
  const [shareToChatOpen, setShareToChatOpen] = useState(false);
  const [shareContent, setShareContent] = useState(null);

  useEffect(() => {
    fetchFacts();
  }, []);

  // Handle deep link
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && facts.length > 0) {
      const fact = facts.find(f => f.id === viewId);
      if (fact) {
        setViewFact(fact);
        setViewFactModalOpen(true);
        setSearchParams({});
      } else {
        fetchSingleFact(viewId);
      }
    }
  }, [searchParams, facts]);

  const fetchSingleFact = async (factId) => {
    try {
      const res = await axios.get(`${API}/curiofacts/${factId}`);
      setViewFact(res.data);
      setViewFactModalOpen(true);
      setSearchParams({});
    } catch (err) {
      toast.error('Curiofact not found');
      setSearchParams({});
    }
  };

  const fetchLikes = async (factList) => {
    const likesData = {};
    
    for (const fact of factList) {
      try {
        const res = await axios.get(`${API}/curiofacts/${fact.id}/likes`);
        likesData[fact.id] = {
          count: res.data.count,
          likes: res.data.likes,
          userLiked: user ? res.data.likes.some(l => l.user_id === user?.id) : false
        };
      } catch (err) {
        likesData[fact.id] = { count: 0, likes: [], userLiked: false };
      }
    }
    setLikes(likesData);
  };

  const fetchFacts = async () => {
    try {
      const res = await axios.get(`${API}/curiofacts`);
      setFacts(res.data);
      fetchLikes(res.data);
    } catch (err) {
      toast.error('Failed to fetch curiofacts');
    }
  };

  const handleLike = async (factId) => {
    if (!user) {
      toast.error('Please login to like');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/curiofacts/${factId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLikes(prev => ({
        ...prev,
        [factId]: {
          ...prev[factId],
          count: res.data.liked ? (prev[factId]?.count || 0) + 1 : Math.max(0, (prev[factId]?.count || 0) - 1),
          userLiked: res.data.liked
        }
      }));
    } catch (err) {
      toast.error('Failed to like');
    }
  };

  const openComments = async (fact) => {
    setSelectedFact(fact);
    setCommentDialogOpen(true);
    
    try {
      const res = await axios.get(`${API}/curiofacts/${fact.id}/comments`);
      setComments(res.data);
    } catch (err) {
      toast.error('Failed to load comments');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/curiofacts/${selectedFact.id}/comment`, 
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success('Comment added');
      setNewComment('');
      
      const res = await axios.get(`${API}/curiofacts/${selectedFact.id}/comments`);
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

  const handleSubmitCuriofact = async () => {
    if (!submitForm.title.trim() || !submitForm.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/curiofacts/submit`, submitForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Curiofact submitted for approval!');
      setSubmitDialogOpen(false);
      setSubmitForm({ title: '', content: '', image_url: '' });
    } catch (err) {
      toast.error('Failed to submit curiofact');
    }
  };

  const handleShareFact = (fact) => {
    const shareUrl = `${window.location.origin}/curiofacts?view=${fact.id}`;
    const shareText = `🧠 Interesting Math Fact: "${fact.title}"\n\n${fact.content.substring(0, 150)}...\n\n🔗 ${shareUrl}\n\n━━━━━━━━━━━━━━━━━\n✨ MENTIS - Where Minds Meet Mathematics ✨\n🎯 Join the premier platform for mathematics enthusiasts!\n📖 Resources • 🎮 Games • 🎬 VEX • 💬 Connect\n🌐 ${window.location.origin}\n━━━━━━━━━━━━━━━━━`;
    
    if (navigator.share) {
      navigator.share({
        title: `${fact.title} - Mentis Curiofacts`,
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

  const handleShareToChat = (fact) => {
    const shareUrl = `${window.location.origin}/curiofacts?view=${fact.id}`;
    setShareContent({
      type: 'Curiofact',
      title: fact.title,
      url: shareUrl,
      id: fact.id
    });
    setShareToChatOpen(true);
  };

  return (
    <div className="min-h-screen pt-20 bg-slate-950">
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-16">
          <motion.div 
            className="inline-block mb-6"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 bg-orange-500/20 border-2 border-orange-500 rounded-2xl flex items-center justify-center glow-on-hover">
              <Sparkles className="w-10 h-10 text-orange-400" />
            </div>
          </motion.div>
          <motion.h1 
            className="font-heading text-5xl md:text-7xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Curiofacts
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Fascinating facts and weekly updates from the world of mathematics
          </motion.p>
          
          {/* Submit Curiofact Button */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Submit a Curiofact
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Submit a Curiofact</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-slate-400">
                      Share an interesting math fact with the community! Your submission will be reviewed before publishing.
                    </p>
                    <div>
                      <Label className="text-slate-300">Title</Label>
                      <Input
                        value={submitForm.title}
                        onChange={(e) => setSubmitForm({...submitForm, title: e.target.value})}
                        className="mt-2 bg-slate-900 border-slate-700 text-white"
                        placeholder="E.g., The Beauty of Euler's Identity"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Content</Label>
                      <Textarea
                        value={submitForm.content}
                        onChange={(e) => setSubmitForm({...submitForm, content: e.target.value})}
                        className="mt-2 bg-slate-900 border-slate-700 text-white"
                        rows={6}
                        placeholder="Share your fascinating math fact..."
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Cover Image URL (Optional)</Label>
                      <Input
                        value={submitForm.image_url}
                        onChange={(e) => setSubmitForm({...submitForm, image_url: e.target.value})}
                        className="mt-2 bg-slate-900 border-slate-700 text-white"
                        placeholder="https://example.com/image.png or Google Drive link"
                      />
                      {submitForm.image_url && (
                        <div className="mt-2">
                          <img 
                            src={submitForm.image_url} 
                            alt="Preview" 
                            className="max-h-32 rounded-lg border border-slate-600"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={handleSubmitCuriofact}
                      className="w-full bg-gradient-to-r from-orange-500 to-pink-500"
                    >
                      Submit for Review
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}
        </div>

        <div className="space-y-8">
          {facts.map((fact, index) => (
            <motion.article
              key={fact.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700 hover-lift card-hover"
              data-testid="curiofact-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {fact.image_url && (
                <div className="h-64 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent z-10"></div>
                  <img
                    src={fact.image_url}
                    alt={fact.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-8">
                <div className="flex items-center justify-between gap-2 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <time>{format(new Date(fact.published_at), 'MMMM d, yyyy')}</time>
                  </div>
                  {fact.uploader_name && (
                    <div className="flex items-center gap-2 text-orange-400/80">
                      <span className="text-slate-400">by</span>
                      <span className="font-medium">{fact.uploader_name}</span>
                    </div>
                  )}
                </div>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
                  {fact.title}
                </h2>
                <div className="prose prose-slate max-w-none prose-invert">
                  <p className="text-lg leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {fact.content}
                  </p>
                </div>
                
                {/* Like, Comment and Share Section */}
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-700 relative z-20">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(fact.id); }}
                    className={`flex items-center gap-2 border-slate-600 hover:border-pink-500 ${likes[fact.id]?.userLiked ? 'text-pink-500 bg-pink-500/10' : 'text-slate-400'} hover:text-pink-400 hover:bg-pink-500/10 cursor-pointer`}
                    data-testid="like-fact-btn"
                  >
                    <Heart className={`w-5 h-5 ${likes[fact.id]?.userLiked ? 'fill-current' : ''}`} />
                    <span>{likes[fact.id]?.count || 0}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openComments(fact); }}
                    className="flex items-center gap-2 text-slate-400 border-slate-600 hover:text-orange-400 hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer"
                    data-testid="comment-fact-btn"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Comment</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareFact(fact); }}
                    className="flex items-center gap-2 text-slate-400 border-slate-600 hover:text-green-400 hover:border-green-500 hover:bg-green-500/10 cursor-pointer"
                    data-testid="share-fact-btn"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareToChat(fact); }}
                    className="flex items-center gap-2 text-slate-400 border-slate-600 hover:text-purple-400 hover:border-purple-500 hover:bg-purple-500/10 cursor-pointer"
                    data-testid="share-fact-to-chat-btn"
                  >
                    <Send className="w-5 h-5" />
                    <span>Send</span>
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Comments Dialog */}
        <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
          <DialogContent className="max-w-lg bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Comments - {selectedFact?.title}</DialogTitle>
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
                          {user && (comment.user_id === user?.id || user?.role === 'admin' || user?.role === 'master_admin') && (
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
              {user ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    className="bg-slate-900 border-slate-700 text-white"
                    data-testid="fact-comment-input"
                  />
                  <Button
                    onClick={handleAddComment}
                    className="bg-gradient-to-r from-orange-500 to-pink-500"
                    data-testid="submit-fact-comment-btn"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-center text-slate-400 text-sm">Login to add comments</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* View Fact Modal (for deep links) */}
        <Dialog open={viewFactModalOpen} onOpenChange={(open) => {
          setViewFactModalOpen(open);
          if (!open) setViewFact(null);
        }}>
          <DialogContent className="max-w-xl bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl text-white">
                {viewFact?.title}
              </DialogTitle>
            </DialogHeader>
            {viewFact && (
              <div className="space-y-4">
                {viewFact.image_url && (
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={viewFact.image_url} 
                      alt={viewFact.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <p className="text-slate-300 whitespace-pre-wrap text-lg leading-relaxed">
                  {viewFact.content}
                </p>
                {viewFact.uploader_name && (
                  <p className="text-slate-400 text-sm">
                    Shared by: <span className="text-orange-400">{viewFact.uploader_name}</span>
                  </p>
                )}
                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  <Button
                    variant="outline"
                    onClick={() => handleShareFact(viewFact)}
                    className="flex-1 border-slate-600 hover:bg-slate-700"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    onClick={() => setViewFactModalOpen(false)}
                    className="bg-gradient-to-r from-orange-500 to-pink-500"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {facts.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border-2 border-dashed border-slate-700">
              <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="font-heading text-2xl font-semibold text-white mb-2">
                More Facts Coming Soon!
              </h3>
              <p className="text-slate-400">
                We're curating fascinating mathematical facts for you. Check back weekly!
              </p>
            </div>
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

export default Curiofacts;