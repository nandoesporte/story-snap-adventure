
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./context/AuthContext"; 
import Index from "./pages/Index";
import CreateStory from "./pages/CreateStory";
import ViewStory from "./pages/ViewStory";
import StoryBot from "./pages/StoryBot";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import MyStories from "./pages/MyStories";
import Characters from "./pages/Characters";
import StoryCreatorPage from "@/pages/StoryCreator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth type="register" />} />
            <Route path="/create-story" element={<CreateStory />} />
            <Route path="/story-creator" element={<StoryCreatorPage />} />
            <Route path="/view-story" element={<ViewStory />} />
            <Route path="/view-story/:storyId" element={<ViewStory />} />
            <Route path="/storybot" element={<StoryBot />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-stories" element={<MyStories />} />
            <Route path="/characters" element={<Characters />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
