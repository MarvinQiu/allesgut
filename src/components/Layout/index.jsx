import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from '../BottomNavigation';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Layout;
