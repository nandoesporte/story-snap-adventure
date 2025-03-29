
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    console.log("Creating system_configurations table if it doesn't exist");
    
    // Create a Supabase client with the admin key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );

    // First check if the table already exists
    const { data: tableExists, error: checkError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'system_configurations')
      .eq('table_schema', 'public');

    if (checkError) {
      console.error("Error checking if table exists:", checkError);
      throw checkError;
    }

    // Create the table if it doesn't exist
    if (!tableExists || tableExists.length === 0) {
      console.log("Table doesn't exist, creating it now...");
      
      // Create the table directly with SQL
      const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.system_configurations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            key TEXT NOT NULL UNIQUE,
            value TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create updated_at trigger
          CREATE OR REPLACE FUNCTION update_timestamp()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          DROP TRIGGER IF EXISTS update_system_configurations_timestamp ON public.system_configurations;
          
          CREATE TRIGGER update_system_configurations_timestamp
          BEFORE UPDATE ON public.system_configurations
          FOR EACH ROW
          EXECUTE FUNCTION update_timestamp();
          
          -- Add RLS policies for admin access
          ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Admin users can do all operations" ON public.system_configurations;
          CREATE POLICY "Admin users can do all operations" 
          ON public.system_configurations
          USING (
            EXISTS (
              SELECT 1 FROM user_profiles
              WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
            )
          );
          
          -- Add policy for reading non-sensitive configurations
          DROP POLICY IF EXISTS "Allow reading non-sensitive configurations" ON public.system_configurations;
          CREATE POLICY "Allow reading non-sensitive configurations" 
          ON public.system_configurations
          FOR SELECT
          USING (
            key NOT IN ('stripe_api_key', 'stripe_webhook_secret', 'openai_api_key')
          );
        `
      });

      if (createError) {
        console.error("Error creating table with exec_sql:", createError);
        throw createError;
      }
      
      console.log("Table created successfully");
    } else {
      console.log("Table already exists");
      
      // Ensure RLS policies are set correctly
      const { error: policyError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: `
          -- Ensure RLS is enabled
          ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;
          
          -- Update admin policies
          DROP POLICY IF EXISTS "Admin users can do all operations" ON public.system_configurations;
          CREATE POLICY "Admin users can do all operations" 
          ON public.system_configurations
          USING (
            EXISTS (
              SELECT 1 FROM user_profiles
              WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
            )
          );
          
          -- Add policy for reading non-sensitive configurations
          DROP POLICY IF EXISTS "Allow reading non-sensitive configurations" ON public.system_configurations;
          CREATE POLICY "Allow reading non-sensitive configurations" 
          ON public.system_configurations
          FOR SELECT
          USING (
            key NOT IN ('stripe_api_key', 'stripe_webhook_secret', 'openai_api_key')
          );
        `
      });
      
      if (policyError) {
        console.error("Error updating policies:", policyError);
        // Continue anyway, as the policies might already exist
      }
    }

    // Verify the table exists and has the expected structure
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('system_configurations')
      .select('id')
      .limit(1);
      
    if (verifyError) {
      console.error("Table verification failed:", verifyError);
      throw verifyError;
    }
    
    console.log("Table verification successful");

    // Try to insert a test record to verify write access
    const testKey = `test_key_${Date.now()}`;
    const { error: insertError } = await supabaseAdmin
      .from('system_configurations')
      .insert({ key: testKey, value: 'test_value' })
      .select();
      
    if (insertError) {
      console.error("Insert test failed:", insertError);
      throw insertError;
    }
    
    // Clean up test record
    await supabaseAdmin
      .from('system_configurations')
      .delete()
      .eq('key', testKey);
      
    console.log("Write access verified successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "System configurations table created and verified successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating system configurations table:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
