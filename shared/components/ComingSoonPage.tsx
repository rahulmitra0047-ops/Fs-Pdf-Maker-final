
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';

const ComingSoonPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  let title = "Coming Soon";
  if (location.pathname.includes('home')) title = "Home";
  if (location.pathname.includes('learn')) title = "Learn";
  if (location.pathname.includes('practice')) title = "Practice";

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-[60px] pb-20">
      {/* Root Header - No Back Button, Has Settings */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-5 flex items-center justify-between transition-all">
          {/* Spacer for alignment */}
          <div className="w-10"></div>
          
          <h1 className="text-[18px] font-semibold text-[#111827] absolute left-1/2 -translate-x-1/2 tracking-tight">
              {title}
          </h1>
          
          <div className="flex items-center gap-2">
              <button 
                  onClick={() => navigate('/settings')}
                  className="p-2 -mr-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
              >
                  <Icon name="settings" size="md" />
              </button>
          </div>
      </header>

      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in p-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <Icon name="clock" size="lg" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-2">Coming Soon</h2>
        <p className="text-sm text-gray-500 max-w-xs">
            We are working hard to bring you the {title} experience. Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default ComingSoonPage;
