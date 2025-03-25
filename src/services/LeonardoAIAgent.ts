
import { toast } from "sonner";
import { geminiAI } from "@/lib/openai";

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
 * LeonardoAIAgent - Responsável por gerar ilustrações consistentes usando Gemini API
 * Mantém características dos personagens consistentes ao longo das ilustrações
 */
export class LeonardoAIAgent {
  private characterPrompts: Map<string, string> = new Map();
  private characterImageStyles: Map<string, string> = new Map();
  private isAvailable: boolean = true;

  constructor() {
    this.isAvailable = true;
    
    // Carregar prompts de personagens salvos
    this.loadSavedCharacterPrompts();
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
    return this.isAvailable;
  }

  /**
   * Define a URL do webhook do Leonardo AI
   */
  public setWebhookUrl(url: string): boolean {
    // Mantemos este método para compatibilidade, mas não é mais necessário
    return true;
  }

  /**
   * Gera uma imagem usando o Gemini API com base em um prompt e mantendo
   * consistência com as características do personagem
   */
  public async generateImage(params: ImageGenerationParams): Promise<string> {
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
    
    console.log("Gerando imagem com Gemini API:", {
      characterName,
      hasPrompt: !!finalCharacterPrompt,
      style: savedStyle
    });
    
    try {
      // Usar o Gemini para gerar a imagem diretamente
      const geminiModel = geminiAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const generationPrompt = `
      Gere uma imagem para livro infantil no estilo ${savedStyle} baseada na seguinte cena:
      
      "${enhancedPrompt}"
      
      Cenário: ${setting}
      Tema: ${theme}
      
      A imagem deve ser colorida, encantadora e apropriada para crianças, mantendo consistência 
      nas características dos personagens em todo o livro.
      `;
      
      const result = await geminiModel.generateContent(generationPrompt);
      const response = await result.response;
      
      // Extrair a imagem da resposta - Gemini 1.5 Pro pode gerar imagens
      const parts = response.candidates[0].content.parts;
      const imagePart = parts.find(part => part.inlineData && part.inlineData.mimeType.startsWith('image/'));
      
      if (!imagePart || !imagePart.inlineData) {
        throw new Error("Não foi possível gerar a imagem");
      }
      
      // Converter dados base64 para URL de imagem
      const base64Data = imagePart.inlineData.data;
      const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${base64Data}`;
      
      // Quando bem-sucedido, salvar o prompt para uso futuro
      if (characterPrompt && !savedPrompt) {
        this.saveCharacterPrompt(characterName, characterPrompt);
      }
      
      return imageUrl;
    } catch (error: any) {
      console.error("Error generating image with Gemini:", error);
      
      // Se ocorrer um erro com o Gemini, podemos tentar fazer fallback para uma abordagem alternativa
      toast.error("Erro ao gerar imagem com Gemini. Usando imagem de placeholder.");
      
      // Retornar uma imagem placeholder baseada no tema
      const themeImages: Record<string, string> = {
        adventure: "/images/placeholders/adventure.jpg",
        fantasy: "/images/placeholders/fantasy.jpg",
        space: "/images/placeholders/space.jpg",
        ocean: "/images/placeholders/ocean.jpg",
        dinosaurs: "/images/placeholders/dinosaurs.jpg"
      };
      
      return themeImages[theme] || "/images/placeholders/illustration-placeholder.jpg";
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
