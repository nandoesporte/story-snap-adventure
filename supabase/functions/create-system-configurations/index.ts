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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );

    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return new Response(
        JSON.stringify({ error: "Chave não fornecida" }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          },
        }
      );
    }

    // Check if the key already exists before replacing
    const { data: existingConfig, error: checkError } = await supabaseClient
      .from("system_configurations")
      .select("*")
      .eq("key", key)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let result;
    
    if (existingConfig) {
      // If the configuration already exists, update ONLY if the new value isn't empty
      // and is different from the existing value
      if (value && value !== existingConfig.value) {
        console.log(`Updating existing configuration: ${key}`);
        const { data, error } = await supabaseClient
          .from("system_configurations")
          .update({ value })
          .eq("key", key)
          .select();
        
        if (error) throw error;
        result = data;
        console.log(`Updated configuration: ${key}`);
      } else {
        // Keep the existing value if the new value is empty or unchanged
        console.log(`Keeping existing configuration value for: ${key}`);
        result = existingConfig;
      }
    } else {
      // If it doesn't exist, insert a new record only if value is not empty
      if (value) {
        console.log(`Creating new configuration: ${key}`);
        const { data, error } = await supabaseClient
          .from("system_configurations")
          .insert({ key, value })
          .select();
        
        if (error) throw error;
        result = data;
        console.log(`Created new configuration: ${key}`);
      } else {
        console.log(`Skipping creation of empty configuration: ${key}`);
        result = { key, value: "" };
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Configuração salva com sucesso", 
        data: result 
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
      }
    );
  } catch (error) {
    console.error("Erro ao salvar configuração:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
      }
    );
  }
});
