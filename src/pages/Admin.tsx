
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

  const { data: indexPageContents, isLoading: isLoadingContents } = useQuery({
    queryKey: ["all-page-contents", "index"],
    queryFn: async () => {
      try {
        try {
          await supabase.rpc('create_page_contents_if_not_exists');
        } catch (err) {
          console.warn("Error calling create_page_contents_if_not_exists:", err);
        }
        
        const { data, error } = await supabase
          .from("page_contents")
          .select("*")
          .eq("page", "index")
          .order("section", { ascending: true });
        
        if (error) {
          console.error("Error fetching page contents:", error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.error("Error fetching page contents:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) {
      setIsChecking(false);
      return;
    }

    const checkAdmin = async () => {
      setIsChecking(true);
      try {
        try {
          await supabase.rpc('create_user_profiles_if_not_exists');
        } catch (err) {
          console.warn("Error calling create_user_profiles_if_not_exists:", err);
        }
        
        const { data, error } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            const { data: newProfile, error: insertError } = await supabase
              .from("user_profiles")
              .insert({ id: user.id, is_admin: user.email === 'nandoesporte1@gmail.com' })
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
        
        if (user.email === 'nandoesporte1@gmail.com') {
          setIsAdmin(true);
          
          await supabase
            .from("user_profiles")
            .upsert({ 
              id: user.id,
              is_admin: true,
              display_name: user.email
            })
            .select();
        }
      } catch (error: any) {
        console.error("Error checking admin status:", error);
        
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

  if (isChecking || isAdmin === null) {
    return (
      <div className="container py-8 min-h-screen flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p>Verificando permissões...</p>
      </div>
    );
  }

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
