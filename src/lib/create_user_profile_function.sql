
-- Function to create a user profile if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_user_profile(user_id UUID, user_email TEXT, user_name TEXT)
RETURNS user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_profile public.user_profiles;
  is_admin_user BOOLEAN;
BEGIN
  -- Check if this is an admin email
  is_admin_user := user_email = 'nandoesporte1@gmail.com';
  
  -- Insert or update the user profile
  INSERT INTO public.user_profiles (id, display_name, story_credits, is_admin)
  VALUES (user_id, user_email, 5, is_admin_user)
  ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      story_credits = EXCLUDED.story_credits,
      is_admin = EXCLUDED.is_admin
  RETURNING * INTO new_profile;
  
  RETURN new_profile;
END;
$$;
