
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

  // Create a Supabase client with the auth header - using the correct format
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_ANON_KEY") || "",
    {
      auth: { 
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: { 
        headers: { 
          Authorization: authHeader 
        } 
      }
    }
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

  // Check if user is admin
  const { data: userProfile, error: profileError } = await supabaseClient
    .from("user_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !userProfile || !userProfile.is_admin) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Admin access required" }),
      {
        status: 403,
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
    
    const { action, productId, productData } = await req.json();

    switch (action) {
      case "get_products":
        const products = await stripe.products.list({
          active: true,
          limit: 100,
        });
        return new Response(
          JSON.stringify({ products: products.data }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );

      case "get_prices":
        const prices = await stripe.prices.list({
          active: true,
          limit: 100,
        });
        return new Response(
          JSON.stringify({ prices: prices.data }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );

      case "sync_plans":
        // Get all subscription plans from database
        const { data: plans, error: plansError } = await supabaseClient
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true);

        if (plansError) {
          throw new Error(`Error fetching plans: ${plansError.message}`);
        }

        // Get all products from Stripe
        const stripeProducts = await stripe.products.list({
          active: true,
          limit: 100,
        });

        // Get all prices from Stripe
        const stripePrices = await stripe.prices.list({
          active: true,
          limit: 100,
        });

        // Update plans in the database with Stripe product and price IDs
        for (const plan of plans) {
          // Find matching product in Stripe by name
          const matchingProduct = stripeProducts.data.find(
            (product) => product.name === plan.name
          );

          if (matchingProduct) {
            // Find matching price in Stripe
            const matchingPrice = stripePrices.data.find(
              (price) =>
                price.product === matchingProduct.id &&
                price.recurring?.interval === plan.interval
            );

            if (matchingPrice) {
              // Update plan with Stripe IDs
              await supabaseClient
                .from("subscription_plans")
                .update({
                  stripe_product_id: matchingProduct.id,
                  stripe_price_id: matchingPrice.id,
                })
                .eq("id", plan.id);
            }
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );

      case "create_product":
        if (!productData) {
          throw new Error("Missing product data");
        }

        // Create product in Stripe
        const newProduct = await stripe.products.create({
          name: productData.name,
          description: productData.description || "",
          active: productData.is_active,
          metadata: {
            stories_limit: productData.stories_limit.toString(),
          },
        });

        // Create price in Stripe
        const newPrice = await stripe.prices.create({
          product: newProduct.id,
          unit_amount: Math.round(productData.price * 100), // Convert to cents
          currency: productData.currency || "BRL",
          recurring: {
            interval: productData.interval || "month",
          },
        });

        return new Response(
          JSON.stringify({
            product: newProduct,
            price: newPrice,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );

      case "update_product":
        if (!productId || !productData) {
          throw new Error("Missing product ID or data");
        }

        // Update product in Stripe
        const updatedProduct = await stripe.products.update(productId, {
          name: productData.name,
          description: productData.description || "",
          active: productData.is_active,
          metadata: {
            stories_limit: productData.stories_limit.toString(),
          },
        });

        // Note: Stripe doesn't allow updating prices, we would need to create a new one
        // and archive the old one if price information changes

        return new Response(
          JSON.stringify({
            product: updatedProduct,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Error in admin-stripe-sync:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
