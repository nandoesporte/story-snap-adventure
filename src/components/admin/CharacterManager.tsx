import React from 'react';
import { useState, useEffect } from "react";
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
  creator_id?: string;
  generation_prompt?: string;
}

const defaultCharacter: Omit<Character, 'id' | 'created_at'> = {
  name: "",
  description: "",
  image_url: "",
  age: "",
  personality: "",
  is_premium: false,
  is_active: true,
  generation_prompt: ""
};

export const CharacterManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState<Partial<Character>>(defaultCharacter);
  const [isEditing, setIsEditing] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { user } = useAuth();

  const initializeDatabase = async () => {
    setIsInitializing(true);
    setErrorMessage(null);
    
    try {
      console.log("Loading initialization SQL script...");
      
      const createTableSQL = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TABLE IF NOT EXISTS public.characters (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          image_url TEXT,
          age TEXT,
          personality TEXT,
          is_premium BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          creator_id UUID REFERENCES auth.users(id),
          generation_prompt TEXT
        );
        
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'characters' AND column_name = 'generation_prompt'
          ) THEN
            ALTER TABLE public.characters ADD COLUMN generation_prompt TEXT;
          END IF;
        END
        $$;
        
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'characters' AND policyname = 'Anyone can view active characters'
          ) THEN
            ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Anyone can view active characters" 
                ON public.characters 
                FOR SELECT 
                USING (is_active = true);
                
            CREATE POLICY "Admin users can manage characters" 
                ON public.characters 
                FOR ALL
                USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles
                        WHERE user_profiles.id = auth.uid()
                        AND user_profiles.is_admin = true
                    )
                );
                
            CREATE POLICY "Users can insert their own characters"
                ON public.characters
                FOR INSERT
                WITH CHECK (auth.uid() IS NOT NULL);
                
            CREATE POLICY "Users can update their own characters"
                ON public.characters
                FOR UPDATE
                USING (creator_id = auth.uid());
                
            CREATE POLICY "Users can delete their own characters"
                ON public.characters
                FOR DELETE
                USING (creator_id = auth.uid());
          END IF;
        END
        $$;
        
        CREATE OR REPLACE FUNCTION update_characters_modified()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_trigger
            WHERE tgname = 'characters_updated_at'
          ) THEN
            CREATE TRIGGER characters_updated_at
            BEFORE UPDATE ON public.characters
            FOR EACH ROW EXECUTE FUNCTION update_characters_modified();
          END IF;
        END
        $$;
        
        INSERT INTO public.characters (name, description, personality, age, is_active)
        SELECT 
          'Pingo, o Pinguim Inventor', 
          'Pinguim genial que cria bugigangas incríveis', 
          'Curioso, inteligente e sempre pensando em novas invenções', 
          '8 anos', 
          true
        WHERE NOT EXISTS (SELECT 1 FROM public.characters LIMIT 1);
        
        INSERT INTO public.characters (name, description, personality, age, is_active)
        SELECT 
          'Flora, a Fadinha das Flores', 
          'Fada encantadora que cuida do jardim mágico', 
          'Gentil, alegre e apaixonada pela natureza', 
          '100 anos (mas parece 6)', 
          true
        WHERE NOT EXISTS (SELECT 1 FROM public.characters LIMIT 1);
      `;
      
      console.log("Executing simplified SQL...");
      const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL });
      
      if (createError) {
        console.error("Error executing simplified SQL:", createError);
        setErrorMessage(`Erro ao criar tabela: ${createError.message}`);
        throw createError;
      }
      
      console.log("Database initialization completed successfully");
      toast({
        title: "Banco de dados inicializado",
        description: "A estrutura do banco de dados foi inicializada com sucesso!",
      });
      
      queryClient.invalidateQueries({ queryKey: ["admin-characters"] });
    } catch (error: any) {
      console.error("Error initializing database:", error);
      
      try {
        console.log("Attempting simplest table creation as last resort...");
        const simpleCreateTable = `
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          
          CREATE TABLE IF NOT EXISTS public.characters (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            image_url TEXT,
            age TEXT,
            personality TEXT,
            is_premium BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME TIME DEFAULT NOW(),
            creator_id UUID REFERENCES auth.users(id)
          );
        `;
        
        const { error: simpleCreateError } = await supabase.rpc('exec', { sql: simpleCreateTable });
        
        if (simpleCreateError) {
          setErrorMessage(`Falha na criação da tabela: ${simpleCreateError.message}`);
          throw simpleCreateError;
        } else {
          toast({
            title: "Tabela criada com sucesso",
            description: "A tabela base foi criada, mas sem políticas RLS. As políticas serão criadas em seguida.",
            variant: "default",
          });
          
          const rlsPolicies = `
            ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY IF NOT EXISTS "Anyone can view active characters" 
                ON public.characters 
                FOR SELECT 
                USING (is_active = true);
          `;
          
          try {
            await supabase.rpc('exec', { sql: rlsPolicies });
          } catch (err) {
            console.warn("Couldn't create RLS policies, but table was created:", err);
          }
          
          queryClient.invalidateQueries({ queryKey: ["admin-characters"] });
        }
      } catch (finalError: any) {
        console.error("All table creation attempts failed:", finalError);
        setErrorMessage(`Não foi possível criar a tabela. Erro: ${finalError.message || "Erro desconhecido"}`);
        toast({
          title: "Erro ao inicializar banco de dados",
          description: finalError.message || "Ocorreu um erro ao inicializar o banco de dados",
          variant: "destructive",
        });
      }
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-characters"] });
  }, [queryClient]);

  const { data: characters, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["admin-characters"],
    queryFn: async () => {
      try {
        setErrorMessage(null);
        
        console.log("Fetching characters data...");
        const { data, error } = await supabase
          .from("characters")
          .select("*")
          .order("name");
        
        if (error) {
          console.error("Error fetching characters:", error);
          if (error.code === '42P01') {
            console.log("Table doesn't exist, auto-initializing...");
            await initializeDatabase();
            
            const { data: retryData, error: retryError } = await supabase
              .from("characters")
              .select("*")
              .order("name");
              
            if (retryError) {
              setErrorMessage(`Erro ao buscar personagens após inicialização: ${retryError.message}`);
              throw retryError;
            }
            
            return retryData as Character[];
          } else {
            setErrorMessage(`Erro ao buscar personagens: ${error.message}`);
            throw error;
          }
        }
        
        console.log(`Successfully fetched ${data?.length || 0} characters`);
        return data as Character[];
      } catch (error: any) {
        console.error("Error in query function:", error);
        setErrorMessage(`Erro ao carregar personagens: ${error.message || "Ocorreu um erro desconhecido"}`);
        throw error;
      }
    },
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const createCharacter = useMutation({
    mutationFn: async (character: Omit<Character, 'id' | 'created_at'>) => {
      setErrorMessage(null);
      
      const characterWithCreator = {
        ...character,
        creator_id: user?.id
      };
      
      console.log("Creating character:", characterWithCreator);
      const { data, error } = await supabase
        .from("characters")
        .insert(characterWithCreator)
        .select()
        .single();
      
      if (error) {
        console.error("Error creating character:", error);
        setErrorMessage(`Erro ao criar personagem: ${error.message}`);
        throw error;
      }
      
      console.log("Character created successfully:", data);
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
      console.error("Create character error:", error);
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
      setCurrentCharacter(prev => ({ ...prev, image_url: base64String }));
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Gerenciar Personagens</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={initializeDatabase} 
            variant="outline"
            className="gap-2"
            disabled={isInitializing}
          >
            <RefreshCcw className="h-4 w-4" />
            {isInitializing ? 'Inicializando...' : 'Inicializar Banco de Dados'}
          </Button>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Personagem
          </Button>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {errorMessage}
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={initializeDatabase}
                disabled={isInitializing}
              >
                {isInitializing ? 'Inicializando...' : 'Inicializar Banco de Dados'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
                <TableHead>Prompt</TableHead>
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
                        src={character.image_url} 
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
                  <TableCell className="truncate max-w-xs">
                    {character.generation_prompt ? (
                      <div className="flex items-center">
                        <Sparkles className="h-3 w-3 text-amber-500 mr-1" />
                        <span className="text-xs">{character.generation_prompt.substring(0, 30)}...</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Nenhum</span>
                    )}
                  </TableCell>
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
          <p className="text-gray-600 mb-4">
            {queryError 
              ? "Erro ao carregar personagens. Por favor, inicialize o banco de dados." 
              : "Nenhum personagem encontrado."}
          </p>
          <div className="flex flex-col space-y-2 items-center">
            <Button 
              onClick={initializeDatabase} 
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isInitializing}
            >
              {isInitializing ? 'Inicializando...' : 'Inicializar Banco de Dados'}
            </Button>
            <Button 
              onClick={handleAddNew} 
              className="w-full sm:w-auto"
            >
              Adicionar Personagem
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Personagem" : "Novo Personagem"}</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do personagem abaixo
            </DialogDescription>
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
              <label htmlFor="generation_prompt" className="text-sm font-medium flex items-center gap-2">
                Prompt para Geração <Sparkles className="h-4 w-4 text-amber-500" />
              </label>
              <Textarea
                id="generation_prompt"
                name="generation_prompt"
                value={currentCharacter.generation_prompt || ""}
                onChange={handleInputChange}
                placeholder="Prompt para gerar imagens ou histórias com este personagem"
                rows={3}
              />
              <p className="text-xs text-gray-500">Este prompt será utilizado na geração de histórias como referência para o personagem.</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="image_upload" className="text-sm font-medium">Imagem do Personagem</label>
              
              <div className="mt-2">
                {currentCharacter.image_url ? (
                  <div className="flex items-center space-x-4 mb-4">
                    <img 
                      src={currentCharacter.image_url} 
                      alt={currentCharacter.name || "Prévia"} 
                      className="w-16 h-16 rounded-full object-cover" 
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      type="button" 
                      onClick={() => setCurrentCharacter(prev => ({ ...prev, image_url: "" }))}
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
                  value={currentCharacter.image_url || ""}
                  onChange={handleInputChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="mt-1"
                />
              </div>
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
