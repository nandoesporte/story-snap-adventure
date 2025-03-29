
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
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
          )
        );
      `
    });

    if (createError) {
      console.error("Error creating table with exec_sql:", createError);
      throw createError;
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
