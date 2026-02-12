
import React, { useState, useEffect } from 'react';
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
        window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-status pointer-events-none">
      <div className="bg-white rounded-xl shadow-2xl border border-indigo-100 p-4 animate-in slide-in-from-bottom-4 duration-500 flex items-center justify-between gap-4 pointer-events-auto max-w-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
             <Icon name="refresh-cw" size="sm" className="animate-spin-slow" />
          </div>
          <div>
              <h4 className="text-sm font-bold text-gray-900">Update Available</h4>
              <p className="text-xs text-gray-500">New features ready.</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => setShowUpdate(false)}
              className="text-xs font-medium text-gray-500 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
            >
              Dismiss
            </button>
            <button 
              onClick={handleUpdate}
              className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              Update
            </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
