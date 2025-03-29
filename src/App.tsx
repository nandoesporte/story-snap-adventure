
import { useState, useEffect } from 'react'
import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from './components/ui/toaster'
import { useAuth } from './context/AuthContext'

// Pages
import Index from './pages/Index'
import Auth from './pages/Auth'
import NotFound from './pages/NotFound'
import CreateStory from './pages/CreateStory'
import MyStories from './pages/MyStories'
import StoryCreator from './pages/StoryCreator'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Admin from './pages/Admin'
import StoryBot from './pages/StoryBot'
import Characters from './pages/Characters'

// Initialize the React Query client
const queryClient = new QueryClient()

// Protected route for admin-only pages
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check admin status from localStorage (set by AdminLink and UserProfile components)
    const userRole = localStorage.getItem('user_role');
    setIsAdmin(userRole === 'admin');
    setLoading(false);
  }, [user]);
  
  if (loading) {
    return <div>Verificando permissões...</div>;
  }
  
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Auth type="login" />} />
        <Route path="/register" element={<Auth type="register" />} />
        <Route path="/create-story" element={<CreateStory />} />
        <Route path="/storybot" element={<StoryBot />} />
        <Route path="/my-stories" element={<MyStories />} />
        <Route path="/story-creator" element={<StoryCreator />} />
        <Route path="/story-creator/:id" element={<StoryCreator />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={
          <AdminRoute>
            <Settings />
          </AdminRoute>
        } />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/characters" element={<Characters />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
