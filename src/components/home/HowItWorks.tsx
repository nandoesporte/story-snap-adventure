
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const HowItWorks = () => {
  // Fetch page content from the database
  const { data: pageContents = [] } = useQuery({
    queryKey: ["page-contents", "index", "how_it_works"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .eq("page", "index")
        .eq("section", "how_it_works");
      
      if (error) {
        console.error("Error fetching how-it-works content:", error);
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
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-indigo-500 to-purple-600 text-white overflow-hidden">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {getContent("section_title", "COMECE A CRIAR")}
          </h2>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 max-w-6xl mx-auto relative">
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center relative z-10"
          >
            <div className="text-6xl font-bold mb-4">1</div>
            <h3 className="text-2xl font-bold mb-3">
              {getContent("step1_title", "CRIE SUA HISTÓRIA COM IMAGINAÇÃO!")}
            </h3>
            <div className="relative h-48 mb-6 mx-auto">
              <img 
                src={getContent("step1_image", "/lovable-uploads/72f6e9b6-e312-4a1c-8402-c8c60c94959b.png")}
                alt="Passo 1" 
                className="h-full object-contain mx-auto"
              />
            </div>
            <p className="text-white/80">
              {getContent("step1_description", "Basta escrever o que você quer que aconteça na história!")}
            </p>
          </motion.div>
          
          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center relative z-10"
          >
            <div className="text-6xl font-bold mb-4">2</div>
            <h3 className="text-2xl font-bold mb-3">
              {getContent("step2_title", "DÊ VIDA À HISTÓRIA!")}
            </h3>
            <div className="relative h-48 mb-6 mx-auto">
              <img 
                src={getContent("step2_image", "/lovable-uploads/72f6e9b6-e312-4a1c-8402-c8c60c94959b.png")}
                alt="Passo 2" 
                className="h-full object-contain mx-auto"
              />
            </div>
            <p className="text-white/80">
              {getContent("step2_description", "Escolha um nome, faça o upload de uma foto e comece a criar!")}
            </p>
          </motion.div>
          
          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center relative z-10"
          >
            <div className="text-6xl font-bold mb-4">3</div>
            <h3 className="text-2xl font-bold mb-3">
              {getContent("step3_title", "PERSONALIZE PARA AS NECESSIDADES DE APRENDIZAGEM")}
            </h3>
            <div className="relative h-48 mb-6 mx-auto">
              <img 
                src={getContent("step3_image", "/lovable-uploads/72f6e9b6-e312-4a1c-8402-c8c60c94959b.png")}
                alt="Passo 3" 
                className="h-full object-contain mx-auto"
              />
            </div>
            <p className="text-white/80">
              {getContent("step3_description", "Adapte cada história às necessidades únicas da criança.")}
            </p>
          </motion.div>
          
          {/* Removed the horizontal line that was here */}
        </div>
        
        {/* Bottom message and CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16 max-w-3xl mx-auto"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            {getContent("cta_title", "Explore uma aventura mágica em cada conto!")}
          </h3>
          <p className="text-white/80 mb-8">
            {getContent("cta_description", "Leia e compartilhe sua história para dar vida a ela.")}
          </p>
          <NavLink to="/create-story">
            <Button 
              size="lg"
              className="bg-white text-indigo-700 hover:bg-white/90 font-bold rounded-full px-10 py-6 h-auto text-lg"
            >
              {getContent("cta_button_text", "CRIAR HISTÓRIA")}
            </Button>
          </NavLink>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
