import { useState } from "react";
import { toast } from "sonner";
import { generateStory, generateStoryWithGPT4 } from "../utils/storyGenerator";
import { OpenAI } from "openai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Initialize OpenAI client for chat
const openai = new OpenAI({
  apiKey: "sk-dummy-key", // This will be replaced by the user's key
  dangerouslyAllowBrowser: true
});

export const useStoryBot = () => {
  // Using the provided API keys
  const [geminiApiKey] = useState<string>("AIzaSyBTgwFJ6x0Tc_wVHW5aC_teeHUAzQT4MBg");
  const [leonardoApiKey] = useState<string>("da4c074d-dc73-4c70-b358-f7194aa10ec1");
  const [openaiApiKey] = useState<string>("sk-dummy-key"); // This would normally be provided by the user
  const [useLocalGenerator, setUseLocalGenerator] = useState<boolean>(false);
  
  const generateStoryBotResponse = async (
    messageHistory: Message[],
    userInput: string
  ): Promise<string> => {
    try {
      // If we've already determined the API has quota issues, use local generator
      if (useLocalGenerator) {
        return generateLocalResponse(messageHistory, userInput);
      }
      
      // Set the OpenAI API key
      openai.apiKey = openaiApiKey;
      
      try {
        const conversation = messageHistory.map(msg => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content
        }));
        
        // Add current user input
        conversation.push({
          role: "user",
          content: userInput
        });
        
        // Call OpenAI API
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `Você é um assistente virtual especializado em criar histórias infantis personalizadas. Seu nome é StoryBot. Sua função é ajudar pais e crianças a criarem histórias únicas e divertidas, com base nas preferências fornecidas.
              
Cumprimente o usuário de forma amigável. Pergunte o nome da criança e o tema da história que desejam criar. Ofereça sugestões de temas, como 'aventura na floresta', 'viagem ao espaço', 'reino mágico', etc.

Pergunte sobre características da criança (ex: corajosa, curiosa, brincalhona). Pergunte se há algum elemento específico que deva ser incluído na história (ex: animais, magia, amigos). Pergunte se o usuário deseja que a história tenha uma moral ou lição específica.

Crie uma história curta, envolvente e adequada para crianças de 4 a 8 anos. Use o nome da criança como personagem principal. Inclua diálogos engraçados e cenas emocionantes. Adicione uma moral ou lição no final, se solicitado.

Quando for gerar a história final, divida-a em 10 páginas, usando marcadores como "PAGINA 1:", "PAGINA 2:", etc. Cada página deve conter apenas um parágrafo curto de texto que caberá bem em uma página de livro infantil.

Responda apenas com o conteúdo da história, sem incluir instruções ou descrições para geração de imagens.

Use um tom amigável, divertido e encorajador. Mantenha a linguagem simples e acessível para crianças.`
            },
            ...conversation
          ],
          temperature: 0.7,
        });
        
        return completion.choices[0].message.content || "Desculpe, não consegui gerar uma resposta.";
      } catch (error) {
        console.error("Error with OpenAI:", error);
        // Fallback to local generator
        setUseLocalGenerator(true);
        return generateLocalResponse(messageHistory, userInput);
      }
    } catch (error) {
      console.error("Error in useStoryBot:", error);
      
      // If any error occurs, try the local generator
      setUseLocalGenerator(true);
      toast.warning("Usando gerador local de histórias devido a um erro na API.");
      return generateLocalResponse(messageHistory, userInput);
    }
  };

  const generateLocalResponse = async (messageHistory: Message[], userInput: string): Promise<string> => {
    // Extract child name and other details from the conversation
    let childName = "criança";
    let childAge = "5 anos";
    let theme = "adventure";
    let setting = "forest";
    
    // Try to extract child information from the message history or current input
    const allText = [...messageHistory.map(m => m.content), userInput].join(" ");
    
    // Check for child name in the conversation
    const nameMatch = allText.match(/história para ([A-Za-zÀ-ÖØ-öø-ÿ]+)/i);
    if (nameMatch && nameMatch[1]) {
      childName = nameMatch[1];
    }
    
    // Check for child age
    const ageMatch = allText.match(/(\d+) anos/i);
    if (ageMatch && ageMatch[1]) {
      childAge = `${ageMatch[1]} anos`;
    }
    
    // Check for theme keywords
    if (allText.toLowerCase().includes("fantasia")) theme = "fantasy";
    else if (allText.toLowerCase().includes("espaço")) theme = "space";
    else if (allText.toLowerCase().includes("oceano") || allText.toLowerCase().includes("mar")) theme = "ocean";
    else if (allText.toLowerCase().includes("dinossauro")) theme = "dinosaurs";
    
    // Check for setting keywords
    if (allText.toLowerCase().includes("castelo")) setting = "castle";
    else if (allText.toLowerCase().includes("espaço")) setting = "space";
    else if (allText.toLowerCase().includes("submarino") || allText.toLowerCase().includes("aquático")) setting = "underwater";
    else if (allText.toLowerCase().includes("dinossauro")) setting = "dinosaurland";
    
    // Check if this is a request for the final story
    const isFinalRequest = userInput.toLowerCase().includes("final") || 
                          userInput.toLowerCase().includes("completa") || 
                          userInput.toLowerCase().includes("gerar história");
    
    if (isFinalRequest) {
      // Generate a complete story with pages
      const storyData = await generateStory({
        childName,
        childAge,
        theme,
        setting,
        imageUrl: ""
      });
      
      let response = `TITULO: ${storyData.title}\n\n`;
      
      storyData.content.forEach((page, index) => {
        response += `PAGINA ${index + 1}: ${page}\n\n`;
      });
      
      return response;
    } else {
      // Generate a conversational response
      return `Olá! Estou feliz em ajudar a criar uma história especial para ${childName}! 
      
Vamos criar uma história de ${theme === 'adventure' ? 'Aventura' : 
  theme === 'fantasy' ? 'Fantasia' : 
  theme === 'space' ? 'Espaço' : 
  theme === 'ocean' ? 'Oceano' : 
  'Dinossauros'} em um cenário de ${
    setting === 'forest' ? 'Floresta Encantada' : 
    setting === 'castle' ? 'Castelo Mágico' : 
    setting === 'space' ? 'Espaço Sideral' : 
    setting === 'underwater' ? 'Mundo Submarino' : 
    'Terra dos Dinossauros'
  }.

Como você gostaria que a personalidade de ${childName} fosse representada na história? Por exemplo, ${childName} é corajoso(a), aventureiro(a), curioso(a) ou sonhador(a)?

Há algum personagem ou elemento específico que você gostaria de incluir na história? Como animais, magia, amigos especiais ou objetos mágicos?`;
    }
  };

  const generateImageDescription = async (storyParagraph: string, childName: string, childAge: string, theme: string, setting: string): Promise<string> => {
    try {
      // Set the OpenAI API key
      openai.apiKey = openaiApiKey;
      
      // Using GPT-4 to generate image descriptions
      const prompt = `Create a detailed description for a children's book illustration based on this paragraph:
      
"${storyParagraph}"

Additional context:
- Main character: ${childName}, age ${childAge}
- Theme: ${theme === 'adventure' ? 'Adventure' : 
  theme === 'fantasy' ? 'Fantasy and Magic' : 
  theme === 'space' ? 'Space Exploration' : 
  theme === 'ocean' ? 'Underwater World' : 
  'Dinosaurs and Prehistoric'}
- Setting: ${setting === 'forest' ? 'Enchanted Forest with tall colorful trees' : 
  setting === 'castle' ? 'Magical Castle with towers and enchanted halls' : 
  setting === 'space' ? 'Outer Space with planets, stars and nebulae' : 
  setting === 'underwater' ? 'Underwater World with vibrant corals and marine creatures' : 
  'Dinosaur Land with lush vegetation and volcanic elements'}

The description should be concise, vivid, and suitable for generating a children's book illustration.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert at creating descriptive prompts for AI image generation." },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 300,
      });

      return completion.choices[0].message.content || "Colorful children's book illustration of a magical scene";
    } catch (error) {
      console.error("Error generating image description:", error);
      toast.error("Erro ao gerar descrição da imagem. Usando descrição padrão.");
      return "Ilustração colorida de uma cena infantil mágica";
    }
  };

  const generateImage = async (
    description: string, 
    childName: string, 
    theme: string, 
    setting: string, 
    childImageBase64?: string | null
  ): Promise<string> => {
    try {
      console.log("Generating image with Leonardo AI");
      
      // Enhance the prompt for better results with Leonardo AI
      let enhancedPrompt = `Children's book illustration, ${description}, featuring ${childName} as the main character, 
        ${theme === 'adventure' ? 'adventure theme' : 
        theme === 'fantasy' ? 'fantasy magical theme' : 
        theme === 'space' ? 'space exploration theme' : 
        theme === 'ocean' ? 'underwater world theme' : 
        'dinosaur prehistoric theme'},
        ${setting === 'forest' ? 'enchanted forest setting with magical trees and glowing elements' : 
        setting === 'castle' ? 'magical castle setting with towers and fantasy elements' : 
        setting === 'space' ? 'space setting with colorful planets, stars and cosmic elements' : 
        setting === 'underwater' ? 'underwater setting with colorful coral reefs and sea creatures' : 
        'prehistoric landscape with friendly dinosaurs and volcanic elements'},
        vibrant colors, charming style, high quality children's book, digital illustration, safe for children, clear composition`;
      
      // Use Leonardo.AI API for image generation
      const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${leonardoApiKey}`
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          modelId: "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3", // Using Leonardo Creative model
          width: 1024,
          height: 1024,
          num_images: 1,
          promptMagic: true,
          public: false,
          sd_version: "v2",
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Leonardo AI error:", errorData);
        throw new Error(`Error with Leonardo AI: ${errorData.error || "Unknown error"}`);
      }

      const data = await response.json();
      const generationId = data.sdGenerationJob?.generationId;
      
      if (!generationId) {
        throw new Error("No generation ID returned from Leonardo AI");
      }
      
      // Poll for results
      let imageUrl = await pollForImageResults(generationId);
      return imageUrl;
    } catch (error) {
      console.error("Error generating image with Leonardo AI:", error);
      toast.error("Erro ao gerar imagem com Leonardo AI. Usando gerador alternativo.");
      
      // Fallback to the original image generation method
      return fallbackImageGeneration(description, childName, theme, setting, childImageBase64);
    }
  };

  const pollForImageResults = async (generationId: string): Promise<string> => {
    // Poll interval in milliseconds
    const pollInterval = 2000;
    // Maximum number of polling attempts
    const maxAttempts = 30;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Wait for the specified interval
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        // Check generation status
        const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${leonardoApiKey}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error checking generation status:", errorData);
          continue;
        }
        
        const data = await response.json();
        const status = data.sdGenerationJob?.status;
        
        if (status === "COMPLETE") {
          // Get the generated image URL
          const images = data.sdGenerationJob?.generated_images || [];
          if (images.length > 0) {
            return images[0].url;
          } else {
            throw new Error("No images found in completed generation");
          }
        } else if (status === "FAILED") {
          throw new Error("Generation failed on Leonardo AI");
        }
        
        // If not complete or failed, continue polling
        console.log(`Generation status: ${status}, attempt ${attempt + 1}/${maxAttempts}`);
      } catch (error) {
        console.error(`Error on polling attempt ${attempt + 1}:`, error);
        // Continue to next attempt even if this one failed
      }
    }
    
    // If we exit the loop without returning, throw an error
    throw new Error("Timed out waiting for image generation");
  };

  const fallbackImageGeneration = async (
    description: string, 
    childName: string, 
    theme: string, 
    setting: string, 
    childImageBase64?: string | null
  ): Promise<string> => {
    try {
      // Enhanced prompt for better character consistency, especially for later pages
      const pageNumber = description.length % 10; // Estimated page number based on text length
      const isLaterPage = pageNumber >= 6; // Pages 7-10
      
      // Prompt aprimorado para maior consistência de personagem e coerência com o texto
      let enhancedPrompt = `${description}, 
        highly detailed children's book illustration of ${childName} as the main character,
        ${isLaterPage ? 'IMPORTANT: maintain EXACT SAME character appearance as previous pages,' : ''}
        child character with IDENTICAL appearance across all illustrations,
        ${isLaterPage ? 'focus on facial features matching reference photo with high accuracy,' : ''}
        ${theme === 'adventure' ? 'adventure story' : 
        theme === 'fantasy' ? 'fantasy magical world' : 
        theme === 'space' ? 'space exploration' : 
        theme === 'ocean' ? 'underwater world' : 
        'dinosaur prehistoric world'}, 
        ${setting === 'forest' ? 'enchanted forest setting' : 
        setting === 'castle' ? 'magical castle setting' : 
        setting === 'space' ? 'space setting with planets and stars' : 
        setting === 'underwater' ? 'colorful underwater coral reef setting' : 
        'prehistoric landscape with lush vegetation and volcanoes'}, 
        professional children's book illustration, 
        Pixar/Disney style, 
        high quality, 
        detailed, 
        vibrant colors, 
        EXACT same character design in every image,
        maintain ABSOLUTE character consistency between images,
        same art style across all story pages,
        consistent character design throughout the story,
        child character with IDENTICAL appearance on every page,
        illustration that directly represents the story text,
        soft lighting, 
        clean composition, 
        digital art, 
        no text`;
      
      // Instruções específicas para manter as características faciais da foto da criança
      if (childImageBase64) {
        enhancedPrompt += `, child character with IDENTICAL facial features to the reference photo, 
        maintain child's recognizable facial structure with high accuracy,
        EXACT same character design across all images,
        consistent child character appearance throughout all pages,
        recognizable child character with identical design to reference,
        SAME facial features, expressions, and proportions as in reference photo`;
        
        // Add extra emphasis for later pages
        if (isLaterPage) {
          enhancedPrompt += `, CRITICAL: this is page ${pageNumber + 1}, character must be IDENTICAL to previous pages,
          HIGHEST priority on facial consistency with reference photo,
          close-up view of character face when possible,
          maintain EXACT same hair style, eye shape, and facial structure`;
        }
      }
      
      // Gerar seed consistente baseado no nome da criança e no texto da história
      // para manter coerência visual entre as imagens
      const generateConsistentSeed = (name: string, text: string): number => {
        let seed = 0;
        for (let i = 0; i < name.length; i++) {
          seed += name.charCodeAt(i);
        }
        
        // Adicionar uma porção do texto para diferenciar cada página
        // mas manter consistência no estilo
        const uniqueTextPart = text.slice(0, 10);
        for (let i = 0; i < uniqueTextPart.length; i++) {
          seed += uniqueTextPart.charCodeAt(i);
        }
        
        return seed * 1000; // Multiplicar para obter um número maior
      };
      
      const seed = generateConsistentSeed(childName, description);
      
      // Usando a API Pollinations para geração de imagem com seed consistente
      // Width e height maiores para melhor qualidade
      const apiUrl = childImageBase64 
        ? `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?seed=${seed}&width=1200&height=1200&nologo=1`
        : `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?seed=${seed}&width=1200&height=1200&nologo=1`;

      console.log("Fallback: Generating image with Pollinations using seed:", seed, "for page:", pageNumber + 1);
      
      const response = await fetch(apiUrl, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Erro ao gerar imagem: ${response.statusText}`);
      }

      // Converter a resposta para uma URL de blob
      const imageBlob = await response.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      
      return imageUrl;
    } catch (error) {
      console.error("Error with fallback image generation:", error);
      toast.error("Erro em todos os métodos de geração de imagem. Usando imagem padrão.");
      
      // Retornar uma URL de imagem placeholder
      return 'https://placehold.co/600x400/FFCAE9/FFF?text=StorySnap';
    }
  };

  const generateCoverImage = async (title: string, childName: string, theme: string, setting: string, childImageBase64?: string | null): Promise<string> => {
    try {
      console.log("Generating cover image with Leonardo AI");
      
      // Enhanced prompt specifically for book covers with Leonardo AI
      const coverPrompt = `Vibrant children's book cover illustration for "${title}", featuring ${childName} as the main character, 
        ${theme === 'adventure' ? 'adventure theme with exploration elements' : 
        theme === 'fantasy' ? 'fantasy magical theme with spells and wonders' : 
        theme === 'space' ? 'space exploration theme with planets and stars' : 
        theme === 'ocean' ? 'underwater adventure theme with sea creatures' : 
        'dinosaur prehistoric theme with friendly dinosaurs'},
        ${setting === 'forest' ? 'enchanted forest setting with magical trees' : 
        setting === 'castle' ? 'magical castle setting with towers and flags' : 
        setting === 'space' ? 'outer space setting with distant planets and nebulas' : 
        setting === 'underwater' ? 'underwater kingdom setting with coral reefs' : 
        'prehistoric landscape setting with lush vegetation and volcanoes'},
        portrait format, vertical composition, main character prominently featured, title space at top,
        professional children's book cover art, vibrant colors, eye-catching, digital art, highly detailed, no text,
        charming style, high quality illustration, clear composition, safe for children`;
      
      // Use Leonardo.AI API for cover image generation
      const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${leonardoApiKey}`
        },
        body: JSON.stringify({
          prompt: coverPrompt,
          modelId: "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3", // Using Leonardo Creative model
          width: 832,  // Portrait orientation for cover
          height: 1216,
          num_images: 1,
          promptMagic: true,
          public: false,
          sd_version: "v2",
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Leonardo AI error for cover:", errorData);
        throw new Error(`Error with Leonardo AI cover: ${errorData.error || "Unknown error"}`);
      }

      const data = await response.json();
      const generationId = data.sdGenerationJob?.generationId;
      
      if (!generationId) {
        throw new Error("No generation ID returned from Leonardo AI for cover");
      }
      
      // Poll for results
      let imageUrl = await pollForImageResults(generationId);
      return imageUrl;
    } catch (error) {
      console.error("Error generating cover image with Leonardo AI:", error);
      toast.error("Erro ao gerar imagem de capa com Leonardo AI. Usando gerador alternativo.");
      
      // Fallback to the original cover image generation method
      return fallbackCoverImageGeneration(title, childName, theme, setting, childImageBase64);
    }
  };

  const fallbackCoverImageGeneration = async (title: string, childName: string, theme: string, setting: string, childImageBase64?: string | null): Promise<string> => {
    try {
      // Gerar seed consistente baseado no nome da criança e título
      const generateConsistentSeed = (name: string, title: string): number => {
        let seed = 0;
        for (let i = 0; i < name.length; i++) {
          seed += name.charCodeAt(i);
        }
        
        // Adicionar o título para tornar a capa única mas relacionada
        for (let i = 0; i < title.length; i++) {
          seed += title.charCodeAt(i);
        }
        
        return seed * 1000 + 42; // Adicionar offset para a capa ser diferente, mas relacionada
      };
      
      const seed = generateConsistentSeed(childName, title);
      
      let coverPrompt = `Book cover illustration for a children's storybook titled "${title}" featuring ${childName} as the main character,
        main character with consistent appearance across all story illustrations,
        Theme: ${theme === 'adventure' ? 'adventure story with exploration' : 
        theme === 'fantasy' ? 'magical fantasy world with spells and wonders' : 
        theme === 'space' ? 'space exploration with planets and stars' : 
        theme === 'ocean' ? 'underwater adventure with sea creatures' : 
        'dinosaur prehistoric world with friendly dinosaurs'}.
        Setting: ${setting === 'forest' ? 'vibrant enchanted forest with magical trees' : 
        setting === 'castle' ? 'magnificent magical castle with towers and flags' : 
        setting === 'space' ? 'colorful space scene with distant planets and nebulas' : 
        setting === 'underwater' ? 'colorful underwater kingdom with coral reefs' : 
        'prehistoric landscape with lush vegetation and volcanoes'}.
        Portrait composition, central character prominently displayed, title space at top, 
        professional children's book cover art, 
        Pixar/Disney style, 
        vibrant colors, 
        dramatic lighting, 
        eye-catching, 
        high quality illustration, 
        digital art, 
        maintain character visual consistency with story pages,
        same art style as inside illustrations,
        highly detailed,
        no text`;
        
      // Instruções específicas para manter as características faciais da foto da criança
      if (childImageBase64) {
        coverPrompt += `, main character with facial features similar to the reference child photo, 
        maintain child's recognizable facial features,
        same character design as in story pages,
        consistent character appearance throughout the book`;
      }
      
      // Usando a API Pollinations para geração de imagem de capa com seed consistente
      // Usando proporções para capa de livro (mais alta que larga)
      const apiUrl = childImageBase64 
        ? `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt)}?seed=${seed}&width=1200&height=1600&nologo=1`
        : `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt)}?seed=${seed}&width=1200&height=1600&nologo=1`;
      
      console.log("Fallback: Generating cover image with Pollinations using seed:", seed);
      
      const response = await fetch(apiUrl, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Erro ao gerar imagem de capa: ${response.statusText}`);
      }

      // Converter a resposta para uma URL de blob
      const imageBlob = await response.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      
      return imageUrl;
    } catch (error) {
      console.error("Error with fallback cover image generation:", error);
      toast.error("Erro em todos os métodos de geração de capa. Usando imagem padrão.");
      
      // Retornar uma URL de imagem placeholder para capa
      return 'https://placehold.co/600x800/FFC0CB/FFF?text=StoryBook';
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject(new Error("Falha ao converter imagem para Base64"));
        }
      };
      reader.onerror = () => {
        reject(new Error("Erro ao ler o arquivo"));
      };
      reader.readAsDataURL(file);
    });
  };

  return {
    generateStoryBotResponse,
    generateImageDescription,
    generateImage,
    generateCoverImage,
    convertImageToBase64,
    hasApiKey: true, // Always true now since we're using the provided API keys or local fallback
  };
};
