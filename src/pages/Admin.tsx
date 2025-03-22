
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

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("themes");
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch all index page contents for admin panel
  const { data: indexPageContents } = useQuery({
    queryKey: ["all-page-contents", "index"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .eq("page", "index")
        .order("section", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Check if user is admin
  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("user_id", user.id)
          .single();
        
        if (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(data?.is_admin || false);
        
        if (!data?.is_admin) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar esta área.",
            variant: "destructive",
          });
          navigate("/");
        }
      };

      checkAdmin();
    }
  }, [user, navigate, toast]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar autenticado para acessar o painel administrativo.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  // Prevent rendering before we confirm admin status
  if (user && !isAdmin) {
    return (
      <div className="container py-8 min-h-screen flex items-center justify-center">
        <p>Verificando permissões...</p>
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
            <ThemeManager initialPageContents={indexPageContents} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
