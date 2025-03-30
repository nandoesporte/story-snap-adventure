
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";

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
      
      if (retries >= maxRetries || 
          !(error.status === 429 || error.status === 500 || error.status === 503)) {
        throw error;
      }
      
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
    console.log("MercadoPago webhook received");
    
    // Parse the webhook payload
    let payload;
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const text = await req.text();
      try {
        payload = JSON.parse(text);
      } catch (error) {
        console.error("Failed to parse webhook payload as JSON:", text);
        payload = { raw: text };
      }
    }
    
    console.log("Received Mercado Pago webhook:", JSON.stringify(payload));

    // Handle test requests from MercadoPago
    if (payload.type === "test" || 
        (payload.data && payload.data.id === "123456") || 
        payload.id === "123456" ||
        payload.action === "payment.updated" ||
        payload.type === "ping") {
      console.log("Received test webhook from MercadoPago");
      
      return new Response(
        JSON.stringify({ success: true, message: "Test webhook received successfully" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceRole) {
      console.error("Missing Supabase environment variables");
      throw new Error("Server configuration error: Missing environment variables");
    }

    // Create admin client with service role key - no authentication required
    const supabase = createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Process the webhook based on the event type
    if (payload.type === "payment" || (payload.data && payload.data.id)) {
      const paymentId = payload.data?.id;
      
      if (!paymentId) {
        throw new Error("Missing payment ID in webhook payload");
      }
      
      // Get Mercado Pago API key
      const { data: configData, error: configError } = await supabase
        .from("system_configurations")
        .select("value")
        .eq("key", "mercadopago_access_token")
        .single();
      
      if (configError || !configData?.value) {
        console.error("Error fetching Mercado Pago API key:", configError);
        throw new Error("Mercado Pago API key not configured");
      }
      
      // Fetch payment details with retry logic
      try {
        const mpResponse = await retryWithBackoff(() => fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            "Authorization": `Bearer ${configData.value}`,
            "Content-Type": "application/json"
          }
        }));
        
        if (!mpResponse.ok) {
          console.error(`Failed to fetch payment details: ${mpResponse.status} ${mpResponse.statusText}`);
          const responseText = await mpResponse.text();
          console.error("Response:", responseText);
          throw new Error(`Failed to fetch payment details: ${mpResponse.statusText}`);
        }
        
        const payment = await mpResponse.json();
        console.log("Payment details:", JSON.stringify(payment));
        
        // Extract metadata and other important information
        const metadata = payment.metadata || {};
        const userId = metadata.userId;
        const planId = metadata.planId;
        const status = payment.status;
        
        if (!userId || !planId) {
          console.warn("Missing user ID or plan ID in payment metadata:", metadata);
          throw new Error("Missing user ID or plan ID in payment metadata");
        }
        
        // Process the payment based on status
        if (status === "approved") {
          // Process approved payment
          await processApprovedPayment(supabase, userId, planId, payment);
        } else if (status === "cancelled" || status === "rejected") {
          // Handle failed payment
          await supabase
            .from("subscription_history")
            .insert({
              user_id: userId,
              plan_id: planId,
              action: "failed",
              details: {
                payment_provider: "mercadopago",
                payment_id: payment.id,
                status: status,
                reason: payment.status_detail
              }
            });
            
          console.log(`Payment ${payment.id} failed with status ${status}`);
        }
      } catch (paymentError) {
        console.error("Error processing payment:", paymentError);
        // Log the error but don't throw, as we still want to return 200 to Mercado Pago
      }
    } else {
      console.log("Unhandled webhook event type:", payload.type || "unknown");
    }

    // Return a success response
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing Mercado Pago webhook:", error);
    
    // Always return 200 status to prevent MercadoPago from retrying
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 200, // Return 200 even for errors to prevent retries
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function processApprovedPayment(supabase, userId, planId, payment) {
  try {
    // 1. Get plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();
      
    if (planError || !plan) {
      throw new Error(`Failed to fetch plan details: ${planError?.message || "Plan not found"}`);
    }
    
    // 2. Calculate subscription dates
    const now = new Date();
    const currentPeriodStart = now.toISOString();
    
    const currentPeriodEnd = new Date();
    if (plan.interval === "month") {
      currentPeriodEnd.setMonth(now.getMonth() + 1);
    } else if (plan.interval === "year") {
      currentPeriodEnd.setFullYear(now.getFullYear() + 1);
    }
    
    // 3. Check if user already has a subscription
    const { data: existingSubscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
      
    if (subError) {
      throw new Error(`Failed to check existing subscriptions: ${subError.message}`);
    }
    
    // 4. Create or update subscription
    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          plan_id: planId,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd.toISOString(),
          status: "active",
          mercadopago_payment_id: payment.id.toString()
        })
        .eq("id", existingSubscription.id);
        
      if (updateError) {
        throw new Error(`Failed to update subscription: ${updateError.message}`);
      }
      
      // Log subscription update to history
      await supabase
        .from("subscription_history")
        .insert({
          user_id: userId,
          plan_id: planId,
          action: "updated",
          details: {
            payment_provider: "mercadopago",
            payment_id: payment.id,
            amount: payment.transaction_amount,
            currency: payment.currency_id
          }
        });
    } else {
      // Create new subscription
      const { data: newSubscription, error: insertError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          plan_id: planId,
          status: "active",
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd.toISOString(),
          mercadopago_payment_id: payment.id.toString()
        })
        .select()
        .single();
        
      if (insertError) {
        throw new Error(`Failed to create subscription: ${insertError.message}`);
      }
      
      // Log subscription creation to history
      await supabase
        .from("subscription_history")
        .insert({
          user_id: userId,
          plan_id: planId,
          action: "created",
          details: {
            payment_provider: "mercadopago",
            payment_id: payment.id,
            amount: payment.transaction_amount,
            currency: payment.currency_id
          }
        });
        
      // Update user profile with subscription id
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({ subscription_id: newSubscription.id })
        .eq("id", userId);
        
      if (profileError) {
        console.error(`Failed to update user profile: ${profileError.message}`);
        // Continue anyway since the subscription was created successfully
      }
    }
    
    console.log(`Successfully processed payment ${payment.id} for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error in processApprovedPayment:", error);
    throw error;
  }
}
