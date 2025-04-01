
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

interface GenerateImageParams {
  prompt: string;
  characterName: string;
  theme: string;
  setting: string;
  style?: string;
  characterPrompt?: string | null;
  childImage?: string | null;
  storyContext?: string | null;
  referenceImageUrl?: string | null;
}

export class LeonardoAIAgent {
  private apiKey: string | null = null;
  private userId: string | null = null;
  private modelId: string = "e316348f-7773-490e-adcd-46757c738eb7"; // Leonardo Creative model
  private generationInProgress: boolean = false;
  private useRefiner: boolean = true;

  constructor() {
    this.apiKey = localStorage.getItem("leonardo_api_key");
    this.userId = localStorage.getItem("user_id") || null;
    
    const savedModelId = localStorage.getItem("leonardo_model_id");
    if (savedModelId && savedModelId.length > 10) {
      this.modelId = savedModelId;
    }
    
    this.useRefiner = localStorage.getItem("use_leonardo_refiner") !== "false";
  }

  isAgentAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 10;
  }

  setApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.length < 10) {
      return false;
    }
    
    this.apiKey = apiKey;
    localStorage.setItem("leonardo_api_key", apiKey);
    return true;
  }

  setModelId(modelId: string): boolean {
    if (!modelId || modelId.length < 10) {
      return false;
    }
    
    this.modelId = modelId;
    localStorage.setItem("leonardo_model_id", modelId);
    return true;
  }

  setUseRefiner(useRefiner: boolean): void {
    this.useRefiner = useRefiner;
    localStorage.setItem("use_leonardo_refiner", useRefiner.toString());
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      console.log("No Leonardo API key found");
      return false;
    }
    
    try {
      console.log("Testing Leonardo API connection...");
      // Use user information endpoint
      const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/me", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Leonardo API error:", errorText);
        return false;
      }
      
      const data = await response.json();
      console.log("Leonardo API connection test successful:", data?.user_details ? "User details found" : "No user details");
      return !!(data && data.user_details);
    } catch (error) {
      console.error("Error testing Leonardo connection:", error);
      return false;
    }
  }

  async generateImage({
    prompt,
    characterName,
    theme,
    setting,
    style = "cartoon",
    characterPrompt = null,
    childImage = null,
    storyContext = null,
    referenceImageUrl = null
  }: GenerateImageParams): Promise<string> {
    if (!this.apiKey) {
      console.error("Leonardo API Key não configurada");
      throw new Error("Leonardo API Key não configurada");
    }

    if (this.generationInProgress) {
      console.warn("Geração de imagem já em andamento, aguarde...");
      throw new Error("Geração de imagem já em andamento, aguarde...");
    }

    try {
      this.generationInProgress = true;

      // Gerar um ID único para esta geração
      const generationId = uuidv4();
      
      // Registrar início da geração
      console.log(`Iniciando geração de imagem: ${generationId}`);
      console.log(`Prompt: ${prompt.substring(0, 100)}...`);
      
      // Enhancing prompt for better style guidance
      let enhancedPrompt = `${style} style illustration for a children's book. `;
      enhancedPrompt += prompt;
      
      // Add character details if provided
      if (characterPrompt) {
        enhancedPrompt += `. The character ${characterName} has the following attributes: ${characterPrompt}`;
      }
      
      // Prepare base request options
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authorization': `Bearer ${this.apiKey}`
        }
      };
      
      // Initialize generation config
      let generationConfig: any = {
        prompt: enhancedPrompt,
        modelId: this.modelId,
        width: 768,
        height: 768,
        promptMagic: true,
        sd_version: "v2",
        presetStyle: "LEONARDO",
        num_images: 1
      };
      
      // Add reference image information if available
      if (referenceImageUrl) {
        console.log("Using reference image URL for guidance:", referenceImageUrl);
        generationConfig.imagePrompts = [referenceImageUrl];
      }
            
      const body = JSON.stringify(generationConfig);
      requestOptions.body = body;
      
      console.log("Enviando requisição para Leonardo.ai...");
      const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta da API Leonardo:", errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === "You have reached your API request limit for the day.") {
            localStorage.setItem("leonardo_api_issue", "true");
            window.dispatchEvent(new CustomEvent("leonardo_api_issue"));
            toast.error("Limite diário da API Leonardo atingido. Tente novamente amanhã.");
          }
        } catch (e) {
          // In case parsing fails, continue with the regular error handling
          console.log("Couldn't parse error response:", e);
        }
        
        throw new Error(`Falha ao gerar imagem: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log("Leonardo API response:", responseData);
      
      if (responseData.sdGenerationJob && responseData.sdGenerationJob.generationId) {
        // New API response format
        const generationIdReceived = responseData.sdGenerationJob.generationId;
        console.log(`Geração iniciada com ID (novo formato): ${generationIdReceived}`);
        
        return await this.waitForGenerationCompletion(generationIdReceived);
      } else if (responseData.generations && responseData.generations[0] && responseData.generations[0].id) {
        // Old API response format
        const generationIdReceived = responseData.generations[0].id;
        console.log(`Geração iniciada com ID (formato antigo): ${generationIdReceived}`);
        
        return await this.waitForGenerationCompletion(generationIdReceived);
      } else {
        console.error("Resposta inesperada da API Leonardo:", responseData);
        throw new Error("Resposta inesperada da API Leonardo");
      }
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      localStorage.setItem("leonardo_api_issue", "true");
      window.dispatchEvent(new CustomEvent("leonardo_api_issue"));
      throw error;
    } finally {
      this.generationInProgress = false;
    }
  }

  private async waitForGenerationCompletion(generationId: string): Promise<string> {
    let imageUrl = null;
    let attempts = 0;
    const maxAttempts = 20;
    
    while (!imageUrl && attempts < maxAttempts) {
      attempts++;
      console.log(`Tentativa ${attempts}: Verificando status da geração...`);
      
      try {
        const statusResponse = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${this.apiKey}`
          }
        });
        
        if (!statusResponse.ok) {
          console.error("Erro ao verificar o status da geração:", statusResponse.statusText);
          throw new Error(`Falha ao verificar o status da geração: ${statusResponse.statusText}`);
        }
        
        const statusData = await statusResponse.json();
        
        if (statusData.generations_by_id?.status === "COMPLETE") {
          if (statusData.generations_by_id.generated_images && statusData.generations_by_id.generated_images.length > 0) {
            imageUrl = statusData.generations_by_id.generated_images[0].url;
            console.log("Imagem gerada com sucesso:", imageUrl);
            return imageUrl;
          } else {
            console.error("Geração marcada como completa, mas sem imagens geradas");
            throw new Error("Nenhuma imagem foi gerada");
          }
        } else if (statusData.generations_by_id?.status === "FAILED") {
          console.error("Geração falhou:", statusData.generations_by_id.failure_reason || "Razão desconhecida");
          throw new Error(`Geração falhou: ${statusData.generations_by_id.failure_reason || "Erro desconhecido"}`);
        } else {
          console.log(`Status atual: ${statusData.generations_by_id?.status || "Desconhecido"}. Aguardando...`);
          await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 3 segundos
        }
      } catch (error) {
        console.error("Erro ao verificar status da geração:", error);
        // Continue trying despite errors in status check
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    if (!imageUrl) {
      console.warn("Tempo limite atingido ao aguardar a geração da imagem.");
      throw new Error("Tempo limite atingido ao aguardar a geração da imagem.");
    }
    
    return imageUrl;
  }

  async generateCoverImage(
    title: string,
    characterName: string,
    theme: string,
    setting: string,
    style: string = "cartoon",
    characterPrompt: string | null = null,
    childImage: string | null = null,
    referenceImageUrl: string | null = null
  ): Promise<string> {
    try {
      let coverPrompt = `Book cover illustration for a children's story titled "${title}". `;
      coverPrompt += `Features ${characterName} in a ${setting} setting with a ${theme} theme. `;
      coverPrompt += `The cover should be visually appealing, colorful, and suitable for children.`;
      
      if (characterPrompt) {
        coverPrompt += ` Character details: ${characterPrompt}.`;
      }
      
      const result = await this.generateImage({
        prompt: coverPrompt,
        characterName,
        theme,
        setting,
        style,
        characterPrompt,
        childImage,
        storyContext: title,
        referenceImageUrl
      });
      
      return result;
    } catch (error) {
      console.error("Error generating cover image:", error);
      throw error;
    }
  }

  async generateStoryImages(
    storyPages: string[],
    imagePrompts: string[],
    characterName: string,
    theme: string,
    setting: string,
    characterPrompt: string | null = null,
    style: string = "cartoon",
    childImage: string | null = null,
    storyTitle: string | null = null,
    referenceImageUrl: string | null = null
  ): Promise<string[]> {
    try {
      console.log(`Generating ${imagePrompts.length} story images...`);
      
      const generatedImages: string[] = [];
      
      for (let i = 0; i < imagePrompts.length; i++) {
        const imagePrompt = imagePrompts[i];
        
        console.log(`Generating image ${i + 1} of ${imagePrompts.length} with prompt: ${imagePrompt.substring(0, 100)}...`);
        
        const result = await this.generateImage({
          prompt: imagePrompt,
          characterName,
          theme,
          setting,
          style,
          characterPrompt,
          childImage,
          storyContext: storyTitle || `Page ${i + 1}`,
          referenceImageUrl
        });
        
        generatedImages.push(result);
      }
      
      return generatedImages;
    } catch (error) {
      console.error("Error generating story images:", error);
      throw error;
    }
  }
}
