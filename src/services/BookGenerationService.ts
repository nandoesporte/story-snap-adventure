import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { reinitializeGeminiAI } from '@/lib/openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Type definitions that are needed in other components
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
  character_prompt?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  cover_image?: string;
  published?: boolean;
}

export interface CompleteStory extends Story {
  pages: StoryPage[];
}

export class BookGenerationService {
  // Global tracking for generation
  static currentStoryId: string | null = null;
  static isGenerating: boolean = false;
  static abortController: AbortController | null = null;
  
  // Instance properties for the instance-based approach
  private data: StoryInputData;
  private progressCallback?: (stage: string, percent: number) => void;
  private errorCallback?: (message: string) => void;
  
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
  
  /**
   * Generate the story content based on the input data
   */
  public async generateStoryContent(): Promise<GeneratedStory | null> {
    try {
      // Convert the instance data to the format expected by the static method
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
        num_pages: this.getNumPagesFromLength(this.data.length)
      };
      
      // Use the static method to generate the story
      const result = await BookGenerationService.generateStory(
        storyParams,
        (message, progress) => {
          this.progressCallback?.(this.convertProgressStage(message), progress);
        }
      );
      
      // Convert the result to GeneratedStory format
      return {
        title: result.title,
        content: result.pages.map(page => page.text)
      };
    } catch (error: any) {
      console.error("Error in generateStoryContent:", error);
      this.errorCallback?.(error.message);
      return null;
    }
  }
  
  /**
   * Generate the complete story with illustrations
   */
  public async generateCompleteStory(): Promise<CompleteStory | null> {
    // For now, this is a placeholder that just returns the story content
    // without generating illustrations
    try {
      const storyContent = await this.generateStoryContent();
      if (!storyContent) return null;
      
      // Convert to CompleteStory format
      const completeStory: CompleteStory = {
        title: storyContent.title,
        character_name: this.data.characterName || this.data.childName,
        pages: storyContent.content.map((text, index) => ({
          text,
          page_number: index + 1,
          image_prompt: `Illustration for page ${index + 1}: ${text.substring(0, 100)}...`
        }))
      };
      
      return completeStory;
    } catch (error) {
      console.error("Error in generateCompleteStory:", error);
      return null;
    }
  }
  
  private getNumPagesFromLength(length?: StoryLength): number {
    switch (length) {
      case 'short': return 5;
      case 'medium': return 10;
      case 'long': return 15;
      default: return 5;
    }
  }
  
  private convertProgressStage(message: string): string {
    if (message.includes("Preparando")) return "preparando";
    if (message.includes("Criando uma história")) return "gerando-historia";
    if (message.includes("StoryBot está escrevendo")) return "gerando-historia";
    if (message.includes("Criando a narrativa")) return "gerando-historia";
    if (message.includes("Formatando")) return "gerando-historia";
    if (message.includes("Salvando")) return "finalizando";
    if (message.includes("concluída")) return "concluido";
    return "gerando-historia";
  }
  
  /**
   * Get the Gemini API key from localStorage or environment
   */
  static getGeminiApiKey(): string {
    return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  /**
   * Set the Gemini API key in localStorage
   */
  static setGeminiApiKey(apiKey: string): void {
    localStorage.setItem('gemini_api_key', apiKey);
    // Reinitialize the Gemini API with the new key
    reinitializeGeminiAI(apiKey);
  }

  /**
   * Check if the Gemini API key is valid
   */
  static isGeminiApiKeyValid(): boolean {
    const apiKey = this.getGeminiApiKey();
    return !!apiKey && apiKey.length > 0 && apiKey !== 'undefined';
  }

  /**
   * Generate a children's story based on user inputs
   */
  static async generateStory(storyParams: Story, progressCallback?: (message: string, progress: number) => void): Promise<CompleteStory> {
    // Check if we have an API key first
    if (!this.isGeminiApiKeyValid()) {
      throw new Error('API key não encontrada. Configure a chave da API Gemini nas configurações.');
    }
    
    try {
      if (this.isGenerating) {
        throw new Error('Já existe uma geração em andamento.');
      }
      
      // Set up abort controller for cancellation
      this.abortController = new AbortController();
      this.isGenerating = true;
      
      // Start with a new story ID
      this.currentStoryId = uuidv4();
      const storyId = this.currentStoryId;
      
      // Update progress
      progressCallback?.('Preparando o StoryBot...', 5);
      
      // Get the system prompt for story generation
      const systemPrompt = await this.getStoryBotPrompt();
      
      // Create the full prompt with user inputs
      progressCallback?.('Criando uma história incrível...', 15);
      
      // Fetch character prompt if available
      let characterDetails = '';
      if (storyParams.character_name) {
        characterDetails = await this.getCharacterPrompt(storyParams.character_name);
      }
      
      const fullPrompt = this.buildStoryPrompt(storyParams, characterDetails);
      
      progressCallback?.('O StoryBot está escrevendo sua história...', 25);
      
      // Initialize Gemini API with the current API key
      const gemini = new GoogleGenerativeAI(this.getGeminiApiKey());
      
      // Get the generative model
      const model = gemini.getGenerativeModel({ 
        model: 'gemini-1.0-pro',
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 8000,
        },
      });
      
      // Create a chat session with the system prompt
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'Entendido! Estou pronto para criar histórias infantis encantadoras e educativas como o StoryBot. Como posso ajudar hoje?' }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 8000,
        },
      });
      
      progressCallback?.('Criando a narrativa e os personagens...', 40);
      
      // Generate the story
      const result = await chat.sendMessage(fullPrompt, {
        signal: this.abortController?.signal,
      });
      
      progressCallback?.('Formatando a história em páginas...', 60);
      
      // Process the response text
      const responseText = result.response.text();
      const parsedStory = this.parseStoryResponse(responseText, storyParams.title || 'História sem título');
      
      // Create entry in the database
      progressCallback?.('Salvando sua história...', 85);
      
      // Check if we're still generating the same story (hasn't been cancelled)
      if (this.currentStoryId !== storyId) {
        throw new Error('A geração foi cancelada.');
      }
      
      // Save the story to the database
      const savedStory = await this.saveStoryToDatabase(parsedStory, storyParams);
      
      progressCallback?.('História concluída com sucesso!', 100);
      
      this.isGenerating = false;
      this.abortController = null;
      this.currentStoryId = null;
      
      return savedStory;
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
  
  /**
   * Cancel the current story generation
   */
  static cancelGeneration(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isGenerating = false;
    this.currentStoryId = null;
  }
  
  /**
   * Get the StoryBot prompt from database or default
   */
  static async getStoryBotPrompt(): Promise<string> {
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
      console.error('Error getting StoryBot prompt:', error);
      return this.getDefaultStoryBotPrompt();
    }
  }
  
  /**
   * Get the character prompt by name
   */
  static async getCharacterPrompt(characterName: string): Promise<string> {
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
        // Build a basic prompt from the character details
        return `Personagem: ${characterName}
Idade: ${data.age || 'Não especificada'}
Descrição: ${data.description}
Personalidade: ${data.personality || 'Não especificada'}`;
      }
      
      return '';
    } catch (error) {
      console.error('Error getting character prompt:', error);
      return '';
    }
  }
  
  /**
   * Build the prompt for story generation
   */
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
    
    // Add character details if available
    if (characterDetails) {
      prompt += `\nDetalhes do personagem:\n${characterDetails}\n`;
    }
    
    prompt += `\nCada página deve ser claramente separada por "PÁGINA X:" e após o texto de cada página, inclua "PROMPT DA IMAGEM:" com uma descrição detalhada da cena para geração de ilustração.\n`;
    
    return prompt;
  }
  
  /**
   * Parse the response text into structured story pages
   */
  static parseStoryResponse(responseText: string, defaultTitle: string): CompleteStory {
    // Extract title if possible
    let title = defaultTitle;
    const titleMatch = responseText.match(/^#\s*(.+)$/m) || responseText.match(/^Título:\s*(.+)$/m);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }
    
    // Split text into pages
    const pageRegex = /PÁGINA\s*(\d+):([\s\S]*?)(?=PÁGINA\s*\d+:|PROMPT DA IMAGEM:|$)/gi;
    const promptRegex = /PROMPT DA IMAGEM:([\s\S]*?)(?=PÁGINA\s*\d+:|PROMPT DA IMAGEM:|$)/gi;
    
    const pages: StoryPage[] = [];
    let pageMatch;
    let pageIndex = 0;
    
    // If no explicit page markers, split by paragraphs
    if (!responseText.match(pageRegex)) {
      const paragraphs = responseText.split(/\n\n+/);
      
      // Group paragraphs into pages (3-4 paragraphs per page)
      const paragraphsPerPage = 3;
      
      for (let i = 0; i < paragraphs.length; i += paragraphsPerPage) {
        pageIndex++;
        const pageContent = paragraphs.slice(i, i + paragraphsPerPage).join('\n\n');
        
        // Skip empty pages
        if (!pageContent.trim()) continue;
        
        pages.push({
          text: pageContent,
          page_number: pageIndex,
          image_prompt: `Uma ilustração para um livro infantil mostrando a cena: ${pageContent.substring(0, 150)}...`,
        });
      }
    } else {
      // Process pages with explicit markers
      while ((pageMatch = pageRegex.exec(responseText)) !== null) {
        const pageNumber = parseInt(pageMatch[1], 10);
        const pageContent = pageMatch[2].trim();
        
        // Find image prompt for this page
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
      
      // Sort pages by page number
      pages.sort((a, b) => a.page_number - b.page_number);
    }
    
    return {
      title,
      character_name: '',  // Will be set from storyParams
      pages,
    };
  }
  
  /**
   * Save the story to the database
   */
  static async saveStoryToDatabase(parsedStory: CompleteStory, storyParams: Story): Promise<CompleteStory> {
    try {
      // Make sure we have a user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }
      
      // Create story entry
      const storyData = {
        id: this.currentStoryId || uuidv4(),
        title: parsedStory.title || storyParams.title,
        character_name: storyParams.character_name || '',
        character_age: storyParams.character_age || '',
        theme: storyParams.theme || '',
        setting: storyParams.setting || '',
        style: storyParams.style || '',
        moral: storyParams.moral || '',
        language: storyParams.language || 'Português',
        reading_level: storyParams.reading_level || 'Intermediário',
        character_prompt: storyParams.character_prompt || '',
        user_id: user.id,
        published: true,
      };
      
      // Insert story
      const { data: insertedStory, error } = await supabase
        .from('stories')
        .insert(storyData)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting story:', error);
        throw new Error(`Erro ao salvar história: ${error.message}`);
      }
      
      // Insert pages
      const pageInserts = parsedStory.pages.map(page => ({
        story_id: insertedStory.id,
        page_number: page.page_number,
        content: page.text,
        image_prompt: page.image_prompt || '',
      }));
      
      const { error: pagesError } = await supabase
        .from('story_pages')
        .insert(pageInserts);
      
      if (pagesError) {
        console.error('Error inserting pages:', pagesError);
        
        // Delete the story if page insertion failed
        await supabase.from('stories').delete().eq('id', insertedStory.id);
        
        throw new Error(`Erro ao salvar páginas da história: ${pagesError.message}`);
      }
      
      // Return the complete story with the database ID
      return {
        ...storyData,
        pages: parsedStory.pages,
        id: insertedStory.id,
      };
    } catch (error: any) {
      console.error('Error saving story to database:', error);
      throw error;
    }
  }
  
  /**
   * Default StoryBot prompt
   */
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
}
