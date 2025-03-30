
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

    // Get user information (name and email)
    let userEmail = "";
    let userName = "";
    
    // Try to get information from user_profiles table first
    try {
      console.log("Fetching user profile data...");
      const { data: profileData, error: profileError } = await supabaseClient
        .from("user_profiles")
        .select("display_name")
        .eq("id", user_id)
        .single();
        
      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        // We'll continue and try auth method next
      } else if (profileData) {
        userName = profileData.display_name || `User ${user_id.substring(0, 8)}`;
      }
    } catch (profileError) {
      console.error("Unexpected error fetching user profile:", profileError);
    }
    
    // Try to get email from auth.users table directly (without admin privileges)
    try {
      console.log("Fetching user from auth table...");
      const { data: authData, error: authError } = await supabaseClient
        .from("users")
        .select("email")
        .eq("id", user_id)
        .single();
        
      if (authError) {
        console.error("Error fetching user from auth table:", authError);
      } else if (authData?.email) {
        userEmail = authData.email;
      }
    } catch (authError) {
      console.error("Error fetching from auth table:", authError);
    }
    
    // If we still don't have a valid email, generate a fallback
    if (!userEmail) {
      userEmail = `user-${user_id.substring(0, 8)}@example.com`;
      console.log("Using fallback email:", userEmail);
    }
    
    // If we still don't have a valid name, generate a fallback from email or user_id
    if (!userName) {
      userName = userEmail.split('@')[0] || `User ${user_id.substring(0, 8)}`;
      console.log("Using fallback username:", userName);
    }

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

    // Process payment with Asaas
    const result = await processAsaasPayment(
      apiKeyConfig.value,
      apiUrl,
      corsHeaders,
      userEmail,
      userName,
      user_id,
      plan_id,
      planData,
      return_url
    );
    
    return result;
  } catch (error) {
    console.error("Error creating Asaas checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function processAsaasPayment(
  accessToken: string,
  apiUrl: string,
  corsHeaders: any,
  userEmail: string,
  userName: string,
  user_id: string,
  plan_id: string,
  planData: any,
  return_url?: string
) {
  try {
    let customerId = "";
    
    // Validate API key before making any requests
    try {
      console.log("Validating API key...");
      const testResponse = await fetch(`${apiUrl}/customers?limit=1`, {
        method: "GET",
        headers: {
          "access_token": accessToken,
          "Content-Type": "application/json",
        },
      });
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error("API key validation failed:", errorText);
        return new Response(
          JSON.stringify({ 
            error: "Invalid Asaas API key or connection issue", 
            details: `Status: ${testResponse.status}` 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.log("API key validated successfully");
    } catch (validationError) {
      console.error("API validation error:", validationError);
      return new Response(
        JSON.stringify({ error: "Failed to validate Asaas API connection" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Step 1: Check if the customer already exists or create a new one
    try {
      // First, try to find an existing customer with the user's email
      console.log("Checking for existing customer with email:", userEmail);
      const findCustomerUrl = `${apiUrl}/customers?email=${encodeURIComponent(userEmail)}`;
      console.log("Making request to:", findCustomerUrl);
      
      const findCustomerResponse = await fetch(findCustomerUrl, {
        method: "GET",
        headers: {
          "access_token": accessToken,
          "Content-Type": "application/json",
        },
      });
      
      if (!findCustomerResponse.ok) {
        const errorText = await findCustomerResponse.text();
        console.error("Error finding customer:", errorText);
        
        // Create a new customer immediately if we can't find existing one
        console.log("Creating new customer due to search error...");
        const createCustomerResponse = await fetch(`${apiUrl}/customers`, {
          method: "POST",
          headers: {
            "access_token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: userName,
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
      } else {
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
              name: userName,
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
      }

      // Step 2: Create the payment
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow
      
      const externalReference = JSON.stringify({
        user_id,
        plan_id,
      });

      const paymentData: any = {
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
