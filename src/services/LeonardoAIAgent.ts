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
      style = "papercraft", 
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
    
    // Sempre usar estilo papercraft
    this.saveCharacterStyle(characterName, "papercraft");
    
    // Usar o modelo salvo para o personagem, se existir
    const modelId = this.characterModels.get(characterName) || "b820ea11-02bf-4652-97ae-93b22e02a0a9"; // Leonardo Creative como padrão
    
    // Verificar se já temos uma imagem de referência para este personagem
    const referenceImageUrl = this.characterFirstImageUrl.get(characterName);
    
    // Tentar usar o template personalizado do localStorage se disponível
    let imagePromptTemplate = localStorage.getItem('image_prompt_template');
    let enhancedPrompt: string;
    
    if (imagePromptTemplate) {
      // Extrair elementos secundários do prompt para enriquecer a cena
      const elementosSecundarios = this.extractSecondaryElements(prompt, theme);
      
      // Usar o template personalizado com substituição de variáveis
      enhancedPrompt = imagePromptTemplate
        .replace(/{personagem}/g, characterName)
        .replace(/{caracteristicas_do_personagem}/g, finalCharacterPrompt || 'personagem colorido')
        .replace(/{cenario}/g, setting)
        .replace(/{tema}/g, theme)
        .replace(/{elementos_da_cena}/g, prompt.slice(0, 100))
        .replace(/{elementos_secundarios}/g, elementosSecundarios)
        .replace(/{texto_da_pagina}/g, prompt)
        .replace(/{emocao}/g, prompt.includes('feliz') ? 'alegria' : 
                               prompt.includes('triste') ? 'tristeza' : 
                               prompt.includes('surpreso') ? 'surpresa' : 'curiosidade');
    } else {
      // Usar a abordagem padrão de construção de prompt
      enhancedPrompt = `Ilustração no estilo papercraft (arte em camadas de papel recortado com efeito 3D como livro pop-up) para livro infantil, mostrando ${characterName} em ${setting}. Garantir que o personagem tenha EXATAMENTE a mesma aparência em todas as ilustrações. ${prompt}`;
      
      if (finalCharacterPrompt) {
        enhancedPrompt += ` O personagem ${characterName} possui as seguintes características visuais que DEVEM ser mantidas em todas as imagens: ${finalCharacterPrompt}`;
      }
      
      enhancedPrompt += ` Camadas de papel recortado, texturas visíveis, elementos em diferentes níveis de profundidade, cores vibrantes, composição central focando o personagem principal, múltiplos elementos da história como detalhes no cenário, todos no estilo de papel recortado.`;
    }
    
    // Adicionar sempre o estilo papercraft como garantia
    if (!enhancedPrompt.toLowerCase().includes('papercraft')) {
      enhancedPrompt += " Ilustração em estilo PAPERCRAFT com camadas de papel recortado, textura de papel, elementos em diferentes níveis sobrepostos como um livro pop-up.";
    }
    
    // Adicionar instruções para manter consistência
    enhancedPrompt += " IMPORTANTE: mantenha EXATAMENTE a mesma aparência física, roupas, cores e características faciais do personagem em todas as ilustrações para garantir consistência.";
    
    console.log("Gerando imagem com Leonardo.ai API:", {
      characterName,
      hasPrompt: !!finalCharacterPrompt,
      hasStoryContext: !!storyContext,
      style: "papercraft",
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
        presetStyle: "CREATIVE",
        public: false,
        nsfw: false
      };
      
      // Se tivermos uma imagem de referência, adicionar ao corpo da requisição para maior consistência
      if (referenceImageUrl) {
        requestBody.referenceImageUrl = referenceImageUrl;
        requestBody.promptMagicVersion = "v2";
        requestBody.imageGuidanceScale = 0.8;
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
   * Extrai elementos secundários do prompt para enriquecer a cena
   */
  private extractSecondaryElements(prompt: string, theme: string): string {
    // Palavras-chave para cada tema
    const themeKeywords: Record<string, string[]> = {
      adventure: ["mapas", "bússola", "mochilas", "binóculos", "cordas", "lanternas", "barcos", "montanhas"],
      fantasy: ["varinhas", "fadas", "dragões", "castelos", "poções", "livros mágicos", "cristais", "estrelas brilhantes"],
      space: ["planetas", "estrelas", "foguetes", "astronautas", "aliens", "satélites", "asteroides", "cometas"],
      ocean: ["peixes", "conchas", "corais", "algas", "ondas", "barcos", "tesouros", "âncoras"],
      dinosaurs: ["pegadas", "fósseis", "vulcões", "ovos", "plantas pré-históricas", "rochas", "ossos", "pterodáctilos"]
    };
    
    // Elementos padrão para qualquer tema
    const defaultElements = ["árvores", "nuvens", "flores", "animais", "pedras", "plantas", "casas", "caminhos"];
    
    // Obter palavras-chave do tema atual
    const keywords = themeKeywords[theme as keyof typeof themeKeywords] || defaultElements;
    
    // Selecionar aleatoriamente 3-4 elementos
    const selectedElements = [];
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * keywords.length);
      if (keywords[randomIndex] && !selectedElements.includes(keywords[randomIndex])) {
        selectedElements.push(keywords[randomIndex]);
      }
    }
    
    // Analisar o prompt para identificar elementos específicos mencionados
    const promptWords = prompt.toLowerCase().split(' ');
    const possibleObjects = promptWords.filter(word => 
      word.length > 4 && 
      !["para", "como", "quando", "onde", "porque", "então", "muito", "também"].includes(word)
    ).slice(0, 3);
    
    // Combinar elementos do tema com elementos do prompt
    return [...selectedElements, ...possibleObjects].join(', ');
  }

  /**
   * Consulta periodicamente o status da geração até que esteja concluída
   */
  private async pollForResults(generationId: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Leonardo.ai API key não configurada");
    }
    
    let attempts = 0;
    const maxAttempts = 30;
    
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
          
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue;
        }
        
        const data = await response.json();
        
        if (data.generations_by_pk.status === "COMPLETE") {
          const generatedImages = data.generations_by_pk.generated_images;
          if (generatedImages && generatedImages.length > 0) {
            return generatedImages[0].url;
          }
          throw new Error("No images generated");
        } else if (data.generations_by_pk.status === "FAILED") {
          throw new Error("Generation failed");
        }
        
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error) {
        console.error(`Error in polling attempt ${attempts}:`, error);
        
        await new Promise(resolve => setTimeout(resolve, 10000));
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
    style: string = "papercraft",
    childImage: string | null = null,
    storyTitle: string | null = null
  ): Promise<string[]> {
    if (!storyPages.length) {
      return [];
    }
    
    try {
      const imageUrls: string[] = [];
      
      if (storyPages.length > 0 && imagePrompts.length > 0) {
        const firstPagePrompt = imagePrompts[0] || `Ilustração da primeira página: ${storyPages[0].substring(0, 100)}...`;
        
        toast.info(`Gerando ilustração de referência do personagem ${characterName}...`);
        
        try {
          // Criar um prompt mais detalhado para a imagem de referência
          let enhancedPrompt = `Retrato detalhado do personagem ${characterName} no estilo papercraft (camadas de papel recortado com profundidade 3D). ${firstPagePrompt}`;
          
          if (storyTitle) {
            enhancedPrompt = `História: "${storyTitle}" - ${enhancedPrompt}`;
          }
          
          enhancedPrompt += ` (Tema: ${theme}, Cenário: ${setting})`;
          enhancedPrompt += ` O personagem deve ter características visuais bem definidas e distintas que possam ser mantidas consistentes em todas as ilustrações.`;
          
          const firstImageUrl = await this.generateImage({
            prompt: enhancedPrompt,
            characterName,
            theme,
            setting,
            style: "papercraft",
            characterPrompt,
            childImage,
            storyContext: storyTitle ? `Personagem de referência para a história "${storyTitle}"` : null
          });
          
          this.saveCharacterReferenceImage(characterName, firstImageUrl);
          imageUrls.push(firstImageUrl);
        } catch (error) {
          console.error(`Erro ao gerar imagem de referência:`, error);
          imageUrls.push(this.getFallbackImage(theme));
        }
      }
      
      for (let i = 1; i < storyPages.length; i++) {
        const pageText = storyPages[i];
        const imagePrompt = imagePrompts[i] || `Ilustração para a página ${i+1}: ${pageText.substring(0, 100)}...`;
        const pageNumber = i + 1;
        
        toast.info(`Gerando ilustração para página ${pageNumber} de ${storyPages.length}...`);
        
        try {
          // Criar um prompt mais detalhado para cada página
          let enhancedPrompt = `Ilustração papercraft (camadas de papel recortado 3D) para página ${pageNumber}. Mantenha a EXATA aparência do personagem ${characterName} conforme a imagem de referência. ${imagePrompt}`;
          
          if (storyTitle) {
            enhancedPrompt = `História: "${storyTitle}" - ${enhancedPrompt}`;
          }
          
          enhancedPrompt += ` (Página ${pageNumber} - Tema: ${theme}, Cenário: ${setting})`;
          enhancedPrompt += ` Inclua múltiplos elementos da cena: ${pageText.substring(0, 150)}`;
          
          if (i === storyPages.length - 1) {
            enhancedPrompt += " Esta é a última página da história, mostre a conclusão ou celebração.";
          }
          
          const imageUrl = await this.generateImage({
            prompt: enhancedPrompt,
            characterName,
            theme,
            setting,
            style: "papercraft",
            characterPrompt,
            childImage,
            storyContext: storyTitle ? `Página ${pageNumber} da história "${storyTitle}"` : null
          });
          
          imageUrls.push(imageUrl);
        } catch (error) {
          console.error(`Erro ao gerar imagem para página ${pageNumber}:`, error);
          imageUrls.push(this.getFallbackImage(theme));
        }
      }
      
      return imageUrls;
    } catch (error) {
      console.error("Erro ao gerar imagens da história:", error);
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
    style: string = "papercraft",
    characterPrompt: string | null = null,
    childImage: string | null = null
  ): Promise<string> {
    const coverPrompt = `Capa de livro infantil em estilo papercraft para "${title}" com o personagem ${characterName} em destaque em uma cena de ${setting} com tema de ${theme}. 
                        A ilustração deve ser como um livro pop-up com texturas de papel, elementos que parecem recortados e colados em camadas, e o título "${title}" integrado ao design. 
                        O personagem deve estar centralizado na cena, com uma expressão alegre e aventureira.
                        Inclua vários elementos do tema como flores, árvores, nuvens, sol, animais ou objetos, todos em estilo de recorte de papel com profundidade 3D.
                        Cores vibrantes e saturadas, detalhes ricos, iluminação que realça as camadas de papel.
                        Importante: Mantenha as características visuais consistentes do personagem.`;
    
    const referenceImageUrl = this.characterFirstImageUrl.get(characterName);
    
    try {
      if (!referenceImageUrl) {
        const characterRefPrompt = `Retrato detalhado e claro do personagem ${characterName} para servir como referência. Mostrando aparência completa, roupas e expressão facial característica em estilo papercraft com camadas de papel recortado.`;
        
        const referenceImage = await this.generateImage({
          prompt: characterRefPrompt,
          characterName,
          theme,
          setting,
          style: "papercraft",
          characterPrompt,
          childImage,
          storyContext: `Referência visual para o personagem da história "${title}"`
        });
        
        this.saveCharacterReferenceImage(characterName, referenceImage);
      }
      
      const imageUrl = await this.generateImage({
        prompt: coverPrompt,
        characterName,
        theme,
        setting,
        style: "papercraft",
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
