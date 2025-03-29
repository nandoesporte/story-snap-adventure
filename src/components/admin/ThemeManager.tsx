import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, PlusCircle, Pencil, Trash2, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"
import { PageContent } from '@/types';

interface ContentItem {
  id: string;
  page: string;
  section: string;
  key: string;
  content: string;
  content_type: string;
  created_at: string;
  updated_at: string;
}

export const ThemeManager = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [newContent, setNewContent] = useState<Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>>({
    page: 'home',
    section: 'themes',
    key: '',
    content: '',
    content_type: 'text'
  });
  const [isCopied, setIsCopied] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('page_contents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setContents(data || []);
    } catch (error: any) {
      console.error("Error fetching contents:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar conteúdos!",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchContents();
  }, [fetchContents]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewContent(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewContent(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const createContent = async () => {
    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('page_contents')
        .insert({
          ...newContent,
          id: uuidv4()
        });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Conteúdo criado com sucesso!",
        description: "O novo conteúdo foi adicionado à página."
      });
      
      setNewContent({
        page: 'home',
        section: 'themes',
        key: '',
        content: '',
        content_type: 'text'
      });
      
      await fetchContents();
    } catch (error: any) {
      console.error("Error creating content:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar conteúdo!",
        description: error.message
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const startEdit = (content: ContentItem) => {
    setSelectedContent(content);
    setNewContent({
      page: content.page,
      section: content.section,
      key: content.key,
      content: content.content,
      content_type: content.content_type
    });
    setIsEditing(true);
  };
  
  const updateContent = async () => {
    if (!selectedContent) return;
    
    setIsEditing(true);
    try {
      const { error } = await supabase
        .from('page_contents')
        .update(newContent)
        .eq('id', selectedContent.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Conteúdo atualizado com sucesso!",
        description: "As alterações foram salvas."
      });
      
      await fetchContents();
    } catch (error: any) {
      console.error("Error updating content:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar conteúdo!",
        description: error.message
      });
    } finally {
      setIsEditing(false);
      setSelectedContent(null);
    }
  };
  
  const confirmDelete = (id: string) => {
    setContentToDelete(id);
    setIsAlertOpen(true);
  };
  
  const deleteContent = async () => {
    if (!contentToDelete) return;
    
    setIsLoading(true);
    setIsAlertOpen(false);
    
    try {
      const { error } = await supabase
        .from('page_contents')
        .delete()
        .eq('id', contentToDelete);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Conteúdo removido com sucesso!",
        description: "O conteúdo foi excluído permanentemente."
      });
      
      await fetchContents();
    } catch (error: any) {
      console.error("Error deleting content:", error);
      toast({
        variant: "destructive",
        title: "Erro ao remover conteúdo!",
        description: error.message
      });
    } finally {
      setIsLoading(false);
      setContentToDelete(null);
    }
  };
  
  const handleCopyClick = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    
    toast({
      title: "Copiado para a área de transferência!",
      description: "O texto foi copiado com sucesso."
    });
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  
  const filteredContents = contents.filter((content: any) => {
    if (!content || typeof content.content_type !== 'string') return false;
    return content.page === 'home' && content.section === 'themes';
  });
  
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Conteúdo da Página de Temas</CardTitle>
          <CardDescription>
            Adicione, edite ou remova conteúdo da página de temas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="create">
              <AccordionTrigger>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Novo Conteúdo
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="key">Chave (key)</Label>
                      <Input
                        id="key"
                        name="key"
                        value={newContent.key}
                        onChange={handleInputChange}
                        placeholder="Identificador único"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content_type">Tipo de Conteúdo</Label>
                      <Select name="content_type" onValueChange={(value) => setNewContent(prevState => ({ ...prevState, content_type: value }))} defaultValue={newContent.content_type}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="image">Imagem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Conteúdo</Label>
                    <Textarea
                      id="content"
                      name="content"
                      value={newContent.content}
                      onChange={handleInputChange}
                      placeholder="Conteúdo a ser exibido"
                      className="min-h-[80px]"
                    />
                  </div>
                  <Button onClick={createContent} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Conteúdo"
                    )}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum conteúdo encontrado.</p>
            </div>
          ) : (
            <div className="mt-4">
              {filteredContents.map((content) => (
                <Card key={content.id} className="mb-4">
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle>{content.key}</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(content)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(content.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {content.content_type === 'image' ? (
                      <img src={content.content} alt={content.key} className="max-w-full h-auto" />
                    ) : (
                      <p>{content.content}</p>
                    )}
                    <div className="flex items-center mt-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopyClick(content.content)}
                        disabled={isCopied}
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar Conteúdo
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {isEditing && selectedContent && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
              <div className="relative max-w-md bg-white rounded-lg shadow-xl">
                <Card>
                  <CardHeader>
                    <CardTitle>Editar Conteúdo</CardTitle>
                    <CardDescription>
                      Edite o conteúdo da página.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_key">Chave (key)</Label>
                      <Input
                        id="edit_key"
                        name="key"
                        value={newContent.key}
                        onChange={handleInputChange}
                        placeholder="Identificador único"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_content_type">Tipo de Conteúdo</Label>
                      <Select name="content_type" onValueChange={(value) => setNewContent(prevState => ({ ...prevState, content_type: value }))} defaultValue={newContent.content_type}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="image">Imagem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_content">Conteúdo</Label>
                      <Textarea
                        id="edit_content"
                        name="content"
                        value={newContent.content}
                        onChange={handleInputChange}
                        placeholder="Conteúdo a ser exibido"
                        className="min-h-[80px]"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => {
                      setIsEditing(false);
                      setSelectedContent(null);
                    }}>
                      Cancelar
                    </Button>
                    <Button onClick={updateContent} disabled={isEditing}>
                      {isEditing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Salvar Alterações"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
          
          {/* Delete Confirmation Alert */}
          {isAlertOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
              <div className="relative max-w-md bg-white rounded-lg shadow-xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span>Confirmar Exclusão</span>
                    </CardTitle>
                    <CardDescription>
                      Tem certeza de que deseja excluir este conteúdo? Esta ação não pode ser desfeita.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Você está prestes a excluir permanentemente este conteúdo.
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsAlertOpen(false)}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={deleteContent} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        "Excluir"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
