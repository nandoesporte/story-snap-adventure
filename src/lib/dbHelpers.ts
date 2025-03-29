
import { supabase } from '@/lib/supabase';

/**
 * Helper function for safely querying the database and handling errors
 */
export async function safeQuery<T>(queryFn: () => Promise<{ data: T | null; error: any }>): Promise<T | null> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.error("Database query error:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Error executing query:", err);
    return null;
  }
}

/**
 * Helper function to execute raw SQL queries
 */
export async function executeRawQuery<T = any>(sql: string, params?: any[]): Promise<T[] | null> {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error("Error executing raw query:", error);
      return null;
    }
    return data as T[];
  } catch (error) {
    console.error("Unexpected error in executeRawQuery:", error);
    return null;
  }
}

/**
 * Checks if a table exists in the database schema
 */
export async function checkTableExists(tableName: string, schemaName: string = 'public'): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_table_exists', { 
      p_table_name: tableName,
      p_schema_name: schemaName
    });
    
    if (error) {
      console.error("Error checking table existence:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Error in checkTableExists:", error);
    return false;
  }
}

/**
 * Helper function to safely cast database types
 */
export function safeTypeCast<T>(value: any, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  try {
    return value as T;
  } catch {
    return fallback;
  }
}

/**
 * Helper function to check if user has admin privileges
 */
export async function checkIsAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
      
    return !!profile?.is_admin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Helper function to check if a setting exists
 */
export async function checkSettingExists(key: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('system_configurations')
      .select('key', { count: 'exact', head: true })
      .eq('key', key);
      
    if (error) {
      console.error("Error checking setting existence:", error);
      return false;
    }
    
    return count === 1;
  } catch (error) {
    console.error("Error in checkSettingExists:", error);
    return false;
  }
}

