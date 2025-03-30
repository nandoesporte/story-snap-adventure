
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { runStripeColumnsMigration } from '@/lib/runMigration';
import { createStripeProduct, updateStripeProduct } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Check, X } from 'lucide-react';

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
  
  // Form state
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'BRL',
    interval: 'month',
    stories_limit: 1,
    is_active: true,
    features: '',
    create_in_stripe: false,
    stripe_product_id: '',
    stripe_price_id: '',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    if (plan) {
      // Convert features array back to string for editing
      const featuresString = Array.isArray(plan.features) 
        ? plan.features.join('\n') 
        : '';
        
      setFormValues({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price || 0,
        currency: plan.currency || 'BRL',
        interval: plan.interval || 'month',
        stories_limit: plan.stories_limit || 1,
        is_active: plan.is_active !== undefined ? plan.is_active : true,
        features: featuresString,
        create_in_stripe: false, // Default to false when editing
        stripe_product_id: plan.stripe_product_id || '',
        stripe_price_id: plan.stripe_price_id || '',
      });
    } else {
      // Reset form for new plan
      setFormValues({
        name: '',
        description: '',
        price: 0,
        currency: 'BRL',
        interval: 'month',
        stories_limit: 1,
        is_active: true,
        features: '',
        create_in_stripe: false,
        stripe_product_id: '',
        stripe_price_id: '',
      });
    }
    
    setFormErrors({});
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  // Close dialog
  const closeDialog = () => {
    setEditingPlan(null);
    setIsDialogOpen(false);
    setFormErrors({});
  };
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle different input types
    if (type === 'number') {
      setFormValues(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle checkbox/switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormValues(prev => ({ ...prev, [name]: checked }));
  };
  
  // Handle interval change
  const handleIntervalChange = (value: string) => {
    if (value === 'month' || value === 'year') {
      setFormValues(prev => ({ ...prev, interval: value }));
    }
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
  
  // Validate and submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form values
      const validatedData = planFormSchema.parse(formValues);
      planMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Convert Zod errors to a record of field errors
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setFormErrors(fieldErrors);
        
        // Show toast with first error
        const firstError = error.errors[0];
        toast.error(`Erro de validação: ${firstError.message}`);
      } else {
        toast.error('Erro ao validar o formulário');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-medium">Planos de Assinatura</h3>
        <Button 
          onClick={() => openDialog()} 
          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
        >
          Adicionar Plano
        </Button>
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
      
      {/* Plan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plano' : 'Adicionar Plano'}</DialogTitle>
            <DialogDescription>
              Configure os detalhes do plano de assinatura.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano<span className="text-red-500">*</span></Label>
                <Input 
                  id="name"
                  name="name"
                  value={formValues.name}
                  onChange={handleChange}
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description"
                  name="description"
                  value={formValues.description || ''}
                  onChange={handleChange}
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço<span className="text-red-500">*</span></Label>
                  <Input 
                    id="price"
                    name="price"
                    type="number"
                    value={formValues.price}
                    onChange={handleChange}
                    className={formErrors.price ? 'border-red-500' : ''}
                    min={0}
                    step="0.01"
                  />
                  {formErrors.price && <p className="text-xs text-red-500">{formErrors.price}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Input 
                    id="currency"
                    name="currency"
                    value={formValues.currency}
                    onChange={handleChange}
                    placeholder="BRL"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interval">Intervalo<span className="text-red-500">*</span></Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={formValues.interval === 'month' ? 'default' : 'outline'}
                    onClick={() => handleIntervalChange('month')}
                  >
                    Mensal
                    {formValues.interval === 'month' && <Check className="ml-2 h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant={formValues.interval === 'year' ? 'default' : 'outline'}
                    onClick={() => handleIntervalChange('year')}
                  >
                    Anual
                    {formValues.interval === 'year' && <Check className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stories_limit">Limite de Histórias<span className="text-red-500">*</span></Label>
                <Input 
                  id="stories_limit"
                  name="stories_limit"
                  type="number"
                  value={formValues.stories_limit}
                  onChange={handleChange}
                  className={formErrors.stories_limit ? 'border-red-500' : ''}
                  min={1}
                />
                {formErrors.stories_limit && <p className="text-xs text-red-500">{formErrors.stories_limit}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="features">Recursos (um por linha)</Label>
                <Textarea 
                  id="features"
                  name="features"
                  value={formValues.features || ''}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Ex: Histórias ilimitadas&#10;Suporte prioritário&#10;Acesso a todos os temas"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Plano Ativo</Label>
                  <Switch 
                    id="is_active"
                    checked={formValues.is_active}
                    onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Planos inativos não serão exibidos para os usuários.
                </p>
              </div>
              
              {!editingPlan || !editingPlan.stripe_product_id ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="create_in_stripe">Criar no Stripe</Label>
                    <Switch 
                      id="create_in_stripe"
                      checked={formValues.create_in_stripe}
                      onCheckedChange={(checked) => handleSwitchChange('create_in_stripe', checked)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Habilite para criar automaticamente o produto e preço no Stripe.
                  </p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground border rounded p-3 bg-muted/50">
                  <p>Este plano já está vinculado ao Stripe.</p>
                  <p className="mt-1">ID do Produto: {editingPlan.stripe_product_id}</p>
                  {editingPlan.stripe_price_id && <p>ID do Preço: {editingPlan.stripe_price_id}</p>}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={planMutation.isPending}>
                {planMutation.isPending ? 'Salvando...' : editingPlan ? 'Atualizar Plano' : 'Criar Plano'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManager;
