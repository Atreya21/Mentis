import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '@/App';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Search, UserPlus, Check, X, MessageCircle, Send, 
  Users, Bell, Clock, UserCheck, Filter, Loader2,
  ArrowLeft, Circle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

const ConnectPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [colleges, setColleges] = useState([]);
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch colleges for filter
  const fetchColleges = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/users/colleges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setColleges(res.data);
    } catch (err) {
      console.error('Failed to fetch colleges:', err);
    }
  };

  // Search users
  const searchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (collegeFilter && collegeFilter !== 'all') params.append('college', collegeFilter);
      
      const res = await axios.get(`${API}/users/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, collegeFilter]);

  // Fetch connections
  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(res.data);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    }
  };

  // Fetch pending requests
  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/connections/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    }
  };

  // Fetch sent requests
  const fetchSentRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/connections/sent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSentRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch sent requests:', err);
    }
  };

  // Send connection request
  const sendConnectionRequest = async (receiverId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/connections/request`, 
        { receiver_id: receiverId },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Connection request sent!');
      searchUsers();
      fetchSentRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send request');
    }
  };

  // Accept connection request
  const acceptRequest = async (connectionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/connections/${connectionId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Connection accepted!');
      fetchPendingRequests();
      fetchConnections();
      searchUsers();
    } catch (err) {
      toast.error('Failed to accept request');
    }
  };

  // Reject connection request
  const rejectRequest = async (connectionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/connections/${connectionId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Connection rejected');
      fetchPendingRequests();
      searchUsers();
    } catch (err) {
      toast.error('Failed to reject request');
    }
  };

  // Fetch messages for a connection
  const fetchMessages = async (connectionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/messages/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) {
      toast.error('Failed to load messages');
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/messages/${activeChat.id}`, 
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setNewMessage('');
      fetchMessages(activeChat.id);
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  // Open chat
  const openChat = (connection) => {
    setActiveChat(connection);
    fetchMessages(connection.id);
    setActiveTab('chat');
  };

  // WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const connectWebSocket = () => {
      const ws = new WebSocket(`${WS_URL}/ws/${token}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        wsRef.current = ws;
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          // Add message to chat if viewing that connection
          if (activeChat && data.message.connection_id === activeChat.id) {
            setMessages(prev => [...prev, data.message]);
          }
          // Update connection list
          fetchConnections();
        } else if (data.type === 'connection_request') {
          toast.info(`${data.from_user.name} sent you a connection request!`);
          fetchPendingRequests();
        } else if (data.type === 'connection_accepted') {
          toast.success(`${data.from_user.name} accepted your connection request!`);
          fetchConnections();
          fetchSentRequests();
        } else if (data.type === 'typing') {
          if (activeChat && data.connection_id === activeChat.id) {
            setIsTyping(true);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
          }
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting...');
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [activeChat]);

  // Initial data fetch
  useEffect(() => {
    fetchColleges();
    fetchConnections();
    fetchPendingRequests();
    fetchSentRequests();
    searchUsers();
  }, []);

  // Search on filter change
  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, collegeFilter, searchUsers]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send typing indicator
  const handleTyping = () => {
    if (wsRef.current && activeChat) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        connection_id: activeChat.id
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-gradient mb-4">
            Connect
          </h1>
          <p className="text-slate-400 text-lg">
            Find and connect with fellow mathematics enthusiasts
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Connections & Requests */}
          <div className="lg:col-span-1 space-y-4">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Bell className="w-5 h-5 text-orange-400" />
                    Pending Requests
                    <Badge className="bg-orange-500 ml-2">{pendingRequests.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{req.requester?.name}</p>
                        <p className="text-slate-400 text-sm">{req.requester?.college || 'No college'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                          onClick={() => acceptRequest(req.id)}
                          data-testid="accept-request-btn"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => rejectRequest(req.id)}
                          data-testid="reject-request-btn"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* My Connections */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <UserCheck className="w-5 h-5 text-green-400" />
                  My Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {connections.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No connections yet</p>
                  ) : (
                    <div className="space-y-2">
                      {connections.map((conn) => (
                        <div 
                          key={conn.id} 
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                            activeChat?.id === conn.id ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-slate-900/50 hover:bg-slate-900'
                          }`}
                          onClick={() => openChat(conn)}
                          data-testid="connection-item"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {conn.other_user?.name?.charAt(0).toUpperCase()}
                              </div>
                              {onlineUsers.has(conn.other_user?.id) && (
                                <Circle className="w-3 h-3 text-green-500 fill-green-500 absolute -bottom-0.5 -right-0.5" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">{conn.other_user?.name}</p>
                              {conn.last_message && (
                                <p className="text-slate-400 text-xs truncate max-w-[120px]">
                                  {conn.last_message.content}
                                </p>
                              )}
                            </div>
                          </div>
                          {conn.unread_count > 0 && (
                            <Badge className="bg-orange-500">{conn.unread_count}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    Sent Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sentRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{req.receiver?.name}</p>
                        <p className="text-slate-400 text-sm">Pending...</p>
                      </div>
                      <Badge className="bg-yellow-600">Pending</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 h-[600px] flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <CardHeader className="pb-0">
                  <TabsList className="bg-slate-900">
                    <TabsTrigger value="discover" className="data-[state=active]:bg-orange-500" data-testid="discover-tab">
                      <Search className="w-4 h-4 mr-2" />
                      Discover
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="data-[state=active]:bg-orange-500" data-testid="chat-tab">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                {/* Discover Tab */}
                <TabsContent value="discover" className="flex-1 overflow-hidden m-0">
                  <CardContent className="h-full flex flex-col pt-4">
                    {/* Search & Filter */}
                    <div className="flex gap-3 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search by name or email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-slate-900 border-slate-700 text-white"
                          data-testid="user-search-input"
                        />
                      </div>
                      <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                        <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-white">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Filter by college" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Colleges</SelectItem>
                          {colleges.map((college) => (
                            <SelectItem key={college} value={college}>{college}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* User List */}
                    <ScrollArea className="flex-1">
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        </div>
                      ) : users.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400">No users found</p>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {users.map((u) => (
                            <motion.div
                              key={u.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                              data-testid="user-card"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                                  {u.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-white font-medium">{u.name}</p>
                                  <p className="text-slate-400 text-sm">{u.email}</p>
                                  {u.college && (
                                    <Badge variant="outline" className="mt-1 text-xs border-slate-600 text-slate-400">
                                      {u.college}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div>
                                {u.connection_status === 'accepted' ? (
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      const conn = connections.find(c => c.id === u.connection_id);
                                      if (conn) openChat(conn);
                                    }}
                                  >
                                    <MessageCircle className="w-4 h-4 mr-1" />
                                    Chat
                                  </Button>
                                ) : u.connection_status === 'pending' ? (
                                  u.is_requester ? (
                                    <Badge className="bg-yellow-600">Request Sent</Badge>
                                  ) : (
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => acceptRequest(u.connection_id)}
                                      >
                                        Accept
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="destructive"
                                        onClick={() => rejectRequest(u.connection_id)}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  )
                                ) : (
                                  <Button 
                                    size="sm" 
                                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                                    onClick={() => sendConnectionRequest(u.id)}
                                    data-testid="connect-btn"
                                  >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    Connect
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </TabsContent>

                {/* Chat Tab */}
                <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
                  <CardContent className="h-full flex flex-col pt-4">
                    {!activeChat ? (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-400 text-lg">Select a connection to start chatting</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Chat Header */}
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
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

                        {/* Messages */}
                        <ScrollArea className="flex-1 py-4">
                          <div className="space-y-3">
                            {messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                    msg.sender_id === user?.id
                                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                                      : 'bg-slate-700 text-white'
                                  }`}
                                >
                                  <p>{msg.content}</p>
                                  <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-white/70' : 'text-slate-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        </ScrollArea>

                        {/* Message Input */}
                        <div className="flex gap-2 pt-4 border-t border-slate-700">
                          <Input
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value);
                              handleTyping();
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            className="bg-slate-900 border-slate-700 text-white"
                            data-testid="message-input"
                          />
                          <Button 
                            onClick={sendMessage}
                            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                            data-testid="send-message-btn"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectPage;
