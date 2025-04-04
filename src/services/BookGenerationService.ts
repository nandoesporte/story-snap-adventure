import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { initializeOpenAI } from '@/lib/openai';
import { toast } from 'sonner';

export type StoryTheme = 'adventure' | 'fantasy' | 'space' | 'ocean' | 'dinosaurs';
export type StorySetting = 'forest' | 'castle' | 'space' | 'underwater' | 'dinosaurland';
export type StoryStyle = 'cartoon' | 'watercolor' | 'realistic' | 'childrenbook' | 'papercraft';
export type StoryLength = 'short' | 'medium' | 'long';
export type ReadingLevel = 'beginner' | 'intermediate' | 'advanced';
export type StoryLanguage = 'portuguese' | 'english' | 'spanish';
export type StoryMoral = 'friendship' | 'courage' | 'respect' | 'environment' | 'honesty' | 'perseverance';

export interface StoryInputData {
  childName: string;
  childAge: string;
  theme: StoryTheme;
  setting: StorySetting;
  characterId?: string;
  characterName?: string;
  style?: StoryStyle;
  length?: StoryLength;
  imagePreview?: string | null;
  readingLevel?: ReadingLevel;
  language?: StoryLanguage;
  moral?: StoryMoral;
  character_prompt?: string;
}

export interface GeneratedStory {
  title: string;
  content: string[];
}

export interface StoryPage {
  text: string;
  page_number: number;
  image_prompt?: string;
  image_url?: string;
}

export interface Story {
  id?: string;
  title: string;
  character_name: string;
  character_age?: string;
  theme?: string;
  setting?: string;
  style?: string;
  moral?: string;
  language?: string;
  reading_level?: string;
  num_pages?: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  cover_image?: string;
  published?: boolean;
  character_prompt?: string;
}

export interface CompleteStory extends Story {
  pages: StoryPage[];
}

export class BookGenerationService {
  static currentStoryId: string | null = null;
  static isGenerating: boolean = false;
  static abortController: AbortController | null = null;
  
  private data: StoryInputData;
  private progressCallback?: (stage: string, percent: number) => void;
  private errorCallback?: (message: string) => void;
  private retryCount: number = 0;
  private maxRetries: number = 2;
  
  constructor(
    data: StoryInputData,
    progressCallback?: (stage: string, percent: number) => void,
    errorCallback?: (message: string) => void
  ) {
    this.data = data;
    this.progressCallback = progressCallback;
    this.errorCallback = errorCallback;
  }
  
  public cancel(): void {
    BookGenerationService.cancelGeneration();
  }
  
  public async generateStoryContent(): Promise<GeneratedStory | null> {
    this.retryCount = 0;
    
    const attemptGeneration = async (): Promise<GeneratedStory | null> => {
      try {
        const storyParams: Story = {
          title: `Story for ${this.data.childName}`,
          character_name: this.data.characterName || this.data.childName,
          character_age: this.data.childAge,
          theme: this.data.theme,
          setting: this.data.setting,
          style: this.data.style,
          moral: this.data.moral,
          language: this.data.language,
          reading_level: this.data.readingLevel,
          num_pages: this.getNumPagesFromLength(this.data.length),
          character_prompt: this.data.character_prompt
        };
        
        let result;
        try {
          result = await BookGenerationService.generateStory(
            storyParams,
            (message, progress) => {
              this.progressCallback?.(this.convertProgressStage(message), progress);
            }
          );
        } catch (error: any) {
          console.error("Error generating story with API:", error);
          
          // Check if this is a quota error
          if (error.message && (
              error.message.includes("QUOTA_EXCEEDED") || 
              error.message.includes("quota") ||
              error.message.includes("429")
            )) {
            console.log("Using fallback story generator due to quota limits");
            this.progressCallback?.("using-fallback", 60);
            
            // Use fallback generator - fix: call the static method with class name
            result = BookGenerationService.generateFallbackStory(storyParams);
          } else {
            // Re-throw other errors
            throw error;
          }
        }
        
        if (!result) {
          throw new Error("Falha ao gerar a história. Por favor, tente novamente.");
        }
        
        return {
          title: result.title,
          content: result.pages.map(page => typeof page === 'string' ? page : page.text)
        };
      } catch (error: any) {
        console.error("Error in generateStoryContent (attempt " + (this.retryCount + 1) + "):", error);
        
        if (error.message?.includes("cancelada")) {
          this.errorCallback?.(error.message);
          return null;
        }
        
        this.retryCount++;
        if (this.retryCount <= this.maxRetries) {
          console.log(`Retrying story generation (attempt ${this.retryCount} of ${this.maxRetries})...`);
          this.progressCallback?.("retrying", 10 * this.retryCount);
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          return attemptGeneration();
        } else {
          this.errorCallback?.(error.message || "Erro ao gerar história após múltiplas tentativas");
          return null;
        }
      }
    };
    
    return attemptGeneration();
  }
  
