
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

    // Get the webhook payload
    const payload = await req.json();
    console.log("Received Asaas webhook:", JSON.stringify(payload));

    // Extract the event and payment information
    const event = payload.event;
    const payment = payload.payment;

    if (!event || !payment) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Reference to find the subscription plan and user
    const externalReference = payment.externalReference;
    if (!externalReference) {
      console.warn("No external reference found in payment");
      return new Response(
        JSON.stringify({ error: "No external reference found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the external reference to get user_id and plan_id
    let userId, planId;
    try {
      const referenceData = JSON.parse(externalReference);
      userId = referenceData.user_id;
      planId = referenceData.plan_id;
    } catch (error) {
      console.error("Error parsing external reference:", error);
      return new Response(
        JSON.stringify({ error: "Invalid external reference format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!userId || !planId) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or plan_id in external reference" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get subscription plan details
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError) {
      console.error("Error fetching subscription plan:", planError);
      return new Response(
        JSON.stringify({ error: "Subscription plan not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Process the payment based on the event
    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        // Create or update the user subscription
        const now = new Date();
        const interval = plan.interval === "month" ? 1 : 12; // Convert to months
        const expirationDate = new Date(now);
        expirationDate.setMonth(now.getMonth() + interval);

        // Check if the user already has a subscription
        const { data: existingSubscription, error: fetchError } = await supabaseClient
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error checking existing subscription:", fetchError);
        }

        let subscriptionData = {
          user_id: userId,
          subscription_plan_id: planId,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: expirationDate.toISOString(),
          asaas_payment_id: payment.id,
          asaas_customer_id: payment.customer,
          metadata: {
            payment_id: payment.id,
            payment_date: payment.dateCreated,
            payment_value: payment.value,
            payment_method: payment.billingType,
            asaas_event: event,
          },
        };

        let result;
        if (existingSubscription) {
          // Update existing subscription
          const { data, error } = await supabaseClient
            .from("user_subscriptions")
            .update(subscriptionData)
            .eq("id", existingSubscription.id)
            .select();

          if (error) {
            console.error("Error updating subscription:", error);
            throw error;
          }
          
          result = data;
          console.log("Updated subscription:", existingSubscription.id);
        } else {
          // Create new subscription
          const { data, error } = await supabaseClient
            .from("user_subscriptions")
            .insert(subscriptionData)
            .select();

          if (error) {
            console.error("Error creating subscription:", error);
            throw error;
          }
          
          result = data;
          console.log("Created new subscription");
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Subscription activated",
            data: result,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );

      case "PAYMENT_OVERDUE":
      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED":
      case "PAYMENT_REFUND_REQUESTED":
        // Update subscription to inactive
        const { data, error } = await supabaseClient
          .from("user_subscriptions")
          .update({
            status: "inactive",
            metadata: {
              asaas_event: event,
              payment_id: payment.id,
              update_date: new Date().toISOString(),
            },
          })
          .eq("user_id", userId)
          .eq("asaas_payment_id", payment.id)
          .select();

        if (error) {
          console.error("Error deactivating subscription:", error);
          throw error;
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Subscription deactivated",
            data,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );

      default:
        // Log event for future reference
        console.log(`Unhandled Asaas event: ${event}`);
        return new Response(
          JSON.stringify({
            success: true,
            message: "Event received but not processed",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Error processing Asaas webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
