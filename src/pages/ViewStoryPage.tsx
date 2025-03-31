
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Volume, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';

interface StoryPage {
  text: string;
  imageUrl: string;
}

interface Story {
  id: string;
  title: string;
  coverImageUrl: string;
  characterName: string;
  pages: StoryPage[];
}

// Web Speech API para narração
const useSpeechSynthesis = (text: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechRef.current = new SpeechSynthesisUtterance(text);
      speechRef.current.lang = 'pt-BR';
      speechRef.current.rate = 0.9; // Velocidade um pouco mais lenta para histórias infantis
      speechRef.current.pitch = 1.1; // Tom um pouco mais alto para soar mais amigável
      
      const handleEnd = () => setIsPlaying(false);
      speechRef.current.addEventListener('end', handleEnd);
      
      return () => {
        if (speechRef.current) {
          speechRef.current.removeEventListener('end', handleEnd);
          window.speechSynthesis.cancel();
        }
      };
    }
  }, [text]);

  const play = () => {
    if ('speechSynthesis' in window && speechRef.current) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.speak(speechRef.current);
        setIsPlaying(true);
      }
    } else {
      toast.error("Seu navegador não suporta narração por voz");
    }
  };

  return { isPlaying, play };
};

const ViewStoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription, isLoading: isLoadingSubscription } = useSubscription();
  
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');
  
  // Refs para o livro e container
  const bookRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estado para controle de responsividade
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Hook de narração para a página atual
  const currentText = story && currentPage > 0 
    ? story.pages[currentPage - 1]?.text || "" 
    : (story?.title || "");
  const { isPlaying, play } = useSpeechSynthesis(currentText);

  // Efeito para verificar o tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Efeito para carregar a história
  useEffect(() => {
    const fetchStory = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('stories')
          .select('id, title, cover_image_url, character_name, pages')
          .eq('id', id)
          .single();

        if (error) {
          console.error("Erro ao carregar história:", error);
          setError("Não foi possível carregar esta história");
          setLoading(false);
          return;
        }

        if (data) {
          // Formatar os dados para o formato esperado
          const formattedStory: Story = {
            id: data.id,
            title: data.title,
            coverImageUrl: data.cover_image_url,
            characterName: data.character_name,
            pages: data.pages || []
          };
          
          setStory(formattedStory);
        } else {
          setError("História não encontrada");
        }
      } catch (err) {
        console.error("Erro:", err);
        setError("Ocorreu um erro ao carregar a história");
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  // Lidar com navegação entre páginas
  const handlePreviousPage = () => {
    if (currentPage > 0 && !isFlipping) {
      setFlipDirection('left');
      setIsFlipping(true);
      
      // Criar efeito 3D de virar página
      if (bookRef.current) {
        bookRef.current.style.transform = 'rotateY(-15deg)';
        bookRef.current.style.opacity = '0.9';
      }
      
      // Pequeno atraso para a animação
      setTimeout(() => {
        setCurrentPage(prevPage => prevPage - 1);
        
        setTimeout(() => {
          if (bookRef.current) {
            bookRef.current.style.transform = 'rotateY(0)';
            bookRef.current.style.opacity = '1';
          }
          setIsFlipping(false);
        }, 300);
      }, 300);
    }
  };

  const handleNextPage = () => {
    if (story && currentPage < story.pages.length && !isFlipping) {
      setFlipDirection('right');
      setIsFlipping(true);
      
      // Criar efeito 3D de virar página
      if (bookRef.current) {
        bookRef.current.style.transform = 'rotateY(15deg)';
        bookRef.current.style.opacity = '0.9';
      }
      
      // Pequeno atraso para a animação
      setTimeout(() => {
        setCurrentPage(prevPage => prevPage + 1);
        
        setTimeout(() => {
          if (bookRef.current) {
            bookRef.current.style.transform = 'rotateY(0)';
            bookRef.current.style.opacity = '1';
          }
          setIsFlipping(false);
        }, 300);
      }, 300);
    }
  };

  // Alternar modo noturno
  const toggleNightMode = () => {
    setIsNightMode(!isNightMode);
    
    if (containerRef.current) {
      containerRef.current.classList.toggle('night-mode');
    }
  };

  // Se o usuário não estiver autenticado
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="container max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100 p-8 text-center"
            >
              <div className="flex flex-col items-center gap-4 py-8">
                <h1 className="text-3xl font-bold">Login Necessário</h1>
                <p className="text-gray-600 max-w-md mb-4">
                  Para ler histórias, você precisa estar conectado à sua conta.
                </p>
                <div className="flex gap-4 flex-wrap justify-center">
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Voltar para Início
                  </Button>
                  <Button variant="storyPrimary" onClick={() => navigate("/auth")}>
                    Entrar na Conta
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Se o usuário não tiver assinatura ativa
  if (!isLoadingSubscription && !hasActiveSubscription) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="container max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100 p-8 text-center"
            >
              <div className="flex flex-col items-center gap-4 py-8">
                <h1 className="text-3xl font-bold">Assinatura Necessária</h1>
                <p className="text-gray-600 max-w-md mb-4">
                  Para ler histórias, você precisa ter uma assinatura ativa.
                </p>
                <div className="flex gap-4 flex-wrap justify-center">
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Voltar para Início
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                    onClick={() => navigate("/planos")}
                  >
                    Ver Planos de Assinatura
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`min-h-screen flex flex-col transition-colors duration-300 ${isNightMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}
    >
      <Navbar />
      
      <main className="flex-1 pt-16 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold mb-4">{error}</h2>
              <Button variant="outline" onClick={() => navigate('/')}>
                Voltar para Início
              </Button>
            </div>
          </div>
        ) : story ? (
          <div className="flex-1 flex flex-col relative">
            {/* Botões flutuantes para controles */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
              <Button
                onClick={toggleNightMode}
                className={`rounded-full w-12 h-12 flex items-center justify-center ${
                  isNightMode ? 'bg-yellow-400 text-gray-800' : 'bg-gray-800 text-white'
                }`}
                aria-label={isNightMode ? "Modo dia" : "Modo noite"}
              >
                {isNightMode ? <Sun /> : <Moon />}
              </Button>
              
              <Button
                onClick={play}
                className={`rounded-full w-12 h-12 flex items-center justify-center ${
                  isPlaying ? 'bg-purple-600 text-white' : 'bg-white text-purple-600'
                } border-2 ${isPlaying ? 'border-white' : 'border-purple-600'}`}
                aria-label={isPlaying ? "Parar narração" : "Ouvir narração"}
              >
                {isPlaying ? <VolumeX /> : <Volume />}
              </Button>
            </div>
            
            {/* Navegação de página */}
            <div className="absolute inset-y-0 left-4 flex items-center z-30">
              {currentPage > 0 && !isFlipping && (
                <Button
                  onClick={handlePreviousPage}
                  className={`rounded-full w-12 h-12 flex items-center justify-center ${
                    isNightMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                  } shadow-lg`}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
            </div>
            
            <div className="absolute inset-y-0 right-4 flex items-center z-30">
              {currentPage < story.pages.length && !isFlipping && (
                <Button
                  onClick={handleNextPage}
                  className={`rounded-full w-12 h-12 flex items-center justify-center ${
                    isNightMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                  } shadow-lg`}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </div>
            
            {/* Indicador de progresso */}
            <div 
              className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 py-2 px-6 rounded-full font-medium ${
                isNightMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
              } shadow-md`}
            >
              Página {currentPage > 0 ? currentPage : 1} de {story.pages.length + 1}
            </div>
            
            {/* Container do livro com perspectiva 3D */}
            <div className="flex-1 flex items-center justify-center perspective-1000 p-4 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  ref={bookRef}
                  initial={{ 
                    opacity: 0, 
                    x: flipDirection === 'right' ? 100 : -100,
                    rotateY: flipDirection === 'right' ? 5 : -5 
                  }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    rotateY: 0,
                    transition: { duration: 0.4 } 
                  }}
                  exit={{ 
                    opacity: 0,
                    x: flipDirection === 'right' ? -100 : 100,
                    rotateY: flipDirection === 'right' ? -5 : 5,
                    transition: { duration: 0.2 } 
                  }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className={`w-full max-w-4xl ${isMobile ? 'h-[70vh]' : 'h-[80vh]'} ${
                    isNightMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                  } rounded-lg shadow-xl overflow-hidden`}
                >
                  {currentPage === 0 ? (
                    // Capa do livro
                    <div className="w-full h-full flex flex-col">
                      <div className="flex-1 relative">
                        <img 
                          src={story.coverImageUrl || '/placeholder.svg'} 
                          alt={`Capa da história ${story.title}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8">
                          <h1 className="text-3xl md:text-5xl font-bold text-white text-shadow-lg mb-2">
                            {story.title}
                          </h1>
                          <p className="text-lg md:text-xl text-white/90 text-shadow-md">
                            Uma história para {story.characterName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Páginas do livro
                    <div className="w-full h-full flex flex-col md:flex-row">
                      {/* Lado da ilustração */}
                      <div className={`${isMobile ? 'h-1/2' : 'w-1/2 h-full'} relative flex items-center justify-center p-4`}>
                        <img 
                          src={story.pages[currentPage - 1]?.imageUrl || '/placeholder.svg'} 
                          alt={`Ilustração da página ${currentPage}`}
                          className="max-w-full max-h-full object-contain rounded shadow-md"
                        />
                      </div>
                      
                      {/* Lado do texto */}
                      <div className={`${isMobile ? 'h-1/2' : 'w-1/2 h-full'} flex flex-col p-8 overflow-auto ${
                        isNightMode ? 'bg-gray-800' : 'bg-gray-50'
                      }`}>
                        <div className="flex-1 flex flex-col items-center justify-center">
                          <div className={`prose ${isNightMode ? 'prose-invert' : ''} max-w-none text-lg md:text-xl text-center leading-relaxed`}>
                            {story.pages[currentPage - 1]?.text.split('\n').map((paragraph, index) => (
                              <p key={index} className="mb-4">{paragraph}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-center">Nenhuma história encontrada</p>
          </div>
        )}
      </main>
      
      <Footer />
      
      {/* Estilos CSS para o modo noturno e outros efeitos */}
      <style>
        {`
        .night-mode {
          background-color: #121212;
          color: #e0e0e0;
        }
        
        .text-shadow-md {
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .text-shadow-lg {
          text-shadow: 0 4px 8px rgba(0,0,0,0.5);
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        `}
      </style>
    </div>
  );
};

export default ViewStoryPage;
