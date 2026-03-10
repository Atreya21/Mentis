// Mentis Notification Service
// Handles browser notifications for messages, connection requests, etc.

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.supported = 'Notification' in window;
  }

  // Check if notifications are supported and get permission status
  async init() {
    if (!this.supported) {
      console.log('Notifications not supported in this browser');
      return false;
    }
    
    this.permission = Notification.permission;
    
    if (this.permission === 'default') {
      // Request permission
      const result = await this.requestPermission();
      return result === 'granted';
    }
    
    return this.permission === 'granted';
  }

  // Request notification permission from user
  async requestPermission() {
    if (!this.supported) return 'denied';
    
    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  // Check if notifications are enabled
  isEnabled() {
    return this.supported && this.permission === 'granted';
  }

  // Show a notification
  show(title, options = {}) {
    if (!this.isEnabled()) {
      console.log('Notifications not enabled');
      return null;
    }

    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      requireInteraction: false,
      silent: false,
      tag: 'mentis-notification',
      renotify: true,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (options.onClick) {
          options.onClick(event);
        }
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
      
      return notification;
    } catch (err) {
      console.error('Error showing notification:', err);
      return null;
    }
  }

  // Show new message notification
  showNewMessage(senderName, messagePreview, connectionId) {
    return this.show(`New message from ${senderName}`, {
      body: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
      tag: `message-${connectionId}`,
      data: { type: 'message', connectionId },
      onClick: () => {
        window.location.href = `/connect?chat=${connectionId}`;
      }
    });
  }

  // Show connection request notification
  showConnectionRequest(requesterName, requesterId) {
    return this.show(`Connection Request`, {
      body: `${requesterName} wants to connect with you!`,
      tag: `connection-request-${requesterId}`,
      data: { type: 'connection_request', requesterId },
      onClick: () => {
        window.location.href = '/connect';
      }
    });
  }

  // Show connection accepted notification
  showConnectionAccepted(userName) {
    return this.show(`Connection Accepted`, {
      body: `${userName} accepted your connection request!`,
      tag: 'connection-accepted',
      data: { type: 'connection_accepted' },
      onClick: () => {
        window.location.href = '/connect';
      }
    });
  }

  // Show resource approved notification
  showResourceApproved(resourceTitle) {
    return this.show(`Resource Approved!`, {
      body: `Your resource "${resourceTitle}" has been approved and is now live!`,
      tag: 'resource-approved',
      data: { type: 'resource_approved' },
      onClick: () => {
        window.location.href = '/resources';
      }
    });
  }

  // Show VEX approved notification
  showVEXApproved(caption) {
    return this.show(`VEX Approved!`, {
      body: `Your VEX "${caption.substring(0, 50)}..." has been approved!`,
      tag: 'vex-approved',
      data: { type: 'vex_approved' },
      onClick: () => {
        window.location.href = '/reels';
      }
    });
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
