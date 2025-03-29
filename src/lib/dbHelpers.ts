import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/types';

/**
 * Helper function to safely execute RPC functions
 */
export async function callRpcFunction(functionName: string, params?: Record<string, any>) {
  try {
    const { data, error } = await supabase.rpc(functionName, params || {});
    
    if (error) {
      console.error(`Error calling RPC function ${functionName}:`, error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception in RPC function ${functionName}:`, error);
    return { data: null, error };
  }
}

/**
 * Helper function to check if a table exists in the database
 */
export async function checkTableExists(tableName: string, schema = 'public') {
  try {
    const { data, error } = await supabase.rpc('check_table_exists', {
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
