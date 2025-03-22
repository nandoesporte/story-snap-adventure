
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pencil, Trash2, Search, Lock, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type User = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
};

export const UserManager = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch users
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      return data.users || [];
    },
    onError: (error) => {
      toast({
        title: "Erro ao carregar usuários",
        description: "Você pode não ter permissões administrativas suficientes.",
        variant: "destructive",
      });
    },
  });

  // Create user form
  const createUserForm = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Reset password form
  const resetPasswordForm = useForm({
    defaultValues: {
      password: "",
    },
  });

  // Create user
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
        variant: "success",
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

  // Reset user password
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
        variant: "success",
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

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(userId);
        
        if (error) throw error;
        
        toast({
          title: "Usuário excluído com sucesso",
          variant: "success",
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

  // Open reset password dialog
  const openResetPasswordDialog = (userId: string) => {
    setSelectedUserId(userId);
    setIsResetPasswordDialogOpen(true);
  };

  // Filter users by search term
  const filteredUsers = users.filter(
    (user: User) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <TableHead className="w-[150px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in_at
                      ? format(new Date(user.last_sign_in_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })
                      : "Nunca"}
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

      {/* Create User Dialog */}
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

      {/* Reset Password Dialog */}
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
