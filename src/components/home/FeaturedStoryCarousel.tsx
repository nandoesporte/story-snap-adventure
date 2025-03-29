
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ArrowRight, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { NavLink } from "react-router-dom";

interface FeaturedStory {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  storyId?: string;
}

const FALLBACK_STORIES: FeaturedStory[] = [
  {
    id: "1",
    title: "A Aventura de Baloo na Floresta",
    description: "Baloo continuou sua caminhada pela floresta, feliz que poderia ajudar. Ele viu muitos animais, todos ocupados com suas próprias tarefas. Baloo sabia que ser gentil e paciente tornava a floresta um lugar melhor para todos.",
    imageUrl: "/lovable-uploads/e2f964c8-d70d-4c65-b8d9-2e392a4b163d.png",
    storyId: "featured-1"
  },
  {
    id: "2",
    title: "Amigos da Floresta Encantada",
    description: "Luna descobriu uma floresta mágica onde os animais podiam falar. Juntos, eles embarcaram em uma jornada para proteger seu lar das sombras que se aproximavam.",
    imageUrl: "/images/covers/adventure.jpg",
    storyId: "featured-2"
  },
  {
    id: "3",
    title: "O Mistério do Oceano Profundo",
    description: "Tiago e sua tartaruga amiga mergulham nas profundezas do oceano para descobrir tesouros perdidos e conhecer criaturas fascinantes que guardam segredos milenares.",
    imageUrl: "/images/covers/ocean.jpg",
    storyId: "featured-3"
  }
];

const FeaturedStoryCarousel = () => {
  const [stories, setStories] = useState<FeaturedStory[]>(FALLBACK_STORIES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const isMobile = useIsMobile();

  // Fetch featured stories from database if available
  const { data: featuredStories } = useQuery({
    queryKey: ["featured-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_stories")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching featured stories:", error);
        return null;
      }

      return data;
    },
  });

  useEffect(() => {
    if (featuredStories && featuredStories.length > 0) {
      const formattedStories = featuredStories.map((story: any) => ({
        id: story.id,
        title: story.title,
        description: story.description || story.excerpt || "",
        imageUrl: story.image_url || story.cover_image_url || "/images/covers/adventure.jpg",
        storyId: story.story_id
      }));
      setStories(formattedStories);
    }
  }, [featuredStories]);

  const handlePlayNarration = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, you would trigger audio playback here
  };

  const getFormattedTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <section className="py-16 bg-gradient-to-b from-indigo-50 to-white overflow-hidden">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-4">
            HISTÓRIA DO MÊS
          </h2>
          <div className="w-24 h-1 bg-indigo-600 mx-auto mb-6"></div>
          <p className="text-indigo-700/80 max-w-2xl mx-auto">
            Descubra nossas histórias em destaque, cuidadosamente selecionadas para entreter e inspirar seu filho.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <Carousel 
            className="w-full"
            onSelect={(api) => {
              if (api) setActiveIndex(api.selectedScrollSnap());
            }}
          >
            <CarouselContent>
              {stories.map((story, index) => (
                <CarouselItem key={story.id}>
                  <div className="w-full overflow-hidden rounded-2xl shadow-xl bg-white">
                    <div className={cn(
                      "grid gap-4",
                      isMobile ? "grid-cols-1" : "grid-cols-2"
                    )}>
                      <div className="p-8 flex flex-col justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-4">
                            {story.title}
                          </h3>
                          <p className="text-gray-600 mb-6 leading-relaxed">
                            {story.description}
                          </p>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex items-center mb-4">
                            <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full w-[15%] rounded-full"></div>
                            </div>
                            <div className="ml-4 text-sm text-gray-500 whitespace-nowrap">
                              {getFormattedTimestamp(15)} / {getFormattedTimestamp(300)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="rounded-full"
                              onClick={handlePlayNarration}
                            >
                              <Play className="h-5 w-5 fill-indigo-600 text-indigo-600" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="rounded-full"
                            >
                              <Volume2 className="h-5 w-5 text-indigo-600" />
                            </Button>
                            
                            <div className="flex-1"></div>
                            
                            <NavLink to={story.storyId ? `/view-story/${story.storyId}` : "/create-story"}>
                              <Button 
                                variant="default" 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full"
                              >
                                {story.storyId ? "Ler História" : "Criar História Semelhante"}
                              </Button>
                            </NavLink>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative h-full min-h-[300px]">
                        <img
                          src={story.imageUrl}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <div className="flex items-center justify-center mt-8 gap-2">
              <CarouselPrevious className="relative inset-0 translate-y-0 left-0 rounded-full" />
              
              <div className="flex items-center justify-center gap-2">
                {stories.map((_, index) => (
                  <span
                    key={index}
                    className={`block h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                      activeIndex === index ? "bg-indigo-600 w-5" : "bg-indigo-300"
                    }`}
                  />
                ))}
              </div>
              
              <CarouselNext className="relative inset-0 translate-y-0 right-0 rounded-full" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default FeaturedStoryCarousel;
