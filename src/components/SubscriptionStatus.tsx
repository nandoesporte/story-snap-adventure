
import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface SubscriptionStatusProps {
  className?: string;
}

export const SubscriptionStatus = ({ className }: SubscriptionStatusProps) => {
  const { 
    hasActiveSubscription, 
    isLoading, 
    availableCredits,
    storiesCreated,
    storiesLimit,
    subscriptionData,
    planName
  } = useSubscription();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Verificando assinatura...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        {hasActiveSubscription ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                <h3 className="font-medium">
                  Plano {planName}
                </h3>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Ativo
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Histórias disponíveis</span>
                  <span className="text-sm font-medium">{availableCredits} de {storiesLimit}</span>
                </div>
                <Progress 
                  value={(storiesCreated / (storiesLimit || 1)) * 100} 
                  max={100}
                  className="h-2"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                Seu plano inclui a criação de até {storiesLimit} histórias {subscriptionData?.subscription_plans?.interval === 'month' ? 'mensais' : 'anuais'}.
              </p>
              
              {subscriptionData?.cancel_at_period_end && (
                <div className="mt-2 bg-amber-50 p-2 rounded-md border border-amber-200">
                  <p className="text-xs text-amber-700">
                    Sua assinatura será cancelada ao final do período atual.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="font-medium">Plano Gratuito</h3>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Créditos disponíveis</span>
                  <span className="text-sm font-medium">{availableCredits}</span>
                </div>
                <Progress 
                  value={availableCredits === 0 ? 100 : Math.max(0, 100 - ((availableCredits / 5) * 100))}
                  max={100}
                  className="h-2"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                Você possui {availableCredits} créditos gratuitos para criar histórias.
              </p>
              
              <Button asChild variant="outline" className="w-full mt-2 text-sm">
                <Link to="/subscription">
                  Assinar plano premium
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;
