
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/types';

/**
 * Helper function to safely execute RPC functions
 */
export async function callRpcFunction<T = any>(functionName: string, params?: Record<string, any>): Promise<{ data: T | null, error: Error | null }> {
  try {
    // @ts-ignore - We need to allow any function name here
    const { data, error } = await supabase.rpc(functionName, params || {});
    
    if (error) {
      console.error(`Error calling RPC function ${functionName}:`, error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception in RPC function ${functionName}:`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Helper function to check if a table exists in the database
 */
export async function checkTableExists(tableName: string, schema = 'public') {
  try {
    const { data, error } = await callRpcFunction<boolean>('check_table_exists', {
      p_table_name: tableName,
      p_schema_name: schema
    });
    
    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error(`Exception checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Helper to get data from information_schema
 * This is used as a workaround for direct information_schema access
 */
export async function queryInformationSchema(tableName: string, schemaName = 'public') {
  return await callRpcFunction('check_table_exists', {
    p_table_name: tableName,
    p_schema_name: schemaName
  });
}

// Add this function to execute raw SQL queries
export async function executeRawQuery(sqlQuery: string) {
  try {
    // Use the exec_sql RPC function which should be defined in the database
    const { data, error } = await callRpcFunction('exec_sql', { 
      sql_query: sqlQuery 
    });
    
    if (error) {
      console.error('Error executing SQL query:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Exception in executeRawQuery:', error);
    return { success: false, error };
  }
}
