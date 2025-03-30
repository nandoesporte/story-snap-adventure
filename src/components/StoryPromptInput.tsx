
import { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Sparkles, Send, Wand2, ChevronDown, ChevronUp, Cake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

interface StoryPromptInputProps {
  onSubmit: (prompt: string) => void;
  onBack?: () => void; // Make this prop optional
}

const StoryPromptInput = ({ onSubmit, onBack }: StoryPromptInputProps) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Categorized suggestions based on child development themes
  const categorizedSuggestions = {
    "emotional": {
      title: "Desenvolvimento Emocional",
      suggestions: [
        "Uma história sobre como lidar com a frustração quando não conseguimos o que queremos",
        "Uma aventura que ensina sobre a importância de pedir desculpas e mostrar empatia",
        "Um conto sobre o valor da paciência e esperar a sua vez",
        "Uma história para ajudar crianças a superar o medo do escuro",
        "Uma aventura que ensina a expressar e lidar com diferentes emoções"
      ]
    },
    "social": {
      title: "Educação Social e Cidadania",
      suggestions: [
        "Uma história sobre a importância da honestidade e ser sempre sincero",
        "Um conto mágico sobre o poder da gentileza no dia a dia",
        "Uma aventura que ensina sobre trabalho em equipe e cooperação",
        "Uma história sobre respeitar as diferenças e valorizar a diversidade",
        "Uma jornada sobre a importância de cuidar do meio ambiente e dos animais"
      ]
    },
    "financial": {
      title: "Educação Financeira e Autonomia",
      suggestions: [
        "Uma história que ensina sobre o valor do dinheiro de forma lúdica",
        "Um conto sobre como pequenas economias fazem diferença no futuro",
        "Uma aventura sobre a importância de cuidar dos próprios pertences",
        "Uma história sobre o esforço por trás das conquistas e recompensas",
        "Um conto que mostra que compartilhar também é ganhar"
      ]
    },
    "health": {
      title: "Hábitos Saudáveis e Rotina",
      suggestions: [
        "Uma história mágica sobre a importância de comer frutas e verduras",
        "Uma conto de fadas sobre a importância de dormir bem",
        "Uma aventura que explica por que escovar os dentes é importante",
        "Uma história divertida sobre brincar ao ar livre e praticar atividades físicas",
        "Uma história sobre a transição do desfralde de forma divertida"
      ]
    },
    "reading": {
      title: "Incentivo à Leitura e Criatividade",
      suggestions: [
        "Uma história sobre um livro mágico que transporta para mundos incríveis",
        "Uma aventura sobre criar histórias com a imaginação",
        "Uma conto sobre o poder das palavras para alegrar ou magoar alguém",
        "Uma história que incentiva brincadeiras fora do mundo digital",
        "Uma aventura musical sobre descobrir sons e expressar emoções"
      ]
    },
    "selfesteem": {
      title: "Autoestima e Confiança",
      suggestions: [
        "Uma história sobre uma criança que aprende a valorizar suas qualidades únicas",
        "Um conto sobre coragem e acreditar em si mesmo",
        "Uma aventura sobre aprender com os erros e seguir em frente",
        "Uma história sobre respeito ao próprio corpo e consentimento",
        "Um conto inspirador sobre sonhar grande e acreditar em si mesmo"
      ]
    }
  };

  // Age-based theme suggestions
  const ageBasedSuggestions = {
    "0-2": {
      title: "0 a 2 anos – Descobrindo o Mundo",
      description: "Nessa fase, os bebês estão começando a reconhecer emoções, desenvolver vínculos afetivos e explorar o mundo ao seu redor. Os livros devem ter cores vibrantes, texturas e sons, com frases curtas e rimas simples.",
      suggestions: [
        "As Primeiras Palavras – Um livro ilustrado para apresentar nomes de objetos e animais",
        "Cadê? Achou! – Histórias com elementos de esconder e achar para estimular a atenção",
        "As Cores do Meu Dia – Explorando as cores no cotidiano da criança",
        "Boas Noites, Estrelinha! – Criando um ritual de sono tranquilo e acolhedor",
        "O Meu Corpo é Mágico! – Descobrindo as partes do corpo de forma divertida"
      ]
    },
    "3-4": {
      title: "3 a 4 anos – Explorando Emoções e Socialização",
      description: "As crianças começam a desenvolver mais independência e interagem com os outros. Os livros devem abordar emoções, convivência e os primeiros conceitos educativos.",
      suggestions: [
        "O Ursinho Bravo – Como lidar com a frustração e expressar sentimentos",
        "Compartilhar é Legal! – Aprendendo a dividir brinquedos e momentos",
        "Xô, Medo do Escuro! – Lidando com inseguranças de forma lúdica",
        "Os Amigos da Escola – A importância da amizade e do respeito aos coleguinhas",
        "O Dia da Bagunça – Ensinando sobre organização e responsabilidade de um jeito divertido"
      ]
    },
    "5-6": {
      title: "5 a 6 anos – Construindo Valores e Curiosidade",
      description: "Nessa idade, as crianças ampliam seu vocabulário e começam a entender regras e valores morais. Os livros podem incluir pequenas histórias com enredos mais estruturados.",
      suggestions: [
        "A Máquina dos Porquês – Respondendo de forma divertida as perguntas infinitas das crianças",
        "O Segredo do Tesouro Perdido – Incentivando a curiosidade e o espírito explorador",
        "Pequenos Gestos, Grandes Amizades – Mostrando como atitudes gentis fazem diferença",
        "O Planeta Azul Precisa de Ajuda! – Introduzindo conceitos sobre meio ambiente e sustentabilidade",
        "Super-Heróis do Cotidiano – Mostrando que todos podem ser heróis ajudando os outros"
      ]
    },
    "6-7": {
      title: "6 a 7 anos – Aprendendo a Ler e Desenvolvendo a Imaginação",
      description: "Nesta fase, os livros podem conter textos um pouco mais longos, incentivando a leitura independente e a imaginação criativa.",
      suggestions: [
        "Era Uma Vez um Pequeno Leitor – Descobrindo o prazer da leitura",
        "A Grande Aventura dos Números – Introduzindo conceitos matemáticos de forma divertida",
        "O Mistério da Letra Perdida – Estimulando o aprendizado do alfabeto",
        "Histórias do Céu e das Estrelas – Explorando a curiosidade sobre o espaço",
        "As Aventuras do Pequeno Inventor – Incentivando a criatividade e o pensamento lógico"
      ]
    },
    "7-8": {
      title: "7 a 8 anos – Raciocínio Crítico e Autonomia",
      description: "As crianças começam a criar suas próprias histórias e a refletir sobre desafios e valores. Os livros podem ter tramas mais envolventes e desafios interativos.",
      suggestions: [
        "O Clube dos Pequenos Detetives – Resolvendo mistérios e aprendendo a pensar de forma lógica",
        "As Viagens de um Pequeno Explorador – Descobrindo diferentes culturas e lugares do mundo",
        "E Se Eu Fosse um Cientista? – Incentivando o interesse por experimentos e descobertas",
        "A Loja de Sonhos – Ensinar sobre objetivos e persistência na realização de sonhos",
        "A Fábrica de Emoções – Compreendendo e expressando sentimentos de maneira saudável"
      ]
    },
    "special": {
      title: "Temas Especiais para Todas as Idades",
      description: "Esses temas podem ser abordados de diferentes formas para se adequarem a diversas faixas etárias.",
      suggestions: [
        "Eu Sou Único! – Ensinando sobre autoestima e aceitação",
        "O Grande Livro das Profissões – Mostrando diferentes carreiras e sonhos para o futuro",
        "Brincando sem Tela – Incentivando atividades fora do digital",
        "Pequenos Cientistas – Experimentos fáceis para despertar o interesse pela ciência",
        "O Livro dos Sentimentos – Explorando alegria, medo, tristeza e amor com empatia"
      ]
    }
  };

  const applyExamplePrompt = (example: string) => {
    setPrompt(example);
  };

  const handleSubmit = () => {
    if (!prompt.trim()) {
      toast.error("Por favor, escreva o que você gostaria para a história");
      return;
    }
    
    setIsLoading(true);
    
    // Simulate a small delay to give feedback
    setTimeout(() => {
      onSubmit(prompt);
      setIsLoading(false);
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Descreva a história desejada</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-full h-8 w-8 p-0">
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">Ajuda</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Como usar</h3>
              <p className="text-sm text-muted-foreground">
                Descreva o que você gostaria para a história infantil. Seja criativo!
                Você pode mencionar:
              </p>
              <ul className="text-sm list-disc pl-4 space-y-1 text-muted-foreground">
                <li>Tema da história (aventura, fantasia, espaço...)</li>
                <li>Cenário onde a história acontece</li>
                <li>Características ou habilidades especiais do personagem</li>
                <li>Lições ou valores que você gostaria que a história transmitisse</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Depois de submeter sua descrição, você poderá personalizar mais detalhes como
                idade da criança, estilo visual e tamanho da história.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="Descreva o que você gostaria para a história infantil. Ex: Uma aventura no fundo do mar onde a criança encontra uma sereia amigável..."
          className="min-h-[150px] resize-none p-4 text-base"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Temas para histórias */}
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              Temas para histórias
            </p>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(categorizedSuggestions).map(([key, category]) => (
                <AccordionItem key={key} value={key} className="border rounded-lg mb-2 overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:bg-violet-50 hover:no-underline">
                    📚 {category.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="flex flex-col gap-2 pt-1 pb-2 px-4">
                      {category.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => applyExamplePrompt(suggestion)}
                          className="text-xs px-3 py-2 text-left bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          {/* Temas por idade */}
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <Cake className="h-3.5 w-3.5 text-violet-500" />
              Temas por idade
            </p>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(ageBasedSuggestions).map(([key, category]) => (
                <AccordionItem key={key} value={key} className="border rounded-lg mb-2 overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:bg-violet-50 hover:no-underline">
                    👶 {category.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="flex flex-col gap-2 pt-1 pb-2 px-4">
                      {category.description && (
                        <p className="text-xs text-slate-600 mb-2 italic">
                          {category.description}
                        </p>
                      )}
                      {category.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => applyExamplePrompt(suggestion)}
                          className="text-xs px-3 py-2 text-left bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
          >
            Voltar
          </Button>
        )}
        
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`gap-1.5 bg-violet-600 hover:bg-violet-700 ${!onBack ? 'ml-auto' : ''}`}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Criar História
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default StoryPromptInput;
