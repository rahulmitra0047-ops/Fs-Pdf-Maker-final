import React, { useState, useEffect } from 'react';
import Icon from './Icon';

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gray-900 text-white text-xs font-medium py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top-1">
        <Icon name="log-out" size="sm" className="w-3 h-3" />
        <span>You are offline. Changes saved locally.</span>
      </div>
    );
  }

  if (showBackOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-green-600 text-white text-xs font-medium py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top-1 fade-out duration-1000 delay-2000 fill-mode-forwards">
        <Icon name="refresh-cw" size="sm" className="w-3 h-3" />
        <span>Back online. Syncing...</span>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;