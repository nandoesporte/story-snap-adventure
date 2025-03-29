
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import CreateStory from './pages/CreateStory';
import StoryCreator from './components/StoryCreator';
import MyStories from './pages/MyStories';
import StoryViewer from './components/StoryViewer';
import NotFound from './pages/NotFound';
import StoryBot from './pages/StoryBot';
import Characters from './pages/Characters';
import Admin from './pages/Admin';
import Subscription from './pages/Subscription';
import { initializeDatabaseStructure } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a stable QueryClient instance outside the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Use this component in main.tsx
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

// The actual app content, now wrapped by QueryClientProvider in the App component
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Important: Only use hooks inside this component body, not in conditionals or loops
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDatabaseStructure();
        setIsInitialized(true);
      } catch (error) {
        console.error("Erro ao inicializar a estrutura do banco de dados:", error);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (!authLoading && !user && 
        location.pathname !== '/auth' && 
        !location.pathname.startsWith('/view-story')) {
      // Allow viewing stories without login
      navigate('/auth');
    }
  }, [user, authLoading, navigate, location]);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-story" element={<CreateStory />} />
        <Route path="/story-creator" element={<StoryCreator />} />
        <Route path="/my-stories" element={<MyStories />} />
        <Route path="/view-story/:id" element={<StoryViewer />} />
        <Route path="/view-story" element={<StoryViewer />} />
        <Route path="/storybot" element={<StoryBot />} />
        <Route path="/characters" element={<Characters />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
