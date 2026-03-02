
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  FileText, 
  Home, 
  Book, 
  Settings 
} from 'lucide-react';

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

  const tabs = [
    {
      id: 'live',
      label: 'MCQ',
      icon: BookOpen,
      route: '/live-mcq/topics',
      match: '/live-mcq'
    },
    {
      id: 'pdf',
      label: 'PDF',
      icon: FileText,
      route: '/create',
      match: '/create'
    },
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      route: '/home',
      match: '/home'
    },
    {
      id: 'learn',
      label: 'Learn',
      icon: Book,
      route: '/learn',
      match: '/learn'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      route: '/settings',
      match: '/settings'
    }
  ];

  return (
    <div className="fixed bottom-6 left-6 right-6 z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/50 h-[60px] flex items-center justify-between px-6 relative">
        {tabs.map((tab) => {
          const active = isActive(tab.match);
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.route)}
              className="relative flex flex-col items-center justify-center w-12 h-full group"
            >
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon 
                  size={20}
                  className={`transition-all duration-300 ${
                    active ? 'text-[#6C63FF]' : 'text-slate-400 group-hover:text-slate-500'
                  }`}
                  fill={active ? "currentColor" : "none"}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={`text-[9px] font-bold transition-colors duration-300 ${
                  active ? 'text-[#6C63FF]' : 'text-slate-400 group-hover:text-slate-500'
                }`}>
                  {tab.label}
                </span>
              </div>
              
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-[-4px] inset-y-2 bg-[#6C63FF]/5 rounded-xl -z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
