
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const isActive = (route: string) => {
    // Exact match for root/home paths to avoid highlighting on sub-routes incorrectly if needed
    if (route === '/home') return path === '/home';
    if (route === '/learn') return path === '/learn';
    if (route === '/practice') return path === '/practice';
    // For modules with sub-routes
    return path.startsWith(route);
  };

  const navItemClass = (active: boolean) => 
    `flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${active ? 'text-[#6366F1]' : 'text-gray-400 hover:text-gray-600'}`;

  const iconContainerClass = (active: boolean) => 
    `p-1.5 rounded-full ${active ? 'bg-indigo-50' : 'bg-transparent'}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50 pb-safe flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      
      {/* 1. Live MCQ */}
      <button 
        onClick={() => navigate('/live-mcq/topics')}
        className={navItemClass(isActive('/live-mcq'))}
      >
        <div className={iconContainerClass(isActive('/live-mcq'))}>
            <Icon name="book-open" size="md" strokeWidth={isActive('/live-mcq') ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-bold">Live MCQ</span>
      </button>

      {/* 2. PDF */}
      <button 
        onClick={() => navigate('/create')}
        className={navItemClass(isActive('/create'))}
      >
        <div className={iconContainerClass(isActive('/create'))}>
            <Icon name="file-text" size="md" strokeWidth={isActive('/create') ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-bold">PDF</span>
      </button>

      {/* 3. Home */}
      <button 
        onClick={() => navigate('/home')}
        className={navItemClass(isActive('/home'))}
      >
        <div className={iconContainerClass(isActive('/home'))}>
            <Icon name="home" size="md" strokeWidth={isActive('/home') ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-bold">Home</span>
      </button>

      {/* 4. Learn */}
      <button 
        onClick={() => navigate('/learn')}
        className={navItemClass(isActive('/learn'))}
      >
        <div className={iconContainerClass(isActive('/learn'))}>
            <Icon name="book" size="md" strokeWidth={isActive('/learn') ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-bold">Learn</span>
      </button>

      {/* 5. Practice */}
      <button 
        onClick={() => navigate('/practice')}
        className={navItemClass(isActive('/practice'))}
      >
        <div className={iconContainerClass(isActive('/practice'))}>
            <Icon name="pencil" size="md" strokeWidth={isActive('/practice') ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-bold">Practice</span>
      </button>

    </div>
  );
};

export default BottomNav;
