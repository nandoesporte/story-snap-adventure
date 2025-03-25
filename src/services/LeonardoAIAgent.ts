
import { toast } from "sonner";

interface ImageGenerationParams {
  prompt: string;
  characterName: string;
  theme: string;
  setting: string;
  style?: string;
  characterPrompt?: string | null;
  childImage?: string | null;
}

interface LeonardoResponse {
  image_url?: string;
  success?: boolean;
  error?: string;
}

/**
 * LeonardoAIAgent - Responsável por gerar ilustrações consistentes usando Leonardo AI
 * Mantém características dos personagens consistentes ao longo das ilustrações
 */
export class LeonardoAIAgent {
  private webhookUrl: string | null;
  private characterPrompts: Map<string, string> = new Map();
  private characterImageStyles: Map<string, string> = new Map();
  private isAvailable: boolean = true;

  constructor(webhookUrl: string | null = null) {
    this.webhookUrl = webhookUrl;
    this.isAvailable = this.validateWebhookUrl();
    
    // Carregar prompts de personagens salvos
    this.loadSavedCharacterPrompts();
  }

  /**
   * Verifica se o webhook do Leonardo AI está configurado corretamente
   */
  private validateWebhookUrl(): boolean {
    if (!this.webhookUrl) {
      console.warn("Leonardo AI webhook não configurado");
      return false;
    }
    
    try {
      const url = new URL(this.webhookUrl);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (e) {
      console.error("URL de webhook inválida:", e);
      return false;
    }
  }

  /**
   * Carrega prompts de personagens salvos no localStorage
   */
  private loadSavedCharacterPrompts(): void {
    try {
      // Carregar prompts de personagens
      const savedPrompts = localStorage.getItem('character_prompts');
      if (savedPrompts) {
        const prompts = JSON.parse(savedPrompts);
        Object.entries(prompts).forEach(([name, prompt]) => {
          this.characterPrompts.set(name, prompt as string);
        });
        console.log("Prompts de personagens carregados:", this.characterPrompts.size);
      }
      
      // Carregar estilos visuais de personagens
      const savedStyles = localStorage.getItem('character_styles');
      if (savedStyles) {
        const styles = JSON.parse(savedStyles);
        Object.entries(styles).forEach(([name, style]) => {
          this.characterImageStyles.set(name, style as string);
        });
      }
    } catch (e) {
      console.error("Erro ao carregar prompts salvos:", e);
    }
  }

  /**
   * Salva o prompt de um personagem para manter consistência entre ilustrações
   */
  public saveCharacterPrompt(characterName: string, prompt: string): void {
    if (!characterName || !prompt) return;
    
    this.characterPrompts.set(characterName, prompt);
    
    // Persistir no localStorage
    try {
      const prompts: Record<string, string> = {};
      this.characterPrompts.forEach((value, key) => {
        prompts[key] = value;
      });
      localStorage.setItem('character_prompts', JSON.stringify(prompts));
    } catch (e) {
      console.error("Erro ao salvar prompt do personagem:", e);
    }
  }

  /**
   * Salva o estilo visual de um personagem
   */
  public saveCharacterStyle(characterName: string, style: string): void {
    if (!characterName || !style) return;
    
    this.characterImageStyles.set(characterName, style);
    
    // Persistir no localStorage
    try {
      const styles: Record<string, string> = {};
      this.characterImageStyles.forEach((value, key) => {
        styles[key] = value;
      });
      localStorage.setItem('character_styles', JSON.stringify(styles));
    } catch (e) {
      console.error("Erro ao salvar estilo do personagem:", e);
    }
  }

  /**
   * Verifica se o agente está disponível para uso
   */
  public isAgentAvailable(): boolean {
    return this.isAvailable && !!this.webhookUrl;
  }

  /**
   * Define a URL do webhook do Leonardo AI
   */
  public setWebhookUrl(url: string): boolean {
    this.webhookUrl = url;
    this.isAvailable = this.validateWebhookUrl();
    return this.isAvailable;
  }

  /**
   * Gera uma imagem usando o Leonardo AI com base em um prompt e mantendo
   * consistência com as características do personagem
   */
  public async generateImage(params: ImageGenerationParams): Promise<string> {
    if (!this.isAgentAvailable()) {
      toast.error("Agente Leonardo AI não está disponível. Verifique as configurações.");
      throw new Error("Leonardo AI agent not available");
    }

    const { prompt, characterName, theme, setting, style = "cartoon", characterPrompt, childImage } = params;
    
    // Usar o prompt salvo do personagem, se existir
    const savedPrompt = this.characterPrompts.get(characterName);
    const finalCharacterPrompt = savedPrompt || characterPrompt || null;
    
    // Usar o estilo visual salvo, se existir
    const savedStyle = this.characterImageStyles.get(characterName) || style;
    
    // Enriquecer o prompt para garantir consistência do personagem
    let enhancedPrompt = prompt;
    if (finalCharacterPrompt) {
      enhancedPrompt += ` O personagem ${characterName} possui as seguintes características: ${finalCharacterPrompt}`;
    }
    
    console.log("Gerando imagem com Leonardo AI:", {
      webhookUrl: this.webhookUrl,
      characterName,
      hasPrompt: !!finalCharacterPrompt,
      style: savedStyle
    });
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(this.webhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          character_name: characterName,
          theme,
          setting,
          style: savedStyle,
          character_prompt: finalCharacterPrompt,
          child_image: childImage
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Leonardo AI returned status: ${response.status} ${response.statusText}`);
        throw new Error(`Leonardo AI returned status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json() as LeonardoResponse;
      console.log("Leonardo AI response:", data);
      
      if (data.image_url) {
        // Quando bem-sucedido, salvar o prompt para uso futuro
        if (characterPrompt && !savedPrompt) {
          this.saveCharacterPrompt(characterName, characterPrompt);
        }
        return data.image_url;
      } else if (data.error) {
        throw new Error(`Webhook error: ${data.error}`);
      } else {
        throw new Error("Webhook não retornou uma URL de imagem");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error("Tempo limite excedido ao gerar imagem com Leonardo AI");
        throw new Error('Tempo limite excedido ao gerar imagem');
      }
      
      console.error("Error using Leonardo AI:", error);
      throw error;
    }
  }

  /**
   * Gera imagens para todas as páginas de uma história, mantendo
   * consistência visual e de personagens
   */
  public async generateStoryImages(
    storyPages: string[], 
    characterName: string,
    theme: string,
    setting: string,
    characterPrompt: string | null = null,
    style: string = "cartoon",
    childImage: string | null = null
  ): Promise<string[]> {
    if (!this.isAgentAvailable() || !storyPages.length) {
      return storyPages.map(() => "");
    }
    
    try {
      const imageUrls: string[] = [];
      
      // Gerar imagens para cada página sequencialmente para manter consistência
      for (let i = 0; i < storyPages.length; i++) {
        const pageText = storyPages[i];
        const pageNumber = i + 1;
        
        toast.info(`Gerando ilustração para página ${pageNumber} de ${storyPages.length}...`);
        
        try {
          const imageUrl = await this.generateImage({
            prompt: `Ilustração para um livro infantil representando: ${pageText}`,
            characterName,
            theme,
            setting,
            style,
            characterPrompt,
            childImage
          });
          
          imageUrls.push(imageUrl);
        } catch (error) {
          console.error(`Erro ao gerar imagem para página ${pageNumber}:`, error);
          // Usar uma imagem de placeholder para não interromper todo o processo
          imageUrls.push("/images/placeholders/illustration-placeholder.jpg");
        }
      }
      
      return imageUrls;
    } catch (error) {
      console.error("Erro ao gerar imagens da história:", error);
      // Retornar placeholders para todas as páginas
      return storyPages.map(() => "/images/placeholders/illustration-placeholder.jpg");
    }
  }
}
