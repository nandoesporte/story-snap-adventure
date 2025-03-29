
import { supabase } from '@/lib/supabase';

/**
 * Helper function for safely querying the database and handling errors
 * @param queryFn Function that executes the database query
 * @returns Query result or null if error occurs
 */
export async function safeQuery<T>(queryFn: () => Promise<{ data: T | null; error: any }>): Promise<T | null> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.error("Database query error:", error);
      return null;
    }
    return data as T;
  } catch (err) {
    console.error("Error executing query:", err);
    return null;
  }
}

/**
 * Checks if a table exists in the database schema
 * @param tableName Name of the table to check
 * @returns Boolean indicating if table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const { data } = await supabase
    .rpc('check_table_exists', { table_name: tableName })
    .single();
  
  return !!data;
}

/**
 * Safely converts database JSON to a typed object
 * @param json JSON data from database
 * @returns Parsed object or default value
 */
export function safeJsonParse<T>(json: any, defaultValue: T): T {
  if (!json) return defaultValue;
  
  try {
    if (typeof json === 'string') {
      return JSON.parse(json) as T;
    }
    return json as T;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return defaultValue;
  }
}

/**
 * Helper function to safely cast database types
 * @param value Value to cast
 * @param fallback Fallback value if casting fails
 * @returns Casted value or fallback
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
    const { data, error } = await supabase
      .rpc('is_admin_user', { user_id: userId });
      
    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Error in admin check:", error);
    return false;
  }
}
