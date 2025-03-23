
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Edit, Trash2, Plus, Image } from "lucide-react";

interface Character {
  id: string;
  name: string;
  description: string;
  image_url: string;
  age: string;
  personality: string;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
}

const defaultCharacter: Omit<Character, 'id' | 'created_at'> = {
  name: "",
  description: "",
  image_url: "",
  age: "",
  personality: "",
  is_premium: false,
  is_active: true
};

export const CharacterManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState<Partial<Character>>(defaultCharacter);
  const [isEditing, setIsEditing] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Force refetch when component mounts
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-characters"] });
  }, [queryClient]);

  const { data: characters, isLoading } = useQuery({
    queryKey: ["admin-characters"],
    queryFn: async () => {
      try {
        // First, try to create the characters table if it doesn't exist
        try {
          const { error: createError } = await supabase.rpc('create_characters_table_if_not_exists');
          if (createError && !createError.message.includes('does not exist')) {
            console.warn("Error creating characters table:", createError);
          }
        } catch (err) {
          console.warn("Error calling create_characters_table_if_not_exists:", err);
        }
        
        const { data, error } = await supabase
          .from("characters")
          .select("*")
          .order("name");
        
        if (error) throw error;
        return data as Character[];
      } catch (error: any) {
        console.error("Error fetching characters:", error);
        toast({
          title: "Erro ao carregar personagens",
          description: error.message || "Ocorreu um erro ao carregar os personagens",
          variant: "destructive",
        });
        return [];
      }
    },
    staleTime: 0, // Don't cache the data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const createCharacter = useMutation({
    mutationFn: async (character: Omit<Character, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("characters")
        .insert(character)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-characters"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      toast({
        title: "Personagem criado",
        description: "Personagem criado com sucesso!",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar personagem",
        description: error.message || "Ocorreu um erro ao criar o personagem",
        variant: "destructive",
      });
    }
  });

  const updateCharacter = useMutation({
    mutationFn: async (character: Partial<Character>) => {
      const { data, error } = await supabase
        .from("characters")
        .update(character)
        .eq("id", character.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-characters"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      toast({
        title: "Personagem atualizado",
        description: "Personagem atualizado com sucesso!",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar personagem",
        description: error.message || "Ocorreu um erro ao atualizar o personagem",
        variant: "destructive",
      });
    }
  });

  const deleteCharacter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("characters")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-characters"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      toast({
        title: "Personagem excluído",
        description: "Personagem excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir personagem",
        description: error.message || "Ocorreu um erro ao excluir o personagem",
        variant: "destructive",
      });
    }
  });

  const uploadImage = async (file: File): Promise<string> => {
    setIsImageUploading(true);
    try {
      // Generate a unique file name to avoid conflicts
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `character-images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload da imagem",
        description: error.message || "Ocorreu um erro ao fazer upload da imagem",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const imageUrl = await uploadImage(file);
      setCurrentCharacter(prev => ({ ...prev, image_url: imageUrl }));
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentCharacter(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setCurrentCharacter(prev => ({ ...prev, [name]: checked }));
  };

  const handleEdit = (character: Character) => {
    setCurrentCharacter(character);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este personagem?")) {
      deleteCharacter.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCharacter.name || !currentCharacter.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e descrição são campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditing) {
      updateCharacter.mutate(currentCharacter as Character);
    } else {
      createCharacter.mutate(currentCharacter as Omit<Character, 'id' | 'created_at'>);
    }
  };

  const resetForm = () => {
    setCurrentCharacter(defaultCharacter);
    setIsEditing(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Add timestamp to image URLs to prevent caching
  const getImageUrl = (url?: string) => {
    if (!url) return null;
    return `${url}?t=${Date.now()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Gerenciar Personagens</h2>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Personagem
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : characters && characters.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {characters.map((character) => (
                <TableRow key={character.id}>
                  <TableCell>
                    {character.image_url ? (
                      <img 
                        src={getImageUrl(character.image_url)} 
                        alt={character.name} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Image className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{character.name}</TableCell>
                  <TableCell>{character.age}</TableCell>
                  <TableCell className="truncate max-w-xs">{character.description}</TableCell>
                  <TableCell>{character.is_premium ? "Sim" : "Não"}</TableCell>
                  <TableCell>{character.is_active ? "Sim" : "Não"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(character)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(character.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">Nenhum personagem encontrado.</p>
          <Button onClick={handleAddNew}>Adicionar Personagem</Button>
        </div>
      )}

      {/* Character Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Personagem" : "Novo Personagem"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Nome</label>
              <Input
                id="name"
                name="name"
                value={currentCharacter.name || ""}
                onChange={handleInputChange}
                placeholder="Nome do personagem"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="age" className="text-sm font-medium">Idade</label>
              <Input
                id="age"
                name="age"
                value={currentCharacter.age || ""}
                onChange={handleInputChange}
                placeholder="Idade do personagem"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Descrição</label>
              <Textarea
                id="description"
                name="description"
                value={currentCharacter.description || ""}
                onChange={handleInputChange}
                placeholder="Descrição do personagem"
                rows={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="personality" className="text-sm font-medium">Personalidade</label>
              <Textarea
                id="personality"
                name="personality"
                value={currentCharacter.personality || ""}
                onChange={handleInputChange}
                placeholder="Personalidade do personagem"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="image_upload" className="text-sm font-medium">Imagem do Personagem</label>
              <div className="flex items-center space-x-4">
                {currentCharacter.image_url && (
                  <img 
                    src={getImageUrl(currentCharacter.image_url)} 
                    alt={currentCharacter.name || "Prévia"} 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <Input
                    id="image_upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isImageUploading}
                  />
                </div>
              </div>
              {isImageUploading && <p className="text-sm text-blue-500">Enviando imagem...</p>}
              <Input
                id="image_url"
                name="image_url"
                value={currentCharacter.image_url || ""}
                onChange={handleInputChange}
                placeholder="ou insira a URL da imagem"
                className="mt-2"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_premium"
                checked={currentCharacter.is_premium || false}
                onCheckedChange={(checked) => handleSwitchChange("is_premium", checked)}
              />
              <label htmlFor="is_premium" className="text-sm font-medium">Personagem Premium</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={currentCharacter.is_active !== false}
                onCheckedChange={(checked) => handleSwitchChange("is_active", checked)}
              />
              <label htmlFor="is_active" className="text-sm font-medium">Personagem Ativo</label>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="ml-2" disabled={isImageUploading}>
                {isEditing ? "Atualizar" : "Criar"} Personagem
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
