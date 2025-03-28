
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

-- Allow anyone to read narrations
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
