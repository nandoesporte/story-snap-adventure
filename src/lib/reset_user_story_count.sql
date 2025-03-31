
-- Function to reset a user's story count when manually activating a subscription
CREATE OR REPLACE FUNCTION public.reset_user_story_count(user_uuid UUID) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user_profiles to reset the stories_created_count
  UPDATE user_profiles
  SET stories_created_count = 0
  WHERE id = user_uuid;
  
  RETURN TRUE;
END;
$$;
