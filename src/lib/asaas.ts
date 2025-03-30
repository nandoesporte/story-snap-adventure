
import { supabase } from '@/integrations/supabase/client';

// Create an Asaas checkout session
export const createAsaasCheckout = async (userId: string, planId: string, returnUrl: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-asaas-checkout', {
      body: { userId, planId, returnUrl }
    });

    if (error) throw error;
    
    if (!data || !data.checkoutUrl) {
      throw new Error('Resposta inválida do servidor de pagamento');
    }

    return data.checkoutUrl;
  } catch (error) {
    console.error('Error creating Asaas checkout:', error);
    throw new Error('Não foi possível criar a sessão de pagamento');
  }
};
