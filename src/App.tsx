
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import SettingsPage from "./pages/SettingsPage";
import UserProfilePage from "./pages/UserProfilePage";
import CreateStoryPage from "./pages/CreateStoryPage";
import StoryViewerPage from "./pages/StoryViewerPage";
import StoryCreatorPage from "./pages/StoryCreatorPage";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Cria uma instância do QueryClient
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" richColors closeButton />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/create-story" element={<CreateStoryPage />} />
            <Route path="/view-story/:id?" element={<StoryViewerPage />} />
            <Route path="/story-creator" element={<StoryCreatorPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
