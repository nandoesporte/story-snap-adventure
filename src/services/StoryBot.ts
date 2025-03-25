import { GoogleGenerativeAI, Part, FileData } from '@google/generative-ai';
import { openai, geminiAI, ensureStoryBotPromptsTable, isLeonardoWebhookValid } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type StoryParams = {
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  imageUrl?: string | null;
  characterPrompt?: string | null;
  readingLevel?: string;
  language?: string;
  moral?: string;
  pageCount?: number;
};

type GeneratedStory = {
  title: string;
  content: string[];
};

export class StoryBot {
  private apiAvailable: boolean = true;
  private leonardoApiAvailable: boolean = true;
  private leonardoWebhookUrl: string | null = null;
  private cancelRequested: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 2;

  constructor(webhookUrl: string | null = null) {
    if(localStorage.getItem("storybot_api_issue") === "true") {
      this.apiAvailable = false;
    }
    
    if(localStorage.getItem("leonardo_api_issue") === "true") {
      this.leonardoApiAvailable = false;
    }
    
    this.leonardoWebhookUrl = webhookUrl;
    
    ensureStoryBotPromptsTable().catch(err => {
      console.warn("Failed to ensure storybot_prompts table exists", err);
    });
  }

  public isApiAvailable(): boolean {
    return this.apiAvailable;
  }
  
  public isLeonardoApiAvailable(): boolean {
    return this.leonardoApiAvailable && isLeonardoWebhookValid() && !!this.leonardoWebhookUrl;
  }
  
  public setLeonardoWebhookUrl(url: string): void {
    this.leonardoWebhookUrl = url;
    localStorage.setItem("leonardo_webhook_url", url);
    localStorage.removeItem("leonardo_api_issue");
    this.leonardoApiAvailable = true;
  }
  
  public cancel(): void {
    this.cancelRequested = true;
  }

