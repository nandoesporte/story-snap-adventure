
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
import Settings from './pages/Settings';
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

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Modified redirect logic to exclude public routes
  useEffect(() => {
    const publicRoutes = ['/', '/auth', '/register'];
    const isPublicRoute = publicRoutes.includes(location.pathname);
    
    if (!loading && !user && !isPublicRoute) {
      // Add returnTo parameter to redirect back after login
      navigate(`/auth?returnTo=${encodeURIComponent(location.pathname)}`);
    }
  }, [user, loading, navigate, location]);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-story" element={<CreateStory />} />
        <Route path="/story-creator" element={<StoryCreator />} />
        <Route path="/my-stories" element={<MyStories />} />
        <Route path="/view-story/:id" element={<StoryViewer />} />
        <Route path="/view-story" element={<StoryViewer />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/storybot" element={<StoryBot />} />
        <Route path="/characters" element={<Characters />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </div>
  );
}

// Export the app wrapped with the QueryClientProvider
export default App;

// This is the component that main.tsx will use
export function AppWithProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}
