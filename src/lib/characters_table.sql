
-- Function to create characters table if it doesn't exist
CREATE OR REPLACE FUNCTION create_characters_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- Check if the table already exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'characters') THEN
        -- Create the characters table
        CREATE TABLE public.characters (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            image_url TEXT,
            age TEXT,
            personality TEXT,
            is_premium BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable Row Level Security (RLS)
        ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        -- Anyone can view active characters
        CREATE POLICY "Anyone can view active characters" 
            ON public.characters 
            FOR SELECT 
            USING (is_active = true);

        -- Admin users can manage all characters
        CREATE POLICY "Admin users can manage characters" 
            ON public.characters 
            USING (
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE user_profiles.id = auth.uid()
                    AND user_profiles.is_admin = true
                )
            );

        -- Add trigger to update updated_at
        CREATE TRIGGER update_characters_updated_at
            BEFORE UPDATE ON public.characters
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END;
$$ LANGUAGE plpgsql;
