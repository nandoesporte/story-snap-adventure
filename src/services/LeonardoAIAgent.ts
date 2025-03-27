import { toast } from "sonner";

interface ImageGenerationParams {
  prompt: string;
  characterName: string;
  theme: string;
  setting: string;
  style?: string;
  characterPrompt?: string | null;
  childImage?: string | null;
  storyContext?: string | null;
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
  private characterModels: Map<string, string> = new Map();
  private characterFirstImageUrl: Map<string, string> = new Map();
  private isAvailable: boolean = true;
  private apiKey: string | null = null;

  constructor() {
    // Carregar a API key do Leonardo.ai e verificar disponibilidade
    this.apiKey = localStorage.getItem('leonardo_api_key');
    this.isAvailable = !!this.apiKey && this.apiKey.length > 10;
    
    // Carregar prompts de personagens salvos
    this.loadSavedCharacterPrompts();
    
    console.log(`LeonardoAIAgent initialized, API available: ${this.isAvailable}`);
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
      
      // Carregar modelos de personagens
      const savedModels = localStorage.getItem('character_models');
      if (savedModels) {
        const models = JSON.parse(savedModels);
        Object.entries(models).forEach(([name, model]) => {
          this.characterModels.set(name, model as string);
        });
      }
      
      // Carregar URLs de imagens de referência
      const savedImageUrls = localStorage.getItem('character_reference_images');
      if (savedImageUrls) {
        const imageUrls = JSON.parse(savedImageUrls);
        Object.entries(imageUrls).forEach(([name, url]) => {
          this.characterFirstImageUrl.set(name, url as string);
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
    
    // PERSISTIR no localStorage
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
   * Salva o modelo a ser usado para um personagem específico
   */
  public saveCharacterModel(characterName: string, model: string): void {
    if (!characterName || !model) return;
    
    this.characterModels.set(characterName, model);
    
    try {
      const models: Record<string, string> = {};
      this.characterModels.forEach((value, key) => {
        models[key] = value;
      });
      localStorage.setItem('character_models', JSON.stringify(models));
    } catch (e) {
      console.error("Erro ao salvar modelo do personagem:", e);
    }
  }

  /**
   * Salva a URL da primeira imagem gerada para um personagem como referência
   */
  public saveCharacterReferenceImage(characterName: string, imageUrl: string): void {
    if (!characterName || !imageUrl) return;
    
    this.characterFirstImageUrl.set(characterName, imageUrl);
    
    try {
      const imageUrls: Record<string, string> = {};
      this.characterFirstImageUrl.forEach((value, key) => {
        imageUrls[key] = value;
      });
      localStorage.setItem('character_reference_images', JSON.stringify(imageUrls));
    } catch (e) {
      console.error("Erro ao salvar imagem de referência do personagem:", e);
    }
  }

  /**
   * Verifica se o agente está disponível para uso
   */
  public isAgentAvailable(): boolean {
    // Verificar a chave salva no localStorage em tempo real
    const storedKey = localStorage.getItem('leonardo_api_key');
    this.isAvailable = !!storedKey && storedKey.length > 10;
    
    return this.isAvailable;
  }

  /**
   * Define a chave da API do Leonardo.ai
   */
  public setApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.length < 10) {
      console.warn("Invalid Leonardo API key (too short or empty)");
      return false;
    }
    
    this.apiKey = apiKey.trim();
    localStorage.setItem('leonardo_api_key', this.apiKey);
    this.isAvailable = true;
    
    // Limpar qualquer erro anterior
    localStorage.removeItem("leonardo_api_issue");
    
    console.log("Leonardo API key set successfully");
    return true;
  }

  /**
   * Gera uma imagem usando a API do Leonardo.ai com base em um prompt e mantendo
   * consistência com as características do personagem
   */
  public async generateImage(params: ImageGenerationParams): Promise<string> {
    const { 
      prompt, 
      characterName, 
      theme, 
      setting, 
      style = "cartoon", 
      characterPrompt, 
      childImage, 
      storyContext 
    } = params;
    
    // Verificar a chave API antes de prosseguir
    if (!this.apiKey || this.apiKey.length < 10) {
      console.error("Leonardo.ai API key não configurada ou inválida");
      window.dispatchEvent(new CustomEvent("leonardo_api_issue"));
      localStorage.setItem("leonardo_api_issue", "true");
      return this.getFallbackImage(theme);
    }
    
    // Usar o prompt salvo do personagem, se existir
    const savedPrompt = this.characterPrompts.get(characterName);
    const finalCharacterPrompt = savedPrompt || characterPrompt || null;
    
    // Usar o estilo visual salvo, se existir
    const savedStyle = this.characterImageStyles.get(characterName) || style;
    
    // Usar o modelo salvo para o personagem, se existir
    const modelId = this.characterModels.get(characterName) || "b820ea11-02bf-4652-97ae-93b22e02a0a9"; // Leonardo Creative como padrão
    
    // Verificar se já temos uma imagem de referência para este personagem
    const referenceImageUrl = this.characterFirstImageUrl.get(characterName);
    
    // Enriquecer o prompt para garantir consistência do personagem e melhorar as ilustrações
    let enhancedPrompt = prompt;
    
    // Adicionar um prefixo para garantir consistência
    enhancedPrompt = `Ilustração consistente do personagem ${characterName}. ${enhancedPrompt}`;
    
    // Adicionar contexto da história, se disponível
    if (storyContext) {
      enhancedPrompt = `${storyContext}: ${enhancedPrompt}`;
    }
    
    // Adicionar detalhes específicos do personagem ao prompt
    if (finalCharacterPrompt) {
      enhancedPrompt += ` O personagem ${characterName} possui as seguintes características visuais que DEVEM ser mantidas em todas as imagens: ${finalCharacterPrompt}`;
    }
    
    // Adicionar instruções para estilo de ilustração de livro infantil
    enhancedPrompt += ` Ilustração de alta qualidade para livro infantil, colorida, estilo ${savedStyle === "cartoon" ? "desenho animado" : savedStyle}.`;
    
    // Adicionar instruções para composição e foco
    enhancedPrompt += " Composição central, foco no personagem principal, expressões faciais claras, cores vibrantes.";
    
    // Adicionar instruções específicas para manter consistência
    enhancedPrompt += " IMPORTANTE: mantenha EXATAMENTE a mesma aparência física, roupas, cores e características faciais do personagem em todas as ilustrações para garantir consistência.";
    
    console.log("Gerando imagem com Leonardo.ai API:", {
      characterName,
      hasPrompt: !!finalCharacterPrompt,
      hasStoryContext: !!storyContext,
      style: savedStyle,
      hasReferenceImage: !!referenceImageUrl,
      modelId,
      apiKeyLength: this.apiKey.length,
      promptLength: enhancedPrompt.length
    });
    
    try {
      // Configurar o corpo da requisição
      const requestBody: any = {
        prompt: enhancedPrompt,
        modelId: modelId,
        width: 768,
        height: 768,
        num_images: 1,
        promptMagic: true,
        presetStyle: savedStyle === "cartoon" ? "ANIME" : (savedStyle === "realistic" ? "CINEMATIC" : "CREATIVE"),
        public: false,
        nsfw: false
      };
      
      // Se tivermos uma imagem de referência, adicionar ao corpo da requisição para maior consistência
      if (referenceImageUrl) {
        requestBody.referenceImageUrl = referenceImageUrl;
        requestBody.promptMagicVersion = "v2"; // Usar v2 para melhor processamento de imagens de referência
        requestBody.imageGuidanceScale = 0.8; // Escala de orientação da imagem (0.1 a 1)
      }
      
      // Teste de conexão antes de fazer a chamada completa
      try {
        const testResponse = await fetch("https://cloud.leonardo.ai/api/rest/v1/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!testResponse.ok) {
          console.error("Leonardo.ai API connection test failed:", await testResponse.text());
          throw new Error(`Leonardo.ai API connection test failed: ${testResponse.status}`);
        }
        
        console.log("Leonardo.ai API connection test successful");
      } catch (error) {
        console.error("Leonardo.ai API connection test error:", error);
        throw new Error("Failed to connect to Leonardo.ai API");
      }
      
      // Chamar a API do Leonardo.ai para iniciar a geração
      const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Leonardo.ai API error:", errorData);
        throw new Error(`Leonardo.ai API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      console.log("Leonardo.ai generation job created:", data.sdGenerationJob?.generationId);
      
      const generationId = data.sdGenerationJob?.generationId;
      if (!generationId) {
        throw new Error("No generation ID returned from Leonardo.ai API");
      }
      
      // Aguardar a conclusão da geração
      const imageUrl = await this.pollForResults(generationId);
      
      // Quando bem-sucedido, salvar o prompt para uso futuro
      if (characterPrompt && !savedPrompt) {
        this.saveCharacterPrompt(characterName, characterPrompt);
      }
      
      // Se não tivermos uma imagem de referência para este personagem, salvar esta como referência
      if (!referenceImageUrl) {
        this.saveCharacterReferenceImage(characterName, imageUrl);
        console.log(`Imagem de referência salva para ${characterName}:`, imageUrl);
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
    imagePrompts: string[],
    characterName: string,
    theme: string,
    setting: string,
    characterPrompt: string | null = null,
    style: string = "cartoon",
    childImage: string | null = null,
    storyTitle: string | null = null
  ): Promise<string[]> {
    if (!storyPages.length) {
      return [];
    }
    
    try {
      const imageUrls: string[] = [];
      
      // Primeiro, gerar a primeira imagem que servirá como referência para consistência
      if (storyPages.length > 0 && imagePrompts.length > 0) {
        const firstPagePrompt = imagePrompts[0] || `Ilustração da primeira página: ${storyPages[0].substring(0, 100)}...`;
        
        toast.info(`Gerando ilustração de referência do personagem ${characterName}...`);
        
        try {
          // Criar um prompt específico para a primeira ilustração
          let enhancedPrompt = `Retrato detalhado e claro do personagem ${characterName} para servir como referência visual. ${firstPagePrompt}`;
          
          // Adicionar contexto geral da história se disponível
          if (storyTitle) {
            enhancedPrompt = `História: "${storyTitle}" - ${enhancedPrompt}`;
          }
          
          // Adicionar contexto de tema e cenário
          enhancedPrompt += ` (Tema: ${theme}, Cenário: ${setting})`;
          
          const firstImageUrl = await this.generateImage({
            prompt: enhancedPrompt,
            characterName,
            theme,
            setting,
            style,
            characterPrompt,
            childImage,
            storyContext: storyTitle ? `Personagem de referência para a história "${storyTitle}"` : null
          });
          
          // Salvar explicitamente como imagem de referência
          this.saveCharacterReferenceImage(characterName, firstImageUrl);
          
          // Adicionar à lista de URLs
          imageUrls.push(firstImageUrl);
        } catch (error) {
          console.error(`Erro ao gerar imagem de referência:`, error);
          imageUrls.push(this.getFallbackImage(theme));
        }
      }
      
      // Gerar imagens para as páginas restantes sequencialmente, usando a referência
      for (let i = 1; i < storyPages.length; i++) {
        const pageText = storyPages[i];
        const imagePrompt = imagePrompts[i] || `Ilustração para a página ${i+1}: ${pageText.substring(0, 100)}...`;
        const pageNumber = i + 1;
        
        toast.info(`Gerando ilustração para página ${pageNumber} de ${storyPages.length}...`);
        
        try {
          // Criar um prompt específico para livro infantil
          let enhancedPrompt = `Mantenha a EXATA aparência do personagem ${characterName} conforme a imagem de referência. ${imagePrompt}`;
          
          // Adicionar contexto geral da história se disponível
          if (storyTitle) {
            enhancedPrompt = `História: "${storyTitle}" - ${enhancedPrompt}`;
          }
          
          // Adicionar contexto de número da página e tema
          enhancedPrompt += ` (Página ${pageNumber} - Tema: ${theme}, Cenário: ${setting})`;
          
          // Se for a última página, adicionar indicações especiais
          if (i === storyPages.length - 1) {
            enhancedPrompt += " Esta é a última página da história, mostre a conclusão ou celebração.";
          }
          
          const imageUrl = await this.generateImage({
            prompt: enhancedPrompt,
            characterName,
            theme,
            setting,
            style,
            characterPrompt,
            childImage,
            storyContext: storyTitle ? `Página ${pageNumber} da história "${storyTitle}"` : null
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

  /**
   * Gera uma imagem de capa para a história
   */
  public async generateCoverImage(
    title: string,
    characterName: string,
    theme: string,
    setting: string,
    style: string = "cartoon",
    characterPrompt: string | null = null,
    childImage: string | null = null
  ): Promise<string> {
    const coverPrompt = `Capa de livro infantil para "${title}" com o personagem ${characterName} em destaque em uma cena de ${setting} com tema de ${theme}. 
                        A ilustração deve ser vibrante, colorida e conter o título "${title}" integrado ao design. 
                        O personagem deve estar centralizado na cena, com uma expressão alegre e aventureira.
                        Importante: Mantenha as características visuais consistentes do personagem.`;
    
    // Verificar se já temos uma imagem de referência para este personagem
    const referenceImageUrl = this.characterFirstImageUrl.get(characterName);
    
    try {
      // Se não tivermos referência, gerar um personagem de referência primeiro
      if (!referenceImageUrl) {
        // Gerar uma ilustração de referência para o personagem
        const characterRefPrompt = `Retrato detalhado e claro do personagem ${characterName} para servir como referência. Mostrando aparência completa, roupas e expressão facial característica em estilo ${style}.`;
        
        const referenceImage = await this.generateImage({
          prompt: characterRefPrompt,
          characterName,
          theme,
          setting,
          style,
          characterPrompt,
          childImage,
          storyContext: `Referência visual para o personagem da história "${title}"`
        });
        
        // Salvar como imagem de referência
        this.saveCharacterReferenceImage(characterName, referenceImage);
      }
      
      // Agora gerar a capa usando a referência
      const imageUrl = await this.generateImage({
        prompt: coverPrompt,
        characterName,
        theme,
        setting,
        style,
        characterPrompt,
        childImage,
        storyContext: `Capa do livro "${title}"`
      });
      
      return imageUrl;
    } catch (error) {
      console.error("Erro ao gerar imagem de capa:", error);
      
      const themeCovers: Record<string, string> = {
        adventure: "/images/covers/adventure.jpg",
        fantasy: "/images/covers/fantasy.jpg",
        space: "/images/covers/space.jpg",
        ocean: "/images/covers/ocean.jpg",
        dinosaurs: "/images/covers/dinosaurs.jpg"
      };
      
      return themeCovers[theme] || "/images/covers/adventure.jpg";
    }
  }
}
