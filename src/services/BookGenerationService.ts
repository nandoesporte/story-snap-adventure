
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { StoryBot } from "./StoryBot";

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

  constructor(
    storyData: StoryInputData, 
    onProgressUpdate?: (stage: string, percent: number) => void,
    onError?: (message: string) => void
  ) {
    this.storyBot = new StoryBot();
    this.storyData = storyData;
    this.onProgressUpdate = onProgressUpdate;
    this.onError = onError;
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
      
      this.updateProgress("concluido", 100);
      return completeStory;
      
    } catch (error) {
      console.error("Error generating complete story:", error);
      this.handleError("Ocorreu um erro ao gerar a história. Por favor, tente novamente.");
      return null;
    }
  }

  private async generateStoryContent(): Promise<GeneratedStory | null> {
    try {
      const { theme, setting, childName, childAge, characterDetails, readingLevel, language, moral, length } = this.storyData;
      
      // Determine page count based on length
      const pageCount = length === "short" ? 5 : (length === "medium" ? 10 : 15);
      
      // Generate story using StoryBot
      const storyParams = {
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
      };
      
      // Try to use the AI-powered generator first
      try {
        return await this.storyBot.generateStory(storyParams);
      } catch (error) {
        console.log("Failed with AI generator, using fallback generator", error);
        
        if (this.isCancelled) return null;
        
        // Fallback to local generator if AI fails
        toast.info("Usando gerador de histórias local devido a limitações da API.");
        return await this.storyBot.generateStoryFallback(storyParams);
      }
    } catch (error) {
      console.error("Error generating story content:", error);
      this.handleError("Erro ao gerar conteúdo da história.");
      return null;
    }
  }

  private async generateCoverImage(title: string): Promise<string> {
    if (this.isCancelled) return "";
    
    try {
      const { theme, childName, setting, style, characterDetails } = this.storyData;
      const childImage = this.storyData.imagePreview;
      const characterPrompt = characterDetails?.generation_prompt || null;
      
      // Generate image description for cover
      const coverDescription = await this.storyBot.generateImageDescription(
        `Capa do livro com título "${title}", mostrando ${childName} em uma aventura no cenário de ${getSettingName(setting)} com tema de ${getThemeName(theme)}.`,
        childName,
        this.storyData.childAge,
        theme,
        setting,
        moral || "friendship"
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
    const { theme, childName, setting, style, characterDetails } = this.storyData;
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
          moral || "friendship"
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
