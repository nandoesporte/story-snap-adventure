
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
        
        -- Add a comment to the column
        COMMENT ON COLUMN stories.character_prompt IS 'Prompt used to generate the character in the story';
    END IF;
END $$;

-- Grant permissions on the stories table to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON stories TO authenticated;

-- Create function to check if a column exists in a table
CREATE OR REPLACE FUNCTION public.check_column_exists(table_name text, column_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    column_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = check_column_exists.table_name
        AND column_name = check_column_exists.column_name
    ) INTO column_exists;
    
    RETURN column_exists;
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.check_column_exists TO authenticated;
