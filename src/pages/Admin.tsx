
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { StoryManager } from "@/components/admin/StoryManager";
import { UserManager } from "@/components/admin/UserManager";
import { CharacterManager } from "@/components/admin/CharacterManager";
import { ThemeManager } from "@/components/admin/ThemeManager";
import { StoryBotPromptManager } from "@/components/admin/StoryBotPromptManager";
import GeminiApiKeyManager from "@/components/admin/GeminiApiKeyManager";
import TestModeManager from "@/components/admin/TestModeManager";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("stories");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Parse query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['stories', 'users', 'characters', 'themes', 'prompts', 'config', 'test'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);
      
      if (!user) {
        console.log("Admin check: No user logged in");
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      try {
        console.log("Admin check for user:", user.email);
        
        // First check: If it's the target admin email (hardcoded check for reliability)
        if (user.email === 'nandoesporte1@gmail.com') {
          console.log("Admin access granted: Direct email match for", user.email);
          localStorage.setItem('user_role', 'admin');
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        // Second check: Check database
        try {
          // Initialize the database structure if needed
          await supabase.rpc('create_user_profiles_if_not_exists');
          
          const { data, error } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
          
          console.log("Admin database check result:", { data, error });
            
          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          } else if (data?.is_admin) {
            console.log("Admin access granted: Database check");
            localStorage.setItem('user_role', 'admin');
            setIsAdmin(true);
          } else {
            console.log("Admin access denied: Not an admin in database");
            localStorage.setItem('user_role', 'user');
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error during admin check:', error);
          setIsAdmin(false);
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  // Redirect non-admin users
  useEffect(() => {
    if (!loading) {
      if (user === null) {
        console.log("Redirecting to auth: No user");
        navigate("/auth");
        toast.error("Faça login para acessar esta página");
      } else if (user && !isAdmin) {
        console.log("Redirecting to home: Not admin");
        navigate("/");
        toast.error("Você não tem permissão para acessar esta página");
      } else {
        console.log("Admin access allowed");
      }
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto my-8 p-4">
        <h1 className="text-2xl font-bold">Verificando permissões...</h1>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto my-8 p-4">
        <h1 className="text-2xl font-bold">Verificando permissões...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto my-8 p-4">
      <h1 className="text-3xl font-bold mb-8">Painel de Administração</h1>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="stories">Histórias</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="characters">Personagens</TabsTrigger>
          <TabsTrigger value="themes">Temas</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
          <TabsTrigger value="test">Modo Teste</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stories" className="space-y-4">
          <h2 className="text-2xl font-bold">Gerenciar Histórias</h2>
          <StoryManager />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
          <UserManager />
        </TabsContent>
        
        <TabsContent value="characters" className="space-y-4">
          <h2 className="text-2xl font-bold">Gerenciar Personagens</h2>
          <CharacterManager />
        </TabsContent>
        
        <TabsContent value="themes" className="space-y-4">
          <h2 className="text-2xl font-bold">Gerenciar Temas</h2>
          <ThemeManager />
        </TabsContent>
        
        <TabsContent value="prompts" className="space-y-4">
          <h2 className="text-2xl font-bold">Gerenciar Prompts</h2>
          <StoryBotPromptManager />
        </TabsContent>
        
        <TabsContent value="config" className="space-y-6">
          <h2 className="text-2xl font-bold">Configurações</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GeminiApiKeyManager />
          </div>
        </TabsContent>
        
        <TabsContent value="test" className="space-y-4">
          <h2 className="text-2xl font-bold">Modo de Teste</h2>
          <p className="text-muted-foreground mb-4">
            Gere histórias de teste sem usar APIs externas, facilitando testes do sistema.
          </p>
          <TestModeManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
