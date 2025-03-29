
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
    
    // Execute the SQL script as the service role (superuser)
    // Note: Using exec_sql function instead of exec which was previously used
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
