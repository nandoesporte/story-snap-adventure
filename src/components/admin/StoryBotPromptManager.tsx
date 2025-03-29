
import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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

interface StoryBotPrompt {
  id: string;
  prompt: string;
  created_at?: string;
  updated_at?: string;
}

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

  const [imagePromptTemplate] = useState<string>(`Crie uma ilustração para um livro infantil no estilo papercraft, com elementos que parecem recortados e colados, texturas de papel sobrepostas, e efeito tridimensional como um livro pop-up. A ilustração deve apresentar:

1. O personagem principal {personagem} que DEVE manter EXATAMENTE as mesmas características visuais em todas as ilustrações: {caracteristicas_do_personagem}. Mantenha a mesma aparência, expressões, cores, roupas e proporções em todas as imagens para garantir consistência absoluta.

2. Cenário rico em detalhes no estilo papercraft com camadas sobrepostas de papel, representando {cenario} com elementos tridimensionais recortados, dobrados e superpostos.

3. Cores vibrantes e saturadas, com textura visual de papel e bordas ligeiramente elevadas criando sombras sutis.

4. Múltiplos elementos da história como {elementos_da_cena} todos no mesmo estilo de recorte de papel.

5. Composição central focando o personagem principal em ação, com expressão facial bem definida mostrando {emocao}.

6. Iluminação que realça a tridimensionalidade dos elementos de papel, com sombras suaves entre as camadas.

7. Detalhes adicionais como pequenas flores, plantas, animais ou objetos feitos em papercraft distribuídos pela cena para enriquecer a ilustração.

8. Elementos secundários da história como {elementos_secundarios} também em estilo papercraft para enriquecer a narrativa visual.

9. Uma paleta de cores consistente ao longo de todas as ilustrações do livro, mantendo a identidade visual da história.

10. Detalhes de textura de papel em todos os elementos, com pequenas dobras, recortes e sobreposições que dão profundidade realista ao estilo papercraft.

Texto da cena: "{texto_da_pagina}"

IMPORTANTE: A ilustração deve capturar fielmente a cena descrita, com todos os elementos importantes da narrativa visíveis e apresentados no estilo distintivo de papercraft com camadas de papel recortado, mantendo consistência absoluta na aparência do personagem principal ao longo de toda a história.`);

  const { data: promptData, isLoading, refetch } = useQuery({
    queryKey: ["storybot-prompt"],
    queryFn: async () => {
      try {
        await supabase.rpc('create_storybot_prompt_if_not_exists');
        const { data, error } = await supabase
          .from("storybot_prompts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          console.log("Using default prompt due to error:", error.message);
          return {
            id: 'new',
            prompt: defaultPrompt
          };
        }
        
        return data as StoryBotPrompt;
      } catch (err) {
        console.error("Error fetching StoryBot prompt:", err);
        return {
          id: 'new',
          prompt: defaultPrompt
        };
      }
    }
  });

  const updatePromptMutation = useMutation({
    mutationFn: async (prompt: string) => {
      setIsSubmitting(true);
      
      try {
        await supabase.rpc('create_storybot_prompt_if_not_exists');
        
        const { error: checkError } = await supabase
          .from("storybot_prompts")
          .select("count")
          .limit(1);
          
        if (checkError) {
          console.log("Saving prompt to localStorage due to database error:", checkError.message);
          localStorage.setItem('storybot_prompt', prompt);
          return { id: 'local', prompt };
        }
        
        const { data: existingPrompt, error: fetchError } = await supabase
          .from("storybot_prompts")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
          
        let result;
        
        if (fetchError && fetchError.code === 'PGRST116') {
          result = await supabase
            .from("storybot_prompts")
            .insert({ prompt })
            .select()
            .single();
        } else if (existingPrompt) {
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
      prompt: promptData?.prompt || defaultPrompt,
      imagePrompt: imagePromptTemplate,
    },
  });

  useEffect(() => {
    if (promptData) {
      form.reset({ 
        prompt: promptData.prompt,
        imagePrompt: localStorage.getItem('image_prompt_template') || imagePromptTemplate, 
      });
    }
  }, [promptData, form, imagePromptTemplate]);

  const handleSubmit = (data: PromptFormValues) => {
    localStorage.setItem('image_prompt_template', data.imagePrompt);
    updatePromptMutation.mutate(data.prompt);
  };
  
  const handleEnableEditing = () => {
    setIsEditing(true);
  };
  
  const handleCancelEditing = () => {
    form.reset({ 
      prompt: promptData?.prompt || defaultPrompt,
      imagePrompt: localStorage.getItem('image_prompt_template') || imagePromptTemplate, 
    });
    setIsEditing(false);
  };
  
  const handleResetToDefault = () => {
    const confirmReset = window.confirm("Tem certeza que deseja restaurar os prompts para os valores padrão? Esta ação não pode ser desfeita.");
    if (confirmReset) {
      form.reset({ 
        prompt: defaultPrompt,
        imagePrompt: imagePromptTemplate, 
      });
      
      if (isEditing) {
        // Se estiver editando, não salva automaticamente
        toast({
          title: "Prompts restaurados",
          description: "Os prompts foram restaurados para os valores padrão. Clique em Salvar para aplicar as alterações.",
        });
      } else {
        // Se não estiver editando, salva automaticamente
        localStorage.setItem('image_prompt_template', imagePromptTemplate);
        updatePromptMutation.mutate(defaultPrompt);
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
