
import { supabase } from "./supabase";

export const checkTableExists = async (tableName: string, schemaName: string = 'public'): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_table_exists', {
      p_table_name: tableName,
      p_schema_name: schemaName
    });
    
    if (error) {
      console.error("Error checking if table exists:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Unexpected error in checkTableExists:", error);
    return false;
  }
};

export const checkColumnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_column_exists', { 
      p_table_name: tableName, 
      p_column_name: columnName 
    });
    
    if (error) {
      console.error("Error checking if column exists:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Unexpected error in checkColumnExists:", error);
    return false;
  }
};

export const executeRawQuery = async (query: string, params?: any[]): Promise<any> => {
  try {
    // Note: This is for admin use only and should be properly secured
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    
    if (error) {
      console.error("Error executing raw SQL:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Unexpected error in executeRawQuery:", error);
    return null;
  }
};
