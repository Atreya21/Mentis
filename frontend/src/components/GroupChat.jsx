// Group Chat Component for Mathmate
import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Users, Plus, Send, ArrowLeft, Settings, LogOut, 
  Paperclip, Image, FileText, Video, Music, File,
  Download, X, Loader2
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const GroupChat = ({ onBack, connections }) => {
  const { user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  // Fetch messages for active group
  const fetchMessages = async (groupId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
    
    // Auto-refresh groups
    const interval = setInterval(fetchGroups, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeGroup) {
      fetchMessages(activeGroup.id);
      
      // Auto-refresh messages
      const interval = setInterval(() => fetchMessages(activeGroup.id), 1000);
      return () => clearInterval(interval);
    }
  }, [activeGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Create new group
  const createGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) {
      toast.error('Please enter a name and select at least one member');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/groups`, {
        name: newGroupName,
        description: newGroupDescription,
        member_ids: selectedMembers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Group created!');
      setCreateDialogOpen(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setSelectedMembers([]);
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create group');
    }
  };

  // Send message
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !activeGroup) return;

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      
      if (selectedFile) {
        // Send with file
        const formData = new FormData();
        formData.append('content', newMessage);
        formData.append('file', selectedFile);
        
        await axios.post(`${API}/groups/${activeGroup.id}/messages/with-file`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Send text only
        await axios.post(`${API}/groups/${activeGroup.id}/messages`, {
          content: newMessage
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setNewMessage('');
      setSelectedFile(null);
      fetchMessages(activeGroup.id);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  // Leave group
  const leaveGroup = async () => {
    if (!activeGroup) return;
    
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/groups/${activeGroup.id}/leave`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Left the group');
      setActiveGroup(null);
      setSettingsOpen(false);
      fetchGroups();
    } catch (err) {
      toast.error('Failed to leave group');
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File too large. Max size is 50MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Get file icon
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  // Render attachment
  const renderAttachment = (attachment) => {
    if (!attachment) return null;
    
    const fullUrl = `${process.env.REACT_APP_BACKEND_URL}${attachment.url}`;
    
    if (attachment.file_type === 'image') {
      return (
        <div className="mt-2">
          <img 
            src={fullUrl} 
            alt={attachment.original_filename}
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
            onClick={() => window.open(fullUrl, '_blank')}
          />
        </div>
      );
    }
    
    return (
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2 bg-slate-700/50 rounded-lg p-2 hover:bg-slate-700 transition-colors"
      >
        {getFileIcon(attachment.file_type)}
        <span className="text-sm text-white truncate max-w-[200px]">{attachment.original_filename}</span>
        <Download className="w-4 h-4 text-slate-400" />
      </a>
    );
  };

  // Toggle member selection
  const toggleMember = (userId) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (activeGroup) {
    return (
      <div className="flex flex-col h-[600px] bg-slate-900/50 rounded-lg border border-slate-700">
        {/* Group Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveGroup(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h3 className="font-semibold text-white">{activeGroup.name}</h3>
              <p className="text-xs text-slate-400">{activeGroup.member_count} members</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${msg.sender_id === user?.id ? 'bg-orange-600' : 'bg-slate-700'} rounded-lg p-3`}>
                  {msg.sender_id !== user?.id && (
                    <p className="text-xs text-slate-300 mb-1">{msg.sender_name}</p>
                  )}
                  {msg.content && <p className="text-white">{msg.content}</p>}
                  {renderAttachment(msg.attachment)}
                  <p className="text-xs text-slate-300 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Selected file preview */}
        {selectedFile && (
          <div className="px-4 py-2 bg-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-white truncate max-w-[200px]">{selectedFile.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-slate-800 border-slate-600"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={uploading}
            />
            <Button onClick={sendMessage} disabled={uploading || (!newMessage.trim() && !selectedFile)}>
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Group Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Members ({activeGroup.member_count})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {activeGroup.member_info?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                      <span className="text-white">{member.name}</span>
                      {activeGroup.admins?.includes(member.id) && (
                        <Badge className="bg-orange-500">Admin</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={leaveGroup}
              >
                <LogOut className="w-4 h-4 mr-2" /> Leave Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h2 className="text-xl font-semibold text-white">Group Chats</h2>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" /> Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Group Name</Label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div>
                <Label className="text-white">Description (optional)</Label>
                <Input
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Enter description"
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div>
                <Label className="text-white">Select Members</Label>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-2">
                  {connections.map((conn) => (
                    <div 
                      key={conn.other_user?.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedMembers.includes(conn.other_user?.id) 
                          ? 'bg-orange-600/30 border border-orange-500' 
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                      onClick={() => toggleMember(conn.other_user?.id)}
                    >
                      <span className="text-white">{conn.other_user?.name}</span>
                      {selectedMembers.includes(conn.other_user?.id) && (
                        <Badge className="bg-orange-500">Selected</Badge>
                      )}
                    </div>
                  ))}
                  {connections.length === 0 && (
                    <p className="text-slate-400 text-center py-4">No connections available</p>
                  )}
                </div>
              </div>
              <Button 
                onClick={createGroup} 
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={!newGroupName.trim() || selectedMembers.length === 0}
              >
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No Groups Yet</h3>
            <p className="text-slate-400 mb-4">Create a group to chat with multiple connections</p>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Create Your First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <Card 
              key={group.id}
              className="bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors"
              onClick={() => setActiveGroup(group)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-600/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{group.name}</h3>
                      <p className="text-sm text-slate-400">{group.member_count} members</p>
                    </div>
                  </div>
                  {group.last_message && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {new Date(group.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-slate-400 truncate max-w-[150px]">
                        {group.last_message.sender_name}: {group.last_message.content || 'File'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupChat;
