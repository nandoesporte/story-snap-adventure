
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pencil, Trash2, Search, Plus, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

export const ThemeManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"themes" | "settings">("themes");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<Theme | Setting | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch themes
  const { data: themes = [], isLoading: themesLoading } = useQuery({
    queryKey: ["admin-themes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("themes").select("*");
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "themes",
  });

  // Fetch settings
  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "settings",
  });

  // Theme form
  const themeForm = useForm<Theme>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Setting form
  const settingForm = useForm<Setting>({
    defaultValues: {
      key: "",
      value: "",
      description: "",
    },
  });

  // Create theme mutation
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
        variant: "success",
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

  // Update theme mutation
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
        variant: "success",
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

  // Delete theme mutation
  const deleteThemeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("themes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-themes"] });
      toast({
        title: "Tema excluído com sucesso",
        variant: "success",
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

  // Create setting mutation
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
        variant: "success",
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

  // Update setting mutation
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
        variant: "success",
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

  // Delete setting mutation
  const deleteSettingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("settings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({
        title: "Configuração excluída com sucesso",
        variant: "success",
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

  // Filter data by search term
  const filteredData = activeTab === "themes"
    ? themes.filter((theme: Theme) => 
        theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        theme.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : settings.filter((setting: Setting) =>
        setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

  // Handle create
  const handleCreate = () => {
    setIsCreateDialogOpen(true);
    if (activeTab === "themes") {
      themeForm.reset({ name: "", description: "" });
    } else {
      settingForm.reset({ key: "", value: "", description: "" });
    }
  };

  // Handle edit
  const handleEdit = (item: Theme | Setting) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
    
    if (activeTab === "themes" && "name" in item) {
      themeForm.reset({
        id: item.id,
        name: item.name,
        description: item.description,
      });
    } else if (activeTab === "settings" && "key" in item) {
      settingForm.reset({
        id: item.id,
        key: item.key,
        value: item.value,
        description: item.description,
      });
    }
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este item?")) {
      if (activeTab === "themes") {
        deleteThemeMutation.mutate(id);
      } else {
        deleteSettingMutation.mutate(id);
      }
    }
  };

  // Handle create submit
  const handleCreateSubmit = (data: any) => {
    if (activeTab === "themes") {
      createThemeMutation.mutate(data);
    } else {
      createSettingMutation.mutate(data);
    }
  };

  // Handle edit submit
  const handleEditSubmit = (data: any) => {
    if (activeTab === "themes" && "name" in data) {
      updateThemeMutation.mutate(data as Theme);
    } else if (activeTab === "settings" && "key" in data) {
      updateSettingMutation.mutate(data as Setting);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
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
      </div>

      <Alert className="mb-4">
        <AlertDescription>
          {activeTab === "themes" 
            ? "Gerencie os temas disponíveis para criação de histórias."
            : "Gerencie as configurações globais do sistema."}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${activeTab === "themes" ? "temas" : "configurações"}...`}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {activeTab === "themes" ? "Novo Tema" : "Nova Configuração"}
        </Button>
      </div>

      {/* Data Table */}
      {(activeTab === "themes" && themesLoading) || (activeTab === "settings" && settingsLoading) ? (
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
                ) : (
                  <>
                    <TableHead>Chave</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Descrição</TableHead>
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
                  ) : (
                    <>
                      <TableCell className="font-medium">{item.key}</TableCell>
                      <TableCell>{item.value}</TableCell>
                      <TableCell>{item.description}</TableCell>
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeTab === "themes" ? "Criar Novo Tema" : "Criar Nova Configuração"}
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
          ) : (
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
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeTab === "themes" ? "Editar Tema" : "Editar Configuração"}
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
          ) : activeTab === "settings" && editingItem && "key" in editingItem ? (
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
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};
