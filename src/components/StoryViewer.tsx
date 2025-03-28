
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Home, Share, Download, Book, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Story } from "@/lib/supabase";
import { generatePDF } from "@/utils/cssStyles";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import VoiceNarrationPlayer from "./VoiceNarrationPlayer";

interface StoryViewerProps {
  story: Story;
  isLoading?: boolean;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ story, isLoading = false }) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [hasElevenLabsApiKey, setHasElevenLabsApiKey] = useState(false);
  
  useEffect(() => {
    // Check if user has configured ElevenLabs API key
    const apiKey = localStorage.getItem('elevenlabs_api_key');
    setHasElevenLabsApiKey(!!apiKey);
  }, []);

  const pages = story?.pages || [];
  const totalPages = pages.length;
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: story.title,
          text: `Confira esta história: ${story.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copiado",
          description: "O link da história foi copiado para a área de transferência",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setPdfGenerating(true);
      await generatePDF(story);
      toast({
        title: "PDF gerado com sucesso",
        description: "O arquivo PDF foi baixado",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o arquivo PDF",
        variant: "destructive",
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  const extractPageTexts = () => {
    return pages.map(page => page.text || '');
  };

  if (!story || isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full mt-2 md:mt-0">
      <AnimatePresence mode="wait">
        {currentPage === 0 ? (
          <motion.div
            key="cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col md:flex-row gap-4 md:gap-8 p-6 bg-white rounded-lg shadow-sm"
          >
            <div className="md:flex-1 flex flex-col items-center">
              <div className="w-full max-w-md">
                <AspectRatio ratio={3/4} className="bg-violet-50 rounded-lg overflow-hidden border-2 border-violet-100 shadow-md">
                  <img
                    src={story.cover_image_url || (story.pages && story.pages[0]?.image_url) || "/placeholder.svg"}
                    alt={`Capa da história ${story.title}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </AspectRatio>
              </div>
              
              <div className="w-full mt-6 flex flex-col items-center">
                <div className="text-center max-w-md">
                  <h1 className="text-3xl font-bold text-violet-800 mb-2">{story.title}</h1>
                  <p className="text-lg mb-4">
                    Personagem: <span className="font-medium">{story.character_name}</span>
                    {story.character_age && (
                      <span>, {story.character_age}</span>
                    )}
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {story.theme && (
                      <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                        {story.theme}
                      </Badge>
                    )}
                    {story.setting && (
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        {story.setting}
                      </Badge>
                    )}
                    {story.style && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {story.style}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {hasElevenLabsApiKey && (
                  <VoiceNarrationPlayer
                    storyId={story.id || ''}
                    pages={extractPageTexts()}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                )}
                
                <div className="flex flex-wrap gap-2 mt-6 w-full max-w-md justify-center">
                  <Button 
                    variant="story" 
                    size="lg" 
                    onClick={handleNextPage} 
                    className="flex-1 max-w-[200px]"
                  >
                    Começar a Ler <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>

                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleShare} 
                    title="Compartilhar"
                  >
                    <Share className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDownloadPDF}
                    disabled={pdfGenerating}
                    title="Baixar PDF"
                  >
                    {pdfGenerating ? (
                      <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-violet-500 rounded-full"></div>
                    ) : (
                      <Download className="h-5 w-5" />
                    )}
                  </Button>

                  <Link to="/my-stories">
                    <Button 
                      variant="outline" 
                      size="icon"
                      title="Voltar para Minhas Histórias"
                    >
                      <Home className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="md:flex-1 mt-6 md:mt-0">
              <div className="p-6 bg-violet-50 rounded-lg border border-violet-100">
                <h2 className="text-xl font-semibold mb-4 text-violet-800">
                  <Book className="inline-block mr-2 h-5 w-5" />
                  Sobre esta história
                </h2>
                
                <div className="prose prose-violet">
                  <p className="text-gray-700 mb-4">
                    Uma emocionante história sobre {story.character_name}, 
                    {story.character_age && ` de ${story.character_age},`} em uma aventura 
                    {story.theme && ` que aborda o tema de ${story.theme}`}
                    {story.setting && ` e se passa em ${story.setting}`}.
                  </p>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      Esta história contém {totalPages} páginas com ilustrações geradas por IA.
                    </p>
                    
                    {!hasElevenLabsApiKey && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="mt-4 text-violet-700 hover:text-violet-800 hover:bg-violet-100 p-0 flex items-center gap-1"
                          >
                            <Volume2 className="h-4 w-4" />
                            <span className="underline">Ativar narração por voz</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Narração por Voz</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <p className="mb-4">
                              Para ativar a narração por voz, você precisa configurar sua chave da API do ElevenLabs nas configurações.
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                              A narração por voz permite que as histórias sejam narradas com vozes naturais em português, facilitando a experiência de leitura para as crianças.
                            </p>
                            <Link to="/settings">
                              <Button className="w-full">
                                <Settings className="mr-2 h-4 w-4" />
                                Ir para Configurações
                              </Button>
                            </Link>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`page-${currentPage}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 bg-white rounded-lg shadow-sm"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2">
                <AspectRatio ratio={1} className="bg-violet-50 rounded-lg overflow-hidden border border-violet-100">
                  <img
                    src={pages[currentPage]?.image_url || "/placeholder.svg"}
                    alt={`Ilustração página ${currentPage + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </AspectRatio>
              </div>

              <div className="md:w-1/2 flex flex-col">
                <div className="prose prose-violet flex-grow">
                  <h2 className="text-xl font-bold text-violet-800 mb-4">
                    {story.title} - Página {currentPage} de {totalPages - 1}
                  </h2>
                  <div>
                    {pages[currentPage]?.text?.split("\n").map((paragraph, i) => (
                      <p key={i} className="mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {hasElevenLabsApiKey && (
                  <VoiceNarrationPlayer
                    storyId={story.id || ''}
                    pages={extractPageTexts()}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                )}

                <div className="flex justify-between mt-6">
                  <Button
                    onClick={handlePrevPage}
                    disabled={isFirstPage}
                    variant="outline"
                    className="flex items-center"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleShare}
                      title="Compartilhar"
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDownloadPDF}
                      disabled={pdfGenerating}
                      title="Baixar PDF"
                    >
                      {pdfGenerating ? (
                        <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-violet-500 rounded-full"></div>
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Link to="/my-stories">
                      <Button 
                        variant="outline" 
                        size="icon"
                        title="Voltar para Minhas Histórias"
                      >
                        <Home className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <Button
                    onClick={handleNextPage}
                    disabled={isLastPage}
                    variant="story"
                    className="flex items-center"
                  >
                    Próxima
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoryViewer;
