
import React, { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  CreditCard,
  MessageSquareText,
  Palette,
  Settings,
  Star,
  Users,
  UserRound,
  WalletCards,
  CheckCircle,
  Beaker,
  Menu,
  X,
  Hammer,
  Image
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserManager } from "@/components/admin/UserManager";
import { StoryManager } from "@/components/admin/StoryManager";
import { CharacterManager } from "@/components/admin/CharacterManager";
import { ThemeManager } from "@/components/admin/ThemeManager";
import FeaturedStoryManager from "@/components/admin/FeaturedStoryManager";
import SystemConfigurationManager from "@/components/admin/SystemConfigurationManager";
import SubscriptionManager from "@/components/admin/SubscriptionManager";
import PaymentMethodsManager from "@/components/admin/PaymentMethodsManager";
import TestModeManager from "@/components/admin/TestModeManager";
import StoryBotPromptManager from "@/components/admin/StoryBotPromptManager";
import StoryImageRepairTool from "@/components/admin/StoryImageRepairTool";

// Import the UserSubscriptionManager
import UserSubscriptionManager from '@/components/admin/UserSubscriptionManager';

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const tabsContainerRef = useRef<HTMLDivElement>(null);

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
    { id: 'test-mode', label: 'Modo de Teste', icon: <Beaker className="h-5 w-5" /> },
    { id: 'image-repair', label: 'Reparo de Imagens', icon: <Hammer className="h-5 w-5" /> },
    { id: 'config', label: 'Configurações', icon: <Settings className="h-5 w-5" /> },
  ];

  // Effect to check URL parameters for active tab
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tabParam = queryParams.get('tab');
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', url);
  }, [activeTab]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (isMobile) {
      setMenuOpen(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h2 className="text-3xl font-bold mb-4">Painel de Administração</h2>

      <div className="relative">
        {isMobile && (
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleMenu}
                className="mr-2"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
              <span className="font-medium">
                {tabs.find(tab => tab.id === activeTab)?.label || 'Painel'}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          {(isMobile && menuOpen) || !isMobile ? (
            <div 
              className={`${isMobile ? 'absolute z-10 bg-white dark:bg-gray-950 shadow-lg rounded-lg p-4 w-64' : 'w-64'}`}
              ref={tabsContainerRef}
            >
              <div className="flex flex-col space-y-1">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => handleTabClick(tab.id)}
                  >
                    {tab.icon}
                    <span className="ml-2">{tab.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <div className={`flex-1 ${(isMobile && menuOpen) ? 'opacity-20' : ''}`}>
            <div className="space-y-4">
              {activeTab === 'users' && <UserManager />}
              {activeTab === 'stories' && <StoryManager />}
              {activeTab === 'characters' && <CharacterManager />}
              {activeTab === 'themes' && <ThemeManager />}
              {activeTab === 'subscriptions' && <SubscriptionManager />}
              {activeTab === 'manual-subscriptions' && <UserSubscriptionManager />}
              {activeTab === 'featured' && <FeaturedStoryManager />}
              {activeTab === 'prompts' && <StoryBotPromptManager />}
              {activeTab === 'payment-methods' && <PaymentMethodsManager />}
              {activeTab === 'test-mode' && <TestModeManager />}
              {activeTab === 'image-repair' && <StoryImageRepairTool />}
              {activeTab === 'config' && <SystemConfigurationManager />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