  public async generateCompleteStory(): Promise<CompleteStory | null> {
    try {
      const storyContent = await this.generateStoryContent();
      if (!storyContent) return null;
      
      const completeStory: CompleteStory = {
        title: storyContent.title,
        character_name: this.data.characterName || this.data.childName,
        character_age: this.data.childAge,
        theme: this.data.theme,
        setting: this.data.setting,
        style: this.data.style || 'cartoon',
        moral: this.data.moral,
        language: this.data.language || 'portuguese',
        reading_level: this.data.readingLevel || 'intermediate',
        pages: storyContent.content.map((text, index) => ({
          text,
          page_number: index + 1,
          image_prompt: `Illustration for page ${index + 1}: ${text.substring(0, 100)}...`
        }))
      };
      
      this.saveToSessionStorage(completeStory);
      
      try {
        // Fix: Call the static method using the class name
        await BookGenerationService.saveStoryToDatabase(completeStory);
      } catch (error) {
        console.warn("Could not save to database, but story is available in session storage:", error);
      }
      
      return completeStory;
    } catch (error) {
      console.error("Error in generateCompleteStory:", error);
      return null;
    }
  }
  
  private getNumPagesFromLength(length?: StoryLength): number {
    switch (length) {
      case 'short': return 5;
      case 'medium': return 8;
      case 'long': return 12;
      default: return 5;
    }
  }
  
  private convertProgressStage(message: string): string {
    return "gerando-historia";
  }
  
  static getGeminiApiKey(): string {
    return '';
  }

  static setGeminiApiKey(apiKey: string): boolean {
    console.warn('Gemini API is no longer supported, using OpenAI instead');
    return false;
  }

  static isGeminiApiKeyValid(): boolean {
    return false;
  }

  static isOpenAIConfigured(): boolean {
    const apiKey = localStorage.getItem('openai_api_key');
    return Boolean(apiKey && apiKey.length > 10 && apiKey !== 'undefined' && apiKey !== 'null');
  }

