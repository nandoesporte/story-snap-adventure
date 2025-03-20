
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import { Book, Heart, Users, Stars, Sparkles, BookOpen } from "lucide-react";

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
        
        {/* How it Works Section */}
        <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="container mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-4">Como funciona?</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Em apenas três passos simples, crie uma história personalizada para seu filho.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  step: '01',
                  title: 'Personalize',
                  description: 'Informe o nome, idade e características do seu filho.',
                  icon: <Users className="h-8 w-8" />
                },
                {
                  step: '02',
                  title: 'Escolha o tema',
                  description: 'Selecione o tema da história entre várias opções mágicas.',
                  icon: <Sparkles className="h-8 w-8" />
                },
                {
                  step: '03',
                  title: 'Leia e compartilhe',
                  description: 'Receba sua história personalizada pronta para ler e compartilhar.',
                  icon: <BookOpen className="h-8 w-8" />
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="bg-white rounded-xl p-6 shadow-sm z-10 relative">
                    <div className="text-4xl font-bold text-indigo-200 mb-4">{item.step}</div>
                    <h3 className="text-xl font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                      {item.icon}
                      {item.title}
                    </h3>
                    <p className="text-slate-600">{item.description}</p>
                  </div>
                  
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-12 transform -translate-y-1/2 z-0">
                      <svg width="64" height="24" viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 12H61M61 12L50 1M61 12L50 23" stroke="#C7D2FE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
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
                <a 
                  href="/create-story" 
                  className="bg-white text-indigo-700 font-bold py-3 px-8 rounded-full inline-flex items-center text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Book className="mr-2 h-5 w-5" />
                  Criar Minha Primeira História
                </a>
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
