
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface RequestBody {
  script: string;
}

serve(async (req) => {
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
        JSON.stringify({ error: 'Script is required' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Execute the SQL script as the service role (superuser)
    const { data, error } = await supabaseClient.rpc('exec', { sql: script })

    if (error) {
      console.error('Error executing SQL script:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Unexpected error occurred' }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
