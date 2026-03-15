// ChatWindow Component - Handles the chat interface for private messaging
import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Send, ArrowLeft, Pin, RotateCcw, Trash2, 
  Reply, X, Paperclip, Image, FileText, 
  Video, Music, File, Download, Loader2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Get file icon based on type
const getFileIcon = (fileType) => {
  switch (fileType) {
    case 'image': return <Image className="w-4 h-4" />;
    case 'video': return <Video className="w-4 h-4" />;
    case 'audio': return <Music className="w-4 h-4" />;
    case 'document': return <FileText className="w-4 h-4" />;
    default: return <File className="w-4 h-4" />;
  }
};

// Render attachment in message
const renderAttachment = (attachment) => {
  if (!attachment) return null;
  
  const fullUrl = `${BACKEND_URL}${attachment.url}`;
  
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
      className="mt-2 flex items-center gap-2 bg-slate-700/50 rounded-lg p-2 hover:bg-slate-700 transition-colors max-w-xs"
    >
      {getFileIcon(attachment.file_type)}
      <span className="text-sm text-white truncate flex-1">{attachment.original_filename}</span>
      <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
    </a>
  );
};

// Helper function to render message content with clickable links
const renderMessageContent = (content) => {
  if (!content) return null;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0;
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-yellow-300 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part.split('\n').map((line, lineIndex) => (
      <React.Fragment key={`${index}-${lineIndex}`}>
        {lineIndex > 0 && <br />}
        {line}
      </React.Fragment>
    ));
  });
};

const ChatWindow = ({ 
  activeChat, 
  setActiveChat,
  messages,
  fetchMessages,
  pinnedChats,
  togglePinChat,
  isTyping,
  onTyping
}) => {
  const { user } = useContext(AuthContext);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  // Scroll to bottom only when new messages arrive
  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    
    if (currentCount > prevCount) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    
    prevMessageCountRef.current = currentCount;
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !activeChat) return;
    
    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      
      if (selectedFile) {
        const formData = new FormData();
        formData.append('content', newMessage);
        formData.append('file', selectedFile);
        
        await axios.post(`${API}/messages/${activeChat.id}/with-file`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSelectedFile(null);
      } else if (replyingTo) {
        await axios.post(`${API}/messages/${replyingTo.id}/reply`, 
          { content: newMessage },
          { headers: { Authorization: `Bearer ${token}` }}
        );
        setReplyingTo(null);
      } else {
        await axios.post(`${API}/messages/${activeChat.id}`, 
          { content: newMessage },
          { headers: { Authorization: `Bearer ${token}` }}
        );
      }
      
      setNewMessage('');
      fetchMessages(activeChat.id);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
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

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Message deleted');
      fetchMessages(activeChat.id);
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  // Clear chat history
  const clearChatHistory = async () => {
    if (!activeChat) return;
    if (!window.confirm('Are you sure you want to clear all messages? This cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/connections/${activeChat.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Chat history cleared');
      fetchMessages(activeChat.id);
    } catch (err) {
      toast.error('Failed to clear chat history');
    }
  };

  // Refresh chat
  const refreshChat = async () => {
    if (activeChat) {
      await fetchMessages(activeChat.id);
      toast.success('Chat refreshed');
    }
  };

  if (!activeChat) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-16 h-16 text-slate-600 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-slate-400 text-lg">Select a connection to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden"
            onClick={() => setActiveChat(null)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold">
            {activeChat.other_user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-medium">{activeChat.other_user?.name}</p>
            {isTyping && (
              <p className="text-green-400 text-sm animate-pulse">typing...</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => togglePinChat(activeChat.id)}
            className={`${pinnedChats.includes(activeChat.id) ? 'text-yellow-400' : 'text-slate-400'} hover:text-yellow-300`}
            title={pinnedChats.includes(activeChat.id) ? 'Unpin chat' : 'Pin chat'}
          >
            <Pin className={`w-4 h-4 ${pinnedChats.includes(activeChat.id) ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshChat}
            className="text-slate-400 hover:text-white"
            title="Refresh chat"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChatHistory}
            className="text-slate-400 hover:text-red-400"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-slate-900/30 rounded-lg p-2">
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          <div className="space-y-3 p-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} group`}
              >
                <div className="max-w-[70%]">
                  {/* Reply indicator */}
                  {msg.reply_to && (
                    <div className={`text-xs px-3 py-1 mb-1 rounded-t-lg ${
                      msg.sender_id === user?.id ? 'bg-orange-600/30 text-orange-200' : 'bg-slate-600/50 text-slate-300'
                    }`}>
                      <Reply className="w-3 h-3 inline mr-1" />
                      {msg.reply_to_content?.substring(0, 50)}...
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl relative ${
                      msg.sender_id === user?.id
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {msg.content && <p className="whitespace-pre-wrap">{renderMessageContent(msg.content)}</p>}
                    {msg.attachment && renderAttachment(msg.attachment)}
                    <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-white/70' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    
                    {/* Message actions */}
                    <div className={`absolute ${msg.sender_id === user?.id ? '-left-24' : '-right-24'} top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-slate-800/90 rounded-lg px-1 py-0.5`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(msg)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                        >
                          <Reply className="w-3 h-3" />
                        </Button>
                        {msg.sender_id === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMessage(msg.id)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-t border-slate-700">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Reply className="w-4 h-4" />
            <span>Replying to: {replyingTo.content?.substring(0, 30)}...</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingTo(null)}
            className="h-6 w-6 p-0 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-t border-slate-700">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Paperclip className="w-4 h-4 text-orange-400" />
            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
            <span className="text-xs">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFile(null)}
            className="h-6 w-6 p-0 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Message Input */}
      <div className="flex gap-2 pt-4 border-t border-slate-700">
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
          className="text-slate-400 hover:text-white hover:bg-slate-700"
          disabled={uploading}
          data-testid="attach-file-btn"
        >
          <Paperclip className="w-5 h-5" />
        </Button>
        <Input
          placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            onTyping && onTyping();
          }}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="bg-slate-900 border-slate-700 text-white flex-1"
          data-testid="message-input"
          disabled={uploading}
        />
        <Button 
          onClick={sendMessage}
          className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          data-testid="send-message-btn"
          disabled={uploading || (!newMessage.trim() && !selectedFile)}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default ChatWindow;
