import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import audioChime from '@/utils/audioChime';
import notificationService from '@/services/NotificationService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL ? BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://') : '';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children, user }) => {
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChatId, setActiveChatId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [popups, setPopups] = useState([]);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const listenersRef = useRef(new Map()); // eventType -> Set of callbacks
  const activeChatIdRef = useRef(null);

  // Sync ref with state
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Fetch unread messages count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API}/messages/unread/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.warn('Failed to fetch unread count:', err?.message);
    }
  }, [user]);

  // Add a popup notification (capped at 4)
  const addPopup = useCallback((popup) => {
    const newPopup = {
      ...popup,
      id: popup.id || `popup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      duration: popup.duration || 6000
    };

    setPopups(prev => {
      // Don't duplicate popup with identical tag or id
      const filtered = prev.filter(p => p.id !== newPopup.id);
      return [newPopup, ...filtered].slice(0, 4);
    });
  }, []);

  // Dismiss a popup notification
  const dismissPopup = useCallback((id) => {
    setPopups(prev => prev.filter(p => p.id !== id));
  }, []);

  // Clear all popups
  const clearAllPopups = useCallback(() => {
    setPopups([]);
  }, []);

  // Subscribe to specific WebSocket events
  const subscribe = useCallback((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType).add(callback);

    return () => {
      if (listenersRef.current.has(eventType)) {
        listenersRef.current.get(eventType).delete(callback);
      }
    };
  }, []);

  // Dispatch an incoming WebSocket event to all registered listeners
  const dispatchEvent = useCallback((type, data) => {
    if (listenersRef.current.has(type)) {
      listenersRef.current.get(type).forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in WebSocket listener for ${type}:`, err);
        }
      });
    }
  }, []);

  // Send typing notification
  const sendTyping = useCallback((connectionId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        connection_id: connectionId
      }));
    }
  }, []);

  // Request updated online users
  const refreshOnlineUsers = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'get_online_users'
      }));
    }
  }, []);

  // WebSocket Connection Management
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token || !WS_URL) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
      return;
    }

    let isSubscribed = true;

    const connect = () => {
      if (!isSubscribed) return;

      try {
        const ws = new WebSocket(`${WS_URL}/ws/${token}`);

        ws.onopen = () => {
          if (!isSubscribed) {
            ws.close();
            return;
          }
          console.log('⚡ Mentis Global WebSocket connected');
          wsRef.current = ws;
          setConnected(true);

          // Start 25s heartbeat ping to keep Render connection alive
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type } = data;

            // Dispatch to registered event listeners
            dispatchEvent(type, data);

            // Handle specific system actions
            if (type === 'new_message') {
              const msg = data.message;
              const isCurrentlyActiveInChat = 
                activeChatIdRef.current === msg.connection_id && 
                window.location.pathname === '/connect' && 
                !document.hidden;

              // If NOT actively chatting in this exact conversation right now, notify the user!
              if (!isCurrentlyActiveInChat) {
                // Play notification chime
                audioChime.playNotificationSound();

                // Increment unread count
                setUnreadCount(prev => prev + 1);

                // Native Desktop / PWA background notification
                if (document.hidden) {
                  const preview = msg.content || (msg.attachment ? `Sent an attachment (${msg.attachment.file_type || 'file'})` : 'New message');
                  notificationService.showNewMessage(msg.sender_name || 'Mathmate', preview, msg.connection_id);
                }

                // In-App floating interactive pop-up
                addPopup({
                  id: `msg-${msg.id || Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  type: 'new_message',
                  title: msg.sender_name || 'Mathmate',
                  subtitle: 'New message',
                  content: msg.content || (msg.attachment ? `📎 Sent an attachment (${msg.attachment.file_type || 'file'})` : 'Sent a message'),
                  attachment: msg.attachment,
                  connectionId: msg.connection_id,
                  avatarLetter: (msg.sender_name || 'M').charAt(0).toUpperCase(),
                  url: `/connect?chat=${msg.connection_id}`
                });
              }
            } else if (type === 'group_message') {
              const msg = data.message;
              // Check if user is currently inside this group
              const isGroupActive = 
                window.location.pathname === '/connect' && 
                window.location.search.includes(data.group_id) && 
                !document.hidden;

              if (!isGroupActive) {
                audioChime.playNotificationSound();
                if (document.hidden) {
                  notificationService.show(`New message in ${data.group_name || 'Group'}`, {
                    body: `${msg.sender_name || 'Member'}: ${msg.content || 'Sent a file'}`,
                    tag: `group-${data.group_id}`
                  });
                }
                addPopup({
                  id: `grp-${msg.id || Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  type: 'group_message',
                  title: data.group_name || 'Group Chat',
                  subtitle: `From ${msg.sender_name || 'Member'}`,
                  content: msg.content || (msg.attachment ? `📎 Attachment` : 'New group message'),
                  attachment: msg.attachment,
                  groupId: data.group_id,
                  avatarLetter: (data.group_name || 'G').charAt(0).toUpperCase(),
                  url: `/connect?tab=groups&group=${data.group_id}`
                });
              }
            } else if (type === 'connection_request') {
              audioChime.playNotificationSound();
              addPopup({
                id: `conn-req-${data.connection_id || Date.now()}`,
                type: 'connection_request',
                title: 'New Connection Request',
                subtitle: data.from_user?.name || 'Someone',
                content: `${data.from_user?.name || 'A user'} wants to connect with you on Mathmate!`,
                avatarLetter: (data.from_user?.name || 'C').charAt(0).toUpperCase(),
                url: '/connect'
              });
            } else if (type === 'connection_accepted') {
              audioChime.playNotificationSound();
              addPopup({
                id: `conn-acc-${data.connection_id || Date.now()}`,
                type: 'connection_accepted',
                title: 'Connection Accepted! 🎉',
                subtitle: data.from_user?.name || 'Mathmate',
                content: `${data.from_user?.name || 'A user'} accepted your request. Start chatting now!`,
                avatarLetter: (data.from_user?.name || 'C').charAt(0).toUpperCase(),
                url: `/connect?chat=${data.connection_id}`
              });
            } else if (type === 'online_users') {
              if (Array.isArray(data.user_ids)) {
                setOnlineUsers(new Set(data.user_ids));
              }
            }
          } catch (err) {
            console.error('Error handling WebSocket message:', err);
          }
        };

        ws.onclose = (event) => {
          setConnected(false);
          clearInterval(pingIntervalRef.current);
          if (isSubscribed) {
            console.log('WebSocket closed. Reconnecting in 4s...');
            reconnectTimeoutRef.current = setTimeout(connect, 4000);
          }
        };

        ws.onerror = (err) => {
          console.warn('WebSocket connection error:', err?.message || 'closed');
          ws.close();
        };
      } catch (e) {
        console.error('Failed to create WebSocket:', e);
        if (isSubscribed) {
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
      }
    };

    connect();
    fetchUnreadCount();

    return () => {
      isSubscribed = false;
      clearInterval(pingIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, [user, fetchUnreadCount, addPopup, dispatchEvent]);

  const value = {
    connected,
    unreadCount,
    setUnreadCount,
    fetchUnreadCount,
    activeChatId,
    setActiveChatId,
    onlineUsers,
    popups,
    addPopup,
    dismissPopup,
    clearAllPopups,
    subscribe,
    sendTyping,
    refreshOnlineUsers
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
