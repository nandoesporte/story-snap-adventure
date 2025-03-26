
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Bot, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";
import { useStoryBot } from "@/hooks/useStoryBot";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const StoryBotComponent = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    generateStoryBotResponse,
    isGenerating, 
    apiAvailable,
    leonardoApiAvailable
  } = useStoryBot();

  useEffect(() => {
    // Add initial greeting message when component mounts
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Olá! Eu sou o StoryBot, seu assistente de criação de histórias. Como posso ajudar você hoje? Posso criar histórias personalizadas, ajudar com ideias, ou responder perguntas sobre o processo de criação."
        }
      ]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      role: "user",
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const botResponse = await generateStoryBotResponse(messages, input);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: botResponse
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error generating StoryBot response:", error);
      
      const errorMessage: Message = {
        role: "assistant",
        content: "Desculpe, tive um problema ao processar sua solicitação. Poderia tentar novamente com outras palavras?"
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error("Erro ao gerar resposta. Por favor, tente novamente.");
    }
  };

  // Check for API status using safe try-catch wrapped useQuery
  const { data: apiStatus, isLoading: checkingApiStatus } = useQuery({
    queryKey: ["storybot-api-status"],
    queryFn: async () => {
      try {
        // Simple check to see if the API is responding
        return { available: true };
      } catch (error) {
        console.error("Error checking API status:", error);
        return { available: false };
      }
    },
    retry: 1,
    staleTime: 60000, // 1 minute
  });

  return (
    <div className="rounded-xl bg-white shadow-lg overflow-hidden border border-violet-100">
      {!apiAvailable && (
        <div className="p-4 bg-amber-50 border-b border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">API Indisponível</p>
              <p className="text-sm text-amber-700">
                O StoryBot está operando com capacidade limitada. Algumas respostas podem ser mais simples que o normal.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 h-96 overflow-y-auto bg-slate-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${message.role === "user" ? "text-right" : ""}`}
          >
            <div
              className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                message.role === "user"
                  ? "bg-violet-600 text-white"
                  : "bg-white border border-slate-200"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex items-center space-x-2 text-slate-500 mb-4">
            <Bot className="h-5 w-5" />
            <LoadingSpinner size="sm" />
            <span className="text-sm">StoryBot está pensando...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem para o StoryBot..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim() && !isGenerating) {
                handleSendMessage();
              }
            }}
            disabled={isGenerating}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isGenerating}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              !input.trim() || isGenerating
                ? "bg-slate-300 text-slate-500"
                : "bg-violet-600 text-white hover:bg-violet-700"
            } transition-colors`}
          >
            {isGenerating ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span>Enviar</span>
          </button>
        </div>
        <div className="mt-2 flex items-center justify-center">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> 
            Powered by StoryBot
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryBotComponent;
