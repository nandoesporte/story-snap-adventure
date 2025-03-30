
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Create an Asaas checkout session
export const createAsaasCheckout = async (userId: string, planId: string, returnUrl: string) => {
  try {
    console.log('Creating Asaas checkout session with:', { userId, planId, returnUrl });
    
    const { data, error } = await supabase.functions.invoke('create-asaas-checkout', {
      body: { user_id: userId, plan_id: planId, return_url: returnUrl }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Erro na função Supabase: ${error.message}`);
    }
    
    console.log('Asaas checkout response:', data);
    
    if (!data || !data.url) {
      console.error('Invalid response from payment server:', data);
      if (data && data.error) {
        toast.error(`Erro de pagamento: ${data.error}`);
        throw new Error(`Erro de pagamento: ${data.error}`);
      }
      throw new Error('Resposta inválida do servidor de pagamento. Por favor, tente novamente mais tarde.');
    }

    return data.url;
  } catch (error: any) {
    console.error('Error creating Asaas checkout:', error);
    toast.error(error.message || 'Não foi possível criar a sessão de pagamento');
    throw new Error(error.message || 'Não foi possível criar a sessão de pagamento. Por favor, tente novamente mais tarde.');
  }
};
