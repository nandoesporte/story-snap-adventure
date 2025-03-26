
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
 * LeonardoAIAgent - Responsável por gerar ilustrações consistentes usando Leonardo.ai API
 * Mantém características dos personagens consistentes ao longo das ilustrações
 */
export class LeonardoAIAgent {
  private characterPrompts: Map<string, string> = new Map();
  private characterImageStyles: Map<string, string> = new Map();
  private isAvailable: boolean = true;
  private apiKey: string | null = null;

  constructor() {
    this.isAvailable = true;
    
    // Carregar prompts de personagens salvos
    this.loadSavedCharacterPrompts();
    
    // Carregar a API key do Leonardo.ai
    this.apiKey = localStorage.getItem('leonardo_api_key');
    this.isAvailable = !!this.apiKey;
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
    return this.isAvailable && !!this.apiKey;
  }

  /**
   * Define a chave da API do Leonardo.ai
   */
  public setApiKey(apiKey: string): boolean {
    if (!apiKey) return false;
    
    this.apiKey = apiKey.trim();
    localStorage.setItem('leonardo_api_key', this.apiKey);
    this.isAvailable = true;
    
    // Limpar qualquer erro anterior
    localStorage.removeItem("leonardo_api_issue");
    
    return true;
  }

  /**
   * Gera uma imagem usando a API do Leonardo.ai com base em um prompt e mantendo
   * consistência com as características do personagem
   */
  public async generateImage(params: ImageGenerationParams): Promise<string> {
    const { prompt, characterName, theme, setting, style = "cartoon", characterPrompt, childImage } = params;
    
    if (!this.apiKey) {
      console.error("Leonardo.ai API key não configurada");
      window.dispatchEvent(new CustomEvent("leonardo_api_issue"));
      localStorage.setItem("leonardo_api_issue", "true");
      return this.getFallbackImage(theme);
    }
    
    // Usar o prompt salvo do personagem, se existir
    const savedPrompt = this.characterPrompts.get(characterName);
    const finalCharacterPrompt = savedPrompt || characterPrompt || null;
    
    // Usar o estilo visual salvo, se existir
    const savedStyle = this.characterImageStyles.get(characterName) || style;
    
    // Enriquecer o prompt para garantir consistência do personagem e melhorar as ilustrações
    let enhancedPrompt = prompt;
    
    // Adicionar detalhes específicos do personagem ao prompt
    if (finalCharacterPrompt) {
      enhancedPrompt += ` O personagem ${characterName} possui as seguintes características: ${finalCharacterPrompt}`;
    }
    
    // Adicionar instruções para estilo de ilustração de livro infantil
    enhancedPrompt += ` Ilustração de alta qualidade para livro infantil, colorida, estilo ${savedStyle === "cartoon" ? "desenho animado" : savedStyle}.`;
    
    // Adicionar instruções para composição e foco
    enhancedPrompt += " Composição central, foco no personagem principal, expressões faciais claras, cores vibrantes.";
    
    console.log("Gerando imagem com Leonardo.ai API:", {
      characterName,
      hasPrompt: !!finalCharacterPrompt,
      style: savedStyle,
      promptLength: enhancedPrompt.length
    });
    
    try {
      // Chamar a API do Leonardo.ai
      const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          modelId: "b820ea11-02bf-4652-97ae-93b22e02a0a9", // Leonardo Creative
          width: 768,
          height: 768,
          num_images: 1,
          promptMagic: true,
          presetStyle: savedStyle === "cartoon" ? "ANIME" : (savedStyle === "realistic" ? "CINEMATIC" : "CREATIVE"),
          public: false,
          nsfw: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Leonardo.ai API error:", errorData);
        throw new Error(`Leonardo.ai API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      const generationId = data.sdGenerationJob.generationId;
      
      // Aguardar a conclusão da geração
      const imageUrl = await this.pollForResults(generationId);
      
      // Quando bem-sucedido, salvar o prompt para uso futuro
      if (characterPrompt && !savedPrompt) {
        this.saveCharacterPrompt(characterName, characterPrompt);
      }
      
      return imageUrl;
    } catch (error: any) {
      console.error("Error generating image with Leonardo.ai:", error);
      
      window.dispatchEvent(new CustomEvent("leonardo_api_issue"));
      localStorage.setItem("leonardo_api_issue", "true");
      
      toast.error("Erro ao gerar imagem com Leonardo.ai. Usando imagem de placeholder.");
      
      // Retornar uma imagem placeholder baseada no tema
      return this.getFallbackImage(theme);
    }
  }

  /**
   * Consulta periodicamente o status da geração até que esteja concluída
   */
  private async pollForResults(generationId: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Leonardo.ai API key não configurada");
    }
    
    let attempts = 0;
    const maxAttempts = 30; // 5 minutos no máximo (10 segundos * 30)
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Error checking generation status (attempt ${attempts}):`, errorData);
          
          // Aguardar antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos
          continue;
        }
        
        const data = await response.json();
        
        // Verificar se a geração foi concluída
        if (data.generations_by_pk.status === "COMPLETE") {
          // Pegar a primeira imagem gerada
          const generatedImages = data.generations_by_pk.generated_images;
          if (generatedImages && generatedImages.length > 0) {
            return generatedImages[0].url;
          }
          throw new Error("No images generated");
        } else if (data.generations_by_pk.status === "FAILED") {
          throw new Error("Generation failed");
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos
      } catch (error) {
        console.error(`Error in polling attempt ${attempts}:`, error);
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos
      }
    }
    
    throw new Error("Timeout while waiting for image generation");
  }

  /**
   * Obtém uma imagem de fallback baseada no tema
   */
  private getFallbackImage(theme: string): string {
    const themeImages: Record<string, string> = {
      adventure: "/images/placeholders/adventure.jpg",
      fantasy: "/images/placeholders/fantasy.jpg",
      space: "/images/placeholders/space.jpg",
      ocean: "/images/placeholders/ocean.jpg",
      dinosaurs: "/images/placeholders/dinosaurs.jpg"
    };
    
    return themeImages[theme] || "/images/placeholders/illustration-placeholder.jpg";
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
    if (!storyPages.length) {
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
          // Criar um prompt específico para livro infantil
          let enhancedPrompt = `Ilustração para um livro infantil representando: ${pageText}`;
          
          // Adicionar contexto de número da página e tema
          enhancedPrompt += ` (Página ${pageNumber} - Tema: ${theme}, Cenário: ${setting})`;
          
          // Se for a primeira ou última página, adicionar indicações especiais
          if (i === 0) {
            enhancedPrompt += " Esta é a primeira página da história, mostre o início da aventura.";
          } else if (i === storyPages.length - 1) {
            enhancedPrompt += " Esta é a última página da história, mostre a conclusão ou celebração.";
          }
          
          const imageUrl = await this.generateImage({
            prompt: enhancedPrompt,
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
          imageUrls.push(this.getFallbackImage(theme));
        }
      }
      
      return imageUrls;
    } catch (error) {
      console.error("Erro ao gerar imagens da história:", error);
      // Retornar placeholders para todas as páginas
      return storyPages.map(() => this.getFallbackImage(theme));
    }
  }
}
