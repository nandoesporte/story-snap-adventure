
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

    // Importante: Verifique se a chave já existe antes de substituir
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
      // Se a configuração já existir, faça um update APENAS se o novo valor não estiver vazio
      if (value) {
        const { data, error } = await supabaseClient
          .from("system_configurations")
          .update({ value })
          .eq("key", key);
        
        if (error) throw error;
        result = data;
      } else {
        // Se o novo valor estiver vazio, mantenha o valor existente
        result = existingConfig;
      }
    } else {
      // Se não existir, insira um novo registro
      const { data, error } = await supabaseClient
        .from("system_configurations")
        .insert({ key, value });
      
      if (error) throw error;
      result = data;
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
