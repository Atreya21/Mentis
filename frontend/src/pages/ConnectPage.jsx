import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/App';
import { useWebSocket } from '@/context/WebSocketContext';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import pushService from '@/services/PushNotificationService';
import GroupChat from '@/components/GroupChat';
import { ChatWindow, ConnectionList, UserProfileDialog } from '@/components/connect';
import { 
  Search, UserPlus, Check, X, MessageCircle, 
  Users, Loader2, Eye, Flag, BellRing, BellOff, UsersRound,
  Award, Link2, Calendar, BookOpen
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ConnectPage = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    subscribe, 
    sendTyping: wsSendTyping, 
    setActiveChatId, 
    onlineUsers: globalOnlineUsers, 
    fetchUnreadCount 
  } = useWebSocket();
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [colleges, setColleges] = useState([]);
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // Enhanced features state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportUserId, setReportUserId] = useState(null);
  const [reportForm, setReportForm] = useState({ reason: '', description: '' });
  const [pinnedChats, setPinnedChats] = useState([]);
  const [matrixMembers, setMatrixMembers] = useState([]);
  const [matrixSearch, setMatrixSearch] = useState('');
  const [emailRequests, setEmailRequests] = useState([]);
  
  // Group chat state
  const [showGroupChat, setShowGroupChat] = useState(false);
  
  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [matrixPage, setMatrixPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const typingTimeoutRef = useRef(null);

  // Initialize push notifications
  useEffect(() => {
    const initPush = async () => {
      const isEnabled = await pushService.init();
      setNotificationsEnabled(isEnabled);
    };
    initPush();

    const handlePermChange = (e) => {
      if (e.detail && e.detail.granted) {
        setNotificationsEnabled(true);
        toast.success('Device notifications enabled for Mentis!');
      }
    };
    window.addEventListener('mentis_permission_changed', handlePermChange);
    return () => window.removeEventListener('mentis_permission_changed', handlePermChange);
  }, []);

  // Toggle push notifications
  const togglePushNotifications = async () => {
    setNotificationsLoading(true);
    try {
      if (notificationsEnabled) {
        await pushService.unsubscribe();
        setNotificationsEnabled(false);
        toast.success('Push notifications disabled');
      } else {
        await pushService.subscribe();

        if (typeof window !== 'undefined' && window.MentisNative) {
          // If native app, wait briefly to check if already granted, otherwise let system prompt handle it
          const hasPerm = window.MentisNative.hasNotificationPermission();
          if (hasPerm) {
            setNotificationsEnabled(true);
            toast.success('Device notifications enabled!');
            setTimeout(async () => {
              try {
                await pushService.sendTestNotification();
              } catch (e) {}
            }, 600);
          } else {
            // Permission requested; if system suppressed it, offer Settings button
            toast.info('Permission requested. If no prompt appears, please tap to open Settings.', {
              action: {
                label: 'Open Settings',
                onClick: () => window.MentisNative.openNotificationSettings()
              },
              duration: 7000
            });
          }
          return;
        }

        setNotificationsEnabled(true);
        toast.success('Push notifications enabled! You will receive alerts for new messages.');
        
        // Send a test notification
        setTimeout(async () => {
          try {
            await pushService.sendTestNotification();
          } catch (e) {
            console.log('Test notification skipped');
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Push toggle error:', err);
      if (typeof window !== 'undefined' && window.MentisNative) {
        toast.error('Please allow notifications in Android Settings', {
          action: {
            label: 'Open Settings',
            onClick: () => window.MentisNative.openNotificationSettings()
          }
        });
      } else if (err.message && err.message.includes('denied')) {
        toast.error('Notifications blocked. Please click the site settings icon in your browser address bar to allow notifications.');
      } else {
        toast.error(err.message || 'Failed to toggle notifications');
      }
    } finally {
      setNotificationsLoading(false);
    }
  };

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
      if (collegeFilter && collegeFilter !== '') params.append('college', collegeFilter);
      
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

  // Fetch connections - sorted by last message time (recent first)
  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Sort connections by last_message created_at (most recent first)
      const sortedConnections = res.data.sort((a, b) => {
        const timeA = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0;
        const timeB = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0;
        return timeB - timeA; // Descending order (recent first)
      });
      
      setConnections(sortedConnections);
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

  // View user profile
  const viewUserProfile = async (userId) => {
    setLoadingProfile(true);
    setProfileDialogOpen(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/users/${userId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUserProfile(res.data);
    } catch (err) {
      toast.error('Failed to load profile');
      setProfileDialogOpen(false);
    } finally {
      setLoadingProfile(false);
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

  // Pin/Unpin chat
  const togglePinChat = async (connectionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/connections/${connectionId}/pin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.pinned) {
        setPinnedChats([...pinnedChats, connectionId]);
        toast.success('Chat pinned');
      } else {
        setPinnedChats(pinnedChats.filter(id => id !== connectionId));
        toast.success('Chat unpinned');
      }
    } catch (err) {
      toast.error('Failed to pin/unpin chat');
    }
  };

  // Fetch pinned chats
  const fetchPinnedChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/connections/pinned`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPinnedChats(res.data);
    } catch (err) {
      console.error('Failed to fetch pinned chats');
    }
  };

  // Report user
  const openReportDialog = (userId) => {
    setReportUserId(userId);
    setReportForm({ reason: '', description: '' });
    setReportDialogOpen(true);
  };

  const submitReport = async () => {
    if (!reportForm.reason || !reportForm.description) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/users/${reportUserId}/report`, reportForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Report submitted successfully');
      setReportDialogOpen(false);
      setReportUserId(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit report');
    }
  };

  // Open chat
  const openChat = useCallback((connection) => {
    setActiveChat(connection);
    if (setActiveChatId) setActiveChatId(connection.id);
    fetchMessages(connection.id);
    setActiveTab('chat');

    // Mark messages as read on backend & refresh unread count
    const token = localStorage.getItem('token');
    if (token) {
      axios.post(`${API}/messages/${connection.id}/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        if (fetchUnreadCount) fetchUnreadCount();
      }).catch(() => {});
    }
  }, [setActiveChatId, fetchUnreadCount]);

  // Sync activeChatId with WebSocketContext
  useEffect(() => {
    if (setActiveChatId) {
      setActiveChatId(activeChat ? activeChat.id : null);
    }
    return () => {
      if (setActiveChatId) setActiveChatId(null);
    };
  }, [activeChat, setActiveChatId]);

  // Handle URL query parameters (?chat=connection_id or ?tab=groups)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetChatId = params.get('chat');
    const targetTab = params.get('tab');

    if (targetTab === 'groups') {
      setShowGroupChat(true);
    }

    if (targetChatId && connections.length > 0) {
      const foundConn = connections.find(c => c.id === targetChatId);
      if (foundConn) {
        openChat(foundConn);
      }
    }
  }, [location.search, connections, openChat]);

  // Ref to always access current activeChat in WebSocket listeners
  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Subscribe to real-time events via global WebSocket
  useEffect(() => {
    if (!subscribe) return;

    const unsubMsg = subscribe('new_message', (data) => {
      const msg = data.message;
      if (activeChatRef.current && msg.connection_id === activeChatRef.current.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        
        // Mark as read immediately on backend
        const token = localStorage.getItem('token');
        if (token) {
          axios.post(`${API}/messages/${msg.connection_id}/mark-read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(() => {
            if (fetchUnreadCount) fetchUnreadCount();
          }).catch(() => {});
        }
      }
      fetchConnections();
    });

    const unsubReq = subscribe('connection_request', () => {
      fetchPendingRequests();
    });

    const unsubAcc = subscribe('connection_accepted', () => {
      fetchConnections();
      fetchSentRequests();
    });

    const unsubTyping = subscribe('typing', (data) => {
      if (activeChatRef.current && data.connection_id === activeChatRef.current.id) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => {
      unsubMsg();
      unsubReq();
      unsubAcc();
      unsubTyping();
    };
  }, [subscribe, fetchUnreadCount]);

  // Initial data fetch & gentle 15-second background sync
  useEffect(() => {
    fetchColleges();
    fetchConnections();
    fetchPendingRequests();
    fetchSentRequests();
    fetchPinnedChats();
    fetchMatrixMembers();
    fetchEmailRequests();
    searchUsers();
    
    const refreshInterval = setInterval(() => {
      fetchConnections();
      fetchPendingRequests();
    }, 15000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchMatrixMembers = async () => {
    try {
      const res = await axios.get(`${API}/matrix-members-public`);
      setMatrixMembers(res.data);
    } catch (err) {
      console.error('Failed to fetch matrix members');
    }
  };

  const fetchEmailRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/email-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch email requests');
    }
  };

  const respondToEmailRequest = async (requestId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/email-requests/${requestId}?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Email request ${status}`);
      fetchEmailRequests();
    } catch (err) {
      toast.error('Failed to respond to request');
    }
  };

  const requestUserEmail = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/users/${userId}/request-email`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send request');
    }
  };

  const filteredMatrixMembers = useMemo(() => {
    if (!matrixSearch.trim()) return matrixMembers;
    const query = matrixSearch.toLowerCase();
    return matrixMembers.filter(m => 
      m.name?.toLowerCase().includes(query) ||
      m.college?.toLowerCase().includes(query) ||
      m.interests?.toLowerCase().includes(query)
    );
  }, [matrixMembers, matrixSearch]);

  // Search on filter change
  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, collegeFilter, searchUsers]);

  // Send typing indicator
  const handleTyping = () => {
    if (activeChat && wsSendTyping) {
      wsSendTyping(activeChat.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-gradient mb-4">
                Mathmate
              </h1>
              <p className="text-slate-400 text-lg">
                Find and connect with fellow mathematics enthusiasts
              </p>
            </div>
            
            {/* Push Notification Toggle */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGroupChat(true)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                data-testid="group-chat-btn"
              >
                <UsersRound className="w-4 h-4 mr-2" />
                Group Chats
              </Button>
              <Button
                variant={notificationsEnabled ? "default" : "outline"}
                size="sm"
                onClick={togglePushNotifications}
                disabled={notificationsLoading}
                className={notificationsEnabled 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "border-slate-600 text-slate-300 hover:bg-slate-700"
                }
                data-testid="notification-toggle-btn"
              >
                {notificationsLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : notificationsEnabled ? (
                  <BellRing className="w-4 h-4 mr-2" />
                ) : (
                  <BellOff className="w-4 h-4 mr-2" />
                )}
                {notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Show Group Chat or Main Content */}
        {showGroupChat ? (
          <GroupChat 
            onBack={() => setShowGroupChat(false)} 
            connections={connections}
          />
        ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Connections & Requests */}
          <div className="lg:col-span-1">
            <ConnectionList
              connections={connections}
              pendingRequests={pendingRequests}
              sentRequests={sentRequests}
              pinnedChats={pinnedChats}
              activeChat={activeChat}
              onlineUsers={globalOnlineUsers || onlineUsers}
              onOpenChat={openChat}
              onAcceptRequest={acceptRequest}
              onRejectRequest={rejectRequest}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-0">
                  <TabsList className="bg-slate-900">
                    <TabsTrigger value="discover" className="data-[state=active]:bg-orange-500" data-testid="discover-tab">
                      <Search className="w-4 h-4 mr-2" />
                      Discover
                    </TabsTrigger>
                    <TabsTrigger value="matrix" className="data-[state=active]:bg-orange-500" data-testid="matrix-tab">
                      <Users className="w-4 h-4 mr-2" />
                      Matrix Members
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="data-[state=active]:bg-orange-500" data-testid="chat-tab">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                {/* Discover Tab */}
                <TabsContent value="discover" className="m-0">
                  <CardContent className="pt-4">
                    {/* Search Only */}
                    <div className="mb-4 flex-shrink-0">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search by name..."
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                          className="pl-10 bg-slate-900 border-slate-700 text-white"
                          data-testid="user-search-input"
                        />
                      </div>
                    </div>

                    {/* User List with Scrollbar */}
                    <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 400px)' }}>
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
                          {users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((u) => (
                            <motion.div
                              key={u.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                              data-testid="user-card"
                            >
                              <div 
                                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => viewUserProfile(u.id)}
                              >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                                  {u.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-white font-medium flex items-center gap-2">
                                    {u.name}
                                    <Eye className="w-3 h-3 text-slate-500" />
                                  </p>
                                  {u.college && (
                                    <Badge variant="outline" className="mt-1 text-xs border-slate-600 text-slate-400">
                                      {u.college}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                  onClick={() => viewUserProfile(u.id)}
                                  data-testid="view-profile-btn"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
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
                    </div>
                    
                    {/* Pagination Controls */}
                    {users.length > ITEMS_PER_PAGE && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700 flex-shrink-0">
                        <p className="text-sm text-slate-400">
                          Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, users.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, users.length)} of {users.length}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="border-slate-600"
                          >
                            Previous
                          </Button>
                          <span className="flex items-center px-3 text-white">
                            Page {currentPage} of {Math.ceil(users.length / ITEMS_PER_PAGE)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={currentPage >= Math.ceil(users.length / ITEMS_PER_PAGE)}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="border-slate-600"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </TabsContent>

                {/* Matrix Members Tab */}
                <TabsContent value="matrix" className="m-0">
                  <CardContent className="pt-4">
                    {/* Search */}
                    <div className="mb-4 flex-shrink-0">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search matrix members..."
                          value={matrixSearch}
                          onChange={(e) => { setMatrixSearch(e.target.value); setMatrixPage(1); }}
                          className="pl-10 bg-slate-900 border-slate-700 text-white"
                          data-testid="matrix-search-input"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                      {filteredMatrixMembers.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400">No matrix members found</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredMatrixMembers.slice((matrixPage - 1) * ITEMS_PER_PAGE, matrixPage * ITEMS_PER_PAGE).map((member) => (
                            <motion.div
                              key={member.id}
                              className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              data-testid="matrix-member-card"
                            >
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                                {member.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-medium">{member.name}</p>
                                <p className="text-slate-400 text-sm">{member.college}</p>
                                {member.interests && (
                                  <p className="text-slate-500 text-xs mt-1 line-clamp-1">
                                    Interests: {member.interests}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Pagination Controls */}
                    {filteredMatrixMembers.length > ITEMS_PER_PAGE && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700 flex-shrink-0">
                        <p className="text-sm text-slate-400">
                          Showing {Math.min((matrixPage - 1) * ITEMS_PER_PAGE + 1, filteredMatrixMembers.length)}-{Math.min(matrixPage * ITEMS_PER_PAGE, filteredMatrixMembers.length)} of {filteredMatrixMembers.length}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={matrixPage === 1}
                            onClick={() => setMatrixPage(p => Math.max(1, p - 1))}
                            className="border-slate-600"
                          >
                            Previous
                          </Button>
                          <span className="flex items-center px-3 text-white">
                            Page {matrixPage} of {Math.ceil(filteredMatrixMembers.length / ITEMS_PER_PAGE)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={matrixPage >= Math.ceil(filteredMatrixMembers.length / ITEMS_PER_PAGE)}
                            onClick={() => setMatrixPage(p => p + 1)}
                            className="border-slate-600"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </TabsContent>

                {/* Chat Tab */}
                <TabsContent value="chat" className="m-0">
                  <CardContent className="pt-4">
                    <ChatWindow
                      activeChat={activeChat}
                      setActiveChat={setActiveChat}
                      messages={messages}
                      fetchMessages={fetchMessages}
                      pinnedChats={pinnedChats}
                      togglePinChat={togglePinChat}
                      isTyping={isTyping}
                      onTyping={handleTyping}
                    />
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
        )}

        {/* User Profile Dialog */}
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">User Profile</DialogTitle>
            </DialogHeader>
            {loadingProfile ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : selectedUserProfile ? (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl">
                    {selectedUserProfile.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedUserProfile.name}</h3>
                    {selectedUserProfile.can_see_email ? (
                      <p className="text-slate-400">{selectedUserProfile.email}</p>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => requestUserEmail(selectedUserProfile.id)}
                        className="text-orange-400 hover:text-orange-300 p-0 h-auto"
                      >
                        Request Email
                      </Button>
                    )}
                    {selectedUserProfile.college && (
                      <Badge variant="outline" className="mt-2 border-slate-600 text-slate-300">
                        {selectedUserProfile.college}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-4 text-center border border-yellow-500/30">
                    <Award className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gradient">{selectedUserProfile.mentis_score || 0}</p>
                    <p className="text-xs text-slate-300">Mentis Score</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <Link2 className="w-5 h-5 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedUserProfile.connections_count || 0}</p>
                    <p className="text-xs text-slate-400">Connections</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <BookOpen className="w-5 h-5 text-orange-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedUserProfile.resources_count || 0}</p>
                    <p className="text-xs text-slate-400">Approved Resources</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">
                      {new Date(selectedUserProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-400">Member Since</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {selectedUserProfile.connection_status === 'accepted' ? (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        const conn = connections.find(c => 
                          c.other_user?.id === selectedUserProfile.id
                        );
                        if (conn) {
                          openChat(conn);
                          setProfileDialogOpen(false);
                        }
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  ) : selectedUserProfile.connection_status === 'pending' ? (
                    selectedUserProfile.is_requester ? (
                      <Badge className="bg-yellow-600 px-4 py-2">Request Pending</Badge>
                    ) : (
                      <>
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            acceptRequest(selectedUserProfile.connection_id);
                            setProfileDialogOpen(false);
                          }}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button 
                          variant="destructive"
                          className="flex-1"
                          onClick={() => {
                            rejectRequest(selectedUserProfile.connection_id);
                            setProfileDialogOpen(false);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )
                  ) : (
                    <Button 
                      className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                      onClick={() => {
                        sendConnectionRequest(selectedUserProfile.id);
                        setProfileDialogOpen(false);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>

                {/* Report User Button */}
                <div className="pt-4 border-t border-slate-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => {
                      setProfileDialogOpen(false);
                      openReportDialog(selectedUserProfile.id);
                    }}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report User
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Report User Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-400" />
                Report User
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">
                Please provide details about the misconduct. Your report will be reviewed by our admin team.
              </p>
              
              <div>
                <Label className="text-slate-300">Reason for Report</Label>
                <Select 
                  value={reportForm.reason} 
                  onValueChange={(value) => setReportForm({...reportForm, reason: value})}
                >
                  <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                    <SelectItem value="impersonation">Impersonation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-slate-300">Description</Label>
                <Textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                  className="mt-2 bg-slate-800 border-slate-700 text-white"
                  rows={4}
                  placeholder="Please describe the issue in detail..."
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-700"
                  onClick={() => setReportDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={submitReport}
                >
                  Submit Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ConnectPage;
