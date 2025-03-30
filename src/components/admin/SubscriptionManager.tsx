
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
