import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      icon: 'fas fa-home',
      activeColor: 'text-primary-500'
    },
    {
      path: '/mall',
      icon: 'fas fa-store',
      activeColor: 'text-secondary-500'
    },
    {
      path: '/publish',
      icon: 'fas fa-plus',
      activeColor: 'text-primary-500',
      isPublish: true
    },
    {
      path: '/profile',
      icon: 'fas fa-user',
      activeColor: 'text-purple-500'
    }
  ];

  return (
    <div className="bottom-navigation fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                item.isPublish
                  ? 'bg-primary-500 text-white shadow-lg hover:bg-primary-600'
                  : isActive 
                    ? `${item.activeColor} bg-gray-50` 
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className={`${item.icon} text-2xl`}></i>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
