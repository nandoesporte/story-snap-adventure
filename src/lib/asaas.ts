
import { supabase } from '@/integrations/supabase/client';

// Create an Asaas checkout session
export const createAsaasCheckout = async (userId: string, planId: string, returnUrl: string) => {
  try {
    console.log('Creating Asaas checkout session with:', { userId, planId, returnUrl });
    
    const { data, error } = await supabase.functions.invoke('create-asaas-checkout', {
      body: { user_id: userId, plan_id: planId, return_url: returnUrl }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }
    
    console.log('Asaas checkout response:', data);
    
    if (!data || !data.url) {
      console.error('Invalid response from payment server:', data);
      throw new Error('Resposta inválida do servidor de pagamento');
    }

    return data.url;
  } catch (error) {
    console.error('Error creating Asaas checkout:', error);
    throw new Error('Não foi possível criar a sessão de pagamento');
  }
};
