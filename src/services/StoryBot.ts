import { openai } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

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

  public async generateStory(params: StoryParams): Promise<GeneratedStory> {
    if (!this.apiAvailable) {
      throw new Error("API previously marked as unavailable");
    }
    
    try {
      // Get story generation prompt from Supabase
      const { data: promptData, error: promptError } = await supabase
        .from('storybot_prompts')
        .select('*')
        .eq('id', 'story_generation_prompt')
        .single();
        
      if (promptError) {
        console.error("Error fetching story generation prompt:", promptError);
        throw new Error("Failed to fetch story generation prompt");
      }
      
      const systemPrompt = promptData?.prompt || 
        "Você é um assistente especializado em criar histórias infantis personalizadas.";
      
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
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2500,
      });
      
      const storyText = completion.choices[0].message.content || "";
      
      // Parse the story into title and pages
      return this.parseStoryContent(storyText, params.childName);
    } catch (error) {
      this.apiAvailable = false;
      localStorage.setItem("storybot_api_issue", "true");
      console.error("Error in StoryBot generateStory:", error);
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
