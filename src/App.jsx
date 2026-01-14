import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Mall from './pages/Mall';
import Profile from './pages/Profile';
import Publish from './pages/Publish';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="mall" element={<Mall />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="publish" element={<Publish />} />
      </Routes>
    </div>
  );
}

export default App;
