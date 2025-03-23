
import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface StoryBotPrompt {
  id: string;
  prompt: string;
  created_at?: string;
  updated_at?: string;
}

export const StoryBotPromptManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultPrompt] = useState<string>(`Você é um assistente de criação de histórias infantis chamado StoryBot. Você deve criar histórias interessantes, educativas e apropriadas para crianças, baseadas nas informações fornecidas pelo usuário.

Suas respostas devem ser:
1. Criativas e envolventes
2. Apropriadas para a idade indicada
3. Em português do Brasil
4. Livres de conteúdo assustador, violento ou inadequado
5. Bem estruturadas com começo, meio e fim
6. Ricas em detalhes visuais e sensoriais
7. Com personagens cativantes e memoráveis

Quando o usuário fornecer o nome e idade da criança, tema e cenário, você deve criar uma história com um personagem principal daquele nome e incorporar os elementos solicitados. Cada página deve ter conteúdo substancial com pelo menos 3-4 parágrafos (cerca de 150-200 palavras) para criar uma experiência de leitura rica.

IMPORTANTE: A história deve ser estruturada em formato de livro infantil, com uma narrativa clara e envolvente que mantenha a atenção da criança do início ao fim.`);

  // Query to fetch the current StoryBot prompt - now simplified to handle errors better
  const { data: promptData, isLoading } = useQuery({
    queryKey: ["storybot-prompt"],
    queryFn: async () => {
      try {
        // Skip trying to create the table since it's causing permission errors
        // Just try to get the existing prompt
        const { data, error } = await supabase
          .from("storybot_prompts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error) {
          // If table doesn't exist or any other error, use default prompt
          console.log("Using default prompt due to error:", error.message);
          return {
            id: 'new',
            prompt: defaultPrompt
          };
        }
        
        return data as StoryBotPrompt;
      } catch (err) {
        console.error("Error fetching StoryBot prompt:", err);
        // Use default prompt on any error
        return {
          id: 'new',
          prompt: defaultPrompt
        };
      }
    }
  });

  // Mutation to update or create the StoryBot prompt - now with better error handling
  const updatePromptMutation = useMutation({
    mutationFn: async (prompt: string) => {
      setIsSubmitting(true);
      
      try {
        // First check if the table exists by trying to select from it
        const { error: checkError } = await supabase
          .from("storybot_prompts")
          .select("count")
          .limit(1);
          
        // If the table doesn't exist, we'll save the prompt to localStorage as a fallback
        if (checkError) {
          console.log("Saving prompt to localStorage due to database error:", checkError.message);
          localStorage.setItem('storybot_prompt', prompt);
          return { id: 'local', prompt };
        }
        
        // Table exists, proceed with saving to database
        const { data: existingPrompt, error: fetchError } = await supabase
          .from("storybot_prompts")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
          
        let result;
        
        if (fetchError && fetchError.code === 'PGRST116') {
          // No prompt exists, create a new one
          result = await supabase
            .from("storybot_prompts")
            .insert({ prompt })
            .select()
            .single();
        } else if (existingPrompt) {
          // Update the existing prompt
          result = await supabase
            .from("storybot_prompts")
            .update({ 
              prompt,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingPrompt.id)
            .select()
            .single();
        } else {
          // Fallback case - create new prompt
          result = await supabase
            .from("storybot_prompts")
            .insert({ prompt })
            .select()
            .single();
        }
        
        if (result.error) {
          console.log("Saving prompt to localStorage due to update error:", result.error.message);
          localStorage.setItem('storybot_prompt', prompt);
          return { id: 'local', prompt };
        }
        
        return result.data;
      } finally {
        setIsSubmitting(false);
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

  // Form setup
  const form = useForm({
    defaultValues: {
      prompt: promptData?.prompt || defaultPrompt,
    },
  });

  // Update form values when data is loaded
  useEffect(() => {
    if (promptData) {
      form.reset({ prompt: promptData.prompt });
    }
  }, [promptData, form]);

  const handleSubmit = (data: { prompt: string }) => {
    updatePromptMutation.mutate(data.prompt);
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
          Defina o prompt principal que orienta o comportamento do StoryBot ao gerar histórias infantis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt do StoryBot</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Insira o prompt de sistema para o StoryBot..."
                      className="min-h-[300px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Salvar Prompt</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

