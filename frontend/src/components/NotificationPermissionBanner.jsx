import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Settings, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import pushService from '@/services/PushNotificationService';

const NotificationPermissionBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [granted, setGranted] = useState(false);
  const [promptAttempted, setPromptAttempted] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const isNativeApp = typeof window !== 'undefined' && !!window.MentisNative;
    setIsNative(isNativeApp);

    const checkPermission = () => {
      if (isNativeApp) {
        const hasPerm = window.MentisNative.hasNotificationPermission();
        setGranted(hasPerm);
        // If not granted and not dismissed in this session, show banner
        const dismissed = sessionStorage.getItem('mentis_notif_banner_dismissed');
        if (!hasPerm && !dismissed) {
          setShowBanner(true);
        } else if (hasPerm) {
          setShowBanner(false);
        }
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = Notification.permission;
        setGranted(perm === 'granted');
        const dismissed = sessionStorage.getItem('mentis_notif_banner_dismissed');
        if (perm === 'default' && !dismissed) {
          setShowBanner(true);
        } else if (perm === 'granted') {
          setShowBanner(false);
        }
      }
    };

    checkPermission();

    // Listen for native permission changes (from MainActivity / Settings)
    const handlePermChange = (e) => {
      if (e.detail && e.detail.granted) {
        setGranted(true);
        setPromptAttempted(false);
        setTimeout(() => setShowBanner(false), 2000);
      }
    };

    window.addEventListener('mentis_permission_changed', handlePermChange);
    window.addEventListener('focus', checkPermission);

    return () => {
      window.removeEventListener('mentis_permission_changed', handlePermChange);
      window.removeEventListener('focus', checkPermission);
    };
  }, []);

  const handleEnableClick = async () => {
    try {
      if (isNative && window.MentisNative) {
        if (window.MentisNative.promptOrOpenSettings) {
          window.MentisNative.promptOrOpenSettings();
        } else {
          window.MentisNative.requestNotificationPermission();
        }
        setPromptAttempted(true);

        // Check if granted immediately
        setTimeout(() => {
          if (window.MentisNative && window.MentisNative.hasNotificationPermission()) {
            setGranted(true);
            setTimeout(() => setShowBanner(false), 2000);
          }
        }, 1000);
      } else {
        await pushService.subscribe();
        if (Notification.permission === 'granted') {
          setGranted(true);
          setTimeout(() => setShowBanner(false), 2000);
        }
      }
    } catch (e) {
      console.warn('Banner permission request error:', e);
    }
  };

  const handleOpenSettings = () => {
    if (isNative && window.MentisNative) {
      window.MentisNative.openNotificationSettings();
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('mentis_notif_banner_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-16 sm:top-20 left-0 right-0 z-40 px-3 py-2 bg-gradient-to-r from-orange-600/95 via-amber-600/95 to-orange-700/95 text-white shadow-xl backdrop-blur-md border-b border-orange-400/30 transition-all duration-300 animate-in slide-in-from-top-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-2">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 rounded-xl bg-white/20 text-white shrink-0">
            {granted ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <BellRing className="w-5 h-5 animate-bounce" />}
          </div>
          <div className="text-xs sm:text-sm">
            {granted ? (
              <span className="font-semibold text-emerald-200">
                ✓ Notifications are enabled! You will receive live alerts for Mathmate messages.
              </span>
            ) : promptAttempted ? (
              <span>
                <strong className="font-semibold">Almost there!</strong> If Android didn't show the permission popup, please tap <strong>Open Settings</strong> to allow notifications.
              </span>
            ) : (
              <span>
                <strong className="font-semibold">Stay in the loop:</strong> Enable device notifications to get instant alerts for Mathmate messages & study groups.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {!granted && (
            <>
              {promptAttempted ? (
                <Button
                  size="sm"
                  onClick={handleOpenSettings}
                  className="bg-white text-orange-700 hover:bg-orange-50 font-semibold text-xs px-3 py-1.5 h-8 shadow-sm flex items-center gap-1.5 rounded-lg"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Open Settings
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleEnableClick}
                  className="bg-white text-orange-700 hover:bg-orange-50 font-semibold text-xs px-3 py-1.5 h-8 shadow-sm flex items-center gap-1.5 rounded-lg"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Allow Notifications
                </Button>
              )}
            </>
          )}

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Dismiss notification banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;
