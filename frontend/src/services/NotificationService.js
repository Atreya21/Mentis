// Mentis Notification Service
// Enhanced for PWA and mobile browser support

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.supported = (typeof window !== 'undefined' && !!window.MentisNative) || ('Notification' in window);
    this.swRegistration = null;
  }

  isNative() {
    return typeof window !== 'undefined' && !!window.MentisNative;
  }

  // Check if notifications are supported and get permission status
  async init() {
    if (this.isNative()) {
      const granted = window.MentisNative.hasNotificationPermission();
      this.permission = granted ? 'granted' : 'default';
      return granted;
    }

    if (!this.supported) {
      console.log('Mentis Notifications: Not supported in this browser');
      return false;
    }
    
    this.permission = Notification.permission;
    
    // Get service worker registration for PWA notifications
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.ready;
        console.log('Mentis Notifications: Service Worker ready');
      } catch (err) {
        console.log('Mentis Notifications: Service Worker not ready', err);
      }
    }
    
    if (this.permission === 'default') {
      // Don't auto-request, wait for user action
      return false;
    }
    
    return this.permission === 'granted';
  }

  // Request notification permission from user
  async requestPermission() {
    if (this.isNative()) {
      window.MentisNative.requestNotificationPermission();
      const granted = window.MentisNative.hasNotificationPermission();
      this.permission = granted ? 'granted' : 'default';
      return this.permission;
    }

    if (!this.supported) return 'denied';
    
    try {
      this.permission = await Notification.requestPermission();
      console.log('Mentis Notifications: Permission', this.permission);
      return this.permission;
    } catch (err) {
      console.error('Mentis Notifications: Error requesting permission:', err);
      return 'denied';
    }
  }

  // Check if notifications are enabled
  isEnabled() {
    if (this.isNative()) {
      return window.MentisNative.hasNotificationPermission();
    }
    return this.supported && ('Notification' in window) && Notification.permission === 'granted';
  }

  // Show a notification (works for both PWA and regular browser)
  async show(title, options = {}) {
    if (this.isNative()) {
      window.MentisNative.showNotification(
        title, 
        options.body || '', 
        options.data?.url || '/connect'
      );
      return true;
    }

    if (!this.isEnabled()) {
      console.log('Mentis Notifications: Not enabled or permission not granted');
      return null;
    }

    try {
      // Ensure we have service worker registration
      if (!this.swRegistration && ('serviceWorker' in navigator)) {
        try {
          this.swRegistration = await navigator.serviceWorker.ready;
        } catch (e) {
          console.warn('SW ready error in NotificationService:', e);
        }
      }

      const iconUrl = typeof window !== 'undefined' ? new URL('/icons/icon-192x192.png', window.location.origin).href : '/icons/icon-192x192.png';
      const badgeUrl = typeof window !== 'undefined' ? new URL('/icons/icon-72x72.png', window.location.origin).href : '/icons/icon-72x72.png';

      const defaultOptions = {
        icon: iconUrl,
        badge: badgeUrl,
        vibrate: [200, 100, 200],
        requireInteraction: true,
        silent: false,
        tag: options.tag || 'mentis-notification',
        renotify: true,
        data: options.data || { url: '/connect' },
        ...options
      };

      // Prioritize service worker showNotification (delivers to OS even when tab is backgrounded)
      if (this.swRegistration && 'showNotification' in this.swRegistration) {
        await this.swRegistration.showNotification(title, defaultOptions);
        console.log('Mentis Notifications: Shown via Service Worker');
        return true;
      }
      
      // Fallback to regular Notification API
      const notification = new Notification(title, defaultOptions);
      
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (options.data?.url && typeof window !== 'undefined') {
          window.location.href = options.data.url;
        }
        if (options.onClick) {
          options.onClick(event);
        }
        notification.close();
      };

      console.log('Mentis Notifications: Shown via Notification API');
      return notification;
    } catch (err) {
      console.error('Mentis Notifications: Error showing notification:', err);
      return null;
    }
  }

  // Check if running on mobile
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Check if running as installed PWA
  isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
  }

  // Show new message notification
  showNewMessage(senderName, messagePreview, connectionId) {
    const truncatedMessage = messagePreview.length > 100 
      ? messagePreview.substring(0, 100) + '...' 
      : messagePreview;
      
    return this.show(`New message from ${senderName}`, {
      body: truncatedMessage,
      tag: `message-${connectionId}`,
      data: { 
        type: 'message', 
        connectionId,
        url: `/connect?chat=${connectionId}`
      },
      onClick: () => {
        window.location.href = `/connect?chat=${connectionId}`;
      }
    });
  }

  // Show connection request notification
  showConnectionRequest(requesterName, requesterId) {
    return this.show('Connection Request', {
      body: `${requesterName} wants to connect with you!`,
      tag: `connection-request-${requesterId}`,
      data: { 
        type: 'connection_request', 
        requesterId,
        url: '/connect'
      },
      onClick: () => {
        window.location.href = '/connect';
      }
    });
  }

  // Show connection accepted notification
  showConnectionAccepted(userName) {
    return this.show('Connection Accepted', {
      body: `${userName} accepted your connection request!`,
      tag: 'connection-accepted',
      data: { 
        type: 'connection_accepted',
        url: '/connect'
      },
      onClick: () => {
        window.location.href = '/connect';
      }
    });
  }

  // Show resource approved notification
  showResourceApproved(resourceTitle) {
    return this.show('Resource Approved!', {
      body: `Your resource "${resourceTitle}" has been approved and is now live!`,
      tag: 'resource-approved',
      data: { 
        type: 'resource_approved',
        url: '/resources'
      },
      onClick: () => {
        window.location.href = '/resources';
      }
    });
  }

  // Show VEX approved notification
  showVEXApproved(caption) {
    const truncatedCaption = caption.length > 50 
      ? caption.substring(0, 50) + '...' 
      : caption;
      
    return this.show('VEX Approved!', {
      body: `Your VEX "${truncatedCaption}" has been approved!`,
      tag: 'vex-approved',
      data: { 
        type: 'vex_approved',
        url: '/reels'
      },
      onClick: () => {
        window.location.href = '/reels';
      }
    });
  }

  // Trigger update check for PWA
  async checkForUpdates() {
    if (this.swRegistration) {
      try {
        await this.swRegistration.update();
        console.log('Mentis: Checked for updates');
      } catch (err) {
        console.log('Mentis: Update check failed', err);
      }
    }
  }

  // Skip waiting for new service worker
  async skipWaiting() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
