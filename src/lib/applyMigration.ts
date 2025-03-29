
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

/**
 * Apply SQL migration to the database
 * @param sqlScript The SQL script to execute
 * @param source Source identifier for logging purposes
 * @returns Promise resolving to success status and message
 */
export async function applyMigration(sqlScript: string, source: string = 'manual'): Promise<{success: boolean, message: string}> {
  try {
    // First try to use exec_sql function directly
    try {
      const { error: directError } = await supabase.rpc('exec_sql', { 
        sql_query: sqlScript 
      });
      
      if (!directError) {
        console.log(`SQL migration from "${source}" applied successfully using direct RPC call`);
        return { success: true, message: "Migration applied successfully" };
      }
      
      console.log(`Direct RPC call failed: ${directError.message}. Trying edge function...`);
    } catch (directErr) {
      console.log(`Exception during direct RPC call: ${directErr}. Trying edge function...`);
    }
    
    // If direct call fails, try using the edge function
    const { data, error } = await supabase.functions.invoke('apply-sql-migration', {
      body: { sqlScript, source }
    });
    
    if (error) {
      console.error('Error applying SQL migration:', error);
      return { success: false, message: `Failed to apply migration: ${error.message}` };
    }
    
    console.log('SQL migration result:', data);
    return { 
      success: data?.success === true, 
      message: data?.message || 'Migration applied' 
    };
  } catch (err) {
    console.error('Unexpected error applying migration:', err);
    return { success: false, message: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * Apply SQL migration from a file in the src/lib directory
 * @param fileName The name of the SQL file in src/lib directory
 * @returns Promise resolving to success status and message
 */
export async function applyMigrationFromFile(fileName: string): Promise<{success: boolean, message: string}> {
  try {
    // Fetch the SQL file content
    const response = await fetch(`/src/lib/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to load SQL file: ${response.status} ${response.statusText}`);
    }
    
    const sqlScript = await response.text();
    return applyMigration(sqlScript, fileName);
  } catch (err) {
    console.error(`Error applying migration from file ${fileName}:`, err);
    return { success: false, message: `Failed to apply migration from ${fileName}: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * Apply system configuration setup SQL
 */
export async function applySystemConfigurationsSetup(): Promise<void> {
  const { success, message } = await applyMigrationFromFile('system_configurations.sql');
  
  if (success) {
    console.log('System configurations setup successful');
  } else {
    console.error('System configurations setup failed:', message);
    toast.error("Falha ao configurar tabela do sistema", {
      description: "Por favor, contacte o suporte.",
    });
  }
}
