
import { supabase } from './supabase';

// Function to create an Asaas checkout
export const createAsaasCheckout = async (userId: string, planId: string, returnUrl: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-asaas-checkout', {
      body: {
        user_id: userId,
        plan_id: planId,
        return_url: returnUrl,
      },
    });

    if (error) {
      console.error('Error invoking create-asaas-checkout function:', error);
      throw new Error('Não foi possível criar o checkout do Asaas: ' + error.message);
    }

    if (!data || !data.url) {
      throw new Error('Resposta inválida do servidor de pagamento do Asaas');
    }

    return data.url;
  } catch (error) {
    console.error('Error creating Asaas checkout:', error);
    throw error;
  }
};

// Function to verify the Asaas API configuration
export const verifyAsaasApiKey = async (): Promise<boolean> => {
  try {
    const { data: apiKeyConfig, error: apiKeyError } = await supabase
      .from('system_configurations')
      .select('value')
      .eq('key', 'asaas_api_key')
      .single();

    if (apiKeyError || !apiKeyConfig?.value) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying Asaas API key:', error);
    return false;
  }
};
