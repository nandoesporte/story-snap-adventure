
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

Retorne a resposta em formato JSON com a seguinte estrutura:
{
  "title": "Título da História",
  "content": ["Texto da página 1", "Texto da página 2", "Texto da página 3", "Texto da página 4", "Texto da página 5"]
}

O título deve ser criativo e atraente para crianças. 
Cada página deve ter aproximadamente 2-3 parágrafos curtos.
A história deve ser independente e completa, com início, meio e fim.
Evite referências a marcas, personagens protegidos por direitos autorais ou temas adultos.`;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Por favor, crie uma história infantil para ${childName} sobre ${theme} em ${setting}${characterPrompt ? ` com ${characterPrompt}` : ''}.` }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.8,
      max_tokens: 2000,
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
        `${childName} estava muito animado(a) para explorar a ${setting} com seus amigos. Era um dia perfeito para uma grande aventura!`,
        `Enquanto caminhavam pela ${setting}, ${childName} encontrou um mapa misterioso escondido atrás de uma árvore.`,
        `O mapa os levou até uma caverna secreta, onde eles descobriram um baú brilhante.`,
        `Dentro do baú havia um conjunto de chaves mágicas que podiam abrir qualquer porta na ${setting}.`,
        `${childName} e seus amigos usaram as chaves para ajudar os animais perdidos a voltarem para casa, aprendendo sobre ${moralMap[moral]} no processo.`
      ];
      break;
    case "fantasy":
      title = `${childName} e a Magia da ${setting}`;
      content = [
        `Era uma vez, na mágica ${setting}, vivia ${childName}, uma criança muito especial que adorava histórias fantásticas.`,
        `Um dia, ${childName} encontrou uma varinha mágica que começou a brilhar assim que a tocou.`,
        `A varinha revelou que ${childName} havia sido escolhido(a) para restaurar a magia que estava desaparecendo da ${setting}.`,
        `Com a ajuda de novos amigos mágicos, ${childName} enfrentou desafios que testaram sua coragem e bondade.`,
        `No final, ${childName} descobriu que a verdadeira magia estava em seu coração, e a lição de ${moralMap[moral]} foi compartilhada com todos.`
      ];
      break;
    // More cases for other themes...
    default:
      title = `A Incrível Jornada de ${childName}`;
      content = [
        `${childName}, uma criança de ${childAge}, estava pronta para viver uma experiência incrível na ${setting}.`,
        `Junto com seu fiel companheiro, ${childName} descobriu segredos nunca antes revelados.`,
        `Os desafios eram muitos, mas a determinação de ${childName} era ainda maior.`,
        `Após muitas aventuras, ${childName} encontrou o tesouro que todos procuravam.`,
        `No final, todos aprenderam que o verdadeiro tesouro era a amizade e as lições sobre ${moralMap[moral]} que descobriram juntos.`
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
