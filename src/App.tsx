
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import Auth from './pages/Auth';
import StoryCreator from './pages/StoryCreator';
import Library from './pages/Library';
import StoryViewer from './components/StoryViewer';
import Admin from './pages/Admin';
import Planos from './pages/Planos';
import Subscription from './pages/Subscription';
import CreateStory from './pages/CreateStory';
import MyStories from './pages/MyStories';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/story/create" element={<StoryCreator />} />
      <Route path="/story/:id" element={<StoryViewer />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/planos" element={<Planos />} />
      <Route 
        path="/create-story" 
        element={<CreateStory />} 
      />
      <Route
        path="/subscription"
        element={user ? <Subscription /> : <Navigate to="/login" />}
      />
      <Route 
        path="/library" 
        element={user ? <Library /> : <Navigate to="/login" />} 
      />
      <Route
        path="/my-stories"
        element={user ? <MyStories /> : <Navigate to="/login" />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Auth type="login" />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" /> : <Auth type="register" />}
      />
      <Route
        path="/auth"
        element={user ? <Navigate to="/" /> : <Auth />}
      />
    </Routes>
  );
}

export default App;
