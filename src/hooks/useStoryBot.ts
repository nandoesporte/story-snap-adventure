
import { useState } from "react";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export const useStoryBot = () => {
  // Using the provided API key
  const [apiKey] = useState<string>("AIzaSyBTgwFJ6x0Tc_wVHW5aC_teeHUAzQT4MBg");
  
  const generateStoryBotResponse = async (
    messageHistory: Message[],
    userInput: string
  ): Promise<string> => {
    try {
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
        throw new Error(`Erro na API do Gemini: ${errorData.error?.message || "Erro desconhecido"}`);
      }

      const data = await response.json();
      
      // Extract the response text
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui gerar uma resposta. Por favor, tente novamente.";
      
      return responseText;
    } catch (error) {
      console.error("Error in useStoryBot:", error);
      toast.error("Erro ao processar sua solicitação. Por favor, tente novamente mais tarde.");
      throw error;
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

  const generateImage = async (description: string, childName: string, theme: string, setting: string, childImageBase64?: string | null): Promise<string> => {
    try {
      // Prompt aprimorado com instruções mais detalhadas para gerar ilustrações com características faciais da criança
      let enhancedPrompt = `${description}, 
        ${childName} as the main character, 
        ${theme === 'adventure' ? 'adventure story' : 
        theme === 'fantasy' ? 'fantasy magical world' : 
        theme === 'space' ? 'space exploration' : 
        theme === 'ocean' ? 'underwater world' : 
        'dinosaur prehistoric world'}, 
        ${setting === 'forest' ? 'enchanted forest setting' : 
        setting === 'castle' ? 'magical castle setting' : 
        setting === 'space' ? 'space setting with planets and stars' : 
        setting === 'underwater' ? 'colorful underwater coral reef setting' : 
        'prehistoric landscape with volcanoes and dinosaurs'}, 
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
        no text`;
      
      // Se houver uma imagem da criança, adicione uma instrução para usar as características faciais
      if (childImageBase64) {
        enhancedPrompt += `, character with facial features similar to the reference child photo, maintain child's recognizable facial features`;
      }
      
      // Usando a Pollinations AI para geração de imagem
      const apiUrl = childImageBase64 
        ? `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?seed=&width=1024&height=1024&nologo=1`
        : `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}`;

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

  // Função aprimorada para gerar imagem de capa com características da criança
  const generateCoverImage = async (title: string, childName: string, theme: string, setting: string, childImageBase64?: string | null): Promise<string> => {
    try {
      let coverPrompt = `Book cover illustration for a children's storybook titled "${title}" featuring ${childName} as the main character.
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
        no text`;
        
      // Se houver uma imagem da criança, adicione instruções para usar as características faciais
      if (childImageBase64) {
        coverPrompt += `, main character with facial features similar to the reference child photo, maintain child's recognizable facial features`;
      }
      
      // Usando a Pollinations AI para geração de imagem de capa
      const apiUrl = childImageBase64 
        ? `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt)}?seed=&width=1024&height=1600&nologo=1`
        : `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt)}`;
      
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
    hasApiKey: true, // Always true now since we're using a hardcoded API key
  };
};
