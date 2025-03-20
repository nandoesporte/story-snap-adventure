
import { motion } from "framer-motion";
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
  const features = [
    {
      icon: <Book className="h-10 w-10 text-indigo-600" />,
      title: "Histórias Personalizadas",
      description: "Crie histórias únicas com o nome e características do seu filho como protagonista."
    },
    {
      icon: <Stars className="h-10 w-10 text-indigo-600" />,
      title: "Ilustrações Mágicas",
      description: "Imagens coloridas e encantadoras que trazem a história à vida."
    },
    {
      icon: <Users className="h-10 w-10 text-indigo-600" />,
      title: "Personagens Diversos",
      description: "Escolha entre vários personagens e cenários para criar histórias diversas."
    },
    {
      icon: <Heart className="h-10 w-10 text-indigo-600" />,
      title: "Valores e Lições",
      description: "Histórias que transmitem valores importantes e lições de vida."
    }
  ];

  const testimonials = [
    {
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
      name: "Ana Silva",
      text: "Minha filha adora as histórias personalizadas! Agora ela pede para ler todos os dias."
    },
    {
      avatar: "https://randomuser.me/api/portraits/men/46.jpg",
      name: "Carlos Mendes",
      text: "Uma forma incrível de incentivar a leitura. Meu filho se empolga ao ver seu nome nas aventuras."
    },
    {
      avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      name: "Juliana Martins",
      text: "As ilustrações são lindas e as histórias têm valores importantes. Recomendo para todas as famílias!"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        
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
              <h2 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-4">Por que escolher o Story Spark?</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Criamos histórias mágicas que incentivam a leitura e fortalecem o vínculo familiar.</p>
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
        
        {/* New "Como Funciona" Section in purple gradient background */}
        <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-indigo-500 to-purple-600 text-white overflow-hidden">
          <div className="container mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">COMECE A CRIAR</h2>
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
                <h3 className="text-2xl font-bold mb-3">CRIE SUA HISTÓRIA COM IMAGINAÇÃO!</h3>
                <div className="relative h-48 mb-6 mx-auto">
                  <img 
                    src="/lovable-uploads/1dab797b-be42-4472-b092-238f718f6f0c.png" 
                    alt="Criança em mundo mágico" 
                    className="h-full object-contain mx-auto rounded-lg shadow-md"
                  />
                </div>
                <p className="text-white/80">
                  Basta escrever o que você quer que aconteça na história!
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
                <h3 className="text-2xl font-bold mb-3">DÊ VIDA À HISTÓRIA!</h3>
                <div className="relative h-48 mb-6 mx-auto">
                  <img 
                    src="/lovable-uploads/1dab797b-be42-4472-b092-238f718f6f0c.png" 
                    alt="Personagens de histórias infantis" 
                    className="h-full object-contain mx-auto rounded-lg shadow-md"
                  />
                </div>
                <p className="text-white/80">
                  Escolha um nome, faça o upload de uma foto e comece a criar!
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
                <h3 className="text-2xl font-bold mb-3">PERSONALIZE PARA AS NECESSIDADES DE APRENDIZAGEM</h3>
                <div className="relative h-48 mb-6 mx-auto">
                  <img 
                    src="/lovable-uploads/1dab797b-be42-4472-b092-238f718f6f0c.png" 
                    alt="Criança lendo livro mágico" 
                    className="h-full object-contain mx-auto rounded-lg shadow-md"
                  />
                </div>
                <p className="text-white/80">
                  Adapte cada história às necessidades únicas da criança.
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
                Explore uma aventura mágica em cada conto!
              </h3>
              <p className="text-white/80 mb-8">
                Leia e compartilhe sua história para dar vida a ela.
              </p>
              <NavLink to="/create-story">
                <Button 
                  size="lg"
                  className="bg-white text-indigo-700 hover:bg-white/90 font-bold rounded-full px-10 py-6 h-auto text-lg"
                >
                  CRIAR HISTÓRIA
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
              <h2 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-4">O que as famílias estão dizendo</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Histórias que estão fazendo a diferença na vida de milhares de crianças.</p>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para criar memórias inesquecíveis?</h2>
              <p className="text-indigo-100 mb-8 text-lg">
                Comece agora a criar histórias personalizadas que seu filho vai adorar!
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
                  Criar Minha Primeira História
                </NavLink>
              </motion.div>
              <p className="text-indigo-200 mt-4">Experimente gratuitamente hoje!</p>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
