
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// API keys - In production, these should be secured through environment variables
const LEONARDO_API_KEY = "02e45c13-5abe-4962-9c58-670683e91be0";
const OPENAI_API_KEY = "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";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type StoryParams = {
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  imageUrl?: string | null;
  characterPrompt?: string | null;
  readingLevel?: string;
  language?: string;
  moral?: string;
  pageCount?: number;
};

export class StoryBot {
  private isGenerating: boolean = false;
  private apiAvailable: boolean = true;
  private MAX_RETRIES: number = 2;
  private API_TIMEOUT: number = 30000; // 30 seconds
  private leonardoApiAvailable: boolean = true;

  constructor() {
    // Check if API was previously marked as unavailable
    const apiIssue = localStorage.getItem("storybot_api_issue");
    if (apiIssue === "true") {
      this.apiAvailable = false;
    }

    // Check if Leonardo API was previously marked as unavailable
    const leonardoApiIssue = localStorage.getItem("leonardo_api_issue");
    if (leonardoApiIssue === "true") {
      this.leonardoApiAvailable = false;
    }
  }

  public isApiAvailable(): boolean {
    return this.apiAvailable;
  }

  public isLeonardoApiAvailable(): boolean {
    return this.leonardoApiAvailable;
  }

  public async getSystemPrompt(): Promise<string> {
    try {
      // Try to get the system prompt from the database
      const { data: promptData, error: promptError } = await supabase
        .from("storybot_prompts")
        .select("prompt")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!promptError && promptData?.prompt) {
        return promptData.prompt;
      }
    } catch (err) {
      console.log("Error fetching prompt from database, will try localStorage:", err);
    }
    
    // Try localStorage as fallback
    const localPrompt = localStorage.getItem('storybot_prompt');
    if (localPrompt) {
      console.log("Using localStorage prompt");
      return localPrompt;
    }
    
