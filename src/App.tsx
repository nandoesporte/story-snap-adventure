import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Account from './pages/Account';
import Story from './pages/Story';
import StoryViewer from './pages/StoryViewer';
import Admin from './pages/Admin';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/story" element={<Story />} />
      <Route path="/story/:id" element={<StoryViewer />} />
      <Route path="/admin" element={<Admin />} />
      <Route
        path="/account"
        element={user ? <Account /> : <Navigate to="/login" />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Auth type="login" />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" /> : <Auth type="register" />}
      />
    </Routes>
  );
}

export default App;
