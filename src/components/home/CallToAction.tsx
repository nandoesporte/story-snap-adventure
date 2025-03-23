
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Book } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const CallToAction = () => {
  // Fetch page content from the database
  const { data: pageContents = [] } = useQuery({
    queryKey: ["page-contents", "index", "cta"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .eq("page", "index")
        .eq("section", "cta");
      
      if (error) {
        console.error("Error fetching CTA content:", error);
        return [];
      }
      
      return data;
    },
  });

  // Helper function to get content by key
  const getContent = (key: string, defaultValue: string = "") => {
    const content = pageContents.find(
      (item: any) => item.key === key
    );
    return content ? content.content : defaultValue;
  };

  return (
    <section className="py-16 md:py-20 px-4 bg-indigo-700 text-white">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {getContent("title", "Pronto para criar memórias inesquecíveis?")}
          </h2>
          <p className="text-indigo-100 mb-8 text-lg">
            {getContent("description", "Comece agora a criar histórias personalizadas que seu filho vai adorar!")}
          </p>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <NavLink 
              to="/create-story" 
              className="bg-white text-indigo-700 font-bold py-3 px-8 rounded-full inline-flex items-center text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Book className="mr-2 h-5 w-5" />
              {getContent("button_text", "Criar Minha Primeira História")}
            </NavLink>
          </motion.div>
          <p className="text-indigo-200 mt-4">
            {getContent("subtitle", "Experimente gratuitamente hoje!")}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
