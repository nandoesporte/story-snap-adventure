
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { StoryBot } from "./StoryBot";
import { geminiAI } from "@/lib/openai";

// Types
export type StoryCharacter = {
  id?: string;
  name: string;
  description?: string;
  personality?: string;
  image_url?: string;
  generation_prompt?: string;
};

export type StoryTheme = 
  | "adventure" 
  | "fantasy" 
  | "space" 
  | "ocean" 
  | "dinosaurs";

export type StorySetting = 
  | "forest" 
  | "castle" 
  | "space" 
  | "underwater" 
  | "dinosaurland";

export type StoryStyle = 
  | "cartoon" 
  | "watercolor" 
  | "realistic" 
  | "childrenbook" 
  | "papercraft";

export type StoryLength = 
  | "short" 
  | "medium" 
  | "long";

export type ReadingLevel = 
  | "beginner" 
  | "intermediate" 
  | "advanced";

export type StoryLanguage = 
  | "portuguese" 
  | "english" 
  | "spanish";

export type StoryMoral = 
  | "friendship" 
  | "courage" 
  | "respect" 
  | "environment" 
  | "honesty" 
  | "perseverance";

export type StoryPage = {
  text: string;
  imageUrl: string;
  imagePrompt?: string;
};

export type StoryInputData = {
  childName: string;
  childAge: string;
  theme: StoryTheme;
  setting: StorySetting;
  characterId?: string;
  characterName?: string;
  characterDetails?: StoryCharacter;
  style?: StoryStyle;
  length?: StoryLength;
  imagePreview?: string | null;
  readingLevel?: ReadingLevel;
  language?: StoryLanguage;
  moral?: StoryMoral;
};

export type GeneratedStory = {
  title: string;
  content: string[];
};

export type CompleteStory = {
  title: string;
  coverImageUrl: string;
  childImage: string | null;
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  characterId?: string;
  characterName?: string;
  pages: StoryPage[];
};

// Mapping functions for UI display
export const getThemeName = (theme: StoryTheme): string => {
  const themeMap: Record<StoryTheme, string> = {
    adventure: "Aventura",
    fantasy: "Fantasia",
    space: "Espaço",
    ocean: "Oceano",
    dinosaurs: "Dinossauros"
  };
  return themeMap[theme] || theme;
};

export const getSettingName = (setting: StorySetting): string => {
  const settingMap: Record<StorySetting, string> = {
    forest: "Floresta Encantada",
    castle: "Castelo Mágico",
    space: "Espaço Sideral",
    underwater: "Mundo Submarino",
    dinosaurland: "Terra dos Dinossauros"
  };
  return settingMap[setting] || setting;
};

export const getStyleName = (style: StoryStyle): string => {
  const styleMap: Record<StoryStyle, string> = {
    cartoon: "Desenho Animado",
    watercolor: "Aquarela",
    realistic: "Realista",
    childrenbook: "Livro Infantil Clássico",
    papercraft: "Papel e Recortes"
  };
  return styleMap[style] || style;
};

export const getLengthName = (length: StoryLength): string => {
  const lengthMap: Record<StoryLength, string> = {
    short: "Curta (5 páginas)",
    medium: "Média (10 páginas)",
    long: "Longa (15 páginas)"
  };
  return lengthMap[length] || length;
};

export class BookGenerationService {
  private storyBot: StoryBot;
  private storyData: StoryInputData;
  private onProgressUpdate?: (stage: string, percent: number) => void;
  private onError?: (message: string) => void;
  private isCancelled: boolean = false;
  private customGeminiApiKey: string | null = null;

  constructor(
    storyData: StoryInputData, 
    onProgressUpdate?: (stage: string, percent: number) => void,
    onError?: (message: string) => void,
    customApiKey?: string | null
  ) {
    this.storyBot = new StoryBot();
    this.storyData = storyData;
    this.onProgressUpdate = onProgressUpdate;
    this.onError = onError;
    this.customGeminiApiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || null;
    
    // Store API key in localStorage if provided
    if (customApiKey) {
      localStorage.setItem('gemini_api_key', customApiKey);
    }
  }

  public cancel() {
    this.isCancelled = true;
  }

  private updateProgress(stage: string, percent: number) {
    if (this.isCancelled) return;
    if (this.onProgressUpdate) {
      this.onProgressUpdate(stage, percent);
    }
  }

  private handleError(message: string) {
    if (this.onError) {
      this.onError(message);
    }
    console.error(message);
  }

  public setGeminiApiKey(apiKey: string) {
    this.customGeminiApiKey = apiKey;
    localStorage.setItem('gemini_api_key', apiKey);
  }

  public static getGeminiApiKey(): string | null {
    return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || null;
  }

  public async fetchCharacterDetails(characterId: string): Promise<StoryCharacter | null> {
    try {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id", characterId)
        .single();
        
      if (error) {
        console.error("Error fetching character:", error);
        return null;
      }
      
      return data as StoryCharacter;
    } catch (error) {
      console.error("Error in character fetch:", error);
      return null;
    }
  }

