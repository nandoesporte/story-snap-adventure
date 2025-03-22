
-- Create UUID extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to create page_contents table if it doesn't exist
CREATE OR REPLACE FUNCTION create_page_contents_if_not_exists()
RETURNS void AS $$
BEGIN
    -- Check if the table exists using a correct SQL query
    PERFORM 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'page_contents';
    
    IF NOT FOUND THEN
        -- Create page_contents table
        CREATE TABLE public.page_contents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            page TEXT NOT NULL,
            section TEXT NOT NULL,
            key TEXT NOT NULL,
            content TEXT NOT NULL,
            content_type TEXT NOT NULL DEFAULT 'text',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(page, section, key)
        );

        -- Add RLS policies
        ALTER TABLE public.page_contents ENABLE ROW LEVEL SECURITY;

        -- Admin can do anything
        CREATE POLICY admin_all ON public.page_contents
            FOR ALL
            TO authenticated
            USING (
                (SELECT is_admin FROM public.user_profiles WHERE user_id = auth.uid())
            );

        -- Anyone can read page contents
        CREATE POLICY read_all ON public.page_contents
            FOR SELECT
            TO anon, authenticated
            USING (true);

        -- Create trigger function properly for updating updated_at
        EXECUTE 'CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;';

        -- Create trigger on the table with proper syntax
        EXECUTE 'CREATE TRIGGER update_timestamp_trigger
        BEFORE UPDATE ON public.page_contents
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp();';
        
        -- Insert initial data
        INSERT INTO public.page_contents (page, section, key, content, content_type)
        VALUES
        -- Hero section
        ('index', 'hero', 'title_line1', 'ACENDA', 'text'),
        ('index', 'hero', 'title_line2', 'A IMAGINAÇÃO', 'text'),
        ('index', 'hero', 'title_line3', 'DO SEU FILHO!', 'text'),
        ('index', 'hero', 'subtitle', 'Crie histórias divertidas e personalizadas que dão vida às aventuras do seu filho e despertem sua paixão pela leitura. Leva apenas alguns segundos!', 'text'),
        ('index', 'hero', 'button_text', 'CRIAR HISTÓRIA', 'text'),
        ('index', 'hero', 'button_subtitle', 'Experimente Grátis!', 'text'),
        ('index', 'hero', 'image_url', '/lovable-uploads/4e6e784b-efbd-45e2-b83d-3704e80cddf5.png', 'image'),
        ('index', 'hero', 'image_alt', 'Livro mágico com animais da floresta - raposa, guaxinim, coruja e balão de ar quente', 'text'),
        ('index', 'hero', 'banner_text', 'Junte-se a mais de 100.000 famílias usando o Story Spark para cultivar a paixão pela leitura.', 'text');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to ensure user_profiles table exists
CREATE OR REPLACE FUNCTION create_user_profiles_if_not_exists()
RETURNS void AS $$
BEGIN
    -- Check if the table exists using a better approach
    PERFORM 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles';
    
    IF NOT FOUND THEN
        -- Create user_profiles table
        CREATE TABLE public.user_profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          display_name TEXT,
          avatar_url TEXT,
          preferred_language TEXT DEFAULT 'pt-BR',
          story_credits INTEGER DEFAULT 5,
          is_admin BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view their own profile"
          ON user_profiles FOR SELECT
          USING (auth.uid() = id);

        CREATE POLICY "Users can update their own profile"
          ON user_profiles FOR UPDATE
          USING (auth.uid() = id);

        CREATE POLICY "Everyone can view admin profiles"
          ON user_profiles FOR SELECT
          USING (true);
    END IF;
END;
$$ LANGUAGE plpgsql;
