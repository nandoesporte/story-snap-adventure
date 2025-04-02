
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useStoryBot } from '@/hooks/useStoryBot';
import StoryPromptInput from '@/components/StoryPromptInput';
import StoryForm, { StoryFormData } from '@/components/StoryForm';

interface AISuggestions {
  theme?: string;
  setting?: string;
  moral?: string;
}

const CreateStory: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'prompt' | 'details'>('prompt');
  const [storyPrompt, setStoryPrompt] = useState('');
  const [apiKeyError, setApiKeyError] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [formData, setFormData] = useState<StoryFormData | null>(null);
  const [availablePrompts, setAvailablePrompts] = useState<Array<{id: string, name: string, description: string | null}>>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  
  const { generateStoryBotResponse, checkOpenAIAvailability, listAvailablePrompts, setPromptById } = useStoryBot();

  // Load available prompts for story generation
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        setLoadingPrompts(true);
        const prompts = await listAvailablePrompts();
        setAvailablePrompts(prompts);
      } catch (error) {
        console.error("Error loading prompts:", error);
        toast.error("Não foi possível carregar os prompts disponíveis.");
      } finally {
        setLoadingPrompts(false);
      }
    };

    loadPrompts();
  }, []);

  // Check if OpenAI API key is available
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const isValid = await checkOpenAIAvailability();
        setApiKeyError(!isValid);
      } catch (error) {
        console.error("Error checking API key:", error);
        setApiKeyError(true);
      }
    };

    checkApiKey();
  }, []);

  const handlePromptSubmit = async (prompt: string) => {
    setStoryPrompt(prompt);
    
    if (selectedPromptId) {
      await setPromptById(selectedPromptId);
    }
    
    try {
      setLoadingSuggestions(true);
      setStep('details');

      // Generate AI suggestions based on the prompt
      const messages = [
        { role: "user" as const, content: "I want to create a children's story." }
      ];

      const userPrompt = `
        Based on this story description: "${prompt}", 
        analyze and suggest the following in JSON format:
        {
          "theme": "a creative theme for the story",
          "setting": "an interesting setting where the story could take place",
          "moral": "a meaningful moral or lesson for the story"
        }
        
        Provide creative, thoughtful suggestions that would make an engaging children's story.
      `;

      const response = await generateStoryBotResponse(messages, userPrompt);
      
      try {
        // Try to parse the response as JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          setAiSuggestions(suggestions);
        } else {
          // If JSON parsing fails, use a regex-based approach to extract suggestions
          const themeMatch = response.match(/theme["\s:]*([^"\n,}]+)/i);
          const settingMatch = response.match(/setting["\s:]*([^"\n,}]+)/i);
          const moralMatch = response.match(/moral["\s:]*([^"\n,}]+)/i);
          
          const extractedSuggestions: AISuggestions = {};
          
          if (themeMatch && themeMatch[1]) extractedSuggestions.theme = themeMatch[1].trim();
          if (settingMatch && settingMatch[1]) extractedSuggestions.setting = settingMatch[1].trim();
          if (moralMatch && moralMatch[1]) extractedSuggestions.moral = moralMatch[1].trim();
          
          setAiSuggestions(extractedSuggestions);
        }
      } catch (error) {
        console.error("Error parsing AI suggestions:", error);
        toast.error("Não foi possível processar as sugestões da IA.");
      }

    } catch (error) {
      console.error("Error generating story suggestions:", error);
      toast.error("Erro ao gerar sugestões para a história.");
    } finally {
      setLoadingSuggestions(false);
    }
  };
  
  const handleFormSubmit = (data: StoryFormData) => {
    setFormData(data);
    // Here you would typically move to the next step in the story creation process
    // For now, we'll just show a success message
    toast.success("Dados do formulário enviados com sucesso!");
    console.log("Form data submitted:", data);
  };

  const renderStep = () => {
    switch (step) {
      case "prompt":
        return (
          <>
            {apiKeyError && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Atenção!</AlertTitle>
                <AlertDescription>
                  A chave da API OpenAI não está configurada ou é inválida. Configure-a nas configurações para poder gerar histórias.
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                      Ir para Configurações
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <StoryPromptInput 
              onSubmit={handlePromptSubmit}
              availablePrompts={availablePrompts}
              selectedPromptId={selectedPromptId}
              onPromptSelect={setSelectedPromptId}
              loadingPrompts={loadingPrompts}
            />
          </>
        );
        
      case "details":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">
              Personalize a história
            </h2>
            
            {apiKeyError && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Atenção!</AlertTitle>
                <AlertDescription>
                  A chave da API OpenAI não está configurada ou é inválida. Configure-a nas configurações para poder gerar histórias.
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                      Ir para Configurações
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {loadingSuggestions ? (
              <div className="flex justify-center items-center p-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent"></div>
                  <p className="text-violet-700">Analisando seu prompt e gerando sugestões...</p>
                </div>
              </div>
            ) : (
              <>
                {storyPrompt && (
                  <div className="mb-6 p-4 bg-violet-50 rounded-lg border border-violet-100">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-violet-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-violet-800 mb-1">Sua descrição</p>
                        <p className="text-sm text-violet-700">{storyPrompt}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {aiSuggestions && (
                  <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-teal-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-teal-800 mb-1">Sugestões da IA</p>
                        <p className="text-sm text-teal-700">
                          Com base na sua descrição, sugerimos:
                          {aiSuggestions.theme && (
                            <span className="block mt-1">
                              <strong>Tema:</strong> {aiSuggestions.theme}
                            </span>
                          )}
                          {aiSuggestions.setting && (
                            <span className="block">
                              <strong>Cenário:</strong> {aiSuggestions.setting}
                            </span>
                          )}
                          {aiSuggestions.moral && (
                            <span className="block">
                              <strong>Moral:</strong> {aiSuggestions.moral}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedPromptId && (
                  <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-indigo-800 mb-1">
                          Prompt selecionado: {availablePrompts.find(p => p.id === selectedPromptId)?.name}
                        </p>
                        <p className="text-sm text-indigo-700">
                          {availablePrompts.find(p => p.id === selectedPromptId)?.description || "Prompt personalizado para geração de histórias."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <StoryForm 
                  onSubmit={handleFormSubmit} 
                  initialData={formData} 
                  suggestions={aiSuggestions}
                />
              </>
            )}
            
            <div className="mt-8 flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("prompt")}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:shadow hover:bg-slate-50 transition-all"
              >
                Voltar
              </motion.button>
            </div>
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {renderStep()}
    </div>
  );
};

export default CreateStory;
