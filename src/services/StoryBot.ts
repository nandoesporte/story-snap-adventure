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
    // Check if the API was previously marked as unavailable
    if(localStorage.getItem("storybot_api_issue") === "true") {
      this.apiAvailable = false;
    }
    
    if(localStorage.getItem("leonardo_api_issue") === "true") {
      this.leonardoApiAvailable = false;
    }
    
    this.leonardoWebhookUrl = webhookUrl;
    
    // Try to ensure the storybot_prompts table exists
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
    // Clear any previous API issues when setting a new URL
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
        // Get StoryBot system prompt from Supabase
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
        
        // Use the updated model name gemini-1.5-pro
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
          
          // Wait a short time before retrying
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
      // Default image description prompt
      let imagePrompt = "Crie uma descrição detalhada para uma ilustração infantil baseada no seguinte texto. A descrição deve ser rica em detalhes visuais, incluindo cores, expressões e elementos de cenário.";
      
      // Try to get image description prompt from Supabase
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
      
      // Use the updated model name gemini-1.5-pro
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
    // Check if Leonardo API is available and webhook is configured
    if (!this.leonardoApiAvailable || !this.leonardoWebhookUrl) {
      console.error("Leonardo API unavailable or webhook not configured");
      
      // Set the error flag
      localStorage.setItem("leonardo_api_issue", "true");
      
      // Return themed placeholder images based on the theme
      const themeImages: Record<string, string> = {
        adventure: "/images/placeholders/adventure.jpg",
        fantasy: "/images/placeholders/fantasy.jpg",
        space: "/images/placeholders/space.jpg",
        ocean: "/images/placeholders/ocean.jpg",
        dinosaurs: "/images/placeholders/dinosaurs.jpg"
      };
      
      // If theme exists in our placeholders, use it, otherwise use a default
      return themeImages[theme] || "/placeholder.svg";
    }
    
    if (this.cancelRequested) {
      this.cancelRequested = false;
      throw new Error("A geração foi cancelada.");
    }
    
    console.info("Generating image:", {
      imageDescription: imageDescription.substring(0, 100) + "...",
      theme,
      style,
      webhookUrl: this.leonardoWebhookUrl
    });
    
    this.retryCount = 0;
    
    const attemptImageGeneration = async (): Promise<string> => {
      try {
        // Call the Leonardo webhook with all required parameters
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
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
          // Reset the error flag on successful generation
          localStorage.removeItem("leonardo_api_issue");
          this.leonardoApiAvailable = true;
          return data.image_url;
        } else if (data.error) {
          throw new Error(`Webhook error: ${data.error}`);
        } else {
          throw new Error("Webhook didn't return an image URL or error message");
        }
      } catch (error: any) {
        console.error("Error generating image with Leonardo API (attempt " + (this.retryCount + 1) + "):", error);
        
        if (error.name === 'AbortError') {
          toast.error("Tempo limite excedido ao chamar o webhook do Leonardo AI");
          throw new Error('Tempo limite excedido ao gerar imagem');
        }
        
        this.retryCount++;
        if (this.retryCount <= this.maxRetries) {
          console.log(`Retrying image generation (attempt ${this.retryCount} of ${this.maxRetries})...`);
          toast.info(`Tentando novamente (${this.retryCount}/${this.maxRetries})...`);
          
          // Wait a short time before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
          return attemptImageGeneration();
        }
        
        this.leonardoApiAvailable = false;
        localStorage.setItem("leonardo_api_issue", "true");
        
        // Show error toast
        toast.error("Erro ao gerar imagem. Verifique a configuração do webhook do Leonardo AI.");
        
        // Fallback to themed placeholders
        const themeImages: Record<string, string> = {
          adventure: "/images/placeholders/adventure.jpg",
          fantasy: "/images/placeholders/fantasy.jpg",
          space: "/images/placeholders/space.jpg",
          ocean: "/images/placeholders/ocean.jpg",
          dinosaurs: "/images/placeholders/dinosaurs.jpg"
        };
        
        return themeImages[theme] || "/placeholder.svg";
      }
    };
    
    return attemptImageGeneration();
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
      // Default system prompt
      let systemPrompt = "Você é um assistente especializado em criar histórias infantis personalizadas.";
      
      // Try to get story generation prompt from Supabase
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
      
      // Construct the user prompt with all parameters
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
      
      // Use the updated model name gemini-1.5-pro
      const completion = await openai.chat.completions.create({
        model: "gemini-1.5-pro",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2500,
      });
      
      const storyText = completion.choices[0].message.content || "";
      
      // Parse the story into title and pages
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
    
    // Simple fallback templates
    const titles = [
      `A Grande Aventura de ${params.childName}`,
      `${params.childName} e a Jornada Mágica`,
      `O Incrível Mundo de ${params.childName}`,
      `${params.childName} Descobre ${params.setting}`,
      `A Missão Especial de ${params.childName}`
    ];
    
    // Select a random title
    const title = titles[Math.floor(Math.random() * titles.length)];
    
    // Generate simple content based on theme and setting
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
    
    // Generate content for each page
    const pageCount = params.pageCount || 10;
    const content: string[] = [];
    
    for (let i = 0; i < pageCount; i++) {
      if (i === 0) {
        // First page - introduction
        content.push(storyStarters[Math.floor(Math.random() * storyStarters.length)]);
      } else if (i === pageCount - 1) {
        // Last page - conclusion
        content.push(endings[Math.floor(Math.random() * endings.length)]);
      } else {
        // Middle pages - adventure progress
        if (i < 3) {
          content.push(middles[Math.floor(Math.random() * middles.length)]);
        } else {
          // More variety for middle pages
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
    
    // Ensure we have at least some content
    while (content.length < 5) {
      content.push(`A aventura de ${childName} continua...`);
    }
    
    return { title, content };
  }
}