  public async generateStoryBotResponse(messages: any[], userPrompt: string): Promise<string> {
    if (!this.apiAvailable) {
      throw new Error("API previously marked as unavailable");
    }
    
    if (this.cancelRequested) {
      this.cancelRequested = false;
      throw new Error("A geração foi cancelada.");
    }
    
    this.retryCount = 0;
    
    const attemptGeneration = async (): Promise<string> => {
      try {
        let systemPrompt = "Você é o StoryBot, um assistente que ajuda a criar histórias infantis personalizadas.";
        
        try {
          await ensureStoryBotPromptsTable();
          
          const { data: promptData, error: promptError } = await supabase
            .from('storybot_prompts')
            .select('*')
            .eq('id', 'story_creation_prompt')
            .single();
            
          if (!promptError && promptData?.prompt) {
            systemPrompt = promptData.prompt;
          }
        } catch (error) {
          console.warn("Error fetching StoryBot prompt, using default system prompt", error);
        }
        
        const formattedMessages: Message[] = [
          { role: "system", content: systemPrompt },
          ...messages,
          { role: "user", content: userPrompt }
        ];
        
        const completion = await openai.chat.completions.create({
          model: "gemini-1.5-pro",
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        return completion.choices[0].message.content || "Desculpe, não consegui gerar uma resposta.";
      } catch (error: any) {
        console.error("Error in StoryBot generateStoryBotResponse (attempt " + (this.retryCount + 1) + "):", error);
        
        this.retryCount++;
        if (this.retryCount <= this.maxRetries) {
          console.log(`Retrying StoryBot response generation (attempt ${this.retryCount} of ${this.maxRetries})...`);
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          return attemptGeneration();
        } else {
          this.apiAvailable = false;
          localStorage.setItem("storybot_api_issue", "true");
          throw error;
        }
      }
    };
    
    return attemptGeneration();
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
    
    if (this.cancelRequested) {
      this.cancelRequested = false;
      throw new Error("A geração foi cancelada.");
    }
    
    try {
      let imagePrompt = "Crie uma descrição detalhada para uma ilustração infantil baseada no seguinte texto. A descrição deve ser rica em detalhes visuais, incluindo cores, expressões e elementos de cenário.";
      
      try {
        await ensureStoryBotPromptsTable();
        
        const { data: promptData, error: promptError } = await supabase
          .from('storybot_prompts')
          .select('*')
          .eq('id', 'image_description_prompt')
          .single();
          
        if (!promptError && promptData?.prompt) {
          imagePrompt = promptData.prompt;
        }
      } catch (error) {
        console.warn("Error fetching image description prompt, using default", error);
      }
      
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
        model: "gemini-1.5-pro",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 500,
      });
      
      return completion.choices[0].message.content || 
        `Ilustração detalhada de ${characterName} em uma aventura no cenário de ${setting} com tema de ${theme}.`;
    } catch (error) {
      console.error("Error in StoryBot generateImageDescription:", error);
      this.apiAvailable = false;
      localStorage.setItem("storybot_api_issue", "true");
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
    if (!this.apiAvailable) {
      throw new Error("API previously marked as unavailable");
    }
    
    if (this.cancelRequested) {
      this.cancelRequested = false;
      throw new Error("A geração foi cancelada.");
    }
    
    console.info("Generating image with Gemini:", {
      imageDescription: imageDescription.substring(0, 100) + "...",
      theme,
      style
    });
    
    this.retryCount = 0;
    
    const attemptImageGeneration = async (): Promise<string> => {
      try {
        const apiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
        if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.trim() === '') {
          throw new Error("Chave da API Gemini não configurada");
        }
        
        const currentGeminiAI = new GoogleGenerativeAI(apiKey.trim());
        
        const fullPrompt = `
        Crie uma ilustração detalhada para um livro infantil com as seguintes características:
        
        Descrição da cena: ${imageDescription}
        Personagem principal: ${characterName}
        Tema: ${theme}
        Cenário: ${setting}
        Estilo visual: ${style}
        ${characterPrompt ? `Detalhes adicionais do personagem: ${characterPrompt}` : ''}
        
        A ilustração deve ser colorida, alegre e apropriada para crianças.
        `;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        const model = currentGeminiAI.getGenerativeModel({ 
          model: "gemini-1.5-pro-vision",
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        });
        
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: fullPrompt }]}],
        }, { signal: controller.signal });
        
        clearTimeout(timeoutId);
        
        const response = result.response;
        
        if (!response) {
          throw new Error("Resposta vazia do Gemini");
        }
        
        const parts = response.candidates?.[0]?.content?.parts;
        if (!parts) {
          throw new Error("Nenhuma parte encontrada na resposta do Gemini");
        }
        
        const imagePart = parts.find(part => 
          part.fileData && 
          part.fileData.mimeType && 
          part.fileData.mimeType.startsWith('image/')
        );
        
        if (!imagePart || !imagePart.fileData || !imagePart.fileData.mimeType) {
          console.error("No image found in response from Gemini");
          throw new Error("Nenhuma imagem encontrada na resposta do Gemini");
        }
        
        let imageDataUrl = '';
        if ('data' in imagePart.fileData) {
          imageDataUrl = `data:${imagePart.fileData.mimeType};base64,${imagePart.fileData.data}`;
        } else if ('dataBase64' in imagePart.fileData as any) {
          imageDataUrl = `data:${imagePart.fileData.mimeType};base64,${(imagePart.fileData as any).dataBase64}`;
        } else {
          throw new Error("Formato de dados de imagem não reconhecido na resposta do Gemini");
        }
        
        localStorage.removeItem("leonardo_api_issue");
        this.leonardoApiAvailable = true;
        
        return imageDataUrl;
      } catch (error: any) {
        console.error("Error generating image with Gemini API (attempt " + (this.retryCount + 1) + "):", error);
        
        if (error.name === 'AbortError') {
          toast.error("Tempo limite excedido ao gerar imagem com Gemini AI");
          throw new Error('Tempo limite excedido ao gerar imagem');
        }
        
        if (error.message && (
            error.message.includes("quota") || 
            error.message.includes("429") || 
            error.message.includes("rate limit")
          )) {
          console.error("Quota exceeded error detected:", error);
          
          if (this.leonardoWebhookUrl && this.leonardoApiAvailable) {
            console.log("Attempting to use Leonardo webhook as fallback");
            try {
              return await this.generateImageUsingLeonardo(
                imageDescription, 
                characterName, 
                theme, 
                setting, 
                childImageBase64, 
                style, 
                characterPrompt
              );
            } catch (leonardoError) {
              console.error("Leonardo fallback also failed:", leonardoError);
            }
          }
        }
        
        this.retryCount++;
        if (this.retryCount <= this.maxRetries) {
          console.log(`Retrying image generation with Gemini (attempt ${this.retryCount} of ${this.maxRetries})...`);
          toast.info(`Tentando novamente (${this.retryCount}/${this.maxRetries})...`);
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          return attemptImageGeneration();
        }
        
        this.apiAvailable = false;
        localStorage.setItem("storybot_api_issue", "true");
        
        toast.error("Erro ao gerar imagem com Gemini. Usando imagens de placeholder.");
        
        const themeImages: Record<string, string> = {
          adventure: "/images/placeholders/adventure.jpg",
          fantasy: "/images/placeholders/fantasy.jpg",
          space: "/images/placeholders/space.jpg",
          ocean: "/images/placeholders/ocean.jpg",
          dinosaurs: "/images/placeholders/dinosaurs.jpg"
        };
        
        return themeImages[theme as keyof typeof themeImages] || "/placeholder.svg";
      }
    };
    
    return attemptImageGeneration();
  }
  
  private async generateImageUsingLeonardo(
    imageDescription: string,
    characterName: string,
    theme: string,
    setting: string,
    childImageBase64: string | null = null,
    style: string = "cartoon",
    characterPrompt: string | null = null
  ): Promise<string> {
    if (!this.leonardoApiAvailable || !this.leonardoWebhookUrl) {
      console.error("Leonardo API unavailable or webhook not configured");
      
      localStorage.setItem("leonardo_api_issue", "true");
      
      const themeImages: Record<string, string> = {
        adventure: "/images/placeholders/adventure.jpg",
        fantasy: "/images/placeholders/fantasy.jpg",
        space: "/images/placeholders/space.jpg",
        ocean: "/images/placeholders/ocean.jpg",
        dinosaurs: "/images/placeholders/dinosaurs.jpg"
      };
      
      return themeImages[theme as keyof typeof themeImages] || "/placeholder.svg";
    }
    
    console.info("Using Leonardo webhook as fallback:", {
      webhookUrl: this.leonardoWebhookUrl
    });
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(this.leonardoWebhookUrl!, {
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
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Leonardo webhook returned status: ${response.status} ${response.statusText}`);
        throw new Error(`Leonardo webhook returned status: ${response.status} - ${response.statusText}`);
      }
      
      let data;
      try {
        data = await response.json();
        console.log("Leonardo webhook response:", data);
      } catch (e) {
        console.error("Failed to parse webhook response as JSON", e);
        throw new Error("Invalid response format from webhook");
      }
      
      if (data.image_url) {
        localStorage.removeItem("leonardo_api_issue");
        this.leonardoApiAvailable = true;
        return data.image_url;
      } else if (data.error) {
        throw new Error(`Webhook error: ${data.error}`);
      } else {
        throw new Error("Webhook didn't return an image URL or error message");
      }
    } catch (error: any) {
      console.error("Error using Leonardo fallback:", error);
      throw error;
    }
  }
  
  public async generateCoverImage(
    title: string,
    characterName: string,
    theme: string,
    setting: string,
    childImageBase64: string | null = null,
    style: string = "cartoon",
    characterPrompt: string | null = null
  ): Promise<string> {
    try {
      const coverDescription = `Capa do livro infantil "${title}", mostrando ${characterName} em uma aventura no cenário de ${setting} com tema de ${theme}.`;
      
      console.log("Generating cover image with description:", coverDescription);
      
      return await this.generateImage(
        coverDescription,
        characterName,
        theme,
        setting,
        childImageBase64,
        style,
        characterPrompt
      );
    } catch (error) {
      console.error("Error generating cover image:", error);
      
      const themeCovers = {
        adventure: "/images/covers/adventure.jpg",
        fantasy: "/images/covers/fantasy.jpg",
        space: "/images/covers/space.jpg",
        ocean: "/images/covers/ocean.jpg",
        dinosaurs: "/images/covers/dinosaurs.jpg"
      };
      
      return themeCovers[theme as keyof typeof themeCovers] || `/placeholder.svg`;
    }
  }
  
  public async generateStory(params: StoryParams): Promise<GeneratedStory> {
    if (!this.apiAvailable) {
      throw new Error("API previously marked as unavailable");
    }
    
    if (this.cancelRequested) {
      this.cancelRequested = false;
      throw new Error("A geração foi cancelada.");
    }
    
    try {
      let systemPrompt = "Você é um assistente especializado em criar histórias infantis personalizadas.";
      
      try {
        await ensureStoryBotPromptsTable();
        
        const { data: promptData, error: promptError } = await supabase
          .from('storybot_prompts')
          .select('*')
          .eq('id', 'story_generation_prompt')
          .single();
          
        if (!promptError && promptData?.prompt) {
          systemPrompt = promptData.prompt;
        }
      } catch (error) {
        console.warn("Error fetching story generation prompt, using default", error);
      }
      
      const userPrompt = `
        Crie uma história infantil com as seguintes características:
        - Nome da criança: ${params.childName}
        - Idade: ${params.childAge} anos
        - Tema: ${params.theme}
        - Cenário: ${params.setting}
        - Nível de leitura: ${params.readingLevel || 'intermediário'}
        - Idioma: ${params.language || 'português'}
        - Tema moral: ${params.moral || 'amizade'}
        - Número de páginas: ${params.pageCount || 10}
        ${params.characterPrompt ? `- Informações do personagem: ${params.characterPrompt}` : ''}
        
        A história deve ter um título e ${params.pageCount || 10} páginas de texto.
        Formato de saída:
        TITULO: [título da história]
        
        PAGINA 1: [conteúdo da página 1]
        
        PAGINA 2: [conteúdo da página 2]
        
        E assim por diante...
      `;
      
      const formattedMessages: Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];
      
      const completion = await openai.chat.completions.create({
        model: "gemini-1.5-pro",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2500,
      });
      
      const storyText = completion.choices[0].message.content || "";
      
      return this.parseStoryContent(storyText, params.childName);
    } catch (error) {
      console.error("Error in StoryBot generateStory:", error);
      this.apiAvailable = false;
      localStorage.setItem("storybot_api_issue", "true");
      throw error;
    }
  }
  
  public async generateStoryFallback(params: StoryParams): Promise<GeneratedStory> {
    console.log("Using fallback story generator with params:", params);
    
    const titles = [
      `A Grande Aventura de ${params.childName}`,
      `${params.childName} e a Jornada Mágica`,
      `O Incrível Mundo de ${params.childName}`,
      `${params.childName} Descobre ${params.setting}`,
      `A Missão Especial de ${params.childName}`
    ];
    
    const title = titles[Math.floor(Math.random() * titles.length)];
    
    const storyStarters = [
      `Era uma vez, ${params.childName}, uma criança de ${params.childAge} anos, que adorava explorar novos lugares.`,
      `${params.childName} sempre sonhou em visitar ${params.setting}.`,
      `Em um dia ensolarado, ${params.childName} encontrou um mapa misterioso.`,
      `${params.childName} e seus amigos estavam brincando quando algo incrível aconteceu.`,
      `A aventura de ${params.childName} começou quando um estranho pacote chegou à sua porta.`
    ];
    
    const middles = [
      `Durante sua jornada em ${params.setting}, ${params.childName} descobriu um segredo antigo.`,
      `No caminho, ${params.childName} fez novos amigos que ajudaram na aventura.`,
      `A missão não seria fácil, mas ${params.childName} estava determinado(a) a continuar.`,
      `Com coragem e inteligência, ${params.childName} enfrentou todos os desafios.`,
      `A cada passo, ${params.childName} aprendeu algo novo sobre ${params.theme}.`
    ];
    
    const endings = [
      `No final, ${params.childName} entendeu a importância de ${params.moral || 'amizade'}.`,
      `A aventura terminou, mas as lições aprendidas ficariam para sempre.`,
      `${params.childName} voltou para casa cheio(a) de histórias para contar.`,
      `E assim ${params.childName} salvou o dia, usando suas habilidades especiais.`,
      `Todos celebraram a vitória de ${params.childName}, o(a) verdadeiro(a) herói(heroína) de ${params.setting}.`
    ];
    
    const pageCount = params.pageCount || 10;
    const content: string[] = [];
    
    for (let i = 0; i < pageCount; i++) {
      if (i === 0) {
        content.push(storyStarters[Math.floor(Math.random() * storyStarters.length)]);
      } else if (i === pageCount - 1) {
        content.push(endings[Math.floor(Math.random() * endings.length)]);
      } else {
        if (i < 3) {
          content.push(middles[Math.floor(Math.random() * middles.length)]);
        } else {
          content.push(`${params.childName} continuou sua jornada em ${params.setting}, descobrindo novos segredos a cada momento.`);
        }
      }
    }
    
    return { title, content };
  }
  
  private parseStoryContent(response: string, childName: string): GeneratedStory {
    let cleanedResponse = response.replace(/ilustração:|illustration:|desenhe:|draw:|imagem:|image:|descrição visual:|visual description:|prompt de imagem:|image prompt:/gi, '');
    
    const titleMatch = cleanedResponse.match(/TITULO:\s*(.*?)(?:\r?\n|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : `História de ${childName}`;
    
    const pageMatches = cleanedResponse.match(/PAGINA\s*\d+:\s*([\s\S]*?)(?=PAGINA\s*\d+:|$)/gi);
    
    let content: string[] = [];
    if (pageMatches && pageMatches.length > 0) {
      content = pageMatches.map(page => {
        return page.replace(/PAGINA\s*\d+:\s*/i, '')
          .replace(/ilustração:|illustration:|desenhe:|draw:|imagem:|image:|descrição visual:|visual description:|prompt de imagem:|image prompt:/gi, '')
          .trim();
      });
    } else {
      const paragraphs = cleanedResponse.split('\n\n').filter(para => 
        para.trim().length > 0 && !para.match(/TITULO:/i)
      );
      
      content = paragraphs;
    }
    
    while (content.length < 5) {
      content.push(`A aventura de ${childName} continua...`);
    }
    
    return { title, content };
  }
}
