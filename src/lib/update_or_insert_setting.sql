
-- Function to update or insert a system setting
CREATE OR REPLACE FUNCTION update_or_insert_setting(key_name TEXT, key_value TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO system_configurations (key, value)
  VALUES (key_name, key_value)
  ON CONFLICT (key) DO UPDATE
  SET value = key_value, updated_at = NOW();
END;
$$;

-- Set the security settings for the function
REVOKE ALL ON FUNCTION update_or_insert_setting(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_or_insert_setting(TEXT, TEXT) TO authenticated;
