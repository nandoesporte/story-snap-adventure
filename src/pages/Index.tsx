
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import Features from "../components/home/Features";
import HowItWorks from "../components/home/HowItWorks";
import Testimonials from "../components/home/Testimonials";
import CallToAction from "../components/home/CallToAction";
import { useIndexPageContent } from "../components/home/ContentLoader";

const Index = () => {
  const { getContent } = useIndexPageContent();

  // Get hero section image content
  const heroImageUrl = getContent("hero", "image_url", "/lovable-uploads/4e6e784b-efbd-45e2-b83d-3704e80cddf5.png");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero customImageUrl={heroImageUrl} />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
