
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { HomeIcon, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { StoryManager } from "@/components/admin/StoryManager";
import { UserManager } from "@/components/admin/UserManager";
import { ThemeManager } from "@/components/admin/ThemeManager";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("themes");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [storageBucketExists, setStorageBucketExists] = useState<boolean | null>(null);

  // Check if the storage bucket exists
  useEffect(() => {
    const checkStorageBucket = async () => {
      try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
          console.error("Error checking storage buckets:", error);
          setStorageBucketExists(false);
          return;
        }
        
        const publicBucket = data?.find(bucket => bucket.name === 'public');
        setStorageBucketExists(!!publicBucket);
      } catch (err) {
        console.error("Error checking storage bucket:", err);
        setStorageBucketExists(false);
      }
    };
    
    if (user) {
      checkStorageBucket();
    }
  }, [user]);

  // Fetch all index page contents for admin panel
  const { data: indexPageContents, isLoading: isLoadingContents } = useQuery({
    queryKey: ["all-page-contents", "index"],
    queryFn: async () => {
      try {
        // First try to create the page_contents table if it doesn't exist
        try {
          await supabase.rpc('create_page_contents_if_not_exists');
        } catch (err) {
          console.warn("Error calling create_page_contents_if_not_exists:", err);
          // If RPC doesn't exist yet, we might need to run the SQL directly
          // This would typically be done via SQL migration in Supabase dashboard
        }
        
        // Then get the contents
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
        try {
          await supabase.rpc('create_user_profiles_if_not_exists');
        } catch (err) {
          console.warn("Error calling create_user_profiles_if_not_exists:", err);
          // If RPC doesn't exist yet, we might need to run the SQL directly
        }
        
        // Then check if user is admin
        const { data, error } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("id", user.id)  // FIXED: Changed from user_id to id to match table structure
          .single();
        
        if (error) {
          // If the user doesn't have a profile yet, create one
          if (error.code === 'PGRST116') {
            // Not found
            const { data: newProfile, error: insertError } = await supabase
              .from("user_profiles")
              .insert({ id: user.id, is_admin: user.email === 'nandoesporte1@gmail.com' })  // FIXED: Changed from user_id to id
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
          
          // Ensure this user is admin in the database too
          await supabase
            .from("user_profiles")
            .upsert({ 
              id: user.id,  // FIXED: Changed from user_id to id
              is_admin: true,
              display_name: user.email
            })
            .select();
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

      {storageBucketExists === false && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Configuração do Storage Necessária
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Para que o upload de arquivos funcione corretamente, você precisa criar um bucket de armazenamento chamado 'public' no seu projeto Supabase.
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Acesse o painel do Supabase</li>
              <li>Navegue até Storage → Buckets</li>
              <li>Clique em "New Bucket"</li>
              <li>Nomeie o bucket como "public"</li>
              <li>Marque a opção "Public bucket" (para acesso público aos arquivos)</li>
              <li>Configure as RLS policies conforme necessário para controle de acesso</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}

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
