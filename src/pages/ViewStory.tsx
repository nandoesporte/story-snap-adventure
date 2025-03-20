
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StoryViewer from "../components/StoryViewer";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { customScrollbarStyles } from "../utils/cssStyles";

const ViewStory = () => {
  // Add custom scrollbar styles to the page
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = customScrollbarStyles;
    document.head.appendChild(styleElement);

    // Add children's fonts from Google
    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Bubblegum+Sans&family=Patrick+Hand&family=Schoolbell&display=swap";
    document.head.appendChild(linkElement);

    return () => {
      document.head.removeChild(styleElement);
      document.head.removeChild(linkElement);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-600 to-indigo-700">
      <Navbar />
      
      <main className="flex-1 pt-8 md:pt-16 pb-12 relative z-10">
        <div className="container mx-auto max-w-6xl px-4">
          <StoryViewer />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ViewStory;
