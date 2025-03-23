
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";
import { useStoryBot } from "../hooks/useStoryBot";
import { AlertCircle, Info } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const StoryBotChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [characterPrompt, setCharacterPrompt] = useState<string>("");
  const [hasApiError, setHasApiError] = useState(false);
  const [localModeActive, setLocalModeActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { generateStoryBotResponse, apiAvailable } = useStoryBot();
  
  useEffect(() => {
    // Initial welcome message changes based on API availability
    const welcomeMessage = !apiAvailable || localStorage.getItem("storybot_api_issue") === "true"
      ? "Olá! Eu sou o StoryBot, seu assistente virtual para criar histórias infantis! 😊 Estou funcionando com recursos limitados no momento, mas ainda posso criar histórias divertidas. Para começarmos, conte-me sobre a criança para quem vamos criar a história e o tema que você prefere!"
      : "Olá! Eu sou o StoryBot, seu assistente virtual para criar histórias infantis personalizadas! 😊 Para começarmos, poderia me dizer o nome da criança para quem vamos criar a história? E que tipo de tema você gostaria para a história? Posso sugerir alguns como: aventura na floresta, viagem ao espaço, reino mágico, fundo do mar ou terra dos dinossauros!";
    
    const initialMessage: Message = {
      role: "assistant",
      content: welcomeMessage
    };
    
    setMessages([initialMessage]);
    
    // Check if we've already detected API issues
    const hasApiIssue = localStorage.getItem("storybot_api_issue") === "true";
    setHasApiError(hasApiIssue);
    setLocalModeActive(hasApiIssue);
    
    // Listen for API issues
    const handleApiIssue = () => {
      setHasApiError(true);
      setLocalModeActive(true);
      localStorage.setItem("storybot_api_issue", "true");
      
      // Add a message explaining the situation if this is the first API error
      if (!hasApiError && messages.length > 0) {
        const apiErrorMessage: Message = {
          role: "assistant",
          content: "Estou enfrentando algumas limitações técnicas no momento. Vou continuar te ajudando com um modo simplificado, que ainda é capaz de criar histórias divertidas. Por favor, continue com suas solicitações!"
        };
        setMessages(prev => [...prev, apiErrorMessage]);
      }
    };
    
    window.addEventListener("storybot_api_issue", handleApiIssue);
    
    return () => {
      window.removeEventListener("storybot_api_issue", handleApiIssue);
    };
  }, [apiAvailable]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 2) {
      const allText = messages.map(m => m.content).join(" ");
      
      const descriptionMatch = allText.match(/aparência.+?(cabelo|olhos|pele|roupa|veste)/i) || 
                              allText.match(/personagem.+?(cabelo|olhos|pele|roupa|veste)/i) ||
                              allText.match(/característica.+?(cabelo|olhos|pele|roupa|veste)/i);
      
      if (descriptionMatch && descriptionMatch[0] && !characterPrompt) {
        const sentence = allText.substring(
          Math.max(0, allText.indexOf(descriptionMatch[0]) - 30),
          Math.min(allText.length, allText.indexOf(descriptionMatch[0]) + 150)
        );
        
        setCharacterPrompt(sentence);
        console.log("Character description extracted:", sentence);
      }
    }
  }, [messages, characterPrompt]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    if (e.target.value.match(/aparência|personagem.+?(cabelo|olhos|pele|roupa|veste)/i)) {
      setCharacterPrompt(e.target.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      role: "user",
      content: inputValue
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      let response = "";
      let errorOccurred = false;
      
      try {
        response = await generateStoryBotResponse(messages, inputValue);
      } catch (error) {
        console.error("StoryBot response generation failed:", error);
        errorOccurred = true;
        
        // Simple fallback for local mode
        if (localModeActive) {
          response = generateLocalResponse(inputValue, messages);
        } else {
          throw error;
        }
      }
      
      if (!response) {
        throw new Error("Resposta vazia do StoryBot");
      }
      
      const assistantMessage: Message = {
        role: "assistant",
        content: response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // If we had to use a fallback but haven't seen an error yet, show a notice
      if (errorOccurred && !hasApiError) {
        setHasApiError(true);
        setLocalModeActive(true);
        
        // Dispatch API issue event
        const apiIssueEvent = new Event("storybot_api_issue");
        window.dispatchEvent(apiIssueEvent);
        localStorage.setItem("storybot_api_issue", "true");
        
        toast.error("Usando modo simplificado devido a limitações técnicas", {
          description: "A geração de histórias continuará funcionando com recursos locais",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error generating response:", error);
      
      // Add a fallback message in case of error
      const errorAssistantMessage: Message = {
        role: "assistant",
        content: "Desculpe, estou tendo dificuldades para processar sua solicitação. Por favor, tente novamente com outras palavras ou aguarde um momento."
      };
      
      setMessages(prev => [...prev, errorAssistantMessage]);
      
      // Trigger API issue event
      const apiIssueEvent = new Event("storybot_api_issue");
      window.dispatchEvent(apiIssueEvent);
      setHasApiError(true);
      setLocalModeActive(true);
      localStorage.setItem("storybot_api_issue", "true");
      
      toast.error("Erro de comunicação detectado", {
        description: "Usando modo simplificado para continuar gerando histórias",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simple local response generator for when API is unavailable
  const generateLocalResponse = (userInput: string, messageHistory: Message[]): string => {
    const input = userInput.toLowerCase();
    
    // Check if this is about creating a story
    if (input.includes("história") || input.includes("conto") || input.includes("estória")) {
      return "Posso criar uma história para você! Por favor, me diga o nome da criança, idade e qual tema você prefere: aventura, fantasia, espaço, oceano ou dinossauros. Com o modo simplificado, vou criar algo básico mas divertido!";
    }
    
    // Check if user is asking for capabilities
    if (input.includes("o que você") || input.includes("como você") || input.includes("pode fazer")) {
      return "Posso criar histórias infantis personalizadas, mesmo no modo simplificado! Basta me dizer o nome da criança, idade, e o tema que você prefere. Vou fazer o melhor para criar algo especial!";
    }
    
    // Extract name if present
    let childName = "sua criança";
    const nameMatch = input.match(/nome (?:é|da criança é|do meu filho é|da minha filha é) ([A-Za-zÀ-ÖØ-öø-ÿ]+)/i);
    if (nameMatch && nameMatch[1]) {
      childName = nameMatch[1];
    }
    
    // Extract theme if present
    let theme = "aventura";
    if (input.includes("fantasia")) theme = "fantasia";
    if (input.includes("espaço")) theme = "espaço";
    if (input.includes("oceano") || input.includes("mar")) theme = "oceano";
    if (input.includes("dinossauro")) theme = "dinossauros";
    
    // General response based on content
    if (input.includes("obrigad")) {
      return "Foi um prazer ajudar! Se quiser criar outra história ou tiver mais perguntas, estou à disposição!";
    }
    
    // If asking about characters or setting
    if (input.includes("personagem") || input.includes("cenário") || input.includes("ambiente")) {
      return `Para a história de ${childName} com tema de ${theme}, posso adicionar personagens mágicos e cenários incríveis! Que tipo de personagem você gostaria de incluir? Um amigo especial, um animal falante, ou talvez um guia mágico?`;
    }
    
    // Default response
    return `Estou criando uma história especial para ${childName} com o tema de ${theme}. No modo simplificado, posso criar algo básico mas divertido. Você gostaria de adicionar algum elemento especial à história, como um objeto mágico ou um amigo especial?`;
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8 shadow-xl mb-12 flex flex-col h-[700px]">
      {hasApiError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">
            {localModeActive 
              ? "Usando gerador de histórias local. As respostas serão simplificadas."
              : "Estamos com limitações técnicas no momento. As respostas podem ser simplificadas."}
          </p>
        </div>
      )}
      
      {localModeActive && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-blue-700">
          <Info className="h-4 w-4 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Dicas para o modo simplificado:</p>
            <ul className="text-xs mt-1 space-y-1 list-disc pl-4">
              <li>Seja específico sobre o nome e idade da criança</li>
              <li>Mencione claramente o tema desejado (aventura, fantasia, espaço, etc.)</li>
              <li>Descreva os personagens com detalhes simples</li>
            </ul>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto mb-4 pr-2 custom-scrollbar">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`mb-4 ${
              message.role === "user" ? "ml-auto" : "mr-auto"
            }`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-xl ${
                message.role === "user"
                  ? "bg-storysnap-blue text-white ml-auto"
                  : localModeActive 
                    ? "bg-amber-50 border border-amber-200 text-slate-800" 
                    : "bg-slate-100 text-slate-800"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 ml-4 mb-4">
            <LoadingSpinner size="sm" />
            <span className="text-slate-500">
              {localModeActive ? "Gerando resposta local..." : "StoryBot está pensando..."}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Textarea
          placeholder={localModeActive 
            ? "Digite sua mensagem (modo simplificado ativo)..." 
            : "Digite sua mensagem aqui..."}
          value={inputValue}
          onChange={handleInputChange}
          className={`w-full resize-none custom-scrollbar ${
            localModeActive 
              ? "focus:border-amber-400 border-amber-200" 
              : "focus:border-storysnap-blue"
          }`}
          rows={4}
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !inputValue.trim()}
          className={`${
            localModeActive 
              ? "bg-amber-500 hover:bg-amber-600" 
              : "bg-storysnap-blue hover:bg-storysnap-blue/90"
          } text-white self-end px-6`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span>Enviando...</span>
            </div>
          ) : (
            "Enviar"
          )}
        </Button>
      </form>
    </div>
  );
};

export default StoryBotChat;
