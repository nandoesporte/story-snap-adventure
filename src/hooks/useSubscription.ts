
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type SubscriptionData = {
  id: string;
  status: string;
  plan_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  subscription_plans?: {
    name: string;
    stories_limit: number;
    price: number;
    currency: string;
    interval: string;
  };
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [storiesCreated, setStoriesCreated] = useState<number>(0);
  const [storiesLimit, setStoriesLimit] = useState<number>(0);
  const [planName, setPlanName] = useState<string>('Gratuito');

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setHasActiveSubscription(false);
        setIsLoading(false);
        setAvailableCredits(0);
        setStoriesLimit(0);
        setPlanName('Gratuito');
        return;
      }

      try {
        setIsLoading(true);
        
        // Get user subscription data with plan details
        const { data: subscription, error: subError } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            subscription_plans(*)
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();
        
        if (subError && subError.code !== 'PGRST116') {
          console.error('Error fetching subscription:', subError);
          toast.error('Erro ao verificar assinatura');
        }
        
        // User has an active subscription if the subscription data exists
        const isActive = !!subscription;
        
        setHasActiveSubscription(isActive);
        setSubscriptionData(subscription);

        // Set subscription plan name
        if (isActive && subscription.subscription_plans) {
          setPlanName(subscription.subscription_plans.name);
        } else {
          setPlanName('Gratuito');
        }

        // Get the subscription plan details to check stories limit
        if (isActive && subscription) {
          // If subscription_plans is nested in the response
          if (subscription.subscription_plans) {
            setStoriesLimit(subscription.subscription_plans.stories_limit || 0);
          } else if (subscription.plan_id) {
            // Fetch plan details separately if not included in the subscription data
            const { data: planData, error: planError } = await supabase
              .from('subscription_plans')
              .select('*')
              .eq('id', subscription.plan_id)
              .single();
            
            if (planData) {
              setStoriesLimit(planData.stories_limit || 0);
            }
            
            if (planError) {
              console.error('Error fetching plan details:', planError);
            }
          }

          // Get stories created by user in the current billing period
          if (subscription.current_period_start) {
            const periodStart = new Date(subscription.current_period_start);
            
            // Get count from user_profiles instead of querying stories
            const { data: profileData, error: profileCountError } = await supabase
              .from('user_profiles')
              .select('stories_created_count')
              .eq('id', user.id)
              .single();
            
            if (profileCountError) {
              console.error('Error getting stories created count:', profileCountError);
            }
            
            const storiesCount = profileData?.stories_created_count || 0;
            setStoriesCreated(storiesCount);
            
            // Calculate available credits based on plan limit and stories created
            setAvailableCredits(Math.max(0, storiesLimit - storiesCount));
          }
        } else {
          // If no active subscription, check for basic credits from profile
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('story_credits')
            .eq('id', user.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
          }
          
          if (userProfile) {
            setAvailableCredits(userProfile.story_credits || 0);
            setStoriesLimit(userProfile.story_credits || 0);
          } else {
            setAvailableCredits(0);
            setStoriesLimit(0);
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasActiveSubscription(false);
        setAvailableCredits(0);
        setStoriesLimit(0);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  return { 
    hasActiveSubscription, 
    isLoading, 
    subscriptionData,
    availableCredits,
    storiesCreated,
    storiesLimit,
    planName
  };
};
