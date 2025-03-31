
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Create an empty placeholder component since PaymentMethodManager doesn't exist yet
const PaymentMethodsManagerContent = () => {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <p>Configuração de métodos de pagamento será implementada em breve.</p>
    </div>
  );
};

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
        <PaymentMethodsManagerContent />
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsManager;
