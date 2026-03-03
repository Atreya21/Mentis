import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Sparkles, Calendar, Heart, MessageCircle, Send, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Curiofacts = () => {
  const { user } = useContext(AuthContext);
  const [facts, setFacts] = useState([]);
  const [likes, setLikes] = useState({});
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedFact, setSelectedFact] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchFacts();
  }, []);

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
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Fascinating facts and weekly updates from the world of mathematics
          </motion.p>
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
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <Calendar className="w-4 h-4" />
                  <time>{format(new Date(fact.published_at), 'MMMM d, yyyy')}</time>
                </div>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
                  {fact.title}
                </h2>
                <div className="prose prose-slate max-w-none prose-invert">
                  <p className="text-lg leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {fact.content}
                  </p>
                </div>
                
                {/* Like and Comment Section */}
                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(fact.id)}
                    className={`flex items-center gap-2 ${likes[fact.id]?.userLiked ? 'text-pink-500' : 'text-slate-400'} hover:text-pink-400`}
                    data-testid="like-fact-btn"
                  >
                    <Heart className={`w-5 h-5 ${likes[fact.id]?.userLiked ? 'fill-current' : ''}`} />
                    <span>{likes[fact.id]?.count || 0} Likes</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openComments(fact)}
                    className="flex items-center gap-2 text-slate-400 hover:text-orange-400"
                    data-testid="comment-fact-btn"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Comments</span>
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
      </div>
    </div>
  );
};

export default Curiofacts;