  public async generateCompleteStory(): Promise<CompleteStory | null> {
    if (this.isCancelled) return null;
    
    try {
      this.updateProgress("preparando", 5);
      
      // Check for API key
      if (!this.customGeminiApiKey) {
        throw new Error("Chave da API Gemini não configurada. Configure a chave nas configurações.");
      }
      
      // Fetch character details if needed
      if (this.storyData.characterId && !this.storyData.characterDetails) {
        const characterDetails = await this.fetchCharacterDetails(this.storyData.characterId);
        if (characterDetails) {
          this.storyData.characterDetails = characterDetails;
          this.storyData.characterName = characterDetails.name;
        }
      }
      
      // Generate story content
      this.updateProgress("gerando-historia", 15);
      const storyContent = await this.generateStoryContent();
      if (!storyContent || this.isCancelled) return null;
      
      this.updateProgress("historia-gerada", 30);
      
      // Generate cover image
      this.updateProgress("gerando-capa", 40);
      const coverImageUrl = await this.generateCoverImage(storyContent.title);
      if (!coverImageUrl || this.isCancelled) return null;
      
      // Generate illustrations for each page
      this.updateProgress("gerando-ilustracoes", 50);
      const pagesWithImages = await this.generatePagesWithImages(storyContent.content);
      if (!pagesWithImages || this.isCancelled) return null;
      
      this.updateProgress("finalizando", 95);
      
      // Assemble the complete story
      const completeStory: CompleteStory = {
        title: storyContent.title,
        coverImageUrl,
        childImage: this.storyData.imagePreview,
        childName: this.storyData.childName,
        childAge: this.storyData.childAge,
        theme: this.storyData.theme,
        setting: this.storyData.setting,
        characterId: this.storyData.characterId,
        characterName: this.storyData.characterName,
        pages: pagesWithImages
      };
      
      // Save the story to Supabase
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        
        if (userId) {
          const { error } = await supabase.from('stories').insert({
            user_id: userId,
            title: completeStory.title,
            cover_image_url: completeStory.coverImageUrl,
            character_name: completeStory.childName,
            character_age: completeStory.childAge,
            theme: completeStory.theme,
            setting: completeStory.setting,
            style: this.storyData.style || 'cartoon',
            pages: completeStory.pages
          });
          
          if (error) {
            console.error("Error saving story to database:", error);
          } else {
            console.log("Story saved successfully to database");
          }
        }
      } catch (saveError) {
        console.error("Error attempting to save story:", saveError);
      }
      
      this.updateProgress("concluido", 100);
      console.log("Complete story generated with correct format for ViewStory component");
      return completeStory;
      
    } catch (error) {
      console.error("Error generating complete story:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao gerar a história. Por favor, tente novamente.";
      this.handleError(errorMessage);
      return null;
    }
  }

  public async generateStoryContent(): Promise<GeneratedStory | null> {
    try {
      const { theme, setting, childName, childAge, characterDetails, readingLevel, language, moral, length } = this.storyData;
      
      // Determine page count based on length
      const pageCount = length === "short" ? 5 : (length === "medium" ? 10 : 15);
      
      this.updateProgress("preparando-ia", 18);
      
      console.log("Generating story with Gemini AI...", {
        childName,
        childAge,
        theme,
        setting,
        characterName: characterDetails?.name,
        characterPrompt: characterDetails?.generation_prompt
      });
      
      try {
        // Create a new Gemini instance with custom API key
        const customGemini = new window.GoogleGenerativeAI(this.customGeminiApiKey || '');
        
        // Use Gemini AI for story generation
        const genModel = customGemini.getGenerativeModel({ 
          model: "gemini-1.0-pro",
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        });
        
        // Construct base prompt
        let prompt = `Crie uma história infantil para ${childName}, de ${childAge} anos de idade.
Tema: ${getThemeName(theme)}
Cenário: ${getSettingName(setting)}
Nível de leitura: ${readingLevel || "intermediate"}
Idioma: ${language || "portuguese"}
Moral da história: ${moral || "friendship"}
Número de páginas: ${pageCount}

`;

        // Add character information if available
        if (characterDetails) {
          prompt += `Personagem principal: ${characterDetails.name}
${characterDetails.description ? `Descrição: ${characterDetails.description}` : ''}
${characterDetails.personality ? `Personalidade: ${characterDetails.personality}` : ''}
${characterDetails.generation_prompt ? `\nInstruções adicionais: ${characterDetails.generation_prompt}` : ''}

`;
        }

        // Instructions for formatting
        prompt += `
Por favor, formate a história da seguinte maneira:
TITULO: [título da história]

PAGINA 1: [texto da primeira página]
PAGINA 2: [texto da segunda página]
...

Cada página deve ter aproximadamente 2-3 frases, adequadas para crianças de ${childAge} anos.
Certifique-se de incluir o nome da criança (${childName}) como protagonista da história.
Seja criativo, encantador e apropriado para a idade.`;

        console.log("Sending prompt to Gemini:", prompt);
        
        const result = await genModel.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();
        
        console.log("Received response from Gemini:", responseText);
        
        // Parse the response to extract title and content
        return this.parseStoryContent(responseText);
      } catch (error) {
        console.error("Error generating with Gemini:", error);
        
        if (this.isCancelled) return null;
        
        console.log("Falling back to local generator due to API error");
        toast.info("Usando gerador de histórias local devido a limitações da API.");
        return await this.storyBot.generateStoryFallback({
          childName,
          childAge,
          theme,
          setting,
          imageUrl: this.storyData.imagePreview,
          characterPrompt: characterDetails?.generation_prompt,
          readingLevel: readingLevel || "intermediate",
          language: language || "portuguese",
          moral: moral || "friendship",
          pageCount
        });
      }
    } catch (error) {
      console.error("Error generating story content:", error);
      this.handleError("Erro ao gerar conteúdo da história.");
      return null;
    }
  }

