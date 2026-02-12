
import React, { useState, useEffect } from 'react';
import Icon from '../../shared/components/Icon';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if dismissed recently (7 days)
      const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (lastDismissed) {
          const days = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
          if (days < 7) return;
      }
      
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 z-prompt pointer-events-none">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 animate-in slide-in-from-bottom-4 duration-500 pointer-events-auto max-w-sm">
        <div className="flex items-start gap-3">
          <div className="bg-gray-100 p-2 rounded-lg text-gray-700">
             <Icon name="download" size="sm" />
          </div>
          <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900">Install App</h4>
              <p className="text-xs text-gray-500 mt-0.5 mb-3 leading-relaxed">
                  Add to home screen for offline access and better performance.
              </p>
              <div className="flex gap-2">
                  <button 
                      onClick={handleInstall}
                      className="flex-1 bg-gray-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-black transition-colors"
                  >
                      Install
                  </button>
                  <button 
                      onClick={handleDismiss}
                      className="flex-1 bg-gray-100 text-gray-600 text-xs font-bold py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                      Not Now
                  </button>
              </div>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
              <Icon name="x" size="sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
