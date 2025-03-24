import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import StoryManager from "@/components/admin/StoryManager";
import UserManager from "@/components/admin/UserManager";
import CharacterManager from "@/components/admin/CharacterManager";
import ThemeManager from "@/components/admin/ThemeManager";
import StoryBotPromptManager from "@/components/admin/StoryBotPromptManager";
import GeminiApiKeyManager from "@/components/admin/GeminiApiKeyManager";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("stories");

  React.useEffect(() => {
    if (user === null) {
      navigate("/auth");
      toast.error("Faça login para acessar esta página");
    } else if (user && !isAdmin) {
      navigate("/");
      toast.error("Você não tem permissão para acessar esta página");
    }
  }, [user, isAdmin, navigate]);

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

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="stories">Histórias</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="characters">Personagens</TabsTrigger>
          <TabsTrigger value="themes">Temas</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default Admin;
