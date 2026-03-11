// Mentis Push Notification Service
// Handles Web Push subscriptions and notifications

const API = process.env.REACT_APP_BACKEND_URL + '/api';

class PushNotificationService {
  constructor() {
    this.swRegistration = null;
    this.subscription = null;
    this.permission = 'default';
    this.supported = 'PushManager' in window && 'serviceWorker' in navigator;
  }

  // Initialize the service
  async init() {
    if (!this.supported) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      // Wait for service worker to be ready
      this.swRegistration = await navigator.serviceWorker.ready;
      this.permission = Notification.permission;
      
      // Check if already subscribed
      this.subscription = await this.swRegistration.pushManager.getSubscription();
      
      console.log('Push service initialized, permission:', this.permission);
      console.log('Existing subscription:', !!this.subscription);
      
      return this.permission === 'granted' && !!this.subscription;
    } catch (err) {
      console.error('Failed to initialize push service:', err);
      return false;
    }
  }

  // Check if push is enabled
  isEnabled() {
    return this.supported && this.permission === 'granted' && !!this.subscription;
  }

  // Request permission and subscribe
  async subscribe() {
    if (!this.supported) {
      throw new Error('Push notifications not supported');
    }

    try {
      // Request notification permission
      this.permission = await Notification.requestPermission();
      
      if (this.permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Get VAPID public key from server
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/push/vapid-public-key`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get VAPID key');
      }
      
      const { publicKey } = await response.json();
      
      if (!publicKey) {
        throw new Error('VAPID public key not configured');
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(publicKey);

      // Subscribe to push
      this.subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log('Push subscription created:', this.subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      return true;
    } catch (err) {
      console.error('Failed to subscribe to push:', err);
      throw err;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.subscription) {
      return true;
    }

    try {
      // Remove from server
      await this.removeSubscriptionFromServer(this.subscription);

      // Unsubscribe locally
      await this.subscription.unsubscribe();
      this.subscription = null;

      console.log('Unsubscribed from push notifications');
      return true;
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
      throw err;
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: this.arrayBufferToBase64(subscription.getKey('auth'))
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription on server');
    }

    console.log('Subscription saved to server');
  }

  // Remove subscription from server
  async removeSubscriptionFromServer(subscription) {
    const token = localStorage.getItem('token');
    
    await fetch(`${API}/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: this.arrayBufferToBase64(subscription.getKey('auth'))
          }
        }
      })
    });
  }

  // Send test notification
  async sendTestNotification() {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API}/push/test`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to send test notification');
    }

    return true;
  }

  // Helper: Convert URL-safe base64 to Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Helper: Convert ArrayBuffer to base64
  arrayBufferToBase64(buffer) {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // Show local notification (fallback when page is active)
  showLocalNotification(title, options = {}) {
    if (this.permission !== 'granted') return;

    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      ...options
    };

    // Use service worker notification if available
    if (this.swRegistration) {
      this.swRegistration.showNotification(title, defaultOptions);
    } else {
      new Notification(title, defaultOptions);
    }
  }
}

// Create singleton instance
const pushService = new PushNotificationService();

export default pushService;
