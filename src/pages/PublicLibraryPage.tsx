
import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const PublicLibraryPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-indigo-800 mb-4">
              Biblioteca Pública
            </h1>
            <p className="text-lg text-indigo-600">
              Explore nossa coleção de histórias disponíveis para todos
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Placeholder for future stories */}
            <div className="bg-white rounded-lg p-8 text-center shadow-md border border-indigo-100">
              <h2 className="text-2xl font-semibold mb-4">Em breve</h2>
              <p className="text-gray-600 mb-6">
                Estamos adicionando histórias à nossa biblioteca pública. Volte em breve para ver o conteúdo disponível.
              </p>
              <Link to="/">
                <Button variant="outline">Voltar para o Início</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PublicLibraryPage;
