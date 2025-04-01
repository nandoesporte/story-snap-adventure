import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Volume, VolumeX, ChevronLeft, ChevronRight, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';
import { useIsMobile } from '@/hooks/use-mobile';
import { validateAndFixStoryImages } from '@/lib/imageHelper';
import CoverImage from '@/components/CoverImage';
import { setupStorageBuckets } from "@/lib/storageBucketSetup";

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

const useSpeechSynthesis = (text: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechRef.current = new SpeechSynthesisUtterance(text);
      speechRef.current.lang = 'pt-BR';
      speechRef.current.rate = 0.9;
      speechRef.current.pitch = 1.1;
      
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
  const isMobile = useIsMobile();
  
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');
  const [hideText, setHideText] = useState(false);
  
  const bookRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  
  const currentText = story && currentPage > 0 
    ? story.pages[currentPage - 1]?.text || "" 
    : (story?.title || "");
  const { isPlaying, play } = useSpeechSynthesis(currentText);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const initStorage = async () => {
      try {
        const result = await setupStorageBuckets();
        if (!result) {
          console.error("Failed to initialize storage buckets");
          toast.error("Erro ao configurar armazenamento de imagens", { 
            id: "storage-init-error",
            duration: 3000 
          });
        }
      } catch (err) {
        console.error("Error initializing storage:", err);
      }
    };
    
    initStorage();
  }, []);

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
          const formattedStory: Story = {
            id: data.id,
            title: data.title,
            coverImageUrl: data.cover_image_url,
            characterName: data.character_name,
            pages: data.pages || []
          };
          
          setStory(formattedStory);
          
          if (data.id) {
            try {
              console.log("Validating and fixing story images");
              const fixedData = await validateAndFixStoryImages(data);
              
              if (JSON.stringify(fixedData) !== JSON.stringify(data)) {
                console.log("Story data updated with fixed images");
                setStory({
                  id: fixedData.id,
                  title: fixedData.title,
                  coverImageUrl: fixedData.cover_image_url,
                  characterName: fixedData.character_name,
                  pages: fixedData.pages || []
                });
              }
            } catch (imageError) {
              console.error("Error validating images:", imageError);
            }
          }
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

  const toggleTextVisibility = () => {
    setHideText(!hideText);
  };

  const handlePreviousPage = () => {
    if (currentPage > 0 && !isFlipping) {
      setFlipDirection('left');
      setIsFlipping(true);
      
      if (bookRef.current) {
        bookRef.current.style.transform = 'rotateY(-15deg)';
        bookRef.current.style.opacity = '0.9';
      }
      
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
      
      if (bookRef.current) {
        bookRef.current.style.transform = 'rotateY(15deg)';
        bookRef.current.style.opacity = '0.9';
      }
      
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

  const toggleNightMode = () => {
    setIsNightMode(!isNightMode);
    
    if (containerRef.current) {
      containerRef.current.classList.toggle('night-mode');
    }
  };

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
        
        {!isMobile && <Footer />}
      </div>
    );
  }

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
        
        {!isMobile && <Footer />}
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
            {isMobile && (
              <div className="fixed bottom-6 left-0 right-0 z-50 px-4">
                <div className="flex justify-center items-center gap-3">
                  <div className="flex bg-white/80 backdrop-blur-md shadow-lg rounded-full p-1.5">
                    {currentPage > 0 && !isFlipping && (
                      <Button
                        onClick={handlePreviousPage}
                        className="rounded-full w-10 h-10 flex items-center justify-center bg-transparent hover:bg-gray-100 text-gray-800"
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                    )}
                    
                    <Button
                      onClick={toggleNightMode}
                      className={`rounded-full w-10 h-10 flex items-center justify-center bg-transparent hover:bg-gray-100 text-gray-800`}
                      aria-label={isNightMode ? "Modo dia" : "Modo noite"}
                    >
                      {isNightMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                    
                    <Button
                      onClick={play}
                      className={`rounded-full w-10 h-10 flex items-center justify-center bg-transparent hover:bg-gray-100 text-gray-800`}
                      aria-label={isPlaying ? "Parar narração" : "Ouvir narração"}
                    >
                      {isPlaying ? <VolumeX className="h-5 w-5" /> : <Volume className="h-5 w-5" />}
                    </Button>
                    
                    <Button
                      onClick={toggleTextVisibility}
                      className={`rounded-full w-10 h-10 flex items-center justify-center bg-transparent hover:bg-gray-100 text-gray-800`}
                      aria-label={hideText ? "Mostrar texto" : "Ocultar texto"}
                    >
                      <Type className="h-5 w-5" />
                    </Button>
                    
                    {currentPage < story.pages.length && !isFlipping && (
                      <Button
                        onClick={handleNextPage}
                        className="rounded-full w-10 h-10 flex items-center justify-center bg-transparent hover:bg-gray-100 text-gray-800"
                        aria-label="Próxima página"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {!isMobile && (
              <>
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
              </>
            )}
            
            <div 
              className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 py-2 px-6 rounded-full font-medium ${
                isNightMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
              } shadow-md`}
            >
              Página {currentPage > 0 ? currentPage : 1} de {story.pages.length + 1}
            </div>
            
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
                  className={`w-full max-w-4xl ${isMobile ? 'h-[90vh]' : 'h-[80vh]'} ${
                    isNightMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                  } rounded-lg shadow-xl overflow-hidden`}
                >
                  {currentPage === 0 ? (
                    <div className="w-full h-full flex flex-col">
                      <div className="flex-1 relative">
                        <CoverImage 
                          imageUrl={story.coverImageUrl || '/placeholder.svg'} 
                          fallbackImage="/placeholder.svg"
                          alt={`Capa da história ${story.title}`}
                          className="w-full h-full"
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
                    isMobile ? (
                      <div className="w-full h-full relative">
                        <div className="absolute inset-0 z-0">
                          <CoverImage 
                            imageUrl={story.pages[currentPage - 1]?.imageUrl || '/placeholder.svg'} 
                            fallbackImage="/placeholder.svg"
                            alt={`Ilustração da página ${currentPage}`}
                            className="w-full h-full"
                          />
                        </div>
                        
                        {!hideText && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end z-10">
                            <div className="p-5 pb-16">
                              <div className="prose prose-sm prose-invert max-w-none text-white">
                                {story.pages[currentPage - 1]?.text.split('\n').map((paragraph, index) => (
                                  <p key={index} className="mb-3 leading-relaxed text-white/90 text-shadow">
                                    {paragraph}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col md:flex-row">
                        <div className="w-1/2 h-full relative flex items-center justify-center p-4">
                          <CoverImage 
                            imageUrl={story.pages[currentPage - 1]?.imageUrl || '/placeholder.svg'} 
                            fallbackImage="/placeholder.svg"
                            alt={`Ilustração da página ${currentPage}`}
                            className="max-w-full max-h-full rounded shadow-md"
                          />
                        </div>
                        
                        <div className="w-1/2 h-full flex flex-col p-8 overflow-auto ${
                          isNightMode ? 'bg-gray-800' : 'bg-gray-50'
                        }">
                          <div className="flex-1 flex flex-col items-center justify-center">
                            <div className={`prose ${isNightMode ? 'prose-invert' : ''} max-w-none text-lg md:text-xl text-center leading-relaxed`}>
                              {story.pages[currentPage - 1]?.text.split('\n').map((paragraph, index) => (
                                <p key={index} className="mb-4">{paragraph}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
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
      
      {!isMobile && <Footer />}
      
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
        
        .text-shadow {
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
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
