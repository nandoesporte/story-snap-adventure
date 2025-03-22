
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import { Book, Heart, Users, Stars, Sparkles, BookOpen } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Index = () => {
  // Fetch page content from the database with better error handling
  const { data: pageContents = [], isLoading } = useQuery({
    queryKey: ["page-contents", "index"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .eq("page", "index");
      
      if (error) {
        console.error("Error fetching page contents:", error);
        return [];
      }
      
      return data;
    },
  });

  // Helper function to get content by section and key
  const getContent = (section: string, key: string, defaultValue: string = "") => {
    const content = pageContents.find(
      (item: any) => item.section === section && item.key === key
    );
    return content ? content.content : defaultValue;
  };

  // Get features content from database or use defaults
  const features = [
    {
      icon: <Book className="h-10 w-10 text-indigo-600" />,
      title: getContent("features", "feature1_title", "Histórias Personalizadas"),
      description: getContent("features", "feature1_description", "Crie histórias únicas com o nome e características do seu filho como protagonista.")
    },
    {
      icon: <Stars className="h-10 w-10 text-indigo-600" />,
      title: getContent("features", "feature2_title", "Ilustrações Mágicas"),
      description: getContent("features", "feature2_description", "Imagens coloridas e encantadoras que trazem a história à vida.")
    },
    {
      icon: <Users className="h-10 w-10 text-indigo-600" />,
      title: getContent("features", "feature3_title", "Personagens Diversos"),
      description: getContent("features", "feature3_description", "Escolha entre vários personagens e cenários para criar histórias diversas.")
    },
    {
      icon: <Heart className="h-10 w-10 text-indigo-600" />,
      title: getContent("features", "feature4_title", "Valores e Lições"),
      description: getContent("features", "feature4_description", "Histórias que transmitem valores importantes e lições de vida.")
    }
  ];

  // Get testimonials content from database or use defaults
  const testimonials = [
    {
      avatar: getContent("testimonials", "testimonial1_avatar", "https://randomuser.me/api/portraits/women/32.jpg"),
      name: getContent("testimonials", "testimonial1_name", "Ana Silva"),
      text: getContent("testimonials", "testimonial1_text", "Minha filha adora as histórias personalizadas! Agora ela pede para ler todos os dias.")
    },
    {
      avatar: getContent("testimonials", "testimonial2_avatar", "https://randomuser.me/api/portraits/men/46.jpg"),
      name: getContent("testimonials", "testimonial2_name", "Carlos Mendes"),
      text: getContent("testimonials", "testimonial2_text", "Uma forma incrível de incentivar a leitura. Meu filho se empolga ao ver seu nome nas aventuras.")
    },
    {
      avatar: getContent("testimonials", "testimonial3_avatar", "https://randomuser.me/api/portraits/women/65.jpg"),
      name: getContent("testimonials", "testimonial3_name", "Juliana Martins"),
      text: getContent("testimonials", "testimonial3_text", "As ilustrações são lindas e as histórias têm valores importantes. Recomendo para todas as famílias!")
    }
  ];

  // Get hero section image content
  const heroImageUrl = getContent("hero", "image_url", "/lovable-uploads/4e6e784b-efbd-45e2-b83d-3704e80cddf5.png");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero customImageUrl={heroImageUrl} />
        
        {/* Features Section */}
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
                {getContent("features", "section_title", "Por que escolher o Story Spark?")}
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                {getContent("features", "section_description", "Criamos histórias mágicas que incentivam a leitura e fortalecem o vínculo familiar.")}
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
        
        {/* How it Works Section */}
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
                {getContent("how_it_works", "section_title", "COMECE A CRIAR")}
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
                  {getContent("how_it_works", "step1_title", "CRIE SUA HISTÓRIA COM IMAGINAÇÃO!")}
                </h3>
                <div className="relative h-48 mb-6 mx-auto">
                  <img 
                    src={getContent("how_it_works", "step1_image", "/lovable-uploads/72f6e9b6-e312-4a1c-8402-c8c60c94959b.png")}
                    alt="Passo 1" 
                    className="h-full object-contain mx-auto"
                  />
                </div>
                <p className="text-white/80">
                  {getContent("how_it_works", "step1_description", "Basta escrever o que você quer que aconteça na história!")}
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
                  {getContent("how_it_works", "step2_title", "DÊ VIDA À HISTÓRIA!")}
                </h3>
                <div className="relative h-48 mb-6 mx-auto">
                  <img 
                    src={getContent("how_it_works", "step2_image", "/lovable-uploads/72f6e9b6-e312-4a1c-8402-c8c60c94959b.png")}
                    alt="Passo 2" 
                    className="h-full object-contain mx-auto"
                  />
                </div>
                <p className="text-white/80">
                  {getContent("how_it_works", "step2_description", "Escolha um nome, faça o upload de uma foto e comece a criar!")}
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
                  {getContent("how_it_works", "step3_title", "PERSONALIZE PARA AS NECESSIDADES DE APRENDIZAGEM")}
                </h3>
                <div className="relative h-48 mb-6 mx-auto">
                  <img 
                    src={getContent("how_it_works", "step3_image", "/lovable-uploads/72f6e9b6-e312-4a1c-8402-c8c60c94959b.png")}
                    alt="Passo 3" 
                    className="h-full object-contain mx-auto"
                  />
                </div>
                <p className="text-white/80">
                  {getContent("how_it_works", "step3_description", "Adapte cada história às necessidades únicas da criança.")}
                </p>
              </motion.div>
              
              {/* Connecting lines between steps (only visible on md screens and up) */}
              <div className="hidden md:block absolute top-1/3 left-0 w-full h-0.5 bg-white/20 -z-0"></div>
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
                {getContent("how_it_works", "cta_title", "Explore uma aventura mágica em cada conto!")}
              </h3>
              <p className="text-white/80 mb-8">
                {getContent("how_it_works", "cta_description", "Leia e compartilhe sua história para dar vida a ela.")}
              </p>
              <NavLink to="/create-story">
                <Button 
                  size="lg"
                  className="bg-white text-indigo-700 hover:bg-white/90 font-bold rounded-full px-10 py-6 h-auto text-lg"
                >
                  {getContent("how_it_works", "cta_button_text", "CRIAR HISTÓRIA")}
                </Button>
              </NavLink>
            </motion.div>
          </div>
        </section>
        
        {/* Testimonials */}
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
                {getContent("testimonials", "section_title", "O que as famílias estão dizendo")}
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                {getContent("testimonials", "section_description", "Histórias que estão fazendo a diferença na vida de milhares de crianças.")}
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
        
        {/* CTA Section */}
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
                {getContent("cta", "title", "Pronto para criar memórias inesquecíveis?")}
              </h2>
              <p className="text-indigo-100 mb-8 text-lg">
                {getContent("cta", "description", "Comece agora a criar histórias personalizadas que seu filho vai adorar!")}
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
                  {getContent("cta", "button_text", "Criar Minha Primeira História")}
                </NavLink>
              </motion.div>
              <p className="text-indigo-200 mt-4">
                {getContent("cta", "subtitle", "Experimente gratuitamente hoje!")}
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
