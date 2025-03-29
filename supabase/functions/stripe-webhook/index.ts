
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";
import Stripe from "https://esm.sh/stripe@11.18.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === "POST") {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        // Get customer info
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const metadata = session.metadata || {};
        const userId = metadata.userId;
        const planId = metadata.planId;
        
        if (!userId || !planId) {
          console.error("Missing userId or planId in metadata");
          break;
        }
        
        // Retrieve subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Create or update user subscription in database
        const { data: existingSubscription, error: fetchError } = await supabase
          .from("user_subscriptions")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "active")
          .single();
          
        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error fetching existing subscription:", fetchError);
        }
        
        if (existingSubscription) {
          // Update existing subscription to canceled if it's different
          await supabase
            .from("user_subscriptions")
            .update({ status: "canceled" })
            .eq("id", existingSubscription.id);
        }
        
        // Create new subscription
        const { data: newSubscription, error: insertError } = await supabase
          .from("user_subscriptions")
          .insert({
            user_id: userId,
            plan_id: planId,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId
          })
          .select("id")
          .single();
          
        if (insertError) {
          console.error("Error inserting new subscription:", insertError);
          break;
        }
        
        // Update user profile with subscription
        await supabase
          .from("user_profiles")
          .update({ subscription_id: newSubscription.id })
          .eq("id", userId);
          
        // Add entry to subscription history
        await supabase
          .from("subscription_history")
          .insert({
            user_id: userId,
            plan_id: planId,
            action: "created",
            details: { 
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId
            }
          });
        
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const stripeSubscriptionId = subscription.id;
        
        // Get user subscription from database
        const { data: userSubscription, error: fetchError } = await supabase
          .from("user_subscriptions")
          .select("id, user_id, plan_id")
          .eq("stripe_subscription_id", stripeSubscriptionId)
          .single();
          
        if (fetchError) {
          console.error("Error fetching user subscription:", fetchError);
          break;
        }
        
        // Update subscription status
        await supabase
          .from("user_subscriptions")
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          })
          .eq("id", userSubscription.id);
          
        // Add entry to subscription history
        await supabase
          .from("subscription_history")
          .insert({
            user_id: userSubscription.user_id,
            plan_id: userSubscription.plan_id,
            action: "updated",
            details: { 
              stripe_subscription_id: stripeSubscriptionId,
              status: subscription.status,
              cancel_at_period_end: subscription.cancel_at_period_end
            }
          });
        
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const stripeSubscriptionId = subscription.id;
        
        // Get user subscription from database
        const { data: userSubscription, error: fetchError } = await supabase
          .from("user_subscriptions")
          .select("id, user_id, plan_id")
          .eq("stripe_subscription_id", stripeSubscriptionId)
          .single();
          
        if (fetchError) {
          console.error("Error fetching user subscription:", fetchError);
          break;
        }
        
        // Update subscription status to canceled
        await supabase
          .from("user_subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString()
          })
          .eq("id", userSubscription.id);
          
        // Remove subscription from user profile
        await supabase
          .from("user_profiles")
          .update({ subscription_id: null })
          .eq("id", userSubscription.user_id);
          
        // Add entry to subscription history
        await supabase
          .from("subscription_history")
          .insert({
            user_id: userSubscription.user_id,
            plan_id: userSubscription.plan_id,
            action: "canceled",
            details: { 
              stripe_subscription_id: stripeSubscriptionId
            }
          });
        
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
});
