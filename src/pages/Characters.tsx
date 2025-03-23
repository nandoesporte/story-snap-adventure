
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Character {
  id: string;
  name: string;
  description: string;
  image_url: string;
  age: string;
  personality: string;
  is_premium: boolean;
  created_at: string;
}

const Characters = () => {
  const { data: characters, isLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("is_active", true)
        .order("name");
        
      if (error) {
        console.error("Error fetching characters:", error);
        return [];
      }
      
      return data as Character[];
    },
  });

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
            <h1 className="text-4xl font-bold text-violet-800 mb-4">Nossos Personagens</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Conheça os personagens disponíveis para criar histórias incríveis. 
              Cada personagem tem sua própria personalidade e história.
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center my-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : characters && characters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {characters.map((character) => (
                <Card key={character.id} className="overflow-hidden transition-all hover:shadow-lg">
                  <div className="aspect-square relative overflow-hidden bg-gray-100">
                    {character.image_url ? (
                      <img
                        src={character.image_url}
                        alt={character.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-violet-50">
                        <span className="text-5xl text-violet-200">{character.name.charAt(0)}</span>
                      </div>
                    )}
                    {character.is_premium && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-xs font-medium px-2 py-1 rounded-full">
                        Premium
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-xl font-bold mb-2 text-violet-700">{character.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">Idade: {character.age}</p>
                    <p className="text-sm text-gray-700 line-clamp-3">{character.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Nenhum personagem encontrado.</p>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Characters;
