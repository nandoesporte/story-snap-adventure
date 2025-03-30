
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get base API URL based on environment
const getAsaasApiUrl = (environment: string) => {
  return environment === 'production' 
    ? 'https://www.asaas.com/api/v3' 
    : 'https://sandbox.asaas.com/api/v3';
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

    // Get request data
    const { user_id, plan_id, return_url } = await req.json();

    if (!user_id || !plan_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id and plan_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch Asaas API key and environment from system configurations
    const { data: apiKeyConfig, error: apiKeyError } = await supabaseClient
      .from("system_configurations")
      .select("value")
      .eq("key", "asaas_api_key")
      .single();

    if (apiKeyError || !apiKeyConfig?.value) {
      return new Response(
        JSON.stringify({ error: "Asaas API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: envConfig, error: envError } = await supabaseClient
      .from("system_configurations")
      .select("value")
      .eq("key", "asaas_environment")
      .single();

    // Default to sandbox if not configured
    const environment = envConfig?.value || "sandbox";
    const apiUrl = getAsaasApiUrl(environment);

    // Get user data
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select("email, full_name, cpf_cnpj, phone")
      .eq("id", user_id)
      .single();

    if (userError) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get subscription plan data
    const { data: planData, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError) {
      return new Response(
        JSON.stringify({ error: "Subscription plan not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Check if the customer already exists or create a new one
    let customerId = "";
    
    // First, try to find an existing customer with the user's email
    const findCustomerResponse = await fetch(`${apiUrl}/customers?email=${encodeURIComponent(userData.email)}`, {
      method: "GET",
      headers: {
        "access_token": apiKeyConfig.value,
        "Content-Type": "application/json",
      },
    });

    const findCustomerData = await findCustomerResponse.json();
    
    if (findCustomerData.data && findCustomerData.data.length > 0) {
      // Use existing customer
      customerId = findCustomerData.data[0].id;
    } else {
      // Create a new customer
      const createCustomerResponse = await fetch(`${apiUrl}/customers`, {
        method: "POST",
        headers: {
          "access_token": apiKeyConfig.value,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userData.full_name || `User ${user_id.substring(0, 8)}`,
          email: userData.email,
          phone: userData.phone || undefined,
          cpfCnpj: userData.cpf_cnpj || undefined,
          notificationDisabled: false,
        }),
      });

      const createCustomerData = await createCustomerResponse.json();
      
      if (createCustomerData.errors) {
        return new Response(
          JSON.stringify({ error: "Failed to create customer", details: createCustomerData.errors }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      customerId = createCustomerData.id;
    }

    // Step 2: Create the payment
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow
    
    const externalReference = JSON.stringify({
      user_id,
      plan_id,
    });

    const paymentData = {
      customer: customerId,
      billingType: "UNDEFINED", // This creates a payment link with multiple options
      value: planData.price,
      dueDate: dueDate.toISOString().split('T')[0],
      description: `Assinatura: ${planData.name}`,
      externalReference: externalReference,
      postalService: false,
    };

    const createPaymentResponse = await fetch(`${apiUrl}/payments`, {
      method: "POST",
      headers: {
        "access_token": apiKeyConfig.value,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    const paymentResult = await createPaymentResponse.json();
    
    if (paymentResult.errors) {
      return new Response(
        JSON.stringify({ error: "Failed to create payment", details: paymentResult.errors }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Get the payment link
    const paymentId = paymentResult.id;
    const getCheckoutResponse = await fetch(`${apiUrl}/payments/${paymentId}/identificationField`, {
      method: "GET",
      headers: {
        "access_token": apiKeyConfig.value,
        "Content-Type": "application/json",
      },
    });

    const checkoutResult = await getCheckoutResponse.json();
    
    if (!checkoutResult.invoiceUrl) {
      // If the direct link fails, try to get the regular payment link
      const getPaymentResponse = await fetch(`${apiUrl}/payments/${paymentId}`, {
        method: "GET",
        headers: {
          "access_token": apiKeyConfig.value,
          "Content-Type": "application/json",
        },
      });
      
      const paymentDetails = await getPaymentResponse.json();
      
      if (!paymentDetails.invoiceUrl) {
        return new Response(
          JSON.stringify({ error: "Failed to get payment checkout URL" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ url: paymentDetails.invoiceUrl }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ url: checkoutResult.invoiceUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating Asaas checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
