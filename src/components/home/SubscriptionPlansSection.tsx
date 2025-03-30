
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Sparkle, Check } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface SubscriptionPlansSectionProps {
  onSelectPlan: (planId: string) => void;
}

const SubscriptionPlansSection = ({ onSelectPlan }: SubscriptionPlansSectionProps) => {
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

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  if (!plans.length) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-purple-800 mb-4">
            Planos de Assinatura
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Escolha o plano ideal para você e desbloqueie histórias ilimitadas para seus filhos.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan: any, index: number) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`rounded-xl overflow-hidden shadow-lg ${
                plan.is_featured ? "border-2 border-violet-500 ring-2 ring-violet-300 transform md:-translate-y-4" : "border border-gray-200"
              }`}
            >
              <div className={`p-6 ${plan.is_featured ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white" : "bg-white"}`}>
                {plan.is_featured && (
                  <div className="flex items-center justify-center mb-2">
                    <span className="bg-white text-violet-600 text-xs font-semibold px-3 py-1 rounded-full flex items-center">
                      <Sparkle className="mr-1 h-3 w-3" />
                      MAIS POPULAR
                    </span>
                  </div>
                )}
                <h3 className={`text-xl font-bold ${plan.is_featured ? "text-white" : "text-purple-800"}`}>
                  {plan.name}
                </h3>
                <div className="mt-4 mb-2">
                  <span className={`text-3xl font-bold ${plan.is_featured ? "text-white" : "text-purple-700"}`}>
                    R${(plan.price || 0).toFixed(2).replace(".", ",")}
                  </span>
                  <span className={plan.is_featured ? "text-indigo-100" : "text-gray-500"}>
                    /{plan.interval === "month" ? "mês" : "ano"}
                  </span>
                </div>
                <p className={plan.is_featured ? "text-indigo-100 mt-2" : "text-gray-500 mt-2"}>
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
                  className={`w-full mt-6 py-2 rounded-full transition-all ${
                    plan.is_featured 
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white" 
                      : "bg-white border-2 border-violet-500 text-violet-600 hover:bg-violet-50"
                  }`}
                >
                  Selecionar
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlansSection;
