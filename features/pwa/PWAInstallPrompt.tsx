
import React, { useState, useEffect } from 'react';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumButton from '../../shared/components/PremiumButton';
import Icon from '../../shared/components/Icon';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent standard mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      // Show our custom prompt if not already installed/dismissed recently
      const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!hasDismissed) {
          setIsOpen(true);
      }
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
    setIsOpen(false);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    // Hide for 7 days
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (!isOpen) return null;

  return (
    <PremiumModal isOpen={isOpen} onClose={handleDismiss} title="Install App" size="sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
           <Icon name="download" size="xl" />
        </div>
        
        <div>
            <h3 className="text-lg font-bold text-gray-900">Install FS PDF Maker</h3>
            <p className="text-sm text-gray-500 mt-1">
                Install our app for a better experience, offline access, and faster performance.
            </p>
        </div>

        <div className="flex gap-3 w-full pt-2">
            <PremiumButton variant="ghost" onClick={handleDismiss} className="flex-1">
                Not Now
            </PremiumButton>
            <PremiumButton onClick={handleInstall} className="flex-1 shadow-lg shadow-indigo-200">
                Install App
            </PremiumButton>
        </div>
      </div>
    </PremiumModal>
  );
};

export default PWAInstallPrompt;
