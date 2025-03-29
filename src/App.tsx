
import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from './components/ui/toaster'
// Import removed, as it's already being used in main.tsx
// import { AuthProvider } from './context/AuthContext'

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* AuthProvider removed here since it's already in main.tsx */}
      <Router>
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
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  )
}

export default App
