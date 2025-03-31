
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
  is_admin?: boolean;
};

export const UserManager = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isPromotingAdmin, setIsPromotingAdmin] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      try {
        // Fetch users from auth schema through an admin function
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, display_name, created_at, is_admin')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching users:", error);
          throw error;
        }

        // Fetch more user details from auth if available
        if (data) {
          // Transform the data to match the AdminUser type
          return data.map((profile: any) => ({
            id: profile.id,
            email: profile.display_name,
            created_at: profile.created_at,
            last_sign_in_at: null,
            is_admin: profile.is_admin
          }));
        }
        
        return [];
      } catch (err) {
        console.error("Error fetching users:", err);
        return [];
      }
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

  // Function to create a new user
  const handleCreateUser = async (values: { email: string; password: string }) => {
    try {
      setIsCreatingUser(true);
      
      // Instead of using the direct admin API, make a server-side call
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: values.email,
          password: values.password
        }
      });
      
      if (error) {
        console.error("Error creating user:", error);
        sonnerToast.error(`Erro ao criar usuário: ${error.message}`);
        return;
      }
      
      sonnerToast.success("Usuário criado com sucesso");
      setIsCreateDialogOpen(false);
      createUserForm.reset();
      refetch();
    } catch (error: any) {
      console.error("Error creating user:", error);
      sonnerToast.error(`Erro ao criar usuário: ${error.message}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Function to reset user password
  const handleResetPassword = async (values: { password: string }) => {
    if (!selectedUserId) return;
    
    try {
      setIsResettingPassword(true);
      
      // Use a server-side function for resetting password
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: selectedUserId,
          password: values.password
        }
      });
      
      if (error) {
        console.error("Error resetting password:", error);
        sonnerToast.error(`Erro ao resetar senha: ${error.message}`);
        return;
      }
      
      sonnerToast.success("Senha alterada com sucesso");
      setIsResetPasswordDialogOpen(false);
      resetPasswordForm.reset();
    } catch (error: any) {
      console.error("Error resetting password:", error);
      sonnerToast.error(`Erro ao resetar senha: ${error.message}`);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Function to delete a user
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        setIsDeletingUser(true);
        
        // Use a server-side function for deleting users
        const { data, error } = await supabase.functions.invoke('delete-admin-user', {
          body: { userId }
        });
        
        if (error) {
          console.error("Error deleting user:", error);
          sonnerToast.error(`Erro ao excluir usuário: ${error.message}`);
          return;
        }
        
        sonnerToast.success("Usuário excluído com sucesso");
        refetch();
      } catch (error: any) {
        console.error("Error deleting user:", error);
        sonnerToast.error(`Erro ao excluir usuário: ${error.message}`);
      } finally {
        setIsDeletingUser(false);
      }
    }
  };

  // Function to promote a user to admin
  const handlePromoteToAdmin = async (userId: string, email: string) => {
    if (window.confirm(`Promover "${email}" para administrador?`)) {
      setIsPromotingAdmin(true);
      try {
        // Update user profile in the database
        const { error } = await supabase
          .from('user_profiles')
          .update({ is_admin: true })
          .eq('id', userId);
        
        if (error) {
          console.error("Error promoting user:", error);
          sonnerToast.error(`Erro ao promover usuário: ${error.message}`);
          return;
        }
        
        sonnerToast.success(`${email} foi promovido a administrador`);
        refetch();
      } catch (error: any) {
        sonnerToast.error(`Erro ao promover usuário: ${error.message}`);
      } finally {
        setIsPromotingAdmin(false);
      }
    }
  };

  // Check for nandoesporte1@gmail.com admin access
  useEffect(() => {
    const makeSpecificUserAdmin = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData?.user?.email === 'nandoesporte1@gmail.com') {
          // Get or create user profile
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', userData.user.id)
            .single();
          
          // If profile exists but not admin, update it
          if (profileData && !profileData.is_admin) {
            await supabase
              .from('user_profiles')
              .update({ is_admin: true })
              .eq('id', userData.user.id);
              
            sonnerToast.success("Permissões de administrador atualizadas");
          }
        }
      } catch (error) {
        console.error("Error checking admin:", error);
      }
    };
    
    makeSpecificUserAdmin();
  }, []);

  // Function to open reset password dialog
  const openResetPasswordDialog = (userId: string) => {
    setSelectedUserId(userId);
    setIsResetPasswordDialogOpen(true);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user: any) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
  );

  // If no admin users found and we're not loading, show a message to the first superuser
  const showAdminSetupHelp = !isLoading && users.length === 0;

  return (
    <div className="space-y-4">
      {showAdminSetupHelp && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-4">
          <h3 className="text-amber-800 font-medium mb-2">Configuração Inicial de Administrador</h3>
          <p className="text-amber-700 text-sm mb-2">
            Como este é o primeiro acesso, você precisará criar usuários manualmente no Supabase e configurá-los como administradores.
          </p>
          <p className="text-amber-700 text-sm">
            Se você for o administrador principal (nandoesporte1@gmail.com), suas permissões serão atualizadas automaticamente.
          </p>
        </div>
      )}
      
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
              {filteredUsers.map((user: any) => (
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
                    {user.is_admin ? (
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
                        disabled={isDeletingUser}
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
                <Button type="submit" disabled={isCreatingUser}>
                  {isCreatingUser ? "Criando..." : "Criar Usuário"}
                </Button>
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
                <Button type="submit" disabled={isResettingPassword}>
                  {isResettingPassword ? "Salvando..." : "Salvar Nova Senha"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
