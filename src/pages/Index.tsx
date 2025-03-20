import { motion } from "framer-motion";
import Hero from "@/components/Hero";

const Index = () => {
  return (
    <div>
      <Hero />

      {/* Features section */}
      <section className="py-16 bg-gradient-to-r from-violet-50 to-fuchsia-50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-4">
              COMO FUNCIONA
            </h2>
            <p className="text-indigo-700/80 max-w-2xl mx-auto">
              Criar histórias personalizadas nunca foi tão fácil e divertido!
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* First feature */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl p-6 transition-all hover:shadow-2xl"
            >
              <div className="text-center">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">CRIE SUA HISTÓRIA COM IMAGINAÇÃO!</h3>
                <div className="relative h-48 mb-6 mx-auto">
                  <img 
                    src="https://images.pexels.com/photos/264905/pexels-photo-264905.jpeg?auto=compress&cs=tinysrgb&w=800" 
                    alt="Menina lendo livro com ilustrações mágicas" 
                    className="h-full object-contain mx-auto rounded-lg shadow-md"
                  />
                </div>
                <p className="text-slate-700">
                  Adicione uma foto da criança, escolha o tema da história e comece a personalizar o conteúdo de acordo com suas preferências.
                </p>
              </div>
            </motion.div>
            
            {/* Second feature */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-xl p-6 transition-all hover:shadow-2xl"
            >
              <div className="text-center">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">DÊ VIDA À HISTÓRIA!</h3>
                <div className="relative h-48 mb-6 mx-auto">
                  <img 
                    src="https://images.pexels.com/photos/6095219/pexels-photo-6095219.jpeg?auto=compress&cs=tinysrgb&w=800" 
                    alt="Livro infantil com ilustrações coloridas e mágicas" 
                    className="h-full object-contain mx-auto rounded-lg shadow-md"
                  />
                </div>
                <p className="text-slate-700">
                  Nossa IA gera ilustrações personalizadas e texto envolvente, criando uma experiência de leitura imersiva e única.
                </p>
              </div>
            </motion.div>
            
            {/* Third feature */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white rounded-2xl shadow-xl p-6 transition-all hover:shadow-2xl"
            >
              <div className="text-center">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">PERSONALIZE PARA AS NECESSIDADES DE APRENDIZAGEM</h3>
                <div className="relative h-48 mb-6 mx-auto">
                  <img 
                    src="https://images.pexels.com/photos/4122305/pexels-photo-4122305.jpeg?auto=compress&cs=tinysrgb&w=800" 
                    alt="Família lendo juntos um livro de histórias encantadas" 
                    className="h-full object-contain mx-auto rounded-lg shadow-md"
                  />
                </div>
                <p className="text-slate-700">
                  Escolha valores, habilidades e lições específicas para incluir na história, ajudando no desenvolvimento da criança.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials section */}
      <section className="py-16 bg-gradient-to-br from-fuchsia-50 to-violet-50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-4">
              O QUE AS PESSOAS ESTÃO DIZENDO
            </h2>
            <p className="text-indigo-700/80 max-w-2xl mx-auto">
              Veja o que pais e filhos estão achando da experiência Story Spark!
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* First testimonial */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-start mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1531427186611-ecfd6d936e63?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64&q=80" 
                  alt="Foto de perfil do pai satisfeito" 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="text-xl font-bold text-indigo-800">
                    João Silva
                  </h4>
                  <p className="text-slate-500">Pai do Lucas, 6 anos</p>
                </div>
              </div>
              <p className="text-slate-700">
                "Story Spark transformou a hora de dormir em um momento mágico! Meu filho adora ser o herói das próprias histórias."
              </p>
            </motion.div>
            
            {/* Second testimonial */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-start mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64&q=80" 
                  alt="Foto de perfil da mãe satisfeita" 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="text-xl font-bold text-indigo-800">
                    Maria Oliveira
                  </h4>
                  <p className="text-slate-500">Mãe da Sofia, 8 anos</p>
                </div>
              </div>
              <p className="text-slate-700">
                "A Sofia está muito mais interessada em ler desde que começamos a usar o Story Spark. As histórias são super criativas e educativas!"
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to action section */}
      <section className="py-24 bg-gradient-to-tl from-fuchsia-100 to-violet-100">
        <div className="container mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-indigo-800 mb-6">
              PRONTO PARA COMEÇAR A CRIAR?
            </h2>
            <p className="text-indigo-700/90 max-w-3xl mx-auto mb-8">
              Desperte a imaginação do seu filho e crie memórias inesquecíveis com histórias personalizadas e mágicas.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap justify-center items-center gap-4 pt-2"
            >
              <a href="/create-story">
                <button className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-full px-8 py-3 h-auto text-base">
                  CRIAR HISTÓRIA AGORA
                </button>
              </a>
              <span className="text-indigo-700 font-medium ml-2">
                Experimente Grátis!
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer section */}
      <footer className="bg-indigo-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/70 text-sm">
            © 2024 Story Spark. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
