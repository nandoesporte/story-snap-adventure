
-- Initialize database structure if it doesn't exist yet
BEGIN;

-- First check if the characters table exists
-- If not, create it and its dependencies
SELECT create_characters_table_if_not_exists();

COMMIT;
