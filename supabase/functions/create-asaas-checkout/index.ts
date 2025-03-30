
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

    // First try to get the user from auth.users using the admin auth API
    console.log("Fetching user data...");
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(user_id);

    if (userError || !userData?.user) {
      console.error("Error fetching user from auth:", userError);
      
      // Fallback to user_profiles table for display_name only, not email
      const { data: profileData, error: profileError } = await supabaseClient
        .from("user_profiles")
        .select("display_name")
        .eq("id", user_id)
        .single();
        
      if (profileError || !profileData) {
        console.error("Profile data error:", profileError);
        return new Response(
          JSON.stringify({ error: "User not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Generate a fallback email since we couldn't get the real one
      const userEmail = `user-${user_id.substring(0, 8)}@example.com`;
      const userName = profileData.display_name || userEmail.split('@')[0];
      
      return await handlePaymentCreation(
        apiKeyConfig.value,
        apiUrl,
        corsHeaders,
        userEmail,
        userName,
        user_id,
        plan_id,
        supabaseClient,
        return_url
      );
    }
    
    // We successfully got the user data from auth
    const userEmail = userData.user.email || `user-${user_id.substring(0, 8)}@example.com`;
    const userName = userData.user.user_metadata?.name || userEmail.split('@')[0];
    
    return await handlePaymentCreation(
      apiKeyConfig.value,
      apiUrl,
      corsHeaders,
      userEmail,
      userName,
      user_id,
      plan_id,
      supabaseClient,
      return_url
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

// Helper function to handle payment creation
async function handlePaymentCreation(
  accessToken: string,
  apiUrl: string,
  corsHeaders: any,
  userEmail: string,
  userName: string,
  user_id: string,
  plan_id: string,
  supabaseClient: any,
  return_url?: string
) {
  try {
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
    
    try {
      // First, try to find an existing customer with the user's email
      console.log("Checking for existing customer with email:", userEmail);
      
      if (!accessToken) {
        throw new Error("Invalid API key configuration");
      }
      
      const findCustomerResponse = await fetch(`${apiUrl}/customers?email=${encodeURIComponent(userEmail)}`, {
        method: "GET",
        headers: {
          "access_token": accessToken,
          "Content-Type": "application/json",
        },
      });
      
      if (!findCustomerResponse.ok) {
        const errorText = await findCustomerResponse.text();
        console.error("Error finding customer:", errorText);
        throw new Error(`Failed to find customer: ${findCustomerResponse.status}`);
      }

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
            "access_token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: userName || `User ${user_id.substring(0, 8)}`,
            email: userEmail,
            notificationDisabled: false,
          }),
        });
        
        if (!createCustomerResponse.ok) {
          const errorText = await createCustomerResponse.text();
          console.error("Error creating customer:", errorText);
          throw new Error(`Failed to create customer: ${createCustomerResponse.status}`);
        }

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

      // Add return URL if provided
      if (return_url) {
        paymentData["callbackUrl"] = return_url;
      }

      console.log("Creating payment with data:", paymentData);
      const createPaymentResponse = await fetch(`${apiUrl}/payments`, {
        method: "POST",
        headers: {
          "access_token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!createPaymentResponse.ok) {
        const errorText = await createPaymentResponse.text();
        console.error("Error creating payment:", errorText);
        throw new Error(`Failed to create payment: ${createPaymentResponse.status}`);
      }

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
          "access_token": accessToken,
          "Content-Type": "application/json",
        },
      });
      
      if (!getPaymentResponse.ok) {
        const errorText = await getPaymentResponse.text();
        console.error("Error getting payment details:", errorText);
        throw new Error(`Failed to get payment details: ${getPaymentResponse.status}`);
      }
      
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
      console.error("API processing error:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Failed to process payment" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create payment" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        
      }
    );
  }
}