  private parseStoryContent(responseText: string): GeneratedStory {
    const titleMatch = responseText.match(/TITULO:?\s*(.*?)(?:\r?\n|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : `História de ${this.storyData.childName}`;
    
    // Extract pages using regex
    const pageMatches = responseText.match(/PAGINA\s*\d+:?\s*([\s\S]*?)(?=PAGINA\s*\d+:|$)/gi);
    
    let content: string[] = [];
    if (pageMatches && pageMatches.length > 0) {
      content = pageMatches.map(page => {
        return page.replace(/PAGINA\s*\d+:?\s*/i, '').trim();
      });
    } else {
      // Fallback parsing - split by paragraphs
      console.log("Couldn't parse pages, falling back to paragraph splitting");
      const paragraphs = responseText.split('\n\n').filter(para => 
        para.trim().length > 0 && !para.match(/TITULO:/i)
      );
      
      content = paragraphs;
    }
    
    // If we don't have enough pages for the story length, add some
    const pageCount = this.storyData.length === "short" ? 5 : (this.storyData.length === "medium" ? 10 : 15);
    while (content.length < pageCount) {
      content.push(`A aventura de ${this.storyData.childName} continua...`);
    }
    
    // Ensure we have at most the requested page count
    content = content.slice(0, pageCount);
    
    console.log("Parsed Story:", { title, pageCount: content.length });
    
    return { title, content };
  }

  private async generateCoverImage(title: string): Promise<string> {
    if (this.isCancelled) return "";
    
    try {
      const { theme, childName, setting, style, characterDetails, moral } = this.storyData;
      const childImage = this.storyData.imagePreview;
      const characterPrompt = characterDetails?.generation_prompt || null;
      
      // Generate image description for cover
      const coverDescription = await this.storyBot.generateImageDescription(
        `Capa do livro com título "${title}", mostrando ${childName} em uma aventura no cenário de ${getSettingName(setting)} com tema de ${getThemeName(theme)}.`,
        childName,
        this.storyData.childAge,
        theme,
        setting,
        this.storyData.moral || "friendship"
      );
      
      if (this.isCancelled) return "";
      
      // Generate cover image
      return await this.storyBot.generateImage(
        coverDescription,
        childName,
        theme,
        setting,
        childImage,
        style || "cartoon",
        characterPrompt
      );
    } catch (error) {
      console.error("Error generating cover image:", error);
      // Fall back to themed cover
      return `/images/covers/${this.storyData.theme}.jpg`;
    }
  }

  private async generatePagesWithImages(pageTexts: string[]): Promise<StoryPage[]> {
    if (this.isCancelled) return [];
    
    const pagesWithImages: StoryPage[] = [];
    const { theme, childName, setting, style, characterDetails, moral } = this.storyData;
    const childImage = this.storyData.imagePreview;
    const characterPrompt = characterDetails?.generation_prompt || null;
    
    for (let i = 0; i < pageTexts.length; i++) {
      if (this.isCancelled) break;
      
      const pageText = pageTexts[i];
      const progressPercent = 50 + Math.floor((i / pageTexts.length) * 45);
      this.updateProgress(`ilustracao-${i+1}`, progressPercent);
      
      try {
        // Generate image description
        const imageDescription = await this.storyBot.generateImageDescription(
          pageText + (this.storyData.characterName ? ` com o personagem ${this.storyData.characterName}` : ''),
          childName,
          this.storyData.childAge,
          theme,
          setting,
          this.storyData.moral || "friendship"
        );
        
        if (this.isCancelled) break;
        
        // Generate image based on description
        const imageUrl = await this.storyBot.generateImage(
          imageDescription,
          childName,
          theme,
          setting,
          childImage,
          style || "cartoon",
          characterPrompt
        );
        
        pagesWithImages.push({
          text: pageText,
          imageUrl,
          imagePrompt: imageDescription
        });
      } catch (error) {
        console.error(`Failed to generate image for page ${i+1}:`, error);
        
        if (this.isCancelled) break;
        
        // Use fallback image
        const fallbackUrl = `/images/placeholders/${theme}.jpg`;
        pagesWithImages.push({
          text: pageText,
          imageUrl: fallbackUrl
        });
      }
    }
    
    return pagesWithImages;
  }
}
