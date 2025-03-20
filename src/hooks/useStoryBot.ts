import { useState } from "react";
import { toast } from "sonner";
import { generateStory } from "../utils/storyGenerator";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export const useStoryBot = () => {
  // Using the provided API key
  const [apiKey] = useState<string>("AIzaSyBTgwFJ6x0Tc_wVHW5aC_teeHUAzQT4MBg");
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
      
      // Prepare the prompt for the Gemini API
      const systemInstructions = `Você é um assistente virtual especializado em criar histórias infantis personalizadas. Seu nome é StoryBot. Sua função é ajudar pais e crianças a criarem histórias únicas e divertidas, com base nas preferências fornecidas. 
      
Cumprimente o usuário de forma amigável. Pergunte o nome da criança e o tema da história que desejam criar. Ofereça sugestões de temas, como 'aventura na floresta', 'viagem ao espaço', 'reino mágico', etc.

Pergunte sobre características da criança (ex: corajosa, curiosa, brincalhona). Pergunte se há algum elemento específico que deva ser incluído na história (ex: animais, magia, amigos). Pergunte se o usuário deseja que a história tenha uma moral ou lição específica.

Crie uma história curta, envolvente e adequada para crianças de 4 a 8 anos. Use o nome da criança como personagem principal. Inclua diálogos engraçados e cenas emocionantes. Adicione uma moral ou lição no final, se solicitado.

Quando for gerar a história final, divida-a em 10 páginas, usando marcadores como "PAGINA 1:", "PAGINA 2:", etc. Cada página deve conter apenas um parágrafo curto de texto que caberá bem em uma página de livro infantil.

Responda apenas com o conteúdo da história, sem incluir instruções ou descrições para geração de imagens.

Use um tom amigável, divertido e encorajador. Mantenha a linguagem simples e acessível para crianças.`;

      // Prepare history for Gemini
      let messages = [];
      
      // Add a user message with system instructions first
      messages.push({
        role: "user",
        parts: [{ text: systemInstructions }]
      });
      
      // Add an assistant response confirming instructions
      messages.push({
        role: "assistant",
        parts: [{ text: "Entendido, vou ajudar com histórias infantis!" }]
      });
      
      // Add the conversation history
      for (const msg of messageHistory) {
        messages.push({
          role: msg.role,
          parts: [{ text: msg.content }]
        });
      }
      
      // Add current user input
      messages.push({
        role: "user",
        parts: [{ text: userInput }]
      });

      // Make the API call to Gemini
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API error:", errorData);
        
        // If we hit a quota limit, switch to local generator for future requests
        if (errorData.error?.code === 429) {
          setUseLocalGenerator(true);
          toast.warning("Limite de API excedido, usando gerador local para histórias.");
          return generateLocalResponse(messageHistory, userInput);
        }
        
        throw new Error(`Erro na API do Gemini: ${errorData.error?.message || "Erro desconhecido"}`);
      }

      const data = await response.json();
      
      // Extract the response text
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui gerar uma resposta. Por favor, tente novamente.";
      
      return responseText;
    } catch (error) {
      console.error("Error in useStoryBot:", error);
      
      // If any error occurs, try the local generator
      setUseLocalGenerator(true);
      toast.warning("Usando gerador local de histórias devido a um erro na API.");
      return generateLocalResponse(messageHistory, userInput);
    }
  };

  // Local response generator that doesn't rely on external APIs
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

Há algum personagem ou elemento especial que você gostaria de incluir na história? Como animais, magia, amigos especiais ou objetos mágicos?`;
    }
  };

  const generateImageDescription = async (storyParagraph: string, childName: string, childAge: string, theme: string, setting: string): Promise<string> => {
    try {
      // Prompt aprimorado para gerar descrições de imagem mais detalhadas e coerentes
      const prompt = `Crie uma descrição detalhada para uma ilustração de livro infantil de alta qualidade baseada no seguinte parágrafo:

"${storyParagraph}"

Contexto adicional para a história:
- Personagem principal: ${childName}, uma criança de ${childAge}
- Tema da história: ${theme === 'adventure' ? 'Aventura' : 
  theme === 'fantasy' ? 'Fantasia e Magia' : 
  theme === 'space' ? 'Exploração Espacial' : 
  theme === 'ocean' ? 'Mundo Submarino' : 
  theme === 'ocean' ? 'Mundo Submarino' : 
  'Dinossauros e Pré-história'}
- Cenário: ${setting === 'forest' ? 'Floresta Encantada com árvores altas e coloridas' : 
  setting === 'castle' ? 'Castelo Mágico com torres e salões encantados' : 
  setting === 'space' ? 'Espaço Sideral com planetas, estrelas e nebulosas' : 
  setting === 'underwater' ? 'Mundo Submarino com corais vibrantes e criaturas marinhas' : 
  'Terra dos Dinossauros com vegetação exuberante e vulcões ao fundo'}

