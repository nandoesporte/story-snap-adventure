
import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
              Sobre Nós
            </h1>
            
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-violet-700">Nossa Missão</h2>
              <p className="mb-6 text-gray-700">
                Nascemos com a missão de tornar a leitura uma experiência mágica e personalizada para crianças de todas as idades. 
                Acreditamos que cada criança é única e merece histórias que falem diretamente aos seus sonhos, interesses e imaginação.
              </p>
              
              <h2 className="text-2xl font-semibold mb-4 text-violet-700">Como Funciona</h2>
              <p className="mb-6 text-gray-700">
                Utilizamos tecnologia de inteligência artificial avançada para criar histórias únicas e personalizadas. 
                Nossa plataforma permite que pais, educadores e as próprias crianças especifiquem personagens, 
                cenários e temas, resultando em histórias verdadeiramente únicas, acompanhadas de ilustrações encantadoras.
              </p>
              
              <h2 className="text-2xl font-semibold mb-4 text-violet-700">Nossos Valores</h2>
              <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
                <li><strong>Criatividade:</strong> Estimulamos a imaginação e o pensamento criativo através de nossas histórias.</li>
                <li><strong>Inclusão:</strong> Criamos conteúdo que representa a diversidade do mundo em que vivemos.</li>
                <li><strong>Aprendizado:</strong> Nossas histórias não apenas entretêm, mas também educam e inspiram.</li>
                <li><strong>Segurança:</strong> Garantimos que todo nosso conteúdo seja apropriado e seguro para crianças.</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mb-4 text-violet-700">Nossa Equipe</h2>
              <p className="text-gray-700">
                Somos uma equipe apaixonada de contadores de histórias, educadores, ilustradores e programadores, 
                todos unidos pelo objetivo de criar experiências de leitura inesquecíveis para crianças.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-4 text-violet-700">Contato</h2>
              <p className="mb-4 text-gray-700">
                Estamos sempre abertos a feedback, sugestões e parcerias. Entre em contato conosco:
              </p>
              <ul className="text-gray-700 space-y-2">
                <li><strong>Email:</strong> contato@historiamagica.com</li>
                <li><strong>Telefone:</strong> (11) 1234-5678</li>
                <li><strong>Endereço:</strong> Rua das Palavras, 123 - São Paulo, SP</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
