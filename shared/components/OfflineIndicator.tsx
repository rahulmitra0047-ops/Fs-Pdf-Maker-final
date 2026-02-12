import React, { useState, useEffect } from 'react';
import Icon from './Icon';

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };
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

  if (dismissed && isOffline) return null;

  // Render nothing if online and not showing the "back online" toast
  if (!isOffline && !showBackOnline) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[40] pointer-events-none flex flex-col gap-2 items-start">
      {isOffline && (
        <div className="pointer-events-auto bg-gray-900/95 backdrop-blur text-white text-xs font-medium py-2 pl-4 pr-2 rounded-full flex items-center gap-3 shadow-xl animate-in slide-in-from-bottom-2 border border-white/10">
          <Icon name="log-out" size="sm" className="w-3.5 h-3.5 text-red-400" />
          <span>Offline Mode</span>
          <button 
            onClick={() => setDismissed(true)} 
            className="p-1 hover:bg-white/20 rounded-full transition-colors ml-1"
            aria-label="Dismiss offline message"
          >
            <Icon name="x" size="sm" className="w-3 h-3" />
          </button>
        </div>
      )}

      {showBackOnline && (
        <div className="pointer-events-auto bg-green-600/95 backdrop-blur text-white text-xs font-medium py-2 px-4 rounded-full flex items-center gap-2 shadow-xl animate-in slide-in-from-bottom-2 fade-out duration-1000 delay-2000 fill-mode-forwards border border-white/10">
          <Icon name="refresh-cw" size="sm" className="w-3.5 h-3.5" />
          <span>Back online</span>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;