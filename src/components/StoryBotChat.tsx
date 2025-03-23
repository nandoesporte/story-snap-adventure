
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";
import { useStoryBot } from "../hooks/useStoryBot";
import { AlertCircle } from "lucide-react";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { generateStoryBotResponse } = useStoryBot();
  
  useEffect(() => {
    const initialMessage: Message = {
      role: "assistant",
      content: "Olá! Eu sou o StoryBot, seu assistente virtual para criar histórias infantis personalizadas! 😊 Para começarmos, poderia me dizer o nome da criança para quem vamos criar a história? E que tipo de tema você gostaria para a história? Posso sugerir alguns como: aventura na floresta, viagem ao espaço, reino mágico, fundo do mar ou terra dos dinossauros!"
    };
    
    setMessages([initialMessage]);
    
    // Check if we've already detected API issues
    const hasApiIssue = localStorage.getItem("storybot_api_issue") === "true";
    setHasApiError(hasApiIssue);
    
    // Listen for API issues
    const handleApiIssue = () => {
      setHasApiError(true);
      localStorage.setItem("storybot_api_issue", "true");
    };
    
    window.addEventListener("storybot_api_issue", handleApiIssue);
    
    return () => {
      window.removeEventListener("storybot_api_issue", handleApiIssue);
    };
  }, []);

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
      let response;
      
      try {
        response = await generateStoryBotResponse(messages, inputValue);
      } catch (error) {
        console.error("StoryBot response generation failed:", error);
        throw error;
      }
      
      if (!response) {
        throw new Error("Resposta vazia do StoryBot");
      }
      
      const assistantMessage: Message = {
        role: "assistant",
        content: response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error generating response:", error);
      toast.error("Não foi possível gerar uma resposta. Tente novamente.", {
        description: "Estamos enfrentando dificuldades técnicas momentâneas.",
        duration: 5000,
      });
      
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8 shadow-xl mb-12 flex flex-col h-[700px]">
      {hasApiError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">
            Estamos com limitações técnicas no momento. As respostas podem ser simplificadas.
          </p>
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
            <span className="text-slate-500">StoryBot está pensando...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Textarea
          placeholder="Digite sua mensagem aqui..."
          value={inputValue}
          onChange={handleInputChange}
          className="w-full resize-none custom-scrollbar focus:border-storysnap-blue"
          rows={4}
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !inputValue.trim()}
          className="bg-storysnap-blue hover:bg-storysnap-blue/90 text-white self-end px-6"
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
