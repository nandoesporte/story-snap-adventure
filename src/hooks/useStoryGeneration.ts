
import { useState } from 'react';
import { toast } from 'sonner';
import { StoryBot } from '@/services/StoryBot';
import { LeonardoAIAgent } from '@/services/LeonardoAIAgent';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  
  const storyBot = new StoryBot();
  const leonardoAgent = new LeonardoAIAgent();
  
  const updateProgress = (stage: string, percent: number) => {
    setCurrentStage(stage);
    setProgress(percent);
  };
  
  // Helper function to get Gemini API key
  const getGeminiApiKey = (): string => {
    return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  };

  // Function to generate image using Gemini API
  const generateImageWithGemini = async (prompt: string): Promise<string> => {
    try {
      const apiKey = getGeminiApiKey();
      
      if (!apiKey) {
        toast.error("Chave da API Gemini não encontrada. Configure-a nas configurações.");
        throw new Error("Gemini API key not found");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      // Full prompt for image generation with detailed style guidance
      const fullPrompt = `Por favor, crie uma ilustração de livro infantil detalhada para: ${prompt}
      Estilo: Ilustração colorida, amigável e adequada para crianças, em um estilo cartoon ou aquarela.
      Cores: Use cores vibrantes e atraentes para as crianças.
      Detalhes: A ilustração deve ser clara, com personagens expressivos e um cenário detalhado.
      Formato: Paisagem (horizontal) 16:9`;

      console.log("Generating image with Gemini prompt:", fullPrompt.substring(0, 100) + "...");

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      // Check if we got a response with parts
      const response = result.response;
      
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No image generation candidates returned");
      }

      // Find image part in response
      const candidate = response.candidates[0];
      if (!candidate.content || !candidate.content.parts) {
        throw new Error("No content parts in response");
      }

      // Extract image data
      let imageData = null;
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          imageData = part.inlineData.data; // This is the base64 image data
          break;
        }
      }

      if (!imageData) {
        console.warn("No image found in Gemini response, using placeholder");
        return "/placeholder.svg";
      }

      // Return the complete data URL for the image
      return `data:image/jpeg;base64,${imageData}`;
    } catch (error) {
      console.error("Error generating image with Gemini:", error);
      return "/placeholder.svg";
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
      
      // Passo 1: Gerar o conteúdo da história com prompts para ilustrações
      updateProgress("gerando narrativa", 10);
      const storyData = await storyBot.generateStoryWithPrompts(
        characterName,
        childAge,
        theme,
        setting,
        moralTheme,
        characterPrompt,
        length,
        readingLevel,
        language,
        storyContext
      );
      
      console.log("História gerada:", {
        titulo: storyData.title,
        paginas: storyData.content.length,
        promptsImagens: storyData.imagePrompts.length
      });
      
      // Passo 2: Gerar capa do livro usando Gemini
      updateProgress("criando capa", 30);
      const coverPrompt = `Capa de livro infantil para a história "${storyData.title}" sobre ${characterName} em uma aventura de ${theme} em ${setting}. ${characterPrompt}`;
      const coverImageUrl = await generateImageWithGemini(coverPrompt);
      
      // Passo 3: Gerar ilustrações para as páginas usando Gemini
      updateProgress(`gerando ilustrações (0/${storyData.content.length})`, 40);
      const pages: StoryPage[] = [];
      
      for (let i = 0; i < storyData.content.length; i++) {
        const pageText = storyData.content[i];
        const imagePrompt = storyData.imagePrompts[i] || `Ilustração para: ${pageText.substring(0, 150)}...`;
        
        updateProgress(`gerando ilustrações (${i+1}/${storyData.content.length})`, 40 + (50 * (i+1) / storyData.content.length));
        
        const imageUrl = await generateImageWithGemini(imagePrompt);
        
        console.log(`Página ${i+1}: Imagem gerada com tamanho ${imageUrl.length} caracteres`);
        
        pages.push({
          text: pageText,
          imageUrl: imageUrl
        });
      }
      
      // Passo 4: Montar o livro completo
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
