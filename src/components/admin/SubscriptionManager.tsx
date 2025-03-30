
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { runStripeColumnsMigration } from '@/lib/runMigration';
import { createStripeProduct, updateStripeProduct } from '@/lib/stripe';

// Form schema for plan validation
const planFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Preço não pode ser negativo'),
  currency: z.string().default('BRL'),
  interval: z.enum(['month', 'year']),
  stories_limit: z.coerce.number().min(1, 'Limite de histórias deve ser pelo menos 1'),
  is_active: z.boolean().default(true),
  features: z.string().optional(),
  create_in_stripe: z.boolean().default(false),
  stripe_product_id: z.string().optional(),
  stripe_price_id: z.string().optional(),
});

const SubscriptionManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [migrationRun, setMigrationRun] = useState(false);
  const queryClient = useQueryClient();

  // Run migration when component mounts
  useEffect(() => {
    const checkAndRunMigration = async () => {
      try {
        const success = await runStripeColumnsMigration();
        setMigrationRun(success);
        if (success) {
          console.log('Migration for Stripe columns completed successfully');
        }
      } catch (error) {
        console.error('Error running migration:', error);
        toast.error('Erro ao verificar colunas do Stripe no banco de dados');
      }
    };

    checkAndRunMigration();
  }, []);

  // Load subscription plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });
        
      if (error) {
        console.error('Error fetching plans:', error);
        throw error;
      }
      
      return data;
    }
  });

  // Open dialog to create/edit a plan
  const openDialog = (plan = null) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  // Close dialog
  const closeDialog = () => {
    setEditingPlan(null);
    setIsDialogOpen(false);
  };

  // Create or update a subscription plan
  const planMutation = useMutation({
    mutationFn: async (values: z.infer<typeof planFormSchema>) => {
      try {
        // Process features into a JSON array
        const featuresArray = values.features 
          ? values.features.split('\n').filter(f => f.trim() !== '')
          : [];
          
        const planData = {
          ...values,
          features: featuresArray,
        };
        
        // If create_in_stripe is true, create product in Stripe first
        if (values.create_in_stripe) {
          try {
            let stripeResponse;
            
            if (editingPlan && editingPlan.stripe_product_id) {
              // Update existing product in Stripe
              stripeResponse = await updateStripeProduct(editingPlan.stripe_product_id, planData);
            } else {
              // Create new product in Stripe
              stripeResponse = await createStripeProduct(planData);
              
              // Update planData with Stripe IDs
              if (stripeResponse.product && stripeResponse.price) {
                planData.stripe_product_id = stripeResponse.product.id;
                planData.stripe_price_id = stripeResponse.price.id;
              }
            }
          } catch (error) {
            console.error('Error creating/updating product in Stripe:', error);
            throw new Error('Falha ao criar/atualizar produto no Stripe');
          }
        }
        
        // Now save to database
        if (editingPlan) {
          // Remove create_in_stripe from data to save
          const { create_in_stripe, ...dataToSave } = planData;
          
          // Update existing plan
          const { data, error } = await supabase
            .from('subscription_plans')
            .update(dataToSave)
            .eq('id', editingPlan.id)
            .select()
            .single();
            
          if (error) {
            console.error('Database error:', error);
            
            // Check if it's a column doesn't exist error
            if (error.code === 'PGRST204' && error.message.includes('column')) {
              const columnMatch = error.message.match(/'([^']+)'/);
              const missingColumn = columnMatch ? columnMatch[1] : 'unknown column';
              throw new Error(`Coluna ${missingColumn} não existe no banco de dados. Atualize o esquema do banco de dados.`);
            }
            
            throw error;
          }
          return data;
        } else {
          // Remove create_in_stripe from data to save
          const { create_in_stripe, ...dataToSave } = planData;
          
          // Create new plan
          const { data, error } = await supabase
            .from('subscription_plans')
            .insert(dataToSave)
            .select()
            .single();
            
          if (error) {
            console.error('Database error:', error);
            
            // Check if it's a column doesn't exist error
            if (error.code === 'PGRST204' && error.message.includes('column')) {
              const columnMatch = error.message.match(/'([^']+)'/);
              const missingColumn = columnMatch ? columnMatch[1] : 'unknown column';
              throw new Error(`Coluna ${missingColumn} não existe no banco de dados. Atualize o esquema do banco de dados.`);
            }
            
            throw error;
          }
          return data;
        }
      } catch (error) {
        console.error('Error in planMutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      closeDialog();
      toast.success(editingPlan ? 'Plano atualizado com sucesso' : 'Plano criado com sucesso');
    },
    onError: (error) => {
      console.error('Error saving plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar plano';
      toast.error(errorMessage);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-medium">Planos de Assinatura</h3>
        <button 
          onClick={() => openDialog()} 
          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
        >
          Adicionar Plano
        </button>
      </div>
      
      {!migrationRun && (
        <div className="p-4 bg-amber-100 rounded-md text-amber-800">
          <p>Verificando estrutura do banco de dados para colunas do Stripe...</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center p-8">
          <p>Carregando planos...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans && plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  className="bg-card rounded-lg shadow p-4 border border-border hover:border-primary transition-colors cursor-pointer"
                  onClick={() => openDialog(plan)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-medium">{plan.name}</h4>
                    <div className={`px-2 py-1 rounded text-xs ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {plan.is_active ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                  <div className="mt-2">
                    <span className="text-xl font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: plan.currency || 'BRL',
                      }).format(plan.price)}
                    </span>
                    <span className="text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Limite:</span> {plan.stories_limit} histórias/{plan.interval === 'month' ? 'mês' : 'ano'}
                  </div>
                  {plan.stripe_product_id && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      ID do Produto Stripe: {plan.stripe_product_id}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-muted rounded-lg">
              <p>Nenhum plano de assinatura encontrado. Crie seu primeiro plano!</p>
            </div>
          )}
        </div>
      )}
      
      {/* Dialog implementation would go here - 
         For brevity, I've omitted the dialog implementation as it depends on your UI components.
         You would need to implement a form with fields for name, description, price, etc.
      */}
    </div>
  );
};

export default SubscriptionManager;
