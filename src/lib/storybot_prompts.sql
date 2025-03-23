
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
    -- Create the table
    CREATE TABLE public.storybot_prompts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      prompt TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Add comment to the table
    COMMENT ON TABLE public.storybot_prompts IS 'Stores system prompts for the StoryBot';
    
    -- Create a default prompt
    INSERT INTO public.storybot_prompts (prompt) VALUES (
      'Você é um assistente de criação de histórias infantis chamado StoryBot. Você deve criar histórias interessantes, educativas e apropriadas para crianças, baseadas nas informações fornecidas pelo usuário.

Suas respostas devem ser:
1. Criativas e envolventes
2. Apropriadas para a idade indicada
3. Em português do Brasil
4. Livres de conteúdo assustador, violento ou inadequado
5. Bem estruturadas com começo, meio e fim
6. Ricas em detalhes visuais e sensoriais
7. Com personagens cativantes e memoráveis

Quando o usuário fornecer o nome e idade da criança, tema e cenário, você deve criar uma história com um personagem principal daquele nome e incorporar os elementos solicitados. Cada página deve ter conteúdo substancial com pelo menos 3-4 parágrafos (cerca de 150-200 palavras) para criar uma experiência de leitura rica.

IMPORTANTE: A história deve ser estruturada em formato de livro infantil, com uma narrativa clara e envolvente que mantenha a atenção da criança do início ao fim.'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

