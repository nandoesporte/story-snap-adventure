import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const Testimonials = () => {
  // Fetch page content from the database
  const { data: pageContents = [] } = useQuery({
    queryKey: ["page-contents", "index", "testimonials"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("page_contents")
          .select("*")
          .eq("page", "index")
          .eq("section", "testimonials");
        
        if (error) {
          console.error("Error fetching testimonials content:", error);
          return [];
        }
        
        return data;
      } catch (error) {
        console.error("Error in Testimonials query:", error);
        return [];
      }
    },
  });

  // Helper function to get content by key
  const getContent = (key: string, defaultValue: string = "") => {
    const content = pageContents.find(
      (item: any) => item.key === key
    );
    return content ? content.content : defaultValue;
  };

  // Get testimonials content from database or use defaults
  const testimonials = [
    {
      avatar: getContent("testimonial1_avatar", "https://randomuser.me/api/portraits/women/32.jpg"),
      name: getContent("testimonial1_name", "Ana Silva"),
      text: getContent("testimonial1_text", "Minha filha adora as histórias personalizadas! Agora ela pede para ler todos os dias.")
    },
    {
      avatar: getContent("testimonial2_avatar", "https://randomuser.me/api/portraits/men/46.jpg"),
      name: getContent("testimonial2_name", "Carlos Mendes"),
      text: getContent("testimonial2_text", "Uma forma incrível de incentivar a leitura. Meu filho se empolga ao ver seu nome nas aventuras.")
    },
    {
      avatar: getContent("testimonial3_avatar", "https://randomuser.me/api/portraits/women/65.jpg"),
      name: getContent("testimonial3_name", "Juliana Martins"),
      text: getContent("testimonial3_text", "As ilustrações são lindas e as histórias têm valores importantes. Recomendo para todas as famílias!")
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
            {getContent("section_title", "O que as famílias estão dizendo")}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {getContent("section_description", "Histórias que estão fazendo a diferença na vida de milhares de crianças.")}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center mb-4">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full mr-4 border-2 border-white"
                />
                <div>
                  <h4 className="font-semibold text-indigo-800">{testimonial.name}</h4>
                  <div className="flex text-yellow-500 mt-1">
                    {'★'.repeat(5)}
                  </div>
                </div>
              </div>
              <p className="text-slate-600 italic">"{testimonial.text}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
