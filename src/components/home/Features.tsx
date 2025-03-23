
import { motion } from "framer-motion";
import { Book, Heart, Users, Stars } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const Features = () => {
  // Fetch page content from the database
  const { data: pageContents = [] } = useQuery({
    queryKey: ["page-contents", "index", "features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .eq("page", "index")
        .eq("section", "features");
      
      if (error) {
        console.error("Error fetching features content:", error);
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

  // Get features content from database or use defaults
  const features = [
    {
      icon: <Book className="h-10 w-10 text-indigo-600" />,
      title: getContent("feature1_title", "Histórias Personalizadas"),
      description: getContent("feature1_description", "Crie histórias únicas com o nome e características do seu filho como protagonista.")
    },
    {
      icon: <Stars className="h-10 w-10 text-indigo-600" />,
      title: getContent("feature2_title", "Ilustrações Mágicas"),
      description: getContent("feature2_description", "Imagens coloridas e encantadoras que trazem a história à vida.")
    },
    {
      icon: <Users className="h-10 w-10 text-indigo-600" />,
      title: getContent("feature3_title", "Personagens Diversos"),
      description: getContent("feature3_description", "Escolha entre vários personagens e cenários para criar histórias diversas.")
    },
    {
      icon: <Heart className="h-10 w-10 text-indigo-600" />,
      title: getContent("feature4_title", "Valores e Lições"),
      description: getContent("feature4_description", "Histórias que transmitem valores importantes e lições de vida.")
    }
  ];

  return (
    <section className="py-16 md:py-24 px-4 bg-white">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-4">
            {getContent("section_title", "Por que escolher o Story Spark?")}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {getContent("section_description", "Criamos histórias mágicas que incentivam a leitura e fortalecem o vínculo familiar.")}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-indigo-50 rounded-xl p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-indigo-800 mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
