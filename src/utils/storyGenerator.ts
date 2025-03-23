
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
    moral = "friendship"
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

  const readingLevelDesc = readingLevelMap[readingLevel] || readingLevelMap.intermediate;
  const languageDesc = languageMap[language] || languageMap.portuguese;
  const moralDesc = moralMap[moral] || moralMap.friendship;

  const systemPrompt = `Você é um escritor de histórias infantis criativas e cativantes. 
Crie uma história com 5 páginas para ${childName}, que tem ${childAge}.
A história deve ser sobre ${theme} e se passar em ${setting}.
${characterPrompt ? `Inclua o seguinte personagem na história: ${characterPrompt}.` : ''}

Nível de leitura: ${readingLevelDesc}
Idioma: ${languageDesc}
Moral da história: ${moralDesc}

IMPORTANTE: Cada página deve ter conteúdo substancial com pelo menos 3-4 parágrafos (cerca de 150-200 palavras por página) para criar uma experiência de leitura rica.

Retorne a resposta em formato JSON com a seguinte estrutura:
{
  "title": "Título da História",
  "content": ["Texto da página 1", "Texto da página 2", "Texto da página 3", "Texto da página 4", "Texto da página 5"]
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
      max_tokens: 3000, // Increased max tokens to allow for longer story content
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
    moral = "friendship"
  } = params;

  // Local story generator fallback
  console.log(`Generating local story for ${childName} with theme ${theme} in ${setting}`);
  console.log(`Reading level: ${readingLevel}, Language: ${language}, Moral: ${moral}`);
  
  // Create some title based on theme and setting
  let title = "";
  let content: string[] = [];
  
  switch (theme) {
    case "adventure":
      title = `A Grande Aventura de ${childName}`;
      content = [
        `${childName} estava muito animado(a) para explorar a ${setting} com seus amigos. Era um dia perfeito para uma grande aventura! O sol brilhava entre as folhas das árvores, criando padrões dourados no chão. Pássaros cantavam melodias alegres, e o aroma de flores silvestres preenchia o ar. ${childName} tinha preparado sua mochila com cuidado, colocando um lanche, uma garrafa de água, uma lanterna e seu diário de aventuras, onde anotava todas as descobertas incríveis que fazia.\n\nEnquanto caminhava pela trilha principal, ${childName} observava atentamente cada detalhe ao seu redor. As árvores eram antigas e majestosas, com troncos grossos que pareciam guardar histórias de centenas de anos. Pequenos esquilos corriam de galho em galho, olhando curiosamente para os visitantes que adentravam seu território. Borboletas coloridas dançavam no ar, guiando o caminho como pequenas fadinhas da floresta.\n\n${childName} sempre sentiu uma conexão especial com a natureza. Desde pequeno(a), adorava passar horas explorando jardins e parques, imaginando mundos mágicos escondidos entre as plantas. Agora, nesta grande aventura, sentia que algo especial estava prestes a acontecer. Um formigamento de expectativa percorria seu corpo, como se a própria floresta quisesse revelar seus segredos.`,
        
        `Enquanto caminhavam pela ${setting}, ${childName} encontrou um mapa misterioso escondido atrás de uma árvore centenária. O mapa parecia muito antigo, com bordas desgastadas e amareladas pelo tempo. Estava cuidadosamente enrolado e preso com uma fita vermelha desbotada. Ao desenrolá-lo com cuidado, ${childName} viu que era um mapa detalhado da floresta, com símbolos estranhos e linhas que indicavam caminhos secretos.\n\nNo centro do mapa, havia um X marcado em vermelho, com pequenas palavras escritas ao lado: "Onde a luz encontra a sombra, o tesouro aguarda quem é de coração puro". ${childName} sentiu seu coração acelerar de emoção. Um tesouro escondido! Esta aventura estava ficando cada vez mais emocionante.\n\n${childName} estudou o mapa com atenção, tentando decifrar os símbolos e entender o caminho. Alguns desenhos pareciam representar formações rochosas, outros mostravam pequenos lagos e cachoeiras. Depois de alguns minutos analisando cuidadosamente, ${childName} conseguiu identificar onde estava e qual direção deveria seguir.\n\n"Olhem só o que encontrei!", exclamou ${childName} para seus amigos, mostrando o mapa com entusiasmo. "Vamos seguir este caminho e ver onde ele nos leva!" Todos concordaram, contagiados pela empolgação de ${childName}. A promessa de um tesouro escondido era irresistível, e juntos eles se sentiam corajosos o suficiente para enfrentar qualquer desafio.`,
        
        `O mapa os levou até uma caverna secreta, escondida atrás de uma densa cortina de vinhas e flores silvestres. A entrada era pequena, quase imperceptível para quem não soubesse exatamente onde procurar. ${childName} afastou cuidadosamente as plantas, revelando uma abertura na rocha grande o suficiente para eles passarem um de cada vez.\n\nA luz do sol penetrava timidamente pelos primeiros metros da caverna, iluminando paredes de pedra cobertas de musgo verde e pequenos cristais que cintilavam como estrelas. A temperatura estava mais fresca ali dentro, e o som de água gotejando ecoava suavemente, criando uma melodia natural que parecia dar boas-vindas aos visitantes.\n\nConforme avançavam mais para o interior da caverna, ${childName} acendeu sua lanterna para iluminar o caminho. O feixe de luz revelou desenhos antigos nas paredes – figuras de animais, pessoas e símbolos misteriosos que contavam histórias de tempos passados. Eram pinturas feitas há muito tempo, preservadas pela proteção da caverna.\n\n"Olhem ali!", sussurrou um dos amigos, apontando para uma câmara maior à frente. Quando entraram nesse espaço, todos ficaram sem fôlego. No centro da câmara, sobre uma pequena elevação de pedra que parecia um altar natural, estava um baú de madeira entalhada, decorado com pedras coloridas e fechos de metal trabalhado. Um raio de sol entrava por uma abertura no teto da caverna, iluminando o baú como se fosse um objeto sagrado.`,
        
        `Dentro do baú havia um conjunto de chaves mágicas que podiam abrir qualquer porta na ${setting}. Eram cinco chaves, cada uma feita de um material diferente e decorada com símbolos únicos. A primeira era de ouro brilhante, com um sol entalhado na ponta. A segunda, prateada como a lua, tinha o formato de uma estrela cadente. A terceira parecia feita de cristal azul transparente, que mudava de cor conforme a luz. A quarta era de madeira antiga e entalhada com pequenas folhas. A quinta, a mais misteriosa de todas, parecia feita de uma pedra verde esmeralda e tinha desenhos de animais gravados em toda sua extensão.\n\n${childName} pegou as chaves com cuidado, sentindo um leve formigamento nos dedos ao tocá-las. Havia também um pequeno pergaminho dentro do baú, com instruções escritas em uma letra elegante: "Estas são as Chaves dos Elementos, guardiãs dos cinco reinos da floresta. Apenas aqueles com coragem, sabedoria e um coração gentil podem desbloquear seus poderes. Use-as para ajudar quem precisa, nunca para ganho próprio."\n\n${childName} olhou para seus amigos com espanto e excitação. Eles não tinham encontrado apenas um tesouro comum, mas algo muito mais especial – um instrumento mágico para ajudar a floresta e seus habitantes. Foi então que ouviram um fraco chamado de socorro vindo de algum lugar próximo.\n\n"Vocês ouviram isso?", perguntou ${childName}, guardando as chaves cuidadosamente em sua mochila. Todos assentiram e rapidamente decidiram investigar. Seguindo o som, eles saíram da caverna por outro caminho e encontraram um pequeno esquilo preso em uma armadilha de caçadores. Seus olhos escuros imploravam por ajuda, e sua patinha estava machucada.`,
        
        `${childName} e seus amigos usaram as chaves para ajudar os animais perdidos a voltarem para casa, aprendendo sobre ${moralMap[moral]} no processo. A chave dourada do sol foi usada para abrir a armadilha onde o esquilo estava preso. Ao tocar na armadilha com a chave, ela simplesmente se desfez em poeira dourada, libertando o pequeno animal. Com a patinha ainda machucada, o esquilo não conseguia subir nas árvores para voltar ao seu ninho.\n\n"Talvez possamos usar outra chave para ajudá-lo", sugeriu ${childName}, pegando a chave de cristal azul. Ao aproximá-la da patinha ferida do esquilo, a chave emitiu um brilho suave, e a ferida começou a curar. Em minutos, o animal estava completamente recuperado, saltitando alegremente ao redor das crianças em agradecimento antes de subir rapidamente em uma árvore próxima.\n\nDurante o resto do dia, ${childName} e seus amigos encontraram mais animais precisando de ajuda: um passarinho com a asa quebrada, um cervo jovem separado de sua família, uma família de coelhos cujo lar havia sido destruído por uma tempestade recente, e até mesmo uma velha tartaruga que não conseguia encontrar o caminho de volta para o lago.\n\nCom cada animal que ajudavam, ${childName} e seus amigos aprendiam lições valiosas sobre cooperação, gentileza e respeito pela natureza. Perceberam que o verdadeiro tesouro não eram as chaves mágicas, mas a capacidade de fazer a diferença na vida dos outros e a amizade que fortaleciam a cada desafio superado juntos.\n\nQuando o sol começou a se pôr, tingindo o céu de laranja e rosa, eles retornaram para a entrada da floresta, cansados mas com o coração transbordando de alegria e novas experiências. No caminho, o esquilo que haviam ajudado primeiro apareceu novamente, desta vez acompanhado de muitos outros animais da floresta. Juntos, eles formaram uma espécie de guarda de honra, acompanhando as crianças até a borda da floresta.\n\n"Acho que fizemos novos amigos hoje", sorriu ${childName}, enquanto acenava em despedida. "E aprendemos que a maior aventura é poder ajudar os outros e trabalhar juntos." Seus amigos concordaram, já fazendo planos para retornar à floresta mágica no dia seguinte, ansiosos por novas descobertas e mais oportunidades de usar as chaves especiais para fazer o bem.`
      ];
      break;
    case "fantasy":
      title = `${childName} e a Magia da ${setting}`;
      content = [
        `Era uma vez, na mágica ${setting}, vivia ${childName}, uma criança muito especial que adorava histórias fantásticas. ${childName} morava em uma pequena casa de pedra próxima à borda da ${setting}, onde o ordinário e o extraordinário se encontravam. Todas as manhãs, ${childName} acordava com o canto melodioso de pássaros coloridos que vinham pousar em sua janela, como se viessem trazer recados secretos dos confins do mundo mágico.\n\nA casa de ${childName} era aconchegante e cheia de livros. Seu quarto tinha prateleiras repletas de histórias sobre dragões, fadas, elfos e criaturas mágicas que habitavam mundos distantes. Seu favorito era um livro antigo com capa de couro, herdado da avó, que contava lendas sobre a própria ${setting} onde moravam. As páginas amareladas continham ilustrações detalhadas que pareciam ganhar vida quando a luz do luar incidia sobre elas.\n\n${childName} sempre sentiu que havia algo especial naquela região. Às vezes, quando caminhava pela floresta ao entardecer, podia jurar que via pequenas luzes dançando entre as árvores, ou ouvia música suave vinda de lugares onde não havia ninguém. Os adultos da aldeia próxima sempre diziam que era apenas imaginação fértil, resultado de tantas histórias fantásticas, mas ${childName} sabia, no fundo do coração, que havia magia verdadeira ali.`,
        
        `Um dia, ${childName} encontrou uma varinha mágica que começou a brilhar assim que a tocou. Era um galho perfeitamente reto de uma árvore antiga, com entalhes delicados que formavam padrões semelhantes a estrelas e luas crescentes. ${childName} estava explorando uma parte mais densa da ${setting} que nunca havia visitado antes, seguindo o canto incomum de um pássaro azul que parecia estar chamando.\n\nA varinha estava cuidadosamente colocada sobre um cogumelo vermelho gigante, como se esperasse ser encontrada. Quando ${childName} a pegou, sentiu um leve formigamento nos dedos e a varinha emitiu um brilho suave e pulsante, como um pequeno coração de luz. Uma sensação morna se espalhou pelo corpo de ${childName}, como um abraço reconfortante.\n\nAssim que ${childName} segurou a varinha com mais firmeza, o ar ao redor pareceu mudar. As cores da floresta ficaram mais vibrantes, os sons mais nítidos, e ${childName} podia agora entender claramente o que os animais ao redor diziam! Um esquilo próximo olhou diretamente para ${childName} e falou com voz aguda: "Finalmente! Encontramos o escolhido!"\n\n"Escolhido? Eu? Para quê?", perguntou ${childName}, espantado não apenas por entender o esquilo, mas também por ser reconhecido como alguém especial. O esquilo saltou mais perto e explicou que precisavam de ajuda urgentemente. A magia estava desaparecendo da ${setting}, e apenas alguém com coração puro e olhos que ainda podiam ver o extraordinário poderia restaurá-la.`,
        
        `A varinha revelou que ${childName} havia sido escolhido(a) para restaurar a magia que estava desaparecendo da ${setting}. "A magia começou a falhar há algumas luas", explicou o esquilo, apresentando-se como Nibbles, o mensageiro do Conselho dos Guardiões da Floresta. "Primeiro foram pequenas coisas: flores que deixaram de brilhar à noite, nascentes que pararam de curar feridas leves. Então, progressivamente, a situação piorou."\n\nNibbles guiou ${childName} por um caminho secreto, invisível para olhos comuns. Conforme avançavam mais fundo na ${setting}, ${childName} começou a notar sinais preocupantes: árvores com folhas desbotadas, flores murchas e um silêncio incomum onde antes havia música e risos das criaturas mágicas. "O que está causando isso?", perguntou ${childName}, sentindo uma tristeza profunda ao ver a beleza da ${setting} se esvaindo.\n\n"Ninguém sabe ao certo", respondeu Nibbles. "Os sábios do Conselho acreditam que alguém ou algo está absorvendo a essência mágica da ${setting}. Suspeitamos do Lorde Sombrio, que vive no castelo além do Vale das Névoas. Ele sempre invejou nossa magia, mas nunca teve poder suficiente para tomá-la... até agora."\n\nFinalmente, chegaram a uma clareira onde enormes cogumelos formavam um círculo perfeito. No centro, várias criaturas estavam reunidas: uma coruja de olhos dourados, um cervo com galhos que pareciam feitos de cristal, uma raposa com cauda flamejante, e outros seres que ${childName} nunca imaginara encontrar fora dos livros. Todos olharam esperançosos quando ${childName} entrou na clareira com a varinha brilhante.`,
        
        `Com a ajuda de novos amigos mágicos, ${childName} enfrentou desafios que testaram sua coragem e bondade. A coruja ancião, chamada Sapientia, falou com voz profunda: "Para restaurar a magia da ${setting}, você precisará reunir as cinco Essências Elementais e levá-las ao Coração da Floresta para um ritual de renovação."\n\nAssim começou a jornada de ${childName}, acompanhado por Nibbles, o esquilo tagarela, e Faísca, a raposa de cauda flamejante que conhecia todos os caminhos da floresta. O primeiro desafio foi encontrar a Essência da Água, guardada por sereias em um lago profundo no coração da floresta. ${childName} precisou provar sua honestidade respondendo três perguntas difíceis que revelavam seu verdadeiro caráter. Graças à sua sinceridade, as sereias entregaram uma gota de água que brilhava como um diamante.\n\nO segundo desafio foi nas Cavernas de Cristal, onde a Essência da Terra estava escondida. O guardião, um velho gnomo rabugento, pediu que ${childName} ajudasse a resolver um problema: plantas preciosas estavam morrendo devido à falta de luz. Usando sua inteligência e a varinha mágica, ${childName} criou espelhos de cristal que redirecionavam a luz do sol para dentro das cavernas, salvando as plantas. Agradecido, o gnomo entregou um pequeno cristal pulsante.\n\nPara obter a Essência do Ar, ${childName} e seus amigos escalaram a Montanha dos Ventos Sussurrantes. Lá, enfrentaram rajadas poderosas que quase os derrubaram do penhasco. ${childName} aprendeu a ouvir os ventos e entender seus padrões, mostrando respeito pela força da natureza. Os espíritos do ar, impressionados com sua sensibilidade, concederam-lhe uma pluma prateada que flutuava e girava como se tivesse vida própria.`,
        
        `No final, ${childName} descobriu que a verdadeira magia estava em seu coração, e a lição de ${moralMap[moral]} foi compartilhada com todos. A busca pela Essência do Fogo os levou a um vulcão adormecido, onde uma fênix majestosa guardava uma chama eterna. A fênix estava triste porque sua chama, que deveria inspirar coragem nos corações de todos, estava enfraquecendo junto com a magia da floresta. ${childName} conversou longamente com a criatura milenar, ouvindo suas histórias e compartilhando esperanças para o futuro da ${setting}. Comovida pela compaixão de ${childName}, a fênix ofereceu uma pequena chama contida em uma pedra de rubi.\n\nA última e mais difícil jornada foi para encontrar a Essência do Espírito, guardada pelo próprio Lorde Sombrio que estava drenando a magia da floresta. Quando finalmente chegaram ao seu castelo nebuloso, ${childName} descobriu uma verdade surpreendente: o Lorde Sombrio era na verdade um jovem mago que havia se isolado após ser rejeitado pelos habitantes da floresta devido à sua aparência diferente. Ele não estava roubando a magia intencionalmente; seu poder estava descontrolado devido à solidão e tristeza.\n\nEm vez de lutar, ${childName} estendeu a mão em amizade e mostrou empatia pelo jovem mago, convidando-o a fazer parte da comunidade da floresta. Tocado por este gesto, o mago entregou voluntariamente a Essência do Espírito – uma pequena esfera de luz que mudava constantemente de cor – e se ofereceu para ajudar na restauração da magia.\n\nCom as cinco Essências reunidas, todos retornaram ao Coração da Floresta, uma clareira antiga onde uma árvore gigante com mais de mil anos crescia. ${childName} colocou as Essências em cinco pontos ao redor da árvore e, usando a varinha mágica, começou o ritual de renovação. Um círculo de luz se formou, conectando todas as Essências e envolvendo ${childName} em um pilar de energia colorida.\n\nFoi então que ${childName} compreendeu a verdadeira lição: a magia da floresta nunca esteve realmente nos objetos ou nos poderes, mas na conexão entre todos os seres, na amizade que haviam construído, no respeito mútuo e na cooperação para superar desafios. A varinha em sua mão era apenas um catalisador para a magia que já existia em seu coração.\n\nQuando o ritual terminou, uma onda de energia mágica se espalhou por toda a ${setting}, restaurando cores, sons e vida. Flores voltaram a brilhar, nascentes a curar, e criaturas mágicas reapareceram em toda parte. O jovem mago encontrou aceitação entre os habitantes da floresta, que aprenderam que as aparências podem enganar e que todos têm algo valioso a contribuir.\n\n${childName} foi celebrado como herói, mas fez questão de dividir os méritos com todos os amigos que o ajudaram na jornada. "Sozinho, eu nunca teria conseguido", disse, enquanto todos celebravam com uma grande festa sob o luar. "Foi nossa amizade e cooperação que salvou a magia."\n\nA partir daquele dia, ${childName} se tornou o novo Guardião da Varinha, protetor da magia da ${setting}, visitando frequentemente seus amigos mágicos e garantindo que as lições de ${moralMap[moral]} nunca fossem esquecidas. E embora voltasse para sua casa todas as noites, sabia que agora pertencia a dois mundos – o ordinário e o extraordinário – unidos pela magia mais poderosa de todas: o poder do coração.`
      ];
      break;
    // More cases for other themes...
    default:
      title = `A Incrível Jornada de ${childName}`;
      content = [
        `${childName}, uma criança de ${childAge}, estava pronta para viver uma experiência incrível na ${setting}. Era uma manhã ensolarada de primavera quando ${childName} acordou com uma sensação diferente no peito - aquela mistura de excitação e ansiedade que precede grandes aventuras. Depois de um café da manhã reforçado, preparado com carinho por sua família, ${childName} colocou sua mochila colorida nas costas e saiu pela porta da frente, respirando fundo o ar fresco da manhã.\n\nO caminho para a ${setting} era conhecido, mas hoje parecia diferente, mais vibrante, como se a própria natureza soubesse que algo especial estava prestes a acontecer. Pássaros cantavam melodias alegres nas árvores, flores pareciam se inclinar levemente na direção de ${childName} quando passava, e até mesmo o vento soprava gentilmente, como que sussurrando segredos antigos.\n\nAo chegar na entrada da ${setting}, ${childName} parou por um momento, admirando a vista. De alguma forma, o lugar parecia maior, mais mágico do que se lembrava. As cores eram mais intensas, os sons mais nítidos, e havia um cheiro agradável no ar - uma mistura de flores silvestres, terra úmida e possibilidades infinitas.`,
        
        `Junto com seu fiel companheiro, ${childName} descobriu segredos nunca antes revelados. Não estava sozinho nesta jornada - ao seu lado caminhava seu melhor amigo de quatro patas, um cachorro inteligente e leal com pelo dourado e olhos expressivos que pareciam entender cada palavra que ${childName} dizia. Eles tinham crescido juntos e compartilhado inúmeras aventuras, mas ambos sentiam que esta seria diferente de todas as anteriores.\n\nA primeira descoberta aconteceu quando seguiam uma trilha pouco usada que serpenteava entre árvores antigas. O cachorro de repente parou, suas orelhas se ergueram em alerta, e ele começou a cavar energicamente próximo à raiz de uma árvore centenária. ${childName} se aproximou curioso e ajudou na escavação. Seus dedos logo tocaram em algo sólido e frio. Era uma pequena caixa metálica, verde-esmeralda com desenhos intrincados que pareciam contar histórias de tempos antigos.\n\nCom cuidado, ${childName} abriu a caixa e encontrou dentro um medalhão de prata com símbolos estranhos gravados e uma pequena chave dourada. Havia também um pergaminho envelhecido com um mapa detalhado da ${setting}, mostrando lugares que não apareciam em nenhum mapa oficial. Havia marcações em vermelho indicando locais específicos, com pequenas notas escritas em uma caligrafia elegante e antiga.\n\n"Olhe isso!", exclamou ${childName} para seu companheiro, que abanou o rabo em resposta, igualmente entusiasmado. "Este mapa mostra lugares secretos na ${setting}! Vamos seguir e ver onde nos leva?". O cachorro latiu alegremente, como se estivesse respondendo "sim", e assim começou a verdadeira aventura.`,
        
        `Os desafios eram muitos, mas a determinação de ${childName} era ainda maior. Seguindo o mapa misterioso, ${childName} e seu fiel companheiro chegaram a uma área da ${setting} que poucos visitavam. O caminho ficou mais íngreme e difícil, com rochas soltas e vegetação densa dificultando a passagem. Em alguns momentos, precisavam usar as mãos para escalar pequenas elevações ou afastar galhos espinhosos que bloqueavam o caminho.\n\nO sol já estava alto no céu quando encontraram o primeiro local marcado no mapa - uma pequena cachoeira escondida entre rochas musgosas. A água cristalina caía suavemente em um pequeno lago de águas azul-turquesa. Segundo o mapa, havia algo especial ali. ${childName} olhou ao redor cuidadosamente e notou que atrás da queda d'água parecia haver uma abertura.\n\nCom coragem, mas também com cuidado, ${childName} e o cachorro atravessaram a lateral da cachoeira, tomando cuidado para não escorregar nas pedras úmidas. Como suspeitava, havia uma pequena caverna atrás da cortina de água. Dentro dela, cristais de várias cores refletiam a luz que entrava, criando um espetáculo de luzes coloridas nas paredes rochosas.\n\nNo centro da caverna, sobre uma pedra lisa que parecia um altar natural, estava um pequeno baú de madeira entalhada. ${childName} lembrou-se da chave dourada encontrada anteriormente e, com mãos trêmulas de emoção, inseriu-a na fechadura. Com um clique satisfatório, o baú se abriu, revelando seu conteúdo: uma bússola antiga, mas diferente de qualquer outra que já tinha visto. Em vez de apontar para o norte, sua agulha girava lentamente, como se procurasse algo específico.`,
        
        `Após muitas aventuras, ${childName} encontrou o tesouro que todos procuravam. A bússola especial não apontava para direções, mas para desejos do coração. Quando ${childName} a segurava, a agulha apontava firmemente para o próximo local marcado no mapa. Após dias de exploração, seguindo a bússola mágica através de florestas densas, campos abertos e riachos cristalinos, ${childName} e seu companheiro chegaram ao local final marcado no mapa - uma colina suave coroada por um círculo de pedras antigas.\n\nAo entrar no círculo de pedras, a bússola começou a girar freneticamente, e o medalhão encontrado anteriormente esquentou no bolso de ${childName}. Ao retirá-lo, o medalhão começou a brilhar intensamente. Instintivamente, ${childName} colocou o medalhão no centro do círculo de pedras, sobre uma laje plana que parecia feita exatamente para isso.\n\nNo momento em que o medalhão tocou a pedra, um feixe de luz dourada subiu para o céu, e o chão começou a tremer suavemente. As pedras do círculo brilharam com uma luz interna, como se despertassem de um longo sono. Lentamente, uma seção do chão no centro do círculo começou a se mover, revelando uma escadaria em espiral que descia para a escuridão.\n\nCom o coração acelerado, mas cheio de coragem, ${childName} e seu fiel amigo desceram os degraus, iluminados apenas pelo brilho do medalhão. No final da escadaria, encontraram uma câmara circular, iluminada por cristais semelhantes aos da caverna atrás da cachoeira. No centro da sala, sobre um pedestal de pedra, estava o que parecia ser um livro antigo e grosso, com capa de couro adornada com pedras preciosas.`,
        
        `No final, todos aprenderam que o verdadeiro tesouro era a amizade e as lições sobre ${moralMap[moral]} que descobriram juntos. Quando ${childName} abriu o livro antigo, não encontrou ouro ou joias como imaginava, mas páginas que brilhavam com palavras escritas em uma língua antiga e desenhos detalhados que pareciam se mover sutilmente. Surpreendentemente, ao tocar nas páginas, ${childName} começou a entender seu conteúdo, como se o livro estivesse se comunicando diretamente com sua mente.\n\nEra o Livro dos Guardiões, um registro milenar que contava a história da ${setting} e dos protetores escolhidos ao longo dos séculos para preservar sua magia e harmonia. ${childName} descobriu que o medalhão, a bússola e o próprio mapa eram artefatos passados de guardião para guardião, e que agora era sua vez de assumir esta honrosa responsabilidade.\n\nAs páginas do livro revelavam que a ${setting} não era apenas um lugar comum, mas um ponto de encontro entre o mundo ordinário e o reino da magia. Sua beleza e equilíbrio precisavam ser protegidos, e os guardiões eram escolhidos não por sua força física, mas por qualidades como coragem, bondade, honestidade e, acima de tudo, a capacidade de trabalhar em harmonia com todos os seres.\n\nAo terminar de ler, ${childName} sentiu uma sensação morna se espalhando pelo corpo, como se a própria magia da ${setting} estivesse se conectando com seu coração. O livro mostrou imagens de todos os habitantes da região - pessoas, animais e até mesmo as plantas e árvores - todos interconectados em uma teia invisível de amizade e interdependência. Mostraram também os desafios que a ${setting} enfrentava e como cada pessoa podia fazer a diferença através de pequenas ações diárias de cuidado e respeito.\n\nQuando ${childName} e seu companheiro retornaram à superfície, o sol estava se pondo, pintando o céu com tons de laranja e rosa. A sensação era de que haviam passado horas abaixo da terra, mas o tempo havia voado. Com o livro, o medalhão e a bússola guardados com segurança na mochila, iniciaram o caminho de volta para casa.\n\nNas semanas seguintes, ${childName} começou discretamente sua missão como guardião, compartilhando as lições aprendidas com amigos e familiares. Organizou grupos para limpar áreas poluídas, plantou árvores nativas, construiu abrigos para animais silvestres e ensinou outras crianças sobre a importância de preservar a natureza.\n\nO que mais surpreendeu ${childName} foi como as pessoas respondiam positivamente quando trabalhavam juntas por um objetivo comum. Adultos que raramente conversavam se tornaram amigos, crianças que competiam passaram a colaborar, e até mesmo pessoas que pareciam não se importar com a natureza começaram a demonstrar interesse e cuidado.\n\nEm uma tarde especial, enquanto observava um grupo diverso de pessoas trabalhando harmoniosamente para restaurar um jardim comunitário, ${childName} sentiu o medalhão esquentar suavemente contra o peito. Ao olhar para baixo, viu que ele brilhava com luz própria, como se aprovando suas ações. Foi então que ${childName} compreendeu completamente: o verdadeiro tesouro nunca foi o livro, o medalhão ou qualquer objeto material. O verdadeiro tesouro era a capacidade de unir pessoas, de inspirar cooperação e amizade, de ver além das diferenças e trabalhar juntos por um bem maior.\n\nCom seu fiel companheiro sempre ao lado, ${childName} continuou sua jornada como guardião da ${setting}, sabendo que cada nova amizade formada, cada lição de ${moralMap[moral]} compartilhada, era mais um passo na preservação da magia daquele lugar especial. E embora poucos soubessem de seu papel oficial como guardião, todos sentiam o impacto positivo de suas ações e, inspirados por seu exemplo, começavam suas próprias jornadas de descoberta e cuidado com o mundo ao seu redor.`
      ];
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

  return { title, content };
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
