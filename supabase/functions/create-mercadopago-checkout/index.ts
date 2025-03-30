
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";
import { MercadoPagoConfig, Preference } from "https://esm.sh/mercadopago@2.0.5";

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
    
    const mercadoPagoAccessToken = configData.value;
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
      metadata: {
        userId: user.id,
        planId: planId
      }
    };

    // Add notification URL if configured
    if (webhookData?.value) {
      preferenceData.notification_url = webhookData.value;
    }

    // Create a preference
    const result = await preference.create({
      body: preferenceData
    });

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
  } catch (error) {
    console.error("Error creating Mercado Pago checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
