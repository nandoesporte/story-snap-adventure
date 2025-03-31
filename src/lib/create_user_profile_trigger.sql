
-- Function to automatically create a user profile when a new user is created
CREATE OR REPLACE FUNCTION public.create_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, story_credits, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    5,
    CASE WHEN NEW.email = 'nandoesporte1@gmail.com' THEN TRUE ELSE FALSE END
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to execute the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile_on_signup();
