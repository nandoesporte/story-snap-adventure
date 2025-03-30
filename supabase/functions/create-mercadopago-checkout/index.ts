
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
      
      // Check if we've reached max retries
      if (retries >= maxRetries) {
        console.error(`Max retries (${maxRetries}) reached. Giving up.`);
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase URL or Anon Key in environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log("Creating Supabase client with URL:", supabaseUrl);
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the user from the auth header
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: "Error fetching user" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("User authenticated:", user.id);

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
    
    // Validate API key format
    const mercadoPagoAccessToken = configData.value;
    if (!mercadoPagoAccessToken || mercadoPagoAccessToken.trim() === "") {
      return new Response(
        JSON.stringify({ error: "MercadoPago API key está vazio. Configure uma chave válida." }),
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
    
    // Validate the MercadoPago API key with more comprehensive error handling
    try {
      console.log("Testing MercadoPago token validity...");
      
      // First attempt with payment methods endpoint, which requires minimal permissions
      const testResponse = await fetch("https://api.mercadopago.com/v1/payment_methods", {
        headers: {
          "Authorization": `Bearer ${mercadoPagoAccessToken}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error("Invalid MercadoPago token response:", errorText);
        
        // Check for specific error response patterns
        if (testResponse.status === 401) {
          return new Response(
            JSON.stringify({ 
              error: "API key do MercadoPago inválida", 
              details: "A chave fornecida é inválida ou expirou. Verifique se digitou corretamente."
            }),
            {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } else if (testResponse.status === 403) {
          return new Response(
            JSON.stringify({ 
              error: "Erro de permissão na API do MercadoPago", 
              details: "Verifique se a API Key tem as permissões necessárias na sua conta MercadoPago."
            }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } else {
          // For other errors, try a second validation endpoint
          console.log("Trying alternative validation endpoint...");
          const altResponse = await fetch("https://api.mercadopago.com/users/me", {
            headers: {
              "Authorization": `Bearer ${mercadoPagoAccessToken}`,
              "Content-Type": "application/json"
            }
          });
          
          if (!altResponse.ok) {
            console.error("Second validation attempt failed:", await altResponse.text());
            return new Response(
              JSON.stringify({ 
                error: "O token do MercadoPago parece ser inválido", 
                details: "Ambos os testes de validação falharam. Verifique suas credenciais e permissões."
              }),
              {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }
      }
      console.log("MercadoPago token is valid.");
    } catch (tokenTestError) {
      console.error("Failed to validate MercadoPago token:", tokenTestError);
      return new Response(
        JSON.stringify({ 
          error: "Não foi possível validar o token do MercadoPago", 
          details: "Erro de conexão ou serviço indisponível. Tente novamente mais tarde."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Initialize MercadoPago client
    const client = new MercadoPagoConfig({ accessToken: mercadoPagoAccessToken });
    const preference = new Preference(client);

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (jsonError) {
      console.error("Failed to parse request body:", jsonError);
      return new Response(
        JSON.stringify({ error: "Falha ao processar dados da requisição" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { planId, returnUrl } = requestData;

    if (!planId) {
      return new Response(
        JSON.stringify({ error: "Missing planId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching plan details for planId:", planId);
    // Get plan details from database
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("id, name, price, currency, interval")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      console.error("Plan not found:", planError);
      return new Response(
        JSON.stringify({ error: "Plan not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Plan details retrieved:", plan);

    // Set return URL and webhook URL
    const origin = req.headers.get("origin") || "https://znumbovtprdnfddwwerf.supabase.co";
    const successUrl = returnUrl || `${origin}/my-account`;
    const cancelUrl = returnUrl || `${origin}/subscription`;
    const webhookUrl = webhookData?.value || "https://znumbovtprdnfddwwerf.supabase.co/functions/v1/mercadopago-webhook";

    // Create preference object with more robust error handling
    try {
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

      // Create preference with retry logic but with direct fetch to avoid version incompatibility
      const mpApiUrl = "https://api.mercadopago.com/checkout/preferences";
      const response = await fetch(mpApiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mercadoPagoAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(preferenceData)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("MercadoPago API error response:", errorData);
        throw new Error(`MercadoPago API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("MercadoPago preference created successfully:", result.id);
      
      const checkoutUrl = result.init_point;
      if (!checkoutUrl) {
        throw new Error("MercadoPago returned an invalid checkout URL");
      }
      
      return new Response(
        JSON.stringify({ 
          checkoutUrl: checkoutUrl,
          preferenceId: result.id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (mpError) {
      console.error("MercadoPago API error:", mpError);
      
      // Get detailed error information
      let errorDetails = "Erro desconhecido";
      try {
        if (mpError.message) {
          errorDetails = mpError.message;
        } else if (typeof mpError === 'object') {
          errorDetails = JSON.stringify(mpError);
        }
      } catch (e) {
        // Ignore errors when extracting details
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
      // Ignore errors when extracting message
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
