
import { openai } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export class StoryBot {
  private apiAvailable: boolean = true;
  private leonardoApiAvailable: boolean = true;
  private leonardoWebhookUrl: string | null = null;

  constructor(webhookUrl: string | null = null) {
    // Check if the API was previously marked as unavailable
    if(localStorage.getItem("storybot_api_issue") === "true") {
      this.apiAvailable = false;
    }
    
    if(localStorage.getItem("leonardo_api_issue") === "true") {
      this.leonardoApiAvailable = false;
    }
    
    this.leonardoWebhookUrl = webhookUrl;
  }

  public isApiAvailable(): boolean {
    return this.apiAvailable;
  }
  
  public isLeonardoApiAvailable(): boolean {
    return this.leonardoApiAvailable;
  }
  
  public setLeonardoWebhookUrl(url: string): void {
    this.leonardoWebhookUrl = url;
  }

  public async generateStoryBotResponse(messages: any[], userPrompt: string): Promise<string> {
    if (!this.apiAvailable) {
      throw new Error("API previously marked as unavailable");
    }
    
    try {
      // Get StoryBot system prompt from Supabase
      const { data: promptData, error: promptError } = await supabase
        .from('storybot_prompts')
        .select('*')
        .eq('id', 'story_creation_prompt')
        .single();
        
      if (promptError) {
        console.error("Error fetching StoryBot prompt:", promptError);
        throw new Error("Failed to fetch StoryBot prompt");
      }
      
      const systemPrompt = promptData?.prompt || "Você é o StoryBot, um assistente que ajuda a criar histórias infantis personalizadas.";
      
      const formattedMessages: Message[] = [
        { role: "system", content: systemPrompt },
        ...messages,
        { role: "user", content: userPrompt }
      ];
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      return completion.choices[0].message.content || "Desculpe, não consegui gerar uma resposta.";
    } catch (error) {
      this.apiAvailable = false;
      localStorage.setItem("storybot_api_issue", "true");
      console.error("Error in StoryBot generateStoryBotResponse:", error);
      throw error;
    }
  }
  
  public async generateImageDescription(
    pageText: string,
    characterName: string,
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string = ""
  ): Promise<string> {
    if (!this.apiAvailable) {
      throw new Error("API previously marked as unavailable");
    }
    
    try {
      // Get image description prompt from Supabase
      const { data: promptData, error: promptError } = await supabase
        .from('storybot_prompts')
        .select('*')
        .eq('id', 'image_description_prompt')
        .single();
        
      if (promptError) {
        console.error("Error fetching image description prompt:", promptError);
        throw new Error("Failed to fetch image description prompt");
      }
      
      const imagePrompt = promptData?.prompt || 
        "Crie uma descrição detalhada para uma ilustração infantil baseada no seguinte texto. A descrição deve ser rica em detalhes visuais, incluindo cores, expressões e elementos de cenário.";
      
      const formattedMessages: Message[] = [
        { 
          role: "system", 
          content: imagePrompt 
        },
        { 
          role: "user", 
          content: `
          Crie uma descrição visual detalhada para ilustrar este trecho de história infantil.
          Texto: ${pageText}
          
          Detalhes importantes:
          - Personagem principal: ${characterName}
          - Idade da criança: ${childAge} anos
          - Tema da história: ${theme}
          - Cenário: ${setting}
          ${moralTheme ? `- Tema moral: ${moralTheme}` : ''}
          
          A descrição deve ser rica em detalhes visuais para uma ilustração infantil em estilo cartoon, incluindo cores vibrantes, expressões faciais e elementos do cenário.
          `
        }
      ];
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 500,
      });
      
      return completion.choices[0].message.content || 
        `Ilustração detalhada de ${characterName} em uma aventura no cenário de ${setting} com tema de ${theme}.`;
    } catch (error) {
      this.apiAvailable = false;
      localStorage.setItem("storybot_api_issue", "true");
      console.error("Error in StoryBot generateImageDescription:", error);
      throw error;
    }
  }
  
  public async generateImage(
    imageDescription: string,
    characterName: string,
    theme: string,
    setting: string,
    childImageBase64: string | null = null,
    style: string = "cartoon",
    characterPrompt: string | null = null
  ): Promise<string> {
    if (!this.leonardoApiAvailable) {
      throw new Error("Leonardo API marked as unavailable");
    }
    
    console.info("Generating image:", {
      imageDescription,
      theme,
      style
    });
    
    try {
      // If a webhook URL is provided, we'll use it to generate the image
      if (this.leonardoWebhookUrl) {
        const response = await fetch(this.leonardoWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: imageDescription,
            character_name: characterName,
            theme,
            setting,
            style,
            character_prompt: characterPrompt,
            child_image: childImageBase64
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Leonardo webhook returned status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.image_url) {
          return data.image_url;
        } else {
          throw new Error("Leonardo webhook didn't return an image URL");
        }
      } else {
        // Fallback to placeholder images if no webhook URL is provided
        throw new Error("No Leonardo webhook URL configured");
      }
    } catch (error) {
      console.error("Error generating image with Leonardo API:", error);
      this.leonardoApiAvailable = false;
      localStorage.setItem("leonardo_api_issue", "true");
      throw error;
    }
  }
}
