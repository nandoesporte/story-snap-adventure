
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Create an empty placeholder component
const StoryBotPromptManagerContent = () => {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <p>Configuração de prompts do StoryBot será implementada em breve.</p>
    </div>
  );
};

const StoryBotPromptManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompts do StoryBot</CardTitle>
        <CardDescription>
          Gerencie os prompts utilizados pelo StoryBot para gerar histórias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StoryBotPromptManagerContent />
      </CardContent>
    </Card>
  );
};

export default StoryBotPromptManager;
