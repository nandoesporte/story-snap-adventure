
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Extended interface with new parameters
interface StoryGenerationParams {
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  imageUrl?: string | null;
  characterPrompt?: string;
  readingLevel?: string;
  language?: string;
  moral?: string;
  style?: string;
  length?: string;
}

export async function generateStoryWithGPT4(params: StoryGenerationParams, apiKey: string): Promise<{ title: string; content: string[] }> {
  const {
    childName,
    childAge,
    theme,
    setting,
    imageUrl,
    characterPrompt,
    readingLevel = "intermediate",
    language = "portuguese",
    moral = "friendship",
    style = "cartoon",
    length = "medium"
  } = params;

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  // Create a translation for readingLevel, language and moral to include in the prompt
  const readingLevelMap: { [key: string]: string } = {
    beginner: "simples, frases curtas, vocabulário básico (4-6 anos)",
    intermediate: "moderado, frases mais elaboradas, vocabulário adequado (7-9 anos)",
    advanced: "avançado, frases complexas, vocabulário rico (10-12 anos)"
  };

  const languageMap: { [key: string]: string } = {
    portuguese: "Português",
    english: "Inglês",
    spanish: "Espanhol"
  };

  const moralMap: { [key: string]: string } = {
    friendship: "amizade e cooperação",
    courage: "coragem e superação",
    respect: "respeito às diferenças",
    environment: "cuidado com o meio ambiente",
    honesty: "honestidade e verdade",
    perseverance: "perseverança e esforço"
  };

  const lengthMap: { [key: string]: string } = {
    short: "5",
    medium: "10",
    long: "15"
  };

  const readingLevelDesc = readingLevelMap[readingLevel] || readingLevelMap.intermediate;
  const languageDesc = languageMap[language] || languageMap.portuguese;
  const moralDesc = moralMap[moral] || moralMap.friendship;
  const storyLength = lengthMap[length] || "10";

  // Enhanced story prompt
  const systemPrompt = `Crie uma história infantil mágica e envolvente para crianças. O protagonista será ${childName}, que tem ${childAge} anos, que viverá uma aventura emocionante no cenário ${setting}. O tema da história será ${theme} e deverá ensinar uma lição importante: ${moralDesc}. 

O tom da narrativa deve ser lúdico, divertido e adequado para a faixa etária infantil. A história terá ${storyLength} páginas, com uma estrutura bem definida de introdução, desenvolvimento e desfecho. 

Use uma linguagem ${readingLevelDesc}, com personagens cativantes e elementos visuais encantadores para estimular a imaginação da criança.

IMPORTANTE: 
- Cada página deve ter conteúdo substancial com pelo menos 3-4 parágrafos (cerca de 150-200 palavras por página) para criar uma experiência de leitura rica.
- Use descrições vívidas e detalhadas que permitam visualizar cada cena claramente.
- Inclua diálogos expressivos e emoções dos personagens.
- Mantenha consistência nos personagens ao longo de toda a história.

Retorne a resposta em formato JSON com a seguinte estrutura:
{
  "title": "Título da História",
  "content": ["Texto da página 1", "Texto da página 2", ..., "Texto da página ${storyLength}"]
}

O título deve ser criativo e atraente para crianças. 
A história deve ser independente e completa, com início, meio e fim.
Evite referências a marcas, personagens protegidos por direitos autorais ou temas adultos.`;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Por favor, crie uma história infantil detalhada para ${childName} sobre ${theme} em ${setting}${characterPrompt ? ` com ${characterPrompt}` : ''}.` }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.8,
      max_tokens: 4000, // Increased max tokens to allow for longer story content
    });

    const responseText = response.choices[0]?.message.content || '';
    const jsonStartIndex = responseText.indexOf('{');
    const jsonEndIndex = responseText.lastIndexOf('}') + 1;
    
    if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
      const jsonStr = responseText.substring(jsonStartIndex, jsonEndIndex);
      const jsonResponse = JSON.parse(jsonStr);
      
      return {
        title: jsonResponse.title || "Uma Aventura Mágica",
        content: jsonResponse.content || ["Não foi possível gerar a história. Por favor, tente novamente."]
      };
    } else {
      throw new Error("Formato de resposta inválido");
    }
  } catch (error) {
    console.error("Error generating story with GPT-4:", error);
    throw error;
  }
}

export async function generateStory(params: StoryGenerationParams): Promise<{ title: string; content: string[] }> {
  const {
    childName,
    childAge,
    theme,
    setting,
    characterPrompt,
    readingLevel = "intermediate",
    language = "portuguese",
    moral = "friendship",
    style = "cartoon",
    length = "medium"
  } = params;

  // Local story generator fallback
  console.log(`Generating local story for ${childName} with theme ${theme} in ${setting}`);
  console.log(`Reading level: ${readingLevel}, Language: ${language}, Moral: ${moral}, Style: ${style}`);
  
  // Get number of pages based on length
  const lengthMap: { [key: string]: number } = {
    short: 5,
    medium: 10,
    long: 15
  };
  
  const pageCount = lengthMap[length] || 10;
  
  // Create some title based on theme and setting
  let title = "";
  let content: string[] = [];
  
  switch (theme) {
    case "adventure":
      title = `A Grande Aventura de ${childName}`;
      content = generateAdventureStory(childName, childAge, setting, moral, pageCount);
      break;
    case "fantasy":
      title = `${childName} e a Magia da ${setting}`;
      content = generateFantasyStory(childName, childAge, setting, moral, pageCount);
      break;
    case "space":
      title = `${childName} e a Jornada Espacial`;
      content = generateSpaceStory(childName, childAge, setting, moral, pageCount);
      break;
    case "ocean":
      title = `${childName} e os Mistérios do Oceano`;
      content = generateOceanStory(childName, childAge, setting, moral, pageCount);
      break;
    case "dinosaurs":
      title = `${childName} na Era dos Dinossauros`;
      content = generateDinosaurStory(childName, childAge, setting, moral, pageCount);
      break;
    default:
      title = `A Incrível Jornada de ${childName}`;
      content = generateAdventureStory(childName, childAge, setting, moral, pageCount);
  }
  
  // Add character if specified
  if (characterPrompt) {
    const characterName = characterPrompt.split(":")[1]?.trim() || "o amigo especial";
    content = content.map(page => 
      page.replace("seus amigos", characterName)
           .replace("amigos", characterName)
           .replace("fiel companheiro", characterName)
    );
  }
  
  // Adjust reading level if necessary
  if (readingLevel === "beginner") {
    content = content.map(page => {
      // Simplify sentences for beginners
      return page.split(". ").map(sentence => sentence.replace(/,/g, "").trim()).join(". ");
    });
  } else if (readingLevel === "advanced") {
    // For advanced, we could add more complex vocabulary or longer sentences
    // But for this simple example, we'll keep it as is
  }

  // Ensure we have enough pages to match requested length
  if (content.length < pageCount) {
    // Duplicate last page with variations if we need more pages
    const lastPage = content[content.length - 1];
    for (let i = content.length; i < pageCount; i++) {
      content.push(lastPage);
    }
  } else if (content.length > pageCount) {
    // Trim pages to match requested length
    content = content.slice(0, pageCount);
  }

  return { title, content };
}

// Helper function to generate adventure story
function generateAdventureStory(childName: string, childAge: string, setting: string, moral: string, pageCount: number): string[] {
  // Basic adventure story template
  const storyTemplate = [
    `${childName} estava muito animado(a) para explorar a ${setting} com seus amigos. Era um dia perfeito para uma grande aventura! O sol brilhava entre as folhas das árvores, criando padrões dourados no chão. Pássaros cantavam melodias alegres, e o aroma de flores silvestres preenchia o ar. ${childName} tinha preparado sua mochila com cuidado, colocando um lanche, uma garrafa de água, uma lanterna e seu diário de aventuras, onde anotava todas as descobertas incríveis que fazia.\n\nEnquanto caminhava pela trilha principal, ${childName} observava atentamente cada detalhe ao seu redor. As árvores eram antigas e majestosas, com troncos grossos que pareciam guardar histórias de centenas de anos. Pequenos esquilos corriam de galho em galho, olhando curiosamente para os visitantes que adentravam seu território. Borboletas coloridas dançavam no ar, guiando o caminho como pequenas fadinhas da floresta.\n\n${childName} sempre sentiu uma conexão especial com a natureza. Desde pequeno(a), adorava passar horas explorando jardins e parques, imaginando mundos mágicos escondidos entre as plantas. Agora, nesta grande aventura, sentia que algo especial estava prestes a acontecer. Um formigamento de expectativa percorria seu corpo, como se a própria floresta quisesse revelar seus segredos.\n\n"Vamos ver o que encontramos hoje!", disse ${childName} com entusiasmo, ajustando sua mochila nas costas e seguindo adiante pelo caminho sinuoso que se estendia à sua frente, desaparecendo entre as árvores altas e misteriosas da ${setting}.`,
    
    `Enquanto caminhavam pela ${setting}, ${childName} encontrou um mapa misterioso escondido atrás de uma árvore centenária. O mapa parecia muito antigo, com bordas desgastadas e amareladas pelo tempo. Estava cuidadosamente enrolado e preso com uma fita vermelha desbotada. Ao desenrolá-lo com cuidado, ${childName} viu que era um mapa detalhado da floresta, com símbolos estranhos e linhas que indicavam caminhos secretos.\n\nNo centro do mapa, havia um X marcado em vermelho, com pequenas palavras escritas ao lado: "Onde a luz encontra a sombra, o tesouro aguarda quem é de coração puro". ${childName} sentiu seu coração acelerar de emoção. Um tesouro escondido! Esta aventura estava ficando cada vez mais emocionante.\n\n${childName} estudou o mapa com atenção, tentando decifrar os símbolos e entender o caminho. Alguns desenhos pareciam representar formações rochosas, outros mostravam pequenos lagos e cachoeiras. Depois de alguns minutos analisando cuidadosamente, ${childName} conseguiu identificar onde estava e qual direção deveria seguir.\n\n"Olhem só o que encontrei!", exclamou ${childName} para seus amigos, mostrando o mapa com entusiasmo. "Vamos seguir este caminho e ver onde ele nos leva!" Todos concordaram, contagiados pela empolgação de ${childName}. A promessa de um tesouro escondido era irresistível, e juntos eles se sentiam corajosos o suficiente para enfrentar qualquer desafio.\n\nConforme seguiam o caminho indicado no mapa, a floresta foi ficando mais densa e misteriosa. Os sons dos pássaros foram substituídos por um silêncio quase reverente, como se a própria natureza estivesse segurando a respiração em antecipação. Raios de sol atravessavam a copa das árvores, criando feixes dourados que iluminavam o caminho à frente. ${childName} liderava o grupo, com o mapa firmemente seguro nas mãos e um brilho de determinação nos olhos.`,
    
    `O mapa os levou até uma caverna secreta, escondida atrás de uma densa cortina de vinhas e flores silvestres. A entrada era pequena, quase imperceptível para quem não soubesse exatamente onde procurar. ${childName} afastou cuidadosamente as plantas, revelando uma abertura na rocha grande o suficiente para eles passarem um de cada vez.\n\nA luz do sol penetrava timidamente pelos primeiros metros da caverna, iluminando paredes de pedra cobertas de musgo verde e pequenos cristais que cintilavam como estrelas. A temperatura estava mais fresca ali dentro, e o som de água gotejando ecoava suavemente, criando uma melodia natural que parecia dar boas-vindas aos visitantes.\n\nConforme avançavam mais para o interior da caverna, ${childName} acendeu sua lanterna para iluminar o caminho. O feixe de luz revelou desenhos antigos nas paredes – figuras de animais, pessoas e símbolos misteriosos que contavam histórias de tempos passados. Eram pinturas feitas há muito tempo, preservadas pela proteção da caverna.\n\n"Olhem ali!", sussurrou um dos amigos, apontando para uma câmara maior à frente. Quando entraram nesse espaço, todos ficaram sem fôlego. No centro da câmara, sobre uma pequena elevação de pedra que parecia um altar natural, estava um baú de madeira entalhada, decorado com pedras coloridas e fechos de metal trabalhado. Um raio de sol entrava por uma abertura no teto da caverna, iluminando o baú como se fosse um objeto sagrado.\n\n${childName} se aproximou lentamente, com uma mistura de reverência e excitação. Seus dedos tocaram suavemente a madeira antiga do baú, sentindo as entalhes sob as pontas dos dedos. Havia uma pequena fechadura dourada, mas nenhuma chave à vista. "Como vamos abri-lo?", perguntou um dos amigos, olhando ao redor em busca de pistas. Foi então que ${childName} notou que um dos símbolos no baú era idêntico a um que havia visto na entrada da caverna.`,
    
    `Dentro do baú havia um conjunto de chaves mágicas que podiam abrir qualquer porta na ${setting}. Eram cinco chaves, cada uma feita de um material diferente e decorada com símbolos únicos. A primeira era de ouro brilhante, com um sol entalhado na ponta. A segunda, prateada como a lua, tinha o formato de uma estrela cadente. A terceira parecia feita de cristal azul transparente, que mudava de cor conforme a luz. A quarta era de madeira antiga e entalhada com pequenas folhas. A quinta, a mais misteriosa de todas, parecia feita de uma pedra verde esmeralda e tinha desenhos de animais gravados em toda sua extensão.\n\n${childName} pegou as chaves com cuidado, sentindo um leve formigamento nos dedos ao tocá-las. Havia também um pequeno pergaminho dentro do baú, com instruções escritas em uma letra elegante: "Estas são as Chaves dos Elementos, guardiãs dos cinco reinos da floresta. Apenas aqueles com coragem, sabedoria e um coração gentil podem desbloquear seus poderes. Use-as para ajudar quem precisa, nunca para ganho próprio."\n\n${childName} olhou para seus amigos com espanto e excitação. Eles não tinham encontrado apenas um tesouro comum, mas algo muito mais especial – um instrumento mágico para ajudar a floresta e seus habitantes. Foi então que ouviram um fraco chamado de socorro vindo de algum lugar próximo.\n\n"Vocês ouviram isso?", perguntou ${childName}, guardando as chaves cuidadosamente em sua mochila. Todos assentiram e rapidamente decidiram investigar. Seguindo o som, eles saíram da caverna por outro caminho e encontraram um pequeno esquilo preso em uma armadilha de caçadores. Seus olhos escuros imploravam por ajuda, e sua patinha estava machucada.\n\nSem hesitar, ${childName} se aproximou do pequeno animal, falando em uma voz suave e tranquilizadora. "Não tenha medo, viemos ajudar você." Os outros amigos se reuniram ao redor, preocupados com o sofrimento do esquilo. ${childName} lembrou-se das chaves mágicas e do pergaminho - esta era a oportunidade perfeita para testar seus poderes e ajudar alguém em necessidade.`,
    
    `${childName} e seus amigos usaram as chaves para ajudar os animais perdidos a voltarem para casa, aprendendo sobre ${moralMap[moral]} no processo. A chave dourada do sol foi usada para abrir a armadilha onde o esquilo estava preso. Ao tocar na armadilha com a chave, ela simplesmente se desfez em poeira dourada, libertando o pequeno animal. Com a patinha ainda machucada, o esquilo não conseguia subir nas árvores para voltar ao seu ninho.\n\n"Talvez possamos usar outra chave para ajudá-lo", sugeriu ${childName}, pegando a chave de cristal azul. Ao aproximá-la da patinha ferida do esquilo, a chave emitiu um brilho suave, e a ferida começou a curar. Em minutos, o animal estava completamente recuperado, saltitando alegremente ao redor das crianças em agradecimento antes de subir rapidamente em uma árvore próxima.\n\nDurante o resto do dia, ${childName} e seus amigos encontraram mais animais precisando de ajuda: um passarinho com a asa quebrada, um cervo jovem separado de sua família, uma família de coelhos cujo lar havia sido destruído por uma tempestade recente, e até mesmo uma velha tartaruga que não conseguia encontrar o caminho de volta para o lago.\n\nCom cada animal que ajudavam, ${childName} e seus amigos aprendiam lições valiosas sobre cooperação, gentileza e respeito pela natureza. Perceberam que o verdadeiro tesouro não eram as chaves mágicas, mas a capacidade de fazer a diferença na vida dos outros e a amizade que fortaleciam a cada desafio superado juntos.\n\nQuando o sol começou a se pôr, tingindo o céu de laranja e rosa, eles retornaram para a entrada da floresta, cansados mas com o coração transbordando de alegria e novas experiências. No caminho, o esquilo que haviam ajudado primeiro apareceu novamente, desta vez acompanhado de muitos outros animais da floresta. Juntos, eles formaram uma espécie de guarda de honra, acompanhando as crianças até a borda da floresta.\n\n"Acho que fizemos novos amigos hoje", sorriu ${childName}, enquanto acenava em despedida. "E aprendemos que a maior aventura é poder ajudar os outros e trabalhar juntos." Seus amigos concordaram, já fazendo planos para retornar à floresta mágica no dia seguinte, ansiosos por novas descobertas e mais oportunidades de usar as chaves especiais para fazer o bem.`,
    
    `Nos dias seguintes, a notícia sobre ${childName} e as chaves mágicas se espalhou por toda a ${setting}. Animais de todos os tipos começaram a procurar por ajuda, e logo ${childName} e seus amigos estabeleceram um ponto de encontro perto da entrada da floresta, onde atendiam a todos que precisavam. Eles construíram pequenas casas para animais desabrigados, curaram ferimentos com a chave de cristal, usaram a chave de madeira para fazer crescer plantas e árvores frutíferas para alimentação, e com a chave esmeralda podiam se comunicar com os animais e entender suas necessidades.\n\nA fama das crianças chegou aos ouvidos de um velho guarda-florestal que há anos cuidava da região. Ele observou o trabalho delas de longe por alguns dias, impressionado com a dedicação e o carinho que demonstravam. Numa tarde particularmente movimentada, quando ${childName} e os amigos estavam ajudando uma família de ouriços a construir um novo abrigo, o guarda-florestal se aproximou.\n\n"Tenho observado vocês", disse ele com um sorriso gentil. "E nunca vi a floresta tão feliz e em harmonia. Vocês são realmente especiais." Ele se apresentou como Sr. Carvalho, guardião oficial da floresta há mais de quarenta anos. "Mas agora estou ficando velho, e preciso passar meu conhecimento e responsabilidades para alguém que realmente ame a floresta como eu amo."\n\n${childName} e seus amigos ouviram fascinados enquanto o Sr. Carvalho contava histórias sobre a floresta, sobre sua fauna e flora, sobre os segredos que apenas um verdadeiro guardião conhecia. Ele explicou que as chaves que eles haviam encontrado eram muito antigas, feitas pelos primeiros guardiões para proteger o equilíbrio natural da ${setting}.\n\n"Vocês foram escolhidos", disse ele finalmente. "A floresta sente isso, os animais sentem isso, e eu também sinto. Vocês são os novos guardiões da ${setting}." Ele ofereceu ensinar tudo o que sabia, para que pudessem continuar seu trabalho de proteção e cuidado com a natureza.`,
    
    `Com a orientação do Sr. Carvalho, ${childName} e seus amigos aprenderam segredos antigos da floresta e como usar completamente o poder das cinco chaves mágicas. O velho guarda-florestal os levou a lugares secretos que nem mesmo o mapa mostrava: uma clareira onde fadas dançavam sob o luar, um lago subterrâneo com águas curativas, uma árvore milenar que guardava a memória de tudo o que já havia acontecido na floresta.\n\nEle ensinou que a chave dourada do sol representava a energia e a vida, e podia ser usada para quebrar feitiços e maldições. A chave prateada da lua controlava as marés e os ciclos naturais, podendo alterar o clima em pequena escala quando necessário. A chave de cristal azul tinha o poder de cura e purificação, servindo não apenas para curar ferimentos, mas também para limpar águas poluídas e solo contaminado. A chave de madeira conectava-se às plantas e podia acelerar o crescimento ou rejuvenescer áreas desmatadas. E a misteriosa chave esmeralda, a mais poderosa de todas, permitia a comunicação com todos os seres vivos e até mesmo perceber o espírito da própria floresta.\n\n"Estas chaves são ferramentas, não armas", explicou o Sr. Carvalho. "Seu poder vem do respeito pela natureza e do desejo sincero de proteger e preservar. Nas mãos erradas, elas seriam inúteis, pois só respondem a corações puros."\n\nAo longo dos meses, ${childName} e os amigos foram apresentados a outros guardiões de florestas vizinhas. Descobriram que existia uma rede secreta de protetores da natureza, cada um responsável por sua região. Todos os anos, eles se reuniam no solstício de verão para compartilhar conhecimentos e celebrar a vida e a renovação.\n\n${childName} nunca imaginou que uma simples caminhada na floresta poderia transformar sua vida de forma tão profunda. O que começou como uma busca por aventura tornou-se uma missão de vida, um compromisso com algo maior do que si mesmo.`,
    
    `Um dia, ${childName} descobriu um antigo diário do primeiro guardião da floresta, que continha segredos sobre a criação das chaves mágicas. O diário estava escondido dentro do tronco oco de uma árvore marcada com um símbolo semelhante ao das chaves. As páginas eram frágeis e amareladas, escritas à mão com uma caligrafia elegante e ilustradas com desenhos detalhados de plantas, animais e mapas da região.\n\nNas páginas do diário, ${childName} leu sobre Eliana, a primeira guardiã, uma sábia herbalista que viveu há centenas de anos. Ela tinha criado as chaves em uma época em que a natureza estava ameaçada pela ganância humana. Cada chave foi forjada com materiais especiais e abençoada sob a luz de diferentes astros celestes para capturar seus poderes particulares.\n\nO diário também revelava que, quando unidas, as cinco chaves podiam abrir um portal para o Coração da Floresta, um lugar mítico onde residia o espírito guardião da ${setting} – uma entidade antiga que personificava a sabedoria e a força vital de toda a região. Segundo as anotações, ninguém havia conseguido reunir todas as cinco chaves e encontrar o Coração da Floresta por muitas gerações.\n\n${childName} compartilhou a descoberta com seus amigos e com o Sr. Carvalho. O velho guarda-florestal ficou espantado; ele conhecia lendas sobre o Coração da Floresta, mas nunca soube como encontrá-lo. "Isso explica por que as chaves vieram para vocês neste momento", disse ele pensativamente. "A floresta está chamando seus guardiões para algo importante."\n\nNessa mesma noite, ${childName} teve um sonho vivido em que uma voz gentil mas urgente chamava por ajuda. Ao acordar, sentiu que o chamado vinha da própria floresta. Ao consultar seus amigos, descobriu que todos haviam tido sonhos semelhantes. Era um sinal claro: o espírito da floresta estava em perigo e precisava deles.`,
    
    `${childName} e seus amigos decidiram seguir as instruções do diário para encontrar o Coração da Floresta e descobrir por que estavam sendo chamados. Segundo o diário de Eliana, eles precisariam ir até cinco locais sagrados espalhados pela floresta e, em cada um deles, usar a chave correspondente para ativar um selo antigo.\n\nA primeira jornada os levou ao topo da Colina do Amanhecer, onde o primeiro raio de sol tocava a floresta todas as manhãs. Lá, encontraram uma pedra com o símbolo do sol entalhado. ${childName} inseriu a chave dourada na fenda da pedra e a girou exatamente quando o primeiro raio de sol do dia tocou o local. A pedra começou a brilhar intensamente, e um caminho luminoso apareceu brevemente antes de desaparecer, indicando a direção para o próximo local.\n\nO segundo lugar era o Lago das Estrelas, onde a luz da lua criava reflexos mágicos na água durante a noite. Eles esperaram até que a lua estivesse no centro do céu para usar a chave prateada. Quando ${childName} a inseriu na rocha à beira do lago, a água começou a brilhar com luzes prateadas, como se milhares de estrelas estivessem submersas.\n\nO terceiro local era a Cascata Cristalina, onde águas puras caíam de grandes alturas, criando um véu constante de névoa. A chave de cristal azul foi inserida em uma formação rochosa atrás da cascata, transformando toda a queda d'água em um espetáculo de cores cintilantes.\n\nO quarto lugar era o Bosque Ancestral, onde as árvores mais antigas da floresta cresciam juntas em um círculo perfeito. A chave de madeira foi inserida no tronco da árvore central, fazendo com que todas as plantas ao redor florescessem instantaneamente, mesmo fora de estação.\n\nO último e mais difícil de encontrar era o Vale dos Sussurros, um lugar lendário onde os sons da natureza criavam uma sinfonia perfeita. Guiados pelos animais da floresta, eles finalmente o encontraram escondido entre montanhas. Quando ${childName} inseriu a chave esmeralda em uma pequena elevação no centro do vale, o solo tremeu suavemente e todos puderam ouvir claramente uma voz antiga e sábia chamando-os para o centro da floresta.`,
    
    `No centro exato da ${setting}, onde os cinco caminhos luminosos se encontravam, ${childName} e seus amigos descobriram uma clareira secreta que nunca tinham visto antes. No meio dela estava uma árvore colossal, maior e mais antiga que qualquer outra na floresta. Seu tronco era tão largo que seriam necessárias dez pessoas de mãos dadas para abraçá-lo. Suas raízes se estendiam como rios pelo solo, e seus galhos pareciam tocar as nuvens.\n\nAo se aproximarem da Grande Árvore, perceberam uma abertura em seu tronco, como um portal natural. As cinco chaves começaram a brilhar intensamente, cada uma com sua cor característica. Seguindo a intuição, ${childName} posicionou cada chave em pequenas reentrâncias em forma de fechadura ao redor da abertura, formando um círculo perfeito.\n\nQuando a última chave foi colocada, uma luz intensa emanou do interior da árvore, e a abertura se expandiu, convidando-os a entrar. Dentro do tronco oco, eles descobriram um espaço muito maior do que parecia possível – era como um salão majestoso com paredes feitas da própria madeira viva, iluminado por um suave brilho esverdeado que parecia vir de todos os lugares e lugar nenhum ao mesmo tempo.\n\nNo centro desse salão, flutuando alguns centímetros acima do solo, estava uma esfera de luz pura – o verdadeiro Coração da Floresta. Ao seu redor, imagens holográficas mostravam diferentes partes da floresta, algumas saudáveis e vibrantes, outras doentes e em perigo. Foi então que uma voz suave preencheu o ambiente – não era um som que ouviam com os ouvidos, mas sim uma presença que se comunicava diretamente com seus corações.\n\n"Bem-vindos, jovens guardiões", disse a voz. "Eu sou o espírito da ${setting}, guardião de toda a vida que aqui habita. Por muitos séculos, mantive o equilíbrio e a harmonia desta terra. Mas agora enfrento uma ameaça que não posso combater sozinho."\n\nAs imagens holográficas mudaram, mostrando uma parte distante da floresta onde máquinas pesadas derrubavam árvores e grandes escavadeiras abriam feridas na terra. Homens com capacetes amarelos e plantas em mãos discutiam em frente a mapas abertos sobre uma mesa improvisada.\n\n"Eles planejam construir uma represa que inundará um terço da floresta", explicou o espírito. "Se isso acontecer, milhares de animais perderão seus lares, plantas raras desaparecerão para sempre, e o equilíbrio que manteve esta floresta viva por milênios será destruído."\n\n${childName} e seus amigos se entreolharam, sentindo o peso da responsabilidade em seus ombros. "Como podemos ajudar?", perguntou ${childName}, dando um passo à frente. "Somos apenas crianças."`,
    
    `"É exatamente por serem crianças que podem fazer a diferença", respondeu o espírito da floresta com sabedoria. "Seus corações ainda veem com clareza o que é realmente importante. Vocês têm uma conexão pura com a natureza que muitos adultos perderam. E mais importante: vocês possuem algo que nem eu tenho – uma voz no mundo dos humanos."\n\nO espírito explicou que não queria guerra contra os humanos, apenas harmonia e respeito. "Não são nossos inimigos, apenas esqueceram como viver em equilíbrio com a natureza. Precisam ser lembrados, e vocês podem fazer isso."\n\nCom um movimento suave, o espírito da floresta criou cinco amuletos de cristal, cada um com a forma de uma folha e a cor de uma das chaves mágicas. "Estes amuletos contêm uma fração do meu poder. Usem-nos para mostrar aos humanos o que está em jogo, para que possam ver através dos olhos da floresta."\n\nNos dias seguintes, guiados pelo Sr. Carvalho e armados com os amuletos mágicos, ${childName} e seus amigos iniciaram uma campanha para salvar a floresta. Eles convidaram jornalistas para conhecer a riqueza natural da região, levaram cientistas para estudar espécies raras que seriam extintas com a construção da represa, e organizaram visitas escolares para que outras crianças pudessem se conectar com a magia da natureza.\n\nUsando o poder dos amuletos, eles conseguiam mostrar visões do passado e futuro da floresta, permitindo que as pessoas vissem tanto sua beleza histórica quanto o desastre que a aguardava se o projeto continuasse. O amuleto dourado mostrava a vida e energia que emanava de cada ser vivo; o prateado revelava como tudo estava conectado em ciclos perfeitos; o azul mostrava a pureza das águas e como a represa a destruiria; o verde madeira ilustrava o crescimento lento e paciente das árvores centenárias; e o esmeralda permitia que as pessoas ouvissem brevemente as vozes dos animais e plantas.\n\nA campanha ganhou força rapidamente. Mais e mais pessoas visitavam a floresta, muitas saindo transformadas pela experiência. Artistas criaram obras inspiradas na beleza do local, cientistas publicaram estudos sobre a biodiversidade única, e a mídia começou a questionar os benefícios da represa em comparação com o que seria perdido.\n\nFinalmente, chegou o dia da audiência pública decisiva sobre o projeto. O salão estava lotado com representantes da empresa construtora, autoridades governamentais, ambientalistas, moradores locais e, na primeira fila, ${childName} e seus amigos.`,
    
    `Na audiência pública, quando chegou sua vez de falar, ${childName} subiu ao palco com seus amigos, todos usando seus amuletos que brilhavam suavemente. Em vez de um discurso preparado, ${childName} pediu permissão para mostrar algo especial. Com o consentimento dos organizadores, as crianças se posicionaram em círculo e ergueram seus amuletos.\n\nUma luz colorida emanou dos cristais, preenchendo todo o salão. De repente, todos os presentes puderam ver, sentir e ouvir a floresta como se estivessem lá – o canto dos pássaros, o farfalhar das folhas, o aroma das flores silvestres. Viram filhotes nascendo, árvores crescendo em time-lapse, o ciclo das estações em perfeita harmonia. Sentiram a dor das árvores sendo cortadas, o desespero dos animais perdendo seus lares, o desequilíbrio causado pela intervenção desmedida.\n\nQuando a visão terminou, havia lágrimas nos olhos de muitos. Um silêncio profundo tomou conta do salão, até que ${childName} falou com voz clara e firme: "Esta é a nossa floresta. Ela está viva, assim como nós. Tem memórias, assim como nós. Sente dor, assim como nós. E tem o direito de existir, assim como nós."\n\n${childName} então propôs uma alternativa: em vez da grande represa, poderiam ser construídas pequenas usinas de energia solar e eólica em áreas já desmatadas, preservando a floresta e ainda gerando empregos para a comunidade local. "Podemos escolher um caminho que beneficie a todos, inclusive a natureza."\n\nApós intensos debates, a empresa construtora, impressionada com a demonstração e pressionada pela opinião pública, concordou em reavaliar o projeto. Especialistas foram contratados para estudar as alternativas propostas, e um novo plano foi elaborado em colaboração com ambientalistas e representantes da comunidade – incluindo o Sr. Carvalho e as crianças guardiãs.\n\nSeis meses depois, ${childName} e seus amigos foram convidados para a cerimônia de inauguração do Parque Natural da ${setting}, que declarava a área como protegida permanentemente. O projeto da represa foi substituído por um centro de pesquisa ecológica e turismo sustentável, que oferecia aos visitantes a oportunidade de conhecer e aprender sobre a floresta sem prejudicá-la.\n\nO espírito da floresta, através do Coração, enviou uma mensagem de gratidão às crianças: "Vocês lembraram aos humanos algo que eles haviam esquecido – que são parte da natureza, não separados dela. Este é o verdadeiro tesouro que encontraram na floresta: a sabedoria de viver em harmonia com tudo o que existe."`,
    
    `Anos se passaram, e ${childName} cresceu, mas nunca abandonou seu papel como guardião da floresta. O que começou como uma aventura infantil tornou-se o propósito de sua vida. O Parque Natural da ${setting} floresceu, tornando-se um modelo de conservação e educação ambiental para o mundo todo.\n\n${childName} estudou biologia e conservação, eventualmente tornando-se o diretor do centro de pesquisas do parque. Seus amigos de infância seguiram caminhos diversos, mas todos mantiveram sua conexão com a natureza e continuaram a usar os amuletos em momentos importantes, espalhando a mensagem da floresta para diferentes cantos do mundo.\n\nAs cinco chaves mágicas permaneceram no Coração da Floresta, protegidas pelo espírito guardião, esperando pelo dia em que novos jovens de coração puro seriam chamados para uma nova missão. E embora poucos soubessem da existência real do Coração da Floresta e das chaves, muitos visitantes do parque relatavam sentir uma presença especial, uma energia acolhedora que parecia recebê-los como velhos amigos.\n\n${childName} frequentemente levava grupos de crianças para caminhadas educativas pela floresta, contando a história de como um pequeno grupo de amigos conseguiu salvar aquele tesouro natural. "Olhem ao redor", dizia aos jovens visitantes. "Cada árvore, cada animal, cada gota de água tem uma história para contar. E vocês também fazem parte dessa história."\n\nEm noites especiais, quando a lua cheia iluminava a floresta com sua luz prateada, ${childName} ainda se reunia com seus velhos amigos na clareira da Grande Árvore. Sentados em círculo, compartilhavam histórias e lembranças, renovando seu compromisso com a proteção da natureza. E se alguém prestasse muita atenção, poderia ver um brilho suave emanando do tronco da árvore, como se o próprio espírito da floresta estivesse ali, ouvindo e sorrindo.\n\nA lição sobre ${moralMap[moral]} que ${childName} aprendeu naquela primeira aventura tornou-se o lema do parque, inscrito em uma placa na entrada: "A verdadeira magia está em nos reconhecermos como parte de algo maior – uma teia interconectada de vida onde cada fio é importante e cada ação tem consequências. Cuidar da natureza é cuidar de nós mesmos."\n\nE assim, a história de ${childName} e a floresta mágica continuou se espalhando, inspirando novas gerações a olhar para o mundo natural com respeito e admiração, lembrando a todos que as maiores aventuras e os tesouros mais valiosos estão ao nosso redor, se apenas soubermos enxergá-los com os olhos do coração.`
  ];
  
  // Ensure we have enough pages or limit to requested count
  return adjustPageCount(storyTemplate, pageCount);
}

