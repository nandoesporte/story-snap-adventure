
-- Function to execute SQL as an admin
-- This should be created with superuser privileges
CREATE OR REPLACE FUNCTION exec(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Set the security settings for the function
REVOKE ALL ON FUNCTION exec(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec(text) TO authenticated;
