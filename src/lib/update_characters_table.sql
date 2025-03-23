
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

-- Atualiza os personagens existentes com prompts de geração detalhados para melhor consistência visual
UPDATE characters
SET generation_prompt = CASE
  WHEN name = 'Lua' THEN 'Uma menina de 8 anos com cabelos longos e pretos, olhos grandes e expressivos, pele clara, roupas coloridas com detalhes de estrelas e luas. Personalidade curiosa e aventureira.'
  WHEN name = 'Leo' THEN 'Um menino de 7 anos com cabelos castanhos curtos e desarrumados, sardas no rosto, olhos verdes, camiseta azul com desenho de foguete, shorts verde. Personalidade corajosa e determinada.'
  WHEN name = 'Nina' THEN 'Uma menina de 6 anos com cabelos cacheados ruivos, olhos castanhos, vestido florido em tons pastel, sapatos rosa. Personalidade criativa e sonhadora.'
  WHEN name = 'Max' THEN 'Um menino de 9 anos com cabelos loiros, olhos azuis, camiseta vermelha com desenho de dinossauro, calça jeans. Alto para sua idade. Personalidade curiosa e inteligente.'
  WHEN name = 'Bia' THEN 'Uma menina de 5 anos com cabelos pretos em tranças, olhos castanhos, pele morena, vestido amarelo com desenhos de flores, tênis coloridos. Personalidade alegre e brincalhona.'
  ELSE 'Personagem ' || name || ': ' || description
END
WHERE generation_prompt IS NULL OR generation_prompt = 'Personagem ' || name || ': ' || description;