// Helper function to generate fantasy story template
function generateFantasyStory(childName: string, childAge: string, setting: string, moral: string, pageCount: number): string[] {
  // Return fantasy story pages
  const storyTemplate = [
    `Era uma vez, na mágica ${setting}, vivia ${childName}, uma criança muito especial que adorava histórias fantásticas. ${childName} morava em uma pequena casa de pedra próxima à borda da ${setting}, onde o ordinário e o extraordinário se encontravam. Todas as manhãs, ${childName} acordava com o canto melodioso de pássaros coloridos que vinham pousar em sua janela, como se viessem trazer recados secretos dos confins do mundo mágico.\n\nA casa de ${childName} era aconchegante e cheia de livros. Seu quarto tinha prateleiras repletas de histórias sobre dragões, fadas, elfos e criaturas mágicas que habitavam mundos distantes. Seu favorito era um livro antigo com capa de couro, herdado da avó, que contava lendas sobre a própria ${setting} onde moravam. As páginas amareladas continham ilustrações detalhadas que pareciam ganhar vida quando a luz do luar incidia sobre elas.\n\n${childName} sempre sentiu que havia algo especial naquela região. Às vezes, quando caminhava pela floresta ao entardecer, podia jurar que via pequenas luzes dançando entre as árvores, ou ouvia música suave vinda de lugares onde não havia ninguém. Os adultos da aldeia próxima sempre diziam que era apenas imaginação fértil, resultado de tantas histórias fantásticas, mas ${childName} sabia, no fundo do coração, que havia magia verdadeira ali.\n\nNesta manhã em particular, ${childName} acordou com uma sensação diferente. O ar parecia mais vibrante, carregado de possibilidades, e uma brisa gentil entrava pela janela trazendo um aroma doce que não conseguia identificar. Algo extraordinário estava prestes a acontecer, e ${childName} mal podia esperar para descobrir o quê.`,
    // Continue with other pages
  ];
  
  // Ensure we have enough pages or limit to requested count
  return adjustPageCount(storyTemplate, pageCount);
}

