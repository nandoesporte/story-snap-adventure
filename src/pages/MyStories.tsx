
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { getUserStories, deleteStory, Story } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Trash, Plus, BookOpen, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

const MyStories = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: stories,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['userStories'],
    queryFn: getUserStories,
    meta: {
      onError: (error: Error) => {
        toast.error(`Erro ao carregar histórias: ${error.message}`);
      },
    },
  });

  const handleDeleteStory = async () => {
    if (!storyToDelete) return;

    setIsDeleting(true);
    try {
      await deleteStory(storyToDelete);
      toast.success('História excluída com sucesso');
      refetch();
    } catch (error: any) {
      toast.error(`Erro ao excluir história: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setStoryToDelete(null);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <motion.div
        className="flex-grow py-10 px-4 bg-gradient-to-b from-violet-50 to-indigo-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-violet-800">Minhas Histórias</h1>
            <Link to="/create-story">
              <Button variant="storyPrimary">
                <Plus className="mr-2 h-4 w-4" />
                Nova História
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : isError ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                  <div>
                    <p className="text-lg font-medium text-red-800">Erro ao carregar histórias</p>
                    <p className="text-red-600">Ocorreu um erro ao tentar carregar suas histórias. Tente novamente mais tarde.</p>
                  </div>
                  <Button onClick={() => refetch()} variant="outline" className="mt-2">
                    Tentar novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : stories && stories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story: Story) => (
                <Card key={story.id} className="overflow-hidden border border-violet-100 transition-all hover:shadow-md">
                  <div className="aspect-[16/9] relative overflow-hidden bg-violet-100">
                    {story.cover_image_url ? (
                      <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-violet-200 to-indigo-200">
                        <BookOpen className="h-12 w-12 text-violet-500" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg truncate">{story.title}</CardTitle>
                    <CardDescription>
                      Personagem: {story.character_name}, {story.character_age}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">Tema:</span> {story.theme}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Cenário:</span> {story.setting}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Estilo:</span> {story.style}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Link to={`/view-story/${story.id}`}>
                      <Button variant="story">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Ler História
                      </Button>
                    </Link>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setStoryToDelete(story.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Excluir História</DialogTitle>
                          <DialogDescription>
                            Tem certeza que deseja excluir a história "{story.title}"? Esta ação não pode ser desfeita.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex space-x-2 justify-end">
                          <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteStory}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Excluindo...' : 'Excluir'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-violet-200 bg-white/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4 py-8">
                  <BookOpen className="h-12 w-12 text-violet-400" />
                  <div>
                    <p className="text-lg font-medium text-violet-800">Você ainda não tem histórias</p>
                    <p className="text-gray-600">Crie sua primeira história personalizada agora!</p>
                  </div>
                  <Link to="/create-story">
                    <Button variant="storyPrimary" className="mt-2">
                      Criar Nova História
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
      <Footer />
    </div>
  );
};

export default MyStories;
