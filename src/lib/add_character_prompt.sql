
-- Add character_prompt column to stories table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'stories' 
        AND column_name = 'character_prompt'
    ) THEN
        ALTER TABLE stories ADD COLUMN character_prompt TEXT;
    END IF;
END $$;