// Helper function to generate space story template
function generateSpaceStory(childName: string, childAge: string, setting: string, moral: string, pageCount: number): string[] {
  // Return space adventure story pages
  const storyTemplate = [
    `Em um futuro não muito distante, ${childName}, uma criança de ${childAge} anos, vivia em uma estação espacial orbitando a Terra. Desde muito pequeno(a), ${childName} sonhava em explorar as estrelas e descobrir novos mundos. Seu quarto era decorado com modelos de naves espaciais, mapas de constelações e pôsteres de planetas distantes. À noite, antes de dormir, gostava de olhar pela janela de observação, contando as estrelas e imaginando as aventuras que poderia viver entre elas.\n\n${childName} era conhecido(a) por sua curiosidade insaciável e por sempre fazer perguntas aos cientistas e astronautas da estação. "Como é a sensação de flutuar no espaço aberto?", "Quanto tempo levaria para chegar a Alpha Centauri?", "Será que existem outras crianças como eu em outros planetas?" Os adultos sorriam com sua empolgação e tentavam responder da melhor forma possível, alimentando sua paixão pelo desconhecido.\n\nOs pais de ${childName} eram cientistas importantes: sua mãe, astrobióloga, estudava a possibilidade de vida em outros planetas, enquanto seu pai era engenheiro de propulsão, trabalhando em novas tecnologias para viagens espaciais mais rápidas. Graças a eles, ${childName} cresceu com um profundo conhecimento e respeito pelo cosmos, aprendendo desde cedo que o universo era vasto, misterioso e cheio de maravilhas a serem descobertas.\n\nO dia mais esperado do ano havia chegado: a Exposição Científica Juvenil da Estação. ${childName} havia trabalhado por meses em seu projeto especial - um pequeno robô explorador que havia construído e programado sozinho(a). O robô, carinhosamente batizado de "Blink", tinha sensores avançados e era capaz de analisar composições atmosféricas básicas. ${childName} mal podia esperar para apresentá-lo aos juízes e, quem sabe, impressionar o Comandante Wells, o lendário astronauta que estaria visitando a estação naquele dia.`,
    // Continue with other pages
  ];
  
  // Ensure we have enough pages or limit to requested count
  return adjustPageCount(storyTemplate, pageCount);
}

