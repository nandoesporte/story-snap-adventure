
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

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
    console.log("Creating Supabase client...");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );
    console.log("Supabase client created successfully");

    // Get request data
    const requestData = await req.json();
    console.log("Request data:", requestData);
    
    const { user_id, plan_id, return_url } = requestData;

    if (!user_id || !plan_id) {
      console.error("Missing required fields", { user_id, plan_id });
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id and plan_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch Asaas API key and environment from system configurations
    console.log("Fetching Asaas API key...");
    const { data: apiKeyConfig, error: apiKeyError } = await supabaseClient
      .from("system_configurations")
      .select("value")
      .eq("key", "asaas_api_key")
      .single();

    if (apiKeyError || !apiKeyConfig?.value) {
      console.error("API key error:", apiKeyError);
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
    console.log("Using API URL:", apiUrl);

    // Get user data
    console.log("Fetching user data...");
    const { data: userData, error: userError } = await supabaseClient
      .from("user_profiles")
      .select("display_name, id")
      .eq("id", user_id)
      .single();

    // Get auth user data
    const { data: authData, error: authError } = await supabaseClient
      .auth.admin.getUserById(user_id);

    if (userError || !userData || authError || !authData?.user) {
      console.error("User data error:", userError || authError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userEmail = authData.user.email;
    const userName = userData.display_name || authData.user.email.split('@')[0];

    // Get subscription plan data
    console.log("Fetching plan data...");
    const { data: planData, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !planData) {
      console.error("Plan error:", planError);
      return new Response(
        JSON.stringify({ error: "Subscription plan not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Plan found:", planData.name);

    // Step 1: Check if the customer already exists or create a new one
    let customerId = "";
    
    // First, try to find an existing customer with the user's email
    console.log("Checking for existing customer with email:", userEmail);
    const findCustomerResponse = await fetch(`${apiUrl}/customers?email=${encodeURIComponent(userEmail)}`, {
      method: "GET",
      headers: {
        "access_token": apiKeyConfig.value,
        "Content-Type": "application/json",
      },
    });

    const findCustomerData = await findCustomerResponse.json();
    console.log("Find customer response:", findCustomerData);
    
    if (findCustomerData.data && findCustomerData.data.length > 0) {
      // Use existing customer
      customerId = findCustomerData.data[0].id;
      console.log("Using existing customer ID:", customerId);
    } else {
      // Create a new customer
      console.log("Creating new customer...");
      const createCustomerResponse = await fetch(`${apiUrl}/customers`, {
        method: "POST",
        headers: {
          "access_token": apiKeyConfig.value,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userName || `User ${user_id.substring(0, 8)}`,
          email: userEmail,
          notificationDisabled: false,
        }),
      });

      const createCustomerData = await createCustomerResponse.json();
      console.log("Create customer response:", createCustomerData);
      
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
      console.log("New customer created with ID:", customerId);
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
      description: `Assinatura: ${planData.name} (${planData.interval === 'month' ? 'Mensal' : 'Anual'})`,
      externalReference: externalReference,
      postalService: false,
    };

    console.log("Creating payment with data:", paymentData);
    const createPaymentResponse = await fetch(`${apiUrl}/payments`, {
      method: "POST",
      headers: {
        "access_token": apiKeyConfig.value,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    const paymentResult = await createPaymentResponse.json();
    console.log("Payment creation response:", paymentResult);
    
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
    console.log("Getting checkout URL for payment ID:", paymentId);
    const getPaymentResponse = await fetch(`${apiUrl}/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "access_token": apiKeyConfig.value,
        "Content-Type": "application/json",
      },
    });
    
    const paymentDetails = await getPaymentResponse.json();
    console.log("Payment details:", paymentDetails);

    if (!paymentDetails.invoiceUrl) {
      console.error("Invoice URL not found in payment details");
      return new Response(
        JSON.stringify({ error: "Failed to get payment checkout URL" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log("Returning invoice URL:", paymentDetails.invoiceUrl);
    return new Response(
      JSON.stringify({ url: paymentDetails.invoiceUrl }),
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
