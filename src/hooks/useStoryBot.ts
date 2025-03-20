
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
      // Prompt aprimorado para gerar descrições de imagem mais detalhadas e coerentes com o texto
      const prompt = `Crie uma descrição detalhada para uma ilustração de livro infantil de alta qualidade que represente EXATAMENTE o conteúdo do seguinte parágrafo:

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
1. Descrever uma cena que ilustre EXATAMENTE o momento da história no parágrafo, mantendo total fidelidade ao texto
2. Incluir o personagem principal (${childName}) de forma clara e central na cena, com expressões que correspondam ao contexto emocional do texto
3. Descrever detalhes do ambiente e cenário que sejam coerentes com o texto e o tema da história
4. Mencionar cores, iluminação e composição que complementem a narrativa
5. Especificar o estilo artístico como "ilustração de livro infantil profissional, estilo Pixar/Disney, cores vibrantes, detalhado"
6. Ser concisa, focando apenas nos elementos essenciais descritos no texto
7. NÃO incluir elementos assustadores ou inapropriados para crianças

IMPORTANTE: Esta descrição será usada para gerar uma imagem que deve manter total coerência com o texto da história e consistência visual com outras imagens da mesma história.

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
            temperature: 0.6,
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
      console.log("Generating image with Gemini 2.0 Flash");
      
      // Enhanced prompt with improved character consistency instructions
      let enhancedPrompt = `Create a high-quality children's book illustration for this text: "${description}"

Character specifications:
- Main character is ${childName}, a child character who MUST remain VISUALLY CONSISTENT across all illustrations
- Character MUST have IDENTICAL facial features, hair style, clothing colors, and general appearance in every image
- ${childImageBase64 ? "The character's face MUST CLOSELY MATCH the facial features from the reference photo with high fidelity" : "Create a distinct, memorable character design that can be maintained consistently"}
- Pay special attention to the character's unique facial structure, eye shape, nose, mouth, and hair from the reference

Setting: ${setting === 'forest' ? 'vibrant enchanted forest with magical trees and soft glowing elements' : 
setting === 'castle' ? 'magical castle with grand architecture, towers, and magical elements' : 
setting === 'space' ? 'colorful space scene with planets, stars, and spaceships' : 
setting === 'underwater' ? 'vibrant underwater world with coral reefs and sea creatures' : 
'prehistoric landscape with friendly dinosaurs and lush vegetation'}

Style:
- Professional children's book illustration with vibrant colors
- Pixar/Disney style with soft lighting and clear composition
- Clean, detailed digital art with high production value
- Safe for children, no scary or inappropriate elements
- The character must be clearly visible and prominent in the scene

CRITICAL: This is page ${description.length % 7 + 1} of the story, maintaining ABSOLUTE character consistency with previous illustrations is essential - same face, same hair, same general appearance. The child character MUST look like the SAME PERSON in every illustration, with the same facial features as in the reference photo.`;
      
      // Increase model weights for character consistency
      const tempValue = description.length % 7 >= 6 ? 0.2 : 0.4; // Lower temperature for later pages
      
      // Use Gemini 2.0 Flash model specifically for image generation
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { 
                  text: enhancedPrompt 
                },
                ...(childImageBase64 ? [{
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: childImageBase64.split(',')[1] // Remove the data:image/jpeg;base64, part
                  }
                }] : [])
              ]
            }
          ],
          generationConfig: {
            temperature: tempValue, // Lower temperature for more consistency
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API error for image generation:", errorData);
        
        // Fallback to the original image generation if Gemini image generation fails
        toast.error("Falha na geração de imagem com Gemini. Usando gerador alternativo.");
        return fallbackImageGeneration(description, childName, theme, setting, childImageBase64);
      }

      const data = await response.json();
      
      // Check if we have image data in the response
      if (data.candidates && 
          data.candidates[0]?.content?.parts && 
          data.candidates[0].content.parts.some(part => part.inlineData)) {
        
        // Extract the image data
        const imagePart = data.candidates[0].content.parts.find(part => part.inlineData);
        if (imagePart && imagePart.inlineData) {
          const base64Data = imagePart.inlineData.data;
          const mimeType = imagePart.inlineData.mimeType;
          
          // Create a data URL
          const imageUrl = `data:${mimeType};base64,${base64Data}`;
          return imageUrl;
        }
      }
      
      // If we couldn't find image data in the response, fall back to alternative method
      console.log("No image data found in Gemini response, using fallback method");
      return fallbackImageGeneration(description, childName, theme, setting, childImageBase64);
    } catch (error) {
      console.error("Error generating image with Gemini:", error);
      toast.error("Erro ao gerar imagem com Gemini. Usando gerador alternativo.");
      
      // Fallback to the original image generation method
      return fallbackImageGeneration(description, childName, theme, setting, childImageBase64);
    }
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
      console.log("Generating cover image with Gemini 2.0 Flash");
      
      // Enhanced prompt specifically for book covers
      const coverPrompt = `Create a high-quality children's book COVER illustration for a story titled "${title}" featuring ${childName} as the main character.