A descrição deve:
1. Descrever uma cena clara e vibrante que ilustre exatamente o momento da história no parágrafo
2. Incluir o personagem principal (${childName}) com aparência e expressões específicas
3. Descrever detalhes do ambiente e cenário coerentes com o tema da história
4. Mencionar cores, iluminação, perspectiva e composição para criar uma imagem atraente
5. Especificar o estilo artístico como "ilustração de livro infantil profissional, estilo Pixar/Disney, cores vibrantes, detalhado, cativante"
6. Ter no máximo 150 palavras e focar apenas nos elementos mais importantes
7. NÃO incluir elementos assustadores ou inapropriados para crianças

Responda apenas com a descrição para a ilustração, sem comentários adicionais.`;

      // Make the API call to Gemini
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 300,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API error for image description:", errorData);
        throw new Error(`Erro na API do Gemini: ${errorData.error?.message || "Erro desconhecido"}`);
      }

      const data = await response.json();
      
      // Extract the image description
      const imageDescription = data.candidates?.[0]?.content?.parts?.[0]?.text || "Ilustração colorida de uma cena infantil mágica";
      
      return imageDescription;
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
      // Prompt aprimorado com instruções mais detalhadas para manter consistência do personagem
      let enhancedPrompt = `${description}, 
        ${childName} as the main character with consistent appearance across all images, 
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
        storytelling scene, 
        wholesome, 
        expressive characters, 
        soft lighting, 
        clean composition, 
        digital art, 
        maintain character visual consistency throughout the story,
        same character style in every image,
        no text`;
      
      // Adicionar instruções específicas para manter as características faciais consistentes
      if (childImageBase64) {
        enhancedPrompt += `, character with consistent facial features similar to the reference child photo, 
        maintain child's recognizable facial features in all illustrations,
        same character design across all images,
        consistent child character appearance`;
      }
      
      // Preparar um seed consistente baseado no nome da criança para manter coerência visual
      // O mesmo seed gerará imagens com estilo similar
      const generateConsistentSeed = (name: string): number => {
        let seed = 0;
        for (let i = 0; i < name.length; i++) {
          seed += name.charCodeAt(i);
        }
        return seed * 1000; // Multiplicar para obter um número maior
      };
      
      const seed = generateConsistentSeed(childName);
      
      // Usando a Pollinations AI para geração de imagem com seed consistente
      const apiUrl = childImageBase64 
        ? `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?seed=${seed}&width=1024&height=1024&nologo=1`
        : `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?seed=${seed}`;

      console.log("Generating image with seed:", seed);
      
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
      console.error("Error generating image:", error);
      toast.error("Erro ao gerar imagem. Usando imagem padrão.");
      
      // Retornar uma URL de imagem placeholder
      return 'https://placehold.co/600x400/FFCAE9/FFF?text=StorySnap';
    }
  };

  // Função aprimorada para gerar imagem de capa com características consistentes
  const generateCoverImage = async (title: string, childName: string, theme: string, setting: string, childImageBase64?: string | null): Promise<string> => {
    try {
      // Gerar seed consistente baseado no nome da criança
      const generateConsistentSeed = (name: string): number => {
        let seed = 0;
        for (let i = 0; i < name.length; i++) {
          seed += name.charCodeAt(i);
        }
        return seed * 1000 + 42; // Adicionar offset para a capa ser diferente, mas relacionada
      };
      
      const seed = generateConsistentSeed(childName);
      
      let coverPrompt = `Book cover illustration for a children's storybook titled "${title}" featuring ${childName} as the main character with consistent appearance.
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
        maintain character visual consistency,
        no text`;
        
      // Se houver uma imagem da criança, adicione instruções para manter as características faciais consistentes
      if (childImageBase64) {
        coverPrompt += `, main character with consistent facial features similar to the reference child photo, 
        maintain child's recognizable facial features,
        same character design as in story pages`;
      }
      
      // Usando a Pollinations AI para geração de imagem de capa com seed consistente
      const apiUrl = childImageBase64 
        ? `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt)}?seed=${seed}&width=1024&height=1600&nologo=1`
        : `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt)}?seed=${seed}`;
      
      console.log("Generating cover image with seed:", seed);
      
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
      console.error("Error generating cover image:", error);
      toast.error("Erro ao gerar imagem de capa. Usando imagem padrão.");
      
      // Retornar uma URL de imagem placeholder para capa
      return 'https://placehold.co/600x800/FFC0CB/FFF?text=StoryBook';
    }
  };

  // Função para converter a imagem da criança para Base64
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
    hasApiKey: true, // Always true now since we're using a hardcoded API key or local fallback
  };
};
