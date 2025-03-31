
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import SettingsPage from "./pages/SettingsPage";
import UserProfilePage from "./pages/UserProfilePage";
import CreateStoryPage from "./pages/CreateStoryPage";
import StoryCreatorPage from "./pages/StoryCreatorPage";
import NotFound from "./pages/NotFound";
import Library from "./pages/Library";
import MyStories from "./pages/MyStories";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Planos from "./pages/Planos";
import Subscription from "./pages/Subscription";

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/create-story" element={<CreateStoryPage />} />
        <Route path="/story-creator" element={<StoryCreatorPage />} />
        <Route path="/library" element={<Library />} />
        <Route path="/my-stories" element={<MyStories />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Auth type="login" />} />
        <Route path="/register" element={<Auth type="register" />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/planos" element={<Planos />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
