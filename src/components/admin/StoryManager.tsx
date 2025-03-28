import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllStories, deleteStory, Story, updateStory } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import LoadingSpinner from "@/components/LoadingSpinner";

export const StoryManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: stories = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-stories"],
    queryFn: async () => {
      try {
        console.log("Fetching all stories for admin...");
        const result = await getAllStories();
        console.log("Admin stories fetched successfully:", result);
        return result;
      } catch (err: any) {
        console.error("Error fetching admin stories:", err);
        throw err;
      }
    },
    retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stories"] });
      toast({
        title: "História removida com sucesso",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error("Error in delete mutation:", error);
      toast({
        title: "Erro ao excluir história",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<Story> }) => 
      updateStory(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stories"] });
      setIsEditDialogOpen(false);
      toast({
        title: "História atualizada com sucesso",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error("Error in update mutation:", error);
      toast({
        title: "Erro ao atualizar história",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta história?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredStories = stories.filter(
    (story) =>
      story.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.character_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const form = useForm<Story>({
    defaultValues: {
      title: "",
      character_name: "",
      character_age: "",
      theme: "",
      setting: "",
      style: "",
      character_prompt: "",
    },
  });

  const handleEdit = (story: Story) => {
    setEditingStory(story);
    form.reset({
      ...story,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (data: Story) => {
    if (editingStory?.id) {
      updateMutation.mutate({
        id: editingStory.id,
        updates: data
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-md bg-red-50 text-red-800">
        <h3 className="text-lg font-medium">Erro ao carregar histórias</h3>
        <p className="mt-1">{error instanceof Error ? error.message : "Erro desconhecido"}</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar histórias..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredStories.length === 0 ? (
        <div className="text-center py-8">Nenhuma história encontrada.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Personagem</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStories.map((story) => (
                <TableRow key={story.id}>
                  <TableCell className="font-medium">{story.title}</TableCell>
                  <TableCell>{story.character_name}</TableCell>
                  <TableCell>{story.theme}</TableCell>
                  <TableCell>
                    {story.created_at
                      ? format(new Date(story.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : "Data desconhecida"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(story)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(story.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar História</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="character_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Personagem</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="character_age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tema</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="setting"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cenário</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estilo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="character_prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Personagem</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder="Descreva detalhes físicos e personalidade do personagem para manter consistência nas imagens"
                        rows={3}
                        value={field.value as string || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} type="button">
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
