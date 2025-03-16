
interface StoryGenerationParams {
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  imageUrl: string;
}

interface StoryData {
  title: string;
  content: string[];
}

// Esta é uma versão simulada do gerador de histórias
// Em uma implementação real, você faria uma chamada à API de IA
export const generateStory = async (params: StoryGenerationParams): Promise<StoryData> => {
  // Simula um atraso de API
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { childName, childAge, theme, setting } = params;
  
  // Temas e configurações para personalizar as histórias
  const themeDetails: Record<string, {title: string, intro: string}> = {
    adventure: {
      title: `A Grande Aventura de ${childName}`,
      intro: `Era uma vez, ${childName}, uma criança de ${childAge} cheia de coragem e curiosidade.`
    },
    fantasy: {
      title: `${childName} e o Reino Mágico`,
      intro: `Em um mundo cheio de magia e encantamentos, vivia ${childName}, uma criança de ${childAge} com poderes especiais.`
    },
    space: {
      title: `${childName} e a Viagem Espacial`,
      intro: `Entre as estrelas e planetas, ${childName}, uma criança astronauta de ${childAge}, embarcou em uma missão espacial incrível.`
    },
    ocean: {
      title: `${childName} e os Mistérios do Oceano`,
      intro: `Nas profundezas do oceano, ${childName}, uma criança de ${childAge}, descobriu um mundo secreto e encantador.`
    },
    dinosaurs: {
      title: `${childName} e os Dinossauros`,
      intro: `Há milhões de anos, quando os dinossauros dominavam a Terra, ${childName}, uma corajosa criança de ${childAge}, fez uma viagem no tempo incrível.`
    }
  };
  
  const settingDetails: Record<string, string> = {
    forest: `Na Floresta Encantada, onde as árvores falavam e os animais cantavam, ${childName} encontrou um mapa misterioso.`,
    castle: `No Castelo Mágico, com torres que chegavam às nuvens e salões decorados com cristais brilhantes, ${childName} conheceu a Rainha das Fadas.`,
    space: `Na vasta imensidão do espaço, a bordo da nave Estrela Brilhante, ${childName} avistou um planeta nunca antes explorado.`,
    underwater: `No colorido Reino Submarino, cercado de corais vibrantes e peixes amigáveis, ${childName} descobriu uma caverna secreta.`,
    dinosaurland: `Na Terra dos Dinossauros, com florestas densas e vulcões ativos, ${childName} fez amizade com um pequeno Triceratops.`
  };
  
  // Gera o conteúdo da história baseado nos parâmetros
  const selectedTheme = themeDetails[theme];
  const selectedSetting = settingDetails[setting];
  
  // História em formato de páginas
  const content = [
    selectedTheme.intro,
    
    selectedSetting,
    
    `Um dia, enquanto ${childName} explorava ${theme === 'space' ? 'o universo' : 
                                               theme === 'ocean' ? 'o oceano' : 
                                               theme === 'dinosaurs' ? 'o vale dos dinossauros' : 
                                               'o local'}, 
    algo incrível aconteceu. Uma luz brilhante apareceu, revelando um amigo mágico que precisava de ajuda.`,
    
    `"Olá, ${childName}," disse o amigo. "Preciso da sua ajuda para encontrar o tesouro perdido da ${
      theme === 'adventure' ? 'Coragem' : 
      theme === 'fantasy' ? 'Magia' : 
      theme === 'space' ? 'Galáxia' : 
      theme === 'ocean' ? 'Atlântida' : 
      'Era dos Dinossauros'
    }."`,
    
    `${childName}, sempre ${childAge.includes('ano') ? 'disposto' : 'disposta'} a ajudar, aceitou o desafio. 
    Juntos, eles atravessaram ${
      theme === 'adventure' ? 'montanhas altas e rios caudalosos' : 
      theme === 'fantasy' ? 'portais mágicos e nuvens de algodão-doce' : 
      theme === 'space' ? 'cinturões de asteroides e nuvens de poeira estelar' : 
      theme === 'ocean' ? 'recifes de coral coloridos e florestas de algas marinhas' : 
      'vales profundos e montanhas vulcânicas'
    }.`,
    
    `Depois de muitas aventuras, ${childName} encontrou o tesouro! Não era ouro nem diamantes, mas sim ${
      theme === 'adventure' ? 'um mapa para novas aventuras' : 
      theme === 'fantasy' ? 'um livro de feitiços mágicos' : 
      theme === 'space' ? 'uma coleção de estrelas brilhantes' : 
      theme === 'ocean' ? 'pérolas que concediam desejos' : 
      'ovos de dinossauro prestes a chocar'
    }.`,
    
    `"Você é incrível, ${childName}!" disse o amigo mágico. "Sua coragem e bondade salvaram o dia."`,
    
    `${childName} voltou para casa, ${childAge.includes('ano') ? 'cansado' : 'cansada'} mas feliz. Agora, sempre que olha para as ${
      theme === 'adventure' ? 'montanhas ao longe' : 
      theme === 'fantasy' ? 'estrelas no céu' : 
      theme === 'space' ? 'estrelas no céu' : 
      theme === 'ocean' ? 'ondas do mar' : 
      'nuvens em formato de dinossauro'
    }, ${childName} sorri, sabendo que uma nova aventura sempre espera por ${childAge.includes('ano') ? 'ele' : 'ela'}.`,
    
    `E assim termina esta história, mas as aventuras de ${childName} continuam para sempre. Fim.`
  ];
  
  return {
    title: selectedTheme.title,
    content: content
  };
};