Character specifications:
- ${childName} should be prominently featured as the main character
- Character should have the same facial features and appearance as in the story illustrations
- ${childImageBase64 ? "The character should resemble the facial features from the reference photo" : "Create a distinct, memorable character design"}

Setting: ${setting === 'forest' ? 'vibrant enchanted forest with magical trees and glowing elements' : 
setting === 'castle' ? 'magnificent magical castle with towers and fantasy elements' : 
setting === 'space' ? 'colorful space scene with planets, stars, and cosmic elements' : 
setting === 'underwater' ? 'colorful underwater kingdom with coral reefs and sea life' : 
'prehistoric landscape with friendly dinosaurs and volcanic elements in the background'}

Style:
- Professional children's book COVER art with vibrant colors
- Portrait/vertical composition with the main character prominently featured
- Leave space at the top for the title (but don't include text)
- Pixar/Disney style with dramatic lighting and eye-catching elements
- Clean, detailed digital art with high production value
- Safe for children, no scary or inappropriate elements

This is for a BOOK COVER, so make it visually striking and attention-grabbing while matching the art style of the interior pages.`;

      // Use Gemini 2.0 Flash model specifically for image generation
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { 
                  text: coverPrompt 
                },
                ...(childImageBase64 ? [{
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: childImageBase64.split(',')[1] // Remove the data:image/jpeg;base64, part
                  }
                }] : [])
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API error for cover image generation:", errorData);
        
        // Fallback to the original cover image generation if Gemini image generation fails
        toast.error("Falha na geração de capa com Gemini. Usando gerador alternativo.");
        return fallbackCoverImageGeneration(title, childName, theme, setting, childImageBase64);
      }

      const data = await response.json();
      
      // Check if we have image data in the response
      if (data.candidates && 
          data.candidates[0]?.content?.parts && 
          data.candidates[0].content.parts.some(part => part.inlineData)) {
        
        // Extract the image data
        const imagePart = data.candidates[0].content.parts.find(part => part.inlineData);
        if (imagePart && imagePart.inlineData) {
          const base64Data = imagePart.inlineData.data;
          const mimeType = imagePart.inlineData.mimeType;
          
          // Create a data URL
          const imageUrl = `data:${mimeType};base64,${base64Data}`;
          return imageUrl;
        }
      }
      
      // If we couldn't find image data in the response, fall back to alternative method
      console.log("No image data found in Gemini response for cover, using fallback method");
      return fallbackCoverImageGeneration(title, childName, theme, setting, childImageBase64);
    } catch (error) {
      console.error("Error generating cover image with Gemini:", error);
      toast.error("Erro ao gerar imagem de capa com Gemini. Usando gerador alternativo.");
      
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
    hasApiKey: true, // Always true now since we're using a hardcoded API key or local fallback
  };
};
