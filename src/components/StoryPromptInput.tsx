import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Bot } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import LoadingSpinner from "./LoadingSpinner";

interface StoryPromptInputProps {
  onSubmit: (prompt: string) => void;
  initialPrompt?: string;
}

const StoryPromptInput: React.FC<StoryPromptInputProps> = ({ 
  onSubmit,
  initialPrompt = ""
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    setIsSubmitting(true);
    
    // Simular um breve delay antes de submeter para feedback visual
    setTimeout(() => {
      onSubmit(prompt.trim());
      setIsSubmitting(false);
    }, 500);
  };

  const themeCategories = [
    {
      title: "Desenvolvimento Emocional",
      icon: "💭",
      suggestions: [
        "Lidando com a Frustração – Como ensinar às crianças que nem sempre conseguimos o que queremos e como superar isso.",
        "A Importância de Pedir Desculpas – Aprendendo sobre arrependimento e empatia.",
        "O Valor da Paciência – Histórias sobre esperar a sua vez e entender que tudo tem seu tempo.",
        "Superando o Medo do Escuro – Ajudando as crianças a enfrentarem inseguranças noturnas.",
        "Aprendendo a Expressar Emoções – Como nomear e lidar com sentimentos como raiva, tristeza e alegria."
      ]
    },
    {
      title: "Educação Social e Cidadania",
      icon: "🌍",
      suggestions: [
        "A Importância da Honestidade – Mostrando que ser sincero é sempre o melhor caminho.",
        "O Poder da Gentileza – Pequenos gestos que fazem grande diferença no dia a dia.",
        "Trabalho em Equipe – Aprendendo a colaborar e respeitar os outros.",
        "Respeito às Diferenças – Entendendo que todos somos únicos e especiais.",
        "O Mundo é de Todos: Respeitando o Meio Ambiente – A importância de cuidar da natureza e dos animais."
      ]
    },
    {
      title: "Educação Financeira e Autonomia",
      icon: "💡",
      suggestions: [
        "O Valor do Dinheiro – Ensinar de forma lúdica a diferença entre necessidade e desejo.",
        "Pequenos Gestos, Grandes Mudanças – Como pequenas economias fazem diferença no futuro.",
        "A Importância de Cuidar dos Próprios Pertences – Como a responsabilidade sobre os objetos pode ensinar organização.",
        "O Trabalho e as Recompensas – Explicando o esforço por trás de conquistas.",
        "Compartilhar Também é Ganhar – Aprendendo que dividir pode ser algo positivo."
      ]
    },
    {
      title: "Hábitos Saudáveis e Rotina",
      icon: "🏡",
      suggestions: [
        "A Magia de Comer Frutas e Verduras – Incentivando uma alimentação saudável.",
        "A Importância de Dormir Bem – Como o sono impacta nosso humor e aprendizado.",
        "Por que Escovar os Dentes é tão Importante? – Criando hábitos de higiene bucal de forma divertida.",
        "Brincar ao Ar Livre é Legal! – Estimulando atividades físicas e contato com a natureza.",
        "Adeus, Fralda! Bem-vindo, Troninho! – Facilitando a transição do desfralde."
      ]
    },
    {
      title: "Incentivo à Leitura e Criatividade",
      icon: "📖",
      suggestions: [
        "O Livro Mágico – Como a leitura pode nos levar para mundos incríveis.",
        "Criando Histórias com a Imaginação – Incentivando a criatividade e a escrita.",
        "O Poder das Palavras – Mostrando como as palavras podem alegrar ou magoar alguém.",
        "Brincar sem Tela: A Magia da Imaginação – Incentivando brincadeiras fora do mundo digital.",
        "Música e Ritmo: Descobrindo Sons e Emoções – Como a música pode ajudar na expressão emocional."
      ]
    },
    {
      title: "Autoestima e Confiança",
      icon: "🎭",
      suggestions: [
        "Eu Sou Especial do Meu Jeito – Ensinando as crianças a valorizarem suas qualidades únicas.",
        "O Pequeno Grande Corajoso – Como enfrentar desafios e acreditar em si mesmo.",
        "Errei! E Agora? – A importância de aprender com os erros e seguir em frente.",
        "Meu Corpo, Minhas Regras – Ensinar sobre consentimento e respeito ao próprio corpo.",
        "Sonhar Grande e Acreditar em Mim – Mostrando que qualquer sonho pode se tornar realidade com esforço e dedicação."
      ]
    }
  ];

  const ageCategories = [
    {
      title: "0 a 2 anos – Descobrindo o Mundo",
      icon: "👶",
      suggestions: [
        "As Primeiras Palavras – Um livro ilustrado para apresentar nomes de objetos e animais.",
        "Cadê? Achou! – Histórias com elementos de esconder e achar para estimular a atenção.",
        "As Cores do Meu Dia – Explorando as cores no cotidiano da criança.",
        "Boas Noites, Estrelinha! – Criando um ritual de sono tranquilo e acolhedor.",
        "O Meu Corpo é Mágico! – Descobrindo as partes do corpo de forma divertida."
      ]
    },
    {
      title: "3 a 4 anos – Explorando Emoções e Socialização",
      icon: "👧",
      suggestions: [
        "O Ursinho Bravo – Como lidar com a frustração e expressar sentimentos.",
        "Compartilhar é Legal! – Aprendendo a dividir brinquedos e momentos.",
        "Xô, Medo do Escuro! – Lidando com inseguranças de forma lúdica.",
        "Os Amigos da Escola – A importância da amizade e do respeito aos coleguinhas.",
        "O Dia da Bagunça – Ensinando sobre organização e responsabilidade de um jeito divertido."
      ]
    },
    {
      title: "5 a 6 anos – Construindo Valores e Curiosidade",
      icon: "🧒",
      suggestions: [
        "A Máquina dos Porquês – Respondendo de forma divertida as perguntas infinitas das crianças.",
        "O Segredo do Tesouro Perdido – Incentivando a curiosidade e o espírito explorador.",
        "Pequenos Gestos, Grandes Amizades – Mostrando como atitudes gentis fazem diferença.",
        "O Planeta Azul Precisa de Ajuda! – Introduzindo conceitos sobre meio ambiente e sustentabilidade.",
        "Super-Heróis do Cotidiano – Mostrando que todos podem ser heróis ajudando os outros."
      ]
    },
    {
      title: "6 a 7 anos – Aprendendo a Ler e Desenvolvendo a Imaginação",
      icon: "📖",
      suggestions: [
        "Era Uma Vez um Pequeno Leitor – Descobrindo o prazer da leitura.",
        "A Grande Aventura dos Números – Introduzindo conceitos matemáticos de forma divertida.",
        "O Mistério da Letra Perdida – Estimulando o aprendizado do alfabeto.",
        "Histórias do Céu e das Estrelas – Explorando a curiosidade sobre o espaço.",
        "As Aventuras do Pequeno Inventor – Incentivando a criatividade e o pensamento lógico."
      ]
    },
    {
      title: "7 a 8 anos – Raciocínio Crítico e Autonomia",
      icon: "📝",
      suggestions: [
        "O Clube dos Pequenos Detetives – Resolvendo mistérios e aprendendo a pensar de forma lógica.",
        "As Viagens de um Pequeno Explorador – Descobrindo diferentes culturas e lugares do mundo.",
        "E Se Eu Fosse um Cientista? – Incentivando o interesse por experimentos e descobertas.",
        "A Loja de Sonhos – Ensinar sobre objetivos e persistência na realização de sonhos.",
        "A Fábrica de Emoções – Compreendendo e expressando sentimentos de maneira saudável."
      ]
    },
    {
      title: "Temas Especiais para Todas as Idades",
      icon: "🌟",
      suggestions: [
        "Eu Sou Único! – Ensinando sobre autoestima e aceitação.",
        "O Grande Livro das Profissões – Mostrando diferentes carreiras e sonhos para o futuro.",
        "Brincando sem Tela – Incentivando atividades fora do digital.",
        "Pequenos Cientistas – Experimentos fáceis para despertar o interesse pela ciência.",
        "O Livro dos Sentimentos – Explorando alegria, medo, tristeza e amor com empatia."
      ]
    }
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-center">
        Descreva a história que você deseja criar
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-violet-50 p-4 rounded-lg text-sm text-violet-700 mb-6 flex items-start gap-2">
          <Bot className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Como funciona?</p>
            <p>Descreva com detalhes que tipo de história você deseja. Inclua informações como tema, personagens, cenário, ou qualquer elemento especial.</p>
          </div>
        </div>
        
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Quero uma história sobre um aventureiro corajoso que explora uma floresta mágica..."
          className="min-h-[120px] text-base"
        />
        
        <div>
          <p className="text-sm text-slate-500 mb-3">Sugestões populares:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => handleSuggestionClick("Uma aventura sobre dinossauros para um menino de 6 anos que ama explorar")}
              className="text-xs px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full hover:bg-violet-200 transition-colors"
            >
              Aventura com dinossauros
            </button>
            <button
              type="button"
              onClick={() => handleSuggestionClick("Uma história sobre uma astronauta corajosa para uma menina de 8 anos")}
              className="text-xs px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full hover:bg-violet-200 transition-colors"
            >
              Astronauta corajosa
            </button>
            <button
              type="button"
              onClick={() => handleSuggestionClick("Um conto sobre amizade entre um dragão e uma princesa")}
              className="text-xs px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full hover:bg-violet-200 transition-colors"
            >
              Amizade entre dragão e princesa
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <h3 className="text-sm font-medium p-3 bg-violet-50 border-b border-gray-200">Temas por Categoria</h3>
              <Accordion type="multiple" className="w-full">
                {themeCategories.map((category, index) => (
                  <AccordionItem key={index} value={`theme-${index}`} className="border-b last:border-b-0">
                    <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 text-sm font-medium text-left flex items-center gap-2">
                      <span className="mr-1">{category.icon}</span> {category.title}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3 pt-1">
                      <div className="flex flex-col gap-2">
                        {category.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs text-left px-3 py-2 bg-violet-50 text-violet-700 rounded-md hover:bg-violet-100 transition-colors flex items-start gap-2"
                          >
                            <span className="text-violet-500 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <h3 className="text-sm font-medium p-3 bg-violet-50 border-b border-gray-200">Temas por Faixa Etária</h3>
              <Accordion type="multiple" className="w-full">
                {ageCategories.map((category, index) => (
                  <AccordionItem key={index} value={`age-${index}`} className="border-b last:border-b-0">
                    <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 text-sm font-medium text-left flex items-center gap-2">
                      <span className="mr-1">{category.icon}</span> {category.title}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3 pt-1">
                      <div className="flex flex-col gap-2">
                        {category.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs text-left px-3 py-2 bg-violet-50 text-violet-700 rounded-md hover:bg-violet-100 transition-colors flex items-start gap-2"
                          >
                            <span className="text-violet-500 mt-0.5">•</span>
                            <span>{suggestion}</span>
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
        
        <div className="pt-4">
          <Button 
            type="submit"
            disabled={!prompt.trim() || isSubmitting}
            className="w-full py-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Continuar
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default StoryPromptInput;
