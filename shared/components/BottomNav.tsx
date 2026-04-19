
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
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-surface border-t border-border h-[64px] flex items-center justify-around px-2 min-w-full pb-safe">
        {tabs.map((tab) => {
          const active = isActive(tab.match);
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.route)}
              className="relative flex flex-col items-center justify-center w-full h-full group py-2"
            >
              <div className="relative z-10 flex flex-col items-center gap-1.5">
                <Icon 
                  size={22}
                  className={`transition-colors duration-200 ${
                    active ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'
                  }`}
                  strokeWidth={1.5}
                />
                {/* 
                  Hidden active indicator for minimal print style, 
                  or we can just keep the color difference.
                  The user requested active: Charcoal, inactive: Faded Ink 
                */}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
