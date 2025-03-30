
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";
import { MercadoPagoConfig, Preference } from "https://esm.sh/mercadopago@2.0.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Retry helper function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 300) {
  let retries = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      
      // If we've reached max retries or it's not a temporary error, rethrow
      if (retries >= maxRetries || 
         !(error.status === 429 || error.status === 500 || error.status === 503)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, retries - 1);
      console.log(`Retry ${retries}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create a Supabase client with the auth header
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the user from the auth header
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Error fetching user" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Mercado Pago API key from database
    const { data: configData, error: configError } = await supabaseClient
      .from("system_configurations")
      .select("value")
      .eq("key", "mercadopago_access_token")
      .single();
      
    if (configError || !configData?.value) {
      console.error("Mercado Pago API key not configured:", configError);
      return new Response(
        JSON.stringify({ error: "Mercado Pago API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Get webhook URL if configured
    const { data: webhookData } = await supabaseClient
      .from("system_configurations")
      .select("value")
      .eq("key", "mercadopago_webhook_url")
      .single();

    if (!configData.value || configData.value.trim() === "") {
      return new Response(
        JSON.stringify({ error: "MercadoPago API key está vazio. Configure uma chave válida." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const mercadoPagoAccessToken = configData.value;
    
    try {
      // Teste a validade do token fazendo uma chamada simples à API do MercadoPago
      const testResponse = await retryWithBackoff(() => fetch("https://api.mercadopago.com/v1/payment_methods", {
        headers: {
          "Authorization": `Bearer ${mercadoPagoAccessToken}`,
          "Content-Type": "application/json"
        }
      }));
      
      if (!testResponse.ok) {
        console.error("Invalid MercadoPago token:", await testResponse.text());
        return new Response(
          JSON.stringify({ error: "O token do MercadoPago parece ser inválido. Verifique suas configurações." }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } catch (tokenTestError) {
      console.error("Failed to validate MercadoPago token:", tokenTestError);
      return new Response(
        JSON.stringify({ error: "Não foi possível validar o token do MercadoPago. Verifique sua conexão." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const client = new MercadoPagoConfig({ accessToken: mercadoPagoAccessToken });
    const preference = new Preference(client);

    // Parse request body
    const { planId, returnUrl } = await req.json();

    if (!planId) {
      return new Response(
        JSON.stringify({ error: "Missing planId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get plan details from database
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("id, name, price, currency, interval")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: "Plan not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Set return URL
    const successUrl = returnUrl || `${req.headers.get("origin")}/my-account`;
    const cancelUrl = returnUrl || `${req.headers.get("origin")}/subscription`;
    
    // Use the webhook URL from configuration or default to the Mercado Pago webhook URL
    const webhookUrl = webhookData?.value || "https://znumbovtprdnfddwwerf.supabase.co/functions/v1/mercadopago-webhook";

    // Create preference object
    const preferenceData = {
      items: [
        {
          id: plan.id,
          title: `${plan.name} - ${plan.interval === 'month' ? 'Mensal' : 'Anual'}`,
          quantity: 1,
          unit_price: Number(plan.price),
          currency_id: plan.currency || "BRL"
        }
      ],
      back_urls: {
        success: successUrl,
        failure: cancelUrl,
        pending: successUrl
      },
      auto_return: "approved",
      notification_url: webhookUrl,
      metadata: {
        userId: user.id,
        planId: planId
      }
    };

    console.log("Creating MercadoPago preference:", JSON.stringify(preferenceData));

    // Create a preference with retry logic for API rate limits
    try {
      const result = await retryWithBackoff(() => preference.create({
        body: preferenceData
      }));

      console.log("MercadoPago preference created successfully:", result.id);
      
      return new Response(
        JSON.stringify({ 
          url: result.init_point,
          preferenceId: result.id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (mpError) {
      console.error("MercadoPago API error:", mpError);
      
      // Tentar obter detalhes do erro
      let errorDetails = "Erro desconhecido";
      try {
        if (mpError.message) {
          errorDetails = mpError.message;
        } else if (typeof mpError === 'object') {
          errorDetails = JSON.stringify(mpError);
        }
      } catch (e) {
        // Ignorar erros ao extrair detalhes
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Falha ao criar preferência no MercadoPago", 
          details: errorDetails
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Erro ao criar checkout do Mercado Pago:", error);
    
    let errorMessage = "Erro desconhecido";
    try {
      if (error.message) {
        errorMessage = error.message;
      }
    } catch (e) {
      // Ignorar erros ao extrair mensagem
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
