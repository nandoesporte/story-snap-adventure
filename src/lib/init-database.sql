
-- This file defines the SQL to be executed for initializing the database
-- It creates the characters table and its dependencies if they don't exist

-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the characters table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    age TEXT,
    personality TEXT,
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creator_id UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security (RLS) if not already enabled
DO $$
BEGIN
    EXECUTE 'ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table does not exist yet, skipping RLS enable';
    WHEN others THEN
        RAISE NOTICE 'Error enabling RLS: %', SQLERRM;
END$$;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    -- Anyone can view active characters
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'characters' AND policyname = 'Anyone can view active characters'
    ) THEN
        CREATE POLICY "Anyone can view active characters" 
            ON public.characters 
            FOR SELECT 
            USING (is_active = true);
    END IF;

    -- Admin users can manage all characters
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'characters' AND policyname = 'Admin users can manage characters'
    ) THEN
        CREATE POLICY "Admin users can manage characters" 
            ON public.characters 
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE user_profiles.id = auth.uid()
                    AND user_profiles.is_admin = true
                )
            );
    END IF;
            
    -- Users can create their own characters
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'characters' AND policyname = 'Users can insert their own characters'
    ) THEN
        CREATE POLICY "Users can insert their own characters"
            ON public.characters
            FOR INSERT
            WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
            
    -- Users can update and delete their own characters
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'characters' AND policyname = 'Users can update their own characters'
    ) THEN
        CREATE POLICY "Users can update their own characters"
            ON public.characters
            FOR UPDATE
            USING (creator_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'characters' AND policyname = 'Users can delete their own characters'
    ) THEN
        CREATE POLICY "Users can delete their own characters"
            ON public.characters
            FOR DELETE
            USING (creator_id = auth.uid());
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table does not exist yet, skipping policy creation';
    WHEN others THEN
        RAISE NOTICE 'Error creating policies: %', SQLERRM;
END$$;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
    -- First create the function if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_characters_modified'
    ) THEN
        CREATE FUNCTION update_characters_modified()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;

    -- Then create the trigger if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'characters_updated_at'
    ) THEN
        CREATE TRIGGER characters_updated_at
        BEFORE UPDATE ON public.characters
        FOR EACH ROW EXECUTE FUNCTION update_characters_modified();
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table does not exist yet, skipping trigger creation';
    WHEN others THEN
        RAISE NOTICE 'Error creating trigger: %', SQLERRM;
END$$;

-- Insert predefined characters if the table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.characters LIMIT 1) THEN
        INSERT INTO public.characters (name, description, personality, age, is_active)
        VALUES 
            ('Pingo, o Pinguim Inventor', 'Pinguim genial que cria bugigangas incríveis', 'Curioso, inteligente e sempre pensando em novas invenções', '8 anos', true),
            ('Flora, a Fadinha das Flores', 'Fada encantadora que cuida do jardim mágico', 'Gentil, alegre e apaixonada pela natureza', '100 anos (mas parece 6)', true),
            ('Rex, o Dinossauro Amigável', 'Dino gentil que adora fazer novos amigos', 'Extrovertido, brincalhão e um pouco desastrado', 'Pré-histórico', true),
            ('Bolhas, o Peixinho Explorador', 'Peixinho curioso que desvenda mistérios oceânicos', 'Aventureiro, corajoso e muito falante', '5 anos', true),
            ('Ziggy, o Dragão Colorido', 'Dragãozinho que muda de cor conforme seu humor', 'Emotivo, divertido e cheio de surpresas', '300 anos', true),
            ('Mia, a Gatinha Astronauta', 'Gata corajosa que viaja pelas estrelas', 'Destemida, inteligente e sonhadora', '7 anos', true),
            ('Tuck, a Tartaruga Sábia', 'Tartaruga milenar cheia de histórias e conselhos', 'Paciente, sábia e com grande senso de humor', '500 anos', true),
            ('Zep, o Robozinho Curioso', 'Robô adorável que aprende sobre emoções humanas', 'Analítico, inocente e sempre fazendo perguntas', '2 anos', true);
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table does not exist yet, skipping data insertion';
    WHEN others THEN
        RAISE NOTICE 'Error inserting data: %', SQLERRM;
END$$;
