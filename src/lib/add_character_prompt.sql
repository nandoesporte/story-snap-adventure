
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

-- Use the renamed parameter names in the function
CREATE OR REPLACE FUNCTION public.check_column_exists(p_table_name text, p_column_name text)
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
        WHERE table_name = p_table_name
        AND column_name = p_column_name
    ) INTO column_exists;
    
    RETURN column_exists;
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.check_column_exists TO authenticated;

-- Fix user_profiles table name and its policy if it's causing recursion
DO $$
BEGIN
    -- Check if the table user_profiless (with double 's') exists, which is incorrect
    IF EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE tablename = 'user_profiless'
    ) THEN
        -- Rename the table to the correct name
        ALTER TABLE user_profiless RENAME TO user_profiles;
    END IF;
END $$;

-- Fix any policies that might be causing recursion
DO $$
BEGIN
    -- Drop problematic policies if they exist
    DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
    
    -- Create the correct policy
    CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);
END $$;
