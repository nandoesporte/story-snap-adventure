
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import CoverImage from "@/components/CoverImage";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookText, CreditCard, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

interface Story {
  id: string;
  title: string;
  cover_image_url: string;
  created_at: string;
  user_id: string;
  is_public: boolean;
}

const Library = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription, isLoading: isLoadingSubscription } = useSubscription();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  
  const { data: stories, isLoading } = useQuery({
    queryKey: ["library-stories", currentPage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
        
      if (error) {
        console.error("Error fetching public stories:", error);
        toast({
          title: "Erro ao carregar histórias",
          description: "Por favor, tente novamente mais tarde.",
          variant: "destructive",
        });
        return { stories: [], totalCount: 0 };
      }
      
      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("is_public", true);
        
      if (countError) {
        console.error("Error counting stories:", countError);
      }
      
      return { 
        stories: data as Story[],
        totalCount: count || 0
      };
    },
  });

  const totalPages = stories ? Math.ceil(stories.totalCount / itemsPerPage) : 0;

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // If user is not authenticated, show login notice
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
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
                  <LogIn className="h-8 w-8 text-violet-600" />
                </div>
                <h1 className="text-3xl font-bold">Login Necessário</h1>
                <p className="text-gray-600 max-w-md mb-4">
                  Para acessar a biblioteca de histórias, você precisa estar conectado à sua conta.
                </p>
                <div className="flex gap-4">
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

  // If user doesn't have an active subscription, show subscription notice
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
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="text-3xl font-bold">Assinatura Necessária</h1>
                <p className="text-gray-600 max-w-md mb-4">
                  Para acessar a biblioteca de histórias, você precisa ter uma assinatura ativa.
                </p>
                <div className="flex gap-4">
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-violet-800 mb-4">Biblioteca de Histórias</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Explore nossa coleção de histórias mágicas criadas por nossa comunidade.
              Aqui você encontrará aventuras incríveis para se divertir e se inspirar.
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center my-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : stories && stories.stories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stories.stories.map((story) => (
                  <Card key={story.id} className="overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
                    <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                      <CoverImage
                        imageUrl={story.cover_image_url || ""}
                        fallbackImage="/images/story-placeholder.jpg"
                        alt={story.title}
                        className="w-full h-full"
                      />
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold mb-2 text-violet-700">{story.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Publicado em {formatDate(story.created_at)}
                      </p>
                      <div className="mt-auto">
                        <Button asChild className="w-full">
                          <Link to={`/view-story/${story.id}`}>
                            <BookText className="mr-2 h-4 w-4" /> Ler História
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <BookText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Nenhuma história pública encontrada.</p>
              <p className="text-sm text-gray-500">
                As histórias aparecerão aqui quando forem marcadas como públicas pelos administradores.
              </p>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Library;
