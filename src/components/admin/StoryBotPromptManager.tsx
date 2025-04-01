import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2, Plus, Check, AlertCircle, Upload, Image } from "lucide-react";
import { toast } from "sonner";
import { ensureStoryBotPromptsTable } from "@/lib/openai";
import FileUpload from "../FileUpload";
import { saveImagePermanently } from "@/lib/imageStorage";

interface Prompt {
  id: string;
  prompt: string;
  created_at: string;
  updated_at: string;
  name?: string;
  description?: string;
  reference_image_url?: string | null;
}

const StoryBotPromptManager = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPrompt, setNewPrompt] = useState("");
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [promptName, setPromptName] = useState("");
  const [promptDescription, setPromptDescription] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [editingReferenceImage, setEditingReferenceImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      
      await ensureStoryBotPromptsTable();
      
      const { data, error } = await supabase
        .from('storybot_prompts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching prompts:", error);
        toast.error("Erro ao carregar prompts: " + error.message);
        return;
      }
      
      console.log("Fetched prompts:", data);
      setPrompts(data || []);
    } catch (err) {
      console.error("Failed to fetch prompts:", err);
      toast.error("Falha ao carregar prompts");
    } finally {
      setLoading(false);
    }
  };

  const addPrompt = async () => {
    if (!newPrompt.trim()) {
      toast.error("O prompt não pode estar vazio");
      return;
    }
    
    try {
      let permanentImageUrl = null;
      if (referenceImage) {
        setUploadingImage(true);
        toast.info("Salvando imagem de referência...");
        try {
          permanentImageUrl = await saveImagePermanently(
            referenceImage,
            `prompt_reference_${Date.now()}`
          );
          toast.success("Imagem de referência salva com sucesso!");
        } catch (imageError) {
          console.error("Error saving reference image:", imageError);
          toast.error("Erro ao salvar imagem de referência");
        } finally {
          setUploadingImage(false);
        }
      }
      
      const { data, error } = await supabase
        .from('storybot_prompts')
        .insert([
          { 
            prompt: newPrompt.trim(),
            name: promptName.trim() || 'Prompt sem nome',
            description: promptDescription.trim() || 'Sem descrição',
            reference_image_url: permanentImageUrl
          }
        ])
        .select();
      
      if (error) {
        console.error("Error adding prompt:", error);
        toast.error("Erro ao adicionar prompt: " + error.message);
        return;
      }
      
      toast.success("Prompt adicionado com sucesso!");
      setNewPrompt("");
      setPromptName("");
      setPromptDescription("");
      setReferenceImage(null);
      fetchPrompts();
    } catch (err) {
      console.error("Failed to add prompt:", err);
      toast.error("Falha ao adicionar prompt");
    }
  };

  const updatePrompt = async () => {
    if (!editingPrompt || !editingPrompt.prompt.trim()) {
      toast.error("O prompt não pode estar vazio");
      return;
    }
    
    try {
      let permanentImageUrl = editingPrompt.reference_image_url;
      
      if (editingReferenceImage && editingReferenceImage !== editingPrompt.reference_image_url) {
        setUploadingImage(true);
        toast.info("Atualizando imagem de referência...");
        try {
          permanentImageUrl = await saveImagePermanently(
            editingReferenceImage,
            `prompt_reference_${editingPrompt.id}_${Date.now()}`
          );
          toast.success("Imagem de referência atualizada com sucesso!");
        } catch (imageError) {
          console.error("Error updating reference image:", imageError);
          toast.error("Erro ao atualizar imagem de referência");
        } finally {
          setUploadingImage(false);
        }
      }
      
      const { error } = await supabase
        .from('storybot_prompts')
        .update({ 
          prompt: editingPrompt.prompt.trim(),
          name: editingPrompt.name || 'Prompt sem nome',
          description: editingPrompt.description || 'Sem descrição',
          reference_image_url: permanentImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPrompt.id);
      
      if (error) {
        console.error("Error updating prompt:", error);
        toast.error("Erro ao atualizar prompt: " + error.message);
        return;
      }
      
      toast.success("Prompt atualizado com sucesso!");
      setEditingPrompt(null);
      setEditingReferenceImage(null);
      fetchPrompts();
    } catch (err) {
      console.error("Failed to update prompt:", err);
      toast.error("Falha ao atualizar prompt");
    }
  };

  const deletePrompt = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este prompt?")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('storybot_prompts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Error deleting prompt:", error);
        toast.error("Erro ao excluir prompt: " + error.message);
        return;
      }
      
      toast.success("Prompt excluído com sucesso!");
      fetchPrompts();
    } catch (err) {
      console.error("Failed to delete prompt:", err);
      toast.error("Falha ao excluir prompt");
    }
  };

  const handleFileUpload = (base64: string) => {
    setReferenceImage(base64);
  };

  const handleEditFileUpload = (base64: string) => {
    setEditingReferenceImage(base64);
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompts do StoryBot</CardTitle>
        <CardDescription>
          Gerencie os prompts utilizados pelo StoryBot para gerar histórias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="list">Lista de Prompts</TabsTrigger>
            <TabsTrigger value="add">Adicionar Prompt</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full mx-auto mb-4"></div>
                <p>Carregando prompts...</p>
              </div>
            ) : prompts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhum prompt encontrado.</p>
                <p className="mt-2">Adicione um novo prompt na aba "Adicionar Prompt".</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-[100px]">Imagem Ref</TableHead>
                      <TableHead className="w-[150px]">Data de Criação</TableHead>
                      <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prompts.map((prompt) => (
                      <TableRow key={prompt.id}>
                        <TableCell className="font-medium">{prompt.name || 'Prompt sem nome'}</TableCell>
                        <TableCell>{prompt.description || 'Sem descrição'}</TableCell>
                        <TableCell>
                          {prompt.reference_image_url ? (
                            <div className="relative w-12 h-12 rounded overflow-hidden">
                              <img 
                                src={prompt.reference_image_url} 
                                alt="Referência" 
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                }}
                              />
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Nenhuma</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(prompt.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setEditingPrompt(prompt);
                                    setEditingReferenceImage(prompt.reference_image_url || null);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[700px]">
                                <DialogHeader>
                                  <DialogTitle>Editar Prompt</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-prompt-name" className="text-right">
                                      Nome
                                    </Label>
                                    <Input
                                      id="edit-prompt-name"
                                      value={editingPrompt?.name || ''}
                                      onChange={(e) => setEditingPrompt(prev => prev ? {...prev, name: e.target.value} : prev)}
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-prompt-description" className="text-right">
                                      Descrição
                                    </Label>
                                    <Input
                                      id="edit-prompt-description"
                                      value={editingPrompt?.description || ''}
                                      onChange={(e) => setEditingPrompt(prev => prev ? {...prev, description: e.target.value} : prev)}
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="edit-reference-image" className="text-right">
                                      Imagem de Referência
                                    </Label>
                                    <div className="col-span-3">
                                      <FileUpload
                                        onUploadComplete={handleEditFileUpload}
                                        imagePreview={editingReferenceImage}
                                        uploadType="image"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="edit-prompt-text" className="text-right">
                                      Prompt
                                    </Label>
                                    <Textarea
                                      id="edit-prompt-text"
                                      value={editingPrompt?.prompt || ''}
                                      onChange={(e) => setEditingPrompt(prev => prev ? {...prev, prompt: e.target.value} : prev)}
                                      className="col-span-3"
                                      rows={10}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button 
                                      onClick={updatePrompt} 
                                      className="ml-2"
                                      disabled={uploadingImage}
                                    >
                                      {uploadingImage ? (
                                        <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-white rounded-full"></div>
                                      ) : (
                                        <Check className="mr-2 h-4 w-4" />
                                      )}
                                      Salvar Alterações
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => deletePrompt(prompt.id)}
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
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
          </TabsContent>
          
          <TabsContent value="add">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt-name">Nome do Prompt</Label>
                <Input
                  id="prompt-name"
                  placeholder="Digite um nome para identificar este prompt"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prompt-description">Descrição (opcional)</Label>
                <Input
                  id="prompt-description"
                  placeholder="Descreva o propósito ou tipo de histórias que este prompt gera"
                  value={promptDescription}
                  onChange={(e) => setPromptDescription(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reference-image">Imagem de Referência (opcional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <FileUpload
                    onUploadComplete={handleFileUpload}
                    imagePreview={referenceImage}
                    uploadType="image"
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Faça upload de uma imagem para servir como referência visual para geração de ilustrações
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-prompt">Texto do Prompt</Label>
                <Textarea
                  id="new-prompt"
                  placeholder="Digite o texto completo do prompt..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  className="min-h-[250px]"
                />
              </div>
              
              <Button 
                onClick={addPrompt} 
                className="w-full"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-white rounded-full"></div>
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Adicionar Novo Prompt
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StoryBotPromptManager;
