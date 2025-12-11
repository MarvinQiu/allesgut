import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import Social from './pages/Social';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import Address from './pages/Address';
import './styles/App.css';

const App = () => {
  const location = useLocation();

  return (
    <div className="app">
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Resources />} />
          <Route path="/resource/:id" element={<ResourceDetail />} />
          <Route path="/social" element={<Social />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/address" element={<Address />} />
          <Route path="/profile/edit" element={<Profile />} />
          <Route path="/profile/security" element={<Profile />} />
          <Route path="/profile/preferences" element={<Profile />} />
        </Routes>
      </main>
      <Navigation currentPath={location.pathname} />
    </div>
  );
};

export default App;