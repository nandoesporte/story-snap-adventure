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
  const [apiAvailable, setApiAvailable] = useState(true);
  const MAX_RETRIES = 2;
  const API_TIMEOUT = 15000; // 15 seconds timeout
  const OPENAI_API_KEY = "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";

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

      // Create a timeout promise to limit API request time
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), API_TIMEOUT);
      });

      // Make API call to OpenAI directly with the provided API key
      const { OpenAI } = await import("openai");
      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      setRetryCount(0);
      setApiAvailable(true);
      return response.choices[0]?.message.content || "Desculpe, não consegui gerar uma resposta.";
      
    } catch (error) {
      console.error("Error generating StoryBot response:", error);
      // Mark API as unavailable
      setApiAvailable(false);
      
      // Trigger API issue event to notify other components
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      localStorage.setItem("storybot_api_issue", "true");
      
      // Provide a graceful fallback response
      const fallbackResponses = [
        "Peço desculpas, estou com dificuldades técnicas no momento. Estou usando um gerador local de histórias para continuar te ajudando. Poderia tentar novamente com outras palavras?",
        "Estou tendo problemas para acessar minha base de conhecimento completa, mas posso continuar te ajudando com o gerador local de histórias. Vamos tentar algo diferente?",
        "Parece que houve um problema na conexão. Estou trabalhando com recursos limitados agora, mas ainda posso criar histórias legais para você. Poderia reformular sua pergunta?"
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
      // If API was previously marked as unavailable, use simplified description
      if (!apiAvailable) {
        return `Ilustração de ${childName} em uma aventura no cenário de ${setting} com tema de ${theme}.`;
      }
      
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
      setApiAvailable(false);
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      localStorage.setItem("storybot_api_issue", "true");
      
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
      
      // If API was previously marked as unavailable, return a themed placeholder
      if (!apiAvailable) {
        const themeImages = {
          adventure: "/images/placeholders/adventure.jpg",
          fantasy: "/images/placeholders/fantasy.jpg",
          space: "/images/placeholders/space.jpg",
          ocean: "/images/placeholders/ocean.jpg",
          dinosaurs: "/images/placeholders/dinosaurs.jpg"
        };
        
        return themeImages[theme as keyof typeof themeImages] || "https://via.placeholder.com/600x400?text=Story+Image";
      }
      
      // In a production app, you would call an image generation API here
      // For now, return a placeholder image
      return "https://via.placeholder.com/600x400?text=Story+Image";
    } catch (error) {
      console.error("Error generating image:", error);
      setApiAvailable(false);
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      localStorage.setItem("storybot_api_issue", "true");
      
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
      
      // If API was previously marked as unavailable, return a themed placeholder
      if (!apiAvailable) {
        const themeCovers = {
          adventure: "/images/covers/adventure.jpg",
          fantasy: "/images/covers/fantasy.jpg",
          space: "/images/covers/space.jpg",
          ocean: "/images/covers/ocean.jpg",
          dinosaurs: "/images/covers/dinosaurs.jpg"
        };
        
        return themeCovers[theme as keyof typeof themeCovers] || `https://via.placeholder.com/800x600?text=${encodeURIComponent(title)}`;
      }
      
      // In a production app, you would call an image generation API here
      // For now, return a placeholder image with the story title
      return `https://via.placeholder.com/800x600?text=${encodeURIComponent(title)}`;
    } catch (error) {
      console.error("Error generating cover image:", error);
      setApiAvailable(false);
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      localStorage.setItem("storybot_api_issue", "true");
      
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
    convertImageToBase64,
    apiAvailable
  };
};
