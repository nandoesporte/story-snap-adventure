import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Leonardo AI API key
const LEONARDO_API_KEY = "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";

export const useStoryBot = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [apiAvailable, setApiAvailable] = useState(true);
  const MAX_RETRIES = 2;
  const API_TIMEOUT = 30000; // Increased to 30 seconds
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
6. Ricas em detalhes visuais e sensoriais
7. Com personagens cativantes e memoráveis

Quando o usuário fornecer o nome e idade da criança, tema e cenário, você deve criar uma história com um personagem principal daquele nome e incorporar os elementos solicitados. Cada página deve ter conteúdo substancial com pelo menos 3-4 parágrafos (cerca de 150-200 palavras) para criar uma experiência de leitura rica.`;
        console.log("Using default prompt");
      }

      // Format conversation history for OpenAI with correct types
      const formattedMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role === "user" ? "user" as const : "assistant" as const,
          content: msg.content
        }))
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

      const response = await Promise.race([
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 1500,
        }),
        timeoutPromise
      ]) as any;

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
    setting: string,
    style: string = "cartoon"
  ) => {
    try {
      // If API was previously marked as unavailable, use simplified description
      if (!apiAvailable) {
        return `Ilustração detalhada de ${childName} em uma aventura no cenário de ${setting} com tema de ${theme}. A cena mostra: ${pageText.substring(0, 100)}...`;
      }
      
      // Enhanced image description prompt
      const imagePrompt = `Crie uma descrição detalhada para ilustração de livro infantil no estilo ${style}, com um visual colorido, encantador e adequado para crianças. O protagonista da história é ${childName}, e a imagem deve representar fielmente a cena descrita no texto abaixo. O cenário é ${setting}, que deve ser detalhado de forma vibrante e mágica. A ilustração deve expressar emoções, ação e aventura, transmitindo a essência da história de forma visualmente envolvente. Garanta que os elementos do ambiente, cores e expressões dos personagens estejam bem definidos e alinhados ao tom infantil da narrativa.

Texto da cena: "${pageText}"

