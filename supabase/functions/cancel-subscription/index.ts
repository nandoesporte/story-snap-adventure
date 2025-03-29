
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";
import Stripe from "https://esm.sh/stripe@11.18.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

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

  try {
    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ error: "Missing subscriptionId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the subscription from the database
    const { data: dbSubscription, error: subError } = await supabaseClient
      .from("user_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single();

    if (subError) {
      return new Response(
        JSON.stringify({ error: "Subscription not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if the subscription belongs to the user or if user is admin
    const { data: userProfile, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: "Error fetching user profile" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (dbSubscription.user_id !== user.id && !userProfile.is_admin) {
      return new Response(
        JSON.stringify({ error: "Not authorized to cancel this subscription" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Cancel the subscription at the end of the billing period
    if (dbSubscription.stripe_subscription_id) {
      await stripe.subscriptions.update(dbSubscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    // Update the subscription in the database
    await supabaseClient
      .from("user_subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    // Add an entry to the subscription history
    await supabaseClient
      .from("subscription_history")
      .insert({
        user_id: dbSubscription.user_id,
        plan_id: dbSubscription.plan_id,
        action: "updated",
        details: {
          cancel_at_period_end: true,
          updated_by: user.id,
        },
      });

    return new Response(
      JSON.stringify({ success: true, message: "Subscription will be canceled at the end of the billing period" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