  static async generateStory(storyParams: Story, progressCallback?: (message: string, progress: number) => void): Promise<CompleteStory> {
    if (!this.isOpenAIConfigured()) {
      window.dispatchEvent(new CustomEvent('storybot_api_issue'));
      throw new Error('API key não encontrada ou inválida. Configure a chave da API OpenAI nas configurações.');
    }
    
    try {
      if (this.isGenerating) {
        throw new Error('Já existe uma geração em andamento.');
      }
      
      this.abortController = new AbortController();
      this.isGenerating = true;
      
      this.currentStoryId = uuidv4();
      const storyId = this.currentStoryId;
      
      progressCallback?.('Preparando o StoryBot...', 5);
      
      let systemPrompt;
      try {
        systemPrompt = await this.getStoryBotPrompt();
      } catch (error) {
        console.warn("Error getting StoryBot prompt, using default:", error);
        systemPrompt = this.getDefaultStoryBotPrompt();
      }
      
      progressCallback?.('Criando uma história incrível...', 15);
      
      let characterDetails = '';
      if (storyParams.character_name) {
        try {
          // First check if we have a character prompt in localStorage (selected from the StoryBot page)
          const savedCharacterPrompt = localStorage.getItem('character_prompt');
          const savedCharacterName = localStorage.getItem('character_name');
          
          if (savedCharacterPrompt && savedCharacterName && savedCharacterName === storyParams.character_name) {
            console.log("Using saved character prompt for:", savedCharacterName);
            characterDetails = savedCharacterPrompt;
          } else {
            // Fallback to fetching from database
            characterDetails = await this.getCharacterPrompt(storyParams.character_name);
          }
        } catch (error) {
          console.warn("Error getting character prompt, continuing without it:", error);
        }
      }
      
      const fullPrompt = this.buildStoryPrompt(storyParams, characterDetails);
      
      progressCallback?.('O StoryBot está escrevendo sua história...', 25);
      
      // Switch to using OpenAI API
      const openAIKey = localStorage.getItem('openai_api_key') || '';
      if (!openAIKey || openAIKey.length < 10) {
        throw new Error('Chave da API OpenAI inválida ou muito curta');
      }
      
      const { openai } = await import('@/lib/openai');
      
      progressCallback?.('Criando a narrativa e os personagens...', 40);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Tempo limite excedido ao gerar história')), 60000);
      });
      
