
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Edit, Trash2, Plus, Image, AlertTriangle, RefreshCcw, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import FileUpload from "@/components/FileUpload";

interface Story {
  id: string;
  title: string;
  content: string;
  cover_image_url: string;
  user_id: string;
  created_at: string;
  is_public: boolean;
}

export const StoryManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStory, setCurrentStory] = useState<Partial<Story>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError(error);
        toast({
          title: "Erro ao carregar histórias",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setStories(data || []);
      }
    } catch (error: any) {
      setError(error);
      toast({
        title: "Erro ao carregar histórias",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createStory = async (newStory: Omit<Story, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from("stories")
        .insert([newStory])
        .select()
        .single();
      if (error) {
        throw error;
      }
      setStories([...stories, data]);
      toast({
        title: "História criada",
        description: "História criada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar história",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateStory = async (storyId: string, updatedStory: Partial<Story>) => {
    try {
      const { data, error } = await supabase
        .from("stories")
        .update(updatedStory)
        .eq("id", storyId)
        .select()
        .single();
      if (error) {
        throw error;
      }
      setStories(
        stories.map((story) => (story.id === storyId ? { ...story, ...data } : story))
      );
      toast({
        title: "História atualizada",
        description: "História atualizada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar história",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase.from("stories").delete().eq("id", storyId);
      if (error) {
        throw error;
      }
      setStories(stories.filter((story) => story.id !== storyId));
      toast({
        title: "História excluída",
        description: "História excluída com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir história",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentStory((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (story: Story) => {
    setCurrentStory(story);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta história?")) {
      deleteStory(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentStory.id) {
      await updateStory(currentStory.id, currentStory);
    } else {
      await createStory({
        title: currentStory.title || "",
        content: currentStory.content || "",
        cover_image_url: currentStory.cover_image_url || "",
        user_id: user?.id || "",
        is_public: false,
      });
    }
    setIsDialogOpen(false);
    setCurrentStory({});
    setIsEditing(false);
    fetchStories();
  };

  const handleAddNew = () => {
    setCurrentStory({});
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleFileUploadComplete = (file: File) => {
    setIsImageUploading(true);
    
    if (file.size > 2 * 1024 * 1024) { // Limit to 2MB
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 2MB",
        variant: "destructive",
      });
      setIsImageUploading(false);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setCurrentStory(prev => ({ ...prev, cover_image_url: base64String }));
      setIsImageUploading(false);
    };
    
    reader.onerror = () => {
      toast({
        title: "Erro ao processar imagem",
        description: "Não foi possível processar a imagem selecionada",
        variant: "destructive",
      });
      setIsImageUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleTogglePublic = async (storyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('stories')
        .update({ is_public: !currentStatus })
        .eq('id', storyId);
        
      if (error) {
        console.error("Erro ao atualizar visibilidade da história:", error);
        toast({
          title: "Erro ao atualizar história",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      setStories(currentStories => 
        currentStories.map(story => 
          story.id === storyId ? {...story, is_public: !currentStatus} : story
        )
      );
      
      toast({
        title: "História atualizada",
        description: `História ${!currentStatus ? "adicionada à" : "removida da"} Biblioteca Pública`,
      });
      
    } catch (error: any) {
      console.error("Erro ao atualizar história:", error);
      toast({
        title: "Erro ao atualizar história",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Gerenciar Histórias</h2>
        <Button onClick={handleAddNew}>Adicionar Nova</Button>
      </div>
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Pública</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stories.map((story) => (
                <TableRow key={story.id}>
                  <TableCell className="font-medium">{story.title}</TableCell>
                  <TableCell>
                    {/* Add check for content existence before using substring */}
                    {story.content ? story.content.substring(0, 50) + '...' : 'Sem conteúdo'}
                  </TableCell>
                  <TableCell>{user?.email}</TableCell>
                  <TableCell>
                    <Switch
                      checked={story.is_public || false}
                      onCheckedChange={() => handleTogglePublic(story.id, story.is_public || false)}
                      aria-label="Toggle public visibility"
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="icon" onClick={() => handleEdit(story)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(story.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar História" : "Criar História"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Edite os campos abaixo para atualizar a história." : "Preencha os campos abaixo para criar uma nova história."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="title" className="text-right text-sm font-medium leading-none text-right">
                Título
              </label>
              <Input
                id="title"
                value={currentStory.title || ""}
                onChange={handleInputChange}
                className="col-span-3"
                name="title"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="content" className="text-right text-sm font-medium leading-none text-right">
                Conteúdo
              </label>
              <Textarea
                id="content"
                value={currentStory.content || ""}
                onChange={handleInputChange}
                className="col-span-3"
                name="content"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="image_upload" className="text-sm font-medium">Imagem de Capa</label>
              
              <div className="mt-2">
                {currentStory.cover_image_url ? (
                  <div className="flex items-center space-x-4 mb-4">
                    <img 
                      src={currentStory.cover_image_url} 
                      alt={currentStory.title || "Prévia"} 
                      className="w-16 h-16 rounded-full object-cover" 
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      type="button" 
                      onClick={() => setCurrentStory(prev => ({ ...prev, cover_image_url: "" }))}
                    >
                      Remover Imagem
                    </Button>
                  </div>
                ) : (
                  <FileUpload 
                    onFileSelect={handleFileUploadComplete}
                    uploadType="image"
                  />
                )}
              </div>
              
              {isImageUploading && <p className="text-sm text-blue-500">Processando imagem...</p>}
              
              <div className="mt-2">
                <label htmlFor="cover_image_url" className="text-sm font-medium">Ou informe a URL da imagem</label>
                <Input
                  id="cover_image_url"
                  name="cover_image_url"
                  value={currentStory.cover_image_url || ""}
                  onChange={handleInputChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleSubmit}>
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
