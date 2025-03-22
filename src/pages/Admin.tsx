
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { HomeIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { StoryManager } from "@/components/admin/StoryManager";
import { UserManager } from "@/components/admin/UserManager";
import { ThemeManager } from "@/components/admin/ThemeManager";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("themes");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Fetch all index page contents for admin panel
  const { data: indexPageContents, isLoading: isLoadingContents } = useQuery({
    queryKey: ["all-page-contents", "index"],
    queryFn: async () => {
      try {
        // First try to create the page_contents table if it doesn't exist
        await supabase.rpc('create_page_contents_if_not_exists');
        
        // Then get the contents
        const { data, error } = await supabase
          .from("page_contents")
          .select("*")
          .eq("page", "index")
          .order("section", { ascending: true });
        
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Error fetching page contents:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      setIsChecking(false);
      return;
    }

    const checkAdmin = async () => {
      setIsChecking(true);
      try {
        // First try to create the user_profiles table with proper columns if it doesn't exist
        await supabase.rpc('create_user_profiles_if_not_exists');
        
        // Then check if user is admin
        const { data, error } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("user_id", user.id)
          .single();
        
        if (error) {
          // If the user doesn't have a profile yet, create one
          if (error.code === 'PGRST116') {
            // Not found
            const { data: newProfile, error: insertError } = await supabase
              .from("user_profiles")
              .insert({ user_id: user.id, is_admin: user.email === 'nandoesporte1@gmail.com' })
              .select()
              .single();
              
            if (insertError) throw insertError;
            setIsAdmin(newProfile?.is_admin || false);
          } else {
            throw error;
          }
        } else {
          setIsAdmin(data?.is_admin || false);
        }
        
        // Special case: if this is the hardcoded admin email, always grant access
        if (user.email === 'nandoesporte1@gmail.com') {
          setIsAdmin(true);
        }
      } catch (error: any) {
        console.error("Error checking admin status:", error);
        
        // Special case: if this is the hardcoded admin email, always grant access
        if (user.email === 'nandoesporte1@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          toast({
            title: "Erro ao verificar permissões",
            description: "Não foi possível verificar suas permissões de administrador.",
            variant: "destructive",
          });
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAdmin();
  }, [user, toast]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user && !isChecking) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar autenticado para acessar o painel administrativo.",
        variant: "destructive",
      });
      navigate("/");
    } else if (isAdmin === false && !isChecking) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta área.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, isAdmin, isChecking, navigate, toast]);

  // Prevent rendering before we confirm admin status
  if (isChecking || isAdmin === null) {
    return (
      <div className="container py-8 min-h-screen flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p>Verificando permissões...</p>
      </div>
    );
  }

  // Handle loading state for contents
  if (isLoadingContents) {
    return (
      <div className="container py-8 min-h-screen flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p>Carregando conteúdo da página...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 min-h-screen">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <HomeIcon className="mr-2 h-4 w-4" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Painel Administrativo</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie todos os dados do sistema: histórias, usuários e configurações.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="stories">Histórias</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="themes">Temas e Configurações</TabsTrigger>
          </TabsList>
          <TabsContent value="stories" className="mt-4">
            <StoryManager />
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <UserManager />
          </TabsContent>
          <TabsContent value="themes" className="mt-4">
            <ThemeManager initialPageContents={indexPageContents || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
