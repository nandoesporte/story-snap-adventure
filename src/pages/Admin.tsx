import React, { useState } from "react";
import {
  BookOpen,
  CreditCard,
  Flask,
  MessageSquareText,
  Palette,
  Settings,
  Star,
  Users,
  UserRound,
  WalletCards,
  CheckCircle
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { UserManager } from "@/components/admin/UserManager";
import { StoryManager } from "@/components/admin/StoryManager";
import { CharacterManager } from "@/components/admin/CharacterManager";
import { ThemeManager } from "@/components/admin/ThemeManager";
import { FeaturedStories } from "@/components/admin/FeaturedStories";
import { SystemConfiguration } from "@/components/admin/SystemConfiguration";
import { SubscriptionManager } from "@/components/admin/SubscriptionManager";
import { PaymentMethods } from "@/components/admin/PaymentMethods";
import { TestMode } from "@/components/admin/TestMode";
import { PromptManager } from "@/components/admin/PromptManager";

// Import the new UserSubscriptionManager
import UserSubscriptionManager from '@/components/admin/UserSubscriptionManager';

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");

  // Define the tabs
  const tabs = [
    { id: 'users', label: 'Usuários', icon: <Users className="h-5 w-5" /> },
    { id: 'stories', label: 'Histórias', icon: <BookOpen className="h-5 w-5" /> },
    { id: 'characters', label: 'Personagens', icon: <UserRound className="h-5 w-5" /> },
    { id: 'themes', label: 'Temas', icon: <Palette className="h-5 w-5" /> },
    { id: 'subscriptions', label: 'Planos', icon: <CreditCard className="h-5 w-5" /> },
    { id: 'manual-subscriptions', label: 'Ativar Assinaturas', icon: <CheckCircle className="h-5 w-5" /> },
    { id: 'featured', label: 'Destaque', icon: <Star className="h-5 w-5" /> },
    { id: 'prompts', label: 'Prompts', icon: <MessageSquareText className="h-5 w-5" /> },
    { id: 'payment-methods', label: 'Métodos de Pagamento', icon: <WalletCards className="h-5 w-5" /> },
    { id: 'test-mode', label: 'Modo de Teste', icon: <Flask className="h-5 w-5" /> },
    { id: 'config', label: 'Configurações', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-3xl font-bold mb-4">Painel de Administração</h2>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} onClick={() => setActiveTab(tab.id)}>
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="users" className="space-y-4">
          <UserManager />
        </TabsContent>
        <TabsContent value="stories" className="space-y-4">
          <StoryManager />
        </TabsContent>
        <TabsContent value="characters" className="space-y-4">
          <CharacterManager />
        </TabsContent>
        <TabsContent value="themes" className="space-y-4">
          <ThemeManager />
        </TabsContent>
        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionManager />
        </TabsContent>
        <TabsContent value="manual-subscriptions" className="space-y-4">
          <UserSubscriptionManager />
        </TabsContent>
        <TabsContent value="featured" className="space-y-4">
          <FeaturedStories />
        </TabsContent>
        <TabsContent value="prompts" className="space-y-4">
          <PromptManager />
        </TabsContent>
        <TabsContent value="payment-methods" className="space-y-4">
          <PaymentMethods />
        </TabsContent>
        <TabsContent value="test-mode" className="space-y-4">
          <TestMode />
        </TabsContent>
        <TabsContent value="config" className="space-y-4">
          <SystemConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
