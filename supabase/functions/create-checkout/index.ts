
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";
import Stripe from "https://esm.sh/stripe@11.18.0";

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
  
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false }
  });

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

  try {
    // Get Stripe API key from database
    const { data: configData, error: configError } = await supabaseClient
      .from("system_configurations")
      .select("value")
      .eq("key", "stripe_api_key")
      .single();
      
    if (configError || !configData?.value) {
      return new Response(
        JSON.stringify({ error: "Stripe API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const stripeSecretKey = configData.value;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

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
      .select("id, name, stripe_price_id")
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

    if (!plan.stripe_price_id) {
      return new Response(
        JSON.stringify({ error: "Plan does not have a Stripe price ID" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user already has a Stripe customer ID
    const { data: userProfile, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      return new Response(
        JSON.stringify({ error: "Error fetching user profile" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Look for existing customer
    let customerId;
    const { data: subscription, error: subError } = await supabaseClient
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!subError && subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id;
    }

    // If no customer ID found, try to find by email or create a new one
    if (!customerId) {
      // Try to find customer by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        // Create a new customer
        const newCustomer = await stripe.customers.create({
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          metadata: {
            user_id: user.id,
          },
        });
        customerId = newCustomer.id;
      }
    }

    // Set return URL
    const successUrl = returnUrl || `${req.headers.get("origin")}/my-account`;
    const cancelUrl = returnUrl || `${req.headers.get("origin")}/subscription`;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        planId: planId,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
