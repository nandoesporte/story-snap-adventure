
import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, BookOpen, Globe, Award, ImageIcon, Save, RefreshCw } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  StoryBotPrompt, 
  getStoryBotPrompt, 
  saveStoryBotPrompt, 
  getDefaultPrompt, 
  getDefaultImagePromptTemplate 
} from "@/lib/storybot";

const promptFormSchema = z.object({
  prompt: z.string().min(10, "O prompt deve ter pelo menos 10 caracteres"),
  imagePrompt: z.string().min(10, "O template de imagem deve ter pelo menos 10 caracteres"),
});

type PromptFormValues = z.infer<typeof promptFormSchema>;

export const StoryBotPromptManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: promptData, isLoading, refetch } = useQuery({
    queryKey: ["storybot-prompt"],
    queryFn: async () => {
      try {
        // Get the prompt from the database
        const prompt = await getStoryBotPrompt();
        
        if (!prompt) {
          console.log("Using default prompt");
          return {
            id: 'new',
            prompt: getDefaultPrompt()
          };
        }
        
        return prompt;
      } catch (err) {
        console.error("Error fetching StoryBot prompt:", err);
        return {
          id: 'new',
          prompt: getDefaultPrompt()
        };
      }
    }
  });

  const updatePromptMutation = useMutation({
    mutationFn: async (promptText: string) => {
      setIsSubmitting(true);
      
      try {
        // Try to save to Supabase
        const result = await saveStoryBotPrompt(promptText);
        
        // If there was an error saving to Supabase, save locally
        if (!result) {
          console.log("Saving prompt to localStorage");
          localStorage.setItem('storybot_prompt', promptText);
          return { id: 'local', prompt: promptText };
        }
        
        return result;
      } finally {
        setIsSubmitting(false);
        setIsEditing(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["storybot-prompt"] });
      toast({
        title: "Prompt atualizado com sucesso",
        description: data.id === 'local' 
          ? "O prompt foi salvo localmente devido a um erro no banco de dados."
          : "O prompt do StoryBot foi atualizado.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar prompt",
        description: error.message || "Ocorreu um erro ao atualizar o prompt do StoryBot.",
        variant: "destructive",
      });
    }
  });

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      prompt: promptData?.prompt || getDefaultPrompt(),
      imagePrompt: getDefaultImagePromptTemplate(),
    },
  });

  useEffect(() => {
    if (promptData) {
      form.reset({ 
        prompt: promptData.prompt,
        imagePrompt: localStorage.getItem('image_prompt_template') || getDefaultImagePromptTemplate(), 
      });
    }
  }, [promptData, form]);

  const handleSubmit = (data: PromptFormValues) => {
    localStorage.setItem('image_prompt_template', data.imagePrompt);
    updatePromptMutation.mutate(data.prompt);
  };
  
  const handleEnableEditing = () => {
    setIsEditing(true);
  };
  
  const handleCancelEditing = () => {
    form.reset({ 
      prompt: promptData?.prompt || getDefaultPrompt(),
      imagePrompt: localStorage.getItem('image_prompt_template') || getDefaultImagePromptTemplate(), 
    });
    setIsEditing(false);
  };
  
  const handleResetToDefault = () => {
    const confirmReset = window.confirm("Tem certeza que deseja restaurar os prompts para os valores padrão? Esta ação não pode ser desfeita.");
    if (confirmReset) {
      form.reset({ 
        prompt: getDefaultPrompt(),
        imagePrompt: getDefaultImagePromptTemplate(), 
      });
      
      if (isEditing) {
        // Se estiver editando, não salva automaticamente
        toast({
          title: "Prompts restaurados",
          description: "Os prompts foram restaurados para os valores padrão. Clique em Salvar para aplicar as alterações.",
        });
      } else {
        // Se não estiver editando, salva automaticamente
        localStorage.setItem('image_prompt_template', getDefaultImagePromptTemplate());
        updatePromptMutation.mutate(getDefaultPrompt());
        toast({
          title: "Prompts restaurados",
          description: "Os prompts foram restaurados para os valores padrão e salvos.",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
        <span className="ml-2">Carregando prompt...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-storysnap-blue" />
          Configuração do StoryBot
        </CardTitle>
        <CardDescription>
          Defina o prompt principal que orienta o comportamento do StoryBot ao gerar histórias infantis e suas ilustrações.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 bg-violet-50 border-violet-200">
          <div className="flex gap-2">
            <BookOpen className="h-4 w-4 text-violet-500" />
            <Globe className="h-4 w-4 text-violet-500" />
            <Award className="h-4 w-4 text-violet-500" />
            <ImageIcon className="h-4 w-4 text-violet-500" />
          </div>
          <AlertTitle>Novos recursos disponíveis</AlertTitle>
          <AlertDescription>
            O StoryBot agora suporta configurações adicionais como nível de leitura, idioma, moral da história, e integração com Leonardo AI para geração de ilustrações personalizadas usando os personagens cadastrados no estilo papercraft.
          </AlertDescription>
        </Alert>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Tabs defaultValue="story">
              <TabsList className="mb-4">
                <TabsTrigger value="story">Prompt de História</TabsTrigger>
                <TabsTrigger value="image">Template de Imagem</TabsTrigger>
              </TabsList>
              
              <TabsContent value="story">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt do StoryBot para Histórias</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Insira o prompt de sistema para o StoryBot..."
                          className="min-h-[400px] font-mono text-sm"
                          {...field}
                          disabled={!isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="image">
                <FormField
                  control={form.control}
                  name="imagePrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template para Geração de Ilustrações (Leonardo AI)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Insira o template para geração de ilustrações..."
                          className="min-h-[400px] font-mono text-sm"
                          {...field}
                          disabled={!isEditing}
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground mt-2">
                        Este template será usado para a geração de ilustrações com Leonardo AI. 
                        As variáveis entre chaves {'{exemplo}'} são substituídas pelos dados da história.
                        O estilo papercraft garante consistência visual entre as ilustrações.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Exemplo de ilustração no estilo papercraft</h4>
                  <div className="rounded-md overflow-hidden border">
                    <img 
                      src="/lovable-uploads/4d1a379f-0b24-48da-9f0f-e66feccc4e59.png" 
                      alt="Exemplo de ilustração papercraft" 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Referência visual para o estilo papercraft com elementos 3D em camadas de papel
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-between">
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button 
                    type="button" 
                    onClick={handleEnableEditing}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    <span>Editar Prompts</span>
                  </Button>
                ) : (
                  <>
                    <Button 
                      type="button" 
                      onClick={handleCancelEditing}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Cancelar</span>
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleResetToDefault}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Restaurar Padrão</span>
                    </Button>
                  </>
                )}
              </div>
              
              {isEditing && (
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !form.formState.isDirty}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Salvar</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
