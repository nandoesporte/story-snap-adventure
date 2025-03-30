
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Bot } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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

  const suggestions = [
    "Uma aventura sobre dinossauros para um menino de 6 anos que ama explorar",
    "Uma história sobre uma astronauta corajosa para uma menina de 8 anos",
    "Um conto sobre amizade entre um dragão e uma princesa",
    "Uma história sobre um super-herói com poderes de controlar plantas",
    "Uma aventura submarina com sereias e criaturas mágicas"
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
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full hover:bg-violet-200 transition-colors"
              >
                {suggestion.length > 40 ? suggestion.substring(0, 40) + "..." : suggestion}
              </button>
            ))}
          </div>
        </div>
        
        <div className="pt-4">
          <Button 
            type="submit"
            disabled={!prompt.trim() || isSubmitting}
            className="w-full py-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>Processando...</>
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