// Helper function to generate ocean story template
function generateOceanStory(childName: string, childAge: string, setting: string, moral: string, pageCount: number): string[] {
  // Return ocean adventure story pages
  const storyTemplate = [
    `O sol brilhava intensamente sobre a pequena vila costeira onde ${childName}, uma criança de ${childAge} anos, vivia com sua família. A casa deles ficava no topo de uma colina suave, com vista para o oceano de águas azul-turquesa que se estendia até o horizonte. Desde muito pequeno(a), ${childName} sentia uma atração inexplicável pelo mar. Passava horas na praia, observando as ondas, coletando conchas e sonhando com as criaturas misteriosas que poderiam habitar suas profundezas.\n\nOs outros moradores da vila tinham um respeito quase reverencial pelo oceano. Muitos eram pescadores que conheciam seus humores e segredos, passados de geração em geração. O avô de ${childName}, Capitão Miguel, havia sido um dos navegadores mais respeitados da região antes de se aposentar. Suas histórias sobre tempestades monumentais, ilhas escondidas e encontros com criaturas marinhas extraordinárias alimentavam a imaginação de ${childName}.\n\nO quarto de ${childName} era um pequeno museu de tesouros marinhos: conchas de todas as formas e cores, estrelas-do-mar secas preservadas com cuidado, pedaços de madeira polidos pelo mar, e mapas antigos que mostravam terras misteriosas além do horizonte. Na parede principal, havia um grande mural que ${childName} havia pintado, mostrando um mundo subaquático fantástico, com corais vibrantes, peixes coloridos e uma cidade de cristal onde imaginava que sereias poderiam viver.\n\nHoje era um dia especial: o aniversário de ${childName}. E o presente prometido pelo avô era algo que esperava há anos – a permissão para acompanhá-lo em uma pequena viagem de barco até a Ilha dos Recifes, um local famoso por seus corais coloridos e pela abundância de vida marinha. ${childName} mal conseguia conter a excitação enquanto se preparava, colocando em sua mochila uma máscara de mergulho, uma pequena câmera à prova d'água que ganhara dos pais, e um caderno de anotações para registrar todas as descobertas.`,
    // Continue with other pages
  ];
  
  // Ensure we have enough pages or limit to requested count
  return adjustPageCount(storyTemplate, pageCount);
}

