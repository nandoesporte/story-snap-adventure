import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pencil, Trash2, Search, Lock, UserPlus, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "@supabase/supabase-js";
import { toast as sonnerToast } from "sonner";

type AdminUser = {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at: string | null;
};

export const UserManager = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isPromotingAdmin, setIsPromotingAdmin] = useState(false);

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      return data.users || [];
    },
    meta: {
      onError: () => {
        toast({
          title: "Erro ao carregar usuários",
          description: "Você pode não ter permissões administrativas suficientes.",
          variant: "destructive",
        });
      }
    }
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ["user-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, is_admin');
      
      if (error) throw error;
      return data || [];
    }
  });

  const isUserAdmin = (userId: string) => {
    const profile = userProfiles.find(profile => profile.id === userId);
    return profile?.is_admin || false;
  };

  const createUserForm = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const resetPasswordForm = useForm({
    defaultValues: {
      password: "",
    },
  });

  const handleCreateUser = async (values: { email: string; password: string }) => {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: values.email,
        password: values.password,
        email_confirm: true,
      });
      
      if (error) throw error;
      
      toast({
        title: "Usuário criado com sucesso",
        variant: "default",
      });
      
      setIsCreateDialogOpen(false);
      createUserForm.reset();
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (values: { password: string }) => {
    if (!selectedUserId) return;
    
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        selectedUserId,
        { password: values.password }
      );
      
      if (error) throw error;
      
      toast({
        title: "Senha alterada com sucesso",
        variant: "default",
      });
      
      setIsResetPasswordDialogOpen(false);
      resetPasswordForm.reset();
    } catch (error: any) {
      toast({
        title: "Erro ao resetar senha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(userId);
        
        if (error) throw error;
        
        toast({
          title: "Usuário excluído com sucesso",
          variant: "default",
        });
        
        refetch();
      } catch (error: any) {
        toast({
          title: "Erro ao excluir usuário",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handlePromoteToAdmin = async (userId: string, email: string) => {
    if (window.confirm(`Promover "${email}" para administrador?`)) {
      setIsPromotingAdmin(true);
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({ is_admin: true })
          .eq('id', userId);
        
        if (error) throw error;
        
        toast({
          title: "Usuário promovido a administrador",
          description: `${email} agora tem acesso de administrador.`,
          variant: "default",
        });
        
        refetch();
      } catch (error: any) {
        toast({
          title: "Erro ao promover usuário",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsPromotingAdmin(false);
      }
    }
  };

  const makeSpecificUserAdmin = async () => {
    const targetEmail = "nandoesporte1@gmail.com";
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) throw userError;
      
      const targetUser = userData.users.find(user => user.email === targetEmail);
      
      if (!targetUser) {
        toast({
          title: "Usuário não encontrado",
          description: `Não encontramos o usuário com email ${targetEmail}`,
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: true })
        .eq('id', targetUser.id);
      
      if (error) throw error;
      
      toast({
        title: `${targetEmail} agora é um administrador`,
        variant: "success",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao configurar administrador",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    makeSpecificUserAdmin();
  }, []);

  const openResetPasswordDialog = (userId: string) => {
    setSelectedUserId(userId);
    setIsResetPasswordDialogOpen(true);
  };

  const filteredUsers = users.filter(
    (user: User) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando usuários...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          Erro ao carregar usuários. Você pode não ter permissões administrativas.
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8">Nenhum usuário encontrado.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="w-[150px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email || "N/A"}</TableCell>
                  <TableCell>
                    {user.created_at 
                      ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR }) 
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in_at
                      ? format(new Date(user.last_sign_in_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })
                      : "Nunca"}
                  </TableCell>
                  <TableCell>
                    {isUserAdmin(user.id) ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Admin
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePromoteToAdmin(user.id, user.email || '')}
                        disabled={isPromotingAdmin}
                      >
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        <span className="text-xs">Promover</span>
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openResetPasswordDialog(user.id)}
                      >
                        <Lock className="h-4 w-4" />
                        <span className="sr-only">Resetar senha</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
          </DialogHeader>
          <Form {...createUserForm}>
            <form onSubmit={createUserForm.handleSubmit(handleCreateUser)} className="space-y-4">
              <FormField
                control={createUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Usuário</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
          </DialogHeader>
          <Form {...resetPasswordForm}>
            <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
              <FormField
                control={resetPasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Nova Senha</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
