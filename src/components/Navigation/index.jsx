import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookMedical, faUsers, faStore, faUser } from '@fortawesome/free-solid-svg-icons';
import './index.css';

const Navigation = ({ currentPath }) => {
  const navItems = [
    { path: '/', icon: faBookMedical, label: '资源' },
    { path: '/social', icon: faUsers, label: '互动' },
    { path: '/shop', icon: faStore, label: '商城' },
    { path: '/profile', icon: faUser, label: '我的' }
  ];

  return (
    <nav className="navigation">
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={item.icon} className="nav-icon" />
          <span className="nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default Navigation;
