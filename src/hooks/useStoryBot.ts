
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export const useStoryBot = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  const generateStoryBotResponse = async (messages: Message[], userPrompt: string) => {
    setIsGenerating(true);
    let currentRetry = retryCount;
    
    try {
      // Try to get the system prompt from the database
      let systemPrompt: string | null = null;
      
      try {
        const { data: promptData, error: promptError } = await supabase
          .from("storybot_prompts")
          .select("prompt")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!promptError) {
          systemPrompt = promptData?.prompt || null;
        } else {
          console.log("Error fetching prompt from database:", promptError);
        }
      } catch (err) {
        console.log("Error fetching prompt from database, will try localStorage:", err);
      }
      
      // If database fetch failed, try localStorage
      if (!systemPrompt) {
        systemPrompt = localStorage.getItem('storybot_prompt');
        console.log("Using localStorage prompt");
      }

      // Default system prompt if none exists in database or localStorage
      if (!systemPrompt) {
        systemPrompt = `Você é um assistente de criação de histórias infantis chamado StoryBot. Você deve criar histórias interessantes, educativas e apropriadas para crianças, baseadas nas informações fornecidas pelo usuário.

Suas respostas devem ser:
1. Criativas e envolventes
2. Apropriadas para a idade indicada
3. Em português do Brasil
4. Livres de conteúdo assustador, violento ou inadequado
5. Bem estruturadas com começo, meio e fim

Quando o usuário fornecer o nome e idade da criança, tema e cenário, você deve criar uma história com um personagem principal daquele nome e incorporar os elementos solicitados.`;
        console.log("Using default prompt");
      }

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
        const errorData = await apiResponse.json().catch(() => null);
        console.error("API error response:", errorData);
        
        // Check if we can retry
        if (currentRetry < MAX_RETRIES) {
          console.log(`Retrying request (${currentRetry + 1}/${MAX_RETRIES})...`);
          setRetryCount(currentRetry + 1);
          
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await generateStoryBotResponse(messages, userPrompt);
        }
        
        throw new Error(errorData?.error || "Failed to generate response");
      }

      // Reset retry count on success
      setRetryCount(0);
      const data = await apiResponse.json();
      return data.response || "Desculpe, não consegui gerar uma resposta.";
    } catch (error) {
      console.error("Error generating StoryBot response:", error);
      // Trigger API issue event
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      
      // Provide a graceful fallback response
      const fallbackResponses = [
        "Peço desculpas, estou com dificuldades técnicas no momento. Poderia tentar novamente com outras palavras?",
        "Estou tendo problemas para processar sua solicitação. Vamos tentar algo diferente?",
        "Hmm, parece que houve um problema na geração da história. Poderia reformular sua pergunta?"
      ];
      
      // Choose a random fallback response
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate an image description for a story page
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
      toast.error("Não foi possível gerar descrição da imagem. Usando descrição padrão.");
      return `Ilustração de ${childName} em uma aventura no cenário de ${setting}.`;
    }
  };
  
  // Generate an image for a story page based on description
  const generateImage = async (
    imageDescription: string,
    childName: string,
    theme: string,
    setting: string,
    childImageBase64: string | null
  ) => {
    try {
      console.log("Generating image with description:", imageDescription);
      
      // In a production app, you would call an image generation API here
      // For now, return a placeholder image
      return "https://via.placeholder.com/600x400?text=Story+Image";
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Não foi possível gerar a imagem. Usando imagem padrão.");
      return "/placeholder.svg";
    }
  };
  
  // Generate a cover image for the story
  const generateCoverImage = async (
    title: string,
    childName: string,
    theme: string,
    setting: string,
    childImageBase64: string | null
  ) => {
    try {
      console.log("Generating cover image for title:", title);
      
      // In a production app, you would call an image generation API here
      // For now, return a placeholder image with the story title
      return `https://via.placeholder.com/800x600?text=${encodeURIComponent(title)}`;
    } catch (error) {
      console.error("Error generating cover image:", error);
      toast.error("Não foi possível gerar a capa. Usando imagem padrão.");
      return "/placeholder.svg";
    }
  };
  
  // Utility to convert an image URL to base64
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
      toast.error("Erro ao processar imagem.");
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
