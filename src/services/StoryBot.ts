import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Message = {
  role: "user" | "assistant";
  content: string;
};

export type StoryGenerationResult = {
  title: string;
  content: string[];
  imagePrompts: string[];
};

export class StoryBot {
  private useOpenAI: boolean = false;
  private openAIModel: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini';
  private openAIClient: OpenAI | null = null;
  private geminiClient: GoogleGenerativeAI | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    try {
      const geminiApiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
      const openAIApiKey = localStorage.getItem('openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY;

      if (geminiApiKey && geminiApiKey !== 'undefined' && geminiApiKey !== 'null' && geminiApiKey.trim() !== '') {
        this.geminiClient = new GoogleGenerativeAI(geminiApiKey);
        console.log("Gemini client initialized");
      } else {
        console.warn("Gemini API key not found or invalid");
      }

      if (openAIApiKey && openAIApiKey !== 'undefined' && openAIApiKey !== 'null' && openAIApiKey.trim() !== '') {
        this.openAIClient = new OpenAI({ apiKey: openAIApiKey, dangerouslyAllowBrowser: true });
        console.log("OpenAI client initialized");
      } else {
        console.warn("OpenAI API key not found or invalid");
      }
    } catch (error) {
      console.error("Error initializing AI clients:", error);
    }
  }

  setUseOpenAI(use: boolean, model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini') {
    this.useOpenAI = use;
    this.openAIModel = model;
    console.log(`Configurado para usar OpenAI ${model} para geração de histórias`);
  }

  async generateStoryBotResponse(messages: Message[], userPrompt: string): Promise<string> {
    if (this.useOpenAI && this.openAIClient) {
      return this.generateOpenAIResponse(messages, userPrompt);
    } else if (this.geminiClient) {
      return this.generateGeminiResponse(messages, userPrompt);
    }

    throw new Error('Nenhum cliente de IA disponível. Verifique suas configurações de API.');
  }

