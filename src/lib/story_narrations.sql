
-- Create the story_narrations table
CREATE TABLE IF NOT EXISTS public.story_narrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  page_index INTEGER NOT NULL,
  audio_url TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(story_id, page_index)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_story_narrations_story_id ON public.story_narrations(story_id);

-- Add RLS policies
ALTER TABLE public.story_narrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read narrations (they're public content)
CREATE POLICY "Allow public read access" 
ON public.story_narrations
FOR SELECT 
USING (true);

-- Allow authenticated users to insert/update their own story narrations
CREATE POLICY "Allow authenticated users to insert/update"
ON public.story_narrations
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM public.stories 
    WHERE id = story_narrations.story_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id 
    FROM public.stories 
    WHERE id = story_narrations.story_id
  )
);

-- Ensure the storage bucket exists
DO $$
BEGIN
  -- Create the bucket if it doesn't exist
  BEGIN
    PERFORM supabase_storage.create_bucket('story_narrations', '{"public": true}');
  EXCEPTION 
    WHEN others THEN 
      -- Bucket likely already exists, continue
  END;
  
  -- Set public access policy
  BEGIN
    PERFORM supabase_storage.update_bucket('story_narrations', '{"public": true}');
  EXCEPTION
    WHEN others THEN
      -- Policy update failed, continue
  END;
END $$;

-- Add policy to allow public read access to storage
BEGIN
  INSERT INTO storage.policies (name, bucket_id, definition)
  VALUES ('Allow public read access', 'story_narrations', '{"name":"Allow public read access","id":"story_narrations/public_read","definition":{"statements":[{"effect":"allow","principal":"anon","action":"select","resource":"objects"}]}}')
  ON CONFLICT (name, bucket_id) 
  DO NOTHING;
EXCEPTION
  WHEN others THEN
    -- Policy likely already exists or can't be created this way
END;

-- Add policy to allow authenticated users to upload files
BEGIN
  INSERT INTO storage.policies (name, bucket_id, definition)
  VALUES ('Allow authenticated uploads', 'story_narrations', '{"name":"Allow authenticated uploads","id":"story_narrations/authenticated_uploads","definition":{"statements":[{"effect":"allow","principal":"authenticated","action":["insert","update"],"resource":"objects"}]}}')
  ON CONFLICT (name, bucket_id) 
  DO NOTHING;
EXCEPTION
  WHEN others THEN
    -- Policy likely already exists or can't be created this way
END;

