
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

  async generateImageDescription(
    pageText: string,
    characterName: string,
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string = ""
  ): Promise<string> {
    const prompt = `Crie uma descrição detalhada para uma ilustração de livro infantil.
    A cena deve apresentar o personagem ${characterName}, uma criança de ${childAge} anos,
    em uma aventura no cenário de ${setting} com tema de ${theme}.
    A ilustração deve refletir a seguinte parte da história: ${pageText}.
    A descrição deve ser rica em detalhes visuais e adequada para guiar um artista na criação da imagem.
    Inclua detalhes sobre as expressões faciais do personagem, o ambiente ao redor e a atmosfera geral da cena.
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