  private async generateOpenAIResponse(messages: Message[], userPrompt: string): Promise<string> {
    if (!this.openAIClient) throw new Error('OpenAI client not initialized');

    const response = await this.openAIClient.chat.completions.create({
      model: this.openAIModel,
      messages: [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    return response.choices[0].message.content || '';
  }

  private async generateGeminiResponse(messages: Message[], userPrompt: string): Promise<string> {
    if (!this.geminiClient) throw new Error('Gemini client not initialized');

    const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const chat = model.startChat({
      history: messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(userPrompt);
    const response = await result.response;
    return response.text();
  }

  isApiAvailable(): boolean {
    if (this.useOpenAI) {
      return !!this.openAIClient;
    }
    return !!this.geminiClient;
  }

  async generateStoryWithPrompts(
    characterName: string,
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string = "",
    characterPrompt: string = "",
    length: string = "medium",
    readingLevel: string = "intermediate",
    language: string = "portuguese",
    storyContext: string = ""
  ): Promise<StoryGenerationResult> {
    if (this.useOpenAI && !this.openAIClient) {
      throw new Error('A chave da API OpenAI não está configurada ou é inválida. Configure-a nas configurações.');
    }
    
    if (!this.useOpenAI && !this.geminiClient) {
      throw new Error('A chave da API Gemini não está configurada ou é inválida. Configure-a nas configurações.');
    }
    
    console.log(`Generating complete story with ${length} pages`);
    
    const prompt = this.createStoryGenerationPrompt(
      characterName, childAge, theme, setting, moralTheme,
      characterPrompt, length, readingLevel, language, storyContext
    );

    try {
      let response;
      if (this.useOpenAI && this.openAIClient) {
        response = await this.generateOpenAIStory(prompt);
      } else if (this.geminiClient) {
        response = await this.generateGeminiStory(prompt);
      } else {
        throw new Error('Nenhum cliente de IA disponível');
      }

      return this.processStoryResponse(response);
    } catch (error: any) {
      console.error("Erro ao gerar história:", error);
      
      if (error.status === 401 || (error.message && error.message.includes("401"))) {
        throw new Error('A chave da API está incorreta ou inválida. Por favor, verifique suas configurações.');
      } else if (error.status === 429 || (error.message && error.message.includes("429"))) {
        throw new Error('Limite de requisições excedido. Por favor, tente novamente mais tarde.');
      } else if (error.message && error.message.includes("quota")) {
        throw new Error('Cota da API excedida. Por favor, verifique seu plano ou tente novamente mais tarde.');
      }
      
      throw new Error('Falha ao gerar história completa: ' + (error.message || 'Erro desconhecido'));
    }
  }

  private createStoryGenerationPrompt(
    characterName: string,
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string,
    characterPrompt: string,
    length: string,
    readingLevel: string,
    language: string,
    storyContext: string
  ): string {
    return `Crie uma história infantil completa com as seguintes características:
    
    Personagem principal: ${characterName}
    Idade da criança: ${childAge} anos
    Tema: ${theme}
    Cenário: ${setting}
    Lição moral: ${moralTheme}
    Tamanho: ${length} (curto: 5 páginas, médio: 8 páginas, longo: 12 páginas)
    Nível de leitura: ${readingLevel}
    Idioma: ${language}
    
    ${characterPrompt ? `Detalhes do personagem: ${characterPrompt}` : ''}
    ${storyContext ? `Contexto adicional: ${storyContext}` : ''}
    
    A história deve:
    1. Ter um título claro
    2. Ser dividida em páginas numeradas
    3. Cada página deve ter um texto envolvente e adequado para crianças
    4. Após cada página, incluir um prompt detalhado para a ilustração que acompanhará aquela página
    
    Formato:
    TÍTULO: [Nome da história]
    
    PÁGINA 1:
    [Texto da página 1]
    
    ILUSTRAÇÃO 1:
    [Descrição detalhada para a ilustração da página 1, mencionando cores, ambiente, expressões, posições dos personagens]
    
    [Repetir para cada página]
    
    Importante: cada prompt de ilustração deve ser detalhado, visual e claro para que possa ser usado diretamente para gerar imagens.`;
  }

  private async generateOpenAIStory(prompt: string): Promise<string> {
    if (!this.openAIClient) throw new Error('Cliente OpenAI não inicializado. Verifique suas configurações.');
    
    try {
      const completion = await this.openAIClient.chat.completions.create({
        model: this.openAIModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      });
      
      return completion.choices[0].message.content || '';
    } catch (error: any) {
      console.error("Erro na requisição OpenAI:", error);
      
      if (error.status === 401) {
        throw new Error('Chave da API OpenAI inválida. Por favor, verifique suas configurações.');
      } else if (error.status === 429) {
        throw new Error('Limite de requisições da API OpenAI excedido. Por favor, tente novamente mais tarde.');
      }
      
      throw error;
    }
  }

  private async generateGeminiStory(prompt: string): Promise<string> {
    if (!this.geminiClient) throw new Error('Cliente Gemini não inicializado. Verifique suas configurações.');
    
    try {
      const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(prompt);
      const genResponse = await result.response;
      
      return genResponse.text();
    } catch (error: any) {
      console.error("Erro na requisição Gemini:", error);
      
      if (error.message && error.message.includes("API key")) {
        throw new Error('Chave da API Gemini inválida. Por favor, verifique suas configurações.');
      } else if (error.message && error.message.includes("quota")) {
        throw new Error('Cota da API Gemini excedida. Por favor, verifique seu plano ou tente novamente mais tarde.');
      }
      
      throw error;
    }
  }

  private processStoryResponse(response: string): StoryGenerationResult {
    const titleMatch = response.match(/TÍTULO:\s*(.*?)(?:\r?\n|$)/i) || 
                     response.match(/TITULO:\s*(.*?)(?:\r?\n|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : "História Personalizada";

    const contentPages: string[] = [];
    const imagePrompts: string[] = [];

    const pageRegex = /PÁGINA\s*(\d+):\s*([\s\S]*?)(?=ILUSTRAÇÃO\s*\d+:|ILUSTRACAO\s*\d+:|PROMPT\s*DA\s*IMAGEM|PROMPT\s*DE\s*IMAGEM|PÁGINA\s*\d+:|PAGINA\s*\d+:|$)/gi;
    
    const illustrationRegex = /(?:ILUSTRAÇÃO\s*\d+:|ILUSTRACAO\s*\d+:|PROMPT\s*DA\s*IMAGEM|PROMPT\s*DE\s*IMAGEM):\s*([\s\S]*?)(?=PÁGINA\s*\d+:|PAGINA\s*\d+:|$)/gi;

    let pageMatch;
    while ((pageMatch = pageRegex.exec(response)) !== null) {
      if (pageMatch[2].trim()) {
        contentPages.push(pageMatch[2].trim());
      }
    }

    let illustrationMatch;
    while ((illustrationMatch = illustrationRegex.exec(response)) !== null) {
      if (illustrationMatch[1].trim()) {
        imagePrompts.push(illustrationMatch[1].trim());
      }
    }

    while (imagePrompts.length < contentPages.length) {
      imagePrompts.push(`Ilustração para a história "${title}"`);
    }

    if (contentPages.length === 0) {
      const paragraphs = response.split('\n\n').filter(para => 
        para.trim().length > 0 && 
        !para.match(/TÍTULO:|TITULO:/i) &&
        !para.match(/ILUSTRAÇÃO|ILUSTRACAO|PROMPT/i)
      );
      
      if (paragraphs.length > 0) {
        for (let i = 0; i < paragraphs.length; i += 2) {
          const pageContent = paragraphs.slice(i, i + 2).join('\n\n');
          contentPages.push(pageContent);
          if (imagePrompts.length < contentPages.length) {
            imagePrompts.push(`Ilustração para a página ${contentPages.length} da história "${title}"`);
          }
        }
      }
    }

    return { title, content: contentPages, imagePrompts };
  }

  async generateImageDescription(
    pageText: string,
    characterName: string,
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string = "",
    storyContext: string = ""
  ): Promise<string> {
    const prompt = this.createImageDescriptionPrompt(
      pageText, characterName, childAge, theme, setting, moralTheme, storyContext
    );

    try {
      if (this.useOpenAI && this.openAIClient) {
        return this.generateOpenAIImageDescription(prompt);
      } else if (this.geminiClient) {
        return this.generateGeminiImageDescription(prompt);
      } else {
        throw new Error('Nenhum cliente de IA disponível.');
      }
    } catch (error) {
      console.error("Erro ao gerar descrição da imagem:", error);
      return `Ilustração detalhada de ${characterName} em uma aventura no cenário de ${setting} com tema de ${theme}.`;
    }
  }

  private createImageDescriptionPrompt(
    pageText: string,
    characterName: string,
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string,
    storyContext: string
  ): string {
    return `Crie uma descrição detalhada para uma ilustração de livro infantil.
    A cena deve apresentar o personagem ${characterName}, uma criança de ${childAge} anos,
    em uma aventura no cenário de ${setting} com tema de ${theme}.
    
    Contexto da história: ${storyContext || "Uma aventura infantil"}
    
    A ilustração deve refletir a seguinte parte da história: ${pageText}.
    
    ${moralTheme ? `Esta cena deve refletir a mensagem moral sobre ${moralTheme}.` : ''}
    
    A descrição deve ser rica em detalhes visuais e adequada para guiar um artista na criação da imagem.
    Inclua detalhes sobre as expressões faciais do personagem, o ambiente ao redor, cores, iluminação e a atmosfera geral da cena.
    Descreva as roupas do personagem, postura e ação no momento.
    A descrição deve ter no máximo 150 palavras.`;
  }

  private async generateOpenAIImageDescription(prompt: string): Promise<string> {
    if (!this.openAIClient) throw new Error('OpenAI client not initialized');
    
    const response = await this.openAIClient.chat.completions.create({
      model: this.openAIModel,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'Descrição de ilustração não gerada.';
  }

  private async generateGeminiImageDescription(prompt: string): Promise<string> {
    if (!this.geminiClient) throw new Error('Gemini client not initialized');
    
    const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  }
}
