import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useStoryBot } from '@/hooks/useStoryBot';
import StoryPromptInput from '@/components/StoryPromptInput';
import StoryForm from '@/components/StoryForm';
import { useStoryGeneration } from '@/hooks/useStoryGeneration';
import { useStoryCreation } from '@/hooks/useStoryCreation';
import StoryGenerationProgress from '@/components/StoryGenerationProgress';

interface AISuggestions {
  theme?: string;
  setting?: string;
  moral?: string;
}

interface StoryResult {
  id: string;
  title: string;
  coverImageUrl: string;
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  characterPrompt: string;
  pages: Array<{
    text: string;
    imageUrl: string;
  }>;
  voiceType: 'male' | 'female';
}

const CreateStory: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'prompt' | 'details' | 'generating'>('prompt');
  const [storyPrompt, setStoryPrompt] = useState('');
  const [apiKeyError, setApiKeyError] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [formData, setFormData] = useState<any | null>(null);
  const [generationCanceled, setGenerationCanceled] = useState(false);
  
  const { 
    generateStoryBotResponse, 
    checkOpenAIAvailability,
    loadPromptByName 
  } = useStoryBot();

  const {
    generateCompleteStory,
    isGenerating,
    progress,
    currentStage,
    currentImageIndex,
    totalImages,
    generatingNarration,
    currentNarrationIndex,
  } = useStoryGeneration();

  const { saveStory, isSaving } = useStoryCreation();

  useEffect(() => {
    const loadDefaultPrompt = async () => {
      try {
        await loadPromptByName('Prompt Padrão');
      } catch (error) {
        console.error("Error loading default prompt:", error);
        toast.error("Não foi possível carregar o prompt padrão.");
      }
    };

    loadDefaultPrompt();
  }, [loadPromptByName]);

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
  }, [checkOpenAIAvailability]);

  const handlePromptSubmit = async (prompt: string) => {
    setStoryPrompt(prompt);
    
    try {
      setLoadingSuggestions(true);
      setStep('details');

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
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          setAiSuggestions(suggestions);
        } else {
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
  
  const handleFormSubmit = async (data: any) => {
    setFormData(data);
    setStep('generating');
    setGenerationCanceled(false);

    try {
      const storyResult = await generateCompleteStory(
        data.childName,
        data.childAge,
        data.theme,
        data.setting,
        data.moral,
        "", // No character prompt for now
        data.length,
        data.readingLevel,
        data.language,
        null, // No child image
        data.style,
        data.voiceType
      );
      
      if (generationCanceled) {
        return;
      }
      
      if (storyResult) {
        console.log("Story generation completed successfully:", storyResult);
        
        sessionStorage.setItem("storyData", JSON.stringify(storyResult));
        
        try {
          const storyId = await saveStory({
            title: storyResult.title,
            childName: storyResult.childName,
            childAge: storyResult.childAge || "",
            theme: storyResult.theme,
            setting: storyResult.setting,
            coverImageUrl: storyResult.coverImageUrl,
            pages: storyResult.pages,
            voiceType: storyResult.voiceType || 'female'
          });
          
          toast.success("História gerada e salva com sucesso!");
          
          if (storyId) {
            navigate(`/view-story/${storyId}`);
          } else {
            navigate("/view-story");
          }
        } catch (saveError) {
          console.error("Error saving story:", saveError);
          toast.error("A história foi gerada mas não pôde ser salva no banco de dados. Você ainda pode visualizá-la.");
          navigate("/view-story");
        }
      } else {
        throw new Error("Falha ao gerar história");
      }
    } catch (error) {
      console.error("Error generating story:", error);
      if (!generationCanceled) {
        toast.error("Erro ao gerar a história. Por favor, tente novamente.");
        setStep('details');
      }
    }
  };
  
  const handleCancelGeneration = () => {
    setGenerationCanceled(true);
    setStep('details');
    toast.info("Geração de história cancelada.");
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

      case "generating":
        return (
          <StoryGenerationProgress
            progress={progress}
            currentStage={currentStage}
            imageProgress={totalImages > 0 ? { current: currentImageIndex, total: totalImages } : undefined}
            narrationProgress={generatingNarration ? { current: currentNarrationIndex, total: totalImages } : undefined}
            onCancel={handleCancelGeneration}
          />
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
