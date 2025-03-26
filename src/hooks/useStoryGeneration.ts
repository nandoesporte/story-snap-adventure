
import { useState } from 'react';
import { toast } from 'sonner';
import OpenAI from 'openai';

export type StoryPage = {
  text: string;
  imageUrl: string;
};

export type CompleteBook = {
  title: string;
  coverImageUrl: string;
  pages: StoryPage[];
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  characterPrompt?: string;
};

export const useStoryGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>('preparando');
  
  const updateProgress = (stage: string, percent: number) => {
    setCurrentStage(stage);
    setProgress(percent);
  };
  
  // Helper function to get OpenAI API key
  const getOpenAIApiKey = (): string => {
    return localStorage.getItem('openai_api_key') || '';
  };

  // Function to generate image using OpenAI DALL-E 3
  const generateImageWithOpenAI = async (prompt: string): Promise<string> => {
    try {
      const apiKey = getOpenAIApiKey();
      
      if (!apiKey) {
        toast.error("Chave da API OpenAI não encontrada. Configure-a nas configurações.");
        throw new Error("OpenAI API key not found");
      }

      const openai = new OpenAI({ 
        apiKey,
        dangerouslyAllowBrowser: true
      });

      // Full prompt for image generation with detailed style guidance
      const fullPrompt = `Crie uma ilustração de livro infantil para: ${prompt}
      Estilo: Ilustração colorida, amigável e adequada para crianças, em um estilo cartoon.
      Cores: Use cores vibrantes e atraentes para as crianças.
      Detalhes: A ilustração deve ser clara, com personagens expressivos e um cenário detalhado.`;

      console.log("Gerando imagem com OpenAI prompt:", fullPrompt.substring(0, 100) + "...");

      const result = await openai.images.generate({
        model: "dall-e-3",
        prompt: fullPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json"
      });

      if (!result.data[0].b64_json) {
        throw new Error("No image data returned from OpenAI");
      }

      // Return the complete data URL for the image
      return `data:image/png;base64,${result.data[0].b64_json}`;
    } catch (error) {
      console.error("Error generating image with OpenAI:", error);
      toast.error("Não foi possível gerar a imagem. Usando placeholder.");
      return "/placeholder.svg";
    }
  };
  
  const generateStoryWithGPT4 = async (
    prompt: string,
    language: string = "portuguese"
  ): Promise<{ title: string; content: string[]; imagePrompts: string[] }> => {
    try {
      const apiKey = getOpenAIApiKey();
      
      if (!apiKey) {
        toast.error("Chave da API OpenAI não encontrada. Configure-a nas configurações.");
        throw new Error("OpenAI API key not found");
      }

      const openai = new OpenAI({ 
        apiKey,
        dangerouslyAllowBrowser: true
      });

      console.log("Gerando história com OpenAI GPT-4 usando prompt:", prompt.substring(0, 100) + "...");
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Você é um escritor de literatura infantil especialista. Crie histórias envolventes e adequadas para crianças com as seguintes regras:
            
            1. Limite a história a 5-8 páginas de conteúdo
            2. Crie um título criativo e relacionado à história
            3. Para cada página, forneça também um prompt de ilustração detalhado
            4. Histórias devem ser apropriadas para crianças e ter uma lição
            5. Use linguagem simples mas envolvente
            6. Escreva no idioma ${language}
            7. Formato de resposta: 
               TÍTULO: [título da história]
               
               PÁGINA 1: [texto da página 1]
               PROMPT_IMAGEM_1: [descrição para ilustração da página 1]
               
               PÁGINA 2: [texto da página 2]
               PROMPT_IMAGEM_2: [descrição para ilustração da página 2]
               
               (e assim por diante)`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3500
      });
      
      const storyText = response.choices[0]?.message?.content || "";
      
      if (!storyText) {
        throw new Error("Resposta vazia da API OpenAI");
      }
      
      // Parse the response
      const titleMatch = storyText.match(/TÍTULO:\s*(.*?)(?:\n|$)/);
      const title = titleMatch ? titleMatch[1].trim() : "História Infantil";
      
      const pageRegex = /PÁGINA\s+(\d+):\s*([\s\S]*?)(?=PROMPT_IMAGEM_\d+:|PÁGINA\s+\d+:|$)/g;
      const promptRegex = /PROMPT_IMAGEM_\d+:\s*([\s\S]*?)(?=PÁGINA\s+\d+:|PROMPT_IMAGEM_\d+:|$)/g;
      
      const pageContents: string[] = [];
      const imagePrompts: string[] = [];
      
      let pageMatch;
      while ((pageMatch = pageRegex.exec(storyText)) !== null) {
        pageContents.push(pageMatch[2].trim());
      }
      
      let promptMatch;
      while ((promptMatch = promptRegex.exec(storyText)) !== null) {
        imagePrompts.push(promptMatch[1].trim());
      }
      
      return {
        title,
        content: pageContents,
        imagePrompts
      };
    } catch (error) {
      console.error("Error generating story with GPT-4:", error);
      throw new Error("Falha ao gerar história com GPT-4. Verifique sua chave de API.");
    }
  };
  
  const generateCompleteStory = async (
    characterName: string,
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string = "",
    characterPrompt: string = "",
    length: string = "medium",
    readingLevel: string = "intermediate",
    language: string = "portuguese",
    childImageBase64: string | null = null,
    style: string = "cartoon",
    storyContext: string = ""
  ): Promise<CompleteBook> => {
    try {
      setIsGenerating(true);
      
      // Passo 1: Criar o prompt principal para a história
      updateProgress("preparando", 5);
      
      let storyPrompt = `Crie uma história infantil para ${characterName}, uma criança de ${childAge} anos.`;
      storyPrompt += `\nTema: ${theme}`;
      storyPrompt += `\nAmbientação: ${setting}`;
      
      if (moralTheme) {
        storyPrompt += `\nLição moral: ${moralTheme}`;
      }
      
      if (characterPrompt) {
        storyPrompt += `\nDetalhes do personagem: ${characterPrompt}`;
      }
      
      storyPrompt += `\nNível de leitura: ${readingLevel}`;
      storyPrompt += `\nComprimento: ${length}`;
      
      if (storyContext) {
        storyPrompt += `\nContexto adicional: ${storyContext}`;
      }
      
      // Passo 2: Gerar história com GPT-4
      updateProgress("gerando narrativa", 20);
      
      console.log("Gerando história com os parâmetros:", {
        characterName,
        childAge,
        theme,
        setting,
        moralTheme,
        hasCharacterPrompt: !!characterPrompt,
        length,
        readingLevel,
        language
      });
      
      const storyData = await generateStoryWithGPT4(storyPrompt, language);
      
      console.log("História gerada com GPT-4:", {
        titulo: storyData.title,
        paginas: storyData.content.length,
        promptsImagens: storyData.imagePrompts.length
      });
      
      // Passo 3: Gerar capa do livro usando OpenAI DALL-E
      updateProgress("criando capa", 30);
      const coverPrompt = `Capa de livro infantil para a história "${storyData.title}" sobre ${characterName} em uma aventura de ${theme} em ${setting}. ${characterPrompt}`;
      
      console.log("Gerando capa com prompt:", coverPrompt);
      const coverImageUrl = await generateImageWithOpenAI(coverPrompt);
      
      if (!coverImageUrl || coverImageUrl === "/placeholder.svg") {
        console.warn("Falha ao gerar a capa. Usando placeholder.");
      } else {
        console.log("Capa gerada com sucesso. Tamanho do data URL:", coverImageUrl.length);
      }
      
      // Passo 4: Gerar ilustrações para as páginas usando OpenAI DALL-E
      updateProgress(`gerando ilustrações (0/${storyData.content.length})`, 40);
      const pages: StoryPage[] = [];
      
      for (let i = 0; i < storyData.content.length; i++) {
        const pageText = storyData.content[i];
        const imagePrompt = storyData.imagePrompts[i] || 
          `Ilustração para a história infantil: ${pageText.substring(0, 150)}...`;
        
        updateProgress(`gerando ilustrações (${i+1}/${storyData.content.length})`, 
          40 + (50 * (i+1) / storyData.content.length));
        
        console.log(`Gerando ilustração para página ${i+1} com prompt:`, 
          imagePrompt.substring(0, 100) + "...");
          
        const imageUrl = await generateImageWithOpenAI(imagePrompt);
        
        if (!imageUrl || imageUrl === "/placeholder.svg") {
          console.warn(`Falha ao gerar ilustração para página ${i+1}. Usando placeholder.`);
        } else {
          console.log(`Ilustração gerada com sucesso para página ${i+1}. Tamanho:`, 
            imageUrl.length);
        }
        
        pages.push({
          text: pageText,
          imageUrl: imageUrl
        });
      }
      
      // Passo 5: Montar o livro completo
      updateProgress("finalizando", 95);
      
      const completeBook: CompleteBook = {
        title: storyData.title,
        coverImageUrl,
        childName: characterName,
        childAge,
        theme,
        setting,
        characterPrompt,
        pages
      };
      
      // Log para debug
      console.log("Livro completo gerado:", {
        titulo: completeBook.title,
        capa: completeBook.coverImageUrl.substring(0, 50) + "...",
        paginas: completeBook.pages.length,
        primeiraPagina: {
          texto: completeBook.pages[0]?.text.substring(0, 50) + "...",
          imagem: completeBook.pages[0]?.imageUrl.substring(0, 50) + "..."
        }
      });
      
      updateProgress("concluído", 100);
      toast.success("História gerada com sucesso!");
      
      return completeBook;
    } catch (error) {
      console.error("Erro ao gerar história completa:", error);
      toast.error("Erro ao gerar a história completa. Por favor, tente novamente.");
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateCompleteStory,
    isGenerating,
    progress,
    currentStage,
    updateProgress
  };
};
