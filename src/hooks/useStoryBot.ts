
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export const useStoryBot = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateStoryBotResponse = async (messages: Message[], userPrompt: string) => {
    setIsGenerating(true);
    try {
      // First, get the system prompt from the database
      const { data: promptData, error: promptError } = await supabase
        .from("storybot_prompts")
        .select("prompt")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (promptError && promptError.code !== 'PGRST116') {
        console.error("Error fetching StoryBot prompt:", promptError);
      }

      // Default system prompt if none exists in database
      const systemPrompt = promptData?.prompt || 
        `Você é um assistente de criação de histórias infantis chamado StoryBot. Você deve criar histórias interessantes, educativas e apropriadas para crianças, baseadas nas informações fornecidas pelo usuário.

Suas respostas devem ser:
1. Criativas e envolventes
2. Apropriadas para a idade indicada
3. Em português do Brasil
4. Livres de conteúdo assustador, violento ou inadequado
5. Bem estruturadas com começo, meio e fim

Quando o usuário fornecer o nome e idade da criança, tema e cenário, você deve criar uma história com um personagem principal daquele nome e incorporar os elementos solicitados.`;

      // Format conversation history for OpenAI
      const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
      ];

      // Make API call to your backend or directly to OpenAI with your API key
      const apiResponse = await fetch("/api/storybot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: formattedMessages,
          userId: user?.id || "anonymous",
        }),
      });

      if (!apiResponse.ok) {
        throw new Error("Failed to generate response");
      }

      const data = await apiResponse.json();
      return data.response || "Desculpe, não consegui gerar uma resposta.";
    } catch (error) {
      console.error("Error generating StoryBot response:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateStoryBotResponse, isGenerating };
};