// Helper function to generate dinosaur story template
function generateDinosaurStory(childName: string, childAge: string, setting: string, moral: string, pageCount: number): string[] {
  // Return dinosaur adventure story pages
  const storyTemplate = [
    `Em um bairro tranquilo, vivia ${childName}, uma criança de ${childAge} anos com uma paixão extraordinária por dinossauros. Seu quarto era um pequeno museu particular, com pôsteres de Tiranossauros Rex, Triceratops e Pterodáctilos cobrindo as paredes. As prateleiras estavam repletas de livros sobre paleontologia e eras pré-históricas, alguns avançados demais até para adultos, mas que ${childName} devorava com fascínio insaciável.\n\nOs pais de ${childName} incentivavam este interesse, levando-o(a) a museus de história natural sempre que possível. Na última visita, ${childName} passou horas diante do enorme esqueleto de um Brachiosaurus, imaginando como seria ver estas criaturas magníficas em seu habitat natural, andando pela Terra como verdadeiros gigantes em um mundo completamente diferente do nosso.\n\nNa escola, ${childName} era conhecido(a) como "o(a) especialista em dinossauros", frequentemente corrigindo até mesmo os professores sobre detalhes específicos das criaturas pré-históricas. Seus colegas adoravam ouvir as histórias que contava sobre como os dinossauros viviam, caçavam e cuidavam de seus filhotes, transformando fatos científicos em narrativas envolventes que capturavam a imaginação de todos.\n\nO aniversário de ${childName} se aproximava, e seus pais haviam prometido uma surpresa especial. Durante semanas, ${childName} tentou adivinhar o que poderia ser. Um novo livro sobre paleontologia? Uma visita ao novo parque temático de dinossauros na cidade vizinha? Mas nada poderia prepará-lo(a) para o que estava prestes a acontecer - uma aventura que transformaria seu amor por dinossauros em algo muito mais extraordinário do que jamais poderia imaginar.`,
    // Continue with other pages
  ];
  
  // Ensure we have enough pages or limit to requested count
  return adjustPageCount(storyTemplate, pageCount);
}

// Helper function to adjust page count
function adjustPageCount(storyTemplate: string[], targetCount: number): string[] {
  if (storyTemplate.length >= targetCount) {
    // If we have more pages than needed, return only the requested number
    return storyTemplate.slice(0, targetCount);
  } else {
    // If we need more pages, duplicate the last few pages with variations
    const result = [...storyTemplate];
    const basePage = storyTemplate[storyTemplate.length - 1];
    
    for (let i = storyTemplate.length; i < targetCount; i++) {
      // For simplicity, we'll just add the same last page
      // In a real implementation, you might want to generate variations
      result.push(basePage);
    }
    
    return result;
  }
}

// Helper mapping for the local generator
const moralMap: { [key: string]: string } = {
  friendship: "amizade e cooperação",
  courage: "coragem e superação",
  respect: "respeito às diferenças",
  environment: "cuidado com o meio ambiente",
  honesty: "honestidade e verdade",
  perseverance: "perseverança e esforço"
};

