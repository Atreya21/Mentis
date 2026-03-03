import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { MessageCircle, Send, User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ShareToChat = ({ isOpen, onClose, contentType, contentTitle, contentUrl, contentId }) => {
  const { user } = useContext(AuthContext);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchConnections();
    }
  }, [isOpen, user]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter only accepted connections
      const acceptedConnections = res.data.filter(c => c.status === 'accepted');
      setConnections(acceptedConnections);
    } catch (err) {
      console.error('Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  };

  const shareToConnection = async (connection) => {
    try {
      setSending(connection.id);
      const token = localStorage.getItem('token');
      
      // Create a formatted message with the shared content
      const shareMessage = `📤 Shared ${contentType}:\n\n📌 ${contentTitle}\n\n🔗 ${contentUrl}`;
      
      await axios.post(`${API}/messages/${connection.id}`, 
        { content: shareMessage },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success(`Shared to ${connection.other_user?.name || 'chat'}!`);
      onClose();
    } catch (err) {
      toast.error('Failed to share content');
    } finally {
      setSending(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-400" />
            Share to Mathmate Chat
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <p className="text-xs text-slate-500 mb-1">Sharing:</p>
            <p className="text-white font-medium text-sm line-clamp-2">{contentTitle}</p>
            <p className="text-xs text-orange-400 mt-1">{contentType}</p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-slate-400 mt-3 text-sm">Loading connections...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
              <User className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No connections yet</p>
              <p className="text-slate-500 text-xs mt-1">Connect with someone in Mathmate first</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {connections.map((connection) => (
                  <div 
                    key={connection.id}
                    className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {connection.other_user?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{connection.other_user?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{connection.other_user?.college || ''}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => shareToConnection(connection)}
                      disabled={sending === connection.id}
                      className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                      data-testid={`share-to-${connection.other_user?.name}`}
                    >
                      {sending === connection.id ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareToChat;
