
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { HomeIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { StoryManager } from "@/components/admin/StoryManager";
import { UserManager } from "@/components/admin/UserManager";
import { ThemeManager } from "@/components/admin/ThemeManager";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("stories");

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
            <ThemeManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
