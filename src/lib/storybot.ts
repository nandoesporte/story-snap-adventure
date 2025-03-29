
import { supabase } from "./supabase";

export interface StoryBotPrompt {
  id: string;
  prompt: string;
  created_at?: string;
  updated_at?: string;
}

export const getStoryBotPrompt = async (): Promise<StoryBotPrompt | null> => {
  try {
    // First ensure the table exists
    await supabase.rpc('create_storybot_prompt_if_not_exists');
    
    // Get the latest prompt
    const { data, error } = await supabase
      .from('storybot_prompts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching StoryBot prompt:", error);
      return null;
    }
    
    return data as StoryBotPrompt;
  } catch (error) {
    console.error("Unexpected error in getStoryBotPrompt:", error);
    return null;
  }
};

export const saveStoryBotPrompt = async (prompt: string): Promise<StoryBotPrompt | null> => {
  try {
    // First ensure the table exists
    await supabase.rpc('create_storybot_prompt_if_not_exists');
    
    // Check if there's an existing prompt
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('storybot_prompts')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    let result;
    
    if (!existingPrompt) {
      // Insert new prompt
      result = await supabase
        .from('storybot_prompts')
        .insert({ prompt })
        .select()
        .single();
    } else {
      // Update existing prompt
      result = await supabase
        .from('storybot_prompts')
        .update({ 
          prompt,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingPrompt.id)
        .select()
        .single();
    }
    
    if (result.error) {
      console.error("Error saving StoryBot prompt:", result.error);
      return null;
    }
    
    return result.data as StoryBotPrompt;
  } catch (error) {
    console.error("Unexpected error in saveStoryBotPrompt:", error);
    return null;
  }
};

export const getDefaultPrompt = (): string => {
  return `Você é um assistente de criação de histórias infantis chamado StoryBot. Você deve criar histórias interessantes, educativas e apropriadas para crianças, baseadas nas informações fornecidas pelo usuário.

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

IMPORTANTE: A história deve ser estruturada em formato de livro infantil, com uma narrativa clara e envolvente que mantenha a atenção da criança do início ao fim. A moral da história deve ser transmitida de forma sutil através da narrativa, sem parecer didática ou forçada.`;
};

export const getDefaultImagePromptTemplate = (): string => {
  return `Crie uma ilustração para um livro infantil no estilo papercraft, com elementos que parecem recortados e colados, texturas de papel sobrepostas, e efeito tridimensional como um livro pop-up. A ilustração deve apresentar:

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

IMPORTANTE: A ilustração deve capturar fielmente a cena descrita, com todos os elementos importantes da narrativa visíveis e apresentados no estilo distintivo de papercraft com camadas de papel recortado, mantendo consistência absoluta na aparência do personagem principal ao longo de toda a história.`;
};
