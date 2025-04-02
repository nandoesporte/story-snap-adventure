
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ImageMigrationButton from "./ImageMigrationButton";

const MyStoriesMigrationCard: React.FC = () => {
  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-violet-50 shadow-md border-indigo-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Imagens Permanentes</CardTitle>
        <CardDescription>
          Salve as ilustrações das histórias permanentemente no ImgBB
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Este processo garante que as ilustrações das suas histórias permaneçam disponíveis mesmo após
          o vencimento das URLs temporárias geradas pela OpenAI.
        </p>
        <ImageMigrationButton 
          limit={20}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
};

export default MyStoriesMigrationCard;
