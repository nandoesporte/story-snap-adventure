
-- Create the storybot_prompts table if it doesn't exist
CREATE OR REPLACE FUNCTION create_storybot_prompt_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'storybot_prompts'
  ) THEN
    -- Check if uuid-ossp extension exists
    IF NOT EXISTS (
      SELECT FROM pg_extension WHERE extname = 'uuid-ossp'
    ) THEN
      -- Create uuid-ossp extension if it doesn't exist
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
    
    -- Create the table
    CREATE TABLE public.storybot_prompts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      prompt TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      voice_narration_settings JSONB DEFAULT '{"enabled": true, "defaultVoice": "female", "femaleVoiceId": "pFZP5JQG7iQjIQuC4Bku", "maleVoiceId": "onwK4e9ZLuTAKqWW03F9", "model": "eleven_multilingual_v2", "language": "pt-BR"}'::jsonb
    );

    -- Add comment to the table
    COMMENT ON TABLE public.storybot_prompts IS 'Stores system prompts for the StoryBot';
    
    -- Create a default prompt
    INSERT INTO public.storybot_prompts (prompt) VALUES (
      'Você é um assistente de criação de histórias infantis chamado StoryBot. Você deve criar histórias interessantes, educativas e apropriadas para crianças, baseadas nas informações fornecidas pelo usuário.

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

IMPORTANTE: A história deve ser estruturada em formato de livro infantil, com uma narrativa clara e envolvente que mantenha a atenção da criança do início ao fim. A moral da história deve ser transmitida de forma sutil através da narrativa, sem parecer didática ou forçada.'
    );
  ELSE
    -- Check if voice_narration_settings column exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'storybot_prompts'
      AND column_name = 'voice_narration_settings'
    ) THEN
      -- Add the column if it doesn't exist
      ALTER TABLE public.storybot_prompts 
      ADD COLUMN voice_narration_settings JSONB DEFAULT '{"enabled": true, "defaultVoice": "female", "femaleVoiceId": "pFZP5JQG7iQjIQuC4Bku", "maleVoiceId": "onwK4e9ZLuTAKqWW03F9", "model": "eleven_multilingual_v2", "language": "pt-BR"}'::jsonb;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;