Forneça uma descrição visual completa em até 150 palavras, focando nos elementos visuais principais desta cena. A descrição será usada para gerar uma ilustração. Enfatize as cores, expressões, ambiente e ação principal.`;
      
      const messages: Message[] = [
        {
          role: "user",
          content: imagePrompt
        }
      ];
      
      const description = await generateStoryBotResponse(messages, "");
      return description;
    } catch (error) {
      console.error("Error generating image description:", error);
      setApiAvailable(false);
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      localStorage.setItem("storybot_api_issue", "true");
      
      return `Ilustração detalhada de ${childName} em uma aventura no cenário de ${setting} com tema de ${theme}.`;
    }
  };
  
  // Generate an image for a story page based on description using Leonardo AI
  const generateImage = async (
    imageDescription: string,
    childName: string,
    theme: string,
    setting: string,
    childImageBase64: string | null,
    style: string = "cartoon",
    characterPrompt: string | null = null
  ) => {
    try {
      console.log("Generating image with Leonardo AI:", imageDescription);
      
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
      
      // Enhance the prompt with character-specific details if available
      let fullPrompt = imageDescription;
      if (characterPrompt) {
        fullPrompt = `${imageDescription}\n\nPersonagem: ${characterPrompt}`;
      }
      
      // Leonardo AI Integration
      try {
        const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${LEONARDO_API_KEY}`
          },
          body: JSON.stringify({
            prompt: fullPrompt,
            modelId: "e316348f-7773-490e-adcd-46757c738eb7", // Dreamshaper v7 model
            width: 768,
            height: 512,
            num_images: 1,
            public: false,
            promptMagic: true,
            promptMagicVersion: "v2",
            alchemy: true,
            contrastRatio: 0.5,
            expandedDomain: true,
            guidanceScale: 7,
            negativePrompt: "poorly drawn faces, poorly drawn hands, poorly drawn feet, poorly drawn legs, distorted, ugly, blurry, low quality",
            nsfw: false,
            photoReal: false,
            presetStyle: "LEONARDO"
          })
        });

        if (!response.ok) {
          throw new Error(`Leonardo AI API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Leonardo AI generation response:", data);
        
        // Check if we need to wait for generation to complete
        if (data.sdGenerationJob && data.sdGenerationJob.generationId) {
          const generationId = data.sdGenerationJob.generationId;
          
          // Poll for generated images
          const imageUrl = await pollForGeneratedImages(generationId);
          return imageUrl;
        } else {
          throw new Error("No generation ID returned from Leonardo AI");
        }
      } catch (error) {
        console.error("Leonardo AI generation error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setApiAvailable(false);
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      localStorage.setItem("storybot_api_issue", "true");
      
      // Fallback to themed placeholders
      const themeImages = {
        adventure: "/images/placeholders/adventure.jpg",
        fantasy: "/images/placeholders/fantasy.jpg",
        space: "/images/placeholders/space.jpg",
        ocean: "/images/placeholders/ocean.jpg",
        dinosaurs: "/images/placeholders/dinosaurs.jpg"
      };
      
      return themeImages[theme as keyof typeof themeImages] || "/placeholder.svg";
    }
  };
  
  // Poll Leonardo AI for generated images
  const pollForGeneratedImages = async (generationId: string, maxAttempts = 30, delayMs = 2000): Promise<string> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        console.log(`Polling Leonardo AI for generation results (attempt ${attempt + 1}/${maxAttempts})`);
        
        const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${LEONARDO_API_KEY}`
          }
        });

        if (!response.ok) {
          throw new Error(`Leonardo AI API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Poll response:", data);
        
        // Check if generation is complete
        if (data.generations_by_pk && data.generations_by_pk.status === "COMPLETE") {
          // Get the first generated image URL
          if (data.generations_by_pk.generated_images && data.generations_by_pk.generated_images.length > 0) {
            return data.generations_by_pk.generated_images[0].url;
          } else {
            throw new Error("No generated images found");
          }
        } else if (data.generations_by_pk && data.generations_by_pk.status === "FAILED") {
          throw new Error("Image generation failed");
        }
        
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } catch (error) {
        console.error(`Polling error (attempt ${attempt + 1}/${maxAttempts}):`, error);
        
        // For the last attempt, throw the error
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        
        // Otherwise wait and try again
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw new Error("Max polling attempts reached");
  };
  
  // Generate a cover image for the story using Leonardo AI
  const generateCoverImage = async (
    title: string,
    childName: string,
    theme: string,
    setting: string,
    childImageBase64: string | null,
    style: string = "cartoon",
    characterPrompt: string | null = null
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
      
      // Create a detailed cover image prompt
      let coverPrompt = `Crie uma ilustração de capa para um livro infantil intitulado "${title}". A capa deve ser colorida, mágica e atraente para crianças, apresentando o protagonista ${childName} em um cenário de ${setting} com tema de ${theme}. A ilustração deve ter cores vibrantes, um estilo ${style} encantador, e capturar a essência da aventura.`;
      
      // Add character-specific details if available
      if (characterPrompt) {
        coverPrompt = `${coverPrompt}\n\nPersonagem: ${characterPrompt}`;
      }
      
      // Leonardo AI Integration for cover
      try {
        const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${LEONARDO_API_KEY}`
          },
          body: JSON.stringify({
            prompt: coverPrompt,
            modelId: "e316348f-7773-490e-adcd-46757c738eb7", // Dreamshaper v7 model
            width: 832,
            height: 512,
            num_images: 1,
            public: false,
            promptMagic: true,
            promptMagicVersion: "v2",
            alchemy: true,
            contrastRatio: 0.5,
            expandedDomain: true,
            guidanceScale: 7,
            negativePrompt: "poorly drawn faces, poorly drawn hands, distorted, ugly, blurry, low quality",
            nsfw: false,
            photoReal: false,
            presetStyle: "LEONARDO"
          })
        });

        if (!response.ok) {
          throw new Error(`Leonardo AI API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Leonardo AI cover generation response:", data);
        
        // Check if we need to wait for generation to complete
        if (data.sdGenerationJob && data.sdGenerationJob.generationId) {
          const generationId = data.sdGenerationJob.generationId;
          
          // Poll for generated images
          const coverUrl = await pollForGeneratedImages(generationId);
          return coverUrl;
        } else {
          throw new Error("No generation ID returned from Leonardo AI");
        }
      } catch (error) {
        console.error("Leonardo AI cover generation error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error generating cover image:", error);
      setApiAvailable(false);
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      localStorage.setItem("storybot_api_issue", "true");
      
      // Fallback to themed cover placeholders
      const themeCovers = {
        adventure: "/images/covers/adventure.jpg",
        fantasy: "/images/covers/fantasy.jpg",
        space: "/images/covers/space.jpg",
        ocean: "/images/covers/ocean.jpg",
        dinosaurs: "/images/covers/dinosaurs.jpg"
      };
      
      return themeCovers[theme as keyof typeof themeCovers] || `/placeholder.svg`;
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
