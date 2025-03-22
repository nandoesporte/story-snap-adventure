
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import CreateStory from "./pages/CreateStory";
import ViewStory from "./pages/ViewStory";
import StoryBot from "./pages/StoryBot";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create-story" element={<CreateStory />} />
          <Route path="/view-story" element={<ViewStory />} />
          <Route path="/view-story/:storyId" element={<ViewStory />} />
          <Route path="/storybot" element={<StoryBot />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
