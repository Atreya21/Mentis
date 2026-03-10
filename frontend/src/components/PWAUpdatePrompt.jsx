// PWA Update Prompt Component
// Shows a toast when a new version of the app is available

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PWAUpdatePrompt = () => {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Listen for new service worker
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates every 5 minutes
        setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000);

        // Listen for new service worker waiting
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              setWaitingWorker(newWorker);
              setShowReload(true);
              
              toast('Update Available!', {
                description: 'A new version of Mentis is available.',
                duration: 10000,
                action: {
                  label: 'Update Now',
                  onClick: () => reloadPage()
                }
              });
            }
          });
        });
      });

      // Handle controller change (when skipWaiting is called)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const reloadPage = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  if (!showReload) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-slate-800 border border-orange-500 rounded-lg p-4 shadow-lg max-w-xs">
      <div className="flex items-center gap-3">
        <RefreshCw className="w-5 h-5 text-orange-400 animate-spin" />
        <div className="flex-1">
          <p className="text-white text-sm font-medium">Update Available</p>
          <p className="text-slate-400 text-xs">Click to get the latest version</p>
        </div>
        <Button 
          size="sm" 
          onClick={reloadPage}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Update
        </Button>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;
