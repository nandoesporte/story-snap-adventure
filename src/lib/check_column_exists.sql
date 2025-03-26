
-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION check_column_exists(p_table_name text, p_column_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    column_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = p_table_name
        AND column_name = p_column_name
    ) INTO column_exists;
    
    RETURN column_exists;
END;
$$;

