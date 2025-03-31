
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { checkUserSubscription } from '@/lib/stripe';

export const useSubscription = () => {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setHasActiveSubscription(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const subscription = await checkUserSubscription(user.id);
        
        // User has an active subscription if the subscription data exists and status is active
        const isActive = !!subscription && subscription.status === 'active';
        
        setHasActiveSubscription(isActive);
        setSubscriptionData(subscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasActiveSubscription(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  return { hasActiveSubscription, isLoading, subscriptionData };
};
