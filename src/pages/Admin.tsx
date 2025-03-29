import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ThemeManager from "@/components/admin/ThemeManager";
import StoryBotPromptManager from "@/components/admin/StoryBotPromptManager";
import CharacterManager from "@/components/admin/CharacterManager";
import UserManager from "@/components/admin/UserManager";
import StoryManager from "@/components/admin/StoryManager";
import TestModeManager from "@/components/admin/TestModeManager";
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Loader2 } from "lucide-react";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("stories");
  const { isAdmin, isLoading } = useAdminCheck();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Verificando permissões de administrador...</span>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-center">Acesso Restrito</h1>
          <p className="mt-4 text-center">
            Você não tem permissão para acessar esta página.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold">Painel de Administração</h1>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <TabsTrigger value="stories">Histórias</TabsTrigger>
            <TabsTrigger value="themes">Temas</TabsTrigger>
            <TabsTrigger value="characters">Personagens</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="test">Modo Teste</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="stories">
              <Card className="p-6">
                <StoryManager />
              </Card>
            </TabsContent>
            
            <TabsContent value="themes">
              <Card className="p-6">
                <ThemeManager />
              </Card>
            </TabsContent>
            
            <TabsContent value="characters">
              <Card className="p-6">
                <CharacterManager />
              </Card>
            </TabsContent>
            
            <TabsContent value="users">
              <Card className="p-6">
                <UserManager />
              </Card>
            </TabsContent>
            
            <TabsContent value="prompts">
              <Card className="p-6">
                <StoryBotPromptManager />
              </Card>
            </TabsContent>
            
            <TabsContent value="test">
              <Card className="p-6">
                <TestModeManager />
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
