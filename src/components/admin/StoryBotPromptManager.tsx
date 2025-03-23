
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

  // Query to fetch the current StoryBot prompt
  const { data: promptData, isLoading } = useQuery({
    queryKey: ["storybot-prompt"],
    queryFn: async () => {
      try {
        // First make sure the table exists
        try {
          const { error: functionError } = await supabase.rpc('create_storybot_prompt_if_not_exists');
          if (functionError && !functionError.message.includes('already exists')) {
            console.warn("Error creating storybot_prompts table:", functionError);
          }
        } catch (err) {
          console.warn("Error calling create_storybot_prompt_if_not_exists:", err);
        }

        // Then get the prompt
        const { data, error } = await supabase
          .from("storybot_prompts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No prompt exists yet, create a default one
            return {
              id: 'new',
              prompt: `Você é um assistente de criação de histórias infantis chamado StoryBot. Você deve criar histórias interessantes, educativas e apropriadas para crianças, baseadas nas informações fornecidas pelo usuário.

Suas respostas devem ser:
1. Criativas e envolventes
2. Apropriadas para a idade indicada
3. Em português do Brasil
4. Livres de conteúdo assustador, violento ou inadequado
5. Bem estruturadas com começo, meio e fim

Quando o usuário fornecer o nome e idade da criança, tema e cenário, você deve criar uma história com um personagem principal daquele nome e incorporar os elementos solicitados.`
            };
          }
          throw error;
        }
        
        return data as StoryBotPrompt;
      } catch (err) {
        console.error("Error fetching StoryBot prompt:", err);
        toast({
          title: "Erro ao carregar prompt",
          description: "Não foi possível carregar o prompt do StoryBot.",
          variant: "destructive",
        });
        return null;
      }
    }
  });

  // Mutation to update or create the StoryBot prompt
  const updatePromptMutation = useMutation({
    mutationFn: async (prompt: string) => {
      setIsSubmitting(true);
      
      try {
        // Try to get the current prompt
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
        } else {
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
        }
        
        if (result.error) throw result.error;
        return result.data;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storybot-prompt"] });
      toast({
        title: "Prompt atualizado com sucesso",
        description: "O prompt do StoryBot foi atualizado.",
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
      prompt: promptData?.prompt || "",
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
