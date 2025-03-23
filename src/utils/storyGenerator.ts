import { OpenAI } from "openai";

interface StoryGenerationParams {
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  imageUrl: string;
  characterPrompt?: string;
}

interface StoryData {
  title: string;
  content: string[];
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: "sk-dummy-key",
  dangerouslyAllowBrowser: true
});

// Function to generate story using OpenAI's GPT-4
export const generateStoryWithGPT4 = async (params: StoryGenerationParams, openaiKey: string): Promise<StoryData> => {
  const { childName, childAge, theme, setting, characterPrompt } = params;
  
  // Set the OpenAI API key
  openai.apiKey = openaiKey;
  
  try {
    // Enhanced prompt that includes character description for consistency
    const prompt = `Create a children's story for ${childName}, who is ${childAge} old, with the following details:
    
    Theme: ${theme === 'adventure' ? 'Adventure' : 
      theme === 'fantasy' ? 'Fantasy' : 
      theme === 'space' ? 'Space' : 
      theme === 'ocean' ? 'Ocean' : 
      'Dinosaurs'}
    
    Setting: ${setting === 'forest' ? 'Enchanted Forest' : 
      setting === 'castle' ? 'Magical Castle' : 
      setting === 'space' ? 'Outer Space' : 
      setting === 'underwater' ? 'Underwater World' : 
      'Dinosaur Land'}
    
    Character Description: ${characterPrompt || `${childName} is a child who loves adventures`}
    
    Please create a story with:
    1. A creative title
    2. 10 short paragraphs (one for each page)
    3. A proper beginning, middle and end
    4. Age-appropriate content with a positive message
    5. Using ${childName} as the main character with CONSISTENT appearance and personality throughout the story
    6. Make sure to maintain a consistent visual description of ${childName} throughout all pages
    
    Format the response as follows:
    TITLE: [Story Title]
    
    PAGE 1: [First paragraph]
    
    PAGE 2: [Second paragraph]
    
    And so on until PAGE 10.`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are a children's story writer creating personalized stories for young children. Your stories are engaging, age-appropriate, and positive. You must maintain character consistency throughout the story, both in personality and physical appearance." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
    
    const responseText = completion.choices[0]?.message?.content || "";
    
    // Parse the response to extract title and content
    const titleMatch = responseText.match(/TITLE:\s*(.*?)(?:\r?\n|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : `${childName}'s Adventure`;
    
    const pageMatches = responseText.match(/PAGE\s*\d+:\s*([\s\S]*?)(?=PAGE\s*\d+:|$)/gi);
    
    let content: string[] = [];
    if (pageMatches && pageMatches.length > 0) {
      content = pageMatches.map(page => {
        return page.replace(/PAGE\s*\d+:\s*/i, '').trim();
      });
    } else {
      // Fallback if page format isn't found
      const paragraphs = responseText.split('\n\n').filter(para => 
        para.trim().length > 0 && !para.match(/TITLE:/i)
      );
      
      content = paragraphs;
    }
    
    // Ensure we have exactly 10 pages
    while (content.length < 10) {
      content.push(`${childName} continued on the adventure, discovering new wonders at every turn...`);
    }
    
    // Limit to 10 pages if there are more
    content = content.slice(0, 10);
    
    return {
      title,
      content
    };
  } catch (error) {
    console.error("Error generating story with GPT-4:", error);
    // Fall back to the local generator
    return generateStory(params);
  }
};

// Esta é uma versão simulada do gerador de histórias que será usada como fallback
// Em uma implementação real, você faria uma chamada à API de IA
export const generateStory = async (params: StoryGenerationParams): Promise<StoryData> => {
  // Simula um atraso de API
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { childName, childAge, theme, setting } = params;
  
  // Temas e configurações para personalizar as histórias com descrições mais detalhadas
  const themeDetails: Record<string, {title: string, intro: string}> = {
    adventure: {
      title: `A Grande Aventura de ${childName}`,
      intro: `Era uma vez, ${childName}, uma criança de ${childAge} cheia de coragem e curiosidade, sempre pronta para explorar o mundo ao seu redor.`
    },
    fantasy: {
      title: `${childName} e o Reino Mágico`,
      intro: `Em um mundo cheio de magia e encantamentos, vivia ${childName}, uma criança de ${childAge} com poderes especiais que ainda não havia descoberto completamente.`
    },
    space: {
      title: `${childName} e a Viagem Espacial`,
      intro: `Entre as estrelas e planetas coloridos, ${childName}, uma criança astronauta de ${childAge}, embarcou em uma missão espacial incrível a bordo de sua nave reluzente.`
    },
    ocean: {
      title: `${childName} e os Mistérios do Oceano`,
      intro: `Nas profundezas do oceano cristalino, ${childName}, uma criança de ${childAge} com habilidades especiais de comunicação com criaturas marinhas, descobriu um mundo secreto e encantador.`
    },
    dinosaurs: {
      title: `${childName} e os Dinossauros`,
      intro: `Há milhões de anos, quando os dinossauros gigantes dominavam a Terra verdejante, ${childName}, uma corajosa criança de ${childAge}, fez uma viagem no tempo incrível através de um portal mágico.`
    }
  };
  
  const settingDetails: Record<string, string> = {
    forest: `Na Floresta Encantada, onde as árvores altíssimas falavam em sussurros e os animais coloridos cantavam melodias doces, ${childName} encontrou um mapa misterioso escondido entre raízes brilhantes.`,
    castle: `No Castelo Mágico, com torres majestosas que chegavam às nuvens fofas e salões decorados com cristais que refletiam arco-íris, ${childName} conheceu a Rainha das Fadas com sua coroa cintilante.`,
    space: `Na vasta imensidão do espaço estrelado, a bordo da nave Estrela Brilhante com seus painéis coloridos e janelas de observação, ${childName} avistou um planeta nunca antes explorado envolto em uma aura azul brilhante.`,
    underwater: `No colorido Reino Submarino, cercado de corais vibrantes que formavam estruturas como castelos e peixes amigáveis com escamas reluzentes, ${childName} descobriu uma caverna secreta escondida atrás de uma grande anêmona rosa.`,
    dinosaurland: `Na Terra dos Dinossauros, com florestas densas de samambaias gigantes e vulcões ativos expelindo fumaça no horizonte, ${childName} fez amizade com um pequeno Triceratops de pele verde-azulada e olhos curiosos.`
  };
  
  // Gera o conteúdo da história baseado nos parâmetros
  const selectedTheme = themeDetails[theme];
  const selectedSetting = settingDetails[setting];
  
  // História em formato de páginas com descrições mais vívidas
  const content = [
    selectedTheme.intro,
    
    selectedSetting,
    
    `Um dia ensolarado, enquanto ${childName} explorava ${theme === 'space' ? 'o universo repleto de estrelas cintilantes' : 
                                               theme === 'ocean' ? 'o oceano com suas águas cristalinas' : 
                                               theme === 'dinosaurs' ? 'o vale verdejante dos dinossauros' : 
                                               'o local mágico'}, 
    algo verdadeiramente incrível aconteceu. Uma luz brilhante e colorida apareceu diante de seus olhos, revelando um amigo mágico com aparência gentil que precisava desesperadamente de ajuda.`,
    
    `"Olá, ${childName}," disse o amigo com voz melodiosa e olhos brilhantes. "Preciso da sua ajuda para encontrar o tesouro perdido da ${
      theme === 'adventure' ? 'Coragem, um medalhão dourado que dá força aos corajosos' : 
      theme === 'fantasy' ? 'Magia, uma varinha cintilante que restaura encantamentos perdidos' : 
      theme === 'space' ? 'Galáxia, uma estrela de cristal que mantém os planetas em harmonia' : 
      theme === 'ocean' ? 'Atlântida, um tridente de coral que acalma as tempestades marinhas' : 
      'Era dos Dinossauros, um ovo reluzente que trará paz entre todas as espécies'
    }."`,
    
    `${childName}, sempre ${childAge.includes('ano') ? 'disposto' : 'disposta'} a ajudar e com um sorriso determinado no rosto, aceitou o desafio sem hesitar. 
    Juntos, eles atravessaram ${
      theme === 'adventure' ? 'montanhas altas cobertas de neve e rios caudalosos com águas cristalinas' : 
      theme === 'fantasy' ? 'portais mágicos reluzentes e nuvens fofas de algodão-doce multicolorido' : 
      theme === 'space' ? 'cinturões de asteroides flutuantes e nuvens cintilantes de poeira estelar dourada' : 
      theme === 'ocean' ? 'recifes de coral vibrantes com peixes coloridos e florestas densas de algas marinhas dançantes' : 
      'vales profundos cobertos de vegetação exuberante e montanhas vulcânicas com lava borbulhante'
    }.`,
    
    `Durante sua jornada, ${childName} encontrou criaturas amigáveis que ofereceram pistas importantes. Uma ${
      theme === 'adventure' ? 'raposa falante de pelo alaranjado' : 
      theme === 'fantasy' ? 'fada minúscula com asas cintilantes' : 
      theme === 'space' ? 'criatura alienígena de pele azul e antenas brilhantes' : 
      theme === 'ocean' ? 'tartaruga marinha sábia com casco decorado' : 
      'pequena pterodáctilo de asas coloridas'
    } mostrou o caminho secreto que ninguém mais conhecia.`,
    
    `Após superar diversos obstáculos com inteligência e trabalho em equipe, ${childName} finalmente chegou a uma ${
      theme === 'adventure' ? 'caverna escondida iluminada por cristais multicoloridos' : 
      theme === 'fantasy' ? 'torre antiga envolta em vinhas floridas e borboletas' : 
      theme === 'space' ? 'estação espacial abandonada com luzes piscando' : 
      theme === 'ocean' ? 'gruta submarina com paredes de pérolas brilhantes' : 
      'clareira secreta cercada por ovos de dinossauros fosforescentes'
    }. Ali, brilhando intensamente, estava o tesouro!`,
    
    `Depois de muitas aventuras emocionantes, ${childName} encontrou o tesouro! Não era ouro nem diamantes, mas sim ${
      theme === 'adventure' ? 'um mapa mágico para novas aventuras que mostrava caminhos que só os verdadeiramente corajosos podiam ver' : 
      theme === 'fantasy' ? 'um livro de feitiços mágicos com páginas que brilhavam como estrelas quando tocadas' : 
      theme === 'space' ? 'uma coleção de estrelas brilhantes que dançavam e contavam histórias de galáxias distantes' : 
      theme === 'ocean' ? 'pérolas luminosas que concediam desejos quando seguradas por corações puros' : 
      'ovos coloridos de dinossauro prestes a chocar, cada um emanando uma aura de cores diferentes'
    }.`,
    
    `"Você é realmente incrível, ${childName}!" exclamou o amigo mágico com os olhos cheios de alegria. "Sua coragem, bondade e inteligência salvaram o dia. Graças a você, ${
      theme === 'adventure' ? 'a coragem voltará aos corações de todos que precisam dela' : 
      theme === 'fantasy' ? 'a magia retornará ao reino e trará felicidade a todos' : 
      theme === 'space' ? 'as galáxias permanecerão em harmonia por muitos anos' : 
      theme === 'ocean' ? 'os oceanos estarão protegidos e as criaturas marinhas viverão em paz' : 
      'os dinossauros viverão em harmonia e os filhotes crescerão felizes'
    }!"`,
    
    `${childName} voltou para casa, ${childAge.includes('ano') ? 'cansado' : 'cansada'} mas extremamente feliz pelo que havia conquistado. Agora, sempre que olha para as ${
      theme === 'adventure' ? 'montanhas majestosas ao longe com seus picos nevados' : 
      theme === 'fantasy' ? 'estrelas cintilantes no céu noturno' : 
      theme === 'space' ? 'estrelas brilhantes que pontilham o céu escuro' : 
      theme === 'ocean' ? 'ondas azuis do mar que quebram suavemente na praia' : 
      'nuvens fofas em formato de dinossauros brincalhões'
    }, ${childName} sorri com olhos brilhantes, sabendo que uma nova aventura sempre espera por ${childAge.includes('ano') ? 'ele' : 'ela'} além do horizonte.`,
    
    `E assim termina esta história mágica, mas as aventuras de ${childName} continuam para sempre no mundo da imaginação. A lição que aprendemos é que com coragem, amizade e bondade, podemos superar qualquer desafio que a vida nos apresente. Fim.`
  ];
  
  return {
    title: selectedTheme.title,
    content: content
  };
};
