
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface RequestBody {
  sqlScript: string;
  source?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  
  try {
    // Create a Supabase client with the Auth context of the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the SQL script from the request body
    const { sqlScript, source } = await req.json() as RequestBody;

    if (!sqlScript || sqlScript.trim() === '') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SQL script is required and cannot be empty',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    console.log(`Executing SQL migration from source: ${source || 'unspecified'}`);
    console.log(`SQL length: ${sqlScript.length} characters`);
    
    // Execute the SQL script using the database function
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
      sql_query: sqlScript 
    });

    if (error) {
      console.error("SQL execution error:", error);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          details: error,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }

    console.log("SQL migration executed successfully");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "SQL migration applied successfully",
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Unexpected error occurred', 
        details: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
