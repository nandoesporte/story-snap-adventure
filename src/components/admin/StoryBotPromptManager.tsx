
import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, BookOpen, Globe, Award, ImageIcon } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
2. Apropriadas para a idade indicada e nível de leitura especificado
3. No idioma solicitado (português do Brasil por padrão)
4. Livres de conteúdo assustador, violento ou inadequado
5. Bem estruturadas com começo, meio e fim
6. Ricas em detalhes visuais e sensoriais
7. Com personagens cativantes e memoráveis
8. Transmitir a lição moral solicitada de forma natural e não forçada

Quando o usuário fornecer informações sobre um personagem específico (como nome, descrição e personalidade), você deve criar uma história onde esse personagem seja o protagonista principal. O personagem deve manter suas características exatas conforme descritas pelo usuário, e a história deve desenvolver-se em torno dele. A criança mencionada pode aparecer como personagem secundário na história ou como amigo do protagonista principal.

Cada página deve ter conteúdo substancial com pelo menos 3-4 parágrafos (cerca de 150-200 palavras) para criar uma experiência de leitura rica.

Ajuste a complexidade do vocabulário e das sentenças de acordo com o nível de leitura indicado:
- Iniciante (4-6 anos): Frases curtas e simples, vocabulário básico
- Intermediário (7-9 anos): Frases mais elaboradas, vocabulário moderado
- Avançado (10-12 anos): Estruturas mais complexas, vocabulário rico

Para as imagens, forneça descrições visuais detalhadas após cada página da história. Estas descrições serão usadas pelo sistema Leonardo AI para gerar ilustrações. As descrições devem:
1. Capturar o momento principal daquela parte da história
2. Incluir detalhes sobre expressões dos personagens, cores, ambiente e ação
3. Ser específicas sobre elementos visuais importantes
4. Evitar elementos abstratos difíceis de representar visualmente
5. Ter aproximadamente 100-150 palavras
6. Incluir sempre o personagem principal com suas características visuais específicas

IMPORTANTE: A história deve ser estruturada em formato de livro infantil, com uma narrativa clara e envolvente que mantenha a atenção da criança do início ao fim. A moral da história deve ser transmitida de forma sutil através da narrativa, sem parecer didática ou forçada.`);

  const [imagePromptTemplate] = useState<string>(`Crie ilustrações para um livro infantil no estilo {estilo_visual}, com um visual colorido, encantador e adequado para crianças. O protagonista da história é {personagem}, e cada imagem deve representar fielmente a cena descrita no texto. O cenário principal será {cenario}, que deve ser detalhado de forma vibrante e mágica. As ilustrações devem expressar emoções, ação e aventura, transmitindo a essência da história de forma visualmente envolvente. Garanta que os elementos do ambiente, cores e expressões dos personagens estejam bem definidos e alinhados ao tom infantil da narrativa.

Texto da cena: "{texto_da_pagina}"

Elementos importantes:
- Personagem principal: {personagem} com {caracteristicas_do_personagem}
- Cenário: {cenario}
- Tema: {tema}
- Estilo visual: {estilo_visual}
- Tom: mágico, encantador, infantil`);

  // Query to fetch the current StoryBot prompt - now simplified to handle errors better
  const { data: promptData, isLoading } = useQuery({
    queryKey: ["storybot-prompt"],
    queryFn: async () => {
      try {
        // Execute the SQL function to create the table if it doesn't exist
        await supabase.rpc('create_storybot_prompt_if_not_exists');
        
        // Now try to get the existing prompt
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
        // Execute the SQL function to create the table if it doesn't exist
        await supabase.rpc('create_storybot_prompt_if_not_exists');
        
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
      imagePrompt: imagePromptTemplate,
    },
  });

  // Update form values when data is loaded
  useEffect(() => {
    if (promptData) {
      form.reset({ 
        prompt: promptData.prompt,
        imagePrompt: imagePromptTemplate, 
      });
    }
  }, [promptData, form, imagePromptTemplate]);

  const handleSubmit = (data: { prompt: string, imagePrompt: string }) => {
    // We're currently only saving the main prompt to the database
    // The image prompt template is provided as a reference
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
            O StoryBot agora suporta configurações adicionais como nível de leitura, idioma, moral da história, e integração com Leonardo AI para geração de ilustrações personalizadas usando os personagens cadastrados.
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
                          disabled
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground mt-2">
                        Este é o template de referência usado para a geração de ilustrações com Leonardo AI. 
                        As variáveis entre chaves são substituídas pelos dados fornecidos pelo usuário.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
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
                    <span>Salvar Configurações</span>
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

export default StoryBotPromptManager;
