
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StoryBotPromptManager as OriginalStoryBotPromptManager } from "@/components/admin/StoryBotPromptManager";

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
        <OriginalStoryBotPromptManager />
      </CardContent>
    </Card>
  );
};

export default StoryBotPromptManager;
