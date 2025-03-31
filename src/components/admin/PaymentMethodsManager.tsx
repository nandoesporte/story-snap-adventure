
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentMethodsManager as OriginalPaymentMethodsManager } from "@/components/admin/PaymentMethodManager";

const PaymentMethodsManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de Pagamento</CardTitle>
        <CardDescription>
          Gerencie os métodos de pagamento disponíveis para os usuários
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OriginalPaymentMethodsManager />
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsManager;
