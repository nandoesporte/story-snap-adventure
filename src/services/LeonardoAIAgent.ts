
import { toast } from "sonner";

interface GenerationParams {
  prompt: string;
  characterName?: string;
  theme?: string;
  setting?: string;
  style?: string;
}

export class LeonardoAIAgent {
  private apiKey: string | null = null;
  private apiEndpoint: string = "https://cloud.leonardo.ai/api/rest/v1/generations";
  private accessToken: string | null = null;
  private isInitialized: boolean = false;
  private maxPollingAttempts: number = 30;
  private pollingInterval: number = 3000;
  
  constructor() {
    this.initialize();
  }
  
  public initialize(): boolean {
    try {
      const apiKey = localStorage.getItem("leonardo_api_key");
      
      if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey === "") {
        console.log("Leonardo AI API key not found in localStorage");
        return false;
      }
      
      this.apiKey = apiKey;
      this.isInitialized = true;
      
      console.log("Leonardo AI Agent initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Leonardo AI Agent:", error);
      return false;
    }
  }
  
  public isAgentAvailable(): boolean {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.isInitialized && !!this.apiKey;
  }
  
  public setApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.trim() === "") {
      return false;
    }
    
    try {
      this.apiKey = apiKey.trim();
      localStorage.setItem("leonardo_api_key", apiKey.trim());
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Error setting Leonardo AI API key:", error);
      return false;
    }
  }
  
  public async testConnection(): Promise<boolean> {
    if (!this.isAgentAvailable()) {
      return false;
    }
    
    try {
      const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        console.error("Leonardo AI API test failed:", response.status, response.statusText);
        return false;
      }
      
      const data = await response.json();
      console.log("Leonardo AI API test successful:", data);
      return true;
    } catch (error) {
      console.error("Error testing Leonardo AI connection:", error);
      return false;
    }
  }
  
  public async generateImage(params: GenerationParams): Promise<string | null> {
    if (!this.isAgentAvailable()) {
      console.error("Leonardo AI Agent is not available");
      return null;
    }
    
    try {
      console.log("Generating image with Leonardo AI:", params);
      
      // Melhorar o prompt para melhores resultados
      let enhancedPrompt = params.prompt;
      
      // Se tiver informações adicionais, melhorar o prompt
      if (params.characterName || params.theme || params.setting || params.style) {
        enhancedPrompt = `${params.prompt} Create a ${params.style || "papercraft"} style illustration` + 
          `${params.characterName ? ` featuring ${params.characterName}` : ""}` + 
          `${params.setting ? ` in a ${params.setting} setting` : ""}` + 
          `${params.theme ? ` with ${params.theme} theme` : ""}.` + 
          ` The image should be high quality, detailed, and suitable for a children's book.`;
      }
      
      // Get available models
      const modelsResponse = await fetch("https://cloud.leonardo.ai/api/rest/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
      
      if (!modelsResponse.ok) {
        throw new Error(`Failed to fetch models: ${modelsResponse.status}`);
      }
      
      const modelsData = await modelsResponse.json();
      console.log("Available Leonardo AI models:", modelsData);
      
      // Look for the Flux 1.1pro model first
      let modelId = "";
      const fluxModel = modelsData.models.find((m: any) => 
        m.name.toLowerCase().includes("flux 1.1pro") && m.status === "ACTIVE"
      );
      
      if (fluxModel) {
        modelId = fluxModel.id;
        console.log(`Using Leonardo AI model: Flux 1.1pro (${modelId})`);
      } else {
        // Fallback to other preferred models if Flux 1.1pro is not available
        const preferredModelNames = [
          "Flux 1.1",
          "Leonardo Creative",
          "Leonardo Diffusion XL",
          "Dream Shaper XL",
          "Leonardo Diffusion"
        ];
        
        // Find first available preferred model as fallback
        for (const preferredName of preferredModelNames) {
          const model = modelsData.models.find((m: any) => 
            m.name.toLowerCase().includes(preferredName.toLowerCase()) && m.status === "ACTIVE"
          );
          
          if (model) {
            modelId = model.id;
            console.log(`Using fallback Leonardo AI model: ${model.name} (${modelId})`);
            break;
          }
        }
      }
      
      // If no preferred model found, use the first available
      if (!modelId && modelsData.models.length > 0) {
        const availableModel = modelsData.models.find((m: any) => m.status === "ACTIVE");
        if (availableModel) {
          modelId = availableModel.id;
          console.log(`Using first available Leonardo AI model: ${availableModel.name} (${modelId})`);
        }
      }
      
      if (!modelId) {
        throw new Error("No suitable Leonardo AI model found");
      }
      
      // Create generation
      const generationResponse = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          modelId,
          prompt: enhancedPrompt,
          width: 1024,
          height: 1024,
          promptMagic: true,
          num_images: 1,
          public: false,
          sd_version: "v2"
        })
      });
      
      if (!generationResponse.ok) {
        console.error("Generation request failed:", await generationResponse.text());
        throw new Error(`Generation request failed: ${generationResponse.status}`);
      }
      
      const generationData = await generationResponse.json();
      console.log("Leonardo AI generation initiated:", generationData);
      
      if (!generationData.sdGenerationJob || !generationData.sdGenerationJob.generationId) {
        throw new Error("Invalid response from Leonardo AI API");
      }
      
      const generationId = generationData.sdGenerationJob.generationId;
      
      // Poll for results
      const imageUrl = await this.waitForGenerationCompletion(generationId);
      
      if (!imageUrl) {
        throw new Error("Failed to get generation results");
      }
      
      console.log("Leonardo AI image generated successfully:", imageUrl);
      return imageUrl;
    } catch (error) {
      console.error("Error generating image with Leonardo AI:", error);
      toast.error(`Erro ao gerar imagem com Leonardo AI: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      return null;
    }
  }
  
  private async waitForGenerationCompletion(generationId: string): Promise<string | null> {
    console.log(`Waiting for Leonardo AI generation ${generationId} to complete...`);
    let attempts = 0;
    
    while (attempts < this.maxPollingAttempts) {
      try {
        const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Accept": "application/json"
          }
        });
        
        if (!response.ok) {
          console.error(`Error checking generation status (attempt ${attempts + 1}):`, response.status, response.statusText);
          attempts++;
          
          if (attempts >= this.maxPollingAttempts) {
            return null;
          }
          
          await new Promise(resolve => setTimeout(resolve, this.pollingInterval));
          continue;
        }
        
        const data = await response.json();
        console.log(`Generation status (attempt ${attempts + 1}):`, data.generations_by_pk?.status);
        
        if (data.generations_by_pk?.status === "COMPLETE") {
          if (data.generations_by_pk?.generated_images && data.generations_by_pk.generated_images.length > 0) {
            // Get the first image
            const imageUrl = data.generations_by_pk.generated_images[0]?.url;
            if (imageUrl) {
              return imageUrl;
            }
          }
          
          console.error("Generation complete but no images found");
          return null;
        } else if (data.generations_by_pk?.status === "FAILED") {
          console.error("Generation failed:", data.generations_by_pk?.message || "Unknown error");
          return null;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, this.pollingInterval));
      } catch (error) {
        console.error(`Error polling generation status (attempt ${attempts + 1}):`, error);
        attempts++;
        
        if (attempts >= this.maxPollingAttempts) {
          return null;
        }
        
        await new Promise(resolve => setTimeout(resolve, this.pollingInterval));
      }
    }
    
    console.error(`Generation polling timed out after ${attempts} attempts`);
    return null;
  }
}
