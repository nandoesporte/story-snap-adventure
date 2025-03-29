
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, PlusCircle, Edit, Tag, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState as useHookState } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Json } from "@/types";

interface PlanFormData {
  name?: string;
  description?: string;
  is_active?: boolean;
  currency?: string;
  interval?: "month" | "year";
  price?: number;
  stories_limit?: number;
  stripe_price_id?: string;
  stripe_product_id?: string;
  features: string[];
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  currency: string;
  interval: string;
  price: number;
  stories_limit: number;
  stripe_price_id: string | null;
  stripe_product_id?: string | null;
  created_at: string;
  updated_at: string;
  features: string[] | null;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
  display_name?: string;
  plan_name?: string;
}

export const SubscriptionManager = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    description: "",
    is_active: true,
    currency: "BRL",
    interval: "month",
    price: 0,
    stories_limit: 10,
    stripe_price_id: "",
    stripe_product_id: "",
    features: []
  });
  const [featureInput, setFeatureInput] = useState<string>("");
  
  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      // Format features if they are stored as JSON
      const formattedPlans = data.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      }));
      
      setPlans(formattedPlans);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      toast.error("Erro ao buscar planos: " + error.message);
    }
  };
  
  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          user_profiles:user_id(display_name),
          subscription_plans:plan_id(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Format subscription data with user and plan info
      const formattedSubscriptions = data.map((sub: any) => ({
        ...sub,
        display_name: sub.user_profiles?.display_name || "Usuário desconhecido",
        plan_name: sub.subscription_plans?.name || "Plano desconhecido"
      }));
      
      setSubscriptions(formattedSubscriptions);
    } catch (error: any) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Erro ao buscar assinaturas: " + error.message);
    }
  };
  
  const loadData = async () => {
    setLoading(true);
    await fetchPlans();
    await fetchSubscriptions();
    setLoading(false);
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value) || 0
    });
  };
  
  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      is_active: checked
    });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    
    setFormData({
      ...formData,
      features: [...formData.features, featureInput.trim()]
    });
    setFeatureInput("");
  };
  
  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(index, 1);
    
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  };
  
  const handleCreateOrEditPlan = async () => {
    try {
      if (!formData.name) {
        toast.error("O nome do plano é obrigatório");
        return;
      }
      
      if (formData.price === undefined || formData.price < 0) {
        toast.error("Digite um preço válido");
        return;
      }
      
      if (formData.stories_limit === undefined || formData.stories_limit < 0) {
        toast.error("Digite um limite de histórias válido");
        return;
      }
      
      if (!formData.interval) {
        toast.error("Selecione um intervalo");
        return;
      }
      
      const planData = {
        name: formData.name,
        description: formData.description || null,
        is_active: formData.is_active || false,
        currency: formData.currency || "BRL",
        interval: formData.interval,
        price: formData.price || 0,
        stories_limit: formData.stories_limit || 0,
        stripe_price_id: formData.stripe_price_id || null,
        features: formData.features || []
      };
      
      let result;
      
      if (currentPlan) {
        // Update existing plan
        const { data, error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', currentPlan.id)
          .select();
        
        if (error) throw error;
        result = data;
        toast.success("Plano atualizado com sucesso");
      } else {
        // Create new plan
        const { data, error } = await supabase
          .from('subscription_plans')
          .insert([planData])
          .select();
        
        if (error) throw error;
        result = data;
        toast.success("Plano criado com sucesso");
      }
      
      setIsDialogOpen(false);
      await fetchPlans();
      
      // Reset form
      setCurrentPlan(null);
      setFormData({
        name: "",
        description: "",
        is_active: true,
        currency: "BRL",
        interval: "month",
        price: 0,
        stories_limit: 10,
        stripe_price_id: "",
        stripe_product_id: "",
        features: []
      });
    } catch (error: any) {
      console.error("Error saving plan:", error);
      toast.error("Erro ao salvar plano: " + error.message);
    }
  };
  
  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);
      
      if (error) throw error;
      
      toast.success("Plano removido com sucesso");
      await fetchPlans();
    } catch (error: any) {
      console.error("Error deleting plan:", error);
      toast.error("Erro ao excluir plano: " + error.message);
    }
  };
  
  const handleEditPlan = (plan: Plan) => {
    setCurrentPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      is_active: plan.is_active,
      currency: plan.currency,
      interval: plan.interval as "month" | "year",
      price: plan.price,
      stories_limit: plan.stories_limit,
      stripe_price_id: plan.stripe_price_id || "",
      stripe_product_id: plan.stripe_product_id || "",
      features: Array.isArray(plan.features) ? plan.features : []
    });
    setIsDialogOpen(true);
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "canceled": return "bg-red-500";
      case "incomplete": return "bg-yellow-500";
      case "past_due": return "bg-orange-500";
      default: return "bg-slate-500";
    }
  };
  
  return (
    <div>
      <Tabs defaultValue="plans">
        <TabsList className="mb-4">
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans">
          <div className="mb-4 flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setCurrentPlan(null);
                  setFormData({
                    name: "",
                    description: "",
                    is_active: true,
                    currency: "BRL",
                    interval: "month",
                    price: 0,
                    stories_limit: 10,
                    stripe_price_id: "",
                    stripe_product_id: "",
                    features: []
                  });
                }}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Plano
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {currentPlan ? `Editar Plano: ${currentPlan.name}` : "Criar Novo Plano"}
                  </DialogTitle>
                  <DialogDescription>
                    {currentPlan 
                      ? "Atualize as informações do plano existente." 
                      : "Adicione um novo plano de assinatura."}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Plano *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Ex: Básico, Premium, etc."
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="is_active">Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={handleSwitchChange}
                        />
                        <Label htmlFor="is_active">
                          {formData.is_active ? "Ativo" : "Inativo"}
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Descrição detalhada do plano"
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço (R$) *</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={handleNumberInputChange}
                        placeholder="Ex: 29.90"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="interval">Frequência *</Label>
                      <Select
                        value={formData.interval}
                        onValueChange={(value) => handleSelectChange("interval", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Mensal</SelectItem>
                          <SelectItem value="year">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currency">Moeda</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => handleSelectChange("currency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BRL">Real (BRL)</SelectItem>
                          <SelectItem value="USD">Dólar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stories_limit">Limite de Histórias *</Label>
                      <Input
                        id="stories_limit"
                        name="stories_limit"
                        type="number"
                        step="1"
                        value={formData.stories_limit}
                        onChange={handleNumberInputChange}
                        placeholder="Ex: 10, 50, 100, etc."
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stripe_price_id">ID do Preço no Stripe</Label>
                      <Input
                        id="stripe_price_id"
                        name="stripe_price_id"
                        value={formData.stripe_price_id}
                        onChange={handleInputChange}
                        placeholder="Ex: price_1234567890"
                      />
                    </div>
                  </div>
                  
                  <Accordion type="single" collapsible className="mt-2">
                    <AccordionItem value="features">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          <span>Recursos Incluídos</span>
                          <Badge variant="outline" className="ml-2">
                            {formData.features.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              value={featureInput}
                              onChange={(e) => setFeatureInput(e.target.value)}
                              placeholder="Ex: Histórias ilimitadas"
                            />
                            <Button type="button" onClick={handleAddFeature}>
                              Adicionar
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {formData.features.map((feature, index) => (
                              <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                                <span>{feature}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveFeature(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" onClick={handleCreateOrEditPlan}>
                    {currentPlan ? "Salvar Alterações" : "Criar Plano"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : plans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-center text-gray-500 mb-4">
                  Nenhum plano cadastrado ainda.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar Primeiro Plano
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className={`${!plan.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {plan.name}
                          {!plan.is_active && (
                            <Badge variant="outline" className="ml-2 text-red-500 border-red-300">
                              Inativo
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{plan.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: plan.currency }).format(plan.price)}
                        <span className="text-sm font-normal">
                          /{plan.interval === 'month' ? 'mês' : 'ano'}
                        </span>
                      </div>
                      <Badge className="mt-1">
                        {plan.stories_limit} histórias {plan.interval === 'month' ? 'por mês' : 'por ano'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {Array.isArray(plan.features) && plan.features.length > 0 ? (
                        plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">Nenhum recurso especificado</p>
                      )}
                    </div>
                    
                    {plan.stripe_price_id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                          Stripe Price ID: {plan.stripe_price_id}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma assinatura encontrada.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Termina em</TableHead>
                        <TableHead>Auto-renovação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>{sub.display_name}</TableCell>
                          <TableCell>{sub.plan_name}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(sub.status)}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(sub.current_period_start)}</TableCell>
                          <TableCell>{formatDate(sub.current_period_end)}</TableCell>
                          <TableCell>
                            <Badge variant={sub.cancel_at_period_end ? "destructive" : "default"}>
                              {sub.cancel_at_period_end ? "Não" : "Sim"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionManager;
