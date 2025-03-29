
import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from "openai";
import { supabase } from '@/lib/supabase';
import { getPlaceholderImageUrl } from '@/lib/imageHelper';

export type StoryStyle = 'papercraft' | 'cartoon' | 'watercolor' | '3d' | 'pixel';

export interface StoryInputData {
  childName: string;
  characterName: string;
  characterAge: string;
  theme: string;
  setting: string;
  style: StoryStyle;
  characterPrompt?: string;
  voiceType?: 'male' | 'female';
}

export interface GeneratedStory {
  title: string;
  content: string[];
}

export interface CompleteStory {
  id?: string;
  title: string;
  childName: string;
  characterName: string;
  characterAge: string;
  theme: string;
  setting: string;
  style: StoryStyle;
  characterPrompt?: string;
  coverImageUrl?: string;
  pages: { text: string; imageUrl: string; }[];
  voiceType?: 'male' | 'female';
}

export class BookGenerationService {
  private storyData: StoryInputData;
  private updateProgress: (stage: string, percent: number) => void;
  private handleError: (message: string) => void;
  private openai: OpenAI | null = null;
  private cancelFlag: boolean = false;
  
  constructor(
    storyData: StoryInputData,
    updateProgress: (stage: string, percent: number) => void,
    handleError: (message: string) => void
  ) {
    this.storyData = storyData;
    this.updateProgress = updateProgress;
    this.handleError = handleError;
    
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey
      });
    } else {
      console.warn("OpenAI API key not found. Using fallback story generator.");
    }
  }
  
  cancel() {
    this.cancelFlag = true;
  }
  
  // Static methods for TestModeManager
  static generateFallbackStory(data: any): CompleteStory {
    return {
      title: data.title || `A ${data.style} Adventure`,
      childName: data.character_name || "Child",
      characterName: data.character_name || "Character",
      characterAge: data.character_age || "7",
      theme: data.theme || "adventure",
      setting: data.setting || "magical forest",
      style: data.style as StoryStyle || "papercraft",
      pages: [
        {
          text: `Once upon a time, ${data.character_name} went on an adventure in a ${data.setting}.`,
          imageUrl: getPlaceholderImageUrl(data.theme)
        },
        {
          text: `${data.character_name} discovered many wonders and made new friends.`,
          imageUrl: getPlaceholderImageUrl(data.theme)
        },
        {
          text: `After a day of excitement, ${data.character_name} returned home with amazing stories to tell.`,
          imageUrl: getPlaceholderImageUrl(data.theme)
        }
      ],
      voiceType: data.voice_type || 'female'
    };
  }
  
  static async saveStoryToDatabase(storyData: Record<string, any>): Promise<any> {
    try {
      // Ensure required fields are present
      if (!storyData.title || !storyData.character_name) {
        throw new Error("Missing required fields: title and character_name");
      }
      
      // Use proper typing for the database insert
      const { data, error } = await supabase
        .from('stories')
        .insert({
          title: storyData.title,
          character_name: storyData.character_name,
          character_age: storyData.character_age || null,
          character_prompt: storyData.character_prompt || null,
          cover_image_url: storyData.cover_image_url || null,
          setting: storyData.setting || null,
          theme: storyData.theme || null,
          style: storyData.style || null,
          pages: storyData.pages || [],
          user_id: storyData.user_id || null,
          is_public: storyData.is_public || false,
          voice_type: storyData.voice_type || 'female'
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      if (data && data.id) {
        console.log("Story saved to database with ID:", data.id);
        return data;
      } else {
        console.warn("Story saved, but no ID returned.");
        return null;
      }
    } catch (error: any) {
      console.error("Error saving story to database:", error);
      throw new Error("Error saving story to database: " + error.message);
    }
  }
  
  private async generateCoverImage(title: string, theme: string, style: string, characterName: string): Promise<string | null> {
    if (this.cancelFlag) return null;
    
    this.updateProgress("gerando-capa", 60);
    
    try {
      if (!this.openai) {
        console.warn("OpenAI API key not found. Using placeholder image.");
        return getPlaceholderImageUrl(theme);
      }
      
      const prompt = `Crie uma imagem de capa para um livro infantil com o título "${title}". 
      A história se passa em um ambiente de ${theme} e tem um estilo de arte de ${style}. 
      O personagem principal é ${characterName}. A imagem deve ser vibrante, colorida e convidativa para crianças.`;
      
      const response = await this.openai.images.generate({
        prompt: prompt,
        n: 1,
        size: "512x512",
      });
      
      const imageUrl = response.data[0].url;
      return imageUrl || null;
    } catch (error: any) {
      console.error("Error generating cover image:", error);
      this.handleError("Erro ao gerar a imagem da capa: " + error.message);
      return getPlaceholderImageUrl(theme);
    }
  }
  
  private async generatePageImage(pageText: string, theme: string, style: string, characterName: string, pageNumber: number): Promise<string | null> {
    if (this.cancelFlag) return null;
    
    this.updateProgress(`ilustracao-${pageNumber}`, 70);
    
    try {
      if (!this.openai) {
        console.warn("OpenAI API key not found. Using placeholder image.");
        return getPlaceholderImageUrl(theme);
      }
      
      const prompt = `Ilustre uma cena do livro infantil.
        Texto da página: "${pageText}".
        O personagem principal é ${characterName}.
        A história se passa em um ambiente de ${theme} e tem um estilo de arte de ${style}.
        A imagem deve ser vibrante, colorida e adequada para crianças.`;
      
      const response = await this.openai.images.generate({
        prompt: prompt,
        n: 1,
        size: "512x512",
      });
      
      const imageUrl = response.data[0].url;
      return imageUrl || null;
    } catch (error: any) {
      console.error("Error generating page image:", error);
      this.handleError(`Erro ao gerar a imagem da página ${pageNumber}: ` + error.message);
      return getPlaceholderImageUrl(theme);
    }
  }
  
  async generateCompleteStory(): Promise<CompleteStory | null> {
    if (this.cancelFlag) return null;
    
    this.updateProgress("gerando-ilustracoes", 65);
    
    try {
      if (!this.openai) {
        console.warn("OpenAI API key not found. Using placeholder images.");
      }
      
      if (!this.storyData || !this.storyData.theme || !this.storyData.style || !this.storyData.characterName) {
        console.error("Missing story data for image generation.");
        return null;
      }
      
      if (!this.storyData.characterName) {
        console.error("Missing characterName for image generation.");
        return null;
      }
      
      const generatedStoryData = sessionStorage.getItem("generatedStory");
      if (!generatedStoryData) {
        console.error("No generated story data found in session storage.");
        return null;
      }
      
      const generatedStory = JSON.parse(generatedStoryData) as GeneratedStory;
      if (!generatedStory || !generatedStory.title || !generatedStory.content) {
        console.error("Invalid generated story data.");
        return null;
      }
      
      const coverImageUrl = await this.generateCoverImage(
        generatedStory.title,
        this.storyData.theme,
        this.storyData.style,
        this.storyData.characterName
      );
      
      if (this.cancelFlag) return null;
      
      const pages = [];
      for (let i = 0; i < generatedStory.content.length; i++) {
        if (this.cancelFlag) return null;
        
        const pageText = generatedStory.content[i];
        const imageUrl = await this.generatePageImage(
          pageText,
          this.storyData.theme,
          this.storyData.style,
          this.storyData.characterName,
          i + 1
        );
        
        pages.push({ text: pageText, imageUrl: imageUrl || getPlaceholderImageUrl(this.storyData.theme) });
      }
      
      const completeStory: CompleteStory = {
        title: generatedStory.title,
        childName: this.storyData.childName,
        characterName: this.storyData.characterName,
        characterAge: this.storyData.characterAge,
        theme: this.storyData.theme,
        setting: this.storyData.setting,
        style: this.storyData.style,
        characterPrompt: this.storyData.characterPrompt,
        coverImageUrl: coverImageUrl || getPlaceholderImageUrl(this.storyData.theme),
        pages: pages,
        voiceType: this.storyData.voiceType
      };
      
      return completeStory;
    } catch (error: any) {
      console.error("Error generating complete story:", error);
      this.handleError("Erro ao gerar a história completa: " + error.message);
      return null;
    }
  }

  async generateStoryContent(): Promise<GeneratedStory | null> {
    if (this.cancelFlag) return null;

    try {
      if (!this.storyData) {
        this.handleError("Dados da história não foram fornecidos.");
        return null;
      }

      const { childName, characterName, characterAge, theme, setting, style, characterPrompt } = this.storyData;

      if (!childName || !characterName || !characterAge || !theme || !setting || !style) {
        this.handleError("Todos os campos são obrigatórios para gerar a história.");
        return null;
      }

      if (!this.openai) {
        this.updateProgress("using-fallback", 30);

        const localStory = {
          title: `A Aventura de ${characterName} em ${theme}`,
          content: [
            `${childName} conheceu ${characterName}, um aventureiro em busca de um tesouro perdido em ${setting}.`,
            `Juntos, eles enfrentaram desafios e descobriram a importância da amizade e coragem.`,
            `No final, ${characterName} e ${childName} retornaram para casa, felizes por terem vivido essa aventura.`
          ]
        };

        sessionStorage.setItem("generatedStory", JSON.stringify(localStory));
        return localStory;
      }

      this.updateProgress("gerando-historia", 40);

      let promptTemplate = "Create a children's story..."; // Default template
      
      try {
        // Use RPC call instead of direct query for custom tables
        const { data: rpcResult } = await supabase.rpc('create_storybot_prompt_if_not_exists');
        
        // Then query the table through a stored function or use the default prompt
        const { data: promptData } = await supabase
          .from('storybot_prompts')
          .select('prompt')
          .limit(1)
          .single();
          
        if (promptData && promptData.prompt) {
          promptTemplate = promptData.prompt;
        } else {
          // Default prompt if none found
          promptTemplate = "Create a children's story..."; // Add your default prompt here
        }
      } catch (error) {
        console.warn("Failed to fetch StoryBot prompt, using default:", error);
        // Use a default prompt as fallback
        promptTemplate = "Create a children's story..."; // Add your default prompt here
      }
      
      const prompt = `
        ${promptTemplate}
        Nome da criança: ${childName},
        Nome do personagem: ${characterName},
        Idade do personagem: ${characterAge},
        Tema da história: ${theme},
        Local da história: ${setting},
        Estilo da história: ${style}.
        ${characterPrompt ? 'Prompt adicional para o personagem: ' + characterPrompt : ''}
        A história deve ter no máximo 5 páginas.
        Formate a resposta como um objeto JSON com os campos "title" e "content", onde "content" é um array de strings, cada string representando uma página da história.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const storyText = response?.choices?.[0]?.message?.content;

      if (!storyText) {
        throw new Error("Não foi possível gerar a história.");
      }

      try {
        const storyJson = JSON.parse(storyText);

        if (!storyJson.title || !storyJson.content || !Array.isArray(storyJson.content)) {
          throw new Error("Formato JSON inválido para a história.");
        }

        const generatedStory: GeneratedStory = {
          title: storyJson.title,
          content: storyJson.content
        };

        sessionStorage.setItem("generatedStory", JSON.stringify(generatedStory));
        return generatedStory;
      } catch (jsonError: any) {
        console.error("Erro ao analisar JSON da história:", jsonError);
        console.error("Texto JSON problemático:", storyText);
        this.handleError("Erro ao processar a história gerada: " + jsonError.message);
        return null;
      }
    } catch (error: any) {
      console.error("Erro ao gerar a história:", error);
      this.handleError("Erro ao gerar a história: " + error.message);
      return null;
    }
  }

  async saveStoryToDatabase(storyData: Record<string, any>): Promise<string | null> {
    try {
      // Ensure required fields are present
      if (!storyData.title || !storyData.character_name) {
        throw new Error("Missing required fields: title and character_name");
      }
      
      // Use proper typing for the database insert
      const { data, error } = await supabase
        .from('stories')
        .insert({
          title: storyData.title,
          character_name: storyData.character_name,
          character_age: storyData.character_age || null,
          character_prompt: storyData.character_prompt || null,
          cover_image_url: storyData.cover_image_url || null,
          setting: storyData.setting || null,
          theme: storyData.theme || null,
          style: storyData.style || null,
          pages: storyData.pages || [],
          user_id: storyData.user_id || null,
          is_public: storyData.is_public || false,
          voice_type: storyData.voice_type || 'female'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data && data.id) {
        console.log("Story saved to database with ID:", data.id);
        return data.id;
      } else {
        console.warn("Story saved, but no ID returned.");
        return null;
      }
    } catch (error: any) {
      console.error("Error saving story to database:", error);
      this.handleError("Erro ao salvar a história no banco de dados: " + error.message);
      return null;
    }
  }
}
