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

// Enhanced validation function with better error handling and more specific validation
async function validateAsaasApiKey(apiKey: string, apiUrl: string) {
  try {
    console.log("Starting API key validation process");
    
    // Validate API key format first
    if (!apiKey || apiKey.trim() === '') {
      return { 
        valid: false, 
        error: "Chave de API não configurada", 
        details: "Configure uma chave de API do Asaas nas configurações do sistema",
        status: 400
      };
    }

    // Mais flexível para aceitar diferentes formatos de chave de API do Asaas
    const apiKeyPattern = /^\$aact_[a-zA-Z0-9_]+/;
    if (!apiKeyPattern.test(apiKey)) {
      return { 
        valid: false, 
        error: "Formato de chave API inválido", 
        details: "A chave API do Asaas deve começar com $aact_ seguido por caracteres válidos",
        status: 400
      };
    }
    
    // Verificação menos restritiva sobre o tipo de ambiente
    const isSandboxKey = apiKey.includes('sandbox') || apiKey.includes('hmlg');
    const isSandboxEnvironment = apiUrl.includes('sandbox');
    
    // Vamos registrar para debugging, mas não vamos mais bloquear por incompatibilidade de ambiente
    if (isSandboxKey && !isSandboxEnvironment) {
      console.log("AVISO: Você está usando uma chave de sandbox/homologação no ambiente de produção");
    }
    
    if (!isSandboxKey && isSandboxEnvironment) {
      console.log("AVISO: Você está usando uma chave de produção no ambiente de sandbox");
    }
    
    console.log("API key format validation passed, now testing connectivity");
    
    // Using the correct header format according to Asaas documentation
    // https://docs.asaas.com/reference/criar-novo-cliente
    console.log("Validating Asaas API key using customers endpoint...");
    
    const testResponse = await fetch(`${apiUrl}/customers?limit=1`, {
      method: "GET",
      headers: {
        "access_token": apiKey,
        "Content-Type": "application/json"
      },
    });
    
    // Try to get detailed error information
    let responseText = '';
    try {
      responseText = await testResponse.text();
      console.log(`Validation response: ${responseText}`);
    } catch (e) {
      console.error("Could not read response text:", e);
    }
    
    if (testResponse.ok) {
      console.log("API key validation successful with customers endpoint");
      return { valid: true };
    }
    
    // Check for specific error signatures
    if (testResponse.status === 401 || responseText.includes("invalid_token") || responseText.includes("token inválido")) {
      return { 
        valid: false, 
        error: "API key inválida", 
        details: "A chave de API fornecida é inválida ou expirou. Verifique no portal do Asaas.",
        status: 401
      };
    } else if (testResponse.status === 403 || responseText.includes("permiss")) {
      return { 
        valid: false, 
        error: "Erro de permissão na API do Asaas", 
        details: "Sua chave de API não tem as permissões necessárias. Verifique as permissões na sua conta Asaas.",
        status: 403
      };
    }
    
    // Try another endpoint as a fallback
    console.log("Trying another validation endpoint (balance)...");
    const balanceResponse = await fetch(`${apiUrl}/finance/balance`, {
      method: "GET",
      headers: {
        "access_token": apiKey,
        "Content-Type": "application/json"
      },
    });
    
    if (balanceResponse.ok) {
      console.log("API key validation successful with balance endpoint");
      return { valid: true };
    }
    
    // Generic error for other cases
    return { 
      valid: false, 
      error: "Falha na validação da API do Asaas", 
      details: `Código de status: ${testResponse.status}. Verifique sua API key e configurações no portal do Asaas.`,
      status: 500
    };
  } catch (error) {
    console.error("Unexpected error validating Asaas API key:", error);
    return { 
      valid: false, 
      error: "Erro na conexão com a API do Asaas", 
      details: "Não foi possível conectar ao serviço Asaas. Verifique sua conexão e tente novamente.",
      status: 500
    };
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
      .maybeSingle();

    if (apiKeyError || !apiKeyConfig?.value) {
      console.error("API key error:", apiKeyError);
      return new Response(
        JSON.stringify({ 
          error: "Chave de API do Asaas não configurada", 
          details: "Configure a chave de API do Asaas nas configurações do sistema" 
        }),
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
      .maybeSingle();

    // Default to sandbox if not configured
    const environment = envConfig?.value || "sandbox";
    const apiUrl = getAsaasApiUrl(environment);
    console.log("Using API URL:", apiUrl);
    
    // Enhanced validation of the API key before proceeding
    console.log("Validating Asaas API key...");
    const validationResult = await validateAsaasApiKey(apiKeyConfig.value, apiUrl);
    
    if (!validationResult.valid) {
      console.error("API key validation failed:", validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: validationResult.error, 
          details: validationResult.details 
        }),
        {
          status: validationResult.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log("API key validation successful");

    // Get user information (name and email) - MODIFIED APPROACH
    let userEmail = "";
    let userName = "";
    
    // Try to get user information from user_profiles table
    try {
      console.log("Fetching user profile data...");
      const { data: profileData, error: profileError } = await supabaseClient
        .from("user_profiles")
        .select("display_name")
        .eq("id", user_id)
        .maybeSingle();
        
      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        // We'll fallback to default values later
      } else if (profileData) {
        userName = profileData.display_name || `User ${user_id.substring(0, 8)}`;
      }
    } catch (profileError) {
      console.error("Unexpected error fetching user profile:", profileError);
    }
    
    // Try to get user email from auth.users using the session
    console.log("Fetching user email from session data...");
    try {
      // Get the authorization header from the request
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
          // Set the auth token to get the user's session
          supabaseClient.auth.setSession({
            access_token: token,
            refresh_token: '',
          });
          
          // Get the user session
          const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
          if (sessionError) {
            console.error("Error getting session:", sessionError);
          } else if (sessionData?.session?.user?.email) {
            userEmail = sessionData.session.user.email;
            console.log("Found email from session:", userEmail);
            
            // If we don't have a name yet, try to get it from metadata
            if (!userName && sessionData.session.user.user_metadata?.name) {
              userName = sessionData.session.user.user_metadata.name;
            }
          }
        }
      }
    } catch (authError) {
      console.error("Failed to fetch user email from session:", authError);
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
      .maybeSingle();

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

    return await processAsaasPayment(
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
  } catch (error) {
    console.error("Error creating Asaas checkout:", error);
    
    let errorMessage = "Erro desconhecido";
    try {
      if (error.message) {
        errorMessage = error.message;
      }
    } catch (e) {
      // Ignore errors when extracting message
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
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
    
    // Step 1: Check if the customer already exists or create a new one
    try {
      // Now search for existing customer
      console.log("Checking for existing customer with email:", userEmail);
      const findCustomerUrl = `${apiUrl}/customers?email=${encodeURIComponent(userEmail)}`;
      
      try {
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
          
          // Check for specific permission errors
          if (errorText.includes("permissões necessárias") || errorText.includes("permissions") || findCustomerResponse.status === 403) {
            return new Response(
              JSON.stringify({ 
                error: "Erro de permissão na API do Asaas", 
                details: "Sua chave de API não tem permissão para consultar clientes."
              }),
              {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          
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
              name: userName,
              email: userEmail,
              notificationDisabled: false,
            }),
          });
          
          if (!createCustomerResponse.ok) {
            const errorText = await createCustomerResponse.text();
            console.error("Error creating customer:", errorText);
            
            // Check for permission errors
            if (errorText.includes("permissões necessárias") || errorText.includes("permissions") || createCustomerResponse.status === 403) {
              return new Response(
                JSON.stringify({ 
                  error: "Erro de permissão na API do Asaas", 
                  details: "Sua chave de API não tem permissão para criar clientes."
                }),
                {
                  status: 403,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
              );
            }
            
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
      } catch (customerError) {
        console.error("Customer processing error:", customerError);
        return new Response(
          JSON.stringify({ error: "Failed to process customer data", details: customerError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
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
      try {
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
          
          // Check for permission errors
          if (errorText.includes("permissões necessárias") || errorText.includes("permissions") || createPaymentResponse.status === 403) {
            return new Response(
              JSON.stringify({ 
                error: "Erro de permissão na API do Asaas", 
                details: "Sua chave de API não tem permissão para criar pagamentos."
              }),
              {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          
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
        
        try {
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
            
            // Check for permission errors
            if (errorText.includes("permissões necessárias") || errorText.includes("permissions") || getPaymentResponse.status === 403) {
              return new Response(
                JSON.stringify({ 
                  error: "Erro de permissão na API do Asaas", 
                  details: "Sua chave de API não tem permissão para acessar detalhes de pagamento."
                }),
                {
                  status: 403,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
              );
            }
            
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
        } catch (paymentDetailsError) {
          console.error("Error getting payment details:", paymentDetailsError);
          return new Response(
            JSON.stringify({ error: "Failed to get payment details", details: paymentDetailsError.message }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } catch (paymentCreationError) {
        console.error("Payment creation error:", paymentCreationError);
        return new Response(
          JSON.stringify({ error: "Failed to create payment", details: paymentCreationError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } catch (customerProcessingError) {
      console.error("Customer processing error:", customerProcessingError);
      return new Response(
        JSON.stringify({ error: "Failed to process customer data", details: customerProcessingError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in processAsaasPayment:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process Asaas payment", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
