
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const isActive = (route: string) => {
    if (route === '/home') return path === '/home';
    if (route === '/learn') return path === '/learn';
    if (route === '/settings') return path === '/settings';
    return path.startsWith(route);
  };

  const navItemClass = (active: boolean) => 
    `flex flex-col items-center gap-1 w-1/5 group cursor-pointer transition-colors ${active ? 'text-slate-700' : 'text-slate-400 hover:text-slate-600'}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-md border-t border-slate-200 pb-8 pt-4 px-6 z-50">
      <ul className="flex justify-between items-end">
        
        {/* 1. Live MCQ */}
        <li 
          onClick={() => navigate('/live-mcq/topics')}
          className={navItemClass(isActive('/live-mcq'))}
        >
          <Icon name="book-open" size="lg" className="mb-0.5" />
          <span className="text-[10px] font-medium">Live MCQ</span>
        </li>

        {/* 2. PDF */}
        <li 
          onClick={() => navigate('/create')}
          className={navItemClass(isActive('/create'))}
        >
          <Icon name="file-text" size="lg" className="mb-0.5" />
          <span className="text-[10px] font-medium">PDF</span>
        </li>

        {/* 3. Home (Floating) */}
        <li 
          onClick={() => navigate('/home')}
          className="flex flex-col items-center gap-1 w-1/5 -mt-6 group cursor-pointer relative"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center absolute -top-10 group-hover:scale-110 transition-transform shadow-[0_4px_20px_-2px_rgba(16,185,129,0.2)] ${isActive('/home') ? 'bg-slate-700 text-white' : 'bg-slate-700/10 text-slate-700'}`}>
            <Icon name="home" size="lg" />
          </div>
          <span className={`text-[10px] font-bold mt-4 ${isActive('/home') ? 'text-slate-700' : 'text-slate-400'}`}>Home</span>
        </li>

        {/* 4. Learn */}
        <li 
          onClick={() => navigate('/learn')}
          className={navItemClass(isActive('/learn'))}
        >
          <Icon name="book" size="lg" className="mb-0.5" />
          <span className="text-[10px] font-medium">Learn</span>
        </li>

        {/* 5. Settings */}
        <li 
          onClick={() => navigate('/settings')}
          className={navItemClass(isActive('/settings'))}
        >
          <Icon name="settings" size="lg" className="mb-0.5" />
          <span className="text-[10px] font-medium">Settings</span>
        </li>

      </ul>
    </div>
  );
};

export default BottomNav;
