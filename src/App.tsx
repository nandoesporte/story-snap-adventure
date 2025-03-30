
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateStoryPage from "./pages/CreateStoryPage";
import StoryCreatorPage from "./pages/StoryCreatorPage";
import StoryViewerPage from "./components/story-viewer/StoryViewer";
import NotFound from "./pages/NotFound";

// Create QueryClient instance
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" richColors closeButton />
          <Routes>
            <Route path="/" element={<CreateStoryPage />} />
            <Route path="/create-story" element={<CreateStoryPage />} />
            <Route path="/view-story/:id?" element={<StoryViewerPage />} />
            <Route path="/story-creator" element={<StoryCreatorPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
