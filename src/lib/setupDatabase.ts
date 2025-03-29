
import { supabase } from '@/integrations/supabase/client';
import { applyMigrationFromFile, applySystemConfigurationsSetup } from './applyMigration';
import { toast } from "sonner";

const MIGRATION_FILES = [
  'system_configurations.sql',
  'story_narrations.sql',
  'storybot_prompts.sql'
];

/**
 * Verifies if a table exists in the database
 * @param tableName The name of the table to check
 * @returns True if the table exists, false otherwise
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    // Using a raw query approach instead of querying information_schema directly
    const { data, error } = await supabase.rpc('check_column_exists', { 
      p_table_name: tableName,
      p_column_name: 'id'  // Just checking for any column, typically 'id'
    });

    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }

    return Boolean(data);
  } catch (err) {
    console.error(`Error checking if table ${tableName} exists:`, err);
    return false;
  }
}

/**
 * Applies all necessary SQL migrations to set up the database
 */
export async function setupDatabase(): Promise<void> {
  console.log('Starting database setup...');
  
  // Verify if system_configurations table exists
  const configTableExists = await tableExists('system_configurations');
  
  if (!configTableExists) {
    console.log('System configurations table does not exist, creating it...');
    await applySystemConfigurationsSetup();
  } else {
    console.log('System configurations table already exists');
  }
  
  // Run all migrations
  let migrationCount = 0;
  let errorCount = 0;
  
  for (const file of MIGRATION_FILES) {
    console.log(`Applying migration: ${file}`);
    const { success, message } = await applyMigrationFromFile(file);
    
    if (success) {
      migrationCount++;
      console.log(`Migration ${file} applied successfully`);
    } else {
      errorCount++;
      console.error(`Migration ${file} failed:`, message);
    }
  }
  
  console.log(`Database setup completed. ${migrationCount} migrations applied, ${errorCount} errors`);
  
  if (errorCount > 0) {
    toast.error(`${errorCount} migrações de banco de dados falharam`, {
      description: "Algumas funcionalidades podem não estar disponíveis.",
    });
  } else if (migrationCount > 0) {
    toast.success("Banco de dados atualizado com sucesso", {
      description: `${migrationCount} migrações aplicadas.`,
    });
  }
}

/**
 * Initialize database by creating the exec_sql function if it doesn't exist yet
 */
export async function initializeDatabase(): Promise<boolean> {
  console.log('Initializing database...');
  
  try {
    // Create the exec_sql function if it doesn't exist
    const createExecSqlFn = `
      CREATE OR REPLACE FUNCTION exec(sql text)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result JSONB;
      BEGIN
        EXECUTE sql;
        result := '{"status": "success"}'::JSONB;
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        result := jsonb_build_object(
          'status', 'error',
          'message', SQLERRM,
          'detail', SQLSTATE
        );
        RETURN result;
      END;
      $$;
    `;
    
    const { error } = await supabase.rpc('exec', { sql: createExecSqlFn });
    
    if (error) {
      // This might fail if exec doesn't exist yet
      console.log('Failed to create exec function using RPC, trying edge function...');
      
      // Try using the edge function to create the exec function
      const { data, error: edgeFnError } = await supabase.functions.invoke('apply-sql-migration', {
        body: { sqlScript: createExecSqlFn, source: 'initialization' }
      });
      
      if (edgeFnError || !data?.success) {
        console.log('Could not initialize database through edge function.');
        console.log('You may need to run the initial SQL setup manually.');
        return false;
      }
    }
    
    console.log('Database initialized successfully');
    return true;
  } catch (err) {
    console.error('Error initializing database:', err);
    return false;
  }
}
