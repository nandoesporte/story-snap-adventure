
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { checkUserSubscription } from '@/lib/stripe';

export const useSubscription = () => {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [storiesCreated, setStoriesCreated] = useState<number>(0);
  const [storiesLimit, setStoriesLimit] = useState<number>(0);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setHasActiveSubscription(false);
        setIsLoading(false);
        setAvailableCredits(0);
        setStoriesLimit(0);
        return;
      }

      try {
        setIsLoading(true);
        // Get user subscription data
        const subscription = await checkUserSubscription(user.id);
        
        // User has an active subscription if the subscription data exists and status is active
        const isActive = !!subscription && subscription.status === 'active';
        
        setHasActiveSubscription(isActive);
        setSubscriptionData(subscription);

        // Get the subscription plan details to check stories limit
        if (isActive && subscription.plan_id) {
          // If subscription_plans is nested in the response
          if (subscription.subscription_plans) {
            setStoriesLimit(subscription.subscription_plans.stories_limit || 0);
          } else {
            // Fetch plan details separately if not included in the subscription data
            const { data: planData, error: planError } = await supabase
              .from('subscription_plans')
              .select('*')
              .eq('id', subscription.plan_id)
              .single();
            
            if (planData) {
              setStoriesLimit(planData.stories_limit || 0);
            }
          }

          // Get stories created by user in the current billing period
          const periodStart = new Date(subscription.current_period_start);
          
          const { count: createdCount, error: countError } = await supabase
            .from('stories')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', periodStart.toISOString());
          
          const storiesCount = createdCount || 0;
          setStoriesCreated(storiesCount);
          
          // Calculate available credits based on plan limit and stories created
          setAvailableCredits(Math.max(0, storiesLimit - storiesCount));
        } else {
          // If no active subscription, check for basic credits from profile
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('story_credits')
            .eq('id', user.id)
            .single();
            
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
    storiesLimit
  };
};
