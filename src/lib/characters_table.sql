
-- This file defines the function to create the characters table and its dependencies

-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if the characters table exists and create it if it doesn't
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'characters'
    ) INTO table_exists;

    -- If table doesn't exist, create it and set up everything
    IF NOT table_exists THEN
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
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            creator_id UUID REFERENCES auth.users(id)
        );

        -- Enable Row Level Security (RLS)
        ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Anyone can view active characters" 
            ON public.characters 
            FOR SELECT 
            USING (is_active = true);

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
            
        CREATE POLICY "Users can insert their own characters"
            ON public.characters
            FOR INSERT
            WITH CHECK (auth.uid() IS NOT NULL);
            
        CREATE POLICY "Users can update their own characters"
            ON public.characters
            FOR UPDATE
            USING (creator_id = auth.uid());
            
        CREATE POLICY "Users can delete their own characters"
            ON public.characters
            FOR DELETE
            USING (creator_id = auth.uid());

        -- Create trigger function for updated_at
        CREATE OR REPLACE FUNCTION update_characters_modified()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create the trigger
        CREATE TRIGGER characters_updated_at
        BEFORE UPDATE ON public.characters
        FOR EACH ROW EXECUTE FUNCTION update_characters_modified();
            
        -- Insert predefined characters
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
END
$$;
