
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import Features from "../components/home/Features";
import HowItWorks from "../components/home/HowItWorks";
import Testimonials from "../components/home/Testimonials";
import CallToAction from "../components/home/CallToAction";
import { useIndexPageContent } from "../components/home/ContentLoader";
import LoadingSpinner from "@/components/LoadingSpinner";
import FeaturedStoryCarousel from "@/components/home/FeaturedStoryCarousel";
import SubscriptionPlansSection from "@/components/home/SubscriptionPlansSection";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { getContent, isLoading } = useIndexPageContent();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get hero section image content
  const heroImageUrl = getContent("hero", "image_url", "/lovable-uploads/4e6e784b-efbd-45e2-b83d-3704e80cddf5.png");

  const handleSelectPlan = (planId: string) => {
    if (user) {
      // If user is logged in, navigate directly to subscription page
      navigate(`/subscription?plan=${planId}`);
    } else {
      // If user is not logged in, redirect to auth page
      navigate(`/auth?redirect=/subscription?plan=${planId}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {isLoading ? (
          <div className="h-[500px] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <Hero customImageUrl={heroImageUrl} />
        )}
        
        {/* Featured Story Carousel */}
        <FeaturedStoryCarousel />
        
        <Features />
        <HowItWorks />
        
        {/* Subscription Plans Section for non-logged in users */}
        <SubscriptionPlansSection onSelectPlan={handleSelectPlan} />
        
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
