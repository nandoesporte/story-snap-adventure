
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Edit, Trash2, PlusCircle, Eye, ExternalLink } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FeaturedStory {
  id: string;
  title: string;
  description: string;
  image_url: string;
  story_id?: string;
  created_at: string;
}

export const FeaturedStoryManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [currentFeaturedStory, setCurrentFeaturedStory] = useState<Partial<FeaturedStory>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Fetch featured stories
  const { data: featuredStories, isLoading, error } = useQuery({
    queryKey: ["featured-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_stories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching featured stories:", error);
        toast.error("Erro ao carregar histórias em destaque");
        return [];
      }
      
      return data || [];
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (story: Partial<FeaturedStory>) => {
      const { data, error } = await supabase
        .from("featured_stories")
        .insert([story])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-stories"] });
      toast.success("História adicionada aos destaques com sucesso");
      setIsDialogOpen(false);
      setCurrentFeaturedStory({});
    },
    onError: (error) => {
      console.error("Error creating featured story:", error);
      toast.error("Erro ao adicionar história aos destaques");
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...story }: Partial<FeaturedStory>) => {
      const { data, error } = await supabase
        .from("featured_stories")
        .update(story)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-stories"] });
      toast.success("História em destaque atualizada com sucesso");
      setIsDialogOpen(false);
      setCurrentFeaturedStory({});
    },
    onError: (error) => {
      console.error("Error updating featured story:", error);
      toast.error("Erro ao atualizar história em destaque");
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("featured_stories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-stories"] });
      toast.success("História removida dos destaques com sucesso");
    },
    onError: (error) => {
      console.error("Error deleting featured story:", error);
      toast.error("Erro ao remover história dos destaques");
    }
  });

  const handleAddFeatured = () => {
    setIsEditing(false);
    setCurrentFeaturedStory({});
    setIsDialogOpen(true);
  };

  const handleEditFeatured = (story: FeaturedStory) => {
    setIsEditing(true);
    setCurrentFeaturedStory(story);
    setIsDialogOpen(true);
  };

  const handleDeleteFeatured = (id: string) => {
    if (confirm("Tem certeza que deseja remover esta história dos destaques?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentFeaturedStory((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!currentFeaturedStory.title || !currentFeaturedStory.description) {
      toast.error("Por favor preencha todos os campos obrigatórios");
      return;
    }

    if (isEditing && currentFeaturedStory.id) {
      updateMutation.mutate(currentFeaturedStory as FeaturedStory);
    } else {
      createMutation.mutate(currentFeaturedStory);
    }
  };

  const handleFileUploadComplete = (file: File) => {
    setIsImageUploading(true);
    
    if (file.size > 2 * 1024 * 1024) { // Limit to 2MB
      toast.error("O tamanho máximo permitido é 2MB");
      setIsImageUploading(false);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setCurrentFeaturedStory(prev => ({ ...prev, image_url: base64String }));
      setIsImageUploading(false);
    };
    
    reader.onerror = () => {
      toast.error("Não foi possível processar a imagem selecionada");
      setIsImageUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Gerenciar História do Mês</h2>
        <Button onClick={handleAddFeatured}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Destaque
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Erro ao carregar histórias em destaque
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {featuredStories?.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground mb-4">Nenhuma história em destaque encontrada</p>
                <Button onClick={handleAddFeatured}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Destaque
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Imagem</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>ID da História</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featuredStories?.map((story: FeaturedStory) => (
                    <TableRow key={story.id}>
                      <TableCell>
                        {story.image_url && (
                          <div className="w-16 h-16 relative rounded overflow-hidden">
                            <img 
                              src={story.image_url} 
                              alt={story.title} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{story.title}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {story.description?.substring(0, 100)}{story.description?.length > 100 ? '...' : ''}
                      </TableCell>
                      <TableCell>{story.story_id || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="icon" onClick={() => handleEditFeatured(story)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDeleteFeatured(story.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar História em Destaque" : "Adicionar História em Destaque"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Altere os detalhes da história em destaque abaixo." 
                : "Preencha os detalhes para adicionar uma nova história em destaque."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Título *
              </label>
              <Input
                id="title"
                name="title"
                value={currentFeaturedStory.title || ""}
                onChange={handleInputChange}
                placeholder="Título da história"
              />
            </div>
            
            <div className="grid items-center gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descrição *
              </label>
              <Textarea
                id="description"
                name="description"
                value={currentFeaturedStory.description || ""}
                onChange={handleInputChange}
                placeholder="Breve descrição da história"
                rows={3}
              />
            </div>
            
            <div className="grid items-center gap-2">
              <label htmlFor="story_id" className="text-sm font-medium">
                ID da História (opcional)
              </label>
              <Input
                id="story_id"
                name="story_id"
                value={currentFeaturedStory.story_id || ""}
                onChange={handleInputChange}
                placeholder="ID da história para linkagem (opcional)"
              />
              <p className="text-xs text-muted-foreground">
                Se preenchido, os usuários poderão acessar diretamente esta história.
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="image_upload" className="text-sm font-medium">
                Imagem da História *
              </label>
              
              <div className="mt-2">
                {currentFeaturedStory.image_url ? (
                  <div className="space-y-4">
                    <div className="relative w-full h-40 rounded-md overflow-hidden border">
                      <img 
                        src={currentFeaturedStory.image_url} 
                        alt="Prévia" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      type="button" 
                      onClick={() => setCurrentFeaturedStory(prev => ({ ...prev, image_url: "" }))}
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
                <label htmlFor="image_url" className="text-sm font-medium">Ou informe a URL da imagem</label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={currentFeaturedStory.image_url || ""}
                  onChange={handleInputChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!currentFeaturedStory.title || !currentFeaturedStory.description || !currentFeaturedStory.image_url}
            >
              {isEditing ? "Salvar Alterações" : "Adicionar Destaque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeaturedStoryManager;
