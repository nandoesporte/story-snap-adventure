
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

type Message = {
  role: "user" | "assistant";
  content: string;
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
    const geminiApiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
    const openAIApiKey = localStorage.getItem('openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY;

    if (geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiApiKey);
    }

    if (openAIApiKey) {
      this.openAIClient = new OpenAI({ apiKey: openAIApiKey, dangerouslyAllowBrowser: true });
    }
  }

  setUseOpenAI(use: boolean, model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini') {
    this.useOpenAI = use;
    this.openAIModel = model;
  }

  async generateStoryBotResponse(messages: Message[], userPrompt: string) {
    if (this.useOpenAI && this.openAIClient) {
      return this.generateOpenAIResponse(messages, userPrompt);
    } else if (this.geminiClient) {
      return this.generateGeminiResponse(messages, userPrompt);
    }

    throw new Error('No AI client available');
  }

  private async generateOpenAIResponse(messages: Message[], userPrompt: string) {
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

  private async generateGeminiResponse(messages: Message[], userPrompt: string) {
    if (!this.geminiClient) throw new Error('Gemini client not initialized');

    const geminiApiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) throw new Error('Gemini API key not found');

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
  ): Promise<{title: string; content: string[]; imagePrompts: string[]}> {
    // Criar um prompt estruturado para gerar a história completa
    const prompt = `Crie uma história infantil completa com as seguintes características:
    
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

    try {
      let response;
      if (this.useOpenAI && this.openAIClient) {
        const completion = await this.openAIClient.chat.completions.create({
          model: this.openAIModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7,
        });
        response = completion.choices[0].message.content || '';
      } else if (this.geminiClient) {
        const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const result = await model.generateContent(prompt);
        const genResponse = await result.response;
        response = genResponse.text();
      } else {
        throw new Error('Nenhum cliente de IA disponível');
      }

      // Processar a resposta para extrair título, conteúdo e prompts de ilustração
      return this.processStoryResponse(response);
    } catch (error) {
      console.error("Erro ao gerar história:", error);
      throw new Error('Falha ao gerar história completa');
    }
  }

  private processStoryResponse(response: string): {title: string; content: string[]; imagePrompts: string[]} {
    // Extrair o título
    const titleMatch = response.match(/TÍTULO:\s*(.*?)(?:\r?\n|$)/i) || 
                       response.match(/TITULO:\s*(.*?)(?:\r?\n|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : "História Personalizada";

    // Extrair páginas e prompts de ilustração
    const contentPages: string[] = [];
    const imagePrompts: string[] = [];

    // Padrão para capturar páginas numeradas (permite variações na formatação)
    const pageRegex = /PÁGINA\s*(\d+):\s*([\s\S]*?)(?=ILUSTRAÇÃO\s*\d+:|ILUSTRACAO\s*\d+:|PROMPT\s*DA\s*IMAGEM|PROMPT\s*DE\s*IMAGEM|PÁGINA\s*\d+:|PAGINA\s*\d+:|$)/gi;
    
    // Padrão para capturar prompts de ilustração
    const illustrationRegex = /(?:ILUSTRAÇÃO\s*\d+:|ILUSTRACAO\s*\d+:|PROMPT\s*DA\s*IMAGEM|PROMPT\s*DE\s*IMAGEM):\s*([\s\S]*?)(?=PÁGINA\s*\d+:|PAGINA\s*\d+:|$)/gi;

    // Extrair conteúdo das páginas
    let pageMatch;
    while ((pageMatch = pageRegex.exec(response)) !== null) {
      if (pageMatch[2].trim()) {
        contentPages.push(pageMatch[2].trim());
      }
    }

    // Extrair prompts de ilustração
    let illustrationMatch;
    while ((illustrationMatch = illustrationRegex.exec(response)) !== null) {
      if (illustrationMatch[1].trim()) {
        imagePrompts.push(illustrationMatch[1].trim());
      }
    }

    // Garantir que temos o mesmo número de páginas e prompts
    while (imagePrompts.length < contentPages.length) {
      imagePrompts.push(`Ilustração para a história "${title}"`);
    }

    // Se por algum motivo não conseguimos extrair as páginas, tentar outro método
    if (contentPages.length === 0) {
      // Separar por linhas em branco e tentar extrair conteúdo
      const paragraphs = response.split('\n\n').filter(para => 
        para.trim().length > 0 && 
        !para.match(/TÍTULO:|TITULO:/i) &&
        !para.match(/ILUSTRAÇÃO|ILUSTRACAO|PROMPT/i)
      );
      
      if (paragraphs.length > 0) {
        // Dividir os parágrafos em páginas (aproximadamente 2-3 parágrafos por página)
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
    // Enhanced prompt with story context for better image generation
    const prompt = `Crie uma descrição detalhada para uma ilustração de livro infantil.
    A cena deve apresentar o personagem ${characterName}, uma criança de ${childAge} anos,
    em uma aventura no cenário de ${setting} com tema de ${theme}.
    
    Contexto da história: ${storyContext || "Uma aventura infantil"}
    
    A ilustração deve refletir a seguinte parte da história: ${pageText}.
    
    ${moralTheme ? `Esta cena deve refletir a mensagem moral sobre ${moralTheme}.` : ''}
    
    A descrição deve ser rica em detalhes visuais e adequada para guiar um artista na criação da imagem.
    Inclua detalhes sobre as expressões faciais do personagem, o ambiente ao redor, cores, iluminação e a atmosfera geral da cena.
    Descreva as roupas do personagem, postura e ação no momento.
    A descrição deve ter no máximo 150 palavras.`;

    try {
      if (this.useOpenAI && this.openAIClient) {
        const response = await this.openAIClient.chat.completions.create({
          model: this.openAIModel,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
          temperature: 0.7,
        });

        return response.choices[0].message.content || `Ilustração detalhada de ${characterName} em ${setting} com tema de ${theme}.`;
      } else if (this.geminiClient) {
        const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } else {
        throw new Error('Nenhum cliente de IA disponível.');
      }
    } catch (error) {
      console.error("Erro ao gerar descrição da imagem:", error);
      return `Ilustração detalhada de ${characterName} em uma aventura no cenário de ${setting} com tema de ${theme}.`;
    }
  }
}
