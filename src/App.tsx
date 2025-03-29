
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import CreateStory from './pages/CreateStory';
import StoryCreatorPage from './pages/StoryCreator';
import StoryViewer from './components/story-viewer/StoryViewer';
import MyStories from './pages/MyStories';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import Admin from './pages/Admin';
import EditStory from './pages/EditStory';
import CharacterPage from './pages/CharacterPage';
import ThemePage from './pages/ThemePage';
import NotFoundPage from './pages/NotFoundPage';
import { Toaster } from "sonner";

function App() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Simulate initialization process
    setTimeout(() => {
      setIsInitialized(true);
    }, 500);
  }, []);

  return (
    <Router>
      <Toaster richColors position="bottom-center" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/characters" element={<CharacterPage />} />
        <Route path="/themes" element={<ThemePage />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/create-story"
          element={user ? <CreateStory /> : <Navigate to="/login" />}
        />
        <Route
          path="/story-creator"
          element={user ? <StoryCreatorPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-stories"
          element={user ? <MyStories /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={user ? <Admin /> : <Navigate to="/login" />}
        />
        <Route
          path="/edit-story/:id"
          element={user ? <EditStory /> : <Navigate to="/login" />}
        />
        
        {/* Fix the StoryViewer routes - they don't need the story prop anymore as they use param id */}
        <Route 
          path="/stories/:id" 
          element={<StoryViewer />} 
        />
        <Route 
          path="/view-story" 
          element={<StoryViewer />} 
        />
        
        {/* Not Found Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
