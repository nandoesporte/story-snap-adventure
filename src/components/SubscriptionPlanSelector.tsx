
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, CreditCard, Sparkle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface SubscriptionPlanSelectorProps {
  selectedPlanId?: string | null;
  onSelectPlan: (planId: string) => void;
}

const SubscriptionPlanSelector = ({ 
  selectedPlanId,
  onSelectPlan 
}: SubscriptionPlanSelectorProps) => {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price");
      
      if (error) {
        console.error("Error fetching subscription plans:", error);
        return [];
      }
      
      return data;
    },
  });

  // Automatically select featured plan if none selected and we have plans
  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) {
      const featuredPlan = plans.find((plan: any) => plan.is_featured);
      if (featuredPlan) {
        // Don't set as selected automatically, just highlight it visually
      }
    }
  }, [plans, selectedPlanId]);

  if (isLoading) {
    return (
      <div className="flex justify-center my-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!plans.length) {
    return (
      <div className="text-center my-8 p-4">
        <p className="text-lg text-gray-500">Nenhum plano disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
      {plans.map((plan: any, index: number) => {
        const isSelected = selectedPlanId === plan.id;
        
        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`rounded-xl overflow-hidden shadow-lg transition-all ${
              isSelected 
                ? "ring-4 ring-violet-500 transform scale-[1.02]" 
                : plan.is_featured 
                  ? "border-2 border-violet-400 transform md:-translate-y-2" 
                  : "border border-gray-200"
            }`}
          >
            <div className={`p-6 ${
              plan.is_featured || isSelected ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white" : "bg-white"
            }`}>
              {(plan.is_featured || isSelected) && (
                <div className="flex items-center justify-center mb-2">
                  <span className={`
                    text-xs font-semibold px-3 py-1 rounded-full flex items-center
                    ${isSelected ? "bg-white text-violet-600" : "bg-violet-200 text-violet-800"}
                  `}>
                    {isSelected ? (
                      <>
                        <Check className="mr-1 h-3 w-3" />
                        SELECIONADO
                      </>
                    ) : (
                      <>
                        <Sparkle className="mr-1 h-3 w-3" />
                        MAIS POPULAR
                      </>
                    )}
                  </span>
                </div>
              )}
              
              <h3 className={`text-xl font-bold ${
                plan.is_featured || isSelected ? "text-white" : "text-purple-800"
              }`}>
                {plan.name}
              </h3>
              
              <div className="mt-4 mb-2">
                <span className={`text-3xl font-bold ${
                  plan.is_featured || isSelected ? "text-white" : "text-purple-700"
                }`}>
                  R${(plan.price || 0).toFixed(2).replace(".", ",")}
                </span>
                <span className={
                  plan.is_featured || isSelected ? "text-indigo-100" : "text-gray-500"
                }>
                  /{plan.interval === "month" ? "mês" : "ano"}
                </span>
              </div>
              
              <p className={
                plan.is_featured || isSelected ? "text-indigo-100 mt-2" : "text-gray-500 mt-2"
              }>
                {plan.description || "Desbloqueie recursos premium"}
              </p>
            </div>
            
            <div className="p-6 bg-white">
              <ul className="space-y-3">
                {(plan.features || []).map((feature: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                onClick={() => onSelectPlan(plan.id)}
                className={`w-full mt-6 py-6 rounded-full transition-all ${
                  isSelected 
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    : plan.is_featured 
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white" 
                      : "bg-white border-2 border-violet-500 text-violet-600 hover:bg-violet-50"
                }`}
              >
                <div className="flex items-center justify-center">
                  {isSelected ? (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      <span>Prosseguir para Pagamento</span>
                    </>
                  ) : (
                    <>
                      <span>Assinar</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </div>
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SubscriptionPlanSelector;
