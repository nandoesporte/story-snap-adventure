
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

  // Add the missing functions that are being called in StoryCreationFlow and StoryCreator
  
  const generateImageDescription = async (
    pageText: string,
    childName: string,
    childAge: string,
    theme: string,
    setting: string
  ) => {
    try {
      const messages = [
        {
          role: "user" as const,
          content: `Por favor, crie uma descrição de imagem para esta cena de uma história infantil:
            
            Texto da página: "${pageText}"
            
            Personagem principal: ${childName}, ${childAge}
            Tema da história: ${theme}
            Cenário: ${setting}
            
            Descreva uma cena ilustrativa para esta parte da história em até 60 palavras, focando nos elementos visuais.`
        }
      ];
      
      const description = await generateStoryBotResponse(messages, "");
      return description;
    } catch (error) {
      console.error("Error generating image description:", error);
      return `Ilustração de ${childName} em uma aventura no cenário de ${setting}.`;
    }
  };
  
  const generateImage = async (
    imageDescription: string,
    childName: string,
    theme: string,
    setting: string,
    childImageBase64: string | null
  ) => {
    try {
      // Mock implementation since we don't have the actual implementation
      // In a real implementation, this would call an API to generate an image
      console.log("Generating image with description:", imageDescription);
      
      // Return a placeholder image URL
      return "https://placeholder.com/600x400";
    } catch (error) {
      console.error("Error generating image:", error);
      return "/placeholder.svg";
    }
  };
  
  const generateCoverImage = async (
    title: string,
    childName: string,
    theme: string,
    setting: string,
    childImageBase64: string | null
  ) => {
    try {
      // Mock implementation
      console.log("Generating cover image for title:", title);
      
      // Return a placeholder image URL
      return "https://placeholder.com/800x600";
    } catch (error) {
      console.error("Error generating cover image:", error);
      return "/placeholder.svg";
    }
  };
  
  const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return "";
    }
  };

  return { 
    generateStoryBotResponse, 
    isGenerating,
    generateImageDescription,
    generateImage,
    generateCoverImage,
    convertImageToBase64
  };
};
