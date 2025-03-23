
-- Adiciona a coluna generation_prompt à tabela characters se ela não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'characters' 
    AND column_name = 'generation_prompt'
  ) THEN
    ALTER TABLE characters
    ADD COLUMN generation_prompt TEXT;
  END IF;
END $$;

-- Atualiza os personagens existentes com prompts de geração genéricos
UPDATE characters
SET generation_prompt = 'Personagem ' || name || ': ' || description
WHERE generation_prompt IS NULL;
