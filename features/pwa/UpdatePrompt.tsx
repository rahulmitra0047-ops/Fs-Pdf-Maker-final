import React, { useState, useEffect } from 'react';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumButton from '../../shared/components/PremiumButton';
import Icon from '../../shared/components/Icon';

const UpdatePrompt: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    const handler = () => setShowUpdate(true);
    window.addEventListener('pwa-update-available', handler);
    return () => window.removeEventListener('pwa-update-available', handler);
  }, []);

  const handleUpdate = () => {
    if (navigator.serviceWorker.controller) {
        // Send message to SW to skip waiting (if implemented) or just reload
        // Standard reload usually fetches fresh SW if configured correctly
        window.location.reload();
    }
  };

  return (
    <PremiumModal isOpen={showUpdate} onClose={() => setShowUpdate(false)} title="Update Available" size="sm">
      <div className="flex flex-col items-center text-center space-y-4 pt-2">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 animate-pulse">
           <Icon name="refresh-cw" size="lg" />
        </div>
        
        <div>
            <h3 className="text-lg font-bold text-gray-900">New Version Ready</h3>
            <p className="text-sm text-gray-500 mt-1">
                A new version of FS PDF Maker is available. Update now for the latest features.
            </p>
        </div>

        <div className="flex gap-3 w-full pt-2">
            <PremiumButton variant="ghost" onClick={() => setShowUpdate(false)} className="flex-1">
                Later
            </PremiumButton>
            <PremiumButton onClick={handleUpdate} className="flex-1 shadow-lg shadow-indigo-200">
                Update Now
            </PremiumButton>
        </div>
      </div>
    </PremiumModal>
  );
};

export default UpdatePrompt;