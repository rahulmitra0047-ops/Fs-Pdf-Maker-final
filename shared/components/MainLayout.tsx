
import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Outlet />
      <BottomNav />
    </div>
  );
};

export default MainLayout;
