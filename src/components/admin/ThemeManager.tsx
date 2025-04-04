
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pencil, Trash2, Search, Plus, Settings, FileText, Image, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FileUpload from "@/components/FileUpload";

type Theme = {
  id: string;
  name: string;
  description: string;
};

type Setting = {
  id: string;
  key: string;
  value: string;
  description: string;
};

type PageContent = {
  id: string;
  section: string;
  key: string;
  content: string;
  content_type: "text" | "image" | "json";
  page: string;
};

interface ThemeManagerProps {
  initialPageContents?: PageContent[];
}

export const ThemeManager = ({ initialPageContents }: ThemeManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"themes" | "settings" | "page-content">("page-content");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<Theme | Setting | PageContent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<string>("index");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [currentSectionView, setCurrentSectionView] = useState<"list" | "section-preview">("section-preview");

  // Pre-populate the page contents with the initial data if provided
  useEffect(() => {
    if (initialPageContents && initialPageContents.length > 0) {
      queryClient.setQueryData(["admin-page-contents", "index", "all"], initialPageContents);
    }
  }, [initialPageContents, queryClient]);

  const { data: themes = [], isLoading: themesLoading } = useQuery({
    queryKey: ["admin-themes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("themes").select("*");
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "themes",
  });

  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "settings",
  });

  const { data: pageContents = [], isLoading: pageContentsLoading } = useQuery({
    queryKey: ["admin-page-contents", selectedPage, selectedSection],
    queryFn: async () => {
      let query = supabase.from("page_contents").select("*").eq("page", selectedPage);
      
      if (selectedSection !== "all") {
        query = query.eq("section", selectedSection);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "page-content",
  });

  // Get all available sections for the selected page
  const { data: pageSections = [] } = useQuery({
    queryKey: ["page-sections", selectedPage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("section")
        .eq("page", selectedPage)
        .order("section");
      
      if (error) throw error;
      
      // Extract unique sections
      const uniqueSections = Array.from(
        new Set(data.map((item: any) => item.section))
      );
      
      return uniqueSections;
    },
    enabled: activeTab === "page-content",
  });

  const themeForm = useForm<Theme>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const settingForm = useForm<Setting>({
    defaultValues: {
      key: "",
      value: "",
      description: "",
    },
  });

  const pageContentForm = useForm<PageContent>({
    defaultValues: {
      section: "",
      key: "",
      content: "",
      content_type: "text",
      page: "index",
    },
  });

  const createThemeMutation = useMutation({
    mutationFn: async (theme: Omit<Theme, "id">) => {
      const { data, error } = await supabase.from("themes").insert([theme]).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-themes"] });
      toast({
        title: "Tema criado com sucesso",
        variant: "default",
      });
      setIsCreateDialogOpen(false);
      themeForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar tema",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateThemeMutation = useMutation({
    mutationFn: async (theme: Theme) => {
      const { data, error } = await supabase
        .from("themes")
        .update({ name: theme.name, description: theme.description })
        .eq("id", theme.id)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-themes"] });
      toast({
        title: "Tema atualizado com sucesso",
        variant: "default",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar tema",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteThemeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("themes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-themes"] });
      toast({
        title: "Tema excluído com sucesso",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir tema",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createSettingMutation = useMutation({
    mutationFn: async (setting: Omit<Setting, "id">) => {
      const { data, error } = await supabase.from("settings").insert([setting]).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({
        title: "Configuração criada com sucesso",
        variant: "default",
      });
      setIsCreateDialogOpen(false);
      settingForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (setting: Setting) => {
      const { data, error } = await supabase
        .from("settings")
        .update({ key: setting.key, value: setting.value, description: setting.description })
        .eq("id", setting.id)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({
        title: "Configuração atualizada com sucesso",
        variant: "default",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSettingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("settings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({
        title: "Configuração excluída com sucesso",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPageContentMutation = useMutation({
    mutationFn: async (pageContent: Omit<PageContent, "id">) => {
      const { data, error } = await supabase.from("page_contents").insert([pageContent]).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-contents"] });
      queryClient.invalidateQueries({ queryKey: ["page-sections"] });
      queryClient.invalidateQueries({ queryKey: ["page-contents"] });
      toast({
        title: "Conteúdo de página criado com sucesso",
        variant: "default",
      });
      setIsCreateDialogOpen(false);
      pageContentForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar conteúdo de página",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePageContentMutation = useMutation({
    mutationFn: async (pageContent: PageContent) => {
      const { data, error } = await supabase
        .from("page_contents")
        .update({ 
          section: pageContent.section, 
          key: pageContent.key, 
          content: pageContent.content,
          content_type: pageContent.content_type
        })
        .eq("id", pageContent.id)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-contents"] });
      queryClient.invalidateQueries({ queryKey: ["page-contents"] });
      toast({
        title: "Conteúdo de página atualizado com sucesso",
        variant: "default",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar conteúdo de página",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePageContentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("page_contents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-contents"] });
      queryClient.invalidateQueries({ queryKey: ["page-sections"] });
      queryClient.invalidateQueries({ queryKey: ["page-contents"] });
      toast({
        title: "Conteúdo de página excluído com sucesso",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir conteúdo de página",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredData = (() => {
    if (activeTab === "themes") {
      return (themes || []).filter((theme: Theme) => 
        theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        theme.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (activeTab === "settings") {
      return (settings || []).filter((setting: Setting) =>
        setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (activeTab === "page-content") {
      return (pageContents || []).filter((content: PageContent) =>
        content.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.section.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return [];
  })();

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
    if (activeTab === "themes") {
      themeForm.reset({ name: "", description: "" });
    } else if (activeTab === "settings") {
      settingForm.reset({ key: "", value: "", description: "" });
    } else if (activeTab === "page-content") {
      pageContentForm.reset({ 
        section: selectedSection !== "all" ? selectedSection : "", 
        key: "", 
        content: "", 
        content_type: "text",
        page: selectedPage 
      });
    }
  };

  const handleEdit = (item: Theme | Setting | PageContent) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
    
    if (activeTab === "themes" && "name" in item) {
      themeForm.reset({
        id: item.id,
        name: item.name,
        description: item.description,
      });
    } else if (activeTab === "settings" && "key" in item && "value" in item) {
      settingForm.reset({
        id: item.id,
        key: item.key,
        value: item.value,
        description: item.description,
      });
    } else if (activeTab === "page-content" && "section" in item && "content" in item) {
      pageContentForm.reset({
        id: item.id,
        section: item.section,
        key: item.key,
        content: item.content,
        content_type: item.content_type,
        page: item.page,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este item?")) {
      if (activeTab === "themes") {
        deleteThemeMutation.mutate(id);
      } else if (activeTab === "settings") {
        deleteSettingMutation.mutate(id);
      } else if (activeTab === "page-content") {
        deletePageContentMutation.mutate(id);
      }
    }
  };

  const handleCreateSubmit = (data: any) => {
    if (activeTab === "themes") {
      createThemeMutation.mutate(data);
    } else if (activeTab === "settings") {
      createSettingMutation.mutate(data);
    } else if (activeTab === "page-content") {
      createPageContentMutation.mutate({
        ...data,
        page: selectedPage
      });
    }
  };

  const handleEditSubmit = (data: any) => {
    if (activeTab === "themes" && "name" in data) {
      updateThemeMutation.mutate(data as Theme);
    } else if (activeTab === "settings" && "key" in data && "value" in data) {
      updateSettingMutation.mutate(data as Setting);
    } else if (activeTab === "page-content" && "section" in data && "content" in data) {
      updatePageContentMutation.mutate(data as PageContent);
    }
  };

  // Group page contents by section
  const contentsBySection = React.useMemo(() => {
    const grouped: Record<string, PageContent[]> = {};
    pageContents.forEach((content: PageContent) => {
      if (!grouped[content.section]) {
        grouped[content.section] = [];
      }
      grouped[content.section].push(content);
    });
    return grouped;
  }, [pageContents]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 mb-6">
        <Button
          variant={activeTab === "themes" ? "default" : "outline"}
          onClick={() => setActiveTab("themes")}
        >
          Temas
        </Button>
        <Button
          variant={activeTab === "settings" ? "default" : "outline"}
          onClick={() => setActiveTab("settings")}
        >
          Configurações
        </Button>
        <Button
          variant={activeTab === "page-content" ? "default" : "outline"}
          onClick={() => setActiveTab("page-content")}
        >
          Conteúdo de Páginas
        </Button>
      </div>

      <Alert className="mb-4">
        <AlertDescription>
          {activeTab === "themes" 
            ? "Gerencie os temas disponíveis para criação de histórias."
            : activeTab === "settings" 
            ? "Gerencie as configurações globais do sistema."
            : "Gerencie o conteúdo das páginas do site, incluindo textos e imagens."}
        </AlertDescription>
      </Alert>

      {activeTab === "page-content" && (
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Página:</label>
            <select 
              value={selectedPage}
              onChange={(e) => {
                setSelectedPage(e.target.value);
                setSelectedSection("all");
              }}
              className="border rounded p-2 w-40"
            >
              <option value="index">Página Inicial</option>
              <option value="about">Sobre Nós</option>
              <option value="contact">Contato</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Seção:</label>
            <select 
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="border rounded p-2 w-40"
            >
              <option value="all">Todas as Seções</option>
              {pageSections.map((section) => (
                <option key={section} value={section}>
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Visualização:</label>
            <div className="flex border rounded overflow-hidden">
              <button 
                className={`py-2 px-4 ${currentSectionView === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                onClick={() => setCurrentSectionView('list')}
              >
                Lista
              </button>
              <button 
                className={`py-2 px-4 ${currentSectionView === 'section-preview' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                onClick={() => setCurrentSectionView('section-preview')}
              >
                Por Seção
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${
              activeTab === "themes" 
                ? "temas" 
                : activeTab === "settings" 
                ? "configurações" 
                : "conteúdos"
            }...`}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {activeTab === "themes" 
            ? "Novo Tema" 
            : activeTab === "settings" 
            ? "Nova Configuração" 
            : "Novo Conteúdo"}
        </Button>
      </div>

      {/* Page Content Section View */}
      {activeTab === "page-content" && currentSectionView === "section-preview" && (
        <div className="space-y-8">
          {Object.entries(contentsBySection).map(([section, contents]) => (
            <Card key={section} className="overflow-hidden">
              <CardHeader className="bg-slate-50">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="capitalize">{section}</CardTitle>
                    <CardDescription>
                      {contents.length} itens nesta seção
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedSection(section);
                      handleCreate();
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contents.map((content) => (
                    <div 
                      key={content.id} 
                      className="border rounded-md p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleEdit(content)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{content.key}</h4>
                        <span className="text-xs px-2 py-1 bg-slate-100 rounded-full">
                          {content.content_type}
                        </span>
                      </div>
                      
                      {content.content_type === "image" ? (
                        <div className="aspect-video relative overflow-hidden rounded-md bg-slate-100">
                          <img 
                            src={content.content} 
                            alt={content.key}
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ) : content.content_type === "json" ? (
                        <div className="max-h-24 overflow-y-auto bg-slate-50 p-2 rounded text-xs font-mono">
                          {content.content}
                        </div>
                      ) : (
                        <div className="max-h-24 overflow-y-auto text-sm">
                          {content.content.length > 100 
                            ? content.content.substring(0, 100) + "..." 
                            : content.content}
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(content);
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(content.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {Object.keys(contentsBySection).length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <Layers className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">Nenhuma seção encontrada</h3>
              <p className="text-slate-500 mb-6">Comece adicionando conteúdo para a página {selectedPage}</p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeiro conteúdo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {(activeTab !== "page-content" || currentSectionView === "list") && 
       ((activeTab === "themes" && themesLoading) || 
       (activeTab === "settings" && settingsLoading) || 
       (activeTab === "page-content" && pageContentsLoading)) ? (
        <div className="text-center py-8">Carregando...</div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-8">Nenhum item encontrado.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {activeTab === "themes" ? (
                  <>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                  </>
                ) : activeTab === "settings" ? (
                  <>
                    <TableHead>Chave</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Seção</TableHead>
                    <TableHead>Chave</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Conteúdo</TableHead>
                  </>
                )}
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item: any) => (
                <TableRow key={item.id}>
                  {activeTab === "themes" ? (
                    <>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.description}</TableCell>
                    </>
                  ) : activeTab === "settings" ? (
                    <>
                      <TableCell className="font-medium">{item.key}</TableCell>
                      <TableCell>{item.value}</TableCell>
                      <TableCell>{item.description}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{item.section}</TableCell>
                      <TableCell>{item.key}</TableCell>
                      <TableCell>{item.content_type}</TableCell>
                      <TableCell>
                        {item.content_type === 'image' ? (
                          <img src={item.content} alt={item.key} className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="max-w-xs truncate">{item.content}</div>
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "themes" 
                ? "Criar Novo Tema" 
                : activeTab === "settings" 
                ? "Criar Nova Configuração" 
                : "Criar Novo Conteúdo de Página"}
            </DialogTitle>
          </DialogHeader>
          {activeTab === "themes" ? (
            <Form {...themeForm}>
              <form onSubmit={themeForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={themeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={themeForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Criar Tema</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : activeTab === "settings" ? (
            <Form {...settingForm}>
              <form onSubmit={settingForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={settingForm.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={settingForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={settingForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Criar Configuração</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <Form {...pageContentForm}>
              <form onSubmit={pageContentForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={pageContentForm.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seção</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full border rounded px-3 py-2"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          {field.value ? <option value={field.value}>{field.value}</option> : <option value="">Selecione uma seção</option>}
                          <option value="hero">Hero</option>
                          <option value="features">Features</option>
                          <option value="how_it_works">Como Funciona</option>
                          <option value="testimonials">Depoimentos</option>
                          <option value="cta">CTA</option>
                          <option value="other">Nova Seção</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {pageContentForm.watch("section") === "other" && (
                  <FormField
                    control={pageContentForm.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Nova Seção</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: pricing, faq, team" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={pageContentForm.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: title, description, image_url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={pageContentForm.control}
                  name="content_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Conteúdo</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full border rounded px-3 py-2"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="text">Texto</option>
                          <option value="image">Imagem</option>
                          <option value="json">JSON</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={pageContentForm.control}
                  name="content"
                  render={({ field }) => {
                    const contentType = pageContentForm.watch("content_type");
                    
                    return (
                      <FormItem>
                        <FormLabel>Conteúdo</FormLabel>
                        <FormControl>
                          {contentType === "image" ? (
                            <div className="space-y-2">
                              <Input 
                                type="text" 
                                {...field} 
                                placeholder="URL da imagem" 
                              />
                              <p className="text-xs text-gray-500">
                                Cole a URL da imagem ou use o uploader para fazer upload
                              </p>
                              <FileUpload
                                onUploadComplete={(url) => field.onChange(url)}
                                uploadType="image"
                              />
                            </div>
                          ) : contentType === "json" ? (
                            <Textarea 
                              {...field} 
                              rows={8}
                              placeholder='{"key": "value"}'
                            />
                          ) : (
                            <Textarea 
                              {...field} 
                              rows={4}
                              placeholder="Digite o conteúdo aqui"
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <DialogFooter>
                  <Button type="submit">Criar Conteúdo</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "themes" 
                ? "Editar Tema" 
                : activeTab === "settings" 
                ? "Editar Configuração" 
                : "Editar Conteúdo de Página"}
            </DialogTitle>
          </DialogHeader>
          {activeTab === "themes" && editingItem && "name" in editingItem ? (
            <Form {...themeForm}>
              <form onSubmit={themeForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={themeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={themeForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Salvar Alterações</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : activeTab === "settings" && editingItem && "key" in editingItem && "value" in editingItem ? (
            <Form {...settingForm}>
              <form onSubmit={settingForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={settingForm.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={settingForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={settingForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Salvar Alterações</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : activeTab === "page-content" && editingItem && "section" in editingItem && "content" in editingItem ? (
            <Form {...pageContentForm}>
              <form onSubmit={pageContentForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={pageContentForm.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seção</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: hero, features, testimonials" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={pageContentForm.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: title, description, image_url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={pageContentForm.control}
                  name="content_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Conteúdo</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full border rounded px-3 py-2"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="text">Texto</option>
                          <option value="image">Imagem</option>
                          <option value="json">JSON</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={pageContentForm.control}
                  name="content"
                  render={({ field }) => {
                    const contentType = pageContentForm.watch("content_type");
                    
                    return (
                      <FormItem>
                        <FormLabel>Conteúdo</FormLabel>
                        <FormControl>
                          {contentType === "image" ? (
                            <div className="space-y-2">
                              <Input 
                                type="text" 
                                {...field} 
                                placeholder="URL da imagem" 
                              />
                              <p className="text-xs text-gray-500">
                                Cole a URL da imagem ou use o uploader para fazer upload
                              </p>
                              <FileUpload
                                onUploadComplete={(url) => field.onChange(url)}
                                uploadType="image"
                                imagePreview={field.value}
                              />
                            </div>
                          ) : contentType === "json" ? (
                            <Textarea 
                              {...field} 
                              rows={8}
                              placeholder='{"key": "value"}'
                            />
                          ) : (
                            <Textarea 
                              {...field} 
                              rows={4}
                              placeholder="Digite o conteúdo aqui"
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <DialogFooter>
                  <Button type="submit">Salvar Alterações</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};
