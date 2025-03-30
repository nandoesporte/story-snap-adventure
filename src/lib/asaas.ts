
import { toast } from 'sonner';

// Function is kept but will display a deprecation message
export const createAsaasCheckout = async (userId: string, planId: string, returnUrl: string) => {
  toast.error('O método de pagamento Asaas foi desativado no sistema.');
  throw new Error('O método de pagamento Asaas foi desativado no sistema.');
};
