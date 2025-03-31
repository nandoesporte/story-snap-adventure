import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const mpWebhookSecret = Deno.env.get("mercadopago-webhook") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Process MercadoPago webhook events
const handleWebhook = async (req: Request): Promise<Response> => {
  try {
    // First validate the webhook secret to ensure the request is legitimate
    const authHeader = req.headers.get("x-webhook-secret");
    
    if (!authHeader || authHeader !== mpWebhookSecret) {
      console.error("Invalid webhook secret:", authHeader);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the webhook payload
    const payload = await req.json();
    console.log("Received MercadoPago webhook:", JSON.stringify(payload));

    // Process the webhook based on type
    const topic = payload.type;
    const data = payload.data;

    if (topic === 'payment') {
      // Handle payment notification
      const paymentData = data;
      console.log("Received payment notification:", JSON.stringify(paymentData));

      // Get payment details from subscription record
      const { data: subscription, error: subscriptionError } = await supabase
        .from("user_subscriptions")
        .select(`
          id, 
          user_id, 
          plan_id,
          subscription_plans(*)
        `)
        .eq("mercadopago_payment_id", paymentData.id)
        .single();
      
      if (subscriptionError) {
        console.error("Error finding subscription for payment:", subscriptionError);
        return new Response(
          JSON.stringify({ error: "Subscription not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (!subscription) {
        console.error("No subscription found for payment ID:", paymentData.id);
        return new Response(
          JSON.stringify({ error: "Subscription not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("Found subscription:", subscription);
      
      // Based on the payment status, update the subscription status
      const status = paymentData.status;
      
      if (status === "approved") {
        console.log("Payment approved, activating subscription");
        
        // Set the subscription to active
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            status: "active",
            current_period_start: new Date().toISOString(),
            // Set end date based on the subscription plan interval
            current_period_end: (() => {
              const endDate = new Date();
              if (subscription.subscription_plans?.interval === "month") {
                endDate.setMonth(endDate.getMonth() + 1);
              } else if (subscription.subscription_plans?.interval === "year") {
                endDate.setFullYear(endDate.getFullYear() + 1);
              }
              return endDate.toISOString();
            })(),
          })
          .eq("id", subscription.id);
        
        if (updateError) {
          console.error("Error updating subscription status:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update subscription" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Reset the stories count for this billing period
        // This ensures the user can start fresh with their subscription credits
        // We could also update a user_profiles record to track this if needed
        
        // Log the transaction in subscription_history
        const { error: historyError } = await supabase
          .from("subscription_history")
          .insert({
            user_id: subscription.user_id,
            plan_id: subscription.plan_id,
            action: "created",
            details: { payment_id: paymentData.id, status }
          });
        
        if (historyError) {
          console.error("Error logging subscription history:", historyError);
        }
        
        console.log("Subscription activated successfully");
        
        // Reset the stories_created_count for the user when subscription is activated
        await supabase.rpc('reset_user_story_count', { user_uuid: subscription.user_id });
        
        console.log(`Reset stories count for user ${subscription.user_id}`);
      } else if (["rejected", "cancelled", "refunded"].includes(status)) {
        console.log(`Payment ${status}, setting subscription to inactive`);
        
        // Set the subscription to inactive
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            status: "canceled",
          })
          .eq("id", subscription.id);
        
        if (updateError) {
          console.error("Error updating subscription status:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update subscription" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Log the transaction in subscription_history
        const { error: historyError } = await supabase
          .from("subscription_history")
          .insert({
            user_id: subscription.user_id,
            plan_id: subscription.plan_id,
            action: "failed",
            details: { payment_id: paymentData.id, status }
          });
        
        if (historyError) {
          console.error("Error logging subscription history:", historyError);
        }
        
        console.log("Subscription marked as canceled due to payment failure");
      }
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return handleWebhook(req);
});
