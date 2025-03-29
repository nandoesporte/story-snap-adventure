
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface RequestBody {
  script: string;
}

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
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // Supabase API URL - env var exposed by default in edge functions
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase SERVICE_ROLE KEY - env var exposed by default in edge functions
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the script from the request body
    const { script } = await req.json() as RequestBody

    if (!script) {
      return new Response(
        JSON.stringify({ error: 'Script is required', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log("Executing SQL script with admin privileges");
    
    // First check if system_configurations table exists
    const { data: tableExists, error: checkError } = await supabaseClient
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'system_configurations')
      .eq('table_schema', 'public');

    if (checkError) {
      console.error('Error checking if system_configurations table exists:', checkError);
    }

    // Create system_configurations table if it doesn't exist
    if (!tableExists || tableExists.length === 0) {
      console.log("Creating system_configurations table...");
      
      const createTableScript = `
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
      `;
      
      const { error: createError } = await supabaseClient.rpc('exec_sql', { sql_query: createTableScript });
      
      if (createError) {
        console.error('Error creating system_configurations table:', createError);
        return new Response(
          JSON.stringify({ error: 'Error creating system_configurations table', details: createError, success: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      console.log("System configurations table created successfully");
    }
    
    // Execute the requested SQL script
    const { data, error } = await supabaseClient.rpc('exec_sql', { sql_query: script })

    if (error) {
      console.error('Error executing SQL script:', error)
      return new Response(
        JSON.stringify({ error: error.message, success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Unexpected error occurred', details: err.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