    // Default system prompt if none exists
    console.log("Using default prompt");
    return `Você é um assistente de criação de histórias infantis chamado StoryBot. Você deve criar histórias interessantes, educativas e apropriadas para crianças, baseadas nas informações fornecidas pelo usuário.

Suas respostas devem ser:
1. Criativas e envolventes
2. Apropriadas para a idade indicada
3. Em português do Brasil
4. Livres de conteúdo assustador, violento ou inadequado
5. Bem estruturadas com começo, meio e fim
6. Ricas em detalhes visuais e sensoriais
7. Com personagens cativantes e memoráveis

Quando o usuário fornecer o nome e idade da criança, tema e cenário, você deve criar uma história com um personagem principal daquele nome e incorporar os elementos solicitados. Cada página deve ter conteúdo substancial com pelo menos 3-4 parágrafos (cerca de 150-200 palavras) para criar uma experiência de leitura rica.`;
  }

  public async generateStoryBotResponse(messages: Message[], userPrompt: string): Promise<string> {
    this.isGenerating = true;
    
    try {
      const systemPrompt = await this.getSystemPrompt();
      
      // Format conversation history for OpenAI
      const formattedMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role === "user" ? "user" as const : "assistant" as const,
          content: msg.content
        }))
      ];

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), this.API_TIMEOUT);
      });

      // Make API call to OpenAI
      const { OpenAI } = await import("openai");
      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const response = await Promise.race([
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 1500,
        }),
        timeoutPromise
      ]) as any;

      this.apiAvailable = true;
      return response.choices[0]?.message.content || "Desculpe, não consegui gerar uma resposta.";
      
    } catch (error) {
      console.error("Error generating StoryBot response:", error);
      // Mark API as unavailable
      this.apiAvailable = false;
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      localStorage.setItem("storybot_api_issue", "true");
      
      // Provide a graceful fallback response
      const fallbackResponses = [
        "Peço desculpas, estou com dificuldades técnicas no momento. Estou usando um gerador local de histórias para continuar te ajudando. Poderia tentar novamente com outras palavras?",
        "Estou tendo problemas para acessar minha base de conhecimento completa, mas posso continuar te ajudando com o gerador local de histórias. Vamos tentar algo diferente?",
        "Parece que houve um problema na conexão. Estou trabalhando com recursos limitados agora, mas ainda posso criar histórias legais para você. Poderia reformular sua pergunta?"
      ];
      
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    } finally {
      this.isGenerating = false;
    }
  }

  public async generateStory(params: StoryParams): Promise<{ title: string; content: string[] }> {
    if (!this.apiAvailable) {
      return this.generateStoryFallback(params);
    }

    try {
      const { childName, childAge, theme, setting, characterPrompt, readingLevel, language, moral, pageCount = 10 } = params;
      
      // Create prompt for story generation
      const storyPrompt = `Crie uma história infantil completa para ${childName}, que tem ${childAge} anos.
      
Tema: ${theme}
Cenário: ${setting}
${characterPrompt ? `Personagem especial: ${characterPrompt}` : ''}
Nível de leitura: ${readingLevel || 'intermediário'}
Idioma: ${language || 'português'}
Moral da história: ${moral || 'amizade'}
Número de páginas: ${pageCount}

Formate a saída da seguinte forma:
TITULO: [título da história]

PAGINA 1: [conteúdo da primeira página]

PAGINA 2: [conteúdo da segunda página]

E assim por diante até a última página. Cada página deve ter um parágrafo substancial (150-200 palavras).
Não inclua sugestões para ilustrações ou imagens, apenas o texto da história.`;

      const messages: Message[] = [{ role: "user", content: storyPrompt }];
      const storyResult = await this.generateStoryBotResponse(messages, storyPrompt);
      
      return this.parseStoryContent(storyResult, childName, pageCount);
    } catch (error) {
      console.error("Error generating story:", error);
      throw error;
    }
  }

  public async generateStoryFallback(params: StoryParams): Promise<{ title: string; content: string[] }> {
    const { childName, childAge, theme, setting, pageCount = 10 } = params;
    
    // Simple titles based on theme
    const themeTitles: Record<string, string[]> = {
      adventure: ["A Grande Aventura", "Em Busca do Tesouro", "Jornada Incrível"],
      fantasy: ["O Mundo Mágico", "Reino Encantado", "Poderes Mágicos"],
      space: ["Viagem Espacial", "Explorando as Estrelas", "Aventura no Espaço"],
      ocean: ["Mistérios do Oceano", "Aventura Submarina", "Tesouros do Mar"],
      dinosaurs: ["Era dos Dinossauros", "Amigos Pré-históricos", "Aventura Jurássica"]
    };
    
    // Pick a random title based on theme or use default
    const titles = themeTitles[theme] || themeTitles.adventure;
    const title = `${titles[Math.floor(Math.random() * titles.length)]} de ${childName}`;
    
    // Generate content based on theme and setting
    const content: string[] = [];
    const settingDesc = this.getSettingDescription(setting);
    
    for (let i = 0; i < pageCount; i++) {
      // Different content for beginning, middle, and end
      if (i === 0) {
        // Introduction
        content.push(`Era uma vez, ${childName}, uma criança de ${childAge} anos que adorava aventuras. Um dia, ${childName} descobriu um caminho secreto que levava para ${settingDesc}. Com muita coragem, decidiu explorar este lugar incrível, sem saber as maravilhas que encontraria pela frente. O sol brilhava, os pássaros cantavam, e havia um sentimento de magia no ar. ${childName} ajustou sua mochila, respirou fundo, e deu o primeiro passo em direção à maior aventura de sua vida.`);
      } else if (i === pageCount - 1) {
        // Conclusion
        content.push(`Depois de tantas aventuras incríveis, ${childName} percebeu que era hora de voltar para casa. Levava consigo não apenas memórias maravilhosas, mas também importantes lições sobre coragem, amizade e perseverança. Ao chegar em casa, ${childName} não via a hora de contar para todos sobre sua incrível jornada em ${settingDesc}. E mesmo que ninguém acreditasse em suas histórias fantásticas, ${childName} sabia que tudo havia sido real. "Até a próxima aventura", sussurrou antes de adormecer, sonhando com todas as novas jornadas que ainda estavam por vir.`);
      } else {
        // Middle pages - mix of themed content
        content.push(this.getThemedPageContent(childName, theme, setting, i));
      }
    }
    
    return { title, content };
  }

  private getSettingDescription(setting: string): string {
    const descriptions: Record<string, string> = {
      forest: "uma floresta encantada cheia de árvores antigas e criaturas mágicas",
      castle: "um castelo mágico com torres altas e salas secretas",
      space: "o vasto espaço sideral, entre estrelas brilhantes e planetas coloridos",
      underwater: "o mundo submarino, com recifes de coral vibrantes e peixes coloridos",
      dinosaurland: "a incrível terra dos dinossauros, com criaturas enormes e paisagens pré-históricas"
    };
    
    return descriptions[setting] || "um lugar mágico e misterioso";
  }

  private getThemedPageContent(childName: string, theme: string, setting: string, pageNumber: number): string {
    // Adventure-themed content pieces
    const adventures = [
      `${childName} continuou explorando e encontrou uma ponte suspensa sobre um rio cristalino. Do outro lado, havia uma caverna misteriosa que brilhava com luzes coloridas. "Será que devo atravessar?", pensou. A curiosidade era maior que o medo, então com passos cuidadosos, ${childName} atravessou a ponte balançante. O som da água correndo embaixo tornava tudo ainda mais emocionante. Ao chegar do outro lado, respirou fundo e entrou na caverna cintilante.`,
      
      `Dentro da caverna, ${childName} encontrou um mapa antigo escondido entre as rochas. O mapa mostrava o caminho para um tesouro escondido! Seguindo as pistas, atravessou um túnel estreito que o levou a uma clareira secreta. Lá, sob a luz que entrava por uma abertura no teto, estava uma pequena caixa decorada com pedras preciosas. ${childName} se aproximou com cuidado, imaginando o que poderia encontrar dentro.`,
      
      `De repente, ${childName} ouviu um barulho estranho vindo de trás das árvores. Com o coração acelerado, deu alguns passos para trás. Para sua surpresa, apareceu um pequeno animal falante que se apresentou como o guardião daquele lugar mágico. "Meu nome é Bolota", disse a criatura. "Estou procurando alguém corajoso para me ajudar em uma missão importante. Você parece ser exatamente quem eu procurava!"`
    ];
    
    // Fantasy-themed content pieces
    const fantasy = [
      `${childName} encontrou uma varinha mágica caída entre as flores coloridas. Ao tocá-la, a varinha começou a brilhar e pequenas faíscas coloridas dançaram ao redor. Um pequeno pergaminho apareceu flutuando no ar com uma mensagem: "Apenas corações puros podem despertar a verdadeira magia". ${childName} segurou a varinha com firmeza e sentiu um formigamento nos dedos enquanto um arco-íris se formava no céu.`,
      
      `Uma porta mágica apareceu no tronco de uma árvore antiga. ${childName} girou a maçaneta dourada e entrou em um mundo completamente diferente, onde as flores cantavam, as rochas conversavam e os animais vestiam roupas coloridas. Uma raposa usando um chapéu verde aproximou-se e fez uma reverência. "Bem-vindo ao Reino Encantado", disse ela. "Estávamos esperando por você há muito tempo."`,
      
      `${childName} descobriu um livro mágico cujas páginas mudavam de história cada vez que era aberto. Ao virar uma página, as palavras começaram a flutuar e formar imagens no ar. "Você pode entrar na história que escolher", sussurrou uma voz. "Basta tocar na imagem que mais lhe agradar." Fascinado, ${childName} observou as diferentes cenas que se formavam: castelos nas nuvens, dragões amigáveis e cidades subaquáticas.`
    ];
    
    // Space-themed content pieces
    const space = [
      `A nave espacial de ${childName} pousou em um planeta desconhecido. O céu tinha três luas de cores diferentes: uma roxa, uma azul e uma amarela. O solo era macio e brilhava levemente com cada passo. Ao longe, torres de cristal refletiam a luz das estrelas. "Bem-vindo ao Planeta Lumina", disse uma voz amigável. ${childName} virou-se e viu um pequeno ser de pele azul brilhante sorrindo.`,
      
      `${childName} flutuava em gravidade zero, dando cambalhotas no espaço enquanto observava a Terra pela janela da estação espacial. As estrelas pareciam tão próximas que dava vontade de tocá-las. Um cometa passou deixando um rastro brilhante, e ${childName} fez um pedido, como sua avó havia ensinado. De repente, uma luz forte apareceu no horizonte. Era um novo sistema solar esperando para ser explorado!`,
      
      `O traje espacial de ${childName} tinha um botão especial que permitia voar entre as estrelas. Ao pressionar o botão, uma energia dourada o envolveu e logo estava navegando entre planetas coloridos e nebulosas impressionantes. Uma galáxia em forma de espiral convidava para uma aventura. "Vamos ver o que existe do outro lado", pensou ${childName}, ajustando os controles e acelerando em direção ao desconhecido.`
    ];
    
    // Ocean-themed content pieces
    const ocean = [
      `Mergulhando mais fundo, ${childName} descobriu uma cidade subaquática habitada por sereias e tritões. As construções eram feitas de conchas gigantes e corais brilhantes. Uma jovem sereia com cauda esmeralda acenou, convidando-o para explorar. "Nossa cidade está em perigo", explicou ela. "Uma tempestade mágica está destruindo nossos recifes, e precisamos de ajuda para encontrar a Pérola do Oceano, que pode acalmar as águas."`,
      
      `${childName} nadava ao lado de uma família de golfinhos que o guiava através de um túnel de algas luminescentes. A água era tão clara que podia ver cardumes coloridos dançando ao redor. Um polvo muito inteligente apareceu e entregou a ${childName} um mapa do tesouro desenhado com tinta especial que só aparecia debaixo d'água. "Siga para o naufrágio antigo", orientou o polvo, apontando com um de seus oito tentáculos.`,
      
      `Um cavalo-marinho brilhante levou ${childName} para explorar um jardim de anêmonas dançantes. "Estes são os Jardins Flutuantes", explicou o cavalo-marinho. "Apenas visitantes especiais podem vê-los." As anêmonas liberavam pequenas bolhas que, ao estourar, realizavam pequenos desejos. ${childName} pegou uma bolha com cuidado e fez um desejo, observando maravilhado quando a bolha explodiu em mil partículas cintilantes.`
    ];
    
    // Dinosaur-themed content pieces
    const dinosaurs = [
      `${childName} escondeu-se atrás de uma samambaia gigante ao ouvir passos pesados. Um enorme Braquiossauro apareceu, mas para surpresa de ${childName}, o dinossauro era gentil e ofereceu ajuda. "Suba no meu pescoço", convidou o gigante amigável. "Posso mostrar a você toda a região." Do alto, ${childName} podia ver vulcões fumegantes à distância, rios serpenteando pela planície e outros dinossauros pastando pacificamente.`,
      
      `Um filhote de Triceratops perdido aproximou-se de ${childName}, parecendo assustado. "Não consigo encontrar minha família", explicou o pequeno dinossauro. ${childName} decidiu ajudar e juntos seguiram pegadas enormes até uma floresta de samambaias. Lá, encontraram a manada de Triceratops. A mãe do filhote estava tão agradecida que convidou ${childName} para conhecer seu ninho e apresentou todos os membros da família.`,
      
      `${childName} descobriu ovos de dinossauro brilhando sob a luz do sol. Ao se aproximar, um dos ovos começou a rachar! Com cuidado, observou enquanto um bebê Pterodáctilo rompia a casca e saía para o mundo. O filhote imediatamente fixou os olhos em ${childName} e começou a segui-lo por toda parte. "Parece que ele pensa que você é sua mãe", riu um velho Estegossauro que passava por ali. "É uma grande responsabilidade."`,
    ];
    
    // Select content based on theme
    let contentPieces;
    switch (theme) {
      case "fantasy": contentPieces = fantasy; break;
      case "space": contentPieces = space; break;
      case "ocean": contentPieces = ocean; break;
      case "dinosaurs": contentPieces = dinosaurs; break;
      default: contentPieces = adventures;
    }
    
    // Calculate which piece to use based on page number (cycling through options)
    const index = (pageNumber - 1) % contentPieces.length;
    return contentPieces[index];
  }

  public async generateImageDescription(
    pageText: string,
    characterName: string,
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string = ""
  ): Promise<string> {
    if (!this.apiAvailable) {
      return `Ilustração detalhada de ${characterName} em uma aventura no cenário de ${setting} com tema de ${theme}. A cena mostra: ${pageText.substring(0, 100)}...`;
    }
    
    try {
      // Enhanced image description prompt
      const imagePrompt = `Crie uma descrição detalhada para ilustração de livro infantil no estilo cartoon, com um visual colorido, encantador e adequado para crianças. O protagonista da história é ${characterName}, e a imagem deve representar fielmente a cena descrita no texto abaixo. O cenário é ${setting}, que deve ser detalhado de forma vibrante e mágica. A ilustração deve expressar emoções, ação e aventura, transmitindo a essência da história de forma visualmente envolvente. Garanta que os elementos do ambiente, cores e expressões dos personagens estejam bem definidos e alinhados ao tom infantil da narrativa.${moralTheme ? ` A ilustração deve refletir a moral: ${moralTheme}.` : ""}

Texto da cena: "${pageText}"

Forneça uma descrição visual completa em até 150 palavras, focando nos elementos visuais principais desta cena. A descrição será usada para gerar uma ilustração. Enfatize as cores, expressões, ambiente e ação principal.`;
      
      const messages: Message[] = [{ role: "user", content: imagePrompt }];
      return await this.generateStoryBotResponse(messages, "");
    } catch (error) {
      console.error("Error generating image description:", error);
      this.apiAvailable = false;
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      localStorage.setItem("storybot_api_issue", "true");
      
      return `Ilustração detalhada de ${characterName} em uma aventura no cenário de ${setting} com tema de ${theme}.`;
    }
  }
  
  public async generateImage(
    imageDescription: string,
    characterName: string,
    theme: string,
    setting: string,
    childImageBase64: string | null,
    style: string = "cartoon",
    characterPrompt: string | null = null
  ): Promise<string> {
    console.log("Generating image:", { imageDescription, theme, style });
    
    try {
      // Check if Leonardo API is available
      if (!this.leonardoApiAvailable) {
        throw new Error("Leonardo API marked as unavailable");
      }

      // Enhance prompt with style and character information
      let enhancedPrompt = imageDescription;
      
      if (characterPrompt) {
        enhancedPrompt += `\n\nCharacter details: ${characterPrompt}`;
      }
      
      // Add style instructions
      const styleInstructions = {
        cartoon: "vibrant cartoon style, bright colors, simple shapes, child-friendly illustration",
        watercolor: "soft watercolor style, gentle brushstrokes, dreamy atmosphere, pastel colors",
        realistic: "realistic illustration, detailed, natural lighting, proper proportions",
        childrenbook: "classic children's book illustration, warm colors, gentle outlines, storybook feel",
        papercraft: "paper craft style, 3D paper elements, textured, colorful paper cutouts"
      };
      
      enhancedPrompt += `\n\nStyle: ${styleInstructions[style as keyof typeof styleInstructions] || styleInstructions.cartoon}`;
      
      // Call Leonardo API to generate image
      const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LEONARDO_API_KEY}`
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          modelId: "1e7737d7-545e-469f-857f-44398ad5588c", // Leonardo Creative model
          width: 768,
          height: 768,
          num_images: 1,
          prompt_magic: true,
          highContrast: true,
          negative_prompt: "poor quality, blurry, distorted, deformed, disfigured, low resolution, ugly, duplicate, morbid, mutilated, mutation, disgusting, bad anatomy, bad proportions, watermark, signature, text"
        })
      });

      if (!response.ok) {
        console.error("Leonardo API error:", await response.text());
        throw new Error(`Leonardo API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Leonardo API response:", data);

      // Check if we have a generation ID
      if (!data.generationId) {
        throw new Error("No generation ID received from Leonardo API");
      }

      // Poll for the generated image
      const generationId = data.generationId;
      let imageUrl = "";
      let attempts = 0;
      const maxAttempts = 10;

      while (!imageUrl && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between polls

        const statusResponse = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
          headers: {
            "Authorization": `Bearer ${LEONARDO_API_KEY}`
          }
        });

        if (!statusResponse.ok) {
          console.error("Error checking generation status:", await statusResponse.text());
          continue;
        }

        const statusData = await statusResponse.json();
        console.log("Generation status:", statusData);

        if (statusData.generations_by_pk.status === "COMPLETE") {
          if (statusData.generations_by_pk.generated_images && statusData.generations_by_pk.generated_images.length > 0) {
            imageUrl = statusData.generations_by_pk.generated_images[0].url;
            this.leonardoApiAvailable = true;
            return imageUrl;
          }
        } else if (statusData.generations_by_pk.status === "FAILED") {
          throw new Error("Image generation failed");
        }
      }

      if (!imageUrl) {
        throw new Error("Failed to get generated image after multiple attempts");
      }

      return imageUrl;
    } catch (error) {
      console.error("Error generating image with Leonardo API:", error);
      
      // Mark Leonardo API as unavailable
      this.leonardoApiAvailable = false;
      localStorage.setItem("leonardo_api_issue", "true");
      
      // Fall back to themed placeholders
      const themeImages = {
        adventure: "/images/placeholders/adventure.jpg",
        fantasy: "/images/placeholders/fantasy.jpg",
        space: "/images/placeholders/space.jpg",
        ocean: "/images/placeholders/ocean.jpg",
        dinosaurs: "/images/placeholders/dinosaurs.jpg"
      };
      
      toast.error("Não foi possível gerar imagens personalizadas. Usando imagens pré-definidas.");
      return themeImages[theme as keyof typeof themeImages] || "/images/placeholders/adventure.jpg";
    }
  }
  
  private parseStoryContent(response: string, childName: string, pageCount: number = 10): { title: string; content: string[] } {
    // Clean up any illustration instructions
    let cleanedResponse = response.replace(/ilustração:|illustration:|desenhe:|draw:|imagem:|image:|descrição visual:|visual description:|prompt de imagem:|image prompt:/gi, '');
    
    // Extract title
    const titleMatch = cleanedResponse.match(/TITULO:\s*(.*?)(?:\r?\n|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : `História de ${childName}`;
    
    // Extract pages
    const pageMatches = cleanedResponse.match(/PAGINA\s*\d+:\s*([\s\S]*?)(?=PAGINA\s*\d+:|$)/gi);
    
    let content: string[] = [];
    if (pageMatches && pageMatches.length > 0) {
      content = pageMatches.map(page => {
        return page.replace(/PAGINA\s*\d+:\s*/i, '')
          .replace(/ilustração:|illustration:|desenhe:|draw:|imagem:|image:|descrição visual:|visual description:|prompt de imagem:|image prompt:/gi, '')
          .trim();
      });
    } else {
      // If no page markers, split by paragraphs
      const paragraphs = cleanedResponse.split('\n\n').filter(para => 
        para.trim().length > 0 && !para.match(/TITULO:/i)
      );
      
      content = paragraphs;
    }
    
    // Ensure we have at least pageCount pages
    while (content.length < pageCount) {
      content.push(`A aventura de ${childName} continua...`);
    }
    
    // Limit to pageCount pages
    content = content.slice(0, pageCount);
    
    return { title, content };
  }
}