      let responseText;
      try {
        const result = await Promise.race([
          openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: fullPrompt }
            ],
            temperature: 0.7,
            max_tokens: 4000
          }),
          timeoutPromise
        ]) as any;
        
        responseText = result.choices[0].message.content;
      } catch (error: any) {
        console.error("Error getting response from OpenAI:", error);
        
        if (error.name === 'AbortError' || error.message?.includes('cancelada')) {
          throw new Error('A geração foi cancelada.');
        } else if (error.message?.includes('Tempo limite')) {
          throw error;
        } else if (error.message && (
            error.message.includes("quota") || 
            error.message.includes("429") || 
            error.message.includes("rate limit")
          )) {
          throw new Error('QUOTA_EXCEEDED: ' + error.message);
        } else {
          throw new Error(`Erro ao gerar história com OpenAI: ${error.message || 'Erro desconhecido'}`);
        }
      }
      
      if (!responseText || responseText.trim().length < 50) {
        throw new Error('A resposta gerada é muito curta ou vazia. Por favor, tente novamente.');
      }
      
      progressCallback?.('Formatando a história em páginas...', 60);
      
      const parsedStory = this.parseStoryResponse(responseText, storyParams.title || 'História sem título');
      
      if (parsedStory.pages.length === 0) {
        throw new Error('Não foi possível extrair páginas da história gerada. Por favor, tente novamente.');
      }
      
      this.enhanceImagePrompts(parsedStory, storyParams);
      
      progressCallback?.('Salvando sua história...', 85);
      
      if (this.currentStoryId !== storyId) {
        throw new Error('A geração foi cancelada.');
      }
      
      try {
        await this.saveStoryToDatabase(parsedStory, storyParams);
      } catch (error) {
        console.warn("Could not save story to database, but will continue with memory-only version:", error);
      }
      
      progressCallback?.('História concluída com sucesso!', 100);
      
      this.isGenerating = false;
      this.abortController = null;
      this.currentStoryId = null;
      
      return parsedStory;
    } catch (error: any) {
      this.isGenerating = false;
      this.abortController = null;
      
      if (error.name === 'AbortError') {
        throw new Error('A geração da história foi cancelada.');
      }
      
      console.error('Error generating story:', error);
      throw error;
    }
  }
  
  static cancelGeneration(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isGenerating = false;
    this.currentStoryId = null;
  }
  
  static async getStoryBotPrompt(): Promise<string> {
    try {
      try {
        const { data, error } = await supabase
          .from('storybot_prompts')
          .select('prompt')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          console.warn('Error fetching StoryBot prompt, using default:', error);
          return localStorage.getItem('storybot_prompt') || this.getDefaultStoryBotPrompt();
        }
        
        return data.prompt;
      } catch (error) {
        console.warn('Using default prompt due to error:', error);
        return this.getDefaultStoryBotPrompt();
      }
    } catch (error) {
      console.error('Error getting StoryBot prompt:', error);
      return this.getDefaultStoryBotPrompt();
    }
  }
  
  static async getCharacterPrompt(characterName: string): Promise<string> {
    try {
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('generation_prompt, description, personality, age')
          .eq('name', characterName)
          .single();
        
        if (error) {
          console.warn(`Error fetching character prompt for ${characterName}:`, error);
          return '';
        }
        
        if (data.generation_prompt) {
          return data.generation_prompt;
        } else if (data.description) {
          return `Personagem: ${characterName}
Idade: ${data.age || 'Não especificada'}
Descrição: ${data.description}
Personalidade: ${data.personality || 'Não especificada'}`;
        }
      } catch (error) {
        console.warn(`Character prompt fetch failed for ${characterName}:`, error);
      }
      
      return '';
    } catch (error) {
      console.error('Error getting character prompt:', error);
      return '';
    }
  }
  
  static buildStoryPrompt(storyParams: Story, characterDetails: string): string {
    const {
      title,
      character_name,
      character_age,
      theme,
      setting,
      style,
      moral,
      language,
      reading_level,
      num_pages,
    } = storyParams;
    
    let prompt = 'Crie uma história infantil com as seguintes características:\n\n';
    
    if (title) prompt += `Título: ${title}\n`;
    if (character_name) prompt += `Personagem principal: ${character_name}\n`;
    if (character_age) prompt += `Idade do personagem: ${character_age}\n`;
    if (theme) prompt += `Tema: ${theme}\n`;
    if (setting) prompt += `Cenário: ${setting}\n`;
    if (style) prompt += `Estilo: ${style}\n`;
    if (moral) prompt += `Moral/Lição: ${moral}\n`;
    if (language) prompt += `Idioma: ${language}\n`;
    if (reading_level) prompt += `Nível de leitura: ${reading_level}\n`;
    if (num_pages) prompt += `Número de páginas: ${num_pages}\n`;
    
    if (num_pages) {
      prompt += `\nIMPORTANTE: A história DEVE ter EXATAMENTE ${num_pages} páginas numeradas, nem mais nem menos.\n`;
    }
    
    if (characterDetails) {
      prompt += `\nDetalhes do personagem:\n${characterDetails}\n`;
    }
    
    prompt += `\nCada página deve ser claramente separada por "PÁGINA X:" e após o texto de cada página, inclua "PROMPT DA IMAGEM:" com uma descrição detalhada da cena para geração de ilustração no estilo PAPERCRAFT (arte em camadas de papel recortado com efeito 3D). Garanta que todos os elementos importantes da cena estejam incluídos no prompt da imagem e que as características do personagem principal permaneçam consistentes em toda a história.\n`;
    
    return prompt;
  }
  
  static parseStoryResponse(responseText: string, defaultTitle: string): CompleteStory {
    let title = defaultTitle;
    const titleMatch = responseText.match(/^#\s*(.+)$/m) || responseText.match(/^Título:\s*(.+)$/m);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }
    
    const pageRegex = /PÁGINA\s*(\d+):([\s\S]*?)(?=PÁGINA\s*\d+:|PROMPT DA IMAGEM:|$)/gi;
    const promptRegex = /PROMPT DA IMAGEM:([\s\S]*?)(?=PÁGINA\s*\d+:|PROMPT DA IMAGEM:|$)/gi;
    
    const pages: StoryPage[] = [];
    let pageMatch;
    let pageIndex = 0;
    
    if (!responseText.match(pageRegex)) {
      const paragraphs = responseText.split(/\n\n+/);
      
      for (let i = 0; i < paragraphs.length; i += 3) {
        pageIndex++;
        const pageContent = paragraphs.slice(i, i + 3).join('\n\n');
        
        if (!pageContent.trim()) continue;
        
        pages.push({
          text: pageContent,
          page_number: pageIndex,
          image_prompt: `Uma ilustração para um livro infantil mostrando a cena: ${pageContent.substring(0, 150)}...`,
        });
      }
    } else {
      while ((pageMatch = pageRegex.exec(responseText)) !== null) {
        const pageNumber = parseInt(pageMatch[1], 10);
        const pageContent = pageMatch[2].trim();
        
        let imagePrompt = '';
        let promptMatch;
        promptRegex.lastIndex = pageMatch.index + pageMatch[0].length;
        
        if ((promptMatch = promptRegex.exec(responseText)) !== null) {
          if (promptMatch.index < pageRegex.lastIndex || pageRegex.lastIndex === 0) {
            imagePrompt = promptMatch[1].trim();
          }
        }
        
        pages.push({
          text: pageContent,
          page_number: pageNumber,
          image_prompt: imagePrompt,
        });
      }
      
      pages.sort((a, b) => a.page_number - b.page_number);
    }
    
    return {
      title,
      character_name: '',
      pages,
    };
  }
  
  static async saveStoryToDatabase(parsedStory: CompleteStory, storyParams?: Story): Promise<CompleteStory> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }
      
      const hasCharacterPromptColumn = await this.checkColumnExists('stories', 'character_prompt');
      
      // Fix: Use storyParams instead of undefined 'story' variable
      const storyData: Record<string, any> = {
        id: parsedStory.id || this.currentStoryId || uuidv4(),
        title: parsedStory.title || (storyParams?.title || ''),
        character_name: storyParams?.character_name || parsedStory.character_name || '',
        character_age: storyParams?.character_age || parsedStory.character_age || '',
        theme: storyParams?.theme || parsedStory.theme || '',
        setting: storyParams?.setting || parsedStory.setting || '',
        style: storyParams?.style || parsedStory.style || '',
        moral: storyParams?.moral || parsedStory.moral || '',
        language: storyParams?.language || parsedStory.language || 'Português',
        reading_level: storyParams?.reading_level || parsedStory.reading_level || 'Intermediário',
        user_id: user.id,
        published: true
      };
      
      if (hasCharacterPromptColumn) {
        storyData.character_prompt = storyParams?.character_prompt || '';
      }
      
      const { data: insertedStory, error } = await supabase
        .from('stories')
        .insert(storyData)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting story:', error);
        throw new Error(`Erro ao salvar história: ${error.message}`);
      }
      
      try {
        const pageInserts = parsedStory.pages.map(page => ({
          story_id: insertedStory.id,
          page_number: page.page_number,
          content: page.text,
          image_prompt: page.image_prompt || '',
          image_url: page.image_url || '',
        }));
        
        const { error: pagesError } = await supabase
          .from('story_pages')
          .insert(pageInserts);
        
        if (pagesError) {
          console.error('Error inserting pages:', pagesError);
          
          await supabase.from('stories').delete().eq('id', insertedStory.id);
          
          throw new Error(`Erro ao salvar páginas da história: ${pagesError.message}`);
        }
      } catch (error) {
        console.error('Error with story pages:', error);
      }
      
      return {
        ...storyData,
        pages: parsedStory.pages,
        id: insertedStory.id,
        title: parsedStory.title,
        character_name: storyParams?.character_name || parsedStory.character_name || ''
      };
    } catch (error: any) {
      console.error('Error saving story to database:', error);
      throw error;
    }
  }
  
  static async checkColumnExists(table: string, column: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(table)
        .select(column)
        .limit(1);
        
      return error === null;
    } catch (error) {
      console.warn(`Column ${column} doesn't exist in ${table}:`, error);
      return false;
    }
  }
  
  static getDefaultStoryBotPrompt(): string {
    return `Você é um assistente de criação de histórias infantis chamado StoryBot. Você deve criar histórias interessantes, educativas e apropriadas para crianças, baseadas nas informações fornecidas pelo usuário.

Suas respostas devem ser:
1. Criativas e envolventes
2. Apropriadas para a idade indicada e nível de leitura especificado
3. No idioma solicitado (português do Brasil por padrão)
4. Livres de conteúdo assustador, violento ou inadequado
5. Bem estruturadas com começo, meio e fim
6. Ricas em detalhes visuais e sensoriais
7. Com personagens cativantes e memoráveis
8. Transmitir a lição moral solicitada de forma natural e não forçada

Quando o usuário fornecer informações sobre um personagem específico (como nome, descrição e personalidade), você deve criar uma história onde esse personagem seja o protagonista principal. O personagem deve manter suas características exatas conforme descritas pelo usuário, e a história deve desenvolver-se em torno dele.

Cada página deve ter conteúdo substancial com pelo menos 2-3 parágrafos (cerca de 100-150 palavras) para criar uma experiência de leitura rica.

Ajuste a complexidade do vocabulário e das sentenças de acordo com o nível de leitura indicado:
- Iniciante (4-6 anos): Frases curtas e simples, vocabulário básico
- Intermediário (7-9 anos): Frases mais elaboradas, vocabulário moderado
- Avançado (10-12 anos): Estruturas mais complexas, vocabulário rico

Para as imagens, forneça descrições visuais detalhadas após cada página da história. Estas descrições serão usadas para gerar ilustrações. As descrições devem:
1. Capturar o momento principal daquela parte da história
2. Incluir detalhes sobre expressões dos personagens, cores, ambiente e ação
3. Ser específicas sobre elementos visuais importantes
4. Evitar elementos abstratos difíceis de representar visualmente
5. Ter aproximadamente 50-100 palavras`;
  }

  static generateFallbackStory(params: Story): CompleteStory {
    console.log("Using fallback story generator with params:", params);
    
    // Ensure we respect the requested page count
    const numPages = params.num_pages || 5;
    
    const titles = [
      `A Grande Aventura de ${params.character_name}`,
      `${params.character_name} e a Jornada Mágica`,
      `O Incrível Mundo de ${params.character_name}`,
      `${params.character_name} Descobre ${params.setting}`,
      `A Missão Especial de ${params.character_name}`
    ];
    
    const title = titles[Math.floor(Math.random() * titles.length)];
    
    const storyStarters = [
      `Era uma vez, ${params.character_name}, uma criança de ${params.character_age} anos, que adorava explorar novos lugares.`,
      `${params.character_name} sempre sonhou em visitar ${params.setting}.`,
      `Em um dia ensolarado, ${params.character_name} encontrou um mapa misterioso.`,
      `${params.character_name} e seus amigos estavam brincando quando algo incrível aconteceu.`,
      `A aventura de ${params.character_name} começou quando um estranho pacote chegou à sua porta.`
    ];
    
    const middles = [
      `Durante sua jornada em ${params.setting}, ${params.character_name} descobriu um segredo antigo.`,
      `No caminho, ${params.character_name} fez novos amigos que ajudaram na aventura.`,
      `A missão não seria fácil, mas ${params.character_name} estava determinado(a) a continuar.`,
      `Com coragem e inteligência, ${params.character_name} enfrentou todos os desafios.`,
      `A cada passo, ${params.character_name} aprendeu algo novo sobre ${params.theme}.`
    ];
    
    const endings = [
      `No final, ${params.character_name} entendeu a importância de ${params.moral || 'amizade'}.`,
      `A aventura terminou, mas as lições aprendidas ficariam para sempre.`,
      `${params.character_name} voltou para casa cheio(a) de histórias para contar.`,
      `E assim ${params.character_name} salvou o dia, usando suas habilidades especiais.`,
      `Todos celebraram a vitória de ${params.character_name}, o(a) verdadeiro(a) herói(heroína) de ${params.setting}.`
    ];
    
    const pages = [];
    
    for (let i = 0; i < numPages; i++) {
      let pageText;
      
      if (i === 0) {
        pageText = storyStarters[Math.floor(Math.random() * storyStarters.length)];
      } else if (i === numPages - 1) {
        pageText = endings[Math.floor(Math.random() * endings.length)];
      } else {
        if (i < 3) {
          pageText = middles[Math.floor(Math.random() * middles.length)];
        } else {
          pageText = `${params.character_name} continuou sua jornada em ${params.setting}, descobrindo novos segredos a cada momento.`;
          
          if (i % 2 === 0) {
            pageText += ` As cores vibrantes e os sons misteriosos criavam uma atmosfera mágica.`;
          } else {
            pageText += ` Cada desafio superado tornava ${params.character_name} mais forte e sábio(a).`;
          }
        }
      }
      
      pages.push({
        text: pageText,
        page_number: i + 1,
        image_prompt: `Ilustração para página ${i+1}: ${pageText}`
      });
    }
    
    return {
      title,
      character_name: params.character_name || '',
      pages
    };
  }
  
  private saveToSessionStorage(story: CompleteStory): void {
    try {
      if (!story.id) {
        story.id = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
      
      sessionStorage.setItem('current_story', JSON.stringify(story));
      
      const savedStoriesJson = sessionStorage.getItem('saved_stories') || '[]';
      const savedStories: CompleteStory[] = JSON.parse(savedStoriesJson);
      
      const existingIndex = savedStories.findIndex(s => s.id === story.id);
      if (existingIndex >= 0) {
        savedStories[existingIndex] = story;
      } else {
        savedStories.push(story);
      }
      
      sessionStorage.setItem('saved_stories', JSON.stringify(savedStories));
      
      console.log("Story saved to session storage successfully:", story.id);
    } catch (error) {
      console.error("Error saving story to session storage:", error);
    }
  }
  
  static getStoriesFromSessionStorage(): CompleteStory[] {
    try {
      const savedStoriesJson = sessionStorage.getItem('saved_stories') || '[]';
      return JSON.parse(savedStoriesJson);
    } catch (error) {
      console.error("Error retrieving stories from session storage:", error);
      return [];
    }
  }
  
  static getStoryById(id: string): CompleteStory | null {
    try {
      const savedStoriesJson = sessionStorage.getItem('saved_stories') || '[]';
      const savedStories: CompleteStory[] = JSON.parse(savedStoriesJson);
      const story = savedStories.find(s => s.id === id);
      
      if (story) return story;
      
      const currentStoryJson = sessionStorage.getItem('current_story');
      if (currentStoryJson) {
        const currentStory: CompleteStory = JSON.parse(currentStoryJson);
        if (currentStory.id === id) return currentStory;
      }
      
      return null;
    } catch (error) {
      console.error("Error retrieving story from session storage:", error);
      return null;
    }
  }
  
  static enhanceImagePrompts(story: CompleteStory, storyParams: Story): void {
    // Tentar carregar o template personalizado
    const imagePromptTemplate = localStorage.getItem('image_prompt_template');
    
    if (!imagePromptTemplate) {
      console.log("Nenhum template de prompt de imagem personalizado encontrado, usando o padrão");
      return;
    }
    
    // Aprimorar cada prompt de imagem usando o template
    for (let i = 0; i < story.pages.length; i++) {
      const page = story.pages[i];
      const originalPrompt = page.image_prompt || `Ilustração para a página ${i+1}: ${page.text.substring(0, 100)}...`;
      
      // Extrair elementos importantes da cena
      const sceneElements = this.extractSceneElements(page.text);
      const emotion = this.detectEmotion(page.text);
      
      // Substituir as variáveis no template
      let enhancedPrompt = imagePromptTemplate
        .replace(/{personagem}/g, storyParams.character_name)
        .replace(/{caracteristicas_do_personagem}/g, storyParams.character_prompt || 'personagem colorido')
        .replace(/{cenario}/g, storyParams.setting || '')
        .replace(/{tema}/g, storyParams.theme || '')
        .replace(/{elementos_da_cena}/g, sceneElements)
        .replace(/{texto_da_pagina}/g, originalPrompt)
        .replace(/{emocao}/g, emotion);
        
      // Adicionar informações sobre o número da página
      enhancedPrompt += ` (Página ${i+1} de ${story.pages.length})`;
      
      // Atualizar o prompt da imagem na história
      story.pages[i].image_prompt = enhancedPrompt;
    }
    
    console.log("Prompts de imagem aprimorados com o template papercraft");
  }
  
  static extractSceneElements(pageText: string): string {
    // Lista de palavras-chave para procurar (substantivos comuns em histórias)
    const keywords = [
      'árvore', 'floresta', 'castelo', 'montanha', 'rio', 'lago', 'oceano', 'praia',
      'nave', 'estrela', 'planeta', 'lua', 'sol', 'céu', 'nuvem', 'animal', 'pássaro',
      'peixe', 'dinossauro', 'dragão', 'monstro', 'caverna', 'casa', 'porta', 'janela',
      'jardim', 'flor', 'planta', 'barco', 'navio', 'ponte', 'caminho', 'estrada'
    ];
    
    // Identificar os elementos presentes no texto
    const foundElements: string[] = [];
    for (const keyword of keywords) {
      if (pageText.toLowerCase().includes(keyword)) {
        foundElements.push(keyword);
      }
    }
    
    // Se não encontrar elementos suficientes, extrair substantivos do texto
    if (foundElements.length < 3) {
      const words = pageText.split(/\s+/).filter(word => word.length > 4);
      const additionalElements = words.slice(0, 5);
      foundElements.push(...additionalElements);
    }
    
    // Retornar uma lista formatada dos elementos
    return foundElements.length > 0 
      ? foundElements.slice(0, 6).join(', ')
      : 'elementos da cena baseados no texto da história';
  }
  
  static detectEmotion(pageText: string): string {
    const emotionKeywords: Record<string, string[]> = {
      'alegria': ['feliz', 'alegre', 'contente', 'sorriso', 'sorriu', 'divertido', 'gargalhada', 'brincava'],
      'tristeza': ['triste', 'chorou', 'lágrima', 'solitário', 'sozinho', 'desanimado', 'chateado'],
      'surpresa': ['surpresa', 'espanto', 'assustado', 'chocado', 'impressionado', 'maravilhado'],
      'medo': ['medo', 'assustado', 'terrível', 'perigoso', 'tremendo', 'apavorado'],
      'curiosidade': ['curioso', 'interessado', 'explorou', 'descobriu', 'investigou', 'procurou'],
      'determinação': ['determinado', 'forte', 'corajoso', 'persistente', 'tentava', 'decidido'],
      'amizade': ['amigo', 'juntos', 'ajudou', 'companheiro', 'parceiro', 'compartilhar']
    };
    
    // Contar ocorrências de cada emoção no texto
    const counts: Record<string, number> = {};
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      counts[emotion] = keywords.reduce((count, word) => {
        return count + (pageText.toLowerCase().includes(word) ? 1 : 0);
      }, 0);
    }
    
    // Identificar a emoção predominante
    let predominantEmotion = 'curiosidade'; // emoção padrão
    let highestCount = 0;
    
    for (const [emotion, count] of Object.entries(counts)) {
      if (count > highestCount) {
        highestCount = count;
        predominantEmotion = emotion;
      }
    }
    
    return predominantEmotion;
  }
}
