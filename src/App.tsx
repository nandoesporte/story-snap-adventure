
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateStoryPage from './pages/CreateStoryPage';
import StoryCreatorPage from './pages/StoryCreatorPage';
import ViewStoryPage from './pages/ViewStoryPage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
import SubscriptionPlansPage from './pages/SubscriptionPlansPage';
import PublicLibraryPage from './pages/PublicLibraryPage';
import { StoryManager } from './components/admin/StoryManager';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create-story" element={<CreateStoryPage />} />
      <Route path="/story-creator" element={<StoryCreatorPage />} />
      <Route path="/view-story" element={<ViewStoryPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/planos" element={<SubscriptionPlansPage />} />
      <Route path="/biblioteca-publica" element={<PublicLibraryPage />} />
      <Route path="/admin/stories" element={<StoryManager />} />
    </Routes>
  );
}

export default App;
