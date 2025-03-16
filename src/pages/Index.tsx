
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <Hero />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
