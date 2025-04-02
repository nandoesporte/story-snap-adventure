
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ImageMigrationButton from "./ImageMigrationButton";
import ImageUrlChecker from "./ImageUrlChecker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MyStoriesMigrationCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("migrate");

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-violet-50 shadow-md border-indigo-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Imagens Permanentes</CardTitle>
        <CardDescription>
          Gerencie as ilustrações das histórias no armazenamento permanente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="migrate" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="migrate">Migrar Imagens</TabsTrigger>
            <TabsTrigger value="check">Verificar URLs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="migrate">
            <p className="text-sm text-gray-600 mb-4">
              Este processo garante que as ilustrações das suas histórias permaneçam disponíveis mesmo após
              o vencimento das URLs temporárias geradas pela OpenAI.
            </p>
            <ImageMigrationButton 
              limit={20}
              className="w-full"
            />
          </TabsContent>
          
          <TabsContent value="check">
            <p className="text-sm text-gray-600 mb-4">
              Verifique se as URLs de imagens das histórias recentes ainda estão acessíveis e migre-as 
              automaticamente se necessário.
            </p>
            <ImageUrlChecker 
              limit={20} 
              className="mt-2" 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MyStoriesMigrationCard;
