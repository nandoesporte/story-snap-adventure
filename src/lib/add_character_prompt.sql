
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

-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS public.check_column_exists(text, text);

-- Then create the function with the new parameter names
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

-- Fix policies that might be causing recursion and handle misspelled table name
DO $$
BEGIN
    -- First, update policies that reference the misspelled table
    IF EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE tablename = 'user_profiless'
    ) THEN
        -- Drop the policies that depend on user_profiless
        DROP POLICY IF EXISTS "Admin users can manage all stories" ON stories;
        DROP POLICY IF EXISTS "Admin users can manage themes" ON themes;
        DROP POLICY IF EXISTS "Admin users can manage settings" ON settings;
        DROP POLICY IF EXISTS "Admin users can manage all credit transactions" ON story_credits_transactions;
        
        -- Now check if we need to rename or drop the table
        IF EXISTS (
            SELECT 1
            FROM pg_tables
            WHERE tablename = 'user_profiles'
        ) THEN
            -- If both exist, drop the misspelled one
            DROP TABLE IF EXISTS user_profiless CASCADE;
        ELSE
            -- Only if user_profiless exists but user_profiles doesn't, rename it
            ALTER TABLE user_profiless RENAME TO user_profiles;
        END IF;
        
        -- Recreate the policies to reference the correct table
        CREATE POLICY "Admin users can manage all stories"
        ON stories
        USING (
            EXISTS (
              SELECT 1 FROM user_profiles
              WHERE user_profiles.id = auth.uid()
              AND user_profiles.is_admin = true
            )
        );
        
        CREATE POLICY "Admin users can manage themes"
        ON themes
        USING (
            EXISTS (
              SELECT 1 FROM user_profiles
              WHERE user_profiles.id = auth.uid()
              AND user_profiles.is_admin = true
            )
        );
        
        CREATE POLICY "Admin users can manage settings"
        ON settings
        USING (
            EXISTS (
              SELECT 1 FROM user_profiles
              WHERE user_profiles.id = auth.uid()
              AND user_profiles.is_admin = true
            )
        );
        
        CREATE POLICY "Admin users can manage all credit transactions"
        ON story_credits_transactions
        USING (
            EXISTS (
              SELECT 1 FROM user_profiles
              WHERE user_profiles.id = auth.uid()
              AND user_profiles.is_admin = true
            )
        );
    END IF;
    
    -- Fix any policies that might be causing recursion on the correct user_profiles table
    DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
    
    -- Create the correct policy
    CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);
END $$;